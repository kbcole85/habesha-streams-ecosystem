import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, FlipHorizontal, Mic, MicOff, X, Loader2, Wifi, WifiOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import LiveStream from "@/plugins/LiveStreamPlugin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type StreamPhase = "setup" | "preview" | "live" | "ended";

export default function GoLive() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<StreamPhase>("setup");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);
  const [connected, setConnected] = useState(false);
  const [bitrate, setBitrate] = useState(0);
  const [duration, setDuration] = useState(0);

  const streamIdRef = useRef<string | null>(null);
  const streamKeyRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusListenerRef = useRef<{ remove: () => Promise<void> } | null>(null);
  const bitrateListenerRef = useRef<{ remove: () => Promise<void> } | null>(null);
  // Web-only: camera stream via getUserMedia
  const webCameraRef = useRef<HTMLVideoElement>(null);
  const webStreamRef = useRef<MediaStream | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  // Tracks current stream id in state so the Realtime subscription effect re-runs
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [screenshotCount, setScreenshotCount] = useState(0);

  // Register native event listeners once on mount
  useEffect(() => {
    if (!isNative) return;

    LiveStream.addListener("streamStatus", (data) => {
      if (data.status === "connected") {
        setConnected(true);
      } else if (
        data.status === "disconnected" ||
        data.status === "failed" ||
        data.status === "authError"
      ) {
        setConnected(false);
        if (data.reason) {
          toast({ title: "Stream issue", description: data.reason, variant: "destructive" });
        }
      }
    }).then((l) => { statusListenerRef.current = l; });

    LiveStream.addListener("bitrateUpdate", (data) => {
      setBitrate(Math.round(data.bitrate / 1000));
    }).then((l) => { bitrateListenerRef.current = l; });

    return () => {
      statusListenerRef.current?.remove();
      bitrateListenerRef.current?.remove();
    };
  }, [isNative]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const p = phaseRef.current;
      if (isNative && (p === "preview" || p === "live")) {
        LiveStream.stopStreaming().catch(() => {});
      }
      // Stop web camera
      webStreamRef.current?.getTracks().forEach((t) => t.stop());
      webStreamRef.current = null;
    };
  }, [isNative]);

  // Attach web camera stream to video element when phase enters preview/live
  useEffect(() => {
    if (!isNative && webCameraRef.current && webStreamRef.current) {
      webCameraRef.current.srcObject = webStreamRef.current;
    }
  }, [isNative, phase]);

  // Realtime: notify creator when a viewer screenshots their stream.
  // RLS allows the creator to SELECT audit_log rows where target_id is one of
  // their live_streams; the Realtime channel respects that policy.
  useEffect(() => {
    if (!activeStreamId) return;
    const channel = supabase
      .channel(`stream-alerts-${activeStreamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_logs",
          filter: `target_id=eq.${activeStreamId}`,
        },
        (payload) => {
          const action = (payload.new as { action?: string }).action;
          if (action === "screenshot_detected") {
            setScreenshotCount((c) => c + 1);
            toast({
              title: "👀 Screenshot detected",
              description: "A viewer just captured your stream.",
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeStreamId]);

  // On native: strip the HTML body/html background-color so the camera view
  // sitting behind the transparent WebView is actually visible.
  // Restores on cleanup so the rest of the app renders normally.
  useEffect(() => {
    if (!isNative) return;
    if (phase !== "preview" && phase !== "live") return;
    const prevBody = document.body.style.backgroundColor;
    const prevHtml = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";
    return () => {
      document.body.style.backgroundColor = prevBody;
      document.documentElement.style.backgroundColor = prevHtml;
    };
  }, [isNative, phase]);

  const stopStream = useCallback(async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (isNative) {
      await LiveStream.stopStreaming().catch(() => {});
    } else {
      webStreamRef.current?.getTracks().forEach((t) => t.stop());
      webStreamRef.current = null;
    }
    if (streamIdRef.current) {
      await supabase.functions.invoke("mux-live-stream", {
        body: { action: "end", stream_id: streamIdRef.current },
      });
    }
  }, [isNative]);

  const handleStart = async () => {
    if (!title.trim()) { toast({ title: "Enter a stream title" }); return; }
    setLoading(true);

    try {
      if (isNative) {
        const perms = await LiveStream.requestPermissions();
        if (perms.camera !== "granted" || perms.microphone !== "granted") {
          toast({ title: "Camera and microphone permission required", variant: "destructive" });
          setLoading(false);
          return;
        }
        await LiveStream.startPreview();
      } else {
        // Web: start camera via getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: frontCamera ? "user" : "environment" },
            audio: true,
          });
          webStreamRef.current = stream;
        } catch {
          toast({
            title: "Camera not available",
            description: "Grant camera access or use the mobile app to stream live.",
            variant: "destructive",
          });
        }
      }

      const { data: rawData, error } = await supabase.functions.invoke("mux-live-stream", {
        body: { action: "create", title: title.trim() },
      });

      // supabase-js sometimes returns the body as a raw string instead of a
      // parsed object (Content-Type negotiation can fail in the Capacitor
      // WebView). Parse it if so.
      let data: any = rawData;
      if (typeof rawData === "string") {
        try { data = JSON.parse(rawData); } catch { /* leave as string */ }
      }

      if (error || !data?.stream) {
        const parts: string[] = [];
        if (error?.message) parts.push(error.message);

        const ctx = (error as any)?.context;
        if (ctx?.text && typeof ctx.text === "function") {
          try { parts.push(await ctx.text()); } catch { /* ignore */ }
        } else if (ctx?.body) {
          parts.push(typeof ctx.body === "string" ? ctx.body : JSON.stringify(ctx.body));
        }

        if (data) parts.push(`data=${typeof data === "string" ? data : JSON.stringify(data)}`);

        throw new Error(parts.length ? parts.join(" | ") : "Failed to create stream — no response body");
      }

      streamIdRef.current = data.stream.id;
      streamKeyRef.current = data.stream.mux_stream_key;
      setActiveStreamId(data.stream.id);
      setPhase("preview");
    } catch (e: any) {
      toast({ title: "Failed to start", description: e.message ?? String(e), variant: "destructive" });
      if (isNative) {
        LiveStream.stopStreaming().catch(() => {});
      } else {
        webStreamRef.current?.getTracks().forEach((t) => t.stop());
        webStreamRef.current = null;
      }
    }

    setLoading(false);
  };

  const handleGoLive = async () => {
    if (!streamKeyRef.current) return;
    setLoading(true);
    try {
      if (isNative) {
        await LiveStream.startStreaming({
          rtmpUrl: "rtmp://global-live.mux.com:5222/app",
          streamKey: streamKeyRef.current,
        });
      }
      setPhase("live");
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e: any) {
      toast({ title: "Failed to go live", description: e.message ?? String(e), variant: "destructive" });
    }
    setLoading(false);
  };

  const handleEnd = async () => {
    setLoading(true);
    await stopStream();
    setPhase("ended");
    setLoading(false);
  };

  const handleCancel = async () => {
    await stopStream();
    navigate(-1);
  };

  const handleSwitchCamera = async () => {
    if (!isNative) {
      const newFront = !frontCamera;
      setFrontCamera(newFront);
      webStreamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFront ? "user" : "environment" },
          audio: true,
        });
        webStreamRef.current = stream;
        if (webCameraRef.current) webCameraRef.current.srcObject = stream;
      } catch { /* ignore */ }
      return;
    }
    try {
      const result = await LiveStream.switchCamera();
      setFrontCamera(result.front);
    } catch { /* ignore */ }
  };

  const handleToggleMute = async () => {
    if (!isNative) {
      const newMuted = !muted;
      setMuted(newMuted);
      webStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !newMuted; });
      return;
    }
    try {
      const result = await LiveStream.toggleMute();
      setMuted(result.muted);
    } catch { /* ignore */ }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <button onClick={() => navigate(-1)} className="absolute top-5 left-4 text-muted-foreground">
          <X className="w-6 h-6" />
        </button>
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="cinzel text-2xl font-bold text-foreground">Go Live</h1>
            <p className="text-sm text-muted-foreground mt-1">Share your moment in real time</p>
          </div>
          <input
            type="text"
            placeholder="What's your stream about?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="w-full bg-surface border border-gold/20 rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 text-sm"
          />
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-sm transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5" />}
            {loading ? "Setting up..." : "Start Live Stream"}
          </button>
        </div>
      </div>
    );
  }

  // ── Ended ──────────────────────────────────────────────────────────────────
  if (phase === "ended") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface border border-gold/20 flex items-center justify-center">
          <Radio className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="cinzel text-xl font-bold text-foreground">Stream Ended</h2>
        <p className="text-sm text-muted-foreground">Duration: {formatDuration(duration)}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2.5 bg-surface border border-gold/20 text-foreground text-sm rounded-sm hover:border-gold/50 transition-all"
        >
          Done
        </button>
      </div>
    );
  }

  // ── Preview / Live ─────────────────────────────────────────────────────────
  // On native: bg-transparent so the native OpenGlView camera (below WebView) shows through.
  // On web: bg-black with getUserMedia <video> element as the background.
  return (
    <div className={`h-screen relative flex flex-col overflow-hidden ${isNative ? "bg-transparent" : "bg-black"}`}>
      {/* Web camera feed */}
      {!isNative && (
        <video
          ref={webCameraRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: frontCamera ? "scaleX(-1)" : "none" }}
        />
      )}

      {/* Gradient overlay — top and bottom for UI readability, centre stays clear for camera */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 28%, transparent 62%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-10">
        <button
          onClick={handleCancel}
          className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2">
          {phase === "live" && (
            <>
              <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                <Radio className="w-3 h-3" /> LIVE
              </span>
              <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded-full">
                {formatDuration(duration)}
              </span>
              {connected
                ? <Wifi className="w-4 h-4 text-green-400" />
                : <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
              }
              {bitrate > 0 && (
                <span className="text-white/60 text-xs">{bitrate}kbps</span>
              )}
              {screenshotCount > 0 && (
                <span
                  className="text-white text-xs bg-amber-600/80 px-2 py-1 rounded-full"
                  title="Screenshots detected by viewers"
                >
                  📸 {screenshotCount}
                </span>
              )}
            </>
          )}
          {phase === "preview" && (
            <span className="text-white/70 text-xs bg-black/50 px-3 py-1 rounded-full">Preview</span>
          )}
        </div>

        <div className="w-9" />
      </div>

      {/* Stream title */}
      <div className="relative z-10 px-4">
        <p className="text-white font-semibold text-sm drop-shadow">{title}</p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="relative z-10 pb-10 px-6">
        {phase === "preview" && (
          <div className="flex flex-col items-center gap-4">
            {!isNative && (
              <p className="text-white/50 text-xs text-center">
                Web preview only — use the mobile app for live streaming
              </p>
            )}
            <button
              onClick={handleGoLive}
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5" />}
              {loading ? "Going live..." : "Go Live"}
            </button>
          </div>
        )}

        {phase === "live" && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleToggleMute}
              className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"
            >
              {muted
                ? <MicOff className="w-5 h-5 text-red-400" />
                : <Mic className="w-5 h-5 text-white" />
              }
            </button>

            <button
              onClick={handleEnd}
              disabled={loading}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              End Stream
            </button>

            <button
              onClick={handleSwitchCamera}
              className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"
            >
              <FlipHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
