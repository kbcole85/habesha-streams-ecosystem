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
    "Authorization": `Basic ${creds}`,
    "Content-Type": "application/json",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    req.headers.get("Authorization")?.replace("Bearer ", "") ?? ""
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  const isAdminOrCreator = roleSet.has("admin") || roleSet.has("creator");

  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "create") {
    if (!isAdminOrCreator) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const muxRes = await fetch(`${MUX_BASE}/video/v1/live-streams`, {
      method: "POST",
      headers: muxHeaders(),
      body: JSON.stringify({
        playback_policy: ["public"],
        new_asset_settings: { playback_policy: ["public"] },
        reduced_latency: true,
      }),
    });

    const muxData = await muxRes.json();
    if (!muxRes.ok) {
      return new Response(JSON.stringify({ error: muxData }), { status: 500, headers: corsHeaders });
    }

    const stream = muxData.data;
    const playbackId = stream.playback_ids?.[0]?.id;

    const { data: inserted, error: dbError } = await supabase
      .from("live_streams")
      .insert({
        title: body.title ?? "Live Stream",
        creator_id: user.id,
        mux_stream_id: stream.id,
        mux_stream_key: stream.stream_key,
        mux_playback_id: playbackId,
        playback_url: `https://stream.mux.com/${playbackId}.m3u8`,
        status: "idle",
      })
      .select()
      .single();

    if (dbError) {
      return new Response(JSON.stringify({ error: dbError.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ stream: inserted }), { headers: corsHeaders });
  }

  if (action === "end") {
    if (!isAdminOrCreator) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { data: stream } = await supabase
      .from("live_streams")
      .select("mux_stream_id")
      .eq("id", body.stream_id)
      .eq("creator_id", user.id)
      .single();

    if (!stream) {
      return new Response(JSON.stringify({ error: "Stream not found" }), { status: 404, headers: corsHeaders });
    }

    await fetch(`${MUX_BASE}/video/v1/live-streams/${stream.mux_stream_id}/complete`, {
      method: "PUT",
      headers: muxHeaders(),
    });

    await supabase
      .from("live_streams")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", body.stream_id);

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  if (action === "list") {
    const { data: streams } = await supabase
      .from("live_streams")
      .select("id, title, status, mux_playback_id, playback_url, creator_id, created_at, profiles(display_name)")
      .in("status", ["active", "idle"])
      .order("created_at", { ascending: false });

    return new Response(JSON.stringify({ streams }), { headers: corsHeaders });
  }

  if (action === "get") {
    const { data: stream } = await supabase
      .from("live_streams")
      .select("*, profiles(full_name)")
      .eq("id", body.stream_id)
      .single();

    if (!stream) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
    }

    const muxRes = await fetch(`${MUX_BASE}/video/v1/live-streams/${stream.mux_stream_id}`, {
      headers: muxHeaders(),
    });
    const muxData = await muxRes.json();
    const muxStatus = muxData.data?.status;

    if (muxStatus && muxStatus !== stream.status) {
      await supabase.from("live_streams").update({ status: muxStatus }).eq("id", body.stream_id);
      stream.status = muxStatus;
    }

    return new Response(JSON.stringify({ stream }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
});
