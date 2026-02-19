
-- Analytics events table for tracking play, pause, complete, etc.
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  video_id TEXT,
  event_type TEXT NOT NULL, -- 'play' | 'pause' | 'complete' | 'login' | 'login_failed' | 'subscribe' | 'ppv_purchase'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read analytics
CREATE POLICY "Admins read analytics events"
ON public.analytics_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Any authenticated user can insert their own events (client-side tracking)
CREATE POLICY "Users insert own analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_video_id ON public.analytics_events(video_id);

-- Enable realtime on both analytics and login_attempts tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_attempts;
