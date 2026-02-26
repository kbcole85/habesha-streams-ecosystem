
-- Create video_subtitles table for multi-language subtitle tracks
CREATE TABLE public.video_subtitles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  label TEXT NOT NULL,
  subtitle_url TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_subtitles ENABLE ROW LEVEL SECURITY;

-- Anyone can read subtitles for public videos
CREATE POLICY "Anyone can view subtitles for public videos"
ON public.video_subtitles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.id = video_subtitles.video_id
    AND v.status = 'approved'
    AND v.admin_approved = true
    AND v.visibility = 'public'
    AND v.encoding_status = 'ready'
  )
);

-- Creators/admins can manage subtitles
CREATE POLICY "Creators manage own video subtitles"
ON public.video_subtitles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.id = video_subtitles.video_id
    AND (v.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Index for fast lookups
CREATE INDEX idx_video_subtitles_video_id ON public.video_subtitles(video_id);
