import { Link } from "react-router-dom";
import { Play, Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-background border-t border-gold/10 habesha-pattern">
      {/* Gold top line */}
      <div className="h-0.5 gradient-gold" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 gradient-gold rounded-sm flex items-center justify-center">
                <Play className="w-4 h-4 fill-background text-background" />
              </div>
              <div>
                <span className="cinzel text-lg font-bold text-gold tracking-wider block">HABESHA STREAMS</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              The premier East African streaming platform. Discover authentic stories, music, and culture from Ethiopia, Eritrea, and beyond — delivered globally.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 bg-surface-raised border border-gold/10 hover:border-gold/50 hover:text-gold rounded-sm flex items-center justify-center text-muted-foreground transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="cinzel text-sm font-semibold text-gold mb-4 tracking-wide">Platform</h4>
            <ul className="space-y-2">
              {["Browse Content", "New Releases", "Trending", "Live Events", "Kids Zone", "Documentaries"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="cinzel text-sm font-semibold text-gold mb-4 tracking-wide">Company</h4>
            <ul className="space-y-2">
              {["About Us", "Careers", "Press", "Creator Program", "Advertise", "Blog"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="cinzel text-sm font-semibold text-gold mb-4 tracking-wide">Support</h4>
            <ul className="space-y-2">
              {["Help Center", "Contact Us", "Privacy Policy", "Terms of Service", "Cookie Settings", "Accessibility"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <a href="mailto:hello@habeshastreams.com" className="flex items-center gap-2 text-sm text-gold hover:text-gold-bright transition-colors">
                <Mail className="w-3 h-3" />
                hello@habeshastreams.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-gold/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2024 Habesha Streams. All rights reserved. Built with pride for East Africa and the world.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground">🇪🇹 Ethiopia</span>
            <span className="text-xs text-muted-foreground">🇪🇷 Eritrea</span>
            <span className="text-xs text-muted-foreground">🌍 Global</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 bg-emerald-bright rounded-full animate-pulse" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
