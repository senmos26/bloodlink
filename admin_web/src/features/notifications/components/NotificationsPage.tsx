"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/components/PageHeader";
import { FilterBar } from "@/shared/components/FilterBar";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { Pagination } from "@/shared/components/Pagination";
import { DetailsDrawer } from "@/shared/components/DetailsDrawer";
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

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
  info: { icon: Info, variant: "default" },
  warning: { icon: AlertTriangle, variant: "secondary" },
  success: { icon: CheckCircle2, variant: "success" },
  alert: { icon: AlertTriangle, variant: "destructive" },
  appointment: { icon: CheckCircle2, variant: "default" },
  donation: { icon: CheckCircle2, variant: "success" },
  system: { icon: Info, variant: "outline" },
};

// ─── Component ──────────────────────────────────────────────────────

interface NotificationsPageProps {
  initialNotifications: NotificationRow[];
}

const PAGE_SIZE = 10;

export function NotificationsPage({ initialNotifications }: NotificationsPageProps) {
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = React.useState<NotificationRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const currentPage = Number(searchParams.get("page")) || 1;
  const typeFilter = searchParams.get("type") || "all";
  const readFilter = searchParams.get("read") || "all";
  const q = (searchParams.get("q") || "").toLowerCase();

  const filtered = React.useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch = !q || [n.title, n.body].some((f) => f.toLowerCase().includes(q));
      const matchesType = typeFilter === "all" || n.type === typeFilter;
      const matchesRead = readFilter === "all" || (readFilter === "read" ? n.is_read : !n.is_read);
      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, q, typeFilter, readFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleMarkRead(notificationId: string) {
    setActionLoading(notificationId);
    const result = await markNotificationAsRead(notificationId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const columns: Column<NotificationRow>[] = [
    {
      key: "title",
      header: "Notification",
      cell: (n) => {
        const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
        const TypeIcon = tc.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", n.is_read ? "bg-slate-50 border-slate-200" : "bg-rose-50 border-rose-200")}>
              <TypeIcon className={cn("h-4 w-4", n.is_read ? "text-slate-400" : "text-rose-600")} />
            </div>
            <div>
              <p className={cn("font-medium", n.is_read ? "text-slate-600" : "text-slate-900")}>{n.title}</p>
              <p className="text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      cell: (n) => {
        const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
        return <Badge variant={tc.variant}>{n.type}</Badge>;
      },
    },
    {
      key: "status",
      header: "État",
      cell: (n) => (
        <Badge variant={n.is_read ? "outline" : "default"}>{n.is_read ? "Lu" : "Non lu"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (n) => {
        const isLoading = actionLoading === n.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 bg-white hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNotif(n);
                setIsDrawerOpen(true);
              }}
              title="Voir détails"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            {!n.is_read && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkRead(n.id);
                }}
                disabled={isLoading}
                title="Marquer comme lu"
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Marquer lu
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const drawerFields = selectedNotif
    ? [
        { label: "Titre", value: selectedNotif.title },
        { label: "Message", value: selectedNotif.body },
        { label: "Type", value: <Badge variant={(TYPE_CONFIG[selectedNotif.type] || TYPE_CONFIG.info).variant}>{selectedNotif.type}</Badge> },
        { label: "État", value: <Badge variant={selectedNotif.is_read ? "outline" : "default"}>{selectedNotif.is_read ? "Lu" : "Non lu"}</Badge> },
        { label: "Date", value: formatDateTime(selectedNotif.created_at) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} non lue${unreadCount !== 1 ? "s" : ""}`}
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={actionLoading === "all"}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer lu
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Rechercher..."
        resultsCount={filtered.length}
        filters={[
          {
            key: "type",
            label: "Type",
            options: [
              { value: "alert", label: "Alerte" },
              { value: "appointment", label: "Rendez-vous" },
              { value: "donation", label: "Don" },
              { value: "system", label: "Système" },
            ],
          },
          {
            key: "read",
            label: "État",
            options: [
              { value: "read", label: "Lu" },
              { value: "unread", label: "Non lu" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(n) => n.id}
        emptyMessage="Aucune notification."
        onRowClick={(n) => {
          setSelectedNotif(n);
          setIsDrawerOpen(true);
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        resultsCount={filtered.length}
        pageSize={PAGE_SIZE}
      />

      <DetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedNotif?.title || "Notification"}
        fields={drawerFields}
      />
    </div>
  );
}
