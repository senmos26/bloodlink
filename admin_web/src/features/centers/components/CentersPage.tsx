"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Power,
  PowerOff,
  Eye,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/components/PageHeader";
import { FilterBar } from "@/shared/components/FilterBar";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { Pagination } from "@/shared/components/Pagination";
import { DetailsDrawer } from "@/shared/components/DetailsDrawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import { toggleCenterActive, createCenterAccount } from "@/features/centers/lib/actions";
import type { Center } from "@/types/database";

const LocationPicker = dynamic(
  () => import("@/components/ui/location-picker").then((mod) => mod.LocationPicker),
  { ssr: false }
);

// ─── Types ──────────────────────────────────────────────────────────

type CenterWithProfile = Center & {
  profiles?: { full_name: string; email: string } | null;
};

interface CentersPageProps {
  initialCenters: CenterWithProfile[];
}

const PAGE_SIZE = 10;

// ─── Component ──────────────────────────────────────────────────────

export function CentersPage({ initialCenters }: CentersPageProps) {
  const searchParams = useSearchParams();
  const [centers, setCenters] = React.useState(initialCenters);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = React.useState<CenterWithProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Create center sheet
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    responsibleFullName: "",
    responsibleEmail: "",
    responsiblePhone: "",
    centerName: "",
    centerAddress: "",
    centerCity: "",
    centerPhone: "",
    centerEmail: "",
    latitude: "",
    longitude: "",
  });

  const currentPage = Number(searchParams.get("page")) || 1;
  const statusFilter = searchParams.get("status") || "all";
  const q = (searchParams.get("q") || "").toLowerCase();

  // Filter
  const filtered = React.useMemo(() => {
    return centers.filter((c) => {
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
      const matchesSearch =
        !q ||
        [c.name, c.city, c.address, c.phone, c.email]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [centers, statusFilter, q]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleToggleActive(centerId: string, isActive: boolean) {
    setActionLoading(centerId);
    const result = await toggleCenterActive(centerId, !isActive);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isActive ? "Centre désactivé." : "Centre activé.");
      setCenters((prev) =>
        prev.map((c) => (c.id === centerId ? { ...c, is_active: !isActive } : c))
      );
    }
    setActionLoading(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (createLoading) return;

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error("Latitude et longitude doivent être des nombres valides.");
      return;
    }

    setCreateLoading(true);
    const result = await createCenterAccount({
      responsibleFullName: form.responsibleFullName,
      responsibleEmail: form.responsibleEmail,
      responsiblePhone: form.responsiblePhone,
      centerName: form.centerName,
      centerAddress: form.centerAddress,
      centerCity: form.centerCity,
      centerPhone: form.centerPhone,
      centerEmail: form.centerEmail,
      latitude: lat,
      longitude: lng,
    });
    setCreateLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Centre et compte responsable créés avec succès.");
    setIsCreateOpen(false);
    setForm({
      responsibleFullName: "",
      responsibleEmail: "",
      responsiblePhone: "",
      centerName: "",
      centerAddress: "",
      centerCity: "",
      centerPhone: "",
      centerEmail: "",
      latitude: "",
      longitude: "",
    });
    // Refresh page to show new center
    window.location.reload();
  }

  const activeCount = centers.filter((c) => c.is_active).length;
  const inactiveCount = centers.filter((c) => !c.is_active).length;

  const columns: Column<CenterWithProfile>[] = [
    {
      key: "name",
      header: "Centre",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            c.is_active ? "bg-blue-50" : "bg-slate-100"
          )}>
            <Building2 className={cn("h-4 w-4", c.is_active ? "text-blue-600" : "text-slate-400")} />
          </div>
          <div>
            <p className="font-medium text-slate-900">{c.name}</p>
            <p className="text-xs text-slate-400">{c.city}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (c) => (
        <Badge variant={c.is_active ? "success" : "destructive"}>
          {c.is_active ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (c) => (
        <div className="space-y-0.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
            {c.phone}
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            {c.email}
          </div>
        </div>
      ),
    },
    {
      key: "admin",
      header: "Responsable",
      cell: (c) =>
        c.profiles ? (
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3 w-3 text-slate-400" />
            <span className="text-slate-700">{c.profiles.full_name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (c) => {
        const isLoading = actionLoading === c.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 bg-white hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCenter(c);
                setIsDrawerOpen(true);
              }}
              title="Voir détails"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            {c.is_active ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300 disabled:opacity-40"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActive(c.id, c.is_active);
                }}
                disabled={isLoading}
                title="Désactiver le centre"
              >
                <PowerOff className="mr-1.5 h-3.5 w-3.5" />
                Désactiver
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-300 disabled:opacity-40"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActive(c.id, c.is_active);
                }}
                disabled={isLoading}
                title="Activer le centre"
              >
                <Power className="mr-1.5 h-3.5 w-3.5" />
                Activer
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const drawerFields = selectedCenter
    ? [
        { label: "Nom", value: selectedCenter.name },
        { label: "Adresse", value: (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {selectedCenter.address}, {selectedCenter.city}
          </div>
        )},
        { label: "Téléphone", value: selectedCenter.phone },
        { label: "Email", value: selectedCenter.email },
        { label: "Statut", value: (
          <Badge variant={selectedCenter.is_active ? "success" : "destructive"}>
            {selectedCenter.is_active ? "Actif" : "Inactif"}
          </Badge>
        )},
        {
          label: "Responsable",
          value: selectedCenter.profiles
            ? `${selectedCenter.profiles.full_name} (${selectedCenter.profiles.email})`
            : "Non assigné",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centres de santé"
        description={`${centers.length} centres · ${activeCount} actifs · ${inactiveCount} inactifs`}
        action={
          <Button onClick={() => setIsCreateOpen(true)} className="h-9">
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Rechercher par nom, ville, adresse..."
        resultsCount={filtered.length}
        filters={[
          {
            key: "status",
            label: "Statut",
            options: [
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(c) => c.id}
        emptyMessage="Aucun centre trouvé."
        onRowClick={(c) => {
          setSelectedCenter(c);
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
        title={selectedCenter?.name || "Détails"}
        subtitle={`${selectedCenter?.city || ""}`}
        fields={drawerFields}
        actions={
          selectedCenter ? (
            <Button
              variant={selectedCenter.is_active ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                handleToggleActive(selectedCenter.id, selectedCenter.is_active);
                setIsDrawerOpen(false);
              }}
            >
              {selectedCenter.is_active ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" /> Désactiver
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" /> Activer
                </>
              )}
            </Button>
          ) : null
        }
      />

      {/* Create Center Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouveau centre</SheetTitle>
            <SheetDescription>
              Créez un centre et le compte responsable associé.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreate} className="mt-6 space-y-5">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Responsable</h4>
              <div className="grid grid-cols-1 gap-3">
                <Input
                  placeholder="Nom complet du responsable"
                  value={form.responsibleFullName}
                  onChange={(e) => setForm((f) => ({ ...f, responsibleFullName: e.target.value }))}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email du responsable"
                  value={form.responsibleEmail}
                  onChange={(e) => setForm((f) => ({ ...f, responsibleEmail: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Téléphone du responsable"
                  value={form.responsiblePhone}
                  onChange={(e) => setForm((f) => ({ ...f, responsiblePhone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Centre</h4>
              <div className="grid grid-cols-1 gap-3">
                <Input
                  placeholder="Nom du centre"
                  value={form.centerName}
                  onChange={(e) => setForm((f) => ({ ...f, centerName: e.target.value }))}
                  required
                />

                {/* Location Picker — search, map, geolocation */}
                <LocationPicker
                  value={
                    form.latitude && form.longitude
                      ? {
                          addressLine1: form.centerAddress,
                          city: form.centerCity,
                          lat: parseFloat(form.latitude),
                          lng: parseFloat(form.longitude),
                        }
                      : null
                  }
                  onChange={(data) => {
                    if (data) {
                      setForm((f) => ({
                        ...f,
                        centerAddress: data.addressLine1 || f.centerAddress,
                        centerCity: data.city || f.centerCity,
                        latitude: String(data.lat),
                        longitude: String(data.lng),
                      }));
                    }
                  }}
                  mapHeight="h-56"
                />

                <Input
                  placeholder="Adresse"
                  value={form.centerAddress}
                  onChange={(e) => setForm((f) => ({ ...f, centerAddress: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Ville"
                  value={form.centerCity}
                  onChange={(e) => setForm((f) => ({ ...f, centerCity: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Téléphone du centre"
                  value={form.centerPhone}
                  onChange={(e) => setForm((f) => ({ ...f, centerPhone: e.target.value }))}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email du centre"
                  value={form.centerEmail}
                  onChange={(e) => setForm((f) => ({ ...f, centerEmail: e.target.value }))}
                  required
                />
              </div>
            </div>

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "Création..." : "Créer le centre"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
