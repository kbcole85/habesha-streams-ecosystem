import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Play, ArrowLeft, Star, Clock,
  ThumbsUp, Share2, Bookmark, X,
  Lock, Crown, AlertTriangle, Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PPVCheckoutButton from "@/components/PPVCheckoutButton";
import VideoPlayer, { type SubtitleTrack } from "@/components/VideoPlayer";

/* ──────────────── Paywall Overlay ──────────────── */

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
          {isPastDue ? <AlertTriangle className="w-7 h-7 text-gold" /> : <Lock className="w-7 h-7 text-gold" />}
        </div>
        <h2 className="cinzel text-2xl font-black text-foreground mb-2">
          {isPastDue ? "Payment Required" : "Unlock This Content"}
        </h2>
        {isPastDue ? (
          <p className="text-muted-foreground text-sm mb-2">Your last payment failed. Update your billing details to continue watching.</p>
        ) : (
          <p className="text-muted-foreground text-sm mb-2">
            <span className="text-foreground font-medium">"{contentTitle}"</span> requires a Habesha Streams subscription.
          </p>
        )}
        {isPastDue ? (
          <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-xs">
            <button onClick={handleManageBilling} className="w-full py-3 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all">Update Payment Method</button>
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Go back home</button>
          </div>
        ) : (
          <div className="mt-6 w-full max-w-xs flex flex-col items-center gap-4">
            <button onClick={handleCheckout} disabled={loading} className="w-full py-3 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all shadow-gold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              Subscribe — $5/month
            </button>
            <p className="text-[10px] text-muted-foreground">Instant access · Cancel anytime</p>
            {!user && (
              <button onClick={() => navigate("/auth", { state: { from: location.pathname } })} className="text-xs text-gold hover:underline">Sign in to your account</button>
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
  rating: string; genre: string; duration: string;
  description: string; image: string; badge?: string; isPPV?: boolean;
  videoUrl: string | null;
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
    description: v.full_description || v.short_description || "",
    image: v.thumbnail_url || "/placeholder.svg",
    badge: v.monetization_type === "ppv" ? "PPV" : undefined,
    isPPV: v.monetization_type === "ppv",
    videoUrl: v.video_url || null,
  };
}

/* ──────────────── Main Component ──────────────── */
const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [content, setContent] = useState<WatchContent>({
    id: "", title: "Loading...", subtitle: "", year: 2024, rating: "-",
    genre: "", duration: "", description: "", image: "/placeholder.svg", videoUrl: null,
  });
  const [relatedContent, setRelatedContent] = useState<WatchContent[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const { user, isSubscribed, subscriptionEnd, role, loading: authLoading } = useAuth();
  const isAdmin = role === "admin";
  const [ppvPurchased, setPpvPurchased] = useState(false);
  const [ppvCheckDone, setPpvCheckDone] = useState(false);
  const [hasTestCodeAccess, setHasTestCodeAccess] = useState(false);
  const [testCodeCheckDone, setTestCodeCheckDone] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check test code access
  useEffect(() => {
    if (!user || isAdmin) { setHasTestCodeAccess(false); setTestCodeCheckDone(true); return; }
    const checkTestCode = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, current_period_end, status")
        .eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (data?.stripe_subscription_id?.startsWith("test_code_")) {
        const endDate = data.current_period_end ? new Date(data.current_period_end) : null;
        setHasTestCodeAccess(endDate ? endDate > new Date() : false);
      } else {
        setHasTestCodeAccess(false);
      }
      setTestCodeCheckDone(true);
    };
    checkTestCode();
  }, [user, isAdmin]);

  // Check PPV purchase
  useEffect(() => {
    if (!content.isPPV || !user || isAdmin) { setPpvPurchased(false); setPpvCheckDone(true); return; }
    const checkPurchase = async () => {
      const { data } = await supabase
        .from("payments").select("id")
        .eq("user_id", user.id).eq("type", "ppv").eq("status", "succeeded").eq("video_id", content.id).limit(1);
      setPpvPurchased(!!(data && data.length > 0));
      setPpvCheckDone(true);
    };
    checkPurchase();
  }, [content.id, content.isPPV, user, isAdmin]);

  /* ACCESS ORDER: Admin → Test Code → PPV → Subscription */
  const accessGranted = isAdmin || hasTestCodeAccess;
  const isPastDue = !accessGranted && !isSubscribed && user !== null && subscriptionEnd !== null;
  const showPPVPaywall = !authLoading && ppvCheckDone && testCodeCheckDone && !accessGranted && content.isPPV && !ppvPurchased;
  const showSubscriptionPaywall = !authLoading && testCodeCheckDone && !accessGranted && !content.isPPV && !isSubscribed;
  const canPlay = accessGranted || (content.isPPV ? ppvPurchased : isSubscribed);

  console.log("[Watch] Access check:", { role, isAdmin, isSubscribed, hasTestCodeAccess, isPPV: content.isPPV, ppvPurchased, canPlay, userId: user?.id });

  /* Fetch video + subtitles from DB */
  useEffect(() => {
    if (!id) return;
    const fetchVideo = async () => {
      setContentLoading(true);
      const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
      if (data) {
        setContent(dbToWatchContent(data));
      } else if (error || !data) {
        toast({ title: "Video not found", variant: "destructive" });
        navigate("/browse");
        return;
      }

      // Fetch subtitles
      const { data: subs } = await supabase.from("video_subtitles").select("*").eq("video_id", id);
      if (subs && subs.length > 0) {
        setSubtitleTracks(subs.map((s: any) => ({
          language: s.language,
          label: s.label,
          url: s.subtitle_url,
          isDefault: s.is_default,
        })));
      }

      // Related content
      const { data: related } = await supabase
        .from("videos").select("*")
        .eq("status", "approved").eq("admin_approved", true)
        .eq("visibility", "public").eq("encoding_status", "ready")
        .neq("id", id).limit(6);
      if (related) setRelatedContent(related.map(dbToWatchContent));
      setContentLoading(false);
    };
    fetchVideo();
  }, [id]);

  /* Save watch progress */
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    // Debounced progress save could go here
  };

  const userEmail = user?.email || "";
  const watermarkText = userEmail ? `${userEmail} · ID:${user?.id?.slice(0, 4)}` : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-gold/10 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
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
            <span className="px-2 py-0.5 border border-gold/30 text-gold text-[10px] font-bold tracking-widest">{content.badge}</span>
          )}
          <h1 className="cinzel text-sm font-bold text-foreground hidden md:block">{content.title}</h1>
        </div>
      </div>

      {/* ─── Main layout ─── */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-49px)]">
        {/* ─── Player Column ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ─── Video Player Area ─── */}
          <div className="relative flex-1 bg-black overflow-hidden">
            {/* Loading state */}
            {(authLoading || contentLoading) && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            )}

            {/* Subscription paywall */}
            {showSubscriptionPaywall && !authLoading && (
              <PaywallOverlay isPastDue={isPastDue} contentTitle={content.title} />
            )}

            {/* PPV paywall */}
            {showPPVPaywall && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center px-6">
                  <span className="inline-block px-3 py-1 bg-habesha-red text-foreground text-[10px] font-bold uppercase tracking-widest rounded-sm mb-4">PPV · Live Event</span>
                  <h3 className="cinzel text-xl font-black text-foreground mb-2">{content.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{content.description}</p>
                  <PPVCheckoutButton eventTitle={content.title} videoId={content.id} variant="banner" />
                </div>
              </div>
            )}

            {/* Real Video Player — only render when access is granted */}
            {canPlay && content.videoUrl ? (
              <VideoPlayer
                src={content.videoUrl}
                poster={content.image}
                title={content.title}
                subtitles={subtitleTracks}
                watermarkText={watermarkText}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full"
              />
            ) : (
              /* Poster fallback when no access or no video URL */
              <div className="w-full h-full relative">
                <img
                  src={content.image}
                  alt={content.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: "brightness(0.6)" }}
                  draggable={false}
                />
                {canPlay && !content.videoUrl && !contentLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-surface/90 backdrop-blur-sm border border-gold/20 rounded-sm px-6 py-4 text-center">
                      <p className="text-sm text-muted-foreground">No video file available yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">This content is still being processed</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Below Player: Info bar ─── */}
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
                  <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-gold text-gold" /><span className="text-gold font-semibold">{content.rating}</span></div>
                  <span>{content.year}</span>
                  <span className="text-gold/40">•</span>
                  <span>{content.genre}</span>
                  <span className="text-gold/40">•</span>
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{content.duration}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-2xl hidden md:block">{content.description}</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsSaved(s => !s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-medium transition-all ${isSaved ? "bg-gold/10 border-gold/40 text-gold" : "border-gold/10 text-muted-foreground hover:text-gold hover:border-gold/30"}`}
                >
                  <Bookmark className={`w-3 h-3 ${isSaved ? "fill-gold" : ""}`} />
                  <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-gold/10 text-muted-foreground hover:text-gold hover:border-gold/30 text-xs font-medium transition-all">
                  <ThumbsUp className="w-3 h-3" /><span className="hidden sm:inline">Like</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-gold/10 text-muted-foreground hover:text-gold hover:border-gold/30 text-xs font-medium transition-all">
                  <Share2 className="w-3 h-3" /><span className="hidden sm:inline">Share Trailer</span>
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
        </div>

        {/* ─── Related Content Sidebar ─── */}
        {sidebarOpen && (
          <aside className="hidden lg:flex flex-col w-72 xl:w-80 bg-surface border-l border-gold/10 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 sticky top-0 bg-surface z-10">
              <h3 className="cinzel text-sm font-bold text-foreground">Up Next</h3>
              <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-gold transition-colors"><X className="w-4 h-4" /></button>
            </div>

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
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-3">
              <p className="cinzel text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">More Like This</p>
              <div className="space-y-3">
                {relatedContent.slice(1).map((item) => (
                  <Link key={item.id} to={`/watch/${item.id}`} className="flex gap-3 group cursor-pointer">
                    <div className="relative w-24 h-14 rounded-sm overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                        <Play className="w-4 h-4 text-gold fill-gold" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.genre} · {item.duration}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default Watch;
