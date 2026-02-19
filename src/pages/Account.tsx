import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  User, CreditCard, Clock, Bookmark, Monitor, Bell,
  Shield, LogOut, Edit, Play, Star, Check, AlertCircle,
  Smartphone, Tv, Laptop, Settings, RefreshCw, Loader2,
  Trash2, X, Plus, Download, Eye, EyeOff, Lock, Key,
  ChevronRight, ChevronDown, Camera, Phone, Globe, Calendar,
  FileText, RotateCcw, Film, List, Grid, Search, Filter,
  TriangleAlert, CheckCircle2, ShieldCheck, Mail, HelpCircle,
  Baby, Volume2, CreditCard as PayCard, Receipt, History,
  Wallet, Activity
} from "lucide-react";
import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";
import thumb7 from "@/assets/thumb-7.jpg";
import thumb8 from "@/assets/thumb-8.jpg";

// ─── Single $5/month plan config ─────────────────────────────────────────────
const MONTHLY_PLAN = {
  priceId: "price_1T2VdG3FkY3jsYkVxnQVPki5", // update with actual $5 price ID
  name: "Habesha Streams Monthly",
  price: 5.00,
  currency: "USD",
  interval: "month",
  features: [
    "Access to full subscription library",
    "Up to 4K Ultra HD quality",
    "Stream on up to 5 devices",
    "Mobile, Web & TV apps",
    "Download to watch offline",
    "East African cinema & TV",
  ],
};

// ─── Nav tabs ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "subscription", icon: CreditCard, label: "Subscription" },
  { id: "payment", icon: Wallet, label: "Payment Methods" },
  { id: "purchases", icon: Receipt, label: "Purchase History" },
  { id: "history", icon: Clock, label: "Watch History" },
  { id: "watchlist", icon: Bookmark, label: "My Watchlist" },
  { id: "continue", icon: Play, label: "Continue Watching" },
  { id: "devices", icon: Monitor, label: "Devices" },
  { id: "parental", icon: Baby, label: "Parental Controls" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "billing", icon: FileText, label: "Billing History" },
  { id: "security", icon: Shield, label: "Account Security" },
  { id: "delete", icon: Trash2, label: "Delete Account" },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_DEVICES = [
  { id: "1", name: "MacBook Pro", type: "laptop", lastSeen: "Now · Active", current: true, location: "New York, US" },
  { id: "2", name: "iPhone 15 Pro", type: "phone", lastSeen: "2 hours ago", current: false, location: "New York, US" },
  { id: "3", name: "Samsung TV", type: "tv", lastSeen: "Yesterday", current: false, location: "New York, US" },
];

const MOCK_WATCHLIST = [
  { id: "1", title: "Genet", year: 2024, image: thumb3, genre: "Drama", runtime: "1h 52m" },
  { id: "2", title: "Tizita Nights", year: 2024, image: thumb5, genre: "Romance", runtime: "2h 04m" },
  { id: "3", title: "Axum Rising", year: 2024, image: thumb2, genre: "Historical", runtime: "1h 48m" },
  { id: "4", title: "Simien Heights", year: 2023, image: thumb4, genre: "Adventure", runtime: "1h 38m" },
];

const MOCK_HISTORY = [
  { id: "1", title: "Axum Chronicles", progress: 78, image: thumb2, watchedAt: "Today", timeRemaining: "22 min left" },
  { id: "2", title: "Yewedaj Mistir", progress: 45, image: thumb1, watchedAt: "Yesterday", timeRemaining: "55 min left" },
  { id: "3", title: "Addis Nights", progress: 100, image: thumb6, watchedAt: "3 days ago", timeRemaining: "Completed" },
  { id: "4", title: "Simien Heights", progress: 30, image: thumb4, watchedAt: "1 week ago", timeRemaining: "1h 10m left" },
];

const MOCK_PURCHASES = [
  { id: "1", title: "Lalibela: The Sacred City", date: "Jan 20, 2026", price: "$4.99", status: "Watched", image: thumb7, type: "PPV" },
  { id: "2", title: "Adwa: The Victory", date: "Dec 10, 2025", price: "$3.99", status: "Available", image: thumb8, type: "PPV" },
];

const MOCK_BILLING = [
  { id: "INV-2026-001", date: "Feb 1, 2026", description: "Monthly Subscription", amount: "$5.00", status: "Paid" },
  { id: "INV-2026-002", date: "Jan 1, 2026", description: "Monthly Subscription", amount: "$5.00", status: "Paid" },
  { id: "INV-2025-012", date: "Dec 1, 2025", description: "Monthly Subscription", amount: "$5.00", status: "Paid" },
  { id: "INV-2025-011", date: "Nov 1, 2025", description: "Monthly Subscription", amount: "$5.00", status: "Paid" },
];

const MOCK_ACTIVITY = [
  { device: "MacBook Pro", location: "New York, US", ip: "76.xxx.xxx.12", time: "Just now", status: "success" },
  { device: "iPhone 15 Pro", location: "New York, US", ip: "76.xxx.xxx.12", time: "2 hours ago", status: "success" },
  { device: "Unknown Device", location: "Lagos, NG", ip: "197.xxx.xxx.45", time: "3 days ago", status: "blocked" },
];

// ─── Toggle component ─────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-gold" : "bg-surface-overlay border border-border"}`}
  >
    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="cinzel text-xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-surface border border-gold/10 rounded-sm p-5 ${className}`}>{children}</div>
);

// ─── Device icon ──────────────────────────────────────────────────────────────
const DevIcon = ({ type }: { type: string }) => {
  if (type === "phone") return <Smartphone className="w-4 h-4" />;
  if (type === "tv") return <Tv className="w-4 h-4" />;
  return <Laptop className="w-4 h-4" />;
};

// ─── Confirm modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, title, description, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }: {
  open: boolean; title: string; description: string;
  confirmLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="bg-surface border border-gold/20 rounded-sm p-6 max-w-sm w-full shadow-card">
        <h3 className="cinzel text-base font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gold/20 text-foreground text-sm rounded-sm hover:border-gold/40 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-bold rounded-sm transition-all ${danger
              ? "bg-destructive text-destructive-foreground hover:opacity-90"
              : "gradient-gold text-primary-foreground hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Profile Tab ───────────────────────────────────────────────────────────
