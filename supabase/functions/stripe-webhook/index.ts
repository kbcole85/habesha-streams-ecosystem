import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

// Maps Stripe product IDs → plan names (must match check-subscription)
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U0Wg5zAPSk517W": "basic",
  "prod_U0Wg5HIxekgi8t": "standard",
  "prod_U0Wi3VbILnbCB2": "premium",
};

serve(async (req) => {
  // Stripe sends POST with raw body; no CORS preflight needed for webhooks
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logStep("Missing stripe-signature header");
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    logStep("STRIPE_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    logStep("STRIPE_SECRET_KEY not set");
    return new Response("Stripe key not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Verify the webhook signature
  let event: Stripe.Event;
  const body = await req.text();
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Signature verification failed", { message: msg });
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  // ─── Helper: resolve Stripe customer → Supabase user_id ───────────────────
  const resolveUserId = async (customerId: string): Promise<string | null> => {
    // 1. Check subscriptions table first (fast path)
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.user_id) return data.user_id;

    // 2. Fall back to looking up the customer email in auth
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || !("email" in customer) || !customer.email) return null;

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const match = users.find((u) => u.email === customer.email);
    return match?.id ?? null;
  };

  // ─── Event handlers ────────────────────────────────────────────────────────

  try {
    switch (event.type) {
      // ── Subscription activated / trial started ──
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) { logStep("No user found for customer", { customerId: sub.customer }); break; }

        const productId = sub.items.data[0]?.price.product as string | undefined;
        const plan = productId ? (PRODUCT_TO_PLAN[productId] ?? "basic") : "basic";
        const status = sub.status === "active" || sub.status === "trialing" ? "active" : "inactive";
        const periodEnd   = new Date(sub.current_period_end * 1000).toISOString();
        const periodStart = new Date(sub.current_period_start * 1000).toISOString();
        const trialEnd    = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;

        await supabase.from("subscriptions").upsert({
          user_id:                userId,
          plan,
          status,
          billing_cycle:          "monthly",
          stripe_customer_id:     sub.customer as string,
          stripe_subscription_id: sub.id,
          current_period_start:   periodStart,
          current_period_end:     periodEnd,
          trial_ends_at:          trialEnd,
        }, { onConflict: "user_id" });

        logStep("Subscription upserted", { userId, plan, status, event: event.type });
        break;
      }

      // ── Subscription cancelled (via portal, admin, or non-payment) ──
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) { logStep("No user found for customer", { customerId: sub.customer }); break; }

        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

        await supabase.from("subscriptions")
          .update({
            status:             "inactive",
            current_period_end: periodEnd,
          })
          .eq("user_id", userId);

        logStep("Subscription cancelled", { userId, periodEnd });
        break;
      }

      // ── Successful renewal payment ──
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason !== "subscription_cycle" &&
            invoice.billing_reason !== "subscription_update") break;

        const customerId = invoice.customer as string;
        const userId = await resolveUserId(customerId);
        if (!userId) { logStep("No user found for customer", { customerId }); break; }

        // Fetch the latest subscription to get accurate period dates
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
        if (subs.data.length === 0) break;

        const sub = subs.data[0];
        const periodEnd   = new Date(sub.current_period_end * 1000).toISOString();
        const periodStart = new Date(sub.current_period_start * 1000).toISOString();

        await supabase.from("subscriptions")
          .update({
            status:               "active",
            current_period_start: periodStart,
            current_period_end:   periodEnd,
          })
          .eq("user_id", userId);

        logStep("Renewal recorded", { userId, periodEnd });
        break;
      }

      // ── Failed payment (card declined, expired, etc.) ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await resolveUserId(customerId);
        if (!userId) { logStep("No user found for customer", { customerId }); break; }

        await supabase.from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", userId);

        logStep("Payment failed — status set to past_due", { userId });
        break;
      }

      // ── Trial will end soon (optional: could send in-app notification here) ──
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        logStep("Trial ending soon", { subscriptionId: sub.id });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Handler error", { message: msg });
    return new Response(`Handler Error: ${msg}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
