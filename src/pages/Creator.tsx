import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  LayoutDashboard, Upload, BarChart2, DollarSign, Film,
  ChevronRight, TrendingUp, Eye, Clock, Play, Plus,
  CheckCircle, AlertCircle, ArrowUp, Globe
} from "lucide-react";
import thumb1 from "@/assets/thumb-1.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb5 from "@/assets/thumb-5.jpg";

const myContent = [
  { title: "Yewedaj Mistir", status: "approved", views: 12840, revenue: 2456, duration: "2h 18m", image: thumb1 },
  { title: "Genet", status: "approved", views: 8120, revenue: 1678, duration: "1h 52m", image: thumb3 },
  { title: "Tizita Nights", status: "pending", views: 0, revenue: 0, duration: "1h 25m", image: thumb5 },
];

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

const Creator = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [uploadStep, setUploadStep] = useState(1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-52 bg-surface border-r border-gold/10 fixed left-0 top-16 bottom-0 z-30">
          <div className="p-4 border-b border-gold/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
                <span className="text-[10px] font-bold text-background">SF</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Selam Films</p>
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
                onClick={() => setActiveTab(item.id)}
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
              <p className="text-xs text-muted-foreground">Welcome back, Selam Films</p>
            </div>
            <button
              onClick={() => setActiveTab("upload")}
              className="flex items-center gap-2 px-4 py-2 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Upload Content
            </button>
          </div>

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

          {/* My Content */}
          <div className="bg-surface border border-gold/10 rounded-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
              <h2 className="cinzel text-sm font-bold text-foreground">My Content</h2>
              <button className="text-xs text-gold hover:text-gold-bright">Manage All</button>
            </div>
            <div className="p-4 space-y-3">
              {myContent.map((c, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-surface-raised rounded-sm border border-gold/5 hover:border-gold/20 transition-all group">
                  <div className="relative w-16 h-10 rounded-sm overflow-hidden flex-shrink-0">
                    <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                      <Play className="w-4 h-4 text-gold fill-gold" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{c.duration}</span>
                      <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{c.views.toLocaleString()} views</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gold">{c.revenue > 0 ? `$${c.revenue.toLocaleString()}` : "—"}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                      c.status === "approved" ? "bg-emerald/20 text-emerald-bright" : "bg-gold/10 text-gold"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Upload Panel (if upload tab selected) */}
          {activeTab === "upload" && (
            <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-6">
              <div className="bg-surface border border-gold/20 rounded-sm w-full max-w-xl shadow-elevated">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
                  <h2 className="cinzel text-lg font-bold text-foreground">Upload Content</h2>
                  <button onClick={() => setActiveTab("dashboard")} className="text-muted-foreground hover:text-gold text-xl">×</button>
                </div>
                <div className="p-6">
                  {/* Progress steps */}
                  <div className="flex items-center gap-2 mb-6">
                    {["Video File", "Metadata", "Monetization", "Publish"].map((step, i) => (
                      <div key={i} className="flex-1 flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          i + 1 <= uploadStep ? "bg-gold text-background" : "bg-surface-raised text-muted-foreground border border-gold/10"
                        }`}>
                          {i + 1 <= uploadStep ? <CheckCircle className="w-3 h-3" /> : i + 1}
                        </div>
                        <span className="hidden sm:block text-[9px] text-muted-foreground ml-1 truncate">{step}</span>
                        {i < 3 && <div className="flex-1 h-px bg-gold/10 mx-1" />}
                      </div>
                    ))}
                  </div>

                  {/* Upload Drop Zone */}
                  <div className="border-2 border-dashed border-gold/20 hover:border-gold/50 rounded-sm p-10 text-center cursor-pointer transition-colors mb-4 group">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-gold mx-auto mb-3 transition-colors" />
                    <p className="text-sm font-medium text-foreground mb-1">Drag & drop video file</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, AVI — up to 50GB</p>
                    <button className="mt-4 px-4 py-2 border border-gold/30 text-gold text-xs rounded-sm hover:bg-gold hover:text-background transition-all">
                      Browse Files
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input placeholder="Title" className="w-full px-3 py-2 text-sm bg-surface-raised border border-gold/10 focus:border-gold/40 rounded-sm outline-none text-foreground placeholder:text-muted-foreground" />
                    <textarea placeholder="Description..." rows={3} className="w-full px-3 py-2 text-sm bg-surface-raised border border-gold/10 focus:border-gold/40 rounded-sm outline-none text-foreground placeholder:text-muted-foreground resize-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <select className="px-3 py-2 text-sm bg-surface-raised border border-gold/10 rounded-sm text-muted-foreground outline-none">
                        <option>Select Genre</option>
                        <option>Drama</option>
                        <option>Documentary</option>
                        <option>Music</option>
                        <option>Comedy</option>
                      </select>
                      <select className="px-3 py-2 text-sm bg-surface-raised border border-gold/10 rounded-sm text-muted-foreground outline-none">
                        <option>Monetization</option>
                        <option>Subscription</option>
                        <option>Pay-Per-View</option>
                      </select>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-3 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all">
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Creator;
