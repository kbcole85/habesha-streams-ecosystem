-- Allow creators to SELECT audit_log rows where target_id is a stream they own.
-- This enables Realtime subscriptions for screenshot/recording events on their streams.
CREATE POLICY "Creators view own stream audit events"
  ON public.audit_logs FOR SELECT
  USING (
    target_id IN (
      SELECT id FROM public.live_streams WHERE creator_id = auth.uid()
    )
  );

-- Enable Realtime so creators can receive push events as soon as a row is inserted.
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
