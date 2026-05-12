"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  XCircle,
  TrendingUp,
  RotateCcw,
  MapPin,
  Droplets,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/components/PageHeader";
import { FilterBar } from "@/shared/components/FilterBar";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { Pagination } from "@/shared/components/Pagination";
import { DetailsDrawer } from "@/shared/components/DetailsDrawer";
import { closeAlert, escalateAlert, relaunchAlert } from "@/features/alerts/lib/actions";
import type { AlertStatus, BloodType, UrgencyLevel } from "@/types/database";

// ─── Types ──────────────────────────────────────────────────────────

interface AlertWithCenter {
  id: string;
  center_id: string;
  blood_type_required: BloodType;
  urgency_level: UrgencyLevel;
  radius_km: number;
  message: string | null;
  deadline: string;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
  centers?: { name: string; city: string } | null;
  donors_needed?: number;
  responded?: number;
}

// ─── Constants ──────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success"; icon: React.ComponentType<{ className?: string }> }> = {
  low: { label: "Basse", variant: "success", icon: Bell },
  medium: { label: "Moyenne", variant: "secondary", icon: Bell },
  high: { label: "Haute", variant: "default", icon: AlertTriangle },
  critical: { label: "Critique", variant: "destructive", icon: AlertTriangle },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
  active: { label: "Active", variant: "success" },
  expired: { label: "Expirée", variant: "secondary" },
  closed: { label: "Fermée", variant: "outline" },
};

// ─── Component ──────────────────────────────────────────────────────

interface AlertsPageProps {
  initialAlerts: AlertWithCenter[];
}

const PAGE_SIZE = 10;

