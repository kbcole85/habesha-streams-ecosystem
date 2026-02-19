import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Subscription {
  id: string;
  plan: string;
  billing_cycle: string;
  status: string;
  current_period_end: string | null;
}

export interface StripeSubscription {
  subscribed: boolean;
  plan: string | null;          // "basic" | "standard" | "premium" | null
  product_id: string | null;
  subscription_end: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  stripeSubscription: StripeSubscription;
  role: string | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const DEFAULT_STRIPE_SUB: StripeSubscription = {
  subscribed: false,
  plan: null,
  product_id: null,
  subscription_end: null,
};

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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<StripeSubscription>(DEFAULT_STRIPE_SUB);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async (userId: string) => {
    try {
      const [profileRes, roleRes, subRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
        supabase.from("subscriptions").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (roleRes.data) setRole(roleRes.data.role);
      if (subRes.data) setSubscription(subRes.data);
    } catch {
      // silent
    }
  };

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setStripeSubscription({
        subscribed: data.subscribed ?? false,
        plan: data.plan ?? null,
        product_id: data.product_id ?? null,
        subscription_end: data.subscription_end ?? null,
      });
    } catch (err) {
      console.error("[AuthContext] check-subscription error:", err);
    }
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfileData(user.id);
  };

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfileData(newSession.user.id);
          // Check Stripe subscription on auth state change (defer so token is ready)
          setTimeout(() => checkSubscription(), 500);
        } else {
          setProfile(null);
          setRole(null);
          setSubscription(null);
          setStripeSubscription(DEFAULT_STRIPE_SUB);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfileData(currentSession.user.id).finally(() => setLoading(false));
        checkSubscription();
      } else {
        setLoading(false);
      }
    });

    return () => authSub.unsubscribe();
  }, [checkSubscription]);

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
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setSubscription(null);
    setStripeSubscription(DEFAULT_STRIPE_SUB);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, subscription, stripeSubscription,
      role, loading, signUp, signIn, signOut, refreshProfile, checkSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
};
