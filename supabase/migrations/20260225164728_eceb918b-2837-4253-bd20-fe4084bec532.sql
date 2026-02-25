
-- Add video_id column to payments table for PPV purchase tracking
ALTER TABLE public.payments ADD COLUMN video_id text NULL;

-- Index for fast PPV purchase lookups
CREATE INDEX idx_payments_ppv_lookup ON public.payments (user_id, video_id, type, status);