export function AlertsPage({ initialAlerts }: AlertsPageProps) {
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = React.useState(initialAlerts);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = React.useState<AlertWithCenter | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const currentPage = Number(searchParams.get("page")) || 1;
  const urgencyFilter = searchParams.get("urgency") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const q = (searchParams.get("q") || "").toLowerCase();

  const filtered = React.useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        !q ||
        [alert.centers?.name, alert.centers?.city, alert.blood_type_required, alert.message]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q));
      const matchesUrgency = urgencyFilter === "all" || alert.urgency_level === urgencyFilter;
      const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
      return matchesSearch && matchesUrgency && matchesStatus;
    });
  }, [alerts, q, urgencyFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleClose(alertId: string) {
    if (!confirm("Voulez-vous fermer cette alerte ? Les donneurs ne recevront plus de notifications.")) return;
    setActionLoading(alertId);
    const result = await closeAlert(alertId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Alerte fermée avec succès.");
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: "closed" as AlertStatus } : a)));
    }
    setActionLoading(null);
  }

  async function handleEscalate(alertId: string) {
    setActionLoading(alertId);
    const result = await escalateAlert(alertId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Alerte escaladée.");
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id !== alertId) return a;
          const map: Record<UrgencyLevel, UrgencyLevel> = { low: "medium", medium: "high", high: "critical", critical: "critical" };
          return { ...a, urgency_level: map[a.urgency_level] };
        })
      );
    }
    setActionLoading(null);
  }

  async function handleRelaunch(alertId: string) {
    setActionLoading(alertId);
    const result = await relaunchAlert(alertId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Alerte relancée.");
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: "active" as AlertStatus } : a)));
    }
    setActionLoading(null);
  }

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const criticalCount = alerts.filter((a) => a.status === "active" && a.urgency_level === "critical").length;

  const columns: Column<AlertWithCenter>[] = [
    {
      key: "center",
      header: "Centre",
      cell: (a) => {
        const urgency = URGENCY_CONFIG[a.urgency_level];
        const UrgencyIcon = urgency.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", urgency.variant === "destructive" ? "bg-red-50 border-red-200" : urgency.variant === "default" ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200")}>
              <UrgencyIcon className={cn("h-4 w-4", urgency.variant === "destructive" ? "text-red-600" : urgency.variant === "default" ? "text-orange-600" : "text-green-600")} />
            </div>
            <div>
              <p className="font-medium text-slate-900">{a.centers?.name || "Centre inconnu"}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {a.centers?.city}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "blood",
      header: "Groupe",
      cell: (a) => (
        <span className="inline-flex items-center gap-1 font-bold text-rose-600">
          <Droplets className="h-3.5 w-3.5" />
          {a.blood_type_required}
        </span>
      ),
    },
    {
      key: "urgency",
      header: "Urgence",
      cell: (a) => {
        const u = URGENCY_CONFIG[a.urgency_level];
        return <Badge variant={u.variant}>{u.label}</Badge>;
      },
    },
    {
      key: "status",
      header: "Statut",
      cell: (a) => {
        const s = STATUS_CONFIG[a.status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: "deadline",
      header: "Échéance",
      cell: (a) => <span className="text-xs text-slate-500">{formatDate(a.deadline)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (a) => {
        const isLoading = actionLoading === a.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 bg-white hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAlert(a);
                setIsDrawerOpen(true);
              }}
              title="Voir détails"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            {a.status === "active" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 hover:border-orange-300 disabled:opacity-40"
                  onClick={(e) => { e.stopPropagation(); handleEscalate(a.id); }}
                  disabled={isLoading || a.urgency_level === "critical"}
                  title="Augmenter l'urgence"
                >
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                  Escalader
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 disabled:opacity-40"
                  onClick={(e) => { e.stopPropagation(); handleRelaunch(a.id); }}
                  disabled={isLoading}
                  title="Relancer l'alerte"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Relancer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 disabled:opacity-40"
                  onClick={(e) => { e.stopPropagation(); handleClose(a.id); }}
                  disabled={isLoading}
                  title="Fermer l'alerte"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Fermer
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const drawerFields = selectedAlert
    ? [
        { label: "Centre", value: selectedAlert.centers?.name || "—" },
        { label: "Ville", value: selectedAlert.centers?.city || "—" },
        { label: "Groupe sanguin requis", value: (
          <span className="font-bold text-rose-600">{selectedAlert.blood_type_required}</span>
        )},
        { label: "Urgence", value: <Badge variant={URGENCY_CONFIG[selectedAlert.urgency_level].variant}>{URGENCY_CONFIG[selectedAlert.urgency_level].label}</Badge> },
        { label: "Statut", value: <Badge variant={STATUS_CONFIG[selectedAlert.status].variant}>{STATUS_CONFIG[selectedAlert.status].label}</Badge> },
        { label: "Rayon", value: `${selectedAlert.radius_km} km` },
        { label: "Échéance", value: formatDate(selectedAlert.deadline) },
        { label: "Message", value: selectedAlert.message || "—" },
        { label: "Créée le", value: formatDateTime(selectedAlert.created_at) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes d'urgence"
        description={`${activeCount} alertes actives${criticalCount > 0 ? ` · ${criticalCount} critique${criticalCount !== 1 ? "s" : ""}` : ""}`}
      />

      <FilterBar
        searchPlaceholder="Rechercher par centre, ville, groupe sanguin..."
        resultsCount={filtered.length}
        filters={[
          {
            key: "urgency",
            label: "Urgence",
            options: [
              { value: "low", label: "Basse" },
              { value: "medium", label: "Moyenne" },
              { value: "high", label: "Haute" },
              { value: "critical", label: "Critique" },
            ],
          },
          {
            key: "status",
            label: "Statut",
            options: [
              { value: "active", label: "Active" },
              { value: "expired", label: "Expirée" },
              { value: "closed", label: "Fermée" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(a) => a.id}
        emptyMessage="Aucune alerte trouvée."
        onRowClick={(a) => {
          setSelectedAlert(a);
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
        title={`Alerte — ${selectedAlert?.centers?.name || "Détails"}`}
        fields={drawerFields}
      />
    </div>
  );
}
