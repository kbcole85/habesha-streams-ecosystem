import { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicVideos } from "@/hooks/usePublicVideos";
import heroFallback from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  const { videos, loading } = usePublicVideos();
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Pick up to 3 featured videos for the hero carousel
  const heroSlides = videos.slice(0, 3).map((v) => ({
    id: v.id,
    title: v.title,
    subtitle: v.short_description || v.genre || "Habesha Streams Original",
    description: v.full_description || v.short_description || "",
    genre: v.genre || "",
    duration: v.runtime || "",
    year: v.release_date ? new Date(v.release_date).getFullYear().toString() : (v.published_at ? new Date(v.published_at).getFullYear().toString() : ""),
    image: v.thumbnail_url || heroFallback,
    isNew: v.published_at ? (Date.now() - new Date(v.published_at).getTime()) < 14 * 24 * 60 * 60 * 1000 : false,
    badge: v.monetization_type === "ppv" ? "PPV" : "FEATURED",
  }));

  // Fallback if no DB videos yet
  const slides = heroSlides.length > 0 ? heroSlides : [{
    id: "fallback",
    title: "Habesha Streams",
    subtitle: "East African Cinema",
    description: "Discover the best of Ethiopian, Eritrean, and East African cinema. Stream movies, series, and documentaries.",
    genre: "",
    duration: "",
    year: "",
    image: heroFallback,
    isNew: false,
    badge: "COMING SOON",
  }];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => goNext(), 7000);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  const goNext = () => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrent((c) => (c + 1) % slides.length);
      setTransitioning(false);
    }, 300);
  };

  const goPrev = () => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrent((c) => (c - 1 + slides.length) % slides.length);
      setTransitioning(false);
    }, 300);
  };

  const slide = slides[current];

  if (loading) {
    return (
      <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden bg-surface">
        <img src={heroFallback} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </section>
    );
  }

  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Image */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`}>
        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        <div className="absolute inset-0 habesha-pattern opacity-30" />
      </div>

      {/* Content */}
      <div className={`relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 transition-all duration-700 ${transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 border border-gold/50 text-gold text-xs font-bold tracking-widest cinzel">
              {slide.badge}
            </span>
            {slide.isNew && (
              <span className="px-3 py-1 bg-gold text-background text-xs font-bold tracking-widest">NEW RELEASE</span>
            )}
          </div>

          <h1 className="cinzel text-4xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight mb-2">
            {slide.title}
          </h1>
          <p className="text-gold text-lg md:text-xl font-medium mb-4 tracking-wide">{slide.subtitle}</p>

          <div className="flex items-center gap-4 mb-5 text-sm text-muted-foreground">
            {slide.year && <span>{slide.year}</span>}
            {slide.genre && (<><span className="text-gold/60">•</span><span>{slide.genre}</span></>)}
            {slide.duration && (
              <>
                <span className="text-gold/60">•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{slide.duration}</span>
                </div>
              </>
            )}
          </div>

          {slide.description && (
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 max-w-lg line-clamp-3">
              {slide.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              to={slide.id === "fallback" ? "/browse" : `/watch/${slide.id}`}
              className="flex items-center gap-2 px-6 py-3 gradient-gold text-background font-bold rounded-sm hover:opacity-90 transition-all shadow-gold hover:shadow-lg hover:scale-105 transform duration-200"
            >
              <Play className="w-4 h-4 fill-background" />
              Watch Now
            </Link>
            <button className="flex items-center gap-2 px-6 py-3 bg-surface-overlay/70 backdrop-blur-sm border border-gold/30 text-foreground font-semibold rounded-sm hover:border-gold/60 hover:bg-surface-overlay transition-all duration-200">
              <Info className="w-4 h-4" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      {slides.length > 1 && (
        <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
          <button onClick={goPrev} className="w-10 h-10 bg-surface-overlay/60 backdrop-blur-sm border border-gold/20 hover:border-gold/60 text-muted-foreground hover:text-gold rounded-sm flex items-center justify-center transition-all duration-200">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goNext} className="w-10 h-10 bg-surface-overlay/60 backdrop-blur-sm border border-gold/20 hover:border-gold/60 text-muted-foreground hover:text-gold rounded-sm flex items-center justify-center transition-all duration-200">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-6 md:left-16 z-10 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-8 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-muted-foreground/50 hover:bg-muted-foreground"}`}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
