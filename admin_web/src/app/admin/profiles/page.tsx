export { default } from "@/components/admin-pages/ProfilesPageContent";

/*
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile, UserRole } from "@/types/database";
import { useRouter } from "next/navigation";
import { getCurrentAdminContext } from "@/lib/auth";

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      try {
        const adminContext = await getCurrentAdminContext();
        if (!adminContext || adminContext.role !== "super_admin") {
          router.push("/admin/dashboard");
          return;
        }

        setUserRole(adminContext.role);

        const { data, error } = await supabaseClient
          .from("profiles")
          .select("id, full_name, role, is_active, phone, created_at")
          .order("created_at", { ascending: false });

        if (error) {
          setError(error.message);
          return;
        }

        setProfiles(data || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les profils."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, [router]);

  const toggleActive = async (profileId: string, currentValue: boolean) => {
    try {
      const { error } = await supabaseClient
        .from("profiles")
        .update({ is_active: !currentValue })
        .eq("id", profileId);

      if (error) {
        throw error;
      }

      setProfiles((current) =>
        current.map((profile) =>
          profile.id === profileId
            ? { ...profile, is_active: !currentValue }
            : profile
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour le profil."
      );
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Gestion des profils
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Affichez et activez/désactivez les utilisateurs du système.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg bg-white p-6 text-gray-700">
          Chargement des profils...
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actif
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {profile.full_name || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 uppercase">
                    {profile.role}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {profile.phone || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {profile.is_active ? "Oui" : "Non"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() =>
                        toggleActive(profile.id, profile.is_active)
                      }
                      className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    >
                      {profile.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
* /

"use client";

import { useEffect, useState } from "react";

import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/types/database";

const roles: UserRole[] = ["donor", "center_admin", "super_admin"];

/*
export default function ProfilesPage() {
  const [context, setContext] = useState<AdminContext | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      try {
        const adminContext = await getCurrentAdminContext();

        if (adminContext.role !== "super_admin") {
          throw new Error("Accès réservé aux super administrateurs.");
        }

        const { data, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;
        if (!active) return;

        setContext(adminContext);
        setProfiles(Array.isArray(data) ? (data as Profile[]) : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Chargement des profils impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfiles();

    return () => {
      active = false;
    };
  }, []);

  async function refreshProfiles() {
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;
    setProfiles(Array.isArray(data) ? (data as Profile[]) : []);
  }

  async function handleRoleChange(profile: Profile, role: UserRole) {
    if (!context) return;

    if (profile.id === context.profile.id && role !== "super_admin") {
      setError("Vous ne pouvez pas retirer votre propre rôle super_admin.");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", profile.id);

      if (updateError) throw updateError;
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  }

  async function handleToggleActive(profile: Profile) {
    if (!context) return;

    if (profile.id === context.profile.id && profile.is_active) {
      setError("Vous ne pouvez pas désactiver votre propre compte.");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_active: !profile.is_active })
        .eq("id", profile.id);

      if (updateError) throw updateError;
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Utilisateurs</h1>
        <p className="mt-2 text-sm text-slate-500">Gérez les rôles et l'activation des profils.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : Array.isArray(profiles) && profiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 pr-4">Nom</th>
                  <th className="pb-3 pr-4">Téléphone</th>
                  <th className="pb-3 pr-4">Rôle</th>
                  <th className="pb-3 pr-4">Actif</th>
                  <th className="pb-3 pr-4">Groupe</th>
                  <th className="pb-3 pr-4">Créé le</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-slate-100 align-top">
                    <td className="py-4 pr-4 font-medium text-slate-900">{profile.full_name}</td>
                    <td className="py-4 pr-4 text-slate-600">{profile.phone}</td>
                    <td className="py-4 pr-4">
                      <select value={profile.role} onChange={(event) => handleRoleChange(profile, event.target.value as UserRole)} className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-red-400">
                        {roles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{profile.is_active ? "Oui" : "Non"}</td>
                    <td className="py-4 pr-4 text-slate-600">{profile.blood_type ?? "Non renseigné"}</td>
                    <td className="py-4 pr-4 text-slate-600">{new Date(profile.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="py-4">
                      <button type="button" onClick={() => handleToggleActive(profile)} className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-50">
                        {profile.is_active ? "Désactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Aucun profil disponible.</p>
        )}
      </div>
    </div>
  );
}
*/
