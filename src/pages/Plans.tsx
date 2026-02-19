import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, X, Star, Zap, Crown, Shield, ArrowRight, Gift, Loader2, RefreshCw, Settings, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// ─── Stripe Price / Product IDs ───────────────────────────────────────────────
const PLANS_CONFIG = {
  basic: {
    priceId: "price_1T2VdG3FkY3jsYkVxnQVPki5",
    productId: "prod_U0Wg5zAPSk517W",
  },
  standard: {
    priceId: "price_1T2Vda3FkY3jsYkVd4SPOzZi",
    productId: "prod_U0Wg5HIxekgi8t",
  },
  premium: {
    priceId: "price_1T2Vf93FkY3jsYkVTMDQJVfS",
    productId: "prod_U0Wi3VbILnbCB2",
  },
} as const;

// ─── Plan definitions ─────────────────────────────────────────────────────────
const plans = [
  {
    id: "basic" as const,
    name: "Basic",
    icon: Zap,
    monthlyPrice: 4.99,
    description: "Perfect for getting started",
    color: "border-gold/20 hover:border-gold/40",
    badgeColor: "bg-surface-raised text-muted-foreground",
    features: [
      { text: "HD streaming (720p)", included: true },
      { text: "1 screen at a time", included: true },
      { text: "Access to full library", included: true },
      { text: "Mobile & Web apps", included: true },
      { text: "Download to watch offline", included: false },
      { text: "4K Ultra HD", included: false },
      { text: "Dolby Audio", included: false },
      { text: "2 simultaneous screens", included: false },
      { text: "Early access to releases", included: false },
    ],
  },
  {
    id: "standard" as const,
    name: "Standard",
    icon: Star,
    monthlyPrice: 9.99,
    description: "Most popular for families",
    color: "border-gold shadow-gold",
    badgeColor: "bg-gold text-background",
    popular: true,
    features: [
      { text: "Full HD streaming (1080p)", included: true },
      { text: "2 screens at a time", included: true },
      { text: "Access to full library", included: true },
      { text: "Mobile, Web & TV apps", included: true },
      { text: "Download to watch offline", included: true },
      { text: "4K Ultra HD", included: false },
      { text: "Dolby Audio", included: false },
      { text: "5 simultaneous screens", included: false },
      { text: "Early access to releases", included: false },
    ],
  },
  {
    id: "premium" as const,
    name: "Premium",
    icon: Crown,
    monthlyPrice: 15.99,
    description: "The ultimate experience",
    color: "border-gold/40 hover:border-gold/70",
    badgeColor: "bg-surface-overlay text-gold border border-gold/30",
    features: [
      { text: "4K Ultra HD streaming", included: true },
      { text: "5 screens simultaneously", included: true },
      { text: "Access to full library", included: true },
      { text: "All platforms & devices", included: true },
      { text: "Download to watch offline", included: true },
      { text: "4K Ultra HD", included: true },
      { text: "Dolby Atmos Audio", included: true },
      { text: "Early access to releases", included: true },
      { text: "Priority customer support", included: true },
    ],
  },
];

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes. Cancel any time from your account settings or via the Stripe billing portal. No cancellation fees, ever." },
  { q: "What payment methods are accepted?", a: "We accept Visa, Mastercard, AMEX, PayPal, Apple Pay, Google Pay, and more via Stripe." },
  { q: "Is there a free trial?", a: "Yes! All plans include a 7-day free trial. Your card is only charged after the trial ends." },
  { q: "Can I watch on multiple devices?", a: "Yes, depending on your plan. Basic allows 1 screen, Standard allows 2, and Premium allows up to 5 simultaneous streams." },
  { q: "Is PPV content included in subscriptions?", a: "PPV content is separate and requires individual purchase. Subscribers get discounted PPV rates." },
  { q: "What regions are available?", a: "Habesha Streams is available globally. Stripe supports 135+ currencies." },
];

