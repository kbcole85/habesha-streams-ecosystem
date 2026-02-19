import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import { Play, Shield, Globe, Smartphone, ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";
import thumb7 from "@/assets/thumb-7.jpg";
import thumb8 from "@/assets/thumb-8.jpg";

const allContent = [
  { id: 1, title: "Yewedaj Mistir", year: 2024, rating: "9.2", genre: "Drama", duration: "2h 18m", image: thumb1, isNew: true, badge: "HD" },
  { id: 2, title: "Axum Chronicles", year: 2024, rating: "8.8", genre: "Historical", duration: "3h 05m", image: thumb2, badge: "EXCLUSIVE" },
  { id: 3, title: "Genet", year: 2024, rating: "8.5", genre: "Romance", duration: "1h 52m", image: thumb3, isNew: true },
  { id: 4, title: "Simien Heights", year: 2023, rating: "9.0", genre: "Documentary", duration: "1h 40m", image: thumb4, badge: "4K" },
  { id: 5, title: "Tizita Nights", year: 2024, rating: "8.7", genre: "Music", duration: "1h 25m", image: thumb5, isNew: true },
  { id: 6, title: "Addis Nights", year: 2024, rating: "8.5", genre: "Thriller", duration: "Series", image: thumb6, badge: "SEASON 2" },
  { id: 7, title: "Axum Rising", year: 2024, rating: "9.1", genre: "Epic", duration: "2h 48m", image: thumb7, isPPV: true },
  { id: 8, title: "Yilma's Journey", year: 2023, rating: "8.3", genre: "Adventure", duration: "1h 35m", image: thumb8, isNew: true },
];

const trending = [allContent[5], allContent[0], allContent[6], allContent[2], allContent[4], allContent[1]];
const newReleases = [allContent[2], allContent[4], allContent[7], allContent[0], allContent[6], allContent[3]];
const ppvContent = [allContent[6], allContent[1], allContent[3], allContent[5]];

const features = [
  { icon: Shield, title: "Enterprise Security", desc: "DRM protected, encrypted streams with dynamic watermarking and anti-piracy technology." },
  { icon: Globe, title: "Global Reach", desc: "Stream from anywhere in the world with our global CDN delivering ultra-fast playback." },
  { icon: Smartphone, title: "All Devices", desc: "Web, iOS, and Android apps. Seamless experience on every screen you own." },
  { icon: Play, title: "4K Cinematic Quality", desc: "Adaptive streaming up to 4K HDR with Dolby Audio for the ultimate viewing experience." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Featured Content Rows */}
      <div className="relative">
        {/* Subtle pattern background */}
        <div className="absolute inset-0 habesha-pattern opacity-40 pointer-events-none" />

        <ContentRow
          title="Trending Now"
          subtitle="Most watched across East Africa & the diaspora"
          items={trending}
          viewAllLink="/browse"
        />

        {/* Gold divider banner */}
        <div className="mx-6 md:mx-12 my-4 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <ContentRow
          title="New Releases"
          subtitle="Fresh stories added this week"
          items={newReleases}
          viewAllLink="/browse"
        />

        {/* PPV Spotlight */}
        <section className="py-10 px-6 md:px-12">
          <div className="relative overflow-hidden rounded-sm bg-surface border border-gold/20 p-8 habesha-pattern">
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-gold/5" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-habesha-red rounded-full animate-pulse" />
                  <span className="text-xs text-habesha-red font-bold tracking-widest uppercase">Pay-Per-View Events</span>
                </div>
                <h2 className="cinzel text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Premium Live Events & <span className="text-gold">Exclusive Premieres</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Rent or purchase exclusive content with time-limited access. Own the moment.
                </p>
              </div>
              <Link
                to="/browse?cat=ppv"
                className="flex-none flex items-center gap-2 px-6 py-3 border border-gold text-gold hover:bg-gold hover:text-background rounded-sm transition-all duration-200 font-semibold text-sm"
              >
                Browse PPV <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {/* PPV Cards preview */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {ppvContent.map((item) => (
                <div key={item.id} className="relative rounded-sm overflow-hidden aspect-[2/3] group cursor-pointer">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{item.title}</p>
                    <span className="text-[9px] text-gold">From $3.99</span>
                  </div>
                  <div className="absolute top-2 right-2 bg-habesha-red px-1.5 py-0.5 text-[9px] font-bold text-foreground rounded-sm">PPV</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ContentRow
          title="All Content"
          subtitle="Explore the full Habesha Streams library"
          items={allContent}
          viewAllLink="/browse"
        />
      </div>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs text-gold tracking-widest font-bold uppercase mb-2 block">Why Habesha Streams</span>
            <h2 className="cinzel text-3xl md:text-4xl font-bold text-foreground">
              Built for the <span className="text-gold">World</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 bg-background border border-gold/10 hover:border-gold/40 rounded-sm transition-all duration-300 hover:shadow-gold cursor-default"
              >
                <div className="w-10 h-10 gradient-gold rounded-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <f.icon className="w-5 h-5 text-background" />
                </div>
                <h3 className="cinzel text-sm font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans CTA */}
      <section className="py-20 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 habesha-pattern opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-5 h-5 fill-gold text-gold" />)}
            </div>
          </div>
          <h2 className="cinzel text-4xl md:text-5xl font-black text-foreground mb-4">
            Start Streaming <span className="gold-shimmer">Today</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-2">
            From <span className="text-gold font-semibold">$4.99/month</span>. Cancel anytime.
          </p>
          <p className="text-muted-foreground text-sm mb-10">7-day free trial • No credit card required to start</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/plans"
              className="px-10 py-4 gradient-gold text-background font-bold rounded-sm hover:opacity-90 transition-all shadow-gold hover:scale-105 transform duration-200 cinzel tracking-wide"
            >
              View Plans & Pricing
            </Link>
            <Link
              to="/browse"
              className="px-10 py-4 border border-gold/30 text-foreground font-semibold rounded-sm hover:border-gold/60 hover:bg-surface-raised transition-all duration-200"
            >
              Browse Free Content
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
