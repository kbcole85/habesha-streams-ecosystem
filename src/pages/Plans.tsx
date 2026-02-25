import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Star, Shield, ArrowRight, Loader2, RefreshCw, Settings, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes. Cancel any time from your account settings or via the Stripe billing portal. No cancellation fees, ever." },
  { q: "What payment methods are accepted?", a: "We accept Visa, Mastercard, AMEX, PayPal, Apple Pay, Google Pay, and more via Stripe." },
  { q: "How does billing work?", a: "You are charged $5/month starting immediately. No trial period — instant access to all content." },
  { q: "Can I watch on multiple devices?", a: "Yes, you can stream on up to 5 devices simultaneously." },
  { q: "Is PPV content included in subscriptions?", a: "PPV content is separate and requires individual purchase. Anyone can buy PPV events." },
  { q: "What regions are available?", a: "Habesha Streams is available globally. Stripe supports 135+ currencies." },
];

const features = [
  "Access to full streaming library",
  "Up to 4K Ultra HD quality",
  "Stream on up to 5 devices",
  "Mobile, Web & TV apps",
  "Download to watch offline",
  "East African cinema & TV",
  "Dolby Atmos Audio",
  "Early access to releases",
];

const Plans = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const { user, isSubscribed, subscriptionEnd, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "🎉 Subscription activated!", description: "Welcome to Habesha Streams. Enjoy unlimited streaming!" });
      let attempts = 0;
      const poll = setInterval(async () => {
        await checkSubscription();
        attempts++;
        if (attempts >= 6) clearInterval(poll);
      }, 3000);
      return () => clearInterval(poll);
    }
    if (searchParams.get("canceled") === "true") {
      toast({ title: "Checkout cancelled", description: "No charge was made.", variant: "destructive" });
    }
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/auth", { state: { from: "/plans" } });
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast({ title: "Checkout failed", description: String(err), variant: "destructive" });
    }
    setCheckoutLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="pt-28 pb-12 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 habesha-pattern opacity-40" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-4 h-4 text-gold" />
            <span className="text-xs text-gold font-bold tracking-widest uppercase">Instant Access</span>
          </div>
          <h1 className="cinzel text-4xl md:text-5xl font-black text-foreground mb-4">
            Start Streaming <span className="gold-shimmer">Today</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            One simple plan. Full access. Cancel anytime.
          </p>

          {/* Subscription status banner */}
          {isSubscribed && (
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gold/10 border border-gold/30 rounded-sm mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm text-foreground font-medium">
                Active: <span className="text-gold font-bold">Habesha Streams</span>
                {subscriptionEnd && (
                  <span className="text-muted-foreground font-normal">
                    {" "}· renews {new Date(subscriptionEnd).toLocaleDateString()}
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

      {/* Single Plan Card */}
      <div className="max-w-md mx-auto px-6 pb-16">
        <div className="relative flex flex-col bg-surface border-2 border-gold shadow-gold rounded-sm p-8 text-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 gradient-gold text-background text-xs font-bold rounded-full tracking-wide">
              FULL ACCESS
            </span>
          </div>

          <div className="w-12 h-12 gradient-gold rounded-sm flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 text-background fill-background" />
          </div>

          <h2 className="cinzel text-xl font-bold text-foreground mb-1">Habesha Streams</h2>
          <p className="text-xs text-muted-foreground mb-6">Everything you need. One price.</p>

          <div className="flex items-end justify-center gap-1 mb-6">
            <span className="cinzel text-5xl font-black text-foreground">$5</span>
            <span className="text-muted-foreground text-sm mb-1">/month</span>
          </div>

          <p className="text-xs text-muted-foreground mb-6">Billed monthly · Cancel anytime</p>

          {/* Features */}
          <ul className="space-y-2.5 mb-8 text-left">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-bright flex-shrink-0" />
                <span className="text-xs text-foreground">{f}</span>
              </li>
            ))}
          </ul>

          {isSubscribed ? (
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
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full py-3 text-sm font-bold rounded-sm gradient-gold text-background hover:opacity-90 shadow-gold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Subscribe — $5/month
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 py-6 border-t border-gold/10">
          {[
            { icon: Shield, text: "Secured by Stripe" },
            { icon: Star, text: "4.9/5 Rating" },
            { icon: Check, text: "Cancel Anytime" },
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