const Plans = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const { user, stripeSubscription, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle redirect back from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "🎉 Subscription activated!", description: "Welcome to Habesha Streams. Your 7-day trial has started." });
      // Poll subscription status until active
      let attempts = 0;
      const poll = setInterval(async () => {
        await checkSubscription();
        attempts++;
        if (attempts >= 6) clearInterval(poll);
      }, 3000);
      return () => clearInterval(poll);
    }
    if (searchParams.get("canceled") === "true") {
      toast({ title: "Checkout cancelled", description: "No charge was made. Choose a plan to continue.", variant: "destructive" });
    }
  }, []);

  const handleCheckout = async (planId: keyof typeof PLANS_CONFIG) => {
    if (!user) {
      navigate("/auth", { state: { from: "/plans" } });
      return;
    }
    setCheckoutLoading(planId);
    try {
      const { priceId } = PLANS_CONFIG[planId];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, planName: planId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast({ title: "Checkout failed", description: String(err), variant: "destructive" });
    }
    setCheckoutLoading(null);
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast({ title: "Billing portal failed", description: String(err), variant: "destructive" });
    }
    setPortalLoading(false);
  };

  const currentPlan = stripeSubscription.plan;
  const isSubscribed = stripeSubscription.subscribed;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="pt-28 pb-12 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 habesha-pattern opacity-40" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="w-4 h-4 text-gold" />
            <span className="text-xs text-gold font-bold tracking-widest uppercase">7-Day Free Trial</span>
          </div>
          <h1 className="cinzel text-4xl md:text-5xl font-black text-foreground mb-4">
            Choose Your <span className="gold-shimmer">Plan</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            Stream East African cinema on any device. Cancel anytime.
          </p>

          {/* Subscription status banner */}
          {isSubscribed && currentPlan && (
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gold/10 border border-gold/30 rounded-sm mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm text-foreground font-medium capitalize">
                Active: <span className="text-gold font-bold">{currentPlan} Plan</span>
                {stripeSubscription.subscription_end && (
                  <span className="text-muted-foreground font-normal">
                    {" "}· renews {new Date(stripeSubscription.subscription_end).toLocaleDateString()}
                  </span>
                )}
              </span>
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-gold text-background text-xs font-bold rounded-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                Manage
              </button>
              <button
                onClick={checkSubscription}
                className="p-1 text-muted-foreground hover:text-gold transition-colors"
                title="Refresh status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            const config = PLANS_CONFIG[plan.id];

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col bg-surface border-2 rounded-sm p-6 transition-all duration-300 ${plan.color} ${plan.popular ? "scale-105" : ""} ${isCurrentPlan ? "ring-2 ring-gold ring-offset-2 ring-offset-background" : ""}`}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 gradient-gold text-background text-xs font-bold rounded-full tracking-wide">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-emerald-bright text-background text-xs font-bold rounded-full tracking-wide">
                      YOUR PLAN ✓
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${plan.popular ? "gradient-gold" : "bg-surface-overlay border border-gold/20"}`}>
                      <Icon className={`w-4 h-4 ${plan.popular ? "text-background" : "text-gold"}`} />
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-sm mb-1 ${plan.badgeColor}`}>
                        {plan.name.toUpperCase()}
                      </span>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="cinzel text-4xl font-black text-foreground">${plan.monthlyPrice}</span>
                    <span className="text-muted-foreground text-sm mb-1">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Billed monthly · 7-day free trial</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {f.included ? (
                        <Check className="w-3.5 h-3.5 text-emerald-bright flex-shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    className="w-full py-3 text-sm font-bold rounded-sm border border-gold/30 text-gold hover:bg-gold hover:text-background hover:border-gold transition-all flex items-center justify-center gap-2"
                  >
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                    Manage Billing
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={checkoutLoading === plan.id}
                    className={`w-full py-3 text-sm font-bold rounded-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                      plan.popular
                        ? "gradient-gold text-background hover:opacity-90 shadow-gold"
                        : "border border-gold/30 text-gold hover:bg-gold hover:text-background hover:border-gold"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {checkoutLoading === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {isSubscribed ? "Switch Plan" : "Start Free Trial"}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 py-6 border-t border-gold/10">
          {[
            { icon: Shield, text: "Secured by Stripe" },
            { icon: Star, text: "4.9/5 Rating" },
            { icon: Check, text: "Cancel Anytime" },
            { icon: Zap, text: "Instant Access" },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <badge.icon className="w-3.5 h-3.5 text-gold" />
              <span>{badge.text}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="cinzel text-2xl font-bold text-center text-foreground mb-8">
            Frequently Asked <span className="text-gold">Questions</span>
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gold/10 rounded-sm bg-surface overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <span className={`text-gold transition-transform duration-200 ${expandedFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-gold/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Plans;
