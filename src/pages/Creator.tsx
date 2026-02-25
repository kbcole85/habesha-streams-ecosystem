import { useState } from "react";
import Navbar from "@/components/Navbar";
import VideoUploadModal from "@/components/VideoUploadModal";
import { useCreatorVideos } from "@/hooks/useCreatorVideos";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Upload, BarChart2, DollarSign, Film,
  ChevronRight, TrendingUp, Eye, Clock, Play, Plus,
  CheckCircle, AlertCircle, ArrowUp, Trash2, RefreshCw,
  Loader2, XCircle, AlertTriangle, Zap,
} from "lucide-react";
import thumb1 from "@/assets/thumb-1.jpg";
import thumb3 from "@/assets/thumb-3.jpg";

const earnings = [
  { month: "Aug", amount: 3240 },
  { month: "Sep", amount: 4120 },
  { month: "Oct", amount: 3890 },
  { month: "Nov", amount: 5280 },
  { month: "Dec", amount: 6134 },
];

const maxEarning = Math.max(...earnings.map((e) => e.amount));

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Upload, label: "Upload Content", id: "upload" },
  { icon: Film, label: "My Content", id: "content" },
  { icon: BarChart2, label: "Analytics", id: "analytics" },
  { icon: DollarSign, label: "Earnings", id: "earnings" },
];

function statusBadge(status: string, encodingStatus: string) {
  if (status === "approved" && encodingStatus === "processing") {
    return { cls: "bg-gold/10 text-gold", icon: Zap, label: "Processing" };
  }
  if (status === "approved" && encodingStatus === "failed") {
    return { cls: "bg-destructive/20 text-destructive", icon: AlertTriangle, label: "Encode Failed" };
  }
  if (status === "approved") {
    return { cls: "bg-emerald/20 text-emerald-bright", icon: CheckCircle, label: "Live" };
  }
  if (status === "rejected") {
    return { cls: "bg-destructive/20 text-destructive", icon: XCircle, label: "Rejected" };
  }
  return { cls: "bg-gold/10 text-gold", icon: Clock, label: "Pending Review" };
}

