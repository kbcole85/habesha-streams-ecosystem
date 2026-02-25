
-- Drop the overly permissive policy
DROP POLICY "Service role manages test codes" ON public.test_access_codes;

-- Users cannot directly modify this table - only edge functions with service_role can
-- No additional policies needed since edge functions use service_role which bypasses RLS
