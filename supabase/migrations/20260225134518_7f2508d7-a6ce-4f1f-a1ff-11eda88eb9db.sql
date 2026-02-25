
-- Fix permissive INSERT policies: restrict to service_role only
-- (These tables are only written to by edge functions using service_role key)

DROP POLICY "Service inserts payments" ON public.payments;
CREATE POLICY "Service role inserts payments"
  ON public.payments FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY "Service inserts subscription events" ON public.subscription_events;
CREATE POLICY "Service role inserts subscription events"
  ON public.subscription_events FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY "Service inserts audit logs" ON public.audit_logs;
CREATE POLICY "Service role inserts audit logs"
  ON public.audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
