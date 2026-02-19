
-- Device sessions table for one-device-per-account enforcement
CREATE TABLE public.device_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  ip_address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users view own device sessions"
ON public.device_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users insert own device sessions"
ON public.device_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users update own device sessions"
ON public.device_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Admins have full access
CREATE POLICY "Admins manage all device sessions"
ON public.device_sessions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast user lookups
CREATE INDEX idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX idx_device_sessions_fingerprint ON public.device_sessions(device_fingerprint);

-- Suspicious login attempts log
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT,
  device_fingerprint TEXT,
  ip_address TEXT,
  attempt_type TEXT NOT NULL, -- 'success' | 'device_mismatch' | 'blocked'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can read login attempts
CREATE POLICY "Admins view login attempts"
ON public.login_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (done from edge functions)
CREATE POLICY "Service role insert login attempts"
ON public.login_attempts FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at DESC);
