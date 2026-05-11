"use client";

import { useState } from "react";
import {
  Bell,
  AlertTriangle,
  XCircle,
  TrendingUp,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
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

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  low: { label: "Basse", color: "bg-green-100 text-green-700 border-green-200", icon: Bell },
  medium: { label: "Moyenne", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Bell },
  high: { label: "Haute", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle },
  critical: { label: "Critique", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  expired: { label: "Expirée", color: "bg-slate-100 text-slate-600" },
  closed: { label: "Fermée", color: "bg-slate-100 text-slate-500" },
};

// ─── Component ──────────────────────────────────────────────────────

interface AlertsPageProps {
  initialAlerts: AlertWithCenter[];
}

export function AlertsPage({ initialAlerts }: AlertsPageProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [
        alert.centers?.name,
        alert.centers?.city,
        alert.blood_type_required,
        alert.message,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));

    const matchesUrgency = urgencyFilter === "all" || alert.urgency_level === urgencyFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;

    return matchesSearch && matchesUrgency && matchesStatus;
  });

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
      toast.success("Alerte escaladée. L'urgence a été augmentée.");
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id !== alertId) return a;
          const escalationMap: Record<UrgencyLevel, UrgencyLevel> = {
            low: "medium",
            medium: "high",
            high: "critical",
            critical: "critical",
          };
          return { ...a, urgency_level: escalationMap[a.urgency_level] };
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
      toast.success("Alerte relancée. Les donneurs ont été notifiés à nouveau.");
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: "active" as AlertStatus } : a))
      );
    }
    setActionLoading(null);
  }

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const criticalCount = alerts.filter((a) => a.status === "active" && a.urgency_level === "critical").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alertes d&apos;urgence</h1>
        <p className="mt-1 text-sm text-slate-500">
          {activeCount} alerte{activeCount !== 1 ? "s" : ""} active{activeCount !== 1 ? "s" : ""}
          {criticalCount > 0 && <span className="text-red-600 font-medium"> · {criticalCount} critique{criticalCount !== 1 ? "s" : ""}</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par centre, ville, groupe sanguin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300"
        >
          <option value="all">Toutes urgences</option>
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
          <option value="critical">Critique</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300"
        >
          <option value="all">Tous statuts</option>
          <option value="active">Active</option>
          <option value="expired">Expirée</option>
          <option value="closed">Fermée</option>
        </select>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Aucune alerte trouvée.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const urgency = URGENCY_CONFIG[alert.urgency_level];
            const status = STATUS_CONFIG[alert.status];
            const UrgencyIcon = urgency.icon;
            const isExpanded = expandedAlert === alert.id;
            const isLoading = actionLoading === alert.id;

            return (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Urgency indicator */}
                  <div className={cn("flex size-10 items-center justify-center rounded-xl border", urgency.color)}>
                    <UrgencyIcon className="size-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {alert.centers?.name || "Centre inconnu"}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-bold text-rose-600">{alert.blood_type_required}</span>
                      <span>{alert.centers?.city}</span>
                      <span>Échéance: {formatDate(alert.deadline)}</span>
                    </div>
                  </div>

                  {/* Urgency badge */}
                  <span className={cn("hidden sm:inline-flex rounded-full px-3 py-1 text-xs font-semibold border", urgency.color)}>
                    {urgency.label}
                  </span>

                  {/* Actions */}
                  {alert.status === "active" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEscalate(alert.id)}
                        disabled={isLoading}
                        className="rounded-lg p-2 text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50"
                        title="Escalader"
                      >
                        <TrendingUp className="size-4" />
                      </button>
                      <button
                        onClick={() => handleRelaunch(alert.id)}
                        disabled={isLoading}
                        className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                        title="Relancer"
                      >
                        <RotateCcw className="size-4" />
                      </button>
                      <button
                        onClick={() => handleClose(alert.id)}
                        disabled={isLoading}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        title="Fermer"
                      >
                        <XCircle className="size-4" />
                      </button>
                    </div>
                  )}

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600 space-y-1">
                    {alert.message && <p><strong>Message:</strong> {alert.message}</p>}
                    <p><strong>Rayon:</strong> {alert.radius_km} km</p>
                    <p><strong>Créée le:</strong> {formatDateTime(alert.created_at)}</p>
                    <p><strong>Mise à jour:</strong> {formatDateTime(alert.updated_at)}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
