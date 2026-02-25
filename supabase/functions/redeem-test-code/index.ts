import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) throw new Error("Invalid session");

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Code is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmedCode = code.trim().toUpperCase();

    // Check if user already redeemed a code
    const { data: existing } = await supabase
      .from("test_access_codes")
      .select("id")
      .eq("assigned_user", user.id)
      .eq("is_used", true)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "You have already redeemed a test code." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the code
    const { data: codeRow, error: codeErr } = await supabase
      .from("test_access_codes")
      .select("*")
      .eq("code", trimmedCode)
      .single();

    if (codeErr || !codeRow) {
      return new Response(JSON.stringify({ error: "Invalid test code." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (codeRow.is_used) {
      return new Response(JSON.stringify({ error: "This code has already been used." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(codeRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This code has expired." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark code as used
    const { error: updateCodeErr } = await supabase
      .from("test_access_codes")
      .update({ is_used: true, assigned_user: user.id })
      .eq("id", codeRow.id);

    if (updateCodeErr) throw new Error("Failed to redeem code");

    // Activate premium subscription (30 days)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      plan: "premium",
      billing_cycle: "monthly",
      status: "active",
      stripe_customer_id: null,
      stripe_subscription_id: `test_code_${codeRow.code}`,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: "user_id" });

    // Audit log
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "test_code_redeemed",
      target_id: codeRow.id,
      details: { code: codeRow.code, plan: "premium", expires: periodEnd.toISOString() },
    });

    console.log(`[REDEEM-TEST-CODE] User ${user.id} redeemed code ${codeRow.code}`);

    return new Response(JSON.stringify({
      success: true,
      plan: "premium",
      expires: periodEnd.toISOString(),
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[REDEEM-TEST-CODE] Error: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
