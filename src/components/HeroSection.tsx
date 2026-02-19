import { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-banner.jpg";

const heroSlides = [
  {
    id: 1,
    title: "Yewedaj Mistir",
    subtitle: "An Epic Ethiopian Drama",
    description: "A sweeping tale of love, betrayal, and redemption set against the breathtaking highlands of Northern Ethiopia. Winner of 12 international awards.",
    rating: "9.2",
    year: "2024",
    genre: "Drama",
    duration: "2h 18m",
    badge: "FEATURED",
    image: heroImage,
    isNew: true,
  },
  {
    id: 2,
    title: "Axum Chronicles",
    subtitle: "The Ancient Empire Reborn",
    description: "Follow the rise and fall of the mighty Aksumite Empire through stunning visual storytelling. A landmark in African historical cinema.",
    rating: "8.8",
    year: "2024",
    genre: "Historical Epic",
    duration: "3h 05m",
    badge: "EXCLUSIVE",
    image: heroImage,
    isNew: false,
  },
  {
    id: 3,
    title: "Addis Nights",
    subtitle: "Modern Ethiopian Thriller",
    description: "In the electric streets of Addis Ababa, a detective uncovers a conspiracy that reaches the highest levels of power. Season 2 now streaming.",
    rating: "8.5",
    year: "2024",
    genre: "Thriller",
    duration: "8 Episodes",
    badge: "SEASON 2",
    image: heroImage,
    isNew: true,
  },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      goNext();
    }, 7000);
    return () => clearInterval(timer);
  }, [current]);

  const goNext = () => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrent((c) => (c + 1) % heroSlides.length);
      setTransitioning(false);
    }, 300);
  };

  const goPrev = () => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrent((c) => (c - 1 + heroSlides.length) % heroSlides.length);
      setTransitioning(false);
    }, 300);
  };

  const slide = heroSlides[current];

  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Image */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`}
      >
        <img
          src={slide.image}
          alt={slide.title}
          className="w-full h-full object-cover object-center"
        />
        {/* Multi-layer gradient for cinematic effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        <div className="absolute inset-0 habesha-pattern opacity-30" />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 transition-all duration-700 ${
          transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 border border-gold/50 text-gold text-xs font-bold tracking-widest cinzel">
              {slide.badge}
            </span>
            {slide.isNew && (
              <span className="px-3 py-1 bg-gold text-background text-xs font-bold tracking-widest">
                NEW RELEASE
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="cinzel text-4xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight mb-2">
            {slide.title}
          </h1>
          <p className="text-gold text-lg md:text-xl font-medium mb-4 tracking-wide">
            {slide.subtitle}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span className="text-gold font-semibold">{slide.rating}</span>
            </div>
            <span>{slide.year}</span>
            <span className="text-gold/60">•</span>
            <span>{slide.genre}</span>
            <span className="text-gold/60">•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{slide.duration}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 max-w-lg">
            {slide.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/browse"
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
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
        <button
          onClick={goPrev}
          className="w-10 h-10 bg-surface-overlay/60 backdrop-blur-sm border border-gold/20 hover:border-gold/60 text-muted-foreground hover:text-gold rounded-sm flex items-center justify-center transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goNext}
          className="w-10 h-10 bg-surface-overlay/60 backdrop-blur-sm border border-gold/20 hover:border-gold/60 text-muted-foreground hover:text-gold rounded-sm flex items-center justify-center transition-all duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-6 md:left-16 z-10 flex items-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current ? "w-8 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-muted-foreground/50 hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
