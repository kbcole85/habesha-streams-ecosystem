import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";
import thumb7 from "@/assets/thumb-7.jpg";
import thumb8 from "@/assets/thumb-8.jpg";

const allContent = [
  { id: 1, title: "Yewedaj Mistir", year: 2024, rating: "9.2", genre: "Drama", duration: "2h 18m", image: thumb1, isNew: true, badge: "HD", cat: "movies" },
  { id: 2, title: "Axum Chronicles", year: 2024, rating: "8.8", genre: "Historical", duration: "3h 05m", image: thumb2, badge: "EXCLUSIVE", cat: "movies" },
  { id: 3, title: "Genet", year: 2024, rating: "8.5", genre: "Romance", duration: "1h 52m", image: thumb3, isNew: true, cat: "movies" },
  { id: 4, title: "Simien Heights", year: 2023, rating: "9.0", genre: "Documentary", duration: "1h 40m", image: thumb4, badge: "4K", cat: "documentaries" },
  { id: 5, title: "Tizita Nights", year: 2024, rating: "8.7", genre: "Music", duration: "1h 25m", image: thumb5, isNew: true, cat: "music" },
  { id: 6, title: "Addis Nights", year: 2024, rating: "8.5", genre: "Thriller", duration: "Series", image: thumb6, badge: "SEASON 2", cat: "series" },
  { id: 7, title: "Axum Rising", year: 2024, rating: "9.1", genre: "Epic", duration: "2h 48m", image: thumb7, isPPV: true, cat: "movies" },
  { id: 8, title: "Yilma's Journey", year: 2023, rating: "8.3", genre: "Adventure", duration: "1h 35m", image: thumb8, isNew: true, cat: "kids" },
  { id: 9, title: "Habesha Roots", year: 2024, rating: "8.9", genre: "Documentary", duration: "2h 10m", image: thumb4, cat: "documentaries" },
  { id: 10, title: "Gondär Nights", year: 2024, rating: "8.6", genre: "Thriller", duration: "Series", image: thumb6, cat: "series" },
  { id: 11, title: "Lalibela", year: 2023, rating: "9.3", genre: "Documentary", duration: "1h 55m", image: thumb7, badge: "4K", cat: "documentaries" },
  { id: 12, title: "Birtucan", year: 2024, rating: "8.4", genre: "Drama", duration: "1h 42m", image: thumb1, isNew: true, cat: "movies" },
  { id: 13, title: "Timkat Festival", year: 2024, rating: "8.8", genre: "Music", duration: "3h 00m", image: thumb5, cat: "music" },
  { id: 14, title: "Habesha Love", year: 2024, rating: "8.2", genre: "Romance", duration: "1h 38m", image: thumb3, cat: "movies" },
  { id: 15, title: "Tigray Voices", year: 2023, rating: "9.0", genre: "Documentary", duration: "1h 50m", image: thumb4, cat: "documentaries" },
  { id: 16, title: "City of Lions", year: 2024, rating: "8.7", genre: "Action", duration: "2h 05m", image: thumb2, isPPV: true, cat: "movies" },
];

const categories = ["All", "Movies", "Series", "Music", "Documentaries", "Kids", "Live", "PPV"];
const genres = ["All Genres", "Drama", "Thriller", "Romance", "Documentary", "Historical", "Action", "Comedy", "Music", "Adventure"];
const sortOptions = ["Trending", "New Releases", "Top Rated", "A-Z", "Year: Newest"];

const Browse = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeGenre, setActiveGenre] = useState("All Genres");
  const [sortBy, setSortBy] = useState("Trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = allContent.filter((item) => {
    const catMatch = activeCategory === "All" || item.cat === activeCategory.toLowerCase();
    const genreMatch = activeGenre === "All Genres" || item.genre === activeGenre;
    const searchMatch = searchQuery === "" || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && genreMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Page Header */}
      <div className="pt-24 pb-6 px-6 md:px-12 border-b border-gold/10 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h1 className="cinzel text-3xl md:text-4xl font-bold text-foreground mb-1">Browse</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} titles • East African cinema at your fingertips
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
            {/* Search */}
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

            {/* Genre Filter */}
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

            {/* Sort */}
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
        {filtered.length > 0 ? (
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
