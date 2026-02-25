import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CreatorVideo {
  id: string;
  title: string;
  short_description: string | null;
  genre: string | null;
  age_rating: string | null;
  monetization_type: string;
  price: number | null;
  runtime: string | null;
  thumbnail_url: string | null;
  status: string;
  admin_approved: boolean;
  rejection_reason: string | null;
  encoding_status: string;
  encoding_started_at: string | null;
  encoding_completed_at: string | null;
  encoding_error: string | null;
  processing_progress: number;
  visibility: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCreatorVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load your content", variant: "destructive" });
    } else {
      setVideos((data as CreatorVideo[]) ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const deleteVideo = useCallback(async (videoId: string) => {
    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", videoId)
      .eq("creator_id", user?.id ?? "");

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return false;
    }
    setVideos(v => v.filter(vid => vid.id !== videoId));
    toast({ title: "Video deleted", description: "The content has been removed." });
    return true;
  }, [user]);

  return { videos, loading, refetch: fetchVideos, deleteVideo };
}
