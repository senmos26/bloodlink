"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/features/notifications/lib/actions";

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  alert: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-100", label: "Alerte d'urgence" },
  appointment: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", label: "Rendez-vous" },
  donation: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", label: "Don de sang" },
  system: { icon: Info, color: "text-slate-600", bg: "bg-slate-50 border-slate-100", label: "Système" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", label: "Information" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", label: "Avertissement" },
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-100", label: "Succès" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const locale = useLocale();
  const router = useRouter();

  React.useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const result = await getNotifications();
    if (result && "data" in result && result.data) {
      setNotifications(result.data as NotificationItem[]);
    }
    setLoading(false);
  }

  async function handleMarkRead(id: string) {
    const result = await markNotificationAsRead(id);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    toast.success("Notification marquée comme lue");
  }

  async function handleDelete(id: string) {
    const result = await deleteNotification(id);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification supprimée");
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificationsAsRead();
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Toutes les notifications ont été marquées comme lues");
  }

  function handleClickNotification(notification: NotificationItem) {
    if (!notification.is_read) {
      markNotificationAsRead(notification.id);
    }
    if (notification.type === "appointment") {
      router.push(`/${locale}/appointments`);
    } else if (notification.type === "alert") {
      router.push(`/${locale}/alerts`);
    } else if (notification.type === "donation") {
      router.push(`/${locale}/donations`);
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-rose-600" />
            Centre de notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos alertes et l'activité de votre centre de transfusion.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            size="sm"
            className="self-start sm:self-auto border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "py-2.5 px-4 text-sm font-medium border-b-2 transition-colors",
            filter === "all"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          Toutes ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "py-2.5 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5",
            filter === "unread"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          Non lues
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 justify-center rounded-full px-1 text-[10px] font-bold">
              {unreadCount}
            </Badge>
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-slate-100">
              <div className="p-4 flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                  <div className="h-2 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <Inbox className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              {filter === "unread" ? "Aucune notification non lue" : "Historique vide"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {filter === "unread"
                ? "Vous êtes à jour ! Toutes vos notifications ont été lues."
                : "Vous n'avez pas encore reçu de notifications."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const tc = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
            const TypeIcon = tc.icon;

            return (
              <Card
                key={notification.id}
                onClick={() => handleClickNotification(notification)}
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer border-slate-200/60 relative overflow-hidden group",
                  !notification.is_read && "bg-slate-50/50 border-l-4 border-l-rose-600"
                )}
              >
                <div className="p-4 sm:p-5 flex gap-4">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                    tc.bg
                  )}>
                    <TypeIcon className={cn("h-5 w-5", tc.color)} />
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {tc.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(notification.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h4 className={cn(
                      "text-sm font-bold mt-1 text-slate-900 leading-snug",
                      !notification.is_read && "text-rose-600"
                    )}>
                      {notification.title}
                    </h4>

                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {notification.body}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notification.id);
                          }}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                        >
                          Marquer comme lu
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
