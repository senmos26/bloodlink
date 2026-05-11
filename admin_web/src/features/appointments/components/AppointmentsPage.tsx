"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  User,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDateTime } from "@/lib/utils";
import { updateAppointmentStatus } from "@/features/appointments/lib/actions";
import type { AppointmentStatus } from "@/types/database";

// ─── Types ──────────────────────────────────────────────────────────

interface AppointmentRow {
  id: string;
  donor_id: string;
  center_id: string;
  scheduled_date: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string; blood_type: string | null; phone: string | null } | null;
  centers?: { name: string; address: string | null; phone: string | null } | null;
}

// ─── Constants ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmed: { label: "Confirmé", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  completed: { label: "Complété", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-700", icon: XCircle },
};

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// ─── Component ──────────────────────────────────────────────────────

interface AppointmentsPageProps {
  initialAppointments: AppointmentRow[];
}

export function AppointmentsPage({ initialAppointments }: AppointmentsPageProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredAppointments = appointments.filter((apt) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [
        apt.profiles?.full_name,
        apt.centers?.name,
        apt.notes,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleStatusChange(appointmentId: string, newStatus: AppointmentStatus) {
    setActionLoading(appointmentId);
    const result = await updateAppointmentStatus(appointmentId, newStatus);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Rendez-vous mis à jour.");
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
    }
    setActionLoading(null);
  }

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => a.scheduled_date?.startsWith(todayStr)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rendez-vous</h1>
        <p className="mt-1 text-sm text-slate-500">
          {todayCount} aujourd&apos;hui · {pendingCount} en attente · {confirmedCount} confirmés
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon;
          const count = appointments.filter((a) => a.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                statusFilter === status ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className={cn("flex size-8 items-center justify-center rounded-lg", config.color)}>
                <Icon className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500">{config.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par donneur, centre, notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      {/* Appointments list */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Aucun rendez-vous trouvé.
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const statusConfig = STATUS_CONFIG[apt.status];
            const StatusIcon = statusConfig.icon;
            const validNext = VALID_TRANSITIONS[apt.status];
            const isLoading = actionLoading === apt.id;

            return (
              <div
                key={apt.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex items-start gap-3">
                    <div className={cn("flex size-10 items-center justify-center rounded-xl", statusConfig.color)}>
                      <CalendarDays className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDateTime(apt.scheduled_date)}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <User className="size-3" />
                        <span>{apt.profiles?.full_name || "Donneur inconnu"}</span>
                        {apt.profiles?.blood_type && (
                          <span className="font-bold text-rose-600">{apt.profiles.blood_type}</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="size-3" />
                        <span>{apt.centers?.name || "Centre inconnu"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div className="flex items-center gap-3">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusConfig.color)}>
                      {statusConfig.label}
                    </span>

                    {validNext.length > 0 && (
                      <div className="flex items-center gap-1">
                        {validNext.map((nextStatus) => {
                          const nextConfig = STATUS_CONFIG[nextStatus];
                          const NextIcon = nextConfig.icon;
                          return (
                            <button
                              key={nextStatus}
                              onClick={() => handleStatusChange(apt.id, nextStatus)}
                              disabled={isLoading}
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                                nextStatus === "cancelled"
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : nextStatus === "completed"
                                  ? "bg-green-50 text-green-600 hover:bg-green-100"
                                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                              )}
                            >
                              {nextConfig.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {apt.notes && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {apt.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
