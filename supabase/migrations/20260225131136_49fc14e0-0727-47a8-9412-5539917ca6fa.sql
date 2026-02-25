-- Allow anyone (including unauthenticated) to view approved public videos
DROP POLICY IF EXISTS "Approved videos viewable by all authenticated" ON public.videos;

CREATE POLICY "Public approved videos viewable by anyone"
ON public.videos FOR SELECT
USING (
  status = 'approved'
  AND admin_approved = true
  AND visibility = 'public'
  AND encoding_status = 'ready'
);

-- Keep creator/admin policies as they are (they use OR logic via restrictive=false default)
