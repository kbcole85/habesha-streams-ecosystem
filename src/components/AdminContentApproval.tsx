import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, X, Clock, AlertTriangle, Film, Eye,
  RefreshCw, ChevronDown, Loader2, Search, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  short_description: string | null;
  genre: string | null;
  age_rating: string | null;
  monetization_type: string;
  price: number | null;
  runtime: string | null;
  thumbnail_url: string | null;
  status: string;
  admin_approved: boolean;
  rejection_reason: string | null;
  created_at: string;
  creator_id: string;
}

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const AdminContentApproval = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Failed to load videos", variant: "destructive" });
    } else {
      setVideos(data ?? []);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleApprove = async (videoId: string) => {
    setActionLoading(videoId + "_approve");
    const { error } = await supabase
      .from("videos")
      .update({ status: "approved", admin_approved: true, rejection_reason: null })
      .eq("id", videoId);

    if (error) {
      toast({ title: "Approval failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content approved", description: "The video is now live on the platform." });
      setVideos(v => v.map(vid => vid.id === videoId
        ? { ...vid, status: "approved", admin_approved: true }
        : vid
      ));
      if (selected?.id === videoId) setSelected(null);
    }
    setActionLoading(null);
  };

  const handleReject = async (videoId: string) => {
    if (!rejectReason.trim()) {
      toast({ title: "Please provide a rejection reason", variant: "destructive" });
      return;
    }
    setActionLoading(videoId + "_reject");
    const { error } = await supabase
      .from("videos")
      .update({ status: "rejected", admin_approved: false, rejection_reason: rejectReason.trim() })
      .eq("id", videoId);

    if (error) {
      toast({ title: "Rejection failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content rejected", description: "The creator will be notified." });
      setVideos(v => v.map(vid => vid.id === videoId
        ? { ...vid, status: "rejected", rejection_reason: rejectReason }
        : vid
      ));
      setRejectReason("");
      setShowRejectForm(false);
      if (selected?.id === videoId) setSelected(null);
    }
    setActionLoading(null);
  };

  const filtered = videos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    (v.genre ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const pending = videos.filter(v => v.status === "pending").length;

  const statusBadge = (status: string) => {
    if (status === "approved") return "bg-emerald/20 text-emerald-bright";
    if (status === "rejected") return "bg-destructive/20 text-destructive";
    return "bg-gold/10 text-gold";
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "approved") return <CheckCircle className="w-3 h-3" />;
    if (status === "rejected") return <X className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="cinzel text-base font-bold text-foreground">Content Approval Queue</h2>
          {pending > 0 && (
            <span className="px-2 py-0.5 bg-gold text-background text-[10px] font-bold rounded-sm animate-pulse">
              {pending} pending
            </span>
          )}
        </div>
        <button
          onClick={fetchVideos}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gold/20 text-gold rounded-sm hover:bg-gold hover:text-background transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-surface-raised rounded-sm border border-gold/10 p-0.5 gap-0.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-bold capitalize transition-all ${
                filter === f ? "gradient-gold text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            placeholder="Search title or genre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-surface-raised border border-gold/10 focus:border-gold/40 rounded-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Video list */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Film className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No content found</p>
            </div>
          ) : (
            filtered.map(video => (
              <div
                key={video.id}
                onClick={() => { setSelected(video); setShowRejectForm(false); setRejectReason(""); }}
                className={`flex items-center gap-4 p-4 rounded-sm border cursor-pointer transition-all duration-200 ${
                  selected?.id === video.id
                    ? "border-gold/40 bg-gold/5"
                    : "border-gold/10 bg-surface hover:border-gold/25 hover:bg-surface-raised"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-20 h-12 rounded-sm bg-surface-overlay flex-shrink-0 overflow-hidden">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{video.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {video.genre && <span className="text-[10px] text-muted-foreground">{video.genre}</span>}
                    {video.age_rating && <span className="text-[10px] px-1 border border-gold/20 text-gold rounded-sm">{video.age_rating}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-1 ${statusBadge(video.status)}`}>
                      <StatusIcon status={video.status} />
                      {video.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {video.monetization_type === "ppv" ? `PPV • $${video.price}` : "Subscription"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Quick actions */}
                {video.status === "pending" && (
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleApprove(video.id)}
                      disabled={actionLoading === video.id + "_approve"}
                      className="w-8 h-8 flex items-center justify-center rounded-sm bg-emerald/10 text-emerald-bright hover:bg-emerald/20 transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      {actionLoading === video.id + "_approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { setSelected(video); setShowRejectForm(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      title="Reject"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="bg-surface border border-gold/10 rounded-sm p-5 h-fit sticky top-0">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="cinzel text-xs font-bold text-foreground">Content Details</h3>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-gold">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {selected.thumbnail_url && (
                <img src={selected.thumbnail_url} alt={selected.title} className="w-full h-28 object-cover rounded-sm" />
              )}

              <div className="space-y-2 divide-y divide-gold/5">
                {[
                  { label: "Title", value: selected.title },
                  { label: "Genre", value: selected.genre ?? "—" },
                  { label: "Age Rating", value: selected.age_rating ?? "—" },
                  { label: "Runtime", value: selected.runtime ?? "—" },
                  { label: "Monetization", value: selected.monetization_type === "ppv" ? `PPV — $${selected.price}` : "Subscription" },
                  { label: "Status", value: selected.status },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5 text-[11px]">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {selected.short_description && (
                <div className="bg-surface-raised rounded-sm p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Description</p>
                  <p className="text-xs text-foreground leading-relaxed">{selected.short_description}</p>
                </div>
              )}

              {selected.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-sm p-3">
                  <p className="text-[10px] font-bold text-destructive mb-1">Rejection Reason</p>
                  <p className="text-[11px] text-foreground">{selected.rejection_reason}</p>
                </div>
              )}

              {/* Action buttons */}
              {selected.status === "pending" && (
                <div className="space-y-2">
                  {!showRejectForm ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApprove(selected.id)}
                        disabled={!!actionLoading}
                        className="flex items-center justify-center gap-1.5 py-2 bg-emerald/20 text-emerald-bright hover:bg-emerald/30 text-xs font-bold rounded-sm transition-all disabled:opacity-50"
                      >
                        {actionLoading === selected.id + "_approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="flex items-center justify-center gap-1.5 py-2 bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs font-bold rounded-sm transition-all"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Reason for rejection (required)…"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-xs bg-surface-raised border border-destructive/30 focus:border-destructive/60 rounded-sm outline-none text-foreground placeholder:text-muted-foreground resize-none"
                        maxLength={500}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                          className="py-2 text-xs border border-gold/15 text-muted-foreground hover:text-foreground rounded-sm transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(selected.id)}
                          disabled={!!actionLoading || !rejectReason.trim()}
                          className="flex items-center justify-center gap-1.5 py-2 bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs font-bold rounded-sm transition-all disabled:opacity-40"
                        >
                          {actionLoading === selected.id + "_reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selected.status === "approved" && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald/10 border border-emerald/20 rounded-sm text-xs text-emerald-bright">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  This content is live on the platform.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-xs text-muted-foreground">Select a video to review details and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContentApproval;
