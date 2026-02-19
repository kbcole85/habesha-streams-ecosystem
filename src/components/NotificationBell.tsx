import { useState, useEffect, useRef } from "react";
import {
  Bell, X, CheckCheck, CheckCircle2, XCircle, Info, Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  approved: { icon: CheckCircle2, color: "text-emerald-bright", bg: "bg-emerald/20" },
  rejected: { icon: XCircle,     color: "text-destructive",    bg: "bg-destructive/20" },
  info:     { icon: Info,         color: "text-gold",           bg: "bg-gold/10" },
};

const NotifItem = ({
  n,
  onRead,
  onDelete,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-gold/5 transition-colors group",
        n.read ? "opacity-60" : "bg-gold/[0.03]"
      )}
      onClick={() => !n.read && onRead(n.id)}
      role="button"
      tabIndex={0}
    >
      <div className={cn("w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
        <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
        <p className="text-[9px] text-muted-foreground/50 mt-1">
          {new Date(n.created_at).toLocaleString([], {
            month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5"
        aria-label="Delete"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const {
    notifications, unreadCount,
    markRead, markAllRead, deleteNotification, clearAll,
  } = useNotifications();

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

  return (
    <div className="relative hidden md:block" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 text-muted-foreground hover:text-gold transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 bg-gold rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-background leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface-overlay/98 backdrop-blur-xl border border-gold/20 rounded-sm shadow-elevated overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-surface-raised">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-gold" />
              <span className="cinzel text-xs font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-gold text-background text-[9px] font-bold rounded-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  You'll be notified when your videos are approved or rejected.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  n={n}
                  onRead={markRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gold/10 bg-surface-raised">
            <p className="text-[10px] text-muted-foreground">
              Video status updates appear here in real-time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
