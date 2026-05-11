create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  mux_stream_id text not null,
  mux_stream_key text not null,
  mux_playback_id text,
  playback_url text,
  status text not null default 'idle', -- idle | active | ended
  viewer_count integer default 0,
  ended_at timestamptz,
  created_at timestamptz default now()
);

alter table public.live_streams enable row level security;

-- Anyone can read active streams
create policy "Anyone can view active streams"
  on public.live_streams for select
  using (status in ('active', 'idle'));

-- Only creator/admin can insert/update/delete their own streams
create policy "Creators manage their streams"
  on public.live_streams for all
  using (creator_id = auth.uid());
