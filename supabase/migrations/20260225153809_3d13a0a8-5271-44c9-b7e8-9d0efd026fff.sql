
-- Add is_subscribed and subscription_period_end to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE;

-- Add ppv_price to videos (admin-editable price per PPV video)
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS ppv_price NUMERIC DEFAULT 0;
