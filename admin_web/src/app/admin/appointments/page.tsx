export { default } from "@/components/admin-pages/AppointmentsPageActions";
/*

import { useEffect, useState } from "react";

import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Appointment, AppointmentStatus, Center, Profile } from "@/types/database";

const appointmentStatuses: AppointmentStatus[] = ["pending", "confirmed", "cancelled", "completed"];

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Date indisponible";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date indisponible" : date.toLocaleString("fr-FR");
}


export default function AppointmentsPage() {
  const [context, setContext] = useState<AdminContext | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAppointments() {
      try {
        const adminContext = await getCurrentAdminContext();
        const query =
          adminContext.role === "center_admin" && adminContext.center
            ? supabase.from("appointments").select("*").eq("center_id", adminContext.center.id)
            : supabase.from("appointments").select("*");

        const { data, error: appointmentsError } = await query.order("scheduled_date", { ascending: false });
        if (appointmentsError) throw appointmentsError;

        const rows = Array.isArray(data) ? (data as Appointment[]) : [];
        const donorIds = Array.from(new Set(rows.map((item) => item.donor_id)));
        const centerIds = Array.from(new Set(rows.map((item) => item.center_id)));

        const [profilesRes, centersRes] = await Promise.all([
          donorIds.length > 0 ? supabase.from("profiles").select("*").in("id", donorIds) : Promise.resolve({ data: [], error: null }),
          centerIds.length > 0 ? supabase.from("centers").select("*").in("id", centerIds) : Promise.resolve({ data: [], error: null }),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (centersRes.error) throw centersRes.error;
        if (!active) return;

        setContext(adminContext);
        setAppointments(rows);
        setProfiles(Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : []);
        setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Chargement des rendez-vous impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAppointments();

    return () => {
      active = false;
    };
  }, []);

  async function refreshAppointments(currentContext: AdminContext) {
    const query =
      currentContext.role === "center_admin" && currentContext.center
        ? supabase.from("appointments").select("*").eq("center_id", currentContext.center.id)
        : supabase.from("appointments").select("*");

    const { data, error: fetchError } = await query.order("scheduled_date", { ascending: false });
    if (fetchError) throw fetchError;
    setAppointments(Array.isArray(data) ? (data as Appointment[]) : []);
  }

  async function handleStatusChange(appointmentId: string, status: AppointmentStatus) {
    if (!context) return;

    try {
      const { error: updateError } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
      if (updateError) throw updateError;
      await refreshAppointments(context);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  }

  const profileMap = new Map(profiles.map((item) => [item.id, item.full_name]));
  const centerMap = new Map(centers.map((item) => [item.id, item.name]));
  const isCenterAdmin = context?.role === "center_admin" && !!context.center;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Rendez-vous</h1>
        {isCenterAdmin ? (
          <p className="mt-3 text-sm text-slate-600">
            Centre associé : {context?.center?.name ?? "Centre inconnu"} — {context?.center?.city ?? "Ville inconnue"}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-500">Suivez et mettez à jour les statuts des rendez-vous.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : Array.isArray(appointments) && appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-slate-200 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{formatDateTime(appointment.scheduled_date)}</p>
                    <p className="mt-1 text-sm text-slate-500">Donneur: {profileMap.get(appointment.donor_id) ?? appointment.donor_id}</p>
                    <p className="mt-1 text-sm text-slate-500">Centre: {centerMap.get(appointment.center_id) ?? appointment.center_id}</p>
                  </div>
                  <div className="min-w-40">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Statut</label>
                    <select value={appointment.status} onChange={(event) => handleStatusChange(appointment.id, event.target.value as AppointmentStatus)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400">
                      {appointmentStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-700">{appointment.notes || "Aucune note pour ce rendez-vous."}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {isCenterAdmin ? "Aucun rendez-vous pour ce centre." : "Aucun rendez-vous disponible."}
          </p>
        )}
      </div>
    </div>
  );
}
*/
