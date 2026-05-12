"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  Droplets,
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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success"; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "En attente", variant: "secondary", icon: Clock },
  confirmed: { label: "Confirmé", variant: "default", icon: CheckCircle2 },
  completed: { label: "Complété", variant: "success", icon: CheckCircle2 },
  cancelled: { label: "Annulé", variant: "destructive", icon: XCircle },
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

const PAGE_SIZE = 10;

export function AppointmentsPage({ initialAppointments }: AppointmentsPageProps) {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = React.useState(initialAppointments);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [selectedApt, setSelectedApt] = React.useState<AppointmentRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const currentPage = Number(searchParams.get("page")) || 1;
  const statusFilter = searchParams.get("status") || "all";
  const q = (searchParams.get("q") || "").toLowerCase();

  const filtered = React.useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch =
        !q ||
        [apt.profiles?.full_name, apt.centers?.name, apt.notes]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, q, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleStatusChange(appointmentId: string, newStatus: AppointmentStatus) {
    setActionLoading(appointmentId);
    const result = await updateAppointmentStatus(appointmentId, newStatus);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Rendez-vous mis à jour.");
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a)));
    }
    setActionLoading(null);
  }

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => a.scheduled_date?.startsWith(todayStr)).length;

  const columns: Column<AppointmentRow>[] = [
    {
      key: "date",
      header: "Date",
      cell: (apt) => {
        const config = STATUS_CONFIG[apt.status];
        const StatusIcon = config.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", apt.status === "cancelled" ? "bg-red-50 border-red-200" : apt.status === "completed" ? "bg-green-50 border-green-200" : apt.status === "confirmed" ? "bg-blue-50 border-blue-200" : "bg-yellow-50 border-yellow-200")}>
              <StatusIcon className={cn("h-4 w-4", apt.status === "cancelled" ? "text-red-600" : apt.status === "completed" ? "text-green-600" : apt.status === "confirmed" ? "text-blue-600" : "text-yellow-600")} />
            </div>
            <div>
              <p className="font-medium text-slate-900">{formatDateTime(apt.scheduled_date)}</p>
              <p className="text-xs text-slate-400">{apt.centers?.name || "Centre inconnu"}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "donor",
      header: "Donneur",
      cell: (apt) => (
        <div className="text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-slate-400" />
            {apt.profiles?.full_name || "—"}
          </div>
          {apt.profiles?.blood_type && (
            <div className="flex items-center gap-1.5 mt-0.5 font-bold text-rose-600">
              <Droplets className="h-3 w-3" />
              {apt.profiles.blood_type}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (apt) => {
        const s = STATUS_CONFIG[apt.status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (apt) => {
        const isLoading = actionLoading === apt.id;
        const validNext = VALID_TRANSITIONS[apt.status];
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 bg-white hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedApt(apt);
                setIsDrawerOpen(true);
              }}
              title="Voir détails"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            {validNext.map((next) => {
              const nc = STATUS_CONFIG[next];
              if (next === "cancelled") {
                return (
                  <Button
                    key={next}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(apt.id, next);
                    }}
                    disabled={isLoading}
                    title="Annuler le rendez-vous"
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Annuler
                  </Button>
                );
              }
              if (next === "completed") {
                return (
                  <Button
                    key={next}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(apt.id, next);
                    }}
                    disabled={isLoading}
                    title="Marquer comme complété"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Compléter
                  </Button>
                );
              }
              return (
                <Button
                  key={next}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(apt.id, next);
                  }}
                  disabled={isLoading}
                  title="Confirmer le rendez-vous"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Confirmer
                </Button>
              );
            })}
          </div>
        );
      },
    },
  ];

  const drawerFields = selectedApt
    ? [
        { label: "Date", value: formatDateTime(selectedApt.scheduled_date) },
        { label: "Centre", value: (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            {selectedApt.centers?.name || "—"}
          </div>
        )},
        { label: "Donneur", value: (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {selectedApt.profiles?.full_name || "—"}
            {selectedApt.profiles?.blood_type && (
              <span className="font-bold text-rose-600 ml-1">{selectedApt.profiles.blood_type}</span>
            )}
          </div>
        )},
        { label: "Statut", value: <Badge variant={STATUS_CONFIG[selectedApt.status].variant}>{STATUS_CONFIG[selectedApt.status].label}</Badge> },
        { label: "Notes", value: selectedApt.notes || "—" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rendez-vous"
        description={`${todayCount} aujourd'hui · ${pendingCount} en attente · ${confirmedCount} confirmés`}
      />

      <FilterBar
        searchPlaceholder="Rechercher par donneur, centre, notes..."
        resultsCount={filtered.length}
        filters={[
          {
            key: "status",
            label: "Statut",
            options: [
              { value: "pending", label: "En attente" },
              { value: "confirmed", label: "Confirmé" },
              { value: "completed", label: "Complété" },
              { value: "cancelled", label: "Annulé" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(apt) => apt.id}
        emptyMessage="Aucun rendez-vous trouvé."
        onRowClick={(apt) => {
          setSelectedApt(apt);
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
        title={`Rendez-vous — ${selectedApt?.profiles?.full_name || "Détails"}`}
        fields={drawerFields}
      />
    </div>
  );
}
