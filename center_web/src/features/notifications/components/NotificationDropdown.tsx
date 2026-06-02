"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  X,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  deleteNotification,
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

export function NotificationDropdown() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"unread" | "all">("unread");
  const [dismissingIds, setDismissingIds] = React.useState<Set<string>>(new Set());
  const { data: activeAlertsCount = 0 } = useActiveAlertsCount();
  const locale = useLocale();
  const router = useRouter();

  async function handleClickNotification(notification: NotificationItem) {
    if (!notification.is_read) {
      await handleMarkRead(notification.id);
    }
    setOpen(false);

    if (notification.type === "appointment") {
      router.push(`/${locale}/appointments`);
    } else if (notification.type === "alert") {
      router.push(`/${locale}/alerts`);
    } else if (notification.type === "donation") {
      router.push(`/${locale}/donations`);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const totalBadge = unreadCount + activeAlertsCount;

  React.useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const result = await getNotifications();
    if ("data" in result && result.data) {
      setNotifications(result.data);
    }
    setLoading(false);
  }

  async function handleMarkRead(id: string) {
    const result = await markNotificationAsRead(id);
    if ("error" in result) return;

    if (activeTab === "unread") {
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setDismissingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  }

  async function handleDismiss(id: string) {
    setDismissingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setTimeout(async () => {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificationsAsRead();
    if ("error" in result) return;

    if (activeTab === "unread") {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      setDismissingIds((prev) => {
        const next = new Set(prev);
        unreadIds.forEach((id) => next.add(id));
        return next;
      });
      setTimeout(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setDismissingIds((prev) => {
          const next = new Set(prev);
          unreadIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 300);
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    toast.success("Tout marqué comme lu");
  }

  const displayedNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.is_read;
    return true;
  });

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

      <DropdownMenuContent align="end" className="w-96 p-0 shadow-xl border border-slate-200" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <DropdownMenuLabel className="p-0 font-bold text-sm text-slate-800">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-primary hover:text-primary-dark hover:bg-primary/5"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Startup-Grade Segmented Tabs */}
        <div className="flex border-b border-slate-100 px-2 py-1.5 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("unread")}
            className={cn(
              "flex-1 py-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === "unread"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            )}
          >
            Non lues
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex-1 py-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            )}
          >
            Historique
            {notifications.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {notifications.length}
              </span>
            )}
          </button>
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
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-8 w-8 text-slate-300 stroke-[1.5]" />
              <p className="mt-2 text-sm text-slate-400 font-medium">
                {activeTab === "unread" ? "Aucune notification non lue" : "Boîte de réception vide"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/50">
              {displayedNotifications.map((notification) => {
                const tc = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
                const TypeIcon = tc.icon;
                const isDismissing = dismissingIds.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleClickNotification(notification)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 cursor-pointer transition-all duration-300 ease-in-out hover:bg-slate-50",
                      !notification.is_read && "bg-primary/5",
                      isDismissing && "opacity-0 max-h-0 p-0 overflow-hidden border-0"
                    )}
                    style={{
                      maxHeight: isDismissing ? "0px" : "150px",
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-95 duration-200",
                        tc.bg
                      )}
                    >
                      <TypeIcon className={cn("h-4 w-4", tc.color)} />
                    </div>

                    <div className="min-w-0 flex-1 pr-6">
                      <p
                        className={cn(
                          "text-sm font-semibold leading-snug",
                          notification.is_read ? "text-slate-600" : "text-slate-900"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed break-words">
                        {notification.body}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDateTime(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(notification.id);
                            }}
                            className="text-[10px] font-semibold text-primary hover:text-primary-dark transition-colors duration-200"
                          >
                            Marquer lu
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Startup-Grade Dismiss/Archive Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notification.id);
                      }}
                      className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100"
                      title="Archiver"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator className="m-0 bg-slate-100" />
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-50">
          <Link
            href={`/${locale}/notifications`}
            className="flex items-center justify-center py-3 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors w-full"
            onClick={() => setOpen(false)}
          >
            Voir toutes les notifications
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
