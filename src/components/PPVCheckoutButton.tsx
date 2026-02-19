import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Loader2, Lock, Tv } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// The PPV price created in Stripe ($7.99)
const PPV_PRICE_ID = "price_1RBZi63FkY3jsYkVGp5lAIq9";

interface Props {
  eventTitle: string;
  /** Visual variant — "card" for Browse grid, "banner" for Watch page */
  variant?: "card" | "banner";
  className?: string;
}

const PPVCheckoutButton = ({ eventTitle, variant = "card", className = "" }: Props) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBuy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/auth", { state: { from: location.pathname } });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-ppv-payment", {
        body: { priceId: PPV_PRICE_ID, eventTitle },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast({
        title: "Purchase failed",
        description: String(err),
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  if (variant === "banner") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3 text-gold" />
          <span>Premium live event · 48-hour access window</span>
        </div>
        <button
          onClick={handleBuy}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 gradient-gold text-background font-bold text-sm rounded-sm hover:opacity-90 transition-all shadow-gold disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Ticket className="w-4 h-4" />
              Buy PPV Access · $7.99
            </>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground">
          Secure checkout · Instant access · Powered by Stripe
        </p>
      </div>
    );
  }

  // "card" variant — compact button shown on the content card
  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 gradient-gold text-background text-[10px] font-bold rounded-sm hover:opacity-90 transition-all shadow-gold disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <>
          <Tv className="w-3 h-3" />
          Buy PPV · $7.99
        </>
      )}
    </button>
  );
};

export default PPVCheckoutButton;
