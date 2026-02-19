import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  LayoutDashboard, Film, Users, DollarSign, Shield, Settings,
  TrendingUp, Upload, Eye, AlertTriangle, CheckCircle, Clock,
  ChevronRight, BarChart2, Globe, Activity, Bell, Search
} from "lucide-react";

const stats = [
  { label: "Total Revenue", value: "$148,920", change: "+18.4%", positive: true, icon: DollarSign },
  { label: "Active Subscribers", value: "24,851", change: "+12.1%", positive: true, icon: Users },
  { label: "Total Content", value: "1,284", change: "+34 this month", positive: true, icon: Film },
  { label: "Watch Hours", value: "892K", change: "+22.7%", positive: true, icon: Eye },
];

const recentContent = [
  { title: "Axum Chronicles", creator: "Selam Films", status: "approved", views: "12,840", revenue: "$2,456" },
  { title: "Addis Love Story", creator: "Biruk Studio", status: "pending", views: "—", revenue: "—" },
  { title: "Simien Heights", creator: "EthioDoc", status: "approved", views: "8,234", revenue: "$1,678" },
  { title: "Habesha Warriors", creator: "AkashaFilms", status: "rejected", views: "—", revenue: "—" },
  { title: "Tizita Concert Live", creator: "Netsanet Music", status: "approved", views: "31,200", revenue: "$5,821" },
];

const creators = [
  { name: "Selam Films", content: 14, revenue: "$18,450", status: "active", payout: "Pending" },
  { name: "EthioDoc", content: 8, revenue: "$12,340", status: "active", payout: "Paid" },
  { name: "AkashaFilms", content: 22, revenue: "$34,200", status: "active", payout: "Pending" },
  { name: "Biruk Studio", content: 5, revenue: "$4,120", status: "review", payout: "Hold" },
  { name: "Netsanet Music", content: 11, revenue: "$21,890", status: "active", payout: "Paid" },
];

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Film, label: "Content", id: "content" },
  { icon: Users, label: "Users", id: "users" },
  { icon: DollarSign, label: "Finance", id: "finance" },
  { icon: TrendingUp, label: "Analytics", id: "analytics" },
  { icon: Shield, label: "Security", id: "security" },
  { icon: Settings, label: "Settings", id: "settings" },
];

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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-surface border border-gold/10 rounded-sm p-4 hover:border-gold/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 gradient-gold rounded-sm flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-background" />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${stat.positive ? "text-emerald-bright bg-emerald/20" : "text-destructive bg-destructive/20"}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="cinzel text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Recent Content */}
            <div className="lg:col-span-2 bg-surface border border-gold/10 rounded-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
                <h2 className="cinzel text-sm font-bold text-foreground">Recent Content Submissions</h2>
                <button className="text-xs text-gold hover:text-gold-bright">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gold/5">
                      <th className="px-5 py-3 text-left text-muted-foreground font-medium">Title</th>
                      <th className="px-3 py-3 text-left text-muted-foreground font-medium">Creator</th>
                      <th className="px-3 py-3 text-left text-muted-foreground font-medium">Status</th>
                      <th className="px-3 py-3 text-right text-muted-foreground font-medium">Views</th>
                      <th className="px-5 py-3 text-right text-muted-foreground font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentContent.map((c, i) => (
                      <tr key={i} className="border-b border-gold/5 hover:bg-surface-raised transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">{c.title}</td>
                        <td className="px-3 py-3 text-muted-foreground">{c.creator}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                            c.status === "approved" ? "bg-emerald/20 text-emerald-bright" :
                            c.status === "pending" ? "bg-gold/10 text-gold" :
                            "bg-destructive/20 text-destructive"
                          }`}>
                            {c.status === "approved" ? <CheckCircle className="w-2.5 h-2.5" /> :
                             c.status === "pending" ? <Clock className="w-2.5 h-2.5" /> :
                             <AlertTriangle className="w-2.5 h-2.5" />}
                            {c.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground">{c.views}</td>
                        <td className="px-5 py-3 text-right text-gold font-medium">{c.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface border border-gold/10 rounded-sm">
              <div className="px-5 py-4 border-b border-gold/10">
                <h2 className="cinzel text-sm font-bold text-foreground">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { icon: Upload, label: "Upload Content", color: "text-gold" },
                  { icon: Users, label: "Approve Creators", color: "text-emerald-bright", badge: "3" },
                  { icon: DollarSign, label: "Process Payouts", color: "text-gold", badge: "5" },
                  { icon: AlertTriangle, label: "Security Alerts", color: "text-destructive", badge: "2" },
                  { icon: BarChart2, label: "Export Reports", color: "text-muted-foreground" },
                  { icon: Globe, label: "Manage Regions", color: "text-muted-foreground" },
                  { icon: Activity, label: "System Health", color: "text-emerald-bright" },
                ].map((action, i) => (
                  <button key={i} className="w-full flex items-center gap-3 px-3 py-2.5 bg-surface-raised hover:bg-surface-overlay border border-transparent hover:border-gold/20 rounded-sm transition-all duration-200 text-left">
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-xs font-medium text-foreground flex-1">{action.label}</span>
                    {action.badge && (
                      <span className="px-1.5 py-0.5 bg-gold text-background text-[9px] font-bold rounded-sm">{action.badge}</span>
                    )}
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Creator Overview Table */}
          <div className="bg-surface border border-gold/10 rounded-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
              <h2 className="cinzel text-sm font-bold text-foreground">Creator Overview</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs border border-gold/20 text-gold hover:bg-gold hover:text-background rounded-sm transition-all">Approve All Pending</button>
                <button className="px-3 py-1.5 text-xs bg-gold text-background rounded-sm hover:opacity-90">Process Payouts</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gold/5">
                    <th className="px-5 py-3 text-left text-muted-foreground font-medium">Creator</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-medium">Content</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-medium">Revenue</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-medium">Status</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-medium">Payout</th>
                    <th className="px-5 py-3 text-right text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((c, i) => (
                    <tr key={i} className="border-b border-gold/5 hover:bg-surface-raised transition-colors">
                      <td className="px-5 py-3 font-semibold text-foreground">{c.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{c.content}</td>
                      <td className="px-3 py-3 text-gold font-medium">{c.revenue}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          c.status === "active" ? "bg-emerald/20 text-emerald-bright" : "bg-gold/10 text-gold"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          c.payout === "Paid" ? "bg-emerald/20 text-emerald-bright" :
                          c.payout === "Hold" ? "bg-destructive/20 text-destructive" :
                          "bg-gold/10 text-gold"
                        }`}>
                          {c.payout}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="px-2 py-1 text-[10px] border border-gold/20 text-gold rounded-sm hover:bg-gold hover:text-background transition-all">View</button>
                          <button className="px-2 py-1 text-[10px] bg-gold/10 text-gold rounded-sm hover:bg-gold hover:text-background transition-all">Pay</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
