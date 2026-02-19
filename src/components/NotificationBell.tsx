import { useState, useEffect, useRef } from "react";
import { Bell, X, Play, CheckCheck } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { isNative } = useNativePlatform();
  const { user } = useAuth();
  const { notifications, permissionStatus, requestPermission, clearNotifications } = usePushNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const hasUnread = notifications.length > 0;

  return (
    <div className="relative hidden md:block" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 text-muted-foreground hover:text-gold transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface-overlay/98 backdrop-blur-xl border border-gold/20 rounded-sm shadow-elevated overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-surface-raised">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-gold" />
              <span className="cinzel text-xs font-bold text-foreground">Notifications</span>
              {hasUnread && (
                <span className="px-1.5 py-0.5 bg-gold text-background text-[9px] font-bold rounded-sm">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  onClick={clearNotifications}
                  className="text-[10px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-72 overflow-y-auto">
            {/* Push permission prompt on native */}
            {isNative && permissionStatus !== "granted" && (
              <div className="px-4 py-3 border-b border-gold/10 bg-gold/5">
                <p className="text-xs text-foreground mb-2">
                  Enable push notifications to get alerts for new releases, PPV events, and your watchlist.
                </p>
                <button
                  onClick={requestPermission}
                  className="px-3 py-1.5 gradient-gold text-background text-xs font-bold rounded-sm hover:opacity-90 transition-all"
                >
                  Enable Notifications
                </button>
              </div>
            )}

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  We'll let you know about new releases & events
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-gold/5 hover:bg-gold/5 transition-colors"
                  >
                    <div className="w-7 h-7 gradient-gold rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Play className="w-3 h-3 fill-background text-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-1">
                        {n.receivedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gold/10 bg-surface-raised">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="text-[10px] text-muted-foreground hover:text-gold transition-colors"
            >
              Manage notification settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
