import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logStep("Missing stripe-signature header");
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) return new Response("Webhook secret not configured", { status: 500 });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return new Response("Stripe key not configured", { status: 500 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

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

  // Dedup
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
    user_id: null,
  });

  // Resolve Stripe customer → user_id
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

  // Audit helper
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
      // ── Subscription created/updated ──
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) { logStep("No user found", { customerId: sub.customer }); break; }

        const isActive = sub.status === "active" || sub.status === "trialing";
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        const periodStart = new Date(sub.current_period_start * 1000).toISOString();

        // Update profiles — single source of truth for access
        await supabase.from("profiles").update({
          is_subscribed: isActive,
          subscription_period_end: periodEnd,
        }).eq("id", userId);

        // Sync subscriptions table
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan: "monthly",
          status: isActive ? "active" : "inactive",
          billing_cycle: "monthly",
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        }, { onConflict: "user_id" });

        await supabase.from("subscription_events").update({ user_id: userId }).eq("stripe_event_id", event.id);
        await audit("subscription_upsert", userId, { status: isActive ? "active" : "inactive", event_type: event.type });
        logStep("Subscription upserted", { userId, isActive });
        break;
      }

      // ── Subscription deleted ──
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) { logStep("No user found", { customerId: sub.customer }); break; }

        await supabase.from("profiles").update({ is_subscribed: false }).eq("id", userId);
        await supabase.from("subscriptions").update({ status: "inactive", current_period_end: new Date(sub.current_period_end * 1000).toISOString() }).eq("user_id", userId);

        await audit("subscription_cancelled", userId);
        logStep("Subscription cancelled", { userId });
        break;
      }

      // ── Payment succeeded ──
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await resolveUserId(customerId);
        if (!userId) { logStep("No user found", { customerId }); break; }

        await supabase.from("payments").insert({
          user_id: userId,
          stripe_payment_intent_id: invoice.payment_intent as string | null,
          stripe_subscription_id: invoice.subscription as string | null,
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency ?? "usd",
          type: invoice.subscription ? "subscription" : "ppv",
          status: "succeeded",
        });

        // On subscription payment, ensure profile is marked subscribed
        if (invoice.subscription) {
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
          if (subs.data.length > 0) {
            const s = subs.data[0];
            const periodEnd = new Date(s.current_period_end * 1000).toISOString();
            await supabase.from("profiles").update({
              is_subscribed: true,
              subscription_period_end: periodEnd,
            }).eq("id", userId);
          }
        }

        await audit("payment_succeeded", userId, { amount: (invoice.amount_paid ?? 0) / 100 });
        logStep("Payment succeeded", { userId, amount: invoice.amount_paid });
        break;
      }

      // ── Payment failed ──
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

        await supabase.from("profiles").update({ is_subscribed: false }).eq("id", userId);
        await supabase.from("subscriptions").update({ status: "past_due" }).eq("user_id", userId);

        await audit("payment_failed", userId);
        logStep("Payment failed", { userId });
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
