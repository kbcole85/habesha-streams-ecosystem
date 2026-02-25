import { useState, useEffect, useRef, useCallback, TouchEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Maximize, Minimize, SkipForward, SkipBack,
  Subtitles, Settings, ArrowLeft, ChevronRight,
  Star, Clock, Eye, List, X, Check, Monitor,
  ThumbsUp, Share2, Bookmark, MoreHorizontal,
  FastForward, Rewind, Smartphone, RotateCcw,
  Lock, Crown, Zap, AlertTriangle, Loader2
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PPVCheckoutButton from "@/components/PPVCheckoutButton";

/* ──────────────── Paywall Overlay ──────────────── */

const SUBSCRIPTION_PRICE_ID = "price_1T2VdG3FkY3jsYkVxnQVPki5";

const PaywallOverlay = ({ isPastDue, contentTitle }: { isPastDue: boolean; contentTitle: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) { navigate("/auth", { state: { from: location.pathname } }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast({ title: "Checkout failed", description: String(err), variant: "destructive" });
    }
    setLoading(false);
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast({ title: "Billing portal failed", description: String(err), variant: "destructive" });
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background/80 to-background pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-6">
        <div className="w-16 h-16 rounded-full bg-surface border border-gold/30 flex items-center justify-center mb-5 shadow-lg">
          {isPastDue
            ? <AlertTriangle className="w-7 h-7 text-gold" />
            : <Lock className="w-7 h-7 text-gold" />
          }
        </div>

        <h2 className="cinzel text-2xl font-black text-foreground mb-2">
          {isPastDue ? "Payment Required" : "Unlock This Content"}
        </h2>

        {isPastDue ? (
          <p className="text-muted-foreground text-sm mb-2">
            Your last payment failed. Update your billing details to continue watching.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm mb-2">
            <span className="text-foreground font-medium">"{contentTitle}"</span> requires a Habesha Streams subscription.
          </p>
        )}

        {isPastDue ? (
          <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-xs">
            <button
              onClick={handleManageBilling}
              className="w-full py-3 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all"
            >
              Update Payment Method
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Go back home
            </button>
          </div>
        ) : (
          <div className="mt-6 w-full max-w-xs flex flex-col items-center gap-4">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all shadow-gold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              Subscribe — $5/month
            </button>
            <p className="text-[10px] text-muted-foreground">
              Instant access · Cancel anytime
            </p>
            {!user && (
              <button
                onClick={() => navigate("/auth", { state: { from: location.pathname } })}
                className="text-xs text-gold hover:underline"
              >
                Sign in to your account
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────── Content from DB ──────────────── */
interface WatchContent {
  id: string; title: string; subtitle: string; year: number;
  rating: string; genre: string; duration: string; durationSec: number;
  description: string; image: string; badge?: string; isPPV?: boolean;
  episodes?: { ep: number; title: string; duration: string }[];
}

function parseRuntime(runtime: string | null): number {
  if (!runtime) return 5400; // default 1.5h
  const hMatch = runtime.match(/(\d+)\s*h/i);
  const mMatch = runtime.match(/(\d+)\s*m/i);
  return (parseInt(hMatch?.[1] ?? "0") * 3600) + (parseInt(mMatch?.[1] ?? "0") * 60);
}

function dbToWatchContent(v: any): WatchContent {
  return {
    id: v.id,
    title: v.title,
    subtitle: v.short_description || v.genre || "Habesha Streams",
    year: v.release_date ? new Date(v.release_date).getFullYear() : (v.published_at ? new Date(v.published_at).getFullYear() : 2024),
    rating: "-",
    genre: v.genre || "",
    duration: v.runtime || "1h 30m",
    durationSec: parseRuntime(v.runtime),
    description: v.full_description || v.short_description || "",
    image: v.thumbnail_url || "/placeholder.svg",
    badge: v.monetization_type === "ppv" ? "PPV" : undefined,
    isPPV: v.monetization_type === "ppv",
  };
}

/* ──────────────── Helper ──────────────── */
function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2,"0")}`;
}

const QUALITY_OPTIONS = ["Auto","4K Ultra HD","1080p HD","720p","480p","360p"];
const SUBTITLE_LANGS = ["Off","English","አማርኛ (Amharic)","ትግርኛ (Tigrinya)","Afaan Oromoo","Français","العربية"];
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const WATERMARK_POSITIONS = [
  "top-4 left-16","top-4 right-6","bottom-20 left-16","bottom-20 right-6",
  "top-1/3 left-1/4","top-2/3 right-1/4",
];

/* ──────────────── Haptic helper (no-op on web) ──────────────── */
const haptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style }).catch(() => {});
  }
};

/* ──────────────── Main Component ──────────────── */
const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();

  const [content, setContent] = useState<WatchContent>({
    id: "", title: "Loading...", subtitle: "", year: 2024, rating: "-",
    genre: "", duration: "", durationSec: 5400, description: "", image: "/placeholder.svg",
  });
  const [relatedContent, setRelatedContent] = useState<WatchContent[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const totalSec = content.durationSec;

  const { user, isSubscribed, subscriptionEnd, role, loading: authLoading } = useAuth();
  const isAdmin = role === "admin";
  console.log("[Watch] Access check:", { role, isAdmin, isSubscribed, userId: user?.id });
  
  // PPV check is handled separately per-video after content loads
  // Subscription paywall only for non-PPV content
  const isPastDue = !isAdmin && !isSubscribed && user !== null && subscriptionEnd !== null;
  const showSubscriptionPaywall = !authLoading && !isAdmin && !isSubscribed && !content.isPPV;

  /* Fetch video from DB */
  useEffect(() => {
    if (!id) return;
    const fetchVideo = async () => {
      setContentLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setContent(dbToWatchContent(data));
      } else if (error || !data) {
        toast({ title: "Video not found", variant: "destructive" });
        navigate("/browse");
        return;
      }

      // Fetch related content (same genre or just other approved videos)
      const { data: related } = await supabase
        .from("videos")
        .select("*")
        .eq("status", "approved")
        .eq("admin_approved", true)
        .eq("visibility", "public")
        .eq("encoding_status", "ready")
        .neq("id", id)
        .limit(6);

      if (related) {
        setRelatedContent(related.map(dbToWatchContent));
      }
      setContentLoading(false);
    };
    fetchVideo();
  }, [id]);


  const [playing, setPlaying]       = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [volume, setVolume]         = useState(80);
  const [muted, setMuted]           = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered]     = useState(35);

  /* UI panels */
  const [subtitleLang, setSubtitleLang]   = useState("English");
  const [quality, setQuality]             = useState("Auto");
  const [speed, setSpeed]                 = useState(1);
  const [showQualityMenu, setShowQualityMenu]   = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu]       = useState(false);
  const [showEpisodes, setShowEpisodes]         = useState(false);
  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [isSaved, setIsSaved]               = useState(false);

  /* Mobile touch gestures */
  const [skipIndicator, setSkipIndicator] = useState<null | "forward" | "back">(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef    = useRef<{ x: number; time: number } | null>(null);
  const skipTimerRef  = useRef<NodeJS.Timeout | null>(null);

  /* Watermark */
  const [watermarkPos, setWatermarkPos] = useState(0);

  /* Refs */
  const playerRef    = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Simulate playback ── */
  useEffect(() => {
    if (playing) {
      playTimerRef.current = setInterval(() => {
        setCurrentSec(s => {
          if (s >= totalSec) { setPlaying(false); return totalSec; }
          return s + 1 * speed;
        });
        setBuffered(b => Math.min(100, b + 0.02));
      }, 1000);
    }
    return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
  }, [playing, speed, totalSec]);

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
    const t = setInterval(() => {
      setWatermarkPos(p => (p + 1) % WATERMARK_POSITIONS.length);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  /* ── Keyboard shortcuts (desktop) ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch(e.key) {
        case " ": case "k": e.preventDefault(); setPlaying(p => !p); break;
        case "ArrowLeft":   setCurrentSec(s => Math.max(0, s - 10)); break;
        case "ArrowRight":  setCurrentSec(s => Math.min(totalSec, s + 10)); break;
        case "ArrowUp":     setVolume(v => Math.min(100, v + 10)); break;
        case "ArrowDown":   setVolume(v => Math.max(0, v - 10)); break;
        case "m":           setMuted(m => !m); break;
        case "f":           setFullscreen(f => !f); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalSec]);

  /* ──────────────── Touch gesture handlers ──────────────── */

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
    const playerWidth = playerRef.current?.offsetWidth ?? 400;

    // ── Double-tap to seek (left side = -10s, right side = +10s) ──
    const now = Date.now();
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 250) {
      if (lastTapRef.current && now - lastTapRef.current.time < 350) {
        const isRightSide = lastTapRef.current.x > playerWidth / 2;
        if (isRightSide) {
          setCurrentSec(s => Math.min(totalSec, s + 10));
          showSkipFlash("forward");
          haptic(ImpactStyle.Medium);
        } else {
          setCurrentSec(s => Math.max(0, s - 10));
          showSkipFlash("back");
          haptic(ImpactStyle.Medium);
        }
        lastTapRef.current = null;
        resetControlsTimer();
        return;
      }
      lastTapRef.current = { x: t.clientX, time: now };
      // single tap: toggle play/controls
      closeAllMenus();
      setPlaying(p => !p);
      haptic(ImpactStyle.Light);
      resetControlsTimer();
      return;
    }

    // ── Horizontal swipe to seek ──
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 400) {
      const seekSec = Math.round((dx / playerWidth) * 60); // 60s max per full swipe
      setCurrentSec(s => Math.max(0, Math.min(totalSec, s + seekSec)));
      showSkipFlash(dx > 0 ? "forward" : "back");
      haptic(ImpactStyle.Light);
      resetControlsTimer();
    }

    touchStartRef.current = null;
  };

  const closeAllMenus = () => {
    setShowQualityMenu(false);
    setShowSubtitleMenu(false);
    setShowSpeedMenu(false);
    setShowEpisodes(false);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setCurrentSec(Math.floor(pct * totalSec));
  };

  const progress = (currentSec / totalSec) * 100;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const currentVolume = muted ? 0 : volume;


  /* ──────────────── Render ──────────────── */
  return (
    <div className={`min-h-screen bg-background flex flex-col ${fullscreen ? "fixed inset-0 z-[100]" : ""}`}>

      {/* ─── Top Bar (hidden in fullscreen) ─── */}
      {!fullscreen && (
        <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-gold/10 flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back</span>
          </button>
          <div className="h-4 w-px bg-gold/20" />
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-gold rounded-sm flex items-center justify-center">
              <Play className="w-3 h-3 fill-background text-background" />
            </div>
            <span className="cinzel text-sm font-bold text-gold tracking-wider hidden sm:inline">HABESHA STREAMS</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {content.badge && (
              <span className="px-2 py-0.5 border border-gold/30 text-gold text-[10px] font-bold tracking-widest">
                {content.badge}
              </span>
            )}
            <h1 className="cinzel text-sm font-bold text-foreground hidden md:block">{content.title}</h1>
          </div>
        </div>
      )}

      {/* ─── Main layout ─── */}
      <div className={`flex flex-1 overflow-hidden ${fullscreen ? "h-screen" : "h-[calc(100vh-49px)]"}`}>

        {/* ─── Player Column ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ─── Video Player ─── */}
          <div
            ref={playerRef}
            className="relative flex-1 bg-black overflow-hidden cursor-pointer select-none video-player"
            onMouseMove={resetControlsTimer}
            onMouseLeave={() => { if (playing) setShowControls(false); }}
            onClick={() => { if (!isNative) { closeAllMenus(); setPlaying(p => !p); resetControlsTimer(); } }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* ── Loading spinner ── */}
            {(authLoading || contentLoading) && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            )}

            {/* ── Subscription paywall (non-PPV content only) ── */}
            {showSubscriptionPaywall && !authLoading && (
              <PaywallOverlay isPastDue={isPastDue} contentTitle={content.title} />
            )}

            {/* ── PPV purchase overlay (anyone can buy, no subscription required) ── */}
            {content.isPPV && !isAdmin && !authLoading && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center px-6">
                  <span className="inline-block px-3 py-1 bg-habesha-red text-foreground text-[10px] font-bold uppercase tracking-widest rounded-sm mb-4">
                    PPV · Live Event
                  </span>
                  <h3 className="cinzel text-xl font-black text-foreground mb-2">{content.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{content.description}</p>
                  <PPVCheckoutButton eventTitle={content.title} variant="banner" />
                </div>
              </div>
            )}

            {/* Poster / Video background */}
            <img
              src={content.image}
              alt={content.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "brightness(0.6)" }}
              draggable={false}
            />

            {/* Cinematic bars */}
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

            {/* ── Subtitle display ── */}
            {subtitleLang !== "Off" && playing && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-black/75 text-foreground text-sm md:text-base px-4 py-1.5 rounded-sm text-center max-w-lg leading-relaxed backdrop-blur-sm">
                  {subtitleLang === "አማርኛ (Amharic)"
                    ? "ወደ ጥንታዊው ሥርዓት ሄዶ ምስጢሩን ፈለጋ..."
                    : "He ventured into the ancient realm, seeking the secret…"}
                </div>
              </div>
            )}

            {/* ── Dynamic Watermark ── */}
            <div
              className={`absolute z-20 pointer-events-none transition-all duration-1000 ${WATERMARK_POSITIONS[watermarkPos]}`}
            >
              <p className="text-[10px] text-foreground/20 font-mono select-none">
                mikiyas@habesha.stream · ID:7291
              </p>
            </div>

            {/* ── Big center play/pause ── */}
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold/90 backdrop-blur-sm flex items-center justify-center shadow-gold animate-pulse-gold">
                  <Play className="w-7 h-7 md:w-9 md:h-9 fill-background text-background ml-1" />
                </div>
              </div>
            )}

            {/* ── Skip indicators (double-tap / swipe flash) ── */}
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

            {/* ── Double-tap hint (shown briefly on first load, native only) ── */}
            {isNative && !playing && currentSec === 0 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/10">
                  <Smartphone className="w-3 h-3 text-white/60" />
                  <span className="text-[10px] text-white/60">Double-tap left/right to skip · Swipe to seek</span>
                </div>
              </div>
            )}

            {/* ── Controls Overlay ── */}
            <div
              className={`absolute inset-0 flex flex-col justify-end z-30 transition-opacity duration-300 ${
                showControls || !playing ? "opacity-100" : "opacity-0"
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* Top bar: title in fullscreen */}
              {fullscreen && (
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4">
                  <button
                    onClick={() => { setFullscreen(false); setPlaying(false); navigate(-1); }}
                    className="flex items-center gap-2 text-foreground/80 hover:text-foreground"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">{content.title}</span>
                  </button>
                  <span className="text-xs text-foreground/50">mikiyas@habesha.stream</span>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="px-4 pb-4 space-y-2">
                {/* ── Progress Bar ── */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground/70 font-mono w-12 text-right flex-shrink-0">
                    {formatTime(currentSec)}
                  </span>

                  <div
                    className="relative flex-1 h-1 group cursor-pointer"
                    onClick={seek}
                  >
                    {/* Track */}
                    <div className="absolute inset-0 bg-foreground/20 rounded-full" />
                    {/* Buffered */}
                    <div
                      className="absolute inset-y-0 left-0 bg-foreground/30 rounded-full"
                      style={{ width: `${buffered}%` }}
                    />
                    {/* Played */}
                    <div
                      className="absolute inset-y-0 left-0 gradient-gold rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                    {/* Thumb */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-gold rounded-full shadow-gold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `${progress}%` }}
                    />
                    {/* Hover size expansion */}
                    <div className="absolute inset-0 rounded-full group-hover:scale-y-150 transition-transform origin-center" />
                  </div>

                  <span className="text-xs text-foreground/50 font-mono w-12 flex-shrink-0">
                    {content.duration !== "Series" ? content.duration : formatTime(totalSec)}
                  </span>
                </div>

                {/* ── Control Buttons ── */}
                <div className="flex items-center gap-1 md:gap-2">
                  {/* Left controls */}
                  <button
                    onClick={() => setCurrentSec(s => Math.max(0, s - 10))}
                    className="p-2 text-foreground/80 hover:text-gold transition-colors group relative"
                    title="Back 10s"
                  >
                    <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-background/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">-10s</span>
                  </button>

                  <button
                    onClick={() => setPlaying(p => !p)}
                    className="p-2 text-foreground hover:text-gold transition-colors"
                  >
                    {playing
                      ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                      : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5" />
                    }
                  </button>

                  <button
                    onClick={() => setCurrentSec(s => Math.min(totalSec, s + 10))}
                    className="p-2 text-foreground/80 hover:text-gold transition-colors group relative"
                    title="Forward 10s"
                  >
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-background/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">+10s</span>
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-1 group/vol">
                    <button
                      onClick={() => setMuted(m => !m)}
                      className="p-2 text-foreground/80 hover:text-gold transition-colors"
                    >
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
                    {formatTime(currentSec)} / {content.duration !== "Series" ? content.duration : formatTime(totalSec)}
                  </span>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Episodes (for series) */}
                  {content.episodes && (
                    <div className="relative">
                      <button
                        onClick={e => { e.stopPropagation(); closeAllMenus(); setShowEpisodes(o => !o); }}
                        className={`p-2 transition-colors ${showEpisodes ? "text-gold" : "text-foreground/80 hover:text-gold"}`}
                        title="Episodes"
                      >
                        <List className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      {showEpisodes && (
                        <div className="absolute bottom-10 right-0 w-56 bg-surface-overlay/95 backdrop-blur-xl border border-gold/20 rounded-sm shadow-elevated overflow-hidden"
                          onClick={e => e.stopPropagation()}>
                          <div className="px-3 py-2 border-b border-gold/10">
                            <p className="cinzel text-xs font-bold text-gold">Episodes</p>
                          </div>
                          {content.episodes!.map(ep => (
                            <button key={ep.ep}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gold/10 transition-colors text-left"
                              onClick={() => setShowEpisodes(false)}
                            >
                              <span className="text-[10px] text-gold font-bold w-4">E{ep.ep}</span>
                              <span className="text-xs text-foreground flex-1">{ep.title}</span>
                              <span className="text-[10px] text-muted-foreground">{ep.duration}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subtitles */}
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); closeAllMenus(); setShowSubtitleMenu(o => !o); }}
                      className={`p-2 transition-colors ${subtitleLang !== "Off" ? "text-gold" : "text-foreground/80 hover:text-gold"}`}
                      title="Subtitles"
                    >
                      <Subtitles className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    {showSubtitleMenu && (
                      <div className="absolute bottom-10 right-0 w-52 bg-surface-overlay/95 backdrop-blur-xl border border-gold/20 rounded-sm shadow-elevated overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <div className="px-3 py-2 border-b border-gold/10 flex items-center justify-between">
                          <p className="cinzel text-xs font-bold text-gold">Subtitles</p>
                          <button onClick={() => setShowSubtitleMenu(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {SUBTITLE_LANGS.map(lang => (
                          <button key={lang}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gold/10 transition-colors text-left"
                            onClick={() => { setSubtitleLang(lang); setShowSubtitleMenu(false); }}
                          >
                            {subtitleLang === lang
                              ? <Check className="w-3 h-3 text-gold flex-shrink-0" />
                              : <div className="w-3 h-3 flex-shrink-0" />
                            }
                            <span className={`text-xs ${subtitleLang === lang ? "text-gold font-medium" : "text-foreground"}`}>{lang}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quality + Speed */}
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); closeAllMenus(); setShowQualityMenu(o => !o); }}
                      className={`p-2 transition-colors ${showQualityMenu ? "text-gold" : "text-foreground/80 hover:text-gold"}`}
                      title="Settings"
                    >
                      <Settings className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-500 ${showQualityMenu ? "rotate-90" : ""}`} />
                    </button>
                    {showQualityMenu && (
                      <div className="absolute bottom-10 right-0 w-56 bg-surface-overlay/95 backdrop-blur-xl border border-gold/20 rounded-sm shadow-elevated overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        {/* Quality */}
                        <div className="px-3 py-2 border-b border-gold/10 flex items-center justify-between">
                          <p className="cinzel text-xs font-bold text-gold flex items-center gap-1.5">
                            <Monitor className="w-3 h-3" /> Quality
                          </p>
                          <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-sm">{quality}</span>
                        </div>
                        {QUALITY_OPTIONS.map(q => (
                          <button key={q}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gold/10 transition-colors text-left"
                            onClick={() => { setQuality(q); }}
                          >
                            {quality === q
                              ? <Check className="w-3 h-3 text-gold flex-shrink-0" />
                              : <div className="w-3 h-3 flex-shrink-0" />
                            }
                            <span className={`text-xs flex-1 ${quality === q ? "text-gold font-medium" : "text-foreground"}`}>{q}</span>
                            {q === "4K Ultra HD" && <span className="text-[9px] text-gold/60 border border-gold/20 px-1 rounded-sm">HDR</span>}
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
                              className={`px-2.5 py-1 text-[10px] rounded-sm transition-all ${
                                speed === s ? "bg-gold text-background font-bold" : "bg-surface-raised text-muted-foreground hover:text-foreground border border-gold/10"
                              }`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar toggle (desktop) */}
                  {!fullscreen && (
                    <button
                      onClick={e => { e.stopPropagation(); setSidebarOpen(o => !o); }}
                      className={`hidden lg:flex p-2 transition-colors ${sidebarOpen ? "text-gold" : "text-foreground/80 hover:text-gold"}`}
                      title="Related content"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? "rotate-0" : "rotate-180"}`} />
                    </button>
                  )}

                  {/* Fullscreen */}
                  <button
                    onClick={e => { e.stopPropagation(); setFullscreen(f => !f); closeAllMenus(); }}
                    className="p-2 text-foreground/80 hover:text-gold transition-colors"
                    title="Fullscreen (F)"
                  >
                    {fullscreen
                      ? <Minimize className="w-4 h-4 md:w-5 md:h-5" />
                      : <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Below Player: Info bar ─── */}
          {!fullscreen && (
            <div className="bg-surface border-t border-gold/10 px-4 py-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {content.badge && (
                      <span className="px-2 py-0.5 border border-gold/40 text-gold text-[10px] font-bold tracking-widest rounded-sm">{content.badge}</span>
                    )}
                    {content.isPPV && (
                      <span className="px-2 py-0.5 bg-destructive/20 border border-destructive/40 text-destructive text-[10px] font-bold tracking-widest rounded-sm">PPV</span>
                    )}
                    <h2 className="cinzel text-base md:text-lg font-bold text-foreground">{content.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-gold font-semibold">{content.rating}</span>
                    </div>
                    <span>{content.year}</span>
                    <span className="text-gold/40">•</span>
                    <span>{content.genre}</span>
                    <span className="text-gold/40">•</span>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{content.duration}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-2xl hidden md:block">
                    {content.description}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setIsSaved(s => !s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-medium transition-all ${
                      isSaved ? "bg-gold/10 border-gold/40 text-gold" : "border-gold/10 text-muted-foreground hover:text-gold hover:border-gold/30"
                    }`}
                  >
                    <Bookmark className={`w-3 h-3 ${isSaved ? "fill-gold" : ""}`} />
                    <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-gold/10 text-muted-foreground hover:text-gold hover:border-gold/30 text-xs font-medium transition-all">
                    <ThumbsUp className="w-3 h-3" />
                    <span className="hidden sm:inline">Like</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-gold/10 text-muted-foreground hover:text-gold hover:border-gold/30 text-xs font-medium transition-all">
                    <Share2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Share Trailer</span>
                  </button>
                </div>
              </div>

              {/* Keyboard hints */}
              <div className="mt-2 pt-2 border-t border-gold/5 hidden md:flex items-center gap-4 text-[10px] text-muted-foreground/50">
                <span><kbd className="px-1 py-0.5 border border-gold/10 rounded text-[9px]">Space</kbd> Play/Pause</span>
                <span><kbd className="px-1 py-0.5 border border-gold/10 rounded text-[9px]">←→</kbd> ±10s</span>
                <span><kbd className="px-1 py-0.5 border border-gold/10 rounded text-[9px]">↑↓</kbd> Volume</span>
                <span><kbd className="px-1 py-0.5 border border-gold/10 rounded text-[9px]">M</kbd> Mute</span>
                <span><kbd className="px-1 py-0.5 border border-gold/10 rounded text-[9px]">F</kbd> Fullscreen</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Related Content Sidebar ─── */}
        {!fullscreen && sidebarOpen && (
          <aside className="hidden lg:flex flex-col w-72 xl:w-80 bg-surface border-l border-gold/10 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 sticky top-0 bg-surface z-10">
              <h3 className="cinzel text-sm font-bold text-foreground">Up Next</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground hover:text-gold transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Autoplay next */}
            {relatedContent.length > 0 && (
            <div className="px-4 py-3 border-b border-gold/10 bg-gold/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                <span className="text-[10px] text-gold font-bold uppercase tracking-widest">Autoplay Next</span>
              </div>
              <div className="flex gap-3 cursor-pointer group">
                <div className="relative w-24 h-14 rounded-sm overflow-hidden flex-shrink-0">
                  <img src={relatedContent[0].image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <Play className="w-5 h-5 text-gold fill-gold" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/watch/${relatedContent[0].id}`} className="text-xs font-semibold text-foreground hover:text-gold transition-colors line-clamp-2">{relatedContent[0].title}</Link>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{relatedContent[0].genre} · {relatedContent[0].duration}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                    <span className="text-[10px] text-gold">{relatedContent[0].rating}</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* More like this */}
            <div className="px-4 py-3 border-b border-gold/10">
              <p className="cinzel text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">More Like This</p>
              <div className="space-y-3">
                {relatedContent.slice(1).map((item) => (
                  <Link
                    key={item.id}
                    to={`/watch/${item.id}`}
                    className="flex gap-3 group cursor-pointer"
                  >
                    <div className="relative w-24 h-14 rounded-sm overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                        <Play className="w-4 h-4 text-gold fill-gold" />
                      </div>
                      <div className="absolute top-1 right-1 bg-background/70 px-1 py-0.5 rounded-sm">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2 h-2 fill-gold text-gold" />
                          <span className="text-[8px] text-gold font-bold">{item.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.genre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{item.year}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <div className="flex items-center gap-0.5 text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[10px]">{item.duration}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Current quality/subtitle status */}
            <div className="px-4 py-3 mt-auto border-t border-gold/10">
              <p className="cinzel text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Now Playing</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Quality</span>
                  <span className="text-[10px] text-gold font-medium">{quality}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Subtitles</span>
                  <span className="text-[10px] text-gold font-medium">{subtitleLang}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Speed</span>
                  <span className="text-[10px] text-gold font-medium">{speed}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Progress</span>
                  <span className="text-[10px] text-gold font-medium">{Math.round(progress)}%</span>
                </div>
              </div>
              <div className="mt-2 h-1 bg-surface-overlay rounded-full overflow-hidden">
                <div className="h-full gradient-gold rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ─── Mobile: Related content below player ─── */}
      {!fullscreen && (
        <div className="lg:hidden bg-surface border-t border-gold/10 px-4 py-4">
          <p className="cinzel text-sm font-bold text-foreground mb-3">More Like This</p>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
            {relatedContent.map(item => (
              <Link key={item.id} to={`/watch/${item.id}`} className="flex-none w-32">
                <div className="relative aspect-[2/3] rounded-sm overflow-hidden mb-1.5">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-1 left-1 right-1">
                    <p className="text-[9px] font-semibold text-foreground line-clamp-1">{item.title}</p>
                  </div>
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-background/70 px-1 py-0.5 rounded-sm">
                    <Star className="w-2 h-2 fill-gold text-gold" />
                    <span className="text-[8px] text-gold font-bold">{item.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
