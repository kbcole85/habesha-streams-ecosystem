-- Creator role: self-service signup with admin enable/disable.
--
-- Anyone can grant themselves the 'creator' role (one-tap from the Account
-- page). Admins can disable a creator without deleting the row, which preserves
-- the audit trail of who applied and when. A disabled creator loses creator
-- privileges immediately because has_role() filters on disabled_at IS NULL.

-- 1. Soft-disable column on user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS disabled_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. has_role() now ignores disabled rows. Same signature so all existing
--    RLS policies that call it pick this up automatically.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND disabled_at IS NULL
  )
$$;

-- 3. Allow any signed-in user to grant themselves the creator role.
--    Restricted to role='creator' specifically so users cannot self-promote
--    to admin. Admins still have FOR ALL via the existing "Admins manage roles"
--    policy, so they can insert any role for anyone.
CREATE POLICY "Users can become creator" ON public.user_roles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'creator'
  );
