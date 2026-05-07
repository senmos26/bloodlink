"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Grid3X3,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTodayAppointments,
  useUpdateAppointmentStatus,
} from "@/features/appointments/lib/hooks";
import type { Appointment, AppointmentStatus } from "@/entities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  pending: {
    label: "En attente",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmé",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: CheckCircle2,
  },
  completed: {
    label: "Terminé",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Annulé",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium border", config.bg, config.color)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function AppointmentCard({
  appointment,
  onStatusUpdate,
}: {
  appointment: Appointment;
  onStatusUpdate: (id: string, status: AppointmentStatus) => void;
}) {
  const time = new Date(appointment.scheduledDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="group transition-all duration-200 hover:shadow-md border-l-4 border-l-rose-400">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <span className="text-sm font-bold text-slate-900">{time}</span>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">
              {appointment.donorFullName ?? "Donneur inconnu"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {appointment.donorBloodType && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                  {appointment.donorBloodType}
                </span>
              )}
              {appointment.donorPhone && (
                <span className="text-xs text-slate-500">{appointment.donorPhone}</span>
              )}
            </div>
            {appointment.notes && (
              <p className="mt-2 text-xs text-slate-500 line-clamp-2">{appointment.notes}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {appointment.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => onStatusUpdate(appointment.id, "confirmed")}
              >
                Confirmer
              </Button>
            )}
            {appointment.status === "confirmed" && (
              <Button
                size="sm"
                className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onStatusUpdate(appointment.id, "completed")}
              >
                Terminer
              </Button>
            )}
            {(appointment.status === "pending" || appointment.status === "confirmed") && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onStatusUpdate(appointment.id, "cancelled")}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentListItem({
  appointment,
  onStatusUpdate,
}: {
  appointment: Appointment;
  onStatusUpdate: (id: string, status: AppointmentStatus) => void;
}) {
  const time = new Date(appointment.scheduledDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <span className="text-sm font-bold text-slate-900 w-14 flex-shrink-0">{time}</span>
      <span className="text-sm font-medium text-slate-800 flex-1 truncate">
        {appointment.donorFullName ?? "Donneur inconnu"}
      </span>
      {appointment.donorBloodType && (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
          {appointment.donorBloodType}
        </span>
      )}
      <StatusBadge status={appointment.status} />
      <div className="flex gap-1">
        {appointment.status === "pending" && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onStatusUpdate(appointment.id, "confirmed")}>
            Confirmer
          </Button>
        )}
        {appointment.status === "confirmed" && (
          <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700" onClick={() => onStatusUpdate(appointment.id, "completed")}>
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = useTodayAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");

  const filteredAppointments = appointments
    ?.filter((a) => {
      const matchesSearch =
        !search ||
        a.donorFullName?.toLowerCase().includes(search.toLowerCase()) ||
        a.donorPhone?.includes(search);
      const matchesFilter = filter === "all" || a.status === filter;
      return matchesSearch && matchesFilter;
    });

  const handleStatusUpdate = (id: string, status: AppointmentStatus) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.success(`Statut mis à jour : ${STATUS_CONFIG[status].label}`);
        },
        onError: () => {
          toast.error("Erreur lors de la mise à jour");
        },
      }
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rendez-vous</h1>
          <p className="text-sm text-slate-500">
            {filteredAppointments?.length ?? 0} rendez-vous aujourd'hui
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un donneur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
          <div className="flex rounded-lg border bg-white p-0.5">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
              className={cn("h-8 w-8 p-0", viewMode === "grid" && "bg-rose-600 hover:bg-rose-700")}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              className={cn("h-8 w-8 p-0", viewMode === "list" && "bg-rose-600 hover:bg-rose-700")}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "completed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-rose-600 hover:bg-rose-700" : ""}
          >
            {f === "all" && "Tous"}
            {f === "pending" && "En attente"}
            {f === "confirmed" && "Confirmés"}
            {f === "completed" && "Terminés"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !filteredAppointments?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Aucun rendez-vous</h3>
          <p className="text-sm text-slate-500 mt-1">Aucun rendez-vous prévu pour aujourd'hui</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {filteredAppointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-slate-100">
            {filteredAppointments.map((appt) => (
              <AppointmentListItem
                key={appt.id}
                appointment={appt}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
