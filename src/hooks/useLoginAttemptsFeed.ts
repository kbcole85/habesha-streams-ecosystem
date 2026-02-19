import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LoginAttemptRow {
  id: string;
  email: string | null;
  ip_address: string | null;
  device_fingerprint: string | null;
  attempt_type: string; // 'success' | 'device_mismatch' | 'blocked'
  created_at: string;
}

/**
 * Subscribes to the login_attempts table via Supabase Realtime.
 * Returns the last `limit` attempts, live-updated as new rows arrive.
 */
export function useLoginAttemptsFeed(limit = 50) {
  const [attempts, setAttempts] = useState<LoginAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Initial fetch
    supabase
      .from("login_attempts")
      .select("id, email, ip_address, device_fingerprint, attempt_type, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (isMounted.current && data) {
          setAttempts(data as LoginAttemptRow[]);
        }
        setLoading(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel("login-attempts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "login_attempts" },
        (payload) => {
          if (!isMounted.current) return;
          const newRow = payload.new as LoginAttemptRow;
          setAttempts((prev) => [newRow, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { attempts, loading };
}
