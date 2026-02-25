import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceFingerprint, getDeviceName } from "@/lib/deviceFingerprint";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_subscribed: boolean;
  subscription_period_end: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  isSubscribed: boolean;
  subscriptionEnd: string | null;
  deviceBlocked: boolean;
  deviceBlockReason: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [deviceBlockReason, setDeviceBlockReason] = useState<string | null>(null);

  const fetchProfileData = async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (profileRes.data) {
        setProfile({
          id: profileRes.data.id,
          email: profileRes.data.email,
          display_name: profileRes.data.display_name,
          avatar_url: profileRes.data.avatar_url,
          is_subscribed: profileRes.data.is_subscribed ?? false,
          subscription_period_end: profileRes.data.subscription_period_end ?? null,
        });
      }
      if (rolesRes.data && rolesRes.data.length > 0) {
        const PRIORITY: Record<string, number> = { admin: 3, creator: 2, user: 1 };
        const top = rolesRes.data.reduce((best, cur) =>
          (PRIORITY[cur.role] ?? 0) > (PRIORITY[best.role] ?? 0) ? cur : best
        );
        setRole(top.role);
      }
    } catch (err) {
      console.error("[AuthContext] Failed to fetch profile data:", err);
    }
  };

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      // The edge function updates the profile in DB; refresh local state
      if (user) {
        await fetchProfileData(user.id);
      }
    } catch (err) {
      console.error("[AuthContext] check-subscription error:", err);
    }
  }, [user]);

  const runDeviceValidation = useCallback(async () => {
    try {
      const fingerprint = await getDeviceFingerprint();
      const deviceName = getDeviceName();
      const { data, error } = await supabase.functions.invoke("device-validate", {
        body: { action: "validate", deviceFingerprint: fingerprint, deviceName },
      });
      if (!error && data?.status === "blocked") {
        setDeviceBlocked(true);
        setDeviceBlockReason(data.reason ?? "This account is linked to a different device.");
        await supabase.auth.signOut();
      } else {
        setDeviceBlocked(false);
        setDeviceBlockReason(null);
      }
    } catch {
      // Non-critical
    }
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfileData(user.id);
  };

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          fetchProfileData(newSession.user.id).then(() => {
            setLoading(false);
          }).catch(() => {
            setLoading(false);
          });
          setTimeout(() => {
            supabase.functions.invoke("check-subscription").then(() => {
              if (newSession?.user) fetchProfileData(newSession.user.id);
            });
          }, 500);
          setTimeout(() => runDeviceValidation(), 800);
        } else {
          setProfile(null);
          setRole(null);
          setDeviceBlocked(false);
          setDeviceBlockReason(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfileData(currentSession.user.id).finally(() => setLoading(false));
        supabase.functions.invoke("check-subscription").then(() => {
          if (currentSession?.user) fetchProfileData(currentSession.user.id);
        });
        runDeviceValidation();
      } else {
        setLoading(false);
      }
    });

    const safetyTimer = setTimeout(() => setLoading(false), 5000);

    return () => {
      authSub.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [runDeviceValidation]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setTimeout(async () => {
        try {
          const fingerprint = await getDeviceFingerprint();
          const deviceName = getDeviceName();
          await supabase.functions.invoke("device-validate", {
            body: { action: "validate", deviceFingerprint: fingerprint, deviceName },
          });
        } catch { /* non-critical */ }
      }, 600);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setDeviceBlocked(false);
    setDeviceBlockReason(null);
  };

  const isSubscribed = profile?.is_subscribed ?? false;
  const subscriptionEnd = profile?.subscription_period_end ?? null;

  return (
    <AuthContext.Provider value={{
      user, session, profile, role, loading,
      isSubscribed, subscriptionEnd,
      deviceBlocked, deviceBlockReason,
      signUp, signIn, signOut, refreshProfile, checkSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
};
