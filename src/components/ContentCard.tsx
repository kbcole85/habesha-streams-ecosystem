import { Play, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import PPVCheckoutButton from "@/components/PPVCheckoutButton";

export interface ContentItem {
  id: string;
  title: string;
  year?: number;
  rating?: string;
  genre?: string;
  duration?: string;
  image?: string;
  badge?: string;
  isNew?: boolean;
  isPPV?: boolean;
}

interface ContentCardProps {
  item: ContentItem;
}

const ContentCard = ({ item }: ContentCardProps) => {
  const placeholderImg = "/placeholder.svg";

  return (
    <Link
      to={item.isPPV ? "#" : `/watch/${item.id}`}
      onClick={(e) => { if (item.isPPV) e.preventDefault(); }}
      className="content-card group relative rounded-sm overflow-hidden bg-surface cursor-pointer shadow-card block"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={item.image || placeholderImg}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button (non-PPV) or PPV buy button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          {item.isPPV ? (
            <div className="flex flex-col items-center gap-2 px-2">
              <PPVCheckoutButton eventTitle={item.title} videoId={item.id} variant="card" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gold/90 backdrop-blur-sm flex items-center justify-center shadow-gold transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-5 h-5 fill-background text-background ml-0.5" />
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isNew && (
            <span className="px-1.5 py-0.5 bg-gold text-background text-[9px] font-bold uppercase tracking-wider rounded-sm">
              New
            </span>
          )}
          {item.isPPV && (
            <span className="px-1.5 py-0.5 bg-habesha-red text-foreground text-[9px] font-bold uppercase tracking-wider rounded-sm">
              PPV
            </span>
          )}
          {item.badge && (
            <span className="px-1.5 py-0.5 bg-surface-overlay/80 backdrop-blur-sm text-gold text-[9px] font-bold uppercase tracking-wider rounded-sm border border-gold/20">
              {item.badge}
            </span>
          )}
        </div>

        {/* Rating */}
        {item.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
            <Star className="w-2.5 h-2.5 fill-gold text-gold" />
            <span className="text-[9px] text-gold font-semibold">{item.rating}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className="text-xs font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-gold transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {item.year ? `${item.year} • ` : ""}{item.genre || ""}
          </span>
          {item.duration && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              <span className="text-[10px]">{item.duration}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ContentCard;
