
-- Fix: restrict login_attempts INSERT to service role only (drop the overly permissive policy)
DROP POLICY IF EXISTS "Service role insert login attempts" ON public.login_attempts;

-- Login attempts are only written by edge functions using service role key — no client-side insert needed
-- The admin SELECT policy already exists; no INSERT policy means only service-role can insert
