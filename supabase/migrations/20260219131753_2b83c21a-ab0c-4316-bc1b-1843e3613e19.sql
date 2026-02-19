
-- Add visibility and encoding_status columns to videos
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public')),
  ADD COLUMN IF NOT EXISTS encoding_status text NOT NULL DEFAULT 'ready'
    CHECK (encoding_status IN ('processing', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT NULL;

-- Back-fill existing approved videos to public visibility + ready encoding
UPDATE public.videos
SET visibility = 'public', encoding_status = 'ready', published_at = updated_at
WHERE status = 'approved' AND admin_approved = true;

-- Back-fill existing pending/rejected videos to private
UPDATE public.videos
SET visibility = 'private'
WHERE status != 'approved' OR admin_approved = false;

-- Indexes for the new filter columns
CREATE INDEX IF NOT EXISTS idx_videos_visibility ON public.videos (visibility);
CREATE INDEX IF NOT EXISTS idx_videos_encoding_status ON public.videos (encoding_status);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos (status);
CREATE INDEX IF NOT EXISTS idx_videos_admin_approved ON public.videos (admin_approved);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON public.videos (published_at);

-- Update public SELECT RLS policy to enforce the full filter
-- (status=approved AND admin_approved=true AND visibility=public AND encoding_status=ready)
DROP POLICY IF EXISTS "Approved videos viewable by all authenticated" ON public.videos;

CREATE POLICY "Approved videos viewable by all authenticated"
  ON public.videos
  FOR SELECT
  USING (
    status = 'approved'
    AND admin_approved = true
    AND visibility = 'public'
    AND encoding_status = 'ready'
  );

-- Trigger function: when admin approves a video, auto-set visibility=public + published_at
CREATE OR REPLACE FUNCTION public.handle_video_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin approval → make public immediately if encoding is ready
  IF NEW.status = 'approved' AND NEW.admin_approved = true THEN
    NEW.visibility := 'public';
    IF NEW.encoding_status = 'ready' THEN
      NEW.published_at := COALESCE(NEW.published_at, now());
    END IF;
  END IF;

  -- Rejection or un-approval → force private
  IF NEW.status = 'rejected' OR NEW.admin_approved = false THEN
    NEW.visibility := 'private';
    NEW.published_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_video_approval ON public.videos;
CREATE TRIGGER on_video_approval
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_video_approval();

-- Trigger function: when encoding finishes (encoding_status → ready) and video is approved, set published_at
CREATE OR REPLACE FUNCTION public.handle_encoding_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.encoding_status = 'ready'
     AND NEW.status = 'approved'
     AND NEW.admin_approved = true
     AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
    NEW.visibility := 'public';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_encoding_complete ON public.videos;
CREATE TRIGGER on_encoding_complete
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  WHEN (OLD.encoding_status IS DISTINCT FROM NEW.encoding_status)
  EXECUTE FUNCTION public.handle_encoding_complete();
