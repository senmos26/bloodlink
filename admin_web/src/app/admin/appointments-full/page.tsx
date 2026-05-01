"use client";

import { useEffect, useState } from "react";

import { getCurrentAdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { AppointmentFull } from "@/types/database";

export default function AppointmentsFullPage() {
  const [appointments, setAppointments] = useState<AppointmentFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const context = await getCurrentAdminContext();
        const query =
          context.role === "center_admin" && context.center
            ? supabase.from("appointments_full").select("*").eq("center_name", context.center.name)
            : supabase.from("appointments_full").select("*");

        const { data, error: fetchError } = await query.order("scheduled_date", { ascending: false });
        if (fetchError) throw fetchError;
        if (!active) return;

        setAppointments(Array.isArray(data) ? (data as AppointmentFull[]) : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Chargement impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Rendez-vous détaillés</h1>
        <p className="mt-2 text-sm text-slate-500">Vue en lecture seule depuis la vue appointments_full.</p>
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
                    <p className="text-lg font-semibold text-slate-900">{new Date(appointment.scheduled_date).toLocaleString("fr-FR")}</p>
                    <p className="mt-1 text-sm text-slate-500">{appointment.center_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{appointment.center_address}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                    {appointment.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <p>Donneur: {appointment.donor_name}</p>
                  <p>Groupe sanguin: {appointment.donor_blood_type ?? "Non renseigné"}</p>
                  <p>Téléphone donneur: {appointment.donor_phone}</p>
                  <p>Téléphone centre: {appointment.center_phone}</p>
                  <p className="md:col-span-2">Notes: {appointment.notes || "Aucune note"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Aucun rendez-vous détaillé disponible.</p>
        )}
      </div>
    </div>
  );
}
