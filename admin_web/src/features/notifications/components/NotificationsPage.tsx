"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDateTime } from "@/lib/utils";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/features/notifications/lib/actions";

// ─── Types ──────────────────────────────────────────────────────────

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: "alert" | "appointment" | "donation" | "system";
  is_read: boolean;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  info: { icon: Info, color: "bg-blue-50 text-blue-600" },
  warning: { icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
  success: { icon: CheckCircle2, color: "bg-green-50 text-green-600" },
  alert: { icon: AlertTriangle, color: "bg-red-50 text-red-600" },
  appointment: { icon: CheckCircle2, color: "bg-violet-50 text-violet-600" },
  donation: { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  system: { icon: Info, color: "bg-slate-50 text-slate-600" },
};

// ─── Component ──────────────────────────────────────────────────────

interface NotificationsPageProps {
  initialNotifications: NotificationRow[];
}

export function NotificationsPage({ initialNotifications }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleMarkRead(notificationId: string) {
    setActionLoading(notificationId);
    const result = await markNotificationAsRead(notificationId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    }
    setActionLoading(null);
  }

  async function handleMarkAllRead() {
    setActionLoading("all");
    const result = await markAllNotificationsAsRead();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Toutes les notifications marquées comme lues.");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} non lue{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading === "all"}
            className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="size-4" />
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            <BellOff className="mx-auto size-8 text-slate-300" />
            <p className="mt-2">Aucune notification.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
            const TypeIcon = typeConfig.icon;
            const isLoading = actionLoading === notification.id;

            return (
              <div
                key={notification.id}
                className={cn(
                  "rounded-2xl border p-4 transition-colors",
                  notification.is_read
                    ? "border-slate-200 bg-white"
                    : "border-rose-100 bg-rose-50/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", typeConfig.color)}>
                    <TypeIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-medium", notification.is_read ? "text-slate-700" : "text-slate-900")}>
                        {notification.title}
                      </p>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDateTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{notification.body}</p>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={isLoading}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
                      title="Marquer comme lu"
                    >
                      <CheckCheck className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
