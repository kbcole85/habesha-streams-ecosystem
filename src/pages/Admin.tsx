import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  LayoutDashboard, Film, Users, DollarSign, Shield, Settings,
  TrendingUp, Upload, Eye, AlertTriangle, CheckCircle, Clock,
  ChevronRight, BarChart2, Globe, Activity, Bell, Search,
  Smartphone, RotateCcw, ShieldAlert, Loader2, KeyRound, Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AdminContentApproval from "@/components/AdminContentApproval";


const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Film, label: "Content", id: "content" },
  { icon: Users, label: "Users", id: "users" },
  { icon: DollarSign, label: "Finance", id: "finance" },
  { icon: TrendingUp, label: "Analytics", id: "analytics" },
  { icon: Shield, label: "Security", id: "security" },
  { icon: Smartphone, label: "Devices", id: "devices" },
  { icon: KeyRound, label: "Test Codes", id: "testcodes" },
  { icon: Settings, label: "Settings", id: "settings" },
];

// ── Test Access Codes Panel ────────────────────────────────────────────────
const TestCodesPanel = () => {
  const [codes, setCodes] = useState<Array<{
    id: string; code: string; is_used: boolean | null; assigned_user: string | null;
    expires_at: string; created_at: string | null;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [assignedEmails, setAssignedEmails] = useState<Record<string, string>>({});

  const loadCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("test_access_codes")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[TestCodes] fetch error:", error);
      toast({ title: "Failed to load codes", description: error.message, variant: "destructive" });
    }
    if (data) {
      setCodes(data);
      const userIds = data.filter(c => c.assigned_user).map(c => c.assigned_user!);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, display_name")
          .in("id", userIds);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach(p => { map[p.id] = p.display_name || p.email; });
          setAssignedEmails(map);
        }
      }
    }
    setLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: code });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const usedCount = codes.filter(c => c.is_used).length;
  const expiredCount = codes.filter(c => !c.is_used && isExpired(c.expires_at)).length;
  const availableCount = codes.filter(c => !c.is_used && !isExpired(c.expires_at)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available", value: availableCount, color: "text-emerald-bright" },
          { label: "Redeemed", value: usedCount, color: "text-gold" },
          { label: "Expired", value: expiredCount, color: "text-destructive" },
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-gold/10 rounded-sm p-4 text-center">
            <p className={`cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-gold/10 rounded-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
          <h3 className="cinzel text-sm font-bold text-foreground">Test Access Codes</h3>
          <button
            onClick={loadCodes}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gold/20 text-gold rounded-sm hover:bg-gold hover:text-background transition-all"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
            {codes.length === 0 ? "Load Codes" : "Refresh"}
          </button>
        </div>

        {codes.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-muted-foreground">
            Click "Load Codes" to view all test access codes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/5">
                  <th className="px-5 py-3 text-left text-muted-foreground font-medium">Code</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-medium">Status</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-medium">Assigned To</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-medium">Expires</th>
                  <th className="px-5 py-3 text-right text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const expired = isExpired(c.expires_at);
                  const status = c.is_used ? "redeemed" : expired ? "expired" : "available";
                  return (
                    <tr key={c.id} className="border-b border-gold/5 hover:bg-surface-raised transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-foreground tracking-wider">{c.code}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          status === "redeemed" ? "bg-gold/10 text-gold" :
                          status === "expired" ? "bg-destructive/20 text-destructive" :
                          "bg-emerald/20 text-emerald-bright"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {c.assigned_user
                          ? assignedEmails[c.assigned_user] || c.assigned_user.slice(0, 8) + "…"
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {new Date(c.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => copyCode(c.code)}
                          className="px-2 py-1 text-[10px] border border-gold/20 text-gold rounded-sm hover:bg-gold hover:text-background transition-all"
                        >
                          <Copy className="w-3 h-3 inline mr-1" />
                          Copy
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Real Dashboard Overview ────────────────────────────────────────────────
const AdminDashboardOverview = () => {
  const [stats, setStats] = useState<{ label: string; value: string; icon: any }[]>([]);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [subsRes, paymentsRes, videosRes, recentVidsRes] = await Promise.all([
        supabase.from("profiles").select("id").eq("is_subscribed", true),
        supabase.from("payments").select("amount").eq("status", "succeeded"),
        supabase.from("videos").select("id").eq("status", "approved"),
        supabase.from("videos").select("id, title, status, created_at, creator_id").order("created_at", { ascending: false }).limit(10),
      ]);

      const totalSubs = subsRes.data?.length ?? 0;
      const totalRevenue = (paymentsRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
      const totalApproved = videosRes.data?.length ?? 0;

      setStats([
        { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
        { label: "Active Subscribers", value: String(totalSubs), icon: Users },
        { label: "Approved Content", value: String(totalApproved), icon: Film },
      ]);

      setRecentVideos(recentVidsRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface border border-gold/10 rounded-sm p-4 hover:border-gold/30 transition-colors">
            <div className="w-8 h-8 gradient-gold rounded-sm flex items-center justify-center mb-3">
              <stat.icon className="w-4 h-4 text-background" />
            </div>
            <p className="cinzel text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Videos */}
      <div className="bg-surface border border-gold/10 rounded-sm">
        <div className="px-5 py-4 border-b border-gold/10">
          <h2 className="cinzel text-sm font-bold text-foreground">Recent Content Submissions</h2>
        </div>
        {recentVideos.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-muted-foreground">No content submissions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/5">
                  <th className="px-5 py-3 text-left text-muted-foreground font-medium">Title</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-medium">Status</th>
                  <th className="px-5 py-3 text-right text-muted-foreground font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentVideos.map((v) => (
                  <tr key={v.id} className="border-b border-gold/5 hover:bg-surface-raised transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{v.title}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        v.status === "approved" ? "bg-emerald/20 text-emerald-bright" :
                        v.status === "pending" ? "bg-gold/10 text-gold" :
                        "bg-destructive/20 text-destructive"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};


// ── Device Management Panel ────────────────────────────────────────────────
const DeviceManagementPanel = () => {
  const [targetUserId, setTargetUserId] = useState("");
  const [resetting, setResetting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<Array<{
    id: string; email: string; attempt_type: string; ip_address: string; created_at: string;
  }>>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const loadLoginAttempts = async () => {
    setLoadingAttempts(true);
    const { data } = await supabase
      .from("login_attempts")
      .select("id, email, attempt_type, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setLoginAttempts(data);
    setLoadingAttempts(false);
  };

  const resetDevice = async () => {
    if (!targetUserId.trim()) {
      toast({ title: "Enter a User ID", variant: "destructive" });
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.functions.invoke("device-validate", {
        body: { action: "reset", targetUserId: targetUserId.trim() },
      });
      if (error) throw error;
      toast({ title: "Device reset successfully", description: "User can now log in from a new device." });
      setTargetUserId("");
    } catch (err) {
      toast({ title: "Reset failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
    setResetting(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reset Device */}
        <div className="bg-surface border border-gold/10 rounded-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw className="w-4 h-4 text-gold" />
            <h3 className="cinzel text-sm font-bold text-foreground">Reset User Device</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Deactivates a user's registered device session, allowing them to log in from a new device.
            Use this when a user has lost or replaced their device.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              placeholder="Paste User UUID here…"
              className="w-full px-3 py-2.5 text-xs bg-surface-raised border border-gold/15 focus:border-gold/50 rounded-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={resetDevice}
              disabled={resetting}
              className="w-full flex items-center justify-center gap-2 py-2.5 gradient-gold text-background text-xs font-bold rounded-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {resetting ? "Resetting…" : "Reset Device Lock"}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-surface border border-gold/10 rounded-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-gold" />
            <h3 className="cinzel text-sm font-bold text-foreground">Device Lock Policy</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            {[
              "Each account is bound to one device fingerprint on first login.",
              "If a different device is detected, access is denied and logged.",
              "The fingerprint is derived from browser + hardware signals.",
              "Clearing cookies alone does NOT bypass the device lock.",
              "Admins can reset any user's device from this panel.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-bright flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Login Attempts Log */}
      <div className="bg-surface border border-gold/10 rounded-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
          <h3 className="cinzel text-sm font-bold text-foreground">Login Attempt Log</h3>
          <button
            onClick={loadLoginAttempts}
            disabled={loadingAttempts}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gold/20 text-gold rounded-sm hover:bg-gold hover:text-background transition-all"
          >
            {loadingAttempts ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
            Load Logs
          </button>
        </div>
        {loginAttempts.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-muted-foreground">
            Click "Load Logs" to view recent login attempts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/5">
                  <th className="px-5 py-3 text-left text-muted-foreground font-medium">Email</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-medium">Type</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-medium">IP Address</th>
                  <th className="px-5 py-3 text-right text-muted-foreground font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {loginAttempts.map((a) => (
                  <tr key={a.id} className="border-b border-gold/5 hover:bg-surface-raised transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{a.email || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        a.attempt_type === "success" ? "bg-emerald/20 text-emerald-bright" :
                        a.attempt_type === "device_mismatch" ? "bg-destructive/20 text-destructive" :
                        "bg-gold/10 text-gold"
                      }`}>
                        {a.attempt_type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground font-mono text-[10px]">{a.ip_address || "—"}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 bg-surface border-r border-gold/10 fixed left-0 top-16 bottom-0 z-30">
          <div className="p-4 border-b border-gold/10">
            <span className="cinzel text-xs font-bold text-gold tracking-widest">SUPER ADMIN</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Full system control</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gold/10 border border-gold/30 text-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gold/10">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-6 h-6 rounded-full gradient-gold flex items-center justify-center">
                <span className="text-[9px] font-bold text-background">SA</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Super Admin</p>
                <p className="text-[9px] text-muted-foreground">admin@habesha.stream</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 p-6 overflow-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="cinzel text-2xl font-bold text-foreground capitalize">{activeTab}</h1>
              <p className="text-xs text-muted-foreground">Habesha Streams Control Center</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input placeholder="Search..." className="pl-8 pr-4 py-2 text-xs bg-surface border border-gold/10 focus:border-gold/40 rounded-sm outline-none w-48" />
              </div>
              <button className="relative p-2 bg-surface border border-gold/10 rounded-sm text-muted-foreground hover:text-gold">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gold rounded-full" />
              </button>
            </div>
          </div>

          {/* Stats + tables — only on dashboard-like tabs */}
          {!["analytics", "devices", "security", "settings", "testcodes", "content"].includes(activeTab) && (
            <AdminDashboardOverview />
          )}

          {/* Analytics tab */}
          {activeTab === "analytics" && <AnalyticsDashboard />}

          {/* Content approval tab */}
          {activeTab === "content" && <AdminContentApproval />}

          {/* Devices tab */}
          {activeTab === "devices" && <DeviceManagementPanel />}

          {/* Test Codes tab */}
          {activeTab === "testcodes" && <TestCodesPanel />}

          {/* Security tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-surface border border-gold/10 rounded-sm p-5">
                <h3 className="cinzel text-sm font-bold text-foreground mb-4">Security Overview</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-bright" /> Device-lock enforcement active</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-bright" /> RLS policies enforced on all tables</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-bright" /> Stripe webhook signature verification</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-bright" /> Audit logging enabled</li>
                </ul>
              </div>
            </div>
          )}

          {/* Settings tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="bg-surface border border-gold/10 rounded-sm p-5">
                <h3 className="cinzel text-sm font-bold text-foreground mb-4">Platform Settings</h3>
                <p className="text-xs text-muted-foreground mb-4">Core platform configuration is managed through the backend. Use the panels below for quick actions.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-raised border border-gold/10 rounded-sm">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Content Defaults</h4>
                    <p className="text-[10px] text-muted-foreground">Default encoding: H.264 · Default visibility: Private · Auto-approve: Off</p>
                  </div>
                  <div className="p-4 bg-surface-raised border border-gold/10 rounded-sm">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Security Policy</h4>
                    <p className="text-[10px] text-muted-foreground">Device lock: 1 device/account · Max login attempts: 5 · Session timeout: 24h</p>
                  </div>
                  <div className="p-4 bg-surface-raised border border-gold/10 rounded-sm">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Billing</h4>
                    <p className="text-[10px] text-muted-foreground">Provider: Stripe · Grace period: 7 days · Retry failed payments: 3x over 5 days</p>
                  </div>
                  <div className="p-4 bg-surface-raised border border-gold/10 rounded-sm">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Geo Restrictions</h4>
                    <p className="text-[10px] text-muted-foreground">Country filtering: Per-video · Default: All regions allowed</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;
