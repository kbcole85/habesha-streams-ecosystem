import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicVideo {
  id: string;
  title: string;
  short_description: string | null;
  full_description: string | null;
  genre: string | null;
  age_rating: string | null;
  monetization_type: string;
  price: number | null;
  runtime: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  status: string;
  visibility: string;
  encoding_status: string;
  published_at: string | null;
  created_at: string;
  release_date: string | null;
  creator_id: string;
}

export function usePublicVideos() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("status", "approved")
        .eq("admin_approved", true)
        .eq("visibility", "public")
        .eq("encoding_status", "ready")
        .order("published_at", { ascending: false });

      if (!error && data) {
        setVideos(data as PublicVideo[]);
      }
      setLoading(false);
    };
    fetchVideos();
  }, []);

  return { videos, loading };
}
