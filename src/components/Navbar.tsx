import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Play, Search, Bell, User, Menu, X, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Browse", href: "/browse" },
    { label: "Movies", href: "/browse?cat=movies" },
    { label: "Series", href: "/browse?cat=series" },
    { label: "Music", href: "/browse?cat=music" },
    { label: "Live", href: "/browse?cat=live" },
    { label: "Kids", href: "/browse?cat=kids" },
  ];

  const isActive = (href: string) => location.pathname === href.split("?")[0];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-gold/10 shadow-elevated"
          : "bg-transparent"
      }`}
    >
      {/* Top thin gold accent line */}
      <div className="h-0.5 w-full gradient-gold" />

      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <div className="w-8 h-8 gradient-gold rounded-sm flex items-center justify-center shadow-gold animate-pulse-gold">
              <Play className="w-4 h-4 fill-background text-background" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="cinzel text-lg font-bold text-gold tracking-wider">HABESHA</span>
            <span className="text-[9px] tracking-[0.3em] text-muted-foreground font-medium uppercase">STREAMS</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                isActive(link.href)
                  ? "text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className={`flex items-center transition-all duration-300 ${searchOpen ? "w-48" : "w-8"}`}>
            {searchOpen && (
              <input
                autoFocus
                placeholder="Search titles..."
                className="bg-surface-overlay border border-gold/20 rounded-l-sm px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground w-full outline-none focus:border-gold/50"
                onBlur={() => setSearchOpen(false)}
              />
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-2 text-muted-foreground hover:text-gold transition-colors ${searchOpen ? "bg-surface-overlay border border-l-0 border-gold/20 rounded-r-sm" : ""}`}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <button className="hidden md:flex p-2 text-muted-foreground hover:text-gold transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold rounded-full" />
          </button>

          <Link
            to="/profile"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-raised border border-gold/20 hover:border-gold/50 rounded-sm transition-all duration-200 group"
          >
            <div className="w-6 h-6 rounded-full gradient-gold flex items-center justify-center">
              <User className="w-3 h-3 text-background" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground">My Account</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </Link>

          <Link
            to="/plans"
            className="hidden md:flex px-4 py-1.5 gradient-gold text-background text-sm font-semibold rounded-sm hover:opacity-90 transition-opacity"
          >
            Subscribe
          </Link>

          {/* Mobile menu */}
          <button
            className="lg:hidden p-2 text-muted-foreground hover:text-gold transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-xl border-t border-gold/10 px-4 py-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="py-2 px-3 text-sm text-muted-foreground hover:text-gold hover:bg-surface-raised rounded-sm transition-all"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gold/10 pt-3 mt-1 flex flex-col gap-2">
            <Link to="/profile" className="py-2 px-3 text-sm text-muted-foreground hover:text-gold" onClick={() => setMenuOpen(false)}>My Account</Link>
            <Link to="/plans" className="py-2 px-3 text-sm text-center gradient-gold text-background font-semibold rounded-sm" onClick={() => setMenuOpen(false)}>Subscribe Now</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
