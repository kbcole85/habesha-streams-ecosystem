import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  User, CreditCard, Clock, Bookmark, Monitor, Bell,
  Shield, LogOut, Edit, ChevronRight, Play, Star,
  Check, AlertCircle, Smartphone, Tv, Laptop,
  Crown, Zap, Settings, RefreshCw, Loader2, Link as LinkIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

const watchHistory = [
  { title: "Axum Chronicles", progress: 78, image: thumb2, episode: "Full Movie" },
  { title: "Yewedaj Mistir", progress: 45, image: thumb1, episode: "Full Movie" },
  { title: "Addis Nights", progress: 100, image: thumb6, episode: "S2 E4" },
  { title: "Simien Heights", progress: 30, image: thumb4, episode: "Full Movie" },
];

const watchlist = [
  { title: "Genet", year: 2024, image: thumb3 },
  { title: "Tizita Nights", year: 2024, image: thumb5 },
  { title: "Axum Rising", year: 2024, image: thumb2 },
];

const devices = [
  { name: "MacBook Pro", type: "laptop", lastSeen: "Now • Active", current: true },
  { name: "iPhone 15 Pro", type: "phone", lastSeen: "2 hours ago", current: false },
  { name: "Samsung TV", type: "tv", lastSeen: "Yesterday", current: false },
];

const tabs = [
  { icon: User, label: "Account", id: "account" },
  { icon: CreditCard, label: "Subscription", id: "subscription" },
  { icon: Clock, label: "History", id: "history" },
  { icon: Bookmark, label: "Watchlist", id: "watchlist" },
  { icon: Monitor, label: "Devices", id: "devices" },
  { icon: Bell, label: "Notifications", id: "notifications" },
  { icon: Shield, label: "Privacy & Security", id: "security" },
];

// ─── SubscriptionTab component ────────────────────────────────────────────────
// Removed multi-tier PLAN_DETAILS — single $5/month plan

