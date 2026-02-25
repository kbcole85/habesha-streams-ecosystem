import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ENCODING-WORKER] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Find videos that have been processing for >= 2 minutes
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: processingVideos, error } = await supabase
      .from("videos")
      .select("id, title, encoding_started_at, processing_progress")
      .eq("encoding_status", "processing")
      .not("encoding_started_at", "is", null)
      .lte("encoding_started_at", twoMinAgo);

    if (error) {
      logStep("Query error", { error: error.message });
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!processingVideos || processingVideos.length === 0) {
      logStep("No videos ready for encoding transition");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep(`Processing ${processingVideos.length} videos`);

    let succeeded = 0;
    let failed = 0;

    for (const video of processingVideos) {
      const isSuccess = Math.random() > 0.1; // 90% success rate

      if (isSuccess) {
        await supabase.from("videos").update({
          encoding_status: "ready",
          processing_progress: 100,
          encoding_completed_at: new Date().toISOString(),
          encoding_error: null,
        }).eq("id", video.id);
        succeeded++;
        logStep("Video encoding succeeded", { id: video.id, title: video.title });
      } else {
        await supabase.from("videos").update({
          encoding_status: "failed",
          encoding_error: "Simulated transcoding error — please re-upload",
          encoding_completed_at: new Date().toISOString(),
        }).eq("id", video.id);
        failed++;
        logStep("Video encoding failed (simulated)", { id: video.id, title: video.title });
      }

      // Audit log
      await supabase.from("audit_logs").insert({
        action: isSuccess ? "encoding_complete" : "encoding_failed",
        target_id: video.id,
        details: { title: video.title },
      });
    }

    return new Response(JSON.stringify({ processed: processingVideos.length, succeeded, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Worker error", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
