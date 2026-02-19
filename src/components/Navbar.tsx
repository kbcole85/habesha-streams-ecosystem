import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Play, Search, Menu, X, ChevronDown, LogOut, Settings, Crown, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, stripeSubscription, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-profile-menu]")) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    navigate("/");
  };

  const planLabel = stripeSubscription?.plan
    ? `${stripeSubscription.plan.charAt(0).toUpperCase() + stripeSubscription.plan.slice(1)} Plan`
    : null;

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

          {/* Notification Bell (replaced by NotificationBell component) */}
          <NotificationBell />

          {/* Auth: logged in state */}
          {user ? (
            <div className="relative hidden md:block" data-profile-menu>
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-raised border border-gold/20 hover:border-gold/50 rounded-sm transition-all duration-200 group"
              >
                <div className="w-6 h-6 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-background" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs text-foreground max-w-[100px] truncate">
                    {profile?.display_name ?? profile?.email ?? "Account"}
                  </span>
                  {planLabel && (
                    <span className="text-[9px] text-gold">{planLabel}</span>
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-surface-overlay/98 backdrop-blur-xl border border-gold/20 rounded-sm shadow-elevated overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gold/10 bg-surface-raised">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {profile?.display_name ?? "Habesha User"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    {planLabel ? (
                      <div className="flex items-center gap-1 mt-1">
                        <Crown className="w-2.5 h-2.5 text-gold" />
                        <span className="text-[10px] text-gold">{planLabel}</span>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className="text-[10px] text-muted-foreground">No active plan</span>
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-gold/5 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Account Settings
                    </Link>
                    {(role === "admin") && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gold hover:bg-gold/5 transition-colors"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        Admin Dashboard
                      </Link>
                    )}
                    {(role === "creator" || role === "admin") && (
                      <Link
                        to="/creator"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-gold/5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Creator Studio
                      </Link>
                    )}
                    {!planLabel && (
                      <Link
                        to="/plans"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gold hover:bg-gold/5 transition-colors font-medium"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        Upgrade Plan
                      </Link>
                    )}
                    <div className="border-t border-gold/10 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-raised border border-gold/20 hover:border-gold/50 rounded-sm transition-all duration-200 group"
              >
                <div className="w-6 h-6 rounded-full gradient-gold flex items-center justify-center">
                  <User className="w-3 h-3 text-background" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">Sign In</span>
              </Link>

              <Link
                to="/plans"
                className="hidden md:flex px-4 py-1.5 gradient-gold text-background text-sm font-semibold rounded-sm hover:opacity-90 transition-opacity"
              >
                Subscribe
              </Link>
            </>
          )}

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
            {user ? (
              <>
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-foreground">{profile?.display_name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <Link to="/profile" className="py-2 px-3 text-sm text-muted-foreground hover:text-gold" onClick={() => setMenuOpen(false)}>Account Settings</Link>
                {role === "admin" && (
                  <Link to="/admin" className="py-2 px-3 text-sm text-gold" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
                )}
                <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="py-2 px-3 text-sm text-muted-foreground hover:text-destructive text-left">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/auth" className="py-2 px-3 text-sm text-muted-foreground hover:text-gold" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/plans" className="py-2 px-3 text-sm text-center gradient-gold text-background font-semibold rounded-sm" onClick={() => setMenuOpen(false)}>Subscribe Now</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
