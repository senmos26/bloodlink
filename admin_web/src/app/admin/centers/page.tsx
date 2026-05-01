export { default } from "@/components/admin-pages/CentersPageManual";

/*
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AdminContext, Center } from "@/types/database";

export const dynamic = "force-dynamic";

export default function CentersPage() {
  const router = useRouter();
  const [context, setContext] = useState<AdminContext | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<
    { id: string; full_name: string | null; email: string | null }[]
  >([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    const loadCenters = async () => {
      try {
        const adminContext = await getCurrentAdminContext();

        if (!adminContext) {
          router.push("/login");
          return;
        }

        // Only super_admin can see this page
        if (adminContext.role !== "super_admin") {
          router.push("/admin/dashboard");
          return;
        }

        setContext(adminContext);

        const [centersResponse, profilesResponse] = await Promise.all([
          supabaseClient.from("centers").select("*"),
          supabaseClient
            .from("profiles")
            .select("id, full_name, email")
            .eq("role", "center_admin")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
        ]);

        if (centersResponse.error) throw centersResponse.error;
        if (profilesResponse.error) throw profilesResponse.error;

        setCenters(centersResponse.data || []);
        setAdminProfiles(profilesResponse.data || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des centres"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCenters();
  }, [router]);

  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error: err } = await supabaseClient
        .from("centers")
        .insert({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          latitude: parseFloat(formData.latitude.toString()),
          longitude: parseFloat(formData.longitude.toString()),
          is_active: true,
          admin_id: selectedAdminId,
        })
        .select();

      if (err) throw err;

      if (data) {
        setCenters([...centers, ...data]);
        setShowForm(false);
        setSelectedAdminId(null);
        setFormData({
          name: "",
          address: "",
          city: "",
          phone: "",
          email: "",
          latitude: 0,
          longitude: 0,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du centre"
      );
    }
  };

  const toggleCenterActive = async (centerId: string, isActive: boolean) => {
    try {
      const { error: err } = await supabaseClient
        .from("centers")
        .update({ is_active: !isActive })
        .eq("id", centerId);

      if (err) throw err;

      setCenters(
        centers.map((center) =>
          center.id === centerId
            ? { ...center, is_active: !center.is_active }
            : center
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour"
      );
    }
  };

  if (loading) {
    return <div className="text-gray-600">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-600">Erreur: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Centres</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Annuler" : "Nouveau centre"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Créer un nouveau centre</h2>
          <form onSubmit={handleCreateCenter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Administrateur du centre
                </label>
                <select
                  value={selectedAdminId ?? ""}
                  onChange={(e) => setSelectedAdminId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun administrateur associé</option>
                  {adminProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: parseFloat(e.target.value),
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: parseFloat(e.target.value),
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Créer le centre
            </button>
          </form>
        </div>
      )}

      <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-700">
        <p className="font-semibold">Instructions</p>
        <p>
          Créez un centre depuis cette page, puis associez un administrateur
          existant avec le rôle <strong>center_admin</strong> si nécessaire.
        </p>
        <p>
          Si un administrateur de centre n&apos;a pas encore été créé, ajoutez
          d&apos;abord un profil center_admin via la base Supabase ou le
          processus de création administrateur.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {Array.isArray(centers) && centers.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {centers.map((center) => (
                <tr key={center.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {center.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {center.city}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {center.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {center.email}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        center.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {center.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() =>
                        toggleCenterActive(center.id, center.is_active)
                      }
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {center.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-center text-gray-600">Aucun centre trouvé</p>
        )}
      </div>
    </div>
  );
}
* /

"use client";

import { useEffect, useState } from "react";

import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Center, Profile } from "@/types/database";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  latitude: "",
  longitude: "",
  admin_id: "",
  is_active: true,
};

/*
export default function CentersPage() {
  const [context, setContext] = useState<AdminContext | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCenters() {
      try {
        const adminContext = await getCurrentAdminContext();

        if (adminContext.role !== "super_admin") {
          throw new Error("Accès réservé aux super administrateurs.");
        }

        const [centersRes, adminsRes] = await Promise.all([
          supabase.from("centers").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("*").eq("role", "center_admin").order("full_name", { ascending: true }),
        ]);

        if (centersRes.error) throw centersRes.error;
        if (adminsRes.error) throw adminsRes.error;
        if (!active) return;

        setContext(adminContext);
        setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
        setAdmins(Array.isArray(adminsRes.data) ? (adminsRes.data as Profile[]) : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Chargement des centres impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCenters();

    return () => {
      active = false;
    };
  }, []);

  async function refreshCenters() {
    const { data, error: fetchError } = await supabase
      .from("centers")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;
    setCenters(Array.isArray(data) ? (data as Center[]) : []);
  }

  function fillForm(center?: Center) {
    if (!center) {
      setEditingCenterId(null);
      setForm(emptyForm);
      return;
    }

    setEditingCenterId(center.id);
    setForm({
      name: center.name,
      address: center.address,
      city: center.city,
      phone: center.phone,
      email: center.email,
      latitude: String(center.latitude),
      longitude: String(center.longitude),
      admin_id: center.admin_id ?? "",
      is_active: center.is_active,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      address: form.address,
      city: form.city,
      phone: form.phone,
      email: form.email,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      admin_id: form.admin_id || null,
      is_active: form.is_active,
    };

    try {
      if (editingCenterId) {
        const { error: updateError } = await supabase.from("centers").update(payload).eq("id", editingCenterId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("centers").insert(payload);
        if (insertError) throw insertError;
      }

      await refreshCenters();
      fillForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(center: Center) {
    try {
      const { error: updateError } = await supabase
        .from("centers")
        .update({ is_active: !center.is_active })
        .eq("id", center.id);

      if (updateError) throw updateError;
      await refreshCenters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  }

  const adminMap = new Map(admins.map((item) => [item.id, item.full_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Centres de santé</h1>
        <p className="mt-2 text-sm text-slate-500">Créez, modifiez et activez les centres BloodLink.</p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Créez d'abord l'utilisateur dans Supabase Auth, puis changez son rôle en center_admin.
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">{editingCenterId ? "Modifier le centre" : "Nouveau centre"}</h2>
          {editingCenterId ? <button type="button" onClick={() => fillForm()} className="text-sm text-slate-500 underline">Annuler l'édition</button> : null}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["name", "Nom"],
            ["address", "Adresse"],
            ["city", "Ville"],
            ["phone", "Téléphone"],
            ["email", "Email"],
            ["latitude", "Latitude"],
            ["longitude", "Longitude"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm text-slate-700">
              <span className="mb-2 block font-medium">{label}</span>
              <input
                value={form[key as keyof typeof form] as string}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400"
                required={key !== "latitude" && key !== "longitude" ? true : false}
              />
            </label>
          ))}
          <label className="text-sm text-slate-700">
            <span className="mb-2 block font-medium">Administrateur du centre</span>
            <select value={form.admin_id} onChange={(event) => setForm((current) => ({ ...current, admin_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400">
              <option value="">Aucun administrateur</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>{admin.full_name}</option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" disabled={saving || loading} className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-70">
          {saving ? "Enregistrement..." : editingCenterId ? "Mettre à jour" : "Créer le centre"}
        </button>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : Array.isArray(centers) && centers.length > 0 ? (
          <div className="space-y-4">
            {centers.map((center) => (
              <div key={center.id} className="rounded-2xl border border-slate-200 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{center.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{center.address}, {center.city}</p>
                    <p className="mt-1 text-sm text-slate-500">{center.phone} • {center.email}</p>
                    <p className="mt-1 text-sm text-slate-500">Admin: {center.admin_id ? adminMap.get(center.admin_id) ?? center.admin_id : "Aucun"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${center.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {center.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => fillForm(center)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Modifier</button>
                  <button type="button" onClick={() => handleToggleActive(center)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                    {center.is_active ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Aucun centre disponible.</p>
        )}
      </div>
    </div>
  );
}
*/
