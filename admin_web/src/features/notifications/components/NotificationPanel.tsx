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
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/features/notifications/lib/actions";

// ─── Types ──────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  alert: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  appointment: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
  donation: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  system: { icon: Info, color: "text-slate-600", bg: "bg-slate-50" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
};

// ─── Component ──────────────────────────────────────────────────────

export function NotificationPanel() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  React.useEffect(() => {
    if (open && notifications.length === 0) {
      loadNotifications();
    }
  }, [open]);

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
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificationsAsRead();
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Tout marqué comme lu");
  }

  const displayedNotifications = notifications.slice(0, 15);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Tout marquer lu
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {unreadCount} non lue{unreadCount !== 1 ? "s" : ""}
          </p>
        </SheetHeader>

        <Separator className="my-3" />

        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 rounded-xl p-3 animate-pulse">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 rounded bg-slate-100" />
                    <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-10 w-10 text-slate-200" />
              <p className="mt-3 text-sm text-slate-400">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {displayedNotifications.map((notification) => {
                const tc = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
                const TypeIcon = tc.icon;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group flex items-start gap-3 rounded-xl border p-3 transition-colors",
                      notification.is_read
                        ? "border-slate-100 bg-white"
                        : "border-rose-100 bg-rose-50/40"
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
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium leading-snug",
                            notification.is_read ? "text-slate-600" : "text-slate-900"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <Badge
                            variant="default"
                            className="shrink-0 h-5 px-1.5 text-[10px]"
                          >
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                        {notification.body}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="text-[10px] font-medium text-rose-600 hover:text-rose-700 hover:underline"
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

        <div className="mt-3 border-t pt-3">
          <Link href="/admin/notifications">
            <Button variant="outline" className="w-full text-sm" size="sm">
              Voir toutes les notifications
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
