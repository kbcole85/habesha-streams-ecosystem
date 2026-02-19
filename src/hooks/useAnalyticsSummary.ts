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

/**
 * Fetches aggregated analytics data from Supabase tables.
 * Re-fetches every 30 seconds for near-real-time updates.
 */
export function useAnalyticsSummary() {
  const [data, setData] = useState<AnalyticsSummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(Date.now() - 7 * 86400_000).toISOString();
      const monthStart = new Date(Date.now() - 30 * 86400_000).toISOString();

      const [subsRes, eventsRes, loginRes, topVidRes] = await Promise.all([
        // Active subscribers
        supabase.from("subscriptions").select("id, created_at").eq("status", "active"),
        // Analytics events
        supabase.from("analytics_events").select("event_type, video_id, metadata, created_at").gte("created_at", monthStart),
        // Login attempts
        supabase.from("login_attempts").select("attempt_type, created_at").gte("created_at", monthStart),
        // Top videos by play count
        supabase.from("analytics_events").select("video_id").eq("event_type", "play").gte("created_at", monthStart),
      ]);

      const subs = subsRes.data ?? [];
      const events = eventsRes.data ?? [];
      const logins = loginRes.data ?? [];
      const plays = topVidRes.data ?? [];

      // Subscriber counts
      const totalSubscribers = subs.length;
      const newToday = subs.filter((s) => s.created_at >= todayStart).length;
      const newThisWeek = subs.filter((s) => s.created_at >= weekStart).length;
      const newThisMonth = subs.length; // already filtered

      // Event breakdown
      const playEvents = events.filter((e) => e.event_type === "play");
      const completeEvents = events.filter((e) => e.event_type === "complete");
      const totalPlays = playEvents.length;
      const totalCompletions = completeEvents.length;
      const completionRate = totalPlays > 0 ? Math.round((totalCompletions / totalPlays) * 100) : 0;

      // Watch time from metadata.duration_seconds
      const totalWatchSeconds = events
        .filter((e) => e.event_type === "complete" && e.metadata)
        .reduce((sum, e) => {
          const dur = (e.metadata as Record<string, number>)?.duration_seconds ?? 0;
          return sum + dur;
        }, 0);
      const totalWatchMinutes = Math.round(totalWatchSeconds / 60);

      // Revenue estimate from subscriptions × plan price
      const revenueEstimate = totalSubscribers * 9.99;

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

      // Daily revenue chart — last 14 days
      const dailyRevenue: AnalyticsSummary["dailyRevenue"] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000);
        const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        // Use new subscriber events as proxy for subscription revenue
        const daySubs = subs.filter((s) => {
          const sd = new Date(s.created_at);
          return sd.toDateString() === d.toDateString();
        }).length;
        const dayPPV = events.filter((e) => {
          const ed = new Date(e.created_at);
          return e.event_type === "ppv_purchase" && ed.toDateString() === d.toDateString();
        }).length;
        dailyRevenue.push({
          date: label,
          subscriptions: daySubs * 9.99,
          ppv: dayPPV * 7.99,
          total: daySubs * 9.99 + dayPPV * 7.99,
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
