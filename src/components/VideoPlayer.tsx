import {
  useState, useEffect, useRef, useCallback, forwardRef,
  useImperativeHandle, type TouchEvent,
} from "react";
import Hls from "hls.js";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Maximize, Minimize, SkipForward, SkipBack,
  Subtitles, Settings, X, Check, Monitor,
  FastForward, Rewind, Smartphone, Loader2,
} from "lucide-react";

/* ── Types ── */
export interface SubtitleTrack {
  language: string;
  label: string;
  url: string;
  isDefault?: boolean;
}

export interface VideoPlayerProps {
  src: string | null;
  poster?: string;
  title?: string;
  subtitles?: SubtitleTrack[];
  watermarkText?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
}

/* ── Helpers ── */
function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const WATERMARK_POSITIONS = [
  "top-4 left-16", "top-4 right-6", "bottom-20 left-16", "bottom-20 right-6",
  "top-1/3 left-1/4", "top-2/3 right-1/4",
];

const haptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style }).catch(() => {});
  }
};

/* ── Component ── */
const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ src, poster, title, subtitles = [], watermarkText, autoPlay = false, onTimeUpdate, onEnded, className = "" }, ref) => {
    const isNative = Capacitor.isNativePlatform();

    /* Refs */
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const lastTapRef = useRef<{ x: number; time: number } | null>(null);
    const skipTimerRef = useRef<NodeJS.Timeout | null>(null);

    /* State */
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(80);
    const [muted, setMuted] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [hasError, setHasError] = useState(false);

    /* Aspect ratio detection */
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const isPortrait = aspectRatio !== null && aspectRatio < 1;
    const isSquare = aspectRatio !== null && Math.abs(aspectRatio - 1) < 0.1;

    /* Subtitle state */
    const [activeSubtitle, setActiveSubtitle] = useState<string>("Off");
    const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

    /* Settings */
    const [quality, setQuality] = useState("Auto");
    const [hlsLevels, setHlsLevels] = useState<{ height: number; index: number }[]>([]);
    const [speed, setSpeed] = useState(1);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    /* Mobile gestures */
    const [skipIndicator, setSkipIndicator] = useState<null | "forward" | "back">(null);

    /* Watermark */
    const [watermarkPos, setWatermarkPos] = useState(0);

    /* ── Imperative handle ── */
    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seek: (t: number) => { if (videoRef.current) videoRef.current.currentTime = t; },
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    }));

    /* ── HLS / Source setup ── */
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      // Reset error state on new source
      console.log("[VideoPlayer] Loading source:", src?.slice(0, 80));
      setHasError(false);
      setIsBuffering(true);

      // Cleanup previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const isHLS = src.endsWith(".m3u8") || src.includes(".m3u8");

      if (isHLS && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1, // auto
          capLevelToPlayerSize: true,
        });
        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          const levels = data.levels.map((l, i) => ({ height: l.height, index: i }));
          setHlsLevels(levels);
          if (autoPlay) video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error("[VideoPlayer] HLS fatal error", data);
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              setHasError(true);
            }
          }
        });

        return () => { hls.destroy(); hlsRef.current = null; };
      } else if (isHLS && video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (Safari / iOS)
        video.src = src;
        if (autoPlay) video.play().catch(() => {});
      } else {
        // Regular MP4
        video.src = src;
        if (autoPlay) video.play().catch(() => {});
      }

      return () => {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      };
    }, [src, autoPlay]);

    /* ── Video events ── */
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const onPlay = () => setPlaying(true);
      const onPause = () => setPlaying(false);
      const onTimeupdate = () => {
        setCurrentTime(video.currentTime);
        onTimeUpdate?.(video.currentTime, video.duration);
      };
      const onDurationChange = () => setDuration(video.duration || 0);
      const onProgress = () => {
        if (video.buffered.length > 0) {
          const end = video.buffered.end(video.buffered.length - 1);
          setBuffered(video.duration ? (end / video.duration) * 100 : 0);
        }
      };
      const onWaiting = () => { console.log("[VideoPlayer] Buffering…"); setIsBuffering(true); };
      const onCanPlay = () => { console.log("[VideoPlayer] canplay"); setIsBuffering(false); };
      const onPlaying = () => { console.log("[VideoPlayer] playing"); setIsBuffering(false); setHasError(false); };
      const onError = () => {
        const v = videoRef.current;
        const mediaErr = v?.error;
        console.error("[VideoPlayer] error event", {
          code: mediaErr?.code,
          message: mediaErr?.message,
          networkState: v?.networkState,
          readyState: v?.readyState,
          src: v?.currentSrc?.slice(0, 80),
        });
        // Only treat as fatal if there's an actual MediaError and it's not a transient decode hiccup
        if (mediaErr && (mediaErr.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || mediaErr.code === MediaError.MEDIA_ERR_NETWORK)) {
          setHasError(true);
          setIsBuffering(false);
        }
        // MEDIA_ERR_DECODE (3) can be transient — don't show error overlay, just log
      };
      const onEndedHandler = () => { setPlaying(false); onEnded?.(); };

      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("timeupdate", onTimeupdate);
      video.addEventListener("durationchange", onDurationChange);
      video.addEventListener("progress", onProgress);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("error", onError);
      video.addEventListener("ended", onEndedHandler);

      return () => {
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("timeupdate", onTimeupdate);
        video.removeEventListener("durationchange", onDurationChange);
        video.removeEventListener("progress", onProgress);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("error", onError);
        video.removeEventListener("ended", onEndedHandler);
      };
    }, [onTimeUpdate, onEnded]);

    /* ── Volume sync ── */
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.volume = muted ? 0 : volume / 100;
        videoRef.current.muted = muted;
      }
    }, [volume, muted]);

    /* ── Playback speed sync ── */
    useEffect(() => {
      if (videoRef.current) videoRef.current.playbackRate = speed;
    }, [speed]);

    /* ── Auto-hide controls ── */
    const resetControlsTimer = useCallback(() => {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => {
        if (playing) setShowControls(false);
      }, 3000);
    }, [playing]);

    useEffect(() => { resetControlsTimer(); }, [playing]);

    /* ── Watermark rotation ── */
    useEffect(() => {
      const t = setInterval(() => setWatermarkPos(p => (p + 1) % WATERMARK_POSITIONS.length), 30000);
      return () => clearInterval(t);
    }, []);

    /* ── Keyboard shortcuts ── */
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement) return;
        const video = videoRef.current;
        if (!video) return;
        switch (e.key) {
          case " ": case "k":
            e.preventDefault();
            playing ? video.pause() : video.play().catch(() => {});
            break;
          case "ArrowLeft":
            video.currentTime = Math.max(0, video.currentTime - 10);
            break;
          case "ArrowRight":
            video.currentTime = Math.min(duration, video.currentTime + 10);
            break;
          case "ArrowUp":
            setVolume(v => Math.min(100, v + 10));
            break;
          case "ArrowDown":
            setVolume(v => Math.max(0, v - 10));
            break;
          case "m":
            setMuted(m => !m);
            break;
          case "f":
            toggleFullscreen();
            break;
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [duration, playing]);

    /* ── Fullscreen ── */
    const toggleFullscreen = useCallback(() => {
      const el = containerRef.current;
      if (!el) return;
      if (!document.fullscreenElement) {
        el.requestFullscreen?.().catch(() => {});
        setFullscreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setFullscreen(false);
      }
    }, []);

    useEffect(() => {
      const onFSChange = () => setFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", onFSChange);
      return () => document.removeEventListener("fullscreenchange", onFSChange);
    }, []);

    /* ── Actions ── */
    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;
      playing ? video.pause() : video.play().catch(() => {});
    };

    const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      if (videoRef.current) videoRef.current.currentTime = pct * duration;
    };

    const skip = (seconds: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      }
    };

    /* ── HLS quality switching ── */
    const setHlsQuality = (levelIndex: number) => {
      if (hlsRef.current) {
        hlsRef.current.currentLevel = levelIndex; // -1 = auto
      }
    };

    const qualityOptions = [
      { label: "Auto", index: -1 },
      ...hlsLevels
        .sort((a, b) => b.height - a.height)
        .map(l => ({ label: `${l.height}p`, index: l.index })),
    ];

    /* ── Subtitle toggle ── */
    const handleSubtitleChange = (lang: string) => {
      setActiveSubtitle(lang);
      setShowSubtitleMenu(false);
      const video = videoRef.current;
      if (!video) return;
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = video.textTracks[i].language === lang ? "showing" : "hidden";
      }
      if (lang === "Off") {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = "hidden";
        }
      }
    };

    /* ── Touch gestures ── */
    const showSkipFlash = (dir: "forward" | "back") => {
      setSkipIndicator(dir);
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      skipTimerRef.current = setTimeout(() => setSkipIndicator(null), 700);
    };

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    };

    const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
      if (!touchStartRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;
      const playerWidth = containerRef.current?.offsetWidth ?? 400;

      const now = Date.now();
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 250) {
        if (lastTapRef.current && now - lastTapRef.current.time < 350) {
          const isRightSide = lastTapRef.current.x > playerWidth / 2;
          if (isRightSide) {
            skip(10);
            showSkipFlash("forward");
            haptic(ImpactStyle.Medium);
          } else {
            skip(-10);
            showSkipFlash("back");
            haptic(ImpactStyle.Medium);
          }
          lastTapRef.current = null;
          resetControlsTimer();
          return;
        }
        lastTapRef.current = { x: t.clientX, time: now };
        closeAllMenus();
        togglePlay();
        haptic(ImpactStyle.Light);
        resetControlsTimer();
        return;
      }

      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 400) {
        const seekSec = Math.round((dx / playerWidth) * 60);
        skip(seekSec);
        showSkipFlash(dx > 0 ? "forward" : "back");
        haptic(ImpactStyle.Light);
        resetControlsTimer();
      }

      touchStartRef.current = null;
    };

    const closeAllMenus = () => {
      setShowSettingsMenu(false);
      setShowSubtitleMenu(false);
    };

    /* ── Derived ── */
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
    const currentVolume = muted ? 0 : volume;
    const subtitleList = [{ language: "Off", label: "Off", url: "", isDefault: false }, ...subtitles.map(s => ({ ...s, isDefault: s.isDefault ?? false }))];

    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden cursor-pointer select-none video-player ${className}`}
        style={{
          background: "hsl(var(--background))",
          ...(aspectRatio && !fullscreen ? { aspectRatio: String(Math.max(aspectRatio, 9/16)) } : {}),
          ...(fullscreen ? { width: '100%', height: '100%' } : {}),
        }}
        onMouseMove={resetControlsTimer}
        onMouseLeave={() => { if (playing) setShowControls(false); }}
        onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'VIDEO') { if (!isNative) { closeAllMenus(); togglePlay(); resetControlsTimer(); } } }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Blurred background for portrait/square videos (cinematic fill) ── */}
        {isPortrait && poster && (
          <img
            src={poster}
            className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40 pointer-events-none"
            aria-hidden="true"
            alt=""
          />
        )}

        {/* ── Actual video element ── */}
        <video
          ref={videoRef}
          className={`relative z-10 ${isPortrait ? 'h-full mx-auto' : 'w-full h-full'}`}
          style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
          poster={poster}
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          controlsList="nodownload"
          onContextMenu={e => e.preventDefault()}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth && v.videoHeight) {
              setAspectRatio(v.videoWidth / v.videoHeight);
            }
          }}
        >
          {/* Subtitle tracks */}
          {subtitles.map(sub => (
            <track
              key={sub.language}
              kind="subtitles"
              src={sub.url}
              srcLang={sub.language}
              label={sub.label}
              default={sub.isDefault}
            />
          ))}
        </video>

        {/* ── Buffering spinner ── */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
          </div>
        )}

        {/* ── Error state ── */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-background/90"
               onClick={(e) => e.stopPropagation()}>
            <p className="text-destructive text-sm font-semibold mb-2">Video failed to load</p>
            <p className="text-muted-foreground text-xs mb-4 max-w-xs text-center">
              {videoRef.current?.error?.message || "Check your connection and try again."}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasError(false);
                setIsBuffering(true);
                if (videoRef.current && src) {
                  videoRef.current.src = src;
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-4 py-2 bg-surface border border-gold/20 text-foreground text-xs rounded-sm hover:bg-surface-raised transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Dynamic Watermark ── */}
        {watermarkText && (
          <div className={`absolute z-20 pointer-events-none transition-all duration-1000 ${WATERMARK_POSITIONS[watermarkPos]}`}>
            <p className="text-[10px] text-foreground/20 font-mono select-none">{watermarkText}</p>
          </div>
        )}

        {/* Cinematic bars */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

        {/* ── Big center play button — z-50 so it's ABOVE the controls overlay ── */}
        {!playing && !isBuffering && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); resetControlsTimer(); }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold/90 backdrop-blur-sm flex items-center justify-center shadow-gold animate-pulse-gold cursor-pointer hover:scale-105 transition-transform pointer-events-auto"
            >
              <Play className="w-7 h-7 md:w-9 md:h-9 fill-background text-background ml-1" />
            </button>
          </div>
        )}

        {/* ── Skip indicators ── */}
        {skipIndicator && (
          <div className={`absolute inset-y-0 ${skipIndicator === "forward" ? "right-0 left-1/2" : "left-0 right-1/2"} flex items-center ${skipIndicator === "forward" ? "justify-end pr-8" : "justify-start pl-8"} pointer-events-none z-40`}>
            <div className="flex flex-col items-center gap-1 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {skipIndicator === "forward"
                  ? <FastForward className="w-7 h-7 text-white fill-white" />
                  : <Rewind className="w-7 h-7 text-white fill-white" />
                }
              </div>
              <span className="text-white text-xs font-bold drop-shadow">
                {skipIndicator === "forward" ? "+10s" : "-10s"}
              </span>
            </div>
          </div>
        )}

        {/* ── Double-tap hint (native) ── */}
        {isNative && !playing && currentTime === 0 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/10">
              <Smartphone className="w-3 h-3 text-white/60" />
              <span className="text-[10px] text-white/60">Double-tap left/right to skip · Swipe to seek</span>
            </div>
          </div>
        )}

        {/* ── Controls Overlay ── */}
        <div
          className={`absolute inset-0 flex flex-col justify-end z-30 transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Fullscreen title */}
          {fullscreen && title && (
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4">
              <span className="text-sm font-medium text-foreground/80">{title}</span>
              {watermarkText && <span className="text-xs text-foreground/50">{watermarkText}</span>}
            </div>
          )}

          <div className="px-4 pb-4 space-y-2">
            {/* ── Progress Bar ── */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/70 font-mono w-12 text-right flex-shrink-0">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 h-1 group cursor-pointer" onClick={seekTo}>
                <div className="absolute inset-0 bg-foreground/20 rounded-full" />
                <div className="absolute inset-y-0 left-0 bg-foreground/30 rounded-full" style={{ width: `${buffered}%` }} />
                <div className="absolute inset-y-0 left-0 gradient-gold rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-gold rounded-full shadow-gold opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%` }} />
                <div className="absolute inset-0 rounded-full group-hover:scale-y-150 transition-transform origin-center" />
              </div>
              <span className="text-xs text-foreground/50 font-mono w-12 flex-shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* ── Control Buttons ── */}
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={() => skip(-10)} className="p-2 text-foreground/80 hover:text-gold transition-colors group relative" title="Back 10s">
                <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-background/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">-10s</span>
              </button>

              <button onClick={togglePlay} className="p-2 text-foreground hover:text-gold transition-colors">
                {playing ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5" />}
              </button>

              <button onClick={() => skip(10)} className="p-2 text-foreground/80 hover:text-gold transition-colors group relative" title="Forward 10s">
                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-background/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">+10s</span>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 group/vol">
                <button onClick={() => setMuted(m => !m)} className="p-2 text-foreground/80 hover:text-gold transition-colors">
                  <VolumeIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 flex items-center">
                  <input
                    type="range" min={0} max={100} value={currentVolume}
                    onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
                    className="w-full h-1 accent-gold cursor-pointer"
                    style={{ accentColor: "hsl(var(--gold))" }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Time display */}
              <span className="text-xs text-foreground/60 font-mono hidden sm:block ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Subtitles */}
              {subtitles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); closeAllMenus(); setShowSubtitleMenu(o => !o); }}
                    className={`p-2 transition-colors ${activeSubtitle !== "Off" ? "text-gold" : "text-foreground/80 hover:text-gold"}`}
                    title="Subtitles"
                  >
                    <Subtitles className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  {showSubtitleMenu && (
                    <div className="absolute bottom-10 right-0 w-52 bg-surface-overlay/95 backdrop-blur-xl border border-gold/20 rounded-sm shadow-elevated overflow-hidden" onClick={e => e.stopPropagation()}>
                      <div className="px-3 py-2 border-b border-gold/10 flex items-center justify-between">
                        <p className="cinzel text-xs font-bold text-gold">Subtitles</p>
                        <button onClick={() => setShowSubtitleMenu(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                      </div>
                      {subtitleList.map(sub => (
                        <button key={sub.language}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gold/10 transition-colors text-left"
                          onClick={() => handleSubtitleChange(sub.language)}
                        >
                          {activeSubtitle === sub.language
                            ? <Check className="w-3 h-3 text-gold flex-shrink-0" />
                            : <div className="w-3 h-3 flex-shrink-0" />
                          }
                          <span className={`text-xs ${activeSubtitle === sub.language ? "text-gold font-medium" : "text-foreground"}`}>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings (Quality + Speed) */}
              <div className="relative">
                <button
                  onClick={e => { e.stopPropagation(); closeAllMenus(); setShowSettingsMenu(o => !o); }}
                  className={`p-2 transition-colors ${showSettingsMenu ? "text-gold" : "text-foreground/80 hover:text-gold"}`}
                  title="Settings"
                >
                  <Settings className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-500 ${showSettingsMenu ? "rotate-90" : ""}`} />
                </button>
                {showSettingsMenu && (
                  <div className="absolute bottom-10 right-0 w-56 bg-surface-overlay/95 backdrop-blur-xl border border-gold/20 rounded-sm shadow-elevated overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Quality */}
                    <div className="px-3 py-2 border-b border-gold/10 flex items-center justify-between">
                      <p className="cinzel text-xs font-bold text-gold flex items-center gap-1.5"><Monitor className="w-3 h-3" /> Quality</p>
                      <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-sm">{quality}</span>
                    </div>
                    {qualityOptions.map(q => (
                      <button key={q.label}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gold/10 transition-colors text-left"
                        onClick={() => { setQuality(q.label); setHlsQuality(q.index); }}
                      >
                        {quality === q.label ? <Check className="w-3 h-3 text-gold flex-shrink-0" /> : <div className="w-3 h-3 flex-shrink-0" />}
                        <span className={`text-xs flex-1 ${quality === q.label ? "text-gold font-medium" : "text-foreground"}`}>{q.label}</span>
                      </button>
                    ))}
                    {/* Speed */}
                    <div className="px-3 py-2 border-t border-gold/10 flex items-center justify-between">
                      <p className="cinzel text-xs font-bold text-gold">Playback Speed</p>
                      <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-sm">{speed}x</span>
                    </div>
                    <div className="px-3 pb-2 flex flex-wrap gap-1">
                      {PLAYBACK_SPEEDS.map(s => (
                        <button key={s}
                          onClick={() => setSpeed(s)}
                          className={`px-2.5 py-1 text-[10px] rounded-sm transition-all ${speed === s ? "bg-gold text-background font-bold" : "bg-surface-raised text-muted-foreground hover:text-foreground border border-gold/10"}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={e => { e.stopPropagation(); toggleFullscreen(); closeAllMenus(); }}
                className="p-2 text-foreground/80 hover:text-gold transition-colors"
                title="Fullscreen (F)"
              >
                {fullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;