// ── My Content Tab ────────────────────────────────────────────────────────────
function MyContentTab() {
  const { videos, loading, refetch, deleteVideo } = useCreatorVideos();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteVideo(id);
    setDeletingId(null);
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="cinzel text-base font-bold text-foreground">My Content</h2>
          <p className="text-[10px] text-muted-foreground">{videos.length} title{videos.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gold/20 text-gold rounded-sm hover:bg-gold hover:text-background transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-gold/10 rounded-sm">
          <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="cinzel text-base text-muted-foreground mb-1">No content yet</p>
          <p className="text-xs text-muted-foreground">Upload your first video to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((v) => {
            const badge = statusBadge(v.status, v.encoding_status);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={v.id}
                className="flex flex-col gap-2 p-4 bg-surface border border-gold/10 hover:border-gold/25 rounded-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-12 rounded-sm overflow-hidden flex-shrink-0 bg-surface-raised">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-5 h-5 text-muted-foreground opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                      <Play className="w-4 h-4 text-gold fill-gold" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{v.title}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-0.5">
                      {v.genre && <span className="text-[10px] text-muted-foreground">{v.genre}</span>}
                      {v.runtime && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />{v.runtime}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {v.monetization_type === "ppv" ? `PPV • $${v.price}` : "Subscription"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Submitted {new Date(v.created_at).toLocaleDateString()}
                      {v.published_at && ` · Live ${new Date(v.published_at).toLocaleDateString()}`}
                    </p>
                    {v.rejection_reason && (
                      <p className="text-[10px] text-destructive mt-1 truncate">❌ {v.rejection_reason}</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-sm flex-shrink-0 ${badge.cls}`}>
                    <BadgeIcon className="w-2.5 h-2.5" />
                    {badge.label}
                  </span>

                  {/* Delete */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {confirmDelete === v.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deletingId === v.id}
                          className="px-2 py-1 text-[10px] bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-sm font-bold transition-all disabled:opacity-50"
                        >
                          {deletingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-[10px] border border-gold/15 text-muted-foreground hover:text-foreground rounded-sm transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(v.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Encoding progress bar */}
                {v.encoding_status === "processing" && (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gold font-medium flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 animate-pulse" />
                        Encoding in progress…
                      </span>
                      <span className="text-[10px] text-muted-foreground">{v.processing_progress ?? 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-gold rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(5, v.processing_progress ?? 0)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Creator Page ─────────────────────────────────────────────────────────
const Creator = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showUpload, setShowUpload] = useState(false);

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "Creator";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-52 bg-surface border-r border-gold/10 fixed left-0 top-16 bottom-0 z-30">
          <div className="p-4 border-b border-gold/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
                <span className="text-[10px] font-bold text-background">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground truncate max-w-[100px]">{displayName}</p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-2.5 h-2.5 text-emerald-bright" />
                  <span className="text-[10px] text-emerald-bright">Verified Creator</span>
                </div>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id === "upload" ? setShowUpload(true) : setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gold/10 border border-gold/30 text-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gold/10">
            <div className="bg-surface-raised border border-gold/10 rounded-sm p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Revenue Share</p>
              <p className="cinzel text-lg font-bold text-gold">70%</p>
              <p className="text-[10px] text-muted-foreground">of net revenue</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 lg:ml-52 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="cinzel text-2xl font-bold text-foreground">Creator Dashboard</h1>
              <p className="text-xs text-muted-foreground">Welcome back, {displayName}</p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Upload Content
            </button>
          </div>

          {/* My Content Tab */}
          {activeTab === "content" && <MyContentTab />}

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Views", value: "21,840", change: "+18.4%", icon: Eye },
                  { label: "This Month Earned", value: "$6,134", change: "+16.2%", icon: DollarSign },
                  { label: "Watch Hours", value: "3,840h", change: "+22%", icon: Clock },
                  { label: "Published Content", value: "14", change: "+2 this month", icon: Film },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface border border-gold/10 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="w-4 h-4 text-gold" />
                      <span className="text-[10px] text-emerald-bright font-bold flex items-center gap-0.5">
                        <ArrowUp className="w-2.5 h-2.5" />{stat.change}
                      </span>
                    </div>
                    <p className="cinzel text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Earnings Chart */}
                <div className="lg:col-span-2 bg-surface border border-gold/10 rounded-sm p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="cinzel text-sm font-bold text-foreground">Monthly Earnings</h2>
                    <div className="flex items-center gap-1 text-xs text-emerald-bright">
                      <TrendingUp className="w-3 h-3" />
                      <span>+16.2% vs last month</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 h-32">
                    {earnings.map((e, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">${(e.amount / 1000).toFixed(1)}k</span>
                        <div
                          className="w-full rounded-sm transition-all duration-500 relative group"
                          style={{
                            height: `${(e.amount / maxEarning) * 90}%`,
                            background: i === earnings.length - 1
                              ? "linear-gradient(180deg, hsl(42, 88%, 62%), hsl(42, 88%, 38%))"
                              : "hsl(var(--surface-overlay))",
                            border: "1px solid hsla(42, 88%, 48%, 0.2)"
                          }}
                        >
                          {i === earnings.length - 1 && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground">{e.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payout Panel */}
                <div className="bg-surface border border-gold/10 rounded-sm p-5">
                  <h2 className="cinzel text-sm font-bold text-foreground mb-4">Payout Center</h2>
                  <div className="text-center py-4 mb-4 bg-surface-raised rounded-sm border border-gold/10">
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                    <p className="cinzel text-3xl font-black text-gold">$4,268</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Next payout: Jan 15</p>
                  </div>
                  <button className="w-full py-3 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all mb-3">
                    Request Withdrawal
                  </button>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Last Payout</span>
                      <span className="text-emerald-bright font-medium">$3,890 paid</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Revenue Share</span>
                      <span className="text-gold font-medium">70%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span className="text-muted-foreground">30%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick My Content preview */}
              <div className="bg-surface border border-gold/10 rounded-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
                  <h2 className="cinzel text-sm font-bold text-foreground">Recent Content</h2>
                  <button
                    onClick={() => setActiveTab("content")}
                    className="text-xs text-gold hover:text-gold-bright"
                  >
                    View All
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { title: "Yewedaj Mistir", status: "approved", views: 12840, revenue: 2456, duration: "2h 18m", image: thumb1 },
                    { title: "Genet", status: "approved", views: 8120, revenue: 1678, duration: "1h 52m", image: thumb3 },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-surface-raised rounded-sm border border-gold/5 hover:border-gold/20 transition-all group">
                      <div className="relative w-16 h-10 rounded-sm overflow-hidden flex-shrink-0">
                        <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{c.duration}</span>
                          <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{c.views.toLocaleString()} views</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gold">${c.revenue.toLocaleString()}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald/20 text-emerald-bright">
                          live
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Analytics Tab placeholder */}
          {activeTab === "analytics" && (
            <div className="text-center py-20 bg-surface border border-gold/10 rounded-sm">
              <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="cinzel text-base text-muted-foreground">Analytics coming soon</p>
            </div>
          )}

          {/* Earnings Tab placeholder */}
          {activeTab === "earnings" && (
            <div className="text-center py-20 bg-surface border border-gold/10 rounded-sm">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="cinzel text-base text-muted-foreground">Earnings detail coming soon</p>
            </div>
          )}
        </main>
      </div>

      {showUpload && (
        <VideoUploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setActiveTab("content"); }}
        />
      )}
    </div>
  );
};

export default Creator;
