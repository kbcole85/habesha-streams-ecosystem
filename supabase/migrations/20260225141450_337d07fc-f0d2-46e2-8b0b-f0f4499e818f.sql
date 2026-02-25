
-- Create test access codes table
CREATE TABLE public.test_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  assigned_user UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_access_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can view all codes
CREATE POLICY "Admins view all test codes"
ON public.test_access_codes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert/update (edge function uses service role)
CREATE POLICY "Service role manages test codes"
ON public.test_access_codes
FOR ALL
USING (true)
WITH CHECK (true);
