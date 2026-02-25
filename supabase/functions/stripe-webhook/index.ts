import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U0Wg5zAPSk517W": "basic",
  "prod_U0Wg5HIxekgi8t": "standard",
  "prod_U0Wi3VbILnbCB2": "premium",
};

serve(async (req) => {
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

  // Verify signature
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

  // ─── Dedup: reject duplicate stripe_event_id ───────────────────────────────
  const { data: existingEvent } = await supabase
    .from("subscription_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existingEvent) {
    logStep("Duplicate event, skipping", { eventId: event.id });
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Store raw event
  await supabase.from("subscription_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    raw_payload: event.data.object as Record<string, unknown>,
    user_id: null, // filled below if resolvable
  });

  // ─── Helper: resolve Stripe customer → Supabase user_id ───────────────────
  const resolveUserId = async (customerId: string): Promise<string | null> => {
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.user_id) return data.user_id;

    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || !("email" in customer) || !customer.email) return null;

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const match = users.find((u) => u.email === customer.email);
    return match?.id ?? null;
  };

  // ─── Audit helper ─────────────────────────────────────────────────────────
  const audit = async (action: string, targetId: string | null, details?: Record<string, unknown>) => {
    await supabase.from("audit_logs").insert({
      actor_id: null,
      action,
      target_id: targetId,
      details: details ?? {},
      ip: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || null,
    });
  };

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) { logStep("No user found", { customerId: sub.customer }); break; }

        const productId = sub.items.data[0]?.price.product as string | undefined;
        const plan = productId ? (PRODUCT_TO_PLAN[productId] ?? "basic") : "basic";
        const status = sub.status === "active" || sub.status === "trialing" ? "active" : "inactive";
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        const periodStart = new Date(sub.current_period_start * 1000).toISOString();
        const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan,
          status,
          billing_cycle: "monthly",
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          trial_ends_at: trialEnd,
        }, { onConflict: "user_id" });

        // Update event with user_id
        await supabase.from("subscription_events")
          .update({ user_id: userId })
          .eq("stripe_event_id", event.id);

        await audit("subscription_upsert", userId, { plan, status, event_type: event.type });
        logStep("Subscription upserted", { userId, plan, status });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) { logStep("No user found", { customerId: sub.customer }); break; }

        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        await supabase.from("subscriptions")
          .update({ status: "inactive", current_period_end: periodEnd })
          .eq("user_id", userId);

        await audit("subscription_cancelled", userId, { periodEnd });
        logStep("Subscription cancelled", { userId });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await resolveUserId(customerId);
        if (!userId) { logStep("No user found", { customerId }); break; }

        // Write to payments table
        await supabase.from("payments").insert({
          user_id: userId,
          stripe_payment_intent_id: invoice.payment_intent as string | null,
          stripe_subscription_id: invoice.subscription as string | null,
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency ?? "usd",
          type: invoice.subscription ? "subscription" : "ppv",
          status: "succeeded",
        });

        if (invoice.billing_reason === "subscription_cycle" ||
            invoice.billing_reason === "subscription_update" ||
            invoice.billing_reason === "subscription_create") {
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
          if (subs.data.length > 0) {
            const s = subs.data[0];
            await supabase.from("subscriptions")
              .update({
                status: "active",
                current_period_start: new Date(s.current_period_start * 1000).toISOString(),
                current_period_end: new Date(s.current_period_end * 1000).toISOString(),
              })
              .eq("user_id", userId);
          }
        }

        await audit("payment_succeeded", userId, { amount: (invoice.amount_paid ?? 0) / 100 });
        logStep("Payment succeeded", { userId, amount: invoice.amount_paid });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await resolveUserId(customerId);
        if (!userId) { logStep("No user found", { customerId }); break; }

        await supabase.from("payments").insert({
          user_id: userId,
          stripe_payment_intent_id: invoice.payment_intent as string | null,
          stripe_subscription_id: invoice.subscription as string | null,
          amount: (invoice.amount_due ?? 0) / 100,
          currency: invoice.currency ?? "usd",
          type: invoice.subscription ? "subscription" : "ppv",
          status: "failed",
        });

        await supabase.from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", userId);

        await audit("payment_failed", userId);
        logStep("Payment failed", { userId });
        break;
      }

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
