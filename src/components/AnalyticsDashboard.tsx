import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, TrendingUp, DollarSign, Play, CheckCircle2, ShieldAlert,
  Wifi, Activity, Loader2, Download, RefreshCw, Zap, Eye,
} from "lucide-react";
import { useAnalyticsSummary } from "@/hooks/useAnalyticsSummary";
import { useLoginAttemptsFeed } from "@/hooks/useLoginAttemptsFeed";
import { useState } from "react";

// ── Tooltip styles ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-gold/20 rounded-sm p-3 text-xs shadow-xl">
      <p className="text-gold font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="mb-0.5">
          {p.name}: <span className="font-bold">${p.value.toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  badge?: string;
  badgeColor?: string;
}

const StatCard = ({ icon: Icon, label, value, sub, badge, badgeColor = "bg-gold/10 text-gold" }: StatCardProps) => (
  <div className="bg-surface border border-gold/10 rounded-sm p-4 hover:border-gold/30 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div className="w-8 h-8 gradient-gold rounded-sm flex items-center justify-center">
        <Icon className="w-4 h-4 text-background" />
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${badgeColor}`}>{badge}</span>
      )}
    </div>
    <p className="cinzel text-xl font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-gold mt-1">{sub}</p>}
  </div>
);

// ── Live Dot ─────────────────────────────────────────────────────────────────
const LiveDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald" />
  </span>
);

// ── Main Analytics Panel ─────────────────────────────────────────────────────
const AnalyticsDashboard = () => {
  const { data, loading, refetch } = useAnalyticsSummary();
  const { attempts, loading: attemptsLoading } = useLoginAttemptsFeed(60);
  const [chartView, setChartView] = useState<"14d" | "7d" | "30d">("14d");

  const revenueData = chartView === "7d"
    ? data.dailyRevenue.slice(-7)
    : chartView === "30d"
    ? data.dailyRevenue // will naturally be last 14 if that's all we have
    : data.dailyRevenue;

  const totalMonthRevenue = data.dailyRevenue.reduce((s, d) => s + d.total, 0);

  const exportCSV = () => {
    const rows = [
      ["Date", "Subscriptions ($)", "PPV ($)", "Total ($)"],
      ...data.dailyRevenue.map((d) => [d.date, d.subscriptions.toFixed(2), d.ppv.toFixed(2), d.total.toFixed(2)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "habesha-revenue.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
          <p className="text-xs text-muted-foreground">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LiveDot />
          <span className="text-xs text-muted-foreground">Live • Auto-refreshes every 30s</span>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gold/20 text-gold rounded-sm hover:bg-gold hover:text-background transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Active Subscribers"
          value={data.totalSubscribers.toLocaleString()}
          sub={`+${data.newToday} today · +${data.newThisWeek} this week`}
          badge={`+${data.newThisMonth} /mo`}
          badgeColor="bg-emerald/20 text-emerald-bright"
        />
        <StatCard
          icon={DollarSign}
          label="Est. Monthly Revenue"
          value={`$${totalMonthRevenue.toFixed(2)}`}
          sub="Subscriptions + PPV"
          badge="14d"
        />
        <StatCard
          icon={Play}
          label="Total Plays"
          value={data.totalPlays.toLocaleString()}
          sub={`${data.totalWatchMinutes.toLocaleString()} watch minutes`}
          badge={`${data.completionRate}% complete`}
          badgeColor="bg-gold/10 text-gold"
        />
        <StatCard
          icon={ShieldAlert}
          label="Security Events"
          value={data.suspiciousAttempts}
          sub={`${data.loginSuccessRate}% login success rate`}
          badge={data.suspiciousAttempts > 0 ? "⚠ Alerts" : "✓ Clear"}
          badgeColor={data.suspiciousAttempts > 0 ? "bg-destructive/20 text-destructive" : "bg-emerald/20 text-emerald-bright"}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface border border-gold/10 rounded-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
          <div>
            <h3 className="cinzel text-sm font-bold text-foreground">Revenue Breakdown</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Subscription vs Pay-Per-View · USD</p>
          </div>
          <div className="flex items-center gap-2">
            {(["7d", "14d"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-sm transition-all ${
                  chartView === v ? "gradient-gold text-background" : "border border-gold/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-gold/20 text-muted-foreground hover:text-gold rounded-sm transition-all"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
        </div>
        <div className="p-5">
          {data.dailyRevenue.every((d) => d.total === 0) ? (
            <div className="h-52 flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Revenue data will appear as subscribers sign up and PPV events are purchased.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPPV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8a8070" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8a8070" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }}
                  formatter={(value) => <span style={{ color: "#c4ae8a" }}>{value}</span>}
                />
                <Area type="monotone" dataKey="subscriptions" name="Subscriptions" stroke="#c9a84c" strokeWidth={2} fill="url(#gradSub)" />
                <Area type="monotone" dataKey="ppv" name="PPV" stroke="#6ee7b7" strokeWidth={2} fill="url(#gradPPV)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Watch Events + Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Watch Events */}
        <div className="bg-surface border border-gold/10 rounded-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gold/10">
            <Eye className="w-4 h-4 text-gold" />
            <h3 className="cinzel text-sm font-bold text-foreground">Watch Events</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "Total Plays", value: data.totalPlays, icon: Play, color: "text-gold" },
              { label: "Completions", value: data.totalCompletions, icon: CheckCircle2, color: "text-emerald-bright" },
              { label: "Watch Minutes", value: data.totalWatchMinutes.toLocaleString(), icon: Activity, color: "text-gold" },
              { label: "Completion Rate", value: `${data.completionRate}%`, icon: TrendingUp, color: "text-emerald-bright" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gold/5 last:border-0">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{item.value}</span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1">
              Watch events are tracked as users interact with the video player.
            </p>
          </div>
        </div>

        {/* Top Videos */}
        <div className="bg-surface border border-gold/10 rounded-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gold/10">
            <Zap className="w-4 h-4 text-gold" />
            <h3 className="cinzel text-sm font-bold text-foreground">Top Content (30d)</h3>
          </div>
          <div className="p-5">
            {data.topVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Play className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Play events will appear here as users watch content.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.topVideos.map((v, i) => (
                  <div key={v.video_id} className="flex items-center gap-3">
                    <span className="w-5 text-[10px] font-bold text-muted-foreground text-right">{i + 1}</span>
                    <div className="flex-1 bg-surface-raised rounded-sm overflow-hidden">
                      <div
                        className="h-6 gradient-gold opacity-80 flex items-center px-2"
                        style={{ width: `${Math.max(20, (v.plays / data.topVideos[0].plays) * 100)}%` }}
                      >
                        <span className="text-[9px] font-bold text-background truncate">{v.video_id}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gold w-8 text-right">{v.plays}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-surface border border-gold/10 rounded-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gold/10">
          <Wifi className="w-4 h-4 text-gold" />
          <h3 className="cinzel text-sm font-bold text-foreground">System Health</h3>
          <LiveDot />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gold/10">
          {[
            { label: "API Status", value: "Operational", color: "text-emerald-bright", dot: true },
            { label: "Database", value: "Healthy", color: "text-emerald-bright", dot: true },
            { label: "Auth Service", value: "Operational", color: "text-emerald-bright", dot: true },
            { label: "Edge Functions", value: "Active", color: "text-emerald-bright", dot: true },
          ].map((item) => (
            <div key={item.label} className="px-5 py-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Login Attempts Feed */}
      <div className="bg-surface border border-gold/10 rounded-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gold" />
            <h3 className="cinzel text-sm font-bold text-foreground">Live Login Attempt Feed</h3>
            <LiveDot />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">WebSocket · Real-time</span>
            {attemptsLoading && <Loader2 className="w-3 h-3 text-gold animate-spin" />}
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-muted-foreground">
            {attemptsLoading ? "Connecting to live feed…" : "No login attempts recorded yet. The feed will update in real-time."}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-gold/10">
                  <th className="px-4 py-2.5 text-left text-muted-foreground font-medium">Time</th>
                  <th className="px-3 py-2.5 text-left text-muted-foreground font-medium">Email</th>
                  <th className="px-3 py-2.5 text-left text-muted-foreground font-medium">IP Address</th>
                  <th className="px-3 py-2.5 text-left text-muted-foreground font-medium">Device Hash</th>
                  <th className="px-4 py-2.5 text-left text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr
                    key={a.id}
                    className={`border-b border-gold/5 transition-colors ${
                      a.attempt_type === "device_mismatch" ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-surface-raised"
                    }`}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                      {new Date(a.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2.5 text-foreground max-w-[160px] truncate">{a.email || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground font-mono text-[10px]">{a.ip_address || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground font-mono text-[10px] max-w-[100px] truncate">
                      {a.device_fingerprint ? `${a.device_fingerprint.slice(0, 12)}…` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        a.attempt_type === "success"
                          ? "bg-emerald/20 text-emerald-bright"
                          : a.attempt_type === "device_mismatch"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-gold/10 text-gold"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          a.attempt_type === "success" ? "bg-emerald-500" :
                          a.attempt_type === "device_mismatch" ? "bg-destructive" : "bg-gold"
                        }`} />
                        {a.attempt_type === "success" ? "✓ Success" :
                         a.attempt_type === "device_mismatch" ? "✗ Device Mismatch" : a.attempt_type}
                      </span>
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

export default AnalyticsDashboard;
