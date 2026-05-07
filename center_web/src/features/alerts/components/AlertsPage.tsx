"use client";

import { useState, useMemo } from "react";
import { Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, BarChart3 } from "lucide-react";

import { AlertStatsBoard } from "./AlertStatsBoard";
import { AlertFiltersBar, type AlertFilterState, type AlertFilterHandlers } from "./AlertFiltersBar";
import { AlertCard } from "./AlertCard";
import { AlertTableView } from "./AlertTableView";

import {
  useFilteredAlerts,
  useAlertStats,
  useCreateAlert,
  useCloseAlert,
  useEscalateAlert,
  useRelaunchAlert,
  useShareAlert,
} from "@/features/alerts/lib/hooks";
import type { AlertStats } from "@/features/alerts/lib/actions";
import type { Alert, UrgencyLevel, AlertStatus } from "@/entities";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_LEVELS = [
  { id: "low" as const, label: "Optimisation", color: "bg-secondary-light" },
  { id: "medium" as const, label: "Moyenne", color: "bg-warning" },
  { id: "high" as const, label: "Haute", color: "bg-primary" },
  { id: "critical" as const, label: "Vitale", color: "bg-blood-red" },
];

// ── Main Page ──────────────────────────────────────────────
export default function AlertsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showForm, setShowForm] = useState(false);
  const [statsOpen, setStatsOpen] = useState("stats");
  const [formData, setFormData] = useState({
    blood_type_required: "O+",
    urgency_level: "medium" as UrgencyLevel,
    message: "",
    radius_km: 20,
    donors_needed: 0,
  });

  // Filters
  const [filters, setFilters] = useState<AlertFilterState>({
    searchTerm: "",
    bloodType: "all",
    urgency: "all",
    status: "all",
  });

  // Real data hooks
  const { data: alerts = [], isLoading, isFetching } = useFilteredAlerts({
    status: (filters.status || "all") as AlertStatus | "all",
    bloodType: filters.bloodType,
    urgencyLevel: (filters.urgency || "all") as UrgencyLevel | "all",
    searchTerm: filters.searchTerm,
  });

  const { data: stats } = useAlertStats();
  const createAlertMutation = useCreateAlert();
  const closeAlertMutation = useCloseAlert();
  const escalateAlertMutation = useEscalateAlert();
  const relaunchAlertMutation = useRelaunchAlert();
  const shareAlertMutation = useShareAlert();

  const handlers: AlertFilterHandlers = {
    handleSearchChange: (val) => setFilters((f) => ({ ...f, searchTerm: val })),
    handleBloodTypeChange: (val) => setFilters((f) => ({ ...f, bloodType: val })),
    handleUrgencyChange: (val) => setFilters((f) => ({ ...f, urgency: val })),
    handleStatusChange: (val) => setFilters((f) => ({ ...f, status: val })),
    handleClearFilters: () => setFilters({ searchTerm: "", bloodType: "all", urgency: "all", status: "all" }),
  };

  const hasActiveFilters =
    filters.searchTerm !== "" ||
    filters.bloodType !== "all" ||
    filters.urgency !== "all" ||
    filters.status !== "all";

  const handleCreate = () => {
    const fd = new FormData();
    fd.append("blood_type_required", formData.blood_type_required);
    fd.append("urgency_level", formData.urgency_level);
    fd.append("message", formData.message);
    fd.append("radius_km", String(formData.radius_km));
    fd.append("donors_needed", String(formData.donors_needed));
    createAlertMutation.mutate(fd, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({ blood_type_required: "O+", urgency_level: "medium", message: "", radius_km: 20, donors_needed: 0 });
        toast.success("Alerte publiée avec succès");
      },
      onError: () => toast.error("Erreur lors de la publication"),
    });
  };

  const handleClose = (id: string) => {
    closeAlertMutation.mutate(id, {
      onSuccess: () => toast.success("Alerte clôturée"),
      onError: () => toast.error("Erreur lors de la clôture"),
    });
  };

  const handleEscalate = (id: string) => {
    escalateAlertMutation.mutate(id, {
      onSuccess: () => toast.success("Alerte escaladée"),
      onError: () => toast.error("Erreur lors de l'escalade"),
    });
  };

  const handleRelaunch = (id: string) => {
    relaunchAlertMutation.mutate(id, {
      onSuccess: () => toast.success("Notification relancée aux donneurs proches"),
      onError: () => toast.error("Erreur lors de la relance"),
    });
  };

  const handleShare = (id: string) => {
    shareAlertMutation.mutate(id, {
      onSuccess: (res) => {
        if (res.url) {
          navigator.clipboard.writeText(res.url);
          toast.success("Lien de partage copié");
        }
      },
      onError: () => toast.error("Erreur lors du partage"),
    });
  };

  return (
    <div className="flex h-full flex-col -mx-4 sm:-mx-6">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Alertes d'urgence
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gestion des appels au don et suivi des réponses
            </p>
          </div>
          <Button
            variant={showForm ? "outline" : "default"}
            onClick={() => setShowForm(!showForm)}
            className={!showForm ? "bg-primary hover:bg-primary-dark font-bold" : ""}
          >
            {showForm ? (
              <><X className="mr-2 h-4 w-4" /> Annuler</>
            ) : (
              <><Megaphone className="mr-2 h-4 w-4" /> Lancer une alerte</>
            )}
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {/* Stats Section */}
        <div className="px-4 sm:px-6 space-y-1 sm:space-y-2 mt-2">
          <Collapsible
            open={statsOpen === "stats"}
            onOpenChange={(open) => setStatsOpen(open ? "stats" : "")}
          >
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-0 h-auto"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Tableau de bord</span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform duration-200", statsOpen === "stats" && "rotate-180")}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-3">
              <div className="border rounded-lg px-3 bg-white shadow-sm">
                <div className="pt-2 pb-0">
                  <AlertStatsBoard stats={stats} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="px-4 sm:px-6 mt-4">
            <Card className="border-2 border-accent shadow-lg overflow-hidden">
              <div className="bg-accent px-4 py-2 border-b border-accent-foreground/10">
                <span className="text-xs font-bold text-accent-foreground tracking-wide">Configuration de l'appel au don</span>
              </div>
              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-foreground/70 uppercase tracking-tight">Groupe Sanguin Ciblé</label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_TYPES.map((bt) => (
                        <button
                          key={bt}
                          onClick={() => setFormData({ ...formData, blood_type_required: bt })}
                          className={cn(
                            "py-2.5 rounded-lg border-2 font-bold text-sm transition-all",
                            formData.blood_type_required === bt
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          {bt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-foreground/70 uppercase tracking-tight">Niveau d'Urgence</label>
                    <div className="grid grid-cols-2 gap-2">
                      {URGENCY_LEVELS.map((lvl) => (
                        <button
                          key={lvl.id}
                          onClick={() => setFormData({ ...formData, urgency_level: lvl.id })}
                          className={cn(
                            "px-3 py-2.5 rounded-lg border-2 font-bold text-sm transition-all",
                            formData.urgency_level === lvl.id
                              ? `${lvl.color} border-transparent text-primary-foreground shadow-md`
                              : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-foreground/70 uppercase">Message de l'Alerte</label>
                    <Input
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Ex: Pénurie critique de O-, besoin de 10 poches..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/70 uppercase">Rayon (km)</label>
                    <Input
                      type="number"
                      value={formData.radius_km}
                      onChange={(e) => setFormData({ ...formData, radius_km: parseInt(e.target.value) || 20 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/70 uppercase">Donneurs requis</label>
                    <Input
                      type="number"
                      value={formData.donors_needed}
                      onChange={(e) => setFormData({ ...formData, donors_needed: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary-dark font-bold"
                  onClick={handleCreate}
                  disabled={!formData.message || createAlertMutation.isPending}
                >
                  Diffuser l'Alerte
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sticky Filters bar */}
        <div className="sticky top-0 z-40 bg-background px-4 sm:px-6 pb-2 pt-2 shadow-sm sm:shadow-none flex-none">
          <AlertFiltersBar
            filters={filters}
            handlers={handlers}
            hasActiveFilters={hasActiveFilters}
            filteredCount={alerts.length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Content */}
        <section className="px-4 sm:px-6 flex-1 min-h-0 flex flex-col pt-2 pb-4">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="animate-pulse space-y-3 max-w-md mx-auto">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-border rounded-2xl">
              <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Megaphone className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Aucune alerte trouvée</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Modifiez les filtres ou lancez une nouvelle alerte</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="flex-1 overflow-y-auto min-h-0 scroll-fade">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onClose={handleClose}
                    onEscalate={handleEscalate}
                    onRelaunch={handleRelaunch}
                    onShare={handleShare}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">
              <AlertTableView
                alerts={alerts}
                onClose={handleClose}
                onEscalate={handleEscalate}
                onShare={handleShare}
              />
            </div>
          )}
        </section>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="border-t py-2 px-4 bg-white/80">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                {alerts.length} alerte{alerts.length !== 1 ? "s" : ""} affichée{alerts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
