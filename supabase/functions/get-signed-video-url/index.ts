import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, d?: unknown) =>
  console.log(`[GET-SIGNED-VIDEO-URL] ${step}${d ? ` - ${JSON.stringify(d)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // 1. Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token);
    if (userErr || !user) throw new Error("Invalid session");
    log("Authenticated", { userId: user.id });

    // 2. Parse body
    const { videoId } = await req.json();
    if (!videoId) throw new Error("videoId is required");

    // 3. Fetch video row (service role bypasses RLS)
    const { data: video, error: vidErr } = await supabase
      .from("videos")
      .select("id, video_url, monetization_type, ppv_price, status, admin_approved, visibility, encoding_status, creator_id")
      .eq("id", videoId)
      .single();

    if (vidErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!video.video_url) {
      return new Response(JSON.stringify({ error: "No video file available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Access validation: Admin → Test Code → PPV → Subscription
    let accessGranted = false;
    let accessReason = "";

    // 4a. Admin check
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (adminRole) {
      accessGranted = true;
      accessReason = "admin";
    }

    // 4b. Creator viewing own video
    if (!accessGranted && video.creator_id === user.id) {
      accessGranted = true;
      accessReason = "creator_own";
    }

    // 4c. Test code check
    if (!accessGranted) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, current_period_end, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (
        sub?.stripe_subscription_id?.startsWith("test_code_") &&
        sub.current_period_end &&
        new Date(sub.current_period_end) > new Date()
      ) {
        accessGranted = true;
        accessReason = "test_code";
      }
    }

    // 4d. PPV purchase check
    if (!accessGranted && video.monetization_type === "ppv") {
      const { data: payment } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "ppv")
        .eq("status", "succeeded")
        .eq("video_id", video.id)
        .limit(1);

      if (payment && payment.length > 0) {
        accessGranted = true;
        accessReason = "ppv_purchased";
      }
    }

    // 4e. Subscription check
    if (!accessGranted && video.monetization_type === "subscription") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", user.id)
        .single();

      if (profile?.is_subscribed) {
        accessGranted = true;
        accessReason = "subscribed";
      }
    }

    if (!accessGranted) {
      log("Access denied", { userId: user.id, videoId, monetization: video.monetization_type });
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Access granted", { reason: accessReason });

    // 5. Generate signed URL
    // video_url may be a relative path OR a legacy full URL — extract path
    let storagePath = video.video_url as string;
    // Strip full Supabase URL prefix if present (legacy uploads)
    const publicPrefix = `/storage/v1/object/public/videos/`;
    const signedPrefix = `/storage/v1/object/sign/videos/`;
    if (storagePath.includes(publicPrefix)) {
      storagePath = storagePath.split(publicPrefix).pop()!;
    } else if (storagePath.includes(signedPrefix)) {
      storagePath = storagePath.split(signedPrefix).pop()!;
    } else if (storagePath.startsWith("http")) {
      // Try generic extraction
      const match = storagePath.match(/\/videos\/(.+)$/);
      if (match) storagePath = match[1];
    }
    // Remove query params if any
    storagePath = storagePath.split("?")[0];

    log("Generating signed URL", { storagePath });

    const { data: signedData, error: signErr } = await supabase.storage
      .from("videos")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (signErr || !signedData?.signedUrl) {
      log("Signed URL error", { error: signErr?.message });
      return new Response(
        JSON.stringify({ error: "Failed to generate video URL" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: signedData.signedUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
