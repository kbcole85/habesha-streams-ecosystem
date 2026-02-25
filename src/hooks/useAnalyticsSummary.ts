import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsSummary {
  totalSubscribers: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  totalWatchMinutes: number;
  totalPlays: number;
  totalCompletions: number;
  completionRate: number;
  revenueEstimate: number;
  recentEvents: Array<{ event_type: string; count: number }>;
  topVideos: Array<{ video_id: string; plays: number }>;
  dailyRevenue: Array<{ date: string; subscriptions: number; ppv: number; total: number }>;
  loginSuccessRate: number;
  suspiciousAttempts: number;
}

const EMPTY: AnalyticsSummary = {
  totalSubscribers: 0,
  newToday: 0,
  newThisWeek: 0,
  newThisMonth: 0,
  totalWatchMinutes: 0,
  totalPlays: 0,
  totalCompletions: 0,
  completionRate: 0,
  revenueEstimate: 0,
  recentEvents: [],
  topVideos: [],
  dailyRevenue: [],
  loginSuccessRate: 100,
  suspiciousAttempts: 0,
};

export function useAnalyticsSummary() {
  const [data, setData] = useState<AnalyticsSummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(Date.now() - 7 * 86400_000).toISOString();
      const monthStart = new Date(Date.now() - 30 * 86400_000).toISOString();

      const [subsRes, eventsRes, loginRes, topVidRes, paymentsRes] = await Promise.all([
        supabase.from("subscriptions").select("id, created_at").eq("status", "active"),
        supabase.from("analytics_events").select("event_type, video_id, metadata, created_at").gte("created_at", monthStart),
        supabase.from("login_attempts").select("attempt_type, created_at").gte("created_at", monthStart),
        supabase.from("analytics_events").select("video_id").eq("event_type", "play").gte("created_at", monthStart),
        // Real revenue from payments table
        supabase.from("payments").select("amount, type, created_at").eq("status", "succeeded").gte("created_at", monthStart),
      ]);

      const subs = subsRes.data ?? [];
      const events = eventsRes.data ?? [];
      const logins = loginRes.data ?? [];
      const plays = topVidRes.data ?? [];
      const payments = paymentsRes.data ?? [];

      const totalSubscribers = subs.length;
      const newToday = subs.filter((s) => s.created_at >= todayStart).length;
      const newThisWeek = subs.filter((s) => s.created_at >= weekStart).length;
      const newThisMonth = subs.length;

      const playEvents = events.filter((e) => e.event_type === "play");
      const completeEvents = events.filter((e) => e.event_type === "complete");
      const totalPlays = playEvents.length;
      const totalCompletions = completeEvents.length;
      const completionRate = totalPlays > 0 ? Math.round((totalCompletions / totalPlays) * 100) : 0;

      const totalWatchSeconds = events
        .filter((e) => e.event_type === "complete" && e.metadata)
        .reduce((sum, e) => {
          const dur = (e.metadata as Record<string, number>)?.duration_seconds ?? 0;
          return sum + dur;
        }, 0);
      const totalWatchMinutes = Math.round(totalWatchSeconds / 60);

      // Revenue from payments table (authoritative)
      const revenueEstimate = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Top videos
      const vidCounts: Record<string, number> = {};
      plays.forEach((p) => {
        if (p.video_id) vidCounts[p.video_id] = (vidCounts[p.video_id] ?? 0) + 1;
      });
      const topVideos = Object.entries(vidCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([video_id, plays]) => ({ video_id, plays }));

      // Login stats
      const successLogins = logins.filter((l) => l.attempt_type === "success").length;
      const totalLogins = logins.length;
      const loginSuccessRate = totalLogins > 0 ? Math.round((successLogins / totalLogins) * 100) : 100;
      const suspiciousAttempts = logins.filter((l) => l.attempt_type === "device_mismatch").length;

      // Daily revenue from payments table (authoritative)
      const dailyRevenue: AnalyticsSummary["dailyRevenue"] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000);
        const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        const dayStr = d.toDateString();

        const daySubs = payments.filter((p) => {
          return p.type === "subscription" && new Date(p.created_at).toDateString() === dayStr;
        }).reduce((s, p) => s + Number(p.amount), 0);

        const dayPPV = payments.filter((p) => {
          return p.type === "ppv" && new Date(p.created_at).toDateString() === dayStr;
        }).reduce((s, p) => s + Number(p.amount), 0);

        dailyRevenue.push({
          date: label,
          subscriptions: daySubs,
          ppv: dayPPV,
          total: daySubs + dayPPV,
        });
      }

      setData({
        totalSubscribers,
        newToday,
        newThisWeek,
        newThisMonth,
        totalWatchMinutes,
        totalPlays,
        totalCompletions,
        completionRate,
        revenueEstimate,
        recentEvents: [],
        topVideos,
        dailyRevenue,
        loginSuccessRate,
        suspiciousAttempts,
      });
    } catch (err) {
      console.error("[useAnalyticsSummary]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, refetch: fetchData };
}
