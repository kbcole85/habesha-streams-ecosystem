import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DEVICE-VALIDATE] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Service-role client for logging + admin writes
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  // User-scoped client for auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization header" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userErr,
  } = await adminClient.auth.getUser(token);
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const { deviceFingerprint, deviceName, action } = await req.json();
    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? "";

    logStep("Request", { userId: user.id, action, deviceName });

    // ── REGISTER: first-time device registration ─────────────────────────────
    if (action === "register") {
      // Deactivate any old sessions first
      await adminClient.from("device_sessions").update({ is_active: false }).eq("user_id", user.id);

      // Insert new session
      const { error: insertErr } = await adminClient.from("device_sessions").insert({
        user_id: user.id,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName ?? "Unknown Device",
        user_agent: userAgent,
        ip_address: ipAddress,
        is_active: true,
      });

      if (insertErr) throw insertErr;

      // Log success
      await adminClient.from("login_attempts").insert({
        user_id: user.id,
        email: user.email,
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress,
        attempt_type: "success",
      });

      logStep("Device registered", { userId: user.id });
      return new Response(JSON.stringify({ status: "registered" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── VALIDATE: check fingerprint matches stored session ────────────────────
    if (action === "validate") {
      const { data: sessions } = await adminClient
        .from("device_sessions")
        .select("device_fingerprint, id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);

      if (!sessions || sessions.length === 0) {
        // No registered device — allow and register
        logStep("No session found, registering");
        await adminClient.from("device_sessions").insert({
          user_id: user.id,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName ?? "Unknown Device",
          user_agent: userAgent,
          ip_address: ipAddress,
          is_active: true,
        });
        return new Response(JSON.stringify({ status: "registered" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const storedFingerprint = sessions[0].device_fingerprint;
      const sessionId = sessions[0].id;

      if (storedFingerprint !== deviceFingerprint) {
        // Device mismatch — log and block
        logStep("Device mismatch — blocking", { userId: user.id });
        await adminClient.from("login_attempts").insert({
          user_id: user.id,
          email: user.email,
          device_fingerprint: deviceFingerprint,
          ip_address: ipAddress,
          attempt_type: "device_mismatch",
        });
        return new Response(
          JSON.stringify({
            status: "blocked",
            reason: "This account is linked to a different device. Contact support to reset your device.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
        );
      }

      // Match — update last active
      await adminClient
        .from("device_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", sessionId);

      logStep("Device validated OK", { userId: user.id });
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── RESET: admin forces device re-registration for a user ─────────────────
    if (action === "reset") {
      // Check caller is admin (and not admin-disabled)
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .is("disabled_at", null)
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }

      const { targetUserId } = await req.json().catch(() => ({}));
      const resetUserId = (await req.json().catch(() => ({ targetUserId: null }))).targetUserId ?? "";

      await adminClient
        .from("device_sessions")
        .update({ is_active: false })
        .eq("user_id", resetUserId || targetUserId);

      logStep("Device reset by admin", { adminId: user.id, targetUserId: resetUserId || targetUserId });
      return new Response(JSON.stringify({ status: "reset" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