const ProfileTab = ({ user, profile, refreshProfile }: { user: any; profile: any; refreshProfile: () => Promise<void> }) => {
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("English");
  const [region, setRegion] = useState("United States");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleCancel = () => {
    setDisplayName(profile?.display_name ?? "");
    setPhone("");
    setLanguage("English");
    setRegion("United States");
    toast({ title: "Changes cancelled" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" });
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({ title: "Password too short", description: "Must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password changed", description: "Your password has been updated." });
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (err) {
      toast({ title: "Failed", description: String(err), variant: "destructive" });
    }
    setChangingPassword(false);
  };

  const avatarLetter = (profile?.display_name ?? user?.email ?? "U").charAt(0).toUpperCase();

  return (
    <div>
      <SectionHeader title="Profile Information" subtitle="Manage your personal details and preferences" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Personal Info */}
        <Card>
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gold/10">
            <div className="relative">
              <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center text-2xl font-black text-primary-foreground cinzel">
                {avatarLetter}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-surface-raised border border-gold/30 rounded-full flex items-center justify-center hover:border-gold/60 transition-colors">
                <Camera className="w-3 h-3 text-gold" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{profile?.display_name ?? "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <button className="text-[10px] text-gold hover:text-gold-bright mt-1">Change photo</button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Full Name *</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40 transition-colors"
                placeholder="Your full name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Email Address</label>
              <div className="flex items-center gap-2">
                <input
                  value={user?.email ?? ""}
                  disabled
                  className="flex-1 bg-surface-overlay border border-gold/5 rounded-sm px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
                <button className="text-xs text-gold hover:text-gold-bright whitespace-nowrap">Change</button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Email changes require verification</p>
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Phone Number</label>
              <div className="flex gap-2">
                <select className="bg-surface-raised border border-gold/10 rounded-sm px-2 text-xs text-muted-foreground w-20 focus:outline-none">
                  <option>+1</option><option>+44</option><option>+251</option><option>+61</option>
                </select>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="flex-1 bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40 transition-colors"
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Language Preference</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40 transition-colors"
              >
                <option>English</option>
                <option>አማርኛ (Amharic)</option>
                <option>ትግርኛ (Tigrinya)</option>
                <option>Afaan Oromoo</option>
                <option>Soomaali</option>
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Region / Country</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40 transition-colors"
              >
                <option>United States 🇺🇸</option>
                <option>United Kingdom 🇬🇧</option>
                <option>Canada 🇨🇦</option>
                <option>Ethiopia 🇪🇹</option>
                <option>Australia 🇦🇺</option>
                <option>Germany 🇩🇪</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-5 pt-4 border-t border-gold/10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 gradient-gold text-primary-foreground text-sm font-bold rounded-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Changes
            </button>
            <button onClick={handleCancel} className="px-4 py-2.5 border border-gold/20 text-muted-foreground text-sm rounded-sm hover:border-gold/40 transition-colors">
              Cancel
            </button>
          </div>
        </Card>

        {/* Right: Password & Account */}
        <div className="space-y-4">
          <Card>
            <h3 className="cinzel text-sm font-bold text-foreground mb-4">Password & Security</h3>
            <p className="text-xs text-muted-foreground mb-4">Last changed: Never</p>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-2.5 border border-gold/20 text-gold text-sm rounded-sm hover:border-gold/40 hover:bg-gold/5 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              Reset Password
            </button>
          </Card>

          <Card>
            <h3 className="cinzel text-sm font-bold text-foreground mb-4">Member Since</h3>
            <p className="text-sm text-foreground">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "N/A"
              }
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-bright" />
              <p className="text-xs text-emerald-bright font-medium">Account Active</p>
            </div>
          </Card>

          <Card>
            <h3 className="cinzel text-sm font-bold text-foreground mb-3">Date of Birth</h3>
            <p className="text-xs text-muted-foreground mb-3">Used for age verification and content restrictions</p>
            <input
              type="date"
              className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40 transition-colors"
            />
          </Card>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-surface border border-gold/20 rounded-sm p-6 max-w-sm w-full shadow-card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="cinzel text-base font-bold text-foreground">Reset Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground pr-10 focus:outline-none focus:border-gold/40"
                  />
                  <button onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2.5 border border-gold/20 text-sm text-foreground rounded-sm hover:border-gold/40">Cancel</button>
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="flex-1 py-2.5 gradient-gold text-primary-foreground text-sm font-bold rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── 2. Subscription Tab ──────────────────────────────────────────────────────
const SubscriptionTab = ({ stripeSubscription, checkSubscription }: { stripeSubscription: any; checkSubscription: () => Promise<void> }) => {
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const isActive = stripeSubscription.subscribed;

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

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: MONTHLY_PLAN.priceId, planName: "monthly" },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast({ title: "Checkout failed", description: String(err), variant: "destructive" });
    }
    setCheckoutLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast({ title: "Status refreshed" });
  };

  return (
    <div>
      <SectionHeader
        title="Subscription Management"
        subtitle="Manage your Habesha Streams monthly plan"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Card */}
        <div className={`bg-surface border-2 rounded-sm p-6 relative overflow-hidden transition-all ${isActive ? "border-gold shadow-gold" : "border-gold/20"}`}>
          {isActive && (
            <div className="absolute top-3 right-3 px-2 py-0.5 gradient-gold text-primary-foreground text-[10px] font-bold rounded-sm">ACTIVE</div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 gradient-gold rounded-sm flex items-center justify-center">
              <Star className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
            </div>
            <div>
              <h3 className="cinzel text-base font-bold text-gold">{MONTHLY_PLAN.name}</h3>
              <p className="text-xs text-muted-foreground">All content · Up to 4K · 5 devices</p>
            </div>
          </div>

          <div className="flex items-end gap-1 mb-5">
            <span className="cinzel text-4xl font-black text-foreground">${MONTHLY_PLAN.price}</span>
            <span className="text-muted-foreground text-sm mb-1">/month</span>
          </div>

          <ul className="space-y-2 mb-5">
            {MONTHLY_PLAN.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-emerald-bright flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {isActive ? (
            <>
              {stripeSubscription.subscription_end && (
                <div className="text-xs text-muted-foreground border-t border-gold/10 pt-4 mb-4 space-y-1">
                  <div className="flex justify-between">
                    <span>Next billing date</span>
                    <span className="text-foreground font-medium">
                      {new Date(stripeSubscription.subscription_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span className="text-foreground font-medium">${MONTHLY_PLAN.price} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-renewal</span>
                    <span className="text-emerald-bright font-medium">On</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="flex-1 py-2.5 border border-gold/30 text-gold text-xs rounded-sm hover:bg-gold/5 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                  Manage Billing
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 py-2.5 border border-destructive/20 text-destructive text-xs rounded-sm hover:bg-destructive/10 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full py-3 gradient-gold text-primary-foreground text-sm font-bold rounded-sm hover:opacity-90 transition-all shadow-gold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Subscribe — $5/month
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-muted-foreground hover:text-gold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Checking…" : "Refresh subscription status"}
          </button>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card>
            <h3 className="cinzel text-sm font-bold text-foreground mb-3">What's Included</h3>
            <div className="space-y-3">
              {[
                { icon: Film, label: "Full Library Access", desc: "500+ East African films & series" },
                { icon: Monitor, label: "Multi-Device", desc: "Stream on up to 5 devices simultaneously" },
                { icon: Download, label: "Offline Downloads", desc: "Download content to watch anywhere" },
                { icon: Star, label: "4K Quality", desc: "Crystal clear picture on all content" },
              ].map(({ icon: Icon, label, desc }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="cinzel text-sm font-bold text-foreground mb-3">PPV Content</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Exclusive premieres and special events are available as Pay-Per-View purchases, separate from your subscription.
            </p>
            <a href="/browse" className="text-xs text-gold hover:text-gold-bright flex items-center gap-1">
              Browse PPV Content <ChevronRight className="w-3 h-3" />
            </a>
          </Card>

          <Card>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Payment Policy</p>
                <p className="text-[10px] text-muted-foreground">
                  Failed payments are retried 3 times over 5 days. A 7-day grace period applies before access is revoked.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-surface border border-gold/20 rounded-sm p-6 max-w-sm w-full shadow-card">
            <h3 className="cinzel text-base font-bold text-foreground mb-2">Cancel Subscription?</h3>
            <p className="text-sm text-muted-foreground mb-4">You'll keep access until the end of your billing period.</p>
            <div className="mb-4">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Reason (optional)</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none"
              >
                <option value="">Select a reason</option>
                <option>Too expensive</option>
                <option>Not enough content</option>
                <option>Technical issues</option>
                <option>Switching to another service</option>
                <option>Temporary pause</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 border border-gold/20 text-sm text-foreground rounded-sm hover:border-gold/40">Keep Plan</button>
              <button
                onClick={() => { handlePortal(); setShowCancelModal(false); }}
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground text-sm font-bold rounded-sm hover:opacity-90"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── 3. Payment Methods Tab ───────────────────────────────────────────────────
const PaymentMethodsTab = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const mockMethods = [
    { id: "1", brand: "Visa", last4: "4242", expiry: "12/27", isDefault: true },
    { id: "2", brand: "Mastercard", last4: "5555", expiry: "09/26", isDefault: false },
  ];

  const brandColor = (brand: string) => brand === "Visa" ? "bg-blue-900/50 text-blue-300" : brand === "Mastercard" ? "bg-red-900/40 text-red-300" : "bg-surface-overlay text-muted-foreground";

  return (
    <div>
      <SectionHeader
        title="Payment Methods"
        subtitle="Manage your saved payment methods"
        action={
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 text-xs text-gold border border-gold/30 px-3 py-1.5 rounded-sm hover:border-gold/60 transition-colors">
            <Plus className="w-3 h-3" /> Add Method
          </button>
        }
      />

      <div className="max-w-xl space-y-4">
        {mockMethods.map(m => (
          <Card key={m.id} className="flex items-center gap-4">
            <div className={`w-12 h-8 rounded-sm flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${brandColor(m.brand)}`}>
              {m.brand.toUpperCase().slice(0, 4)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{m.brand} •••• {m.last4}</p>
              <p className="text-xs text-muted-foreground">Expires {m.expiry}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {m.isDefault && (
                <span className="text-[10px] px-2 py-0.5 bg-gold/10 border border-gold/20 text-gold rounded-sm">DEFAULT</span>
              )}
              {!m.isDefault && (
                <button className="text-[10px] text-muted-foreground hover:text-gold border border-gold/10 px-2 py-0.5 rounded-sm hover:border-gold/30 transition-colors">
                  Set Default
                </button>
              )}
              <button
                onClick={() => setRemovingId(m.id)}
                className="text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}

        {/* Add method form */}
        {showAdd && (
          <Card className="border-gold/20">
            <h3 className="cinzel text-sm font-bold text-foreground mb-4">Add Payment Method</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Card Number</label>
                <input placeholder="1234 5678 9012 3456" className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Cardholder Name</label>
                <input placeholder="Name on card" className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Expiry (MM/YY)</label>
                  <input placeholder="MM/YY" className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">CVV</label>
                  <input type="password" placeholder="•••" maxLength={4} className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3 text-gold" /> Secured by Stripe · PCI DSS Compliant
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gold/20 text-sm text-muted-foreground rounded-sm hover:border-gold/40">Cancel</button>
                <button className="flex-1 py-2 gradient-gold text-primary-foreground text-sm font-bold rounded-sm hover:opacity-90">Add Card</button>
              </div>
            </div>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Payment management is handled securely via{" "}
          <button onClick={async () => {
            const { data } = await supabase.functions.invoke("customer-portal");
            if (data?.url) window.open(data.url, "_blank");
          }} className="text-gold hover:underline">Stripe Billing Portal</button>
        </p>
      </div>

      <ConfirmModal
        open={!!removingId}
        title="Remove Payment Method"
        description="Are you sure you want to remove this card? This cannot be undone."
        confirmLabel="Remove"
        danger
        onConfirm={() => { toast({ title: "Card removed" }); setRemovingId(null); }}
        onCancel={() => setRemovingId(null)}
      />
    </div>
  );
};

// ─── 4. Purchase History Tab ──────────────────────────────────────────────────
const PurchaseHistoryTab = () => {
  const [search, setSearch] = useState("");

  const filtered = MOCK_PURCHASES.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Purchase History" subtitle="Your PPV purchases and subscription payments" />
      <div className="space-y-6">
        {/* PPV Purchases */}
        <div>
          <h3 className="cinzel text-sm font-bold text-foreground mb-3">PPV Purchases</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search purchases…"
              className="w-full bg-surface-raised border border-gold/10 rounded-sm pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="text-center py-8">
              <Film className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No PPV purchases found</p>
              <a href="/browse" className="text-xs text-gold hover:text-gold-bright mt-2 inline-block">Browse Content</a>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(p => (
                <Card key={p.id} className="flex items-center gap-4">
                  <div className="w-16 h-10 rounded-sm overflow-hidden flex-shrink-0">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.date} · {p.type}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-gold">{p.price}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-sm ${p.status === "Watched" ? "bg-surface-overlay text-muted-foreground" : "bg-emerald/20 text-emerald-bright"}`}>
                      {p.status}
                    </span>
                    <button className="text-xs text-gold hover:text-gold-bright flex items-center gap-1">
                      <Download className="w-3 h-3" /> Invoice
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Subscription Payments */}
        <div>
          <h3 className="cinzel text-sm font-bold text-foreground mb-3">Subscription Payments</h3>
          <div className="space-y-2">
            {MOCK_BILLING.slice(0, 3).map((inv, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 bg-surface border border-gold/10 rounded-sm text-xs">
                <span className="text-muted-foreground">{inv.date}</span>
                <span className="text-foreground">{inv.description}</span>
                <span className="font-bold text-foreground">{inv.amount}</span>
                <span className="text-emerald-bright">{inv.status}</span>
                <button className="text-gold hover:text-gold-bright flex items-center gap-1"><Download className="w-3 h-3" /> PDF</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── 5. Watch History Tab ─────────────────────────────────────────────────────
const WatchHistoryTab = () => {
  const [items, setItems] = useState(MOCK_HISTORY);
  const [paused, setPaused] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast({ title: "Removed from history" });
  };

  return (
    <div>
      <SectionHeader
        title="Watch History"
        subtitle="Your viewing activity"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Pause history</span>
            <Toggle enabled={paused} onChange={setPaused} />
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search history…"
            className="w-full bg-surface-raised border border-gold/10 rounded-sm pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40" />
        </div>
        <button onClick={() => setClearConfirm(true)} className="text-xs text-destructive border border-destructive/20 px-3 py-2 rounded-sm hover:bg-destructive/10 flex items-center gap-1.5 transition-colors">
          <Trash2 className="w-3 h-3" /> Clear All
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Your watch history is empty</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <Card key={item.id} className="flex items-center gap-4">
              <div className="relative w-24 h-14 rounded-sm overflow-hidden flex-shrink-0 group cursor-pointer">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                  <Play className="w-5 h-5 text-gold fill-gold" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{item.watchedAt} · {item.timeRemaining}</p>
                <div className="h-1 bg-surface-overlay rounded-full overflow-hidden w-48 max-w-full">
                  <div className="h-full gradient-gold rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{item.progress}% watched</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
                {item.progress < 100 && (
                  <button className="text-[10px] text-gold border border-gold/20 px-2 py-1 rounded-sm hover:border-gold/40 transition-colors">Resume</button>
                )}
                {item.progress === 100 && (
                  <button className="text-[10px] text-muted-foreground border border-gold/10 px-2 py-1 rounded-sm hover:border-gold/20 transition-colors">Rewatch</button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={clearConfirm}
        title="Clear Watch History"
        description="This will permanently remove all your watch history. This cannot be undone."
        confirmLabel="Clear All"
        danger
        onConfirm={() => { setItems([]); setClearConfirm(false); toast({ title: "Watch history cleared" }); }}
        onCancel={() => setClearConfirm(false)}
      />
    </div>
  );
};

// ─── 6. Watchlist Tab ─────────────────────────────────────────────────────────
const WatchlistTab = () => {
  const [items, setItems] = useState(MOCK_WATCHLIST);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("Date Added");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setRemovingId(null);
    toast({ title: "Removed from watchlist" });
  };

  return (
    <div>
      <SectionHeader title="My Watchlist" subtitle={`${items.length} titles saved`} />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-xs text-foreground focus:outline-none">
          <option>Date Added</option><option>Title</option><option>Release Year</option>
        </select>
        <select className="bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-xs text-foreground focus:outline-none">
          <option>All Genres</option><option>Drama</option><option>Romance</option><option>Historical</option><option>Adventure</option>
        </select>
        <div className="ml-auto flex items-center gap-1 border border-gold/10 rounded-sm overflow-hidden">
          <button onClick={() => setViewMode("grid")} className={`px-3 py-2 ${viewMode === "grid" ? "bg-gold/20 text-gold" : "text-muted-foreground hover:text-foreground"} transition-colors`}><Grid className="w-3.5 h-3.5" /></button>
          <button onClick={() => setViewMode("list")} className={`px-3 py-2 ${viewMode === "list" ? "bg-gold/20 text-gold" : "text-muted-foreground hover:text-foreground"} transition-colors`}><List className="w-3.5 h-3.5" /></button>
        </div>
        <button onClick={() => setClearConfirm(true)} className="text-xs text-destructive border border-destructive/20 px-3 py-2 rounded-sm hover:bg-destructive/10 flex items-center gap-1.5 transition-colors">
          <Trash2 className="w-3 h-3" /> Clear All
        </button>
      </div>

      {items.length === 0 ? (
        <Card className="text-center py-10">
          <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Your watchlist is empty</p>
          <a href="/browse" className="text-xs text-gold hover:text-gold-bright mt-2 inline-block">Browse Content</a>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative aspect-[2/3] rounded-sm overflow-hidden mb-2">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 flex flex-col items-center justify-center gap-2">
                  <button className="px-4 py-1.5 gradient-gold text-primary-foreground text-xs font-bold rounded-sm">Watch Now</button>
                  <button onClick={() => setRemovingId(item.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"><X className="w-3 h-3" /> Remove</button>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
              <p className="text-[10px] text-muted-foreground">{item.year} · {item.genre}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="flex items-center gap-4">
              <div className="w-12 h-16 rounded-sm overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.year} · {item.genre} · {item.runtime}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="text-xs text-gold border border-gold/20 px-3 py-1.5 rounded-sm hover:border-gold/40 transition-colors">Watch Now</button>
                <button onClick={() => setRemovingId(item.id)} className="text-destructive hover:text-destructive/70 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal open={!!removingId} title="Remove from Watchlist" description="Remove this title from your watchlist?"
        confirmLabel="Remove" danger onConfirm={() => removingId && removeItem(removingId)} onCancel={() => setRemovingId(null)} />
      <ConfirmModal open={clearConfirm} title="Clear Watchlist" description="Remove all titles from your watchlist? This cannot be undone."
        confirmLabel="Clear All" danger onConfirm={() => { setItems([]); setClearConfirm(false); toast({ title: "Watchlist cleared" }); }} onCancel={() => setClearConfirm(false)} />
    </div>
  );
};

// ─── 7. Continue Watching Tab ─────────────────────────────────────────────────
const ContinueWatchingTab = () => {
  const [items, setItems] = useState(MOCK_HISTORY.filter(i => i.progress < 100));
  const [clearConfirm, setClearConfirm] = useState(false);

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast({ title: "Removed from Continue Watching" });
  };

  return (
    <div>
      <SectionHeader
        title="Continue Watching"
        subtitle="Pick up where you left off"
        action={
          <button onClick={() => setClearConfirm(true)} className="text-xs text-muted-foreground hover:text-destructive border border-gold/10 hover:border-destructive/30 px-3 py-1.5 rounded-sm transition-colors">
            Clear All
          </button>
        }
      />

      {items.length === 0 ? (
        <Card className="text-center py-10">
          <Play className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nothing in progress</p>
          <a href="/browse" className="text-xs text-gold hover:text-gold-bright mt-2 inline-block">Start Watching</a>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <Card key={item.id} className="flex items-start gap-4 hover:border-gold/30 transition-colors">
              <div className="relative w-28 h-16 rounded-sm overflow-hidden flex-shrink-0 group cursor-pointer">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                  <Play className="w-6 h-6 text-gold fill-gold" />
                </div>
                {/* Progress bar on thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
                  <div className="h-full gradient-gold" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{item.timeRemaining}</p>
                <div className="h-1 bg-surface-overlay rounded-full overflow-hidden mb-2">
                  <div className="h-full gradient-gold rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{item.progress}% watched</p>
                <div className="flex items-center gap-2 mt-2">
                  <button className="text-[10px] gradient-gold text-primary-foreground px-3 py-1 rounded-sm font-bold">Resume</button>
                  <button className="text-[10px] text-muted-foreground border border-gold/10 px-2 py-1 rounded-sm hover:border-gold/20 transition-colors">Restart</button>
                  <button className="text-[10px] text-muted-foreground border border-gold/10 px-2 py-1 rounded-sm hover:border-gold/20 transition-colors">Mark Watched</button>
                  <button onClick={() => removeItem(item.id)} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal open={clearConfirm} title="Clear Continue Watching" description="Remove all in-progress titles?"
        confirmLabel="Clear All" danger onConfirm={() => { setItems([]); setClearConfirm(false); }} onCancel={() => setClearConfirm(false)} />
    </div>
  );
};

// ─── 8. Devices Tab ───────────────────────────────────────────────────────────
const DevicesTab = () => {
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [logoutAllConfirm, setLogoutAllConfirm] = useState(false);

  const removeDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    setRemovingId(null);
    toast({ title: "Device removed" });
  };

  const saveRename = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, name: editName } : d));
    setEditingId(null);
    toast({ title: "Device renamed" });
  };

  const handleLogoutAll = () => {
    setDevices(prev => prev.filter(d => d.current));
    setLogoutAllConfirm(false);
    toast({ title: "Signed out of all other devices" });
  };

  return (
    <div>
      <SectionHeader
        title="Device Management"
        subtitle={`${devices.length} / 5 devices registered`}
      />

      {/* Device limit bar */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">Device slots used</span>
          <span className="text-xs text-muted-foreground">{devices.length} of 5</span>
        </div>
        <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
          <div className="h-full gradient-gold rounded-full transition-all" style={{ width: `${(devices.length / 5) * 100}%` }} />
        </div>
      </Card>

      <div className="space-y-3 mb-6">
        {devices.map(d => (
          <Card key={d.id} className={`flex items-center gap-4 ${d.current ? "border-gold/40" : "border-gold/10"}`}>
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 ${d.current ? "gradient-gold" : "bg-surface-raised border border-border"}`}>
              <DevIcon type={d.type} />
            </div>
            <div className="flex-1 min-w-0">
              {editingId === d.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="bg-surface-raised border border-gold/30 rounded-sm px-2 py-1 text-sm text-foreground focus:outline-none"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && saveRename(d.id)}
                  />
                  <button onClick={() => saveRename(d.id)} className="text-emerald-bright text-xs">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground text-xs">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{d.name}</p>
                  {d.current && <span className="text-[9px] px-1.5 py-0.5 bg-emerald/20 text-emerald-bright rounded-sm">THIS DEVICE</span>}
                  <button onClick={() => { setEditingId(d.id); setEditName(d.name); }} className="text-muted-foreground hover:text-gold transition-colors">
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{d.lastSeen} · {d.location}</p>
            </div>
            {!d.current && (
              <button onClick={() => setRemovingId(d.id)} className="text-xs text-destructive border border-destructive/20 px-3 py-1.5 rounded-sm hover:bg-destructive/10 transition-colors flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            )}
          </Card>
        ))}
      </div>

      {/* Activity log */}
      <Card>
        <h3 className="cinzel text-sm font-bold text-foreground mb-3">Recent Login Activity</h3>
        <div className="space-y-2">
          {MOCK_ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gold/5 last:border-0">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.status === "success" ? "bg-emerald-bright" : "bg-destructive"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{a.device}</p>
                <p className="text-[10px] text-muted-foreground">{a.location} · {a.ip}</p>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{a.time}</span>
              {a.status === "blocked" && <span className="text-[10px] text-destructive">Blocked</span>}
            </div>
          ))}
        </div>
        <button onClick={() => setLogoutAllConfirm(true)} className="mt-4 w-full py-2 border border-destructive/20 text-destructive text-xs rounded-sm hover:bg-destructive/10 transition-colors">
          Sign Out All Devices
        </button>
      </Card>

      <ConfirmModal open={!!removingId} title="Remove Device" description="This device will be signed out and removed from your account."
        confirmLabel="Remove" danger onConfirm={() => removingId && removeDevice(removingId)} onCancel={() => setRemovingId(null)} />
      <ConfirmModal open={logoutAllConfirm} title="Sign Out All Devices" description="This will sign you out of all devices except this one. You'll need to sign in again on other devices."
        confirmLabel="Sign Out All" danger onConfirm={handleLogoutAll} onCancel={() => setLogoutAllConfirm(false)} />
    </div>
  );
};

// ─── 9. Parental Controls Tab ─────────────────────────────────────────────────
const ParentalControlsTab = () => {
  const [enabled, setEnabled] = useState(false);
  const [rating, setRating] = useState("PG-13");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [kidMode, setKidMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const ratings = ["G (All Ages)", "PG (7+)", "PG-13 (12+)", "15+", "18+ (Adults only)"];

  const handleSave = async () => {
    if (enabled) {
      if (pin.length < 4) {
        toast({ title: "PIN too short", description: "PIN must be 4–6 digits.", variant: "destructive" });
        return;
      }
      if (pin !== confirmPin) {
        toast({ title: "PINs don't match", description: "Please make sure both PINs are identical.", variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast({ title: "Parental controls saved" });
  };

  return (
    <div>
      <SectionHeader title="Parental Controls" subtitle="Restrict content for younger viewers" />
      <div className="max-w-xl space-y-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Enable Parental Controls</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Restrict content based on age rating</p>
            </div>
            <Toggle enabled={enabled} onChange={setEnabled} />
          </div>

          {enabled && (
            <div className="space-y-4 pt-4 border-t border-gold/10">
              {/* Age Rating */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-2">Maximum Content Rating</label>
                <div className="space-y-2">
                  {ratings.map(r => (
                    <label key={r} onClick={() => setRating(r)} className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${rating === r ? "border-gold bg-gold" : "border-gold/30"}`} />
                      <span className={`text-sm ${rating === r ? "text-foreground font-medium" : "text-muted-foreground"}`}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* PIN */}
              <div className="pt-4 border-t border-gold/10">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-2">Control PIN (4–6 digits)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter PIN"
                    className="bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40 text-center tracking-widest"
                  />
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Confirm PIN"
                    className="bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40 text-center tracking-widest"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Kids Mode</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Separate profile with child-appropriate content only</p>
            </div>
            <Toggle enabled={kidMode} onChange={setKidMode} />
          </div>
          {kidMode && (
            <div className="mt-3 p-3 bg-emerald/10 border border-emerald/20 rounded-sm">
              <p className="text-xs text-emerald-bright">Kids Mode is active — only G & PG content visible</p>
            </div>
          )}
        </Card>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 gradient-gold text-primary-foreground text-sm font-bold rounded-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Parental Controls
        </button>
      </div>
    </div>
  );
};

// ─── 10. Notifications Tab ────────────────────────────────────────────────────
const NotificationsTab = () => {
  const [settings, setSettings] = useState({
    email_security: true, email_billing: true, email_content: false, email_promo: false,
    push_security: true, push_billing: false, push_content: true, push_promo: false,
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof typeof settings) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const emailRows = [
    { key: "email_security" as const, label: "Account & Security", desc: "New device logins, password changes" },
    { key: "email_billing" as const, label: "Billing", desc: "Receipts, renewals, failed payments" },
    { key: "email_content" as const, label: "Content Updates", desc: "New releases, recommendations" },
    { key: "email_promo" as const, label: "Promotional", desc: "Offers, newsletter, special events" },
  ];

  const pushRows = [
    { key: "push_security" as const, label: "Account & Security", desc: "New device alerts" },
    { key: "push_billing" as const, label: "Billing", desc: "Payment reminders" },
    { key: "push_content" as const, label: "New Content", desc: "Content you'd love" },
    { key: "push_promo" as const, label: "Promotions", desc: "Deals and offers" },
  ];

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    toast({ title: "Notification preferences saved" });
  };

  const NotifRow = ({ row }: { row: { key: keyof typeof settings; label: string; desc: string } }) => (
    <div className="flex items-center justify-between py-3 border-b border-gold/5 last:border-0">
      <div>
        <p className="text-sm text-foreground">{row.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{row.desc}</p>
      </div>
      <Toggle enabled={settings[row.key]} onChange={() => toggle(row.key)} />
    </div>
  );

  return (
    <div>
      <SectionHeader title="Notification Settings" subtitle="Control how Habesha Streams contacts you" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-gold" />
            <h3 className="cinzel text-sm font-bold text-foreground">Email Notifications</h3>
          </div>
          {emailRows.map(r => <NotifRow key={r.key} row={r} />)}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-gold" />
            <h3 className="cinzel text-sm font-bold text-foreground">Push Notifications</h3>
          </div>
          {pushRows.map(r => <NotifRow key={r.key} row={r} />)}
        </Card>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 gradient-gold text-primary-foreground text-sm font-bold rounded-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Save Preferences
      </button>
    </div>
  );
};

// ─── 11. Billing History Tab ──────────────────────────────────────────────────
const BillingHistoryTab = () => (
  <div>
    <SectionHeader title="Billing History" subtitle="All invoices and payment records" />
    <div className="space-y-2 mb-6">
      {MOCK_BILLING.map((inv) => (
        <div key={inv.id} className="flex items-center gap-4 px-4 py-3.5 bg-surface border border-gold/10 rounded-sm text-xs hover:border-gold/20 transition-colors">
          <FileText className="w-4 h-4 text-gold flex-shrink-0" />
          <span className="text-muted-foreground font-mono w-28 flex-shrink-0">{inv.id}</span>
          <span className="text-muted-foreground w-24 flex-shrink-0">{inv.date}</span>
          <span className="flex-1 text-foreground">{inv.description}</span>
          <span className="font-bold text-foreground w-16 text-right flex-shrink-0">{inv.amount}</span>
          <span className="w-12 flex-shrink-0">
            <span className="px-1.5 py-0.5 bg-emerald/20 text-emerald-bright rounded-sm">{inv.status}</span>
          </span>
          <button className="text-gold hover:text-gold-bright flex items-center gap-1 flex-shrink-0">
            <Download className="w-3 h-3" /> PDF
          </button>
        </div>
      ))}
    </div>

    <Card className="max-w-sm">
      <h3 className="cinzel text-sm font-bold text-foreground mb-3">Tax Information</h3>
      <p className="text-xs text-muted-foreground mb-3">For business accounts, add your VAT/GST number to have it appear on invoices.</p>
      <input placeholder="VAT / GST number" className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/40 mb-3" />
      <button className="w-full py-2 gradient-gold text-primary-foreground text-xs font-bold rounded-sm hover:opacity-90">Save Tax Info</button>
    </Card>
  </div>
);

// ─── 12. Account Security Tab ─────────────────────────────────────────────────
const AccountSecurityTab = ({ user }: { user: any }) => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<"app" | "sms" | "email">("app");

  const securityChecks = [
    { label: "Email verified", done: !!user?.email_confirmed_at },
    { label: "Strong password", done: true },
    { label: "2FA enabled", done: twoFAEnabled },
    { label: "Recovery email set", done: false },
    { label: "Phone number verified", done: false },
  ];

  const score = Math.round((securityChecks.filter(c => c.done).length / securityChecks.length) * 100);
  const scoreColor = score >= 80 ? "text-emerald-bright" : score >= 50 ? "text-gold" : "text-destructive";

  return (
    <div>
      <SectionHeader title="Account Security" subtitle="Keep your account safe and secure" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Score */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="cinzel text-sm font-bold text-foreground">Security Score</h3>
              <span className={`cinzel text-2xl font-black ${scoreColor}`}>{score}%</span>
            </div>
            <div className="h-2 bg-surface-overlay rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all ${score >= 80 ? "bg-emerald-bright" : score >= 50 ? "gradient-gold" : "bg-destructive"}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="space-y-2">
              {securityChecks.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  {c.done
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-bright flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  }
                  <span className={`text-xs ${c.done ? "text-foreground" : "text-muted-foreground"}`}>{c.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="cinzel text-sm font-bold text-foreground mb-3">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-foreground">{twoFAEnabled ? "Enabled" : "Disabled"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {twoFAEnabled ? "Your account has extra protection" : "Strongly recommended"}
                </p>
              </div>
              <Toggle enabled={twoFAEnabled} onChange={v => { setTwoFAEnabled(v); if (v) setShow2FAModal(true); }} />
            </div>
            {twoFAEnabled && (
              <div className="space-y-2">
                {(["Authenticator App", "SMS (Text)", "Email Code"] as const).map((m, i) => {
                  const methodKey = (["app", "sms", "email"] as const)[i];
                  return (
                    <label key={i} onClick={() => setTwoFAMethod(methodKey)} className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-3 h-3 rounded-full border-2 transition-colors ${twoFAMethod === methodKey ? "border-gold bg-gold" : "border-gold/30"}`} />
                      <span className="text-xs text-foreground">{m}</span>
                    </label>
                  );
                })}
                <button className="mt-2 text-[10px] text-gold hover:text-gold-bright">View backup codes</button>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <Card>
            <h3 className="cinzel text-sm font-bold text-foreground mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {MOCK_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gold/5 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${a.status === "success" ? "bg-emerald-bright" : "bg-destructive"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{a.device}</p>
                    <p className="text-[10px] text-muted-foreground">{a.location} · {a.ip}</p>
                    <p className="text-[10px] text-muted-foreground">{a.time}</p>
                  </div>
                  {a.status === "blocked" && (
                    <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-sm">Blocked</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="cinzel text-sm font-bold text-foreground mb-3">Connected Accounts</h3>
            {[
              { name: "Google", connected: false },
              { name: "Apple", connected: false },
            ].map(acc => (
              <div key={acc.name} className="flex items-center justify-between py-2 border-b border-gold/5 last:border-0">
                <span className="text-sm text-foreground">{acc.name}</span>
                <button className={`text-xs px-3 py-1 rounded-sm border transition-colors ${acc.connected ? "border-destructive/20 text-destructive hover:bg-destructive/10" : "border-gold/20 text-gold hover:border-gold/40"}`}>
                  {acc.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-surface border border-gold/20 rounded-sm p-6 max-w-sm w-full shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="cinzel text-base font-bold text-foreground">Enable Two-Factor Auth</h3>
              <button onClick={() => { setShow2FAModal(false); setTwoFAEnabled(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Choose your preferred 2FA method to add an extra layer of security to your account.</p>
            <div className="space-y-2 mb-5">
              {(["Authenticator App", "SMS (Text)", "Email Code"] as const).map((m, i) => {
                const methodKey = (["app", "sms", "email"] as const)[i];
                return (
                  <label key={i} onClick={() => setTwoFAMethod(methodKey)} className="flex items-center gap-3 cursor-pointer p-2 rounded-sm hover:bg-surface-raised transition-colors">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${twoFAMethod === methodKey ? "border-gold bg-gold" : "border-gold/30"}`} />
                    <span className="text-sm text-foreground">{m}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShow2FAModal(false); setTwoFAEnabled(false); }} className="flex-1 py-2.5 border border-gold/20 text-sm text-foreground rounded-sm hover:border-gold/40">Cancel</button>
              <button
                onClick={() => { setShow2FAModal(false); toast({ title: "2FA enabled", description: `Using ${twoFAMethod === "app" ? "Authenticator App" : twoFAMethod === "sms" ? "SMS" : "Email"}.` }); }}
                className="flex-1 py-2.5 gradient-gold text-primary-foreground text-sm font-bold rounded-sm hover:opacity-90"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── 13. Delete Account Tab ───────────────────────────────────────────────────
const DeleteAccountTab = ({ signOut, userEmail }: { signOut: () => Promise<void>; userEmail: string }) => {
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [checks, setChecks] = useState({ loseAccess: false, nonRefundable: false, irreversible: false });
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const allChecked = Object.values(checks).every(Boolean);
  const canDelete = allChecked && password.length >= 6;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Verify the password is correct before proceeding
      const { error: authError } = await supabase.auth.signInWithPassword({ email: userEmail, password });
      if (authError) {
        toast({ title: "Incorrect password", description: "Please enter your correct account password.", variant: "destructive" });
        setDeleting(false);
        return;
      }
      // Anonymize profile data — admin-level deletion happens asynchronously server-side
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ display_name: null, avatar_url: null }).eq("id", user.id);
      }
      toast({ title: "Account deletion initiated", description: "Your data will be anonymized within 30 days. A confirmation email has been sent." });
      await signOut();
    } catch {
      toast({ title: "Deletion failed", description: "Please try again or contact support.", variant: "destructive" });
    }
    setDeleting(false);
  };

  return (
    <div>
      <SectionHeader title="Delete Account" subtitle="Permanently remove your account and all data" />

      <div className="max-w-lg">
        {step === "warning" ? (
          <Card className="border-destructive/30">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-destructive/10 rounded-sm flex items-center justify-center flex-shrink-0">
                <TriangleAlert className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="cinzel text-base font-bold text-destructive mb-1">This action is permanent</h3>
                <p className="text-sm text-muted-foreground">Deleting your account will permanently remove all your data from Habesha Streams.</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {[
                "All watch history and watchlist data",
                "Purchase history and PPV access",
                "Subscription (any remaining time is forfeited)",
                "Profile information and preferences",
                "Device registrations",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <X className="w-3 h-3 text-destructive flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="p-3 bg-surface-raised border border-gold/10 rounded-sm mb-5">
              <p className="text-xs text-foreground font-medium mb-1">Prefer a break instead?</p>
              <p className="text-xs text-muted-foreground">You can deactivate your account for up to 90 days and reactivate it at any time.</p>
              <button className="mt-2 text-xs text-gold hover:text-gold-bright">Deactivate instead →</button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 py-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-bold rounded-sm hover:bg-destructive/20 transition-colors"
              >
                Continue to Deletion
              </button>
            </div>
          </Card>
        ) : (
          <Card className="border-destructive/40">
            <h3 className="cinzel text-base font-bold text-foreground mb-4">Confirm Account Deletion</h3>

            {/* Checkboxes */}
            <div className="space-y-3 mb-5">
              {[
                { key: "loseAccess" as const, label: "I understand I will immediately lose access to Habesha Streams" },
                { key: "nonRefundable" as const, label: "I understand remaining subscription time is non-refundable" },
                { key: "irreversible" as const, label: "I understand this action cannot be undone" },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                  <div
                    onClick={() => setChecks(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${checks[item.key] ? "border-destructive bg-destructive" : "border-gold/30"}`}
                  >
                    {checks[item.key] && <Check className="w-2.5 h-2.5 text-destructive-foreground" />}
                  </div>
                  <span className="text-xs text-foreground">{item.label}</span>
                </label>
              ))}
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Reason for leaving</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none mb-2">
                <option value="">Select reason</option>
                <option>Not enough content</option>
                <option>Too expensive</option>
                <option>Technical issues</option>
                <option>Privacy concerns</option>
                <option>Other</option>
              </select>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Enter your password to confirm</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your current password"
                  className="w-full bg-surface-raised border border-gold/10 rounded-sm px-3 py-2 text-sm text-foreground pr-10 focus:outline-none focus:border-destructive/40"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("warning")} className="flex-1 py-3 border border-gold/20 text-sm text-foreground rounded-sm hover:border-gold/40">Go Back</button>
              <button
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="flex-1 py-3 bg-destructive text-destructive-foreground text-sm font-bold rounded-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Permanently Delete Account
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ACCOUNT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const Account = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, profile, stripeSubscription, checkSubscription, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const renderTab = () => {
    switch (activeTab) {
      case "profile": return <ProfileTab user={user} profile={profile} refreshProfile={refreshProfile} />;
      case "subscription": return <SubscriptionTab stripeSubscription={stripeSubscription} checkSubscription={checkSubscription} />;
      case "payment": return <PaymentMethodsTab />;
      case "purchases": return <PurchaseHistoryTab />;
      case "history": return <WatchHistoryTab />;
      case "watchlist": return <WatchlistTab />;
      case "continue": return <ContinueWatchingTab />;
      case "devices": return <DevicesTab />;
      case "parental": return <ParentalControlsTab />;
      case "notifications": return <NotificationsTab />;
      case "billing": return <BillingHistoryTab />;
      case "security": return <AccountSecurityTab user={user} />;
      case "delete": return <DeleteAccountTab signOut={signOut} userEmail={user?.email ?? ""} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Profile Header */}
      <div className="pt-24 pb-0 px-6 md:px-12 bg-surface border-b border-gold/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 pb-6">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center text-xl font-black text-primary-foreground cinzel">
              {avatarLetter}
            </div>
            <button className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface-raised border border-gold/30 rounded-full flex items-center justify-center hover:border-gold/60 transition-colors">
              <Camera className="w-2.5 h-2.5 text-gold" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="cinzel text-xl font-bold text-foreground truncate">{displayName}</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {stripeSubscription.subscribed ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-sm text-[10px] text-gold font-bold">
                  <Star className="w-2.5 h-2.5 fill-gold" /> SUBSCRIBER
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-surface-overlay border border-border rounded-sm text-[10px] text-muted-foreground font-bold">FREE</span>
              )}
              {memberSince && <span className="text-[10px] text-muted-foreground">Member since {memberSince}</span>}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-sm text-xs transition-all flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-[11px] font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-gold text-gold"
                    : tab.id === "delete"
                      ? "border-transparent text-destructive/60 hover:text-destructive hover:border-destructive/30"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-gold/30"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {renderTab()}
      </div>

      <Footer />
    </div>
  );
};

export default Account;
