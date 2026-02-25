import type { PublicVideo } from "@/hooks/usePublicVideos";
import type { ContentItem } from "@/components/ContentCard";

/**
 * Convert a database video record to a ContentItem for display.
 */
export function videoToContentItem(v: PublicVideo): ContentItem {
  const publishedDate = v.published_at ? new Date(v.published_at) : null;
  const now = new Date();
  const isNew = publishedDate
    ? (now.getTime() - publishedDate.getTime()) < 14 * 24 * 60 * 60 * 1000 // 14 days
    : false;

  return {
    id: v.id,
    title: v.title,
    year: v.release_date ? new Date(v.release_date).getFullYear() : (v.published_at ? new Date(v.published_at).getFullYear() : undefined),
    genre: v.genre ?? undefined,
    duration: v.runtime ?? undefined,
    image: v.thumbnail_url ?? undefined,
    isNew,
    isPPV: v.monetization_type === "ppv",
    badge: v.monetization_type === "ppv" ? "PPV" : undefined,
  };
}
