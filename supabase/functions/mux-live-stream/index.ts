import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MUX_BASE = "https://api.mux.com";

function muxHeaders() {
  const id = Deno.env.get("MUX_TOKEN_ID") ?? "";
  const secret = Deno.env.get("MUX_TOKEN_SECRET") ?? "";
  const creds = btoa(`${id}:${secret}`);
  return {
    Authorization: `Basic ${creds}`,
    "Content-Type": "application/json",
  };
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader);
  if (authError || !user) return respond({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  // Helper: check creator/admin role. Filters out admin-disabled rows so a
  // disabled creator cannot create new live streams.
  const checkCreator = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "creator"])
      .is("disabled_at", null)
      .maybeSingle();
    return !!data;
  };

  // ── CREATE ─────────────────────────────────────────────────────────────────
  if (action === "create") {
    if (!(await checkCreator())) return respond({ error: "Forbidden" }, 403);

    const title = (body.title as string | undefined)?.trim() || "Live Stream";

    const muxRes = await fetch(`${MUX_BASE}/video/v1/live-streams`, {
      method: "POST",
      headers: muxHeaders(),
      body: JSON.stringify({
        playback_policy: ["public"],
        new_asset_settings: { playback_policy: ["public"] },
        reduced_latency: true,
      }),
    });

    if (!muxRes.ok) {
      const muxErr = await muxRes.json().catch(() => ({}));
      console.error("Mux create error:", muxErr);
      return respond({ error: "Failed to create Mux stream", detail: muxErr }, 500);
    }

    const muxData = await muxRes.json();
    const muxStream = muxData.data;

    if (!muxStream?.id || !muxStream?.stream_key) {
      return respond({ error: "Mux returned invalid stream data" }, 500);
    }

    const playbackId = muxStream.playback_ids?.[0]?.id ?? null;

    const { data: inserted, error: dbError } = await supabase
      .from("live_streams")
      .insert({
        title,
        creator_id: user.id,
        mux_stream_id: muxStream.id,
        mux_stream_key: muxStream.stream_key,
        mux_playback_id: playbackId,
        playback_url: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
        status: "idle",
      })
      .select("id, title, status, mux_stream_key, mux_playback_id, playback_url, creator_id, created_at")
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return respond({ error: dbError.message }, 500);
    }

    return respond({ stream: inserted });
  }

  // ── END ────────────────────────────────────────────────────────────────────
  if (action === "end") {
    if (!(await checkCreator())) return respond({ error: "Forbidden" }, 403);

    if (!body.stream_id) return respond({ error: "stream_id required" }, 400);

    const { data: stream } = await supabase
      .from("live_streams")
      .select("mux_stream_id")
      .eq("id", body.stream_id)
      .eq("creator_id", user.id)
      .single();

    if (!stream) return respond({ error: "Stream not found" }, 404);

    // Signal Mux to complete the stream
    await fetch(`${MUX_BASE}/video/v1/live-streams/${stream.mux_stream_id}/complete`, {
      method: "PUT",
      headers: muxHeaders(),
    });

    await supabase
      .from("live_streams")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", body.stream_id);

    return respond({ success: true });
  }

  // ── LIST ───────────────────────────────────────────────────────────────────
  if (action === "list") {
    const { data: streams, error: listErr } = await supabase
      .from("live_streams")
      .select("id, title, status, mux_playback_id, playback_url, creator_id, created_at, profiles(display_name)")
      .in("status", ["active", "idle"])
      .order("created_at", { ascending: false });

    if (listErr) return respond({ error: listErr.message }, 500);
    return respond({ streams: streams ?? [] });
  }

  // ── GET ────────────────────────────────────────────────────────────────────
  if (action === "get") {
    if (!body.stream_id) return respond({ error: "stream_id required" }, 400);

    const { data: stream, error: getErr } = await supabase
      .from("live_streams")
      .select(
        "id, title, status, mux_stream_id, mux_playback_id, playback_url, creator_id, created_at, profiles(display_name)",
      )
      .eq("id", body.stream_id)
      .single();

    if (getErr || !stream) return respond({ error: "Not found" }, 404);

    // Sync real status from Mux
    try {
      const muxRes = await fetch(`${MUX_BASE}/video/v1/live-streams/${stream.mux_stream_id}`, {
        headers: muxHeaders(),
      });
      if (muxRes.ok) {
        const muxData = await muxRes.json();
        const muxStatus = muxData.data?.status as string | undefined;
        if (muxStatus && muxStatus !== stream.status) {
          await supabase.from("live_streams").update({ status: muxStatus }).eq("id", body.stream_id);
          stream.status = muxStatus;
        }
      }
    } catch (e) {
      console.warn("Mux status sync failed:", e);
    }

    return respond({ stream });
  }

  return respond({ error: "Unknown action" }, 400);
});
