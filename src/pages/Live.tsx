import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Loader2 } from "lucide-react";
import Hls from "hls.js";
import { supabase } from "@/integrations/supabase/client";
import { useScreenProtection } from "@/hooks/useScreenProtection";

interface LiveStream {
  id: string;
  title: string;
  status: string;
  playback_url: string | null;
  profiles: { display_name: string } | null;
}

export default function Live() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hlsError, setHlsError] = useState(false);
  const { enableProtection, disableProtection, startDetection, stopDetection } = useScreenProtection();

  useEffect(() => {
    enableProtection();
    if (id) startDetection(id);
    return () => {
      disableProtection();
      stopDetection();
    };
  }, [id, enableProtection, disableProtection, startDetection, stopDetection]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("mux-live-stream", {
          body: { action: "get", stream_id: id },
        });
        if (fnErr || !data?.stream) {
          setError("Stream not found.");
        } else {
          setStream(data.stream);
          setError(null);
        }
      } catch {
        setError("Failed to load stream.");
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream?.playback_url || stream.status !== "active") return;

    setHlsError(false);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: 0,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5,
      });
      hlsRef.current = hls;
      hls.loadSource(stream.playback_url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setHlsError(true);
          hls.destroy();
          hlsRef.current = null;
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream.playback_url;
      video.play().catch(() => {});
    } else {
      setHlsError(true);
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [stream?.playback_url, stream?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error ?? "Stream not found."}</p>
        <button onClick={() => navigate(-1)} className="text-gold text-sm">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">{stream.title}</h1>
          <p className="text-xs text-muted-foreground">{stream.profiles?.display_name ?? "Creator"}</p>
        </div>
        {stream.status === "active" && (
          <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
            <Radio className="w-3 h-3" /> LIVE
          </span>
        )}
      </div>

      {/* Video */}
      <div className="w-full bg-black aspect-video">
        {stream.status === "active" && stream.playback_url && !hlsError ? (
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Radio className="w-10 h-10 opacity-30" />
            <p className="text-sm">
              {hlsError
                ? "Playback error — retrying shortly"
                : stream.status === "ended"
                  ? "This stream has ended"
                  : "Stream hasn't started yet"}
            </p>
            {stream.status !== "ended" && (
              <p className="text-xs opacity-60">Page refreshes automatically</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
