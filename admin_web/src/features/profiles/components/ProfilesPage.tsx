"use client";

import { useState } from "react";
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Search,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { changeUserRole, toggleProfileActive } from "@/features/profiles/lib/actions";
import type { Profile, UserRole } from "@/types/database";

// ─── Constants ──────────────────────────────────────────────────────

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "bg-violet-100 text-violet-700" },
  center_admin: { label: "Centre Admin", color: "bg-blue-100 text-blue-700" },
  donor: { label: "Donneur", color: "bg-slate-100 text-slate-600" },
};

const ROLES: UserRole[] = ["donor", "center_admin", "super_admin"];

// ─── Component ──────────────────────────────────────────────────────

interface ProfilesPageProps {
  initialProfiles: Profile[];
}

export function ProfilesPage({ initialProfiles }: ProfilesPageProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredProfiles = profiles.filter((p) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [p.full_name, p.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));

    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  async function handleRoleChange(profileId: string, currentRole: UserRole, newRole: UserRole) {
    if (currentRole === newRole) return;
    setActionLoading(profileId);

    const result = await changeUserRole(profileId, newRole);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Rôle mis à jour avec succès.");
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );
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
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, is_active: !isActive } : p))
      );
    }
    setActionLoading(null);
  }

  const activeCount = profiles.filter((p) => p.is_active).length;
  const inactiveCount = profiles.filter((p) => !p.is_active).length;
  const superAdminCount = profiles.filter((p) => p.role === "super_admin").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
        <p className="mt-1 text-sm text-slate-500">
          {profiles.length} total · {activeCount} actifs · {inactiveCount} inactifs · {superAdminCount} super admins
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {ROLES.map((role) => {
          const config = ROLE_CONFIG[role];
          const count = profiles.filter((p) => p.role === role).length;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3 transition-colors",
                roleFilter === role ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className={cn("flex size-7 items-center justify-center rounded-lg text-xs font-bold", config.color)}>
                {count}
              </div>
              <span className="text-xs font-medium text-slate-700">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      {/* Profiles table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Groupe</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((profile) => {
                const roleConfig = ROLE_CONFIG[profile.role];
                const isLoading = actionLoading === profile.id;

                return (
                  <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {profile.full_name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{profile.full_name}</p>
                          <p className="text-xs text-slate-400">{profile.phone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile.id, profile.role, e.target.value as UserRole)}
                        disabled={isLoading}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-rose-300 disabled:opacity-50"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_CONFIG[role].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          profile.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        )}
                      >
                        {profile.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {profile.blood_type ? (
                        <span className="font-bold text-rose-600">{profile.blood_type}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(profile.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleActive(profile.id, profile.is_active)}
                        disabled={isLoading}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                          profile.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        )}
                      >
                        {profile.is_active ? "Désactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProfiles.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucun profil trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
