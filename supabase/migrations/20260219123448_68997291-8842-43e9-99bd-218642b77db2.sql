
-- Videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  genre TEXT,
  age_rating TEXT DEFAULT 'PG',
  runtime TEXT,
  monetization_type TEXT NOT NULL DEFAULT 'subscription',
  price NUMERIC(10,2),
  thumbnail_url TEXT,
  trailer_url TEXT,
  video_url TEXT,
  release_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video tags
CREATE TABLE public.video_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_videos_creator_id ON public.videos(creator_id);
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_monetization ON public.videos(monetization_type);
CREATE INDEX idx_video_tags_video_id ON public.video_tags(video_id);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tags ENABLE ROW LEVEL SECURITY;

-- Creators can insert their own videos
CREATE POLICY "Creators insert own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Creators can view and update their own videos
CREATE POLICY "Creators view own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators update own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete videos
CREATE POLICY "Admins delete videos"
  ON public.videos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Approved videos are publicly viewable (for Browse page)
CREATE POLICY "Approved videos viewable by all authenticated"
  ON public.videos FOR SELECT
  USING (status = 'approved' AND admin_approved = true);

-- Video tags policies
CREATE POLICY "Anyone can view video tags"
  ON public.video_tags FOR SELECT
  USING (true);

CREATE POLICY "Creators insert own video tags"
  ON public.video_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE id = video_id AND creator_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Updated_at trigger
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);

-- Storage policies: thumbnails (public read, auth write)
CREATE POLICY "Thumbnails publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users upload thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users delete own thumbnails"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: videos (private, only creator + admin)
CREATE POLICY "Authenticated users upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Creators view own videos in storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));
