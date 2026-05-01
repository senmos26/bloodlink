"use client";

import { useEffect, useState } from "react";

import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { AlertStatus, AlertWithCenter, BloodType, Center, UrgencyLevel } from "@/types/database";

const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencyLevels: UrgencyLevel[] = ["low", "medium", "high", "critical"];
const alertStatuses: AlertStatus[] = ["active", "expired", "closed"];

export default function AlertsPageContent() {
  const [context, setContext] = useState<AdminContext | null>(null);
  const [alerts, setAlerts] = useState<AlertWithCenter[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    center_id: "",
    blood_type_required: "O+" as BloodType,
    urgency_level: "medium" as UrgencyLevel,
    radius_km: "20",
    message: "",
    deadline: "",
    status: "active" as AlertStatus,
  });

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const adminContext = await getCurrentAdminContext();
        const centerId = adminContext.role === "center_admin" ? adminContext.center?.id : null;
        const alertsQuery = centerId
          ? supabase.from("alerts_with_center").select("*").eq("center_id", centerId)
          : supabase.from("alerts_with_center").select("*");

        const [alertsRes, centersRes] = await Promise.all([
          alertsQuery.order("created_at", { ascending: false }),
          adminContext.role === "super_admin"
            ? supabase.from("centers").select("*").order("name", { ascending: true })
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (alertsRes.error) throw alertsRes.error;
        if (centersRes.error) throw centersRes.error;
        if (!active) return;

        setContext(adminContext);
        setAlerts(Array.isArray(alertsRes.data) ? (alertsRes.data as AlertWithCenter[]) : []);
        setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
        setForm((current) => ({ ...current, center_id: centerId ?? current.center_id }));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Chargement des alertes impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, []);

  async function refreshAlerts(currentContext: AdminContext) {
    const query =
      currentContext.role === "center_admin" && currentContext.center
        ? supabase.from("alerts_with_center").select("*").eq("center_id", currentContext.center.id)
        : supabase.from("alerts_with_center").select("*");

    const { data, error: fetchError } = await query.order("created_at", { ascending: false });
    if (fetchError) throw fetchError;
    setAlerts(Array.isArray(data) ? (data as AlertWithCenter[]) : []);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!context) return;

    const centerId = context.role === "center_admin" ? context.center?.id : form.center_id;
    if (!centerId) {
      setError("Veuillez sélectionner un centre.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("alerts").insert({
        center_id: centerId,
        blood_type_required: form.blood_type_required,
        urgency_level: form.urgency_level,
        radius_km: Number(form.radius_km),
        message: form.message || null,
        deadline: new Date(form.deadline).toISOString(),
        status: form.status,
      });

      if (insertError) throw insertError;

      await refreshAlerts(context);
      setForm({
        center_id: context.role === "center_admin" ? context.center?.id ?? "" : "",
        blood_type_required: "O+",
        urgency_level: "medium",
        radius_km: "20",
        message: "",
        deadline: "",
        status: "active",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(alertId: string) {
    if (!context) return;

    try {
      const { error: deleteError } = await supabase.from("alerts").delete().eq("id", alertId);
      if (deleteError) throw deleteError;
      await refreshAlerts(context);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  async function handleClose(alertId: string) {
    if (!context) return;

    try {
      const { error: updateError } = await supabase.from("alerts").update({ status: "closed" }).eq("id", alertId);
      if (updateError) throw updateError;
      await refreshAlerts(context);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      [
        alert.center_name,
        alert.center_city,
        alert.blood_type_required,
        alert.message ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesUrgency = urgencyFilter === "all" || alert.urgency_level === urgencyFilter;
    return matchesQuery && matchesUrgency;
  });

  const isCenterAdmin = context?.role === "center_admin" && !!context.center;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Alertes d&apos;urgence</h1>
          {isCenterAdmin ? (
            <p className="mt-3 text-sm text-slate-600">
              Centre associé : {context?.center?.name ?? "Centre inconnu"} — {context?.center?.city ?? "Ville inconnue"}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-slate-500">Gérer les besoins urgents en sang.</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="min-w-72 text-sm text-slate-600">
            <span className="mb-2 block font-medium">Recherche</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Centre, ville, groupe ou message"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-red-400"
            />
          </label>
          <label className="min-w-48 text-sm text-slate-600">
            <span className="mb-2 block font-medium">Urgence</span>
            <select
              value={urgencyFilter}
              onChange={(event) => setUrgencyFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-red-400"
            >
              <option value="all">Toutes</option>
              {urgencyLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={handleCreate} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Nouvelle alerte</h2>
            <p className="mt-1 text-sm text-slate-500">Créer ou clôturer rapidement les besoins urgents.</p>
          </div>
          <button type="submit" disabled={submitting || loading} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-70">
            {submitting ? "Création..." : "+ Nouvelle alerte"}
          </button>
        </div>

        {isCenterAdmin ? (
          <p className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Cette alerte sera automatiquement liée à votre centre.
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {context?.role === "super_admin" ? (
            <label className="text-sm text-slate-700">
              <span className="mb-2 block font-medium">Centre</span>
              <select
                value={form.center_id}
                onChange={(event) => setForm((current) => ({ ...current, center_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400"
                required
              >
                <option value="">Sélectionnez un centre</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>{center.name} - {center.city}</option>
                ))}
              </select>
            </label>
          ) : null}
          <SelectField label="Groupe sanguin" value={form.blood_type_required} onChange={(value) => setForm((current) => ({ ...current, blood_type_required: value as BloodType }))} options={bloodTypes} />
          <SelectField label="Urgence" value={form.urgency_level} onChange={(value) => setForm((current) => ({ ...current, urgency_level: value as UrgencyLevel }))} options={urgencyLevels} />
          <label className="text-sm text-slate-700">
            <span className="mb-2 block font-medium">Rayon (km)</span>
            <input type="number" min="1" value={form.radius_km} onChange={(event) => setForm((current) => ({ ...current, radius_km: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400" required />
          </label>
          <label className="text-sm text-slate-700">
            <span className="mb-2 block font-medium">Échéance</span>
            <input type="datetime-local" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400" required />
          </label>
          <SelectField label="Statut" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value as AlertStatus }))} options={alertStatuses} />
        </div>
        <label className="mt-4 block text-sm text-slate-700">
          <span className="mb-2 block font-medium">Message</span>
          <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400" placeholder="Message optionnel pour les donneurs" />
        </label>
      </form>

      <div>
        {loading ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">Chargement...</p>
        ) : Array.isArray(filteredAlerts) && filteredAlerts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-sm font-semibold text-white">
                      {alert.blood_type_required}
                    </div>
                    <p className="text-lg font-semibold text-slate-900">{alert.center_name || context?.center?.name || alert.center_id}</p>
                    <p className="mt-1 text-sm text-slate-500">{alert.center_city || "Ville indisponible"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${urgencyBadgeClassName(alert.urgency_level)}`}>
                      {alert.urgency_level}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${statusBadgeClassName(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-700">{alert.message || "Aucun message ajouté."}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-wide text-slate-500">
                  <span>Rayon: {alert.radius_km} km</span>
                  <span>Échéance: {new Date(alert.deadline).toLocaleString("fr-FR")}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {alert.status === "active" ? <button type="button" onClick={() => handleClose(alert.id)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Clôturer</button> : null}
                  <button type="button" onClick={() => handleDelete(alert.id)} className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            {isCenterAdmin ? "Aucune alerte pour ce centre." : "Aucune alerte disponible."}
          </p>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-slate-700">
      <span className="mb-2 block font-medium">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function urgencyBadgeClassName(level: UrgencyLevel) {
  switch (level) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "medium":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function statusBadgeClassName(status: AlertStatus) {
  return status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600";
}
