import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Loader2, Play } from "lucide-react";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { checkSubscription, isSubscribed } = useAuth();
  const [checking, setChecking] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const verify = async () => {
      await checkSubscription();
      setAttempts(a => a + 1);
    };
    verify();
    timer = setInterval(() => {
      verify();
    }, 2000);

    // Stop after 10 attempts
    const maxTimer = setTimeout(() => {
      clearInterval(timer);
      setChecking(false);
    }, 20000);

    return () => {
      clearInterval(timer);
      clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    if (isSubscribed) {
      setChecking(false);
      // Redirect to home after 3 seconds
      const t = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(t);
    }
  }, [isSubscribed, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md w-full">
        {isSubscribed ? (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald/10 border-2 border-emerald-bright flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-bright" />
            </div>
            <h1 className="cinzel text-3xl font-black text-foreground mb-3">
              Welcome to <span className="text-gold">Habesha Streams</span>
            </h1>
            <p className="text-muted-foreground mb-2">
              Your subscription is now active. Enjoy unlimited streaming!
            </p>
            <p className="text-xs text-muted-foreground mb-8">Redirecting to homepage…</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
            >
              <Play className="w-4 h-4" />
              Start Watching Now
            </button>
          </>
        ) : checking ? (
          <>
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-6" />
            <h1 className="cinzel text-2xl font-bold text-foreground mb-3">Activating Your Subscription</h1>
            <p className="text-sm text-muted-foreground">
              Verifying your payment with Stripe… This may take a few seconds.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-gold" />
            </div>
            <h1 className="cinzel text-2xl font-bold text-foreground mb-3">Payment Received!</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your payment was successful. Your subscription may take a moment to activate.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 gradient-gold text-background text-sm font-bold rounded-sm hover:opacity-90 transition-all mx-auto"
            >
              Go to Homepage
            </button>
          </>
        )}
      </div>

      <div className="mt-16 flex items-center gap-2 opacity-40">
        <div className="w-6 h-6 gradient-gold rounded-sm flex items-center justify-center">
          <Play className="w-3 h-3 fill-background text-background" />
        </div>
        <span className="cinzel text-xs font-bold text-gold tracking-wider">HABESHA STREAMS</span>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
