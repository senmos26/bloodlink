"use client";

import { useEffect, useState } from "react";

import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/types/database";

const roles: UserRole[] = ["donor", "center_admin", "super_admin"];

export default function ProfilesPageContent() {
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

        const { data, error: profilesError } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
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
    const { data, error: fetchError } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
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
      const { error: updateError } = await supabase.from("profiles").update({ role }).eq("id", profile.id);
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
      const { error: updateError } = await supabase.from("profiles").update({ is_active: !profile.is_active }).eq("id", profile.id);
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
        <p className="mt-2 text-sm text-slate-500">Gérez les rôles et l&apos;activation des profils.</p>
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