const SubscriptionTab = ({
  isSubscribed,
  subscriptionEnd,
  checkSubscription,
}: {
  isSubscribed: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
}) => {
  const [portalLoading, setPortalLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast({ title: "Billing portal error", description: String(err), variant: "destructive" });
    }
    setPortalLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast({ title: "Subscription status refreshed" });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Current plan card */}
      <div className={`bg-surface border rounded-sm p-6 relative overflow-hidden ${isSubscribed ? "border-gold shadow-gold" : "border-gold/20"}`}>
        {isSubscribed && (
          <div className="absolute top-3 right-3 px-2 py-0.5 gradient-gold text-background text-[10px] font-bold rounded-sm">ACTIVE</div>
        )}
        {isSubscribed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 gradient-gold rounded-sm flex items-center justify-center">
                <Star className="w-4 h-4 text-background" />
              </div>
              <div>
                <h2 className="cinzel text-lg font-bold text-gold">Habesha Streams</h2>
                <p className="text-xs text-muted-foreground">Full access · Up to 4K · 5 devices</p>
              </div>
            </div>
            <div className="flex items-end gap-1 mb-4">
              <span className="cinzel text-3xl font-black text-foreground">$5</span>
              <span className="text-muted-foreground text-sm mb-1">/mo</span>
            </div>
            {subscriptionEnd && (
              <div className="text-xs text-muted-foreground border-t border-gold/10 pt-4 mb-4">
                <p>Next billing: <span className="text-foreground font-medium">{new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></p>
                <p className="mt-0.5">Renews automatically · Monthly plan</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex-1 py-2 border border-gold/30 text-gold text-xs rounded-sm hover:bg-gold hover:text-background transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                Manage Billing
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="cinzel text-lg font-bold text-foreground mb-2">No Active Subscription</h2>
            <p className="text-xs text-muted-foreground mb-6">Subscribe for $5/month to unlock the full Habesha Streams library.</p>
            <Link
              to="/plans"
              className="block w-full py-3 gradient-gold text-background text-sm font-bold rounded-sm text-center hover:opacity-90 transition-all shadow-gold"
            >
              Subscribe — $5/month
            </Link>
          </>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-muted-foreground hover:text-gold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Checking…" : "Refresh subscription status"}
        </button>
      </div>

      {/* Simple info */}
      <div className="bg-surface border border-gold/10 rounded-sm p-4">
        <p className="text-xs text-muted-foreground text-center">
          Manage your billing anytime via{" "}
          <button onClick={handlePortal} className="text-gold hover:underline">Billing Portal</button>
        </p>
      </div>
    </div>
  );
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState("account");
  const { user, profile, isSubscribed, subscriptionEnd, checkSubscription, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === "phone") return <Smartphone className="w-4 h-4" />;
    if (type === "tv") return <Tv className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const planLabel = isSubscribed ? "SUBSCRIBER" : "FREE";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-0 px-6 md:px-12 bg-surface border-b border-gold/10">
        {/* Profile Header */}
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 pb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center text-2xl font-black text-background cinzel">
              {avatarLetter}
            </div>
            <button className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface-raised border border-gold/30 rounded-full flex items-center justify-center hover:border-gold/60 transition-colors">
              <Edit className="w-2.5 h-2.5 text-gold" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="cinzel text-2xl font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-sm text-[10px] text-gold font-bold">
                <Star className="w-2.5 h-2.5 fill-gold" />
                {planLabel}
              </span>
              {memberSince && (
                <span className="text-[10px] text-muted-foreground">Member since {memberSince}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-sm text-xs transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-gold text-gold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gold/30"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-8">
        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-gold/10 rounded-sm p-6">
              <h2 className="cinzel text-sm font-bold text-foreground mb-4">Personal Information</h2>
              <div className="space-y-4">
                {[
                  { label: "Full Name", value: "Mikiyas Tesfaye" },
                  { label: "Email", value: "mikiyas@example.com" },
                  { label: "Phone", value: "+1 (555) 234-5678" },
                  { label: "Language", value: "English / አማርኛ" },
                  { label: "Country", value: "United States 🇺🇸" },
                ].map((field, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gold/5 last:border-0">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{field.label}</p>
                      <p className="text-sm text-foreground">{field.value}</p>
                    </div>
                    <button className="text-gold text-xs hover:text-gold-bright transition-colors">Edit</button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2.5 gradient-gold text-background text-xs font-bold rounded-sm hover:opacity-90 transition-all">
                Save Changes
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-surface border border-gold/10 rounded-sm p-6">
                <h2 className="cinzel text-sm font-bold text-foreground mb-4">Parental Controls</h2>
                <div className="space-y-3">
                  {["Enable Parental Controls", "Restrict Mature Content (18+)", "PIN Protection"].map((opt, i) => (
                    <label key={i} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-foreground">{opt}</span>
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${i === 0 ? "bg-gold" : "bg-surface-overlay"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${i === 0 ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-gold/10 rounded-sm p-6">
                <h2 className="cinzel text-sm font-bold text-foreground mb-4">Streaming Quality</h2>
                <div className="space-y-2">
                  {["Auto (Recommended)", "4K Ultra HD", "Full HD (1080p)", "HD (720p)", "Standard (480p)"].map((q, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-3.5 h-3.5 rounded-full border ${i === 0 ? "border-gold bg-gold" : "border-gold/30"}`} />
                      <span className="text-sm text-foreground">{q}</span>
                      {i === 0 && <span className="text-[10px] text-emerald-bright ml-auto">ACTIVE</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <SubscriptionTab isSubscribed={isSubscribed} subscriptionEnd={subscriptionEnd} checkSubscription={checkSubscription} />
        )}
        {activeTab === "subscription" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-gold rounded-sm p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2 py-0.5 gradient-gold text-background text-[10px] font-bold rounded-sm">ACTIVE</div>
              <h2 className="cinzel text-lg font-bold text-gold mb-1">Premium Plan</h2>
              <p className="text-xs text-muted-foreground mb-4">4K streaming • 5 devices • All features</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="cinzel text-4xl font-black text-foreground">$15.99</span>
                <span className="text-muted-foreground text-sm mb-1">/month</span>
              </div>
              <div className="space-y-2 mb-6">
                {["4K Ultra HD + Dolby Atmos", "5 simultaneous screens", "Offline downloads", "Early access to releases", "Priority support"].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-bright flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground border-t border-gold/10 pt-4">
                <p>Next billing: <span className="text-foreground font-medium">February 15, 2025</span></p>
                <p className="mt-0.5">Renews automatically • Annual plan</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2 border border-gold/20 text-gold text-xs rounded-sm hover:border-gold/50 transition-colors">Change Plan</button>
                <button className="flex-1 py-2 border border-destructive/20 text-destructive text-xs rounded-sm hover:bg-destructive/10 transition-colors">Cancel</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-surface border border-gold/10 rounded-sm p-5">
                <h3 className="cinzel text-sm font-bold text-foreground mb-4">Payment Method</h3>
                <div className="flex items-center gap-3 p-3 bg-surface-raised rounded-sm border border-gold/10">
                  <div className="w-8 h-6 bg-secondary rounded-sm flex items-center justify-center">
                    <span className="text-secondary-foreground text-[8px] font-bold">VISA</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">•••• •••• •••• 4242</p>
                    <p className="text-[10px] text-muted-foreground">Expires 12/27</p>
                  </div>
                  <button className="text-xs text-gold hover:text-gold-bright">Update</button>
                </div>
                <button className="mt-3 w-full py-2 border border-dashed border-gold/20 text-muted-foreground hover:text-gold hover:border-gold/40 rounded-sm text-xs transition-all">
                  + Add Payment Method
                </button>
              </div>

              <div className="bg-surface border border-gold/10 rounded-sm p-5">
                <h3 className="cinzel text-sm font-bold text-foreground mb-4">Billing History</h3>
                <div className="space-y-2">
                  {[
                    { date: "Jan 15, 2025", amount: "$12.99", status: "Paid" },
                    { date: "Dec 15, 2024", amount: "$12.99", status: "Paid" },
                    { date: "Nov 15, 2024", amount: "$12.99", status: "Paid" },
                  ].map((inv, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-gold/5 last:border-0">
                      <span className="text-muted-foreground">{inv.date}</span>
                      <span className="text-foreground font-medium">{inv.amount}</span>
                      <span className="text-emerald-bright">{inv.status}</span>
                      <button className="text-gold hover:text-gold-bright">Receipt</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div>
            <h2 className="cinzel text-lg font-bold text-foreground mb-4">Continue Watching</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchHistory.map((item, i) => (
                <div key={i} className="group flex items-center gap-4 bg-surface border border-gold/10 hover:border-gold/30 rounded-sm p-3 transition-all cursor-pointer">
                  <div className="relative w-24 h-14 rounded-sm overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                      <Play className="w-6 h-6 text-gold fill-gold" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{item.episode}</p>
                    <div className="h-1 bg-surface-overlay rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-gold rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{item.progress}% watched</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WATCHLIST TAB */}
        {activeTab === "watchlist" && (
          <div>
            <h2 className="cinzel text-lg font-bold text-foreground mb-4">My Watchlist</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchlist.map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-[2/3] rounded-sm overflow-hidden mb-2">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                      <Play className="w-8 h-8 text-gold fill-gold" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEVICES TAB */}
        {activeTab === "devices" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="cinzel text-lg font-bold text-foreground">Linked Devices</h2>
              <span className="text-xs text-muted-foreground">3 / 5 devices used</span>
            </div>
            <div className="space-y-3 mb-6">
              {devices.map((d, i) => {
                const DevIcon = d.type === "phone" ? Smartphone : d.type === "tv" ? Tv : Laptop;
                return (
                  <div key={i} className={`flex items-center gap-4 bg-surface border rounded-sm p-4 ${d.current ? "border-gold/40" : "border-gold/10"}`}>
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${d.current ? "gradient-gold" : "bg-surface-raised border border-border"}`}>
                      <DevIcon className={`w-4 h-4 ${d.current ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {d.name}
                        {d.current && <span className="text-[9px] px-1.5 py-0.5 bg-emerald/20 text-emerald-bright rounded-sm">THIS DEVICE</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{d.lastSeen}</p>
                    </div>
                    {!d.current && (
                      <button className="text-xs text-destructive border border-destructive/20 px-3 py-1.5 rounded-sm hover:bg-destructive/10 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="bg-surface border border-gold/10 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-gold" />
                <h3 className="cinzel text-xs font-bold text-foreground">Concurrent Stream Limit</h3>
              </div>
              <p className="text-xs text-muted-foreground">Your Premium plan allows up to 5 simultaneous streams. You are currently using 1.</p>
              <div className="mt-3 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                <div className="h-full w-1/5 gradient-gold rounded-full" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">1 of 5 streams active</p>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-gold/10 rounded-sm p-6">
              <h2 className="cinzel text-sm font-bold text-foreground mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div className="p-3 bg-surface-raised rounded-sm border border-gold/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">Two-Factor Authentication</span>
                    <div className="w-10 h-5 bg-gold rounded-full relative">
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Enabled via SMS • +1 (555) •••-5678</p>
                </div>
                <button className="w-full py-2.5 text-sm border border-gold/20 text-gold hover:border-gold/50 rounded-sm transition-colors">
                  Change Password
                </button>
                <button className="w-full py-2.5 text-sm border border-gold/20 text-gold hover:border-gold/50 rounded-sm transition-colors">
                  View Login History
                </button>
                <button className="w-full py-2.5 text-sm border border-destructive/20 text-destructive hover:bg-destructive/10 rounded-sm transition-colors">
                  Sign Out All Devices
                </button>
              </div>
            </div>
            <div className="bg-surface border border-gold/10 rounded-sm p-6">
              <h2 className="cinzel text-sm font-bold text-foreground mb-4">Privacy Controls</h2>
              <div className="space-y-4">
                {[
                  { label: "Share watch history for recommendations", enabled: true },
                  { label: "Allow personalized ads", enabled: false },
                  { label: "Email notifications", enabled: true },
                  { label: "Push notifications", enabled: true },
                  { label: "Marketing emails", enabled: false },
                ].map((opt, i) => (
                  <label key={i} className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-sm text-foreground pr-4">{opt.label}</span>
                    <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${opt.enabled ? "bg-gold" : "bg-surface-overlay"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${opt.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gold/10">
                <button className="text-xs text-destructive hover:text-destructive/70 transition-colors">Delete Account</button>
                <p className="text-[10px] text-muted-foreground mt-1">This will permanently delete all your data.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
