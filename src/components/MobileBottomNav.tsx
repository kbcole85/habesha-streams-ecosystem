import { Link, useLocation } from "react-router-dom";
import { Home, Search, Play, User, Crown } from "lucide-react";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/browse", icon: Search, label: "Browse" },
  { to: "/plans", icon: Crown, label: "Plans" },
  { to: "/profile", icon: User, label: "Profile" },
];

const MobileBottomNav = () => {
  const { isNative } = useNativePlatform();
  const { user } = useAuth();
  const location = useLocation();

  // Only render on native platforms
  if (!isNative) return null;

  // Hide on watch page (full-screen player)
  if (location.pathname.startsWith("/watch")) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-gold/15 mobile-nav-safe">
      <div className="flex items-center justify-around px-2 pt-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-sm transition-all duration-200 ${
                isActive ? "text-gold" : "text-muted-foreground"
              }`}
            >
              <div className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
                )}
              </div>
              <span className={`text-[9px] font-medium tracking-wide ${isActive ? "text-gold" : "text-muted-foreground/70"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
