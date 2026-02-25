import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { usePublicVideos } from "@/hooks/usePublicVideos";
import { videoToContentItem } from "@/lib/videoHelpers";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["All", "Movies", "Series", "Music", "Documentaries", "Kids", "Live", "PPV"];
const genres = ["All Genres", "Drama", "Thriller", "Romance", "Documentary", "Historical", "Action", "Comedy", "Music", "Adventure", "Epic"];
const sortOptions = ["Trending", "New Releases", "Top Rated", "A-Z", "Year: Newest"];

const Browse = () => {
  const { videos, loading } = usePublicVideos();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeGenre, setActiveGenre] = useState("All Genres");
  const [sortBy, setSortBy] = useState("Trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const allContent = useMemo(() => videos.map(videoToContentItem), [videos]);

  const filtered = useMemo(() => {
    let items = allContent.filter((item) => {
      const catMatch = activeCategory === "All"
        || (activeCategory === "PPV" && item.isPPV)
        || (activeCategory !== "PPV" && item.genre?.toLowerCase().includes(activeCategory.toLowerCase()));
      const genreMatch = activeGenre === "All Genres" || item.genre === activeGenre;
      const searchMatch = searchQuery === "" || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && genreMatch && searchMatch;
    });

    // Sort
    if (sortBy === "A-Z") items.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "Year: Newest") items.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    else if (sortBy === "New Releases") items.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));

    return items;
  }, [allContent, activeCategory, activeGenre, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Page Header */}
      <div className="pt-24 pb-6 px-6 md:px-12 border-b border-gold/10 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h1 className="cinzel text-3xl md:text-4xl font-bold text-foreground mb-1">Browse</h1>
          <p className="text-muted-foreground text-sm">
            {loading ? "Loading..." : `${filtered.length} titles • East African cinema at your fingertips`}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-gold/10 px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none mb-4 pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-none px-4 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 border ${
                  activeCategory === cat
                    ? "bg-gold text-background border-gold"
                    : "border-gold/10 text-muted-foreground hover:border-gold/30 hover:text-foreground bg-surface-raised"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search + Filters Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-surface-raised border border-gold/10 focus:border-gold/40 rounded-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="relative hidden md:block">
              <select
                value={activeGenre}
                onChange={(e) => setActiveGenre(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-surface-raised border border-gold/10 hover:border-gold/30 rounded-sm text-muted-foreground outline-none cursor-pointer"
              >
                {genres.map((g) => <option key={g}>{g}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative hidden md:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-surface-raised border border-gold/10 hover:border-gold/30 rounded-sm text-muted-foreground outline-none cursor-pointer"
              >
                {sortOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="md:hidden flex items-center gap-2 px-3 py-2 text-sm bg-surface-raised border border-gold/10 rounded-sm text-muted-foreground hover:text-gold hover:border-gold/30"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-sm" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {filtered.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="cinzel text-2xl text-muted-foreground mb-2">No Results Found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); setActiveGenre("All Genres"); }}
              className="mt-6 px-6 py-2 border border-gold/30 text-gold rounded-sm text-sm hover:bg-gold hover:text-background transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Browse;
