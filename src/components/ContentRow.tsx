import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import ContentCard, { ContentItem } from "./ContentCard";

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: ContentItem[];
  viewAllLink?: string;
}

const ContentRow = ({ title, subtitle, items, viewAllLink }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 320;
      scrollRef.current.scrollBy({
        left: dir === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-end justify-between px-6 md:px-12 mb-4">
        <div>
          <h2 className="cinzel text-xl md:text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="flex items-center gap-1 text-xs text-gold hover:text-gold-bright transition-colors mr-2"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 bg-surface-raised border border-gold/10 hover:border-gold/50 hover:text-gold rounded-sm flex items-center justify-center text-muted-foreground transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 bg-surface-raised border border-gold/10 hover:border-gold/50 hover:text-gold rounded-sm flex items-center justify-center text-muted-foreground transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 px-6 md:px-12 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <div key={item.id} className="flex-none w-36 sm:w-40 md:w-44">
            <ContentCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ContentRow;
