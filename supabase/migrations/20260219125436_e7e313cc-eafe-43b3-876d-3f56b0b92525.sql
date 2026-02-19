-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',  -- 'approved' | 'rejected' | 'info'
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Service role / edge functions can insert (for triggers), also allow users to insert their own
CREATE POLICY "Users insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for videos table so creators can detect status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;

-- DB trigger: auto-create notification when a video status changes to 'approved' or 'rejected'
CREATE OR REPLACE FUNCTION public.notify_creator_on_video_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status AND OLD.admin_approved = NEW.admin_approved THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' AND NEW.admin_approved = true THEN
    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.creator_id,
      '🎉 Video Approved!',
      'Your video "' || NEW.title || '" has been approved and is now live on Habesha Streams.',
      'approved',
      jsonb_build_object('video_id', NEW.id, 'video_title', NEW.title)
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.creator_id,
      '❌ Video Rejected',
      'Your video "' || NEW.title || '" was not approved.' || 
      CASE WHEN NEW.rejection_reason IS NOT NULL 
           THEN ' Reason: ' || NEW.rejection_reason 
           ELSE '' END,
      'rejected',
      jsonb_build_object('video_id', NEW.id, 'video_title', NEW.title, 'reason', NEW.rejection_reason)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_video_status_change
AFTER UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.notify_creator_on_video_status_change();