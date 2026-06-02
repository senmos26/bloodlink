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
  ChevronLeft,
  ChevronRight,
  Calendar,
  Phone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllAppointments,
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
  showDate = false,
}: {
  appointment: Appointment;
  onStatusUpdate: (id: string, status: AppointmentStatus) => void;
  showDate?: boolean;
}) {
  const dateStr = new Date(appointment.scheduledDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = new Date(appointment.scheduledDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="group transition-all duration-200 hover:shadow-md border-l-4 border-l-rose-400">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CalendarDays className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <span className="text-sm font-bold text-slate-900">
                {showDate ? `${dateStr} à ${time}` : time}
              </span>
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
  showDate = false,
}: {
  appointment: Appointment;
  onStatusUpdate: (id: string, status: AppointmentStatus) => void;
  showDate?: boolean;
}) {
  const dateStr = new Date(appointment.scheduledDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const time = new Date(appointment.scheduledDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
        {/* Date & Time Column */}
        <div className="flex items-center gap-2 text-rose-500 font-bold text-sm w-36 flex-shrink-0">
          <CalendarDays className="h-4 w-4 flex-shrink-0" />
          <span>{showDate ? `${dateStr} à ${time}` : time}</span>
        </div>

        {/* Donor Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800 truncate">
              {appointment.donorFullName ?? "Donneur inconnu"}
            </span>
            {appointment.donorBloodType && (
              <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
                {appointment.donorBloodType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {appointment.donorPhone && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                {appointment.donorPhone}
              </span>
            )}
            {appointment.notes && (
              <span className="text-xs text-slate-400 truncate max-w-[250px]" title={appointment.notes}>
                {appointment.notes}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status & Actions Column */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between sm:justify-end w-full sm:w-auto">
        <StatusBadge status={appointment.status} />

        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {appointment.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 px-3 font-medium"
              onClick={() => onStatusUpdate(appointment.id, "confirmed")}
            >
              Confirmer
            </Button>
          )}
          {appointment.status === "confirmed" && (
            <Button
              size="sm"
              className="text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700 font-medium"
              onClick={() => onStatusUpdate(appointment.id, "completed")}
            >
              Terminer
            </Button>
          )}
          {(appointment.status === "pending" || appointment.status === "confirmed") && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onStatusUpdate(appointment.id, "cancelled")}
            >
              Annuler
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [dateFilterType, setDateFilterType] = useState<"all" | "today" | "custom">("all");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString("en-CA");
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("all");

  const { data: appointments = [], isLoading } = useAllAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const handleStatusUpdate = (id: string, status: AppointmentStatus) => {
    const toastId = toast.loading("Mise à jour du statut...");
    updateStatusMutation.mutate(
      { id, status },
      {
        onSuccess: (res) => {
          if (res && "error" in res && res.error) {
            toast.error(`Erreur: ${res.error}`, { id: toastId });
          } else {
            toast.success("Rendez-vous mis à jour avec succès", { id: toastId });
          }
        },
        onError: (err: unknown) => {
          const errMsg = err instanceof Error ? err.message : String(err);
          toast.error(`Erreur lors de la mise à jour : ${errMsg}`, { id: toastId });
        },
      }
    );
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toLocaleDateString("en-CA"));
  };

  const setToday = () => {
    setSelectedDate(new Date().toLocaleDateString("en-CA"));
  };

  // Counts calculated on all fetched appointments
  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  // Filters logic
  const filteredAppointments = appointments.filter((appt) => {
    // 1. Search Query filter
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const nameMatch = appt.donorFullName?.toLowerCase().includes(query) ?? false;
      const phoneMatch = appt.donorPhone?.toLowerCase().includes(query) ?? false;
      const bloodMatch = appt.donorBloodType?.toLowerCase().includes(query) ?? false;
      const notesMatch = appt.notes?.toLowerCase().includes(query) ?? false;
      if (!nameMatch && !phoneMatch && !bloodMatch && !notesMatch) return false;
    }

    // 2. Status filter
    if (statusFilter !== "all" && appt.status !== statusFilter) {
      return false;
    }

    // 3. Date filter
    const apptDateStr = new Date(appt.scheduledDate).toLocaleDateString("en-CA");
    if (dateFilterType === "today") {
      const todayStr = new Date().toLocaleDateString("en-CA");
      if (apptDateStr !== todayStr) return false;
    } else if (dateFilterType === "custom") {
      if (apptDateStr !== selectedDate) return false;
    }

    // 4. Blood Type filter
    if (bloodTypeFilter !== "all" && appt.donorBloodType !== bloodTypeFilter) {
      return false;
    }

    return true;
  });

  const formattedHeaderDate = new Date(selectedDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const showDateStr = dateFilterType === "all";

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {"Gestion des Rendez-vous"}
          </h1>
          <p className="text-sm text-slate-500">
            {"Gérez le planning et le suivi de l'ensemble de vos rendez-vous."}
          </p>
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher un donneur..."
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center border rounded-lg bg-white p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm">
        {/* Row 1: Status Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer",
              statusFilter === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {"Tous"}
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              statusFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            )}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer",
              statusFilter === "pending"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-amber-700 border-amber-100 hover:bg-amber-50/50"
            )}
          >
            {"En attente"}
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              statusFilter === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
            )}>
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("confirmed")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer",
              statusFilter === "confirmed"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-blue-700 border-blue-100 hover:bg-blue-50/50"
            )}
          >
            {"Confirmé"}
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              statusFilter === "confirmed" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
            )}>
              {counts.confirmed}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("completed")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer",
              statusFilter === "completed"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50/50"
            )}
          >
            {"Terminé"}
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              statusFilter === "completed" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
            )}>
              {counts.completed}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("cancelled")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer",
              statusFilter === "cancelled"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-red-700 border-red-100 hover:bg-red-50/50"
            )}
          >
            {"Annulé"}
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              statusFilter === "cancelled" ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
            )}>
              {counts.cancelled}
            </span>
          </button>
        </div>

        {/* Row 2: Date Filters Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200/60 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{"Date :"}</span>
            <div className="flex items-center border border-slate-200 rounded-lg bg-white p-1 shadow-sm">
              <Button
                variant={dateFilterType === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs font-medium"
                onClick={() => setDateFilterType("all")}
              >
                {"Toutes les dates"}
              </Button>
              <Button
                variant={dateFilterType === "today" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs font-medium"
                onClick={() => setDateFilterType("today")}
              >
                {"Aujourd'hui"}
              </Button>
              <Button
                variant={dateFilterType === "custom" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs font-medium"
                onClick={() => setDateFilterType("custom")}
              >
                {"Date spécifique"}
              </Button>
            </div>
          </div>

          {dateFilterType === "custom" && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeDate(-1)}
                className="bg-white border-slate-200 hover:bg-slate-50 h-8 text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {"Précédent"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={setToday}
                className="bg-white border-slate-200 hover:bg-slate-50 font-medium h-8 text-xs"
              >
                {"Aujourd'hui"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeDate(1)}
                className="bg-white border-slate-200 hover:bg-slate-50 h-8 text-xs"
              >
                {"Suivant"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-slate-200 hover:bg-slate-50 pointer-events-none h-8 text-xs"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {"Choisir une date"}
                </Button>
              </div>
              <span className="text-xs font-semibold text-slate-700 capitalize ml-1 border-l pl-2 border-slate-200 h-4 flex items-center">
                {formattedHeaderDate}
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Blood Group Filter */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/60 pt-3">
          <span className="text-xs font-semibold text-slate-500 mr-2">{"Groupe sanguin :"}</span>
          <Button
            size="sm"
            variant={bloodTypeFilter === "all" ? "default" : "outline"}
            className={cn(
              "h-7 text-xs font-medium px-2.5 transition-all",
              bloodTypeFilter === "all"
                ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200"
            )}
            onClick={() => setBloodTypeFilter("all")}
          >
            {"Tous"}
          </Button>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
            <Button
              key={bt}
              size="sm"
              variant={bloodTypeFilter === bt ? "default" : "outline"}
              className={cn(
                "h-7 text-xs font-medium px-2.5 transition-all",
                bloodTypeFilter === bt
                  ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 border-slate-200"
              )}
              onClick={() => setBloodTypeFilter(bt === bloodTypeFilter ? "all" : bt)}
            >
              {bt}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-l-4 border-l-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-5 w-40" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border border-slate-100 rounded-xl bg-white divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-24 flex-shrink-0" />
                <Skeleton className="h-4 w-48 flex-1" />
                <Skeleton className="h-4 w-12 flex-shrink-0" />
                <Skeleton className="h-5 w-20 flex-shrink-0" />
              </div>
            ))}
          </div>
        )
      ) : filteredAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-slate-50/50">
          <CalendarDays className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">{"Aucun rendez-vous"}</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            {"Il n'y a pas de rendez-vous correspondant aux filtres sélectionnés."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onStatusUpdate={handleStatusUpdate}
              showDate={showDateStr || new Date(appt.scheduledDate).toLocaleDateString("en-CA") !== new Date().toLocaleDateString("en-CA")}
            />
          ))}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
          {filteredAppointments.map((appt) => (
            <AppointmentListItem
              key={appt.id}
              appointment={appt}
              onStatusUpdate={handleStatusUpdate}
              showDate={showDateStr || new Date(appt.scheduledDate).toLocaleDateString("en-CA") !== new Date().toLocaleDateString("en-CA")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
