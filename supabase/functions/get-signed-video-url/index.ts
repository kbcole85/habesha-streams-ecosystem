import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, d?: unknown) =>
  console.log(`[get-signed-video-url] ${step}${d ? ` – ${JSON.stringify(d)}` : ""}`);

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    /* ── 1. Authenticate via getClaims ── */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Invalid session" }, 401);

    const userId = claimsData.claims.sub as string;
    log("Authenticated", { userId });

    /* ── 2. Service-role client for DB + Storage ── */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    /* ── 3. Parse body ── */
    const { videoId } = await req.json();
    if (!videoId) return json({ error: "videoId is required" }, 400);

    /* ── 4. Fetch video row ── */
    const { data: video, error: vidErr } = await supabase
      .from("videos")
      .select("id, video_url, monetization_type, status, admin_approved, visibility, encoding_status, creator_id")
      .eq("id", videoId)
      .single();

    if (vidErr || !video) return json({ error: "Video not found" }, 404);
    if (!video.video_url) return json({ error: "No video file available" }, 404);

    /* ── 5. Access validation: Admin → Creator → Test Code → PPV → Subscription ── */
    let accessGranted = false;
    let reason = "";

    // 5a. Admin
    const { data: adminRole } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (adminRole) { accessGranted = true; reason = "admin"; }

    // 5b. Creator viewing own video
    if (!accessGranted && video.creator_id === userId) {
      accessGranted = true; reason = "creator_own";
    }

    // 5c. Test code
    if (!accessGranted) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, current_period_end, status")
        .eq("user_id", userId).eq("status", "active").maybeSingle();
      if (
        sub?.stripe_subscription_id?.startsWith("test_code_") &&
        sub.current_period_end &&
        new Date(sub.current_period_end) > new Date()
      ) { accessGranted = true; reason = "test_code"; }
    }

    // 5d. PPV purchase
    if (!accessGranted && video.monetization_type === "ppv") {
      const { data: payment } = await supabase
        .from("payments").select("id")
        .eq("user_id", userId).eq("type", "ppv").eq("status", "succeeded").eq("video_id", video.id).limit(1);
      if (payment && payment.length > 0) { accessGranted = true; reason = "ppv_purchased"; }
    }

    // 5e. Subscription
    if (!accessGranted && video.monetization_type === "subscription") {
      const { data: profile } = await supabase
        .from("profiles").select("is_subscribed").eq("id", userId).single();
      if (profile?.is_subscribed) { accessGranted = true; reason = "subscribed"; }
    }

    if (!accessGranted) {
      log("Access denied", { userId, videoId, monetization: video.monetization_type });
      return json({ error: "Access denied" }, 403);
    }
    log("Access granted", { reason });

    /* ── 6. Extract storage path ── */
    let storagePath = video.video_url as string;

    // Strip legacy full-URL prefixes if present
    const prefixes = ["/storage/v1/object/public/videos/", "/storage/v1/object/sign/videos/"];
    for (const p of prefixes) {
      if (storagePath.includes(p)) { storagePath = storagePath.split(p).pop()!; break; }
    }
    if (storagePath.startsWith("http")) {
      const match = storagePath.match(/\/videos\/(.+)$/);
      if (match) storagePath = match[1];
    }
    storagePath = storagePath.split("?")[0]; // strip query params

    log("Generating signed URL", { storagePath });

    /* ── 7. Generate signed URL (1 hour expiry) ── */
    const { data: signedData, error: signErr } = await supabase.storage
      .from("videos")
      .createSignedUrl(storagePath, 3600);

    if (signErr || !signedData?.signedUrl) {
      log("Signed URL generation failed", { error: signErr?.message, storagePath });
      return json({ error: "Failed to generate video URL", detail: signErr?.message }, 500);
    }

    log("Signed URL generated successfully");
    return json({ signedUrl: signedData.signedUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return json({ error: msg }, 500);
  }
});
