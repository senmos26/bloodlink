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

const emptyCreateAccountForm = {
  responsibleFullName: "",
  responsibleEmail: "",
  responsiblePhone: "",
  temporaryPassword: "",
  centerName: "",
  centerAddress: "",
  centerCity: "",
  centerPhone: "",
  centerEmail: "",
  latitude: "",
  longitude: "",
};

export default function CentersPageWithAccountCreation() {
  const [context, setContext] = useState<AdminContext | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [createAccountForm, setCreateAccountForm] = useState(emptyCreateAccountForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const adminContext = await getCurrentAdminContext();

        if (adminContext.role !== "super_admin") {
          throw new Error("Acces reserve aux super administrateurs.");
        }

        const [centersRes, adminsRes] = await Promise.all([
          supabase.from("centers").select("*").order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("*")
            .eq("role", "center_admin")
            .order("full_name", { ascending: true }),
        ]);

        if (centersRes.error) throw centersRes.error;
        if (adminsRes.error) throw adminsRes.error;
        if (!active) return;

        setContext(adminContext);
        setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
        setAdmins(Array.isArray(adminsRes.data) ? (adminsRes.data as Profile[]) : []);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Chargement des centres impossible.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  async function refreshData() {
    const [centersRes, adminsRes] = await Promise.all([
      supabase.from("centers").select("*").order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "center_admin")
        .order("full_name", { ascending: true }),
    ]);

    if (centersRes.error) throw centersRes.error;
    if (adminsRes.error) throw adminsRes.error;

    setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
    setAdmins(Array.isArray(adminsRes.data) ? (adminsRes.data as Profile[]) : []);
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
    setSuccessMessage(null);

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
        const { error: updateError } = await supabase
          .from("centers")
          .update(payload)
          .eq("id", editingCenterId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("centers").insert(payload);
        if (insertError) throw insertError;
      }

      await refreshData();
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
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise a jour impossible.");
    }
  }

  async function handleCreateCenterAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingAccount(true);
    setCreateAccountError(null);
    setSuccessMessage(null);

    try {
      if (context?.role !== "super_admin") {
        throw new Error("Acces reserve aux super administrateurs.");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) throw new Error("Session introuvable.");

      const payload = {
        responsibleFullName: createAccountForm.responsibleFullName.trim(),
        responsibleEmail: createAccountForm.responsibleEmail.trim(),
        responsiblePhone: createAccountForm.responsiblePhone.trim(),
        temporaryPassword: createAccountForm.temporaryPassword,
        centerName: createAccountForm.centerName.trim(),
        centerAddress: createAccountForm.centerAddress.trim(),
        centerCity: createAccountForm.centerCity.trim(),
        centerPhone: createAccountForm.centerPhone.trim(),
        centerEmail: createAccountForm.centerEmail.trim(),
        latitude: Number(createAccountForm.latitude),
        longitude: Number(createAccountForm.longitude),
      };

      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-center-account",
        {
          body: payload,
        },
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data?.success) {
        throw new Error("La creation du compte centre a echoue.");
      }

      setCreateAccountForm(emptyCreateAccountForm);
      setSuccessMessage("Compte centre cree avec succes.");
      await refreshData();
    } catch (err) {
      setCreateAccountError(
        err instanceof Error ? err.message : "Creation du compte centre impossible.",
      );
    } finally {
      setCreatingAccount(false);
    }
  }

  const adminMap = new Map(admins.map((item) => [item.id, item.full_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Centres de sante</h1>
        <p className="mt-2 text-sm text-slate-500">
          Creez, modifiez et activez les centres BloodLink.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Une ville peut contenir plusieurs centres. Le responsable est lie a un centre
        precis, pas seulement a une ville.
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {createAccountError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {createAccountError}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {context?.role === "super_admin" ? (
        <form
          onSubmit={handleCreateCenterAccount}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Creer un compte centre</h2>
            <p className="mt-1 text-sm text-slate-500">
              Creez le responsable et le centre en une seule action securisee.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Le responsable devra changer son mot de passe apres la premiere connexion.
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ["responsibleFullName", "Nom responsable", "text"],
              ["responsibleEmail", "Email responsable", "email"],
              ["responsiblePhone", "Telephone responsable", "tel"],
              ["temporaryPassword", "Mot de passe temporaire", "password"],
              ["centerName", "Nom du centre", "text"],
              ["centerAddress", "Adresse du centre", "text"],
              ["centerCity", "Ville", "text"],
              ["centerPhone", "Telephone du centre", "tel"],
              ["centerEmail", "Email du centre", "email"],
              ["latitude", "Latitude", "number"],
              ["longitude", "Longitude", "number"],
            ].map(([key, label, type]) => (
              <label key={key} className="text-sm text-slate-700">
                <span className="mb-2 block font-medium">{label}</span>
                <input
                  type={type}
                  step={key === "latitude" || key === "longitude" ? "any" : undefined}
                  value={createAccountForm[key as keyof typeof createAccountForm]}
                  onChange={(event) =>
                    setCreateAccountForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400"
                  required
                  autoComplete={key === "temporaryPassword" ? "new-password" : undefined}
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={creatingAccount || loading}
            className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-70"
          >
            {creatingAccount ? "Creation..." : "Creer le compte centre"}
          </button>
        </form>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">
            {editingCenterId ? "Modifier le centre" : "Nouveau centre"}
          </h2>
          {editingCenterId ? (
            <button
              type="button"
              onClick={() => fillForm()}
              className="text-sm text-slate-500 underline"
            >
              Annuler l&apos;edition
            </button>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Workflow manuel conserve : vous pouvez toujours creer ou modifier un
          centre puis lui assigner un compte <strong>center_admin</strong> existant.
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["name", "Nom"],
            ["address", "Adresse"],
            ["city", "Ville"],
            ["phone", "Telephone"],
            ["email", "Email"],
            ["latitude", "Latitude"],
            ["longitude", "Longitude"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm text-slate-700">
              <span className="mb-2 block font-medium">{label}</span>
              <input
                value={form[key as keyof typeof form] as string}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400"
                required={key !== "latitude" && key !== "longitude"}
              />
            </label>
          ))}

          <label className="text-sm text-slate-700">
            <span className="mb-2 block font-medium">Responsable du centre</span>
            <select
              value={form.admin_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, admin_id: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400"
            >
              <option value="">Aucun responsable</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.full_name} - {admin.phone || "Telephone indisponible"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-70"
        >
          {saving ? "Enregistrement..." : editingCenterId ? "Mettre a jour" : "Creer le centre"}
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
                    <p className="mt-1 text-sm text-slate-500">
                      {center.address}, {center.city}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {center.phone} • {center.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Responsable:{" "}
                      {center.admin_id ? adminMap.get(center.admin_id) ?? center.admin_id : "Aucun"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                      Center ID: {center.id}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                      center.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {center.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fillForm(center)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(center)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    {center.is_active ? "Desactiver" : "Activer"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Aucun centre disponible.
          </p>
        )}
      </div>
    </div>
  );
}
