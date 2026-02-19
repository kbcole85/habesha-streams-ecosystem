import { Link } from "react-router-dom";
import { Play, Instagram, Facebook, Youtube, Mail, Globe, ChevronDown } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-gold/10" style={{ backgroundColor: "#3E2723" }}>
      {/* Gold top accent line */}
      <div className="h-0.5 gradient-gold" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Brand Header */}
        <div className="mb-12 pb-8 border-b border-gold/10">
          <Link to="/" className="flex items-center gap-3 mb-4 w-fit">
            <div className="w-10 h-10 gradient-gold rounded-sm flex items-center justify-center">
              <Play className="w-5 h-5 fill-background text-background" />
            </div>
            <div>
              <span className="cinzel text-xl font-bold tracking-wider block" style={{ color: "#C6A75E" }}>HABESHA STREAMS</span>
              <span className="text-xs tracking-widest" style={{ color: "#F5F1E8", opacity: 0.6 }}>EAST AFRICAN STREAMING</span>
            </div>
          </Link>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#F5F1E8", opacity: 0.7 }}>
            The premier East African streaming platform. Discover authentic stories, music, and culture from Ethiopia, Eritrea, and beyond — delivered globally.
          </p>
        </div>

        {/* Four Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1 — Company */}
          <div>
            <h4 className="cinzel text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "#C6A75E" }}>Company</h4>
            <ul className="space-y-3">
              {[
                { label: "About Habesha Streams", href: "#" },
                { label: "Careers", href: "mailto:careers@habeshastreams.com" },
                { label: "Press & Media", href: "mailto:press@habeshastreams.com" },
                { label: "Contact Us", href: "mailto:support@habeshastreams.com" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm transition-all duration-200 hover:underline"
                    style={{ color: "#F5F1E8", opacity: 0.75 }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#C6A75E", e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#F5F1E8", e.currentTarget.style.opacity = "0.75")}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 — Support */}
          <div>
            <h4 className="cinzel text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "#C6A75E" }}>Support</h4>
            <ul className="space-y-3">
              {[
                { label: "Help Center", href: "#" },
                { label: "Manage Account", href: "/profile" },
                { label: "Subscription Plans", href: "/plans" },
                { label: "Device Management", href: "/profile" },
                { label: "Report a Problem", href: "mailto:support@habeshastreams.com" },
              ].map((item) => (
                <li key={item.label}>
                  {item.href.startsWith("/") ? (
                    <Link
                      to={item.href}
                      className="text-sm transition-all duration-200 hover:underline"
                      style={{ color: "#F5F1E8", opacity: 0.75 }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-sm transition-all duration-200 hover:underline"
                      style={{ color: "#F5F1E8", opacity: 0.75 }}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Legal */}
          <div>
            <h4 className="cinzel text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "#C6A75E" }}>Legal</h4>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Refund Policy", href: "/refund-policy" },
                { label: "Cookie Policy", href: "/cookies" },
                { label: "Content Guidelines", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  {item.href.startsWith("/") ? (
                    <Link
                      to={item.href}
                      className="text-sm transition-all duration-200 hover:underline"
                      style={{ color: "#F5F1E8", opacity: 0.75 }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-sm transition-all duration-200 hover:underline"
                      style={{ color: "#F5F1E8", opacity: 0.75 }}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Connect */}
          <div>
            <h4 className="cinzel text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "#C6A75E" }}>Connect With Us</h4>
            <div className="flex items-center gap-3 mb-5">
              {[
                { Icon: Instagram, label: "Instagram", href: "https://instagram.com/habeshastreams" },
                { Icon: Facebook, label: "Facebook", href: "https://facebook.com/habeshastreams" },
                { Icon: Youtube, label: "YouTube", href: "https://youtube.com/@habeshastreams" },
                {
                  Icon: () => (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" />
                    </svg>
                  ),
                  label: "TikTok",
                  href: "https://tiktok.com/@habeshastreams",
                },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-sm border flex items-center justify-center transition-all duration-200"
                  style={{ borderColor: "rgba(198,167,94,0.2)", color: "#F5F1E8", opacity: 0.7 }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#C6A75E";
                    e.currentTarget.style.color = "#C6A75E";
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(198,167,94,0.2)";
                    e.currentTarget.style.color = "#F5F1E8";
                    e.currentTarget.style.opacity = "0.7";
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
            <a
              href="mailto:support@habeshastreams.com"
              className="flex items-center gap-2 text-sm transition-colors duration-200"
              style={{ color: "#C6A75E" }}
            >
              <Mail className="w-3.5 h-3.5" />
              support@habeshastreams.com
            </a>
          </div>
        </div>

        {/* Language & Region Selectors */}
        <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-gold/10">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" style={{ color: "#C6A75E" }} />
            <span className="text-xs" style={{ color: "#F5F1E8", opacity: 0.5 }}>Language:</span>
            <div className="flex items-center gap-1 cursor-pointer">
              {["English", "አማርኛ", "ትግርኛ"].map((lang, i) => (
                <span key={lang}>
                  {i > 0 && <span className="text-xs mx-1" style={{ color: "#F5F1E8", opacity: 0.3 }}>·</span>}
                  <span
                    className={`text-xs transition-colors duration-150 ${i === 0 ? "font-semibold" : "opacity-50 hover:opacity-80"}`}
                    style={{ color: i === 0 ? "#C6A75E" : "#F5F1E8" }}
                  >
                    {lang}
                  </span>
                </span>
              ))}
              <span className="text-xs ml-1" style={{ color: "#F5F1E8", opacity: 0.4 }}>(coming soon)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#F5F1E8", opacity: 0.5 }}>Region:</span>
            <div className="flex items-center gap-1">
              {[
                { flag: "🇺🇸", label: "US" },
                { flag: "🇨🇦", label: "Canada" },
                { flag: "🇬🇧", label: "UK" },
                { flag: "🇪🇹", label: "Ethiopia" },
              ].map((r, i) => (
                <span key={r.label}>
                  {i > 0 && <span className="text-xs mx-1" style={{ color: "#F5F1E8", opacity: 0.3 }}>·</span>}
                  <span className="text-xs" style={{ color: "#F5F1E8", opacity: 0.6 }}>{r.flag} {r.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs" style={{ color: "#F5F1E8", opacity: 0.5 }}>
              © {currentYear} Habesha Streams. All Rights Reserved.
            </p>
            <p className="text-xs mt-1 max-w-lg" style={{ color: "#F5F1E8", opacity: 0.4 }}>
              Habesha Streams is a digital streaming platform providing licensed East African film and television content.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs" style={{ color: "#F5F1E8", opacity: 0.5 }}>99.9% Uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
