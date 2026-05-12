"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/features/notifications/lib/actions";
import { useActiveAlertsCount } from "@/features/alerts/lib/hooks";

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  alert: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  appointment: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
  donation: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  system: { icon: Info, color: "text-slate-600", bg: "bg-slate-50" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
};

export function NotificationDropdown() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { data: activeAlertsCount = 0 } = useActiveAlertsCount();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const totalBadge = unreadCount + activeAlertsCount;

  React.useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  // Load on mount too to get the badge count
  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    const result = await getNotifications();
    if ("data" in result && result.data) {
      setNotifications(result.data);
    }
  }

  async function handleMarkRead(id: string) {
    const result = await markNotificationAsRead(id);
    if ("error" in result) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificationsAsRead();
    if ("error" in result) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Tout marqué comme lu");
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-full text-foreground/70 hover:bg-primary/10 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {totalBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
              {totalBadge > 9 ? "9+" : totalBadge}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 font-semibold text-sm">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Active Alerts Banner */}
        {activeAlertsCount > 0 && (
          <Link
            href="/alerts"
            className="flex items-center gap-3 px-4 py-3 bg-red-50 border-b border-red-100 hover:bg-red-100 transition-colors"
            onClick={() => setOpen(false)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700">
                {activeAlertsCount} alerte{activeAlertsCount > 1 ? "s" : ""} d'urgence active{activeAlertsCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-500">Cliquez pour voir les détails</p>
            </div>
            <ArrowRight className="h-4 w-4 text-red-400 shrink-0" />
          </Link>
        )}

        <ScrollArea className="h-80">
          {loading && notifications.length === 0 ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                    <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="h-8 w-8 text-slate-200" />
              <p className="mt-2 text-sm text-slate-400">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notification) => {
                const tc = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
                const TypeIcon = tc.icon;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 transition-colors hover:bg-slate-50",
                      !notification.is_read && "bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        tc.bg
                      )}
                    >
                      <TypeIcon className={cn("h-4 w-4", tc.color)} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium leading-snug",
                          notification.is_read ? "text-slate-600" : "text-slate-900"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                        {notification.body}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="text-[10px] font-medium text-primary hover:underline"
                          >
                            Marquer lu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/notifications"
            className="flex items-center justify-center py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
          >
            Voir toutes les notifications
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
