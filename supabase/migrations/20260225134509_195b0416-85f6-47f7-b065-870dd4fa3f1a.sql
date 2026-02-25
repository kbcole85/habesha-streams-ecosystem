
-- ═══════════════════════════════════════════════════════════════
-- PART 1: Financial Integrity Layer
-- ═══════════════════════════════════════════════════════════════

-- Payments table (no FK to auth.users per guidelines)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  type TEXT NOT NULL CHECK (type IN ('subscription','ppv')),
  status TEXT NOT NULL CHECK (status IN ('pending','succeeded','failed','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service inserts payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_payments_status_created ON public.payments (status, created_at);
CREATE INDEX idx_payments_user ON public.payments (user_id);

-- Subscription events table
CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view subscription events"
  ON public.subscription_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service inserts subscription events"
  ON public.subscription_events FOR INSERT
  WITH CHECK (true);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service inserts audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- PART 2: Video encoding columns
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS encoding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS encoding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS encoding_error TEXT,
  ADD COLUMN IF NOT EXISTS processing_progress INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_seconds INT;

-- ═══════════════════════════════════════════════════════════════
-- PART 3: Geo restriction columns
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS allowed_countries TEXT[],
  ADD COLUMN IF NOT EXISTS blocked_countries TEXT[];

-- ═══════════════════════════════════════════════════════════════
-- PART 4: Performance indexes
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_videos_encoding_status ON public.videos (encoding_status);
CREATE INDEX IF NOT EXISTS idx_videos_public_filter ON public.videos (status, admin_approved, visibility, encoding_status);
CREATE INDEX IF NOT EXISTS idx_videos_country ON public.videos USING GIN (allowed_countries, blocked_countries);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON public.login_attempts (user_id, created_at DESC);
