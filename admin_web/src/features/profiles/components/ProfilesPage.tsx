"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Shield,
  Power,
  PowerOff,
  Droplets,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/shared/components/PageHeader";
import { FilterBar } from "@/shared/components/FilterBar";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { Pagination } from "@/shared/components/Pagination";
import { DetailsDrawer } from "@/shared/components/DetailsDrawer";
import { changeUserRole, toggleProfileActive } from "@/features/profiles/lib/actions";
import type { Profile, UserRole } from "@/types/database";

// ─── Constants ──────────────────────────────────────────────────────

const ROLE_CONFIG: Record<UserRole, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
  super_admin: { label: "Super Admin", variant: "default" },
  center_admin: { label: "Centre Admin", variant: "secondary" },
  donor: { label: "Donneur", variant: "outline" },
};

const ROLES: UserRole[] = ["donor", "center_admin", "super_admin"];

// ─── Component ──────────────────────────────────────────────────────

interface ProfilesPageProps {
  initialProfiles: Profile[];
}

const PAGE_SIZE = 10;

export function ProfilesPage({ initialProfiles }: ProfilesPageProps) {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = React.useState(initialProfiles);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = React.useState<Profile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const currentPage = Number(searchParams.get("page")) || 1;
  const roleFilter = searchParams.get("role") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const q = (searchParams.get("q") || "").toLowerCase();

  const filtered = React.useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch =
        !q ||
        [p.full_name, p.phone]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q));
      const matchesRole = roleFilter === "all" || p.role === roleFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? p.is_active : !p.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [profiles, q, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleRoleChange(profileId: string, currentRole: UserRole, newRole: UserRole) {
    if (currentRole === newRole) return;
    setActionLoading(profileId);
    const result = await changeUserRole(profileId, newRole);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Rôle mis à jour.");
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p)));
    }
    setActionLoading(null);
  }

  async function handleToggleActive(profileId: string, isActive: boolean) {
    setActionLoading(profileId);
    const result = await toggleProfileActive(profileId, !isActive);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isActive ? "Compte désactivé." : "Compte activé.");
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, is_active: !isActive } : p)));
    }
    setActionLoading(null);
  }

  const activeCount = profiles.filter((p) => p.is_active).length;
  const inactiveCount = profiles.filter((p) => !p.is_active).length;
  const superAdminCount = profiles.filter((p) => p.role === "super_admin").length;

  const columns: Column<Profile>[] = [
    {
      key: "user",
      header: "Utilisateur",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {p.full_name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
          </div>
          <div>
            <p className="font-medium text-slate-900">{p.full_name}</p>
            <p className="text-xs text-slate-400">{p.phone || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rôle",
      cell: (p) => {
        const isLoading = actionLoading === p.id;
        return (
          <Select
            value={p.role}
            onValueChange={(v) => handleRoleChange(p.id, p.role, v as UserRole)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_CONFIG[role].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      cell: (p) => (
        <Badge variant={p.is_active ? "success" : "destructive"}>
          {p.is_active ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "blood",
      header: "Groupe",
      cell: (p) =>
        p.blood_type ? (
          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
            <Droplets className="h-3.5 w-3.5" />
            {p.blood_type}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "created",
      header: "Inscrit le",
      cell: (p) => <span className="text-xs text-slate-500">{formatDate(p.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (p) => {
        const isLoading = actionLoading === p.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 bg-white hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProfile(p);
                setIsDrawerOpen(true);
              }}
              title="Voir détails"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            {p.is_active ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300 disabled:opacity-40"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActive(p.id, p.is_active);
                }}
                disabled={isLoading}
                title="Désactiver le compte"
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
                  handleToggleActive(p.id, p.is_active);
                }}
                disabled={isLoading}
                title="Activer le compte"
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

  const drawerFields = selectedProfile
    ? [
        { label: "Nom complet", value: selectedProfile.full_name },
        { label: "Téléphone", value: selectedProfile.phone || "—" },
        { label: "Email", value: "—" },
        { label: "Rôle", value: <Badge variant={ROLE_CONFIG[selectedProfile.role].variant}>{ROLE_CONFIG[selectedProfile.role].label}</Badge> },
        { label: "Statut", value: <Badge variant={selectedProfile.is_active ? "success" : "destructive"}>{selectedProfile.is_active ? "Actif" : "Inactif"}</Badge> },
        { label: "Groupe sanguin", value: selectedProfile.blood_type ? <span className="font-bold text-rose-600">{selectedProfile.blood_type}</span> : "—" },
        { label: "Inscrit le", value: formatDate(selectedProfile.created_at) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description={`${profiles.length} total · ${activeCount} actifs · ${inactiveCount} inactifs · ${superAdminCount} super admin${superAdminCount !== 1 ? "s" : ""}`}
      />

      <FilterBar
        searchPlaceholder="Rechercher par nom, téléphone, email..."
        resultsCount={filtered.length}
        filters={[
          {
            key: "role",
            label: "Rôle",
            options: [
              { value: "donor", label: "Donneur" },
              { value: "center_admin", label: "Centre Admin" },
              { value: "super_admin", label: "Super Admin" },
            ],
          },
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
        keyExtractor={(p) => p.id}
        emptyMessage="Aucun profil trouvé."
        onRowClick={(p) => {
          setSelectedProfile(p);
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
        title={selectedProfile?.full_name || "Profil"}
        fields={drawerFields}
        actions={
          selectedProfile ? (
            <Button
              variant={selectedProfile.is_active ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                handleToggleActive(selectedProfile.id, selectedProfile.is_active);
                setIsDrawerOpen(false);
              }}
            >
              {selectedProfile.is_active ? (
                <><PowerOff className="mr-2 h-4 w-4" /> Désactiver</>
              ) : (
                <><Power className="mr-2 h-4 w-4" /> Activer</>
              )}
            </Button>
          ) : null
        }
      />
    </div>
  );
}
