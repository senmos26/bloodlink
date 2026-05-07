"use client";

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

function getStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "pending":
      return "En attente";
    case "confirmed":
      return "Confirme";
    case "completed":
      return "Termine";
    case "cancelled":
      return "Annule";
    default:
      return status;
  }
}

function getStatusBadgeClassName(status: AppointmentStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "confirmed":
      return "bg-sky-100 text-sky-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AppointmentsPageActions() {
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

        const { data, error: appointmentsError } = await query.order("scheduled_date", {
          ascending: false,
        });
        if (appointmentsError) throw appointmentsError;

        const rows = Array.isArray(data) ? (data as Appointment[]) : [];
        const donorIds = Array.from(new Set(rows.map((item) => item.donor_id)));
        const centerIds = Array.from(new Set(rows.map((item) => item.center_id)));

        const [profilesRes, centersRes] = await Promise.all([
          donorIds.length > 0
            ? supabase.from("profiles").select("*").in("id", donorIds)
            : Promise.resolve({ data: [], error: null }),
          centerIds.length > 0
            ? supabase.from("centers").select("*").in("id", centerIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (centersRes.error) throw centersRes.error;
        if (!active) return;

        setAppointments(rows);
        setProfiles(Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : []);
        setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Chargement des rendez-vous impossible.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      active = false;
    };
  }, []);

  const profileMap = new Map(profiles.map((item) => [item.id, item]));
  const centerMap = new Map(centers.map((item) => [item.id, item.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Supervision des Rendez-vous</h1>
        <p className="mt-2 text-sm text-slate-500">Vue d&apos;ensemble de tous les rendez-vous pris sur la plateforme.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : Array.isArray(appointments) && appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const donor = profileMap.get(appointment.donor_id);
              const centerName = centerMap.get(appointment.center_id) ?? appointment.center_id;

              return (
                <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{formatDateTime(appointment.scheduled_date)}</p>
                      <p className="mt-1 text-sm text-slate-500">Donneur: {donor?.full_name ?? appointment.donor_id}</p>
                      <p className="mt-1 text-sm text-slate-500">Groupe sanguin: {donor?.blood_type ?? "Indisponible"}</p>
                      <p className="mt-1 text-sm text-slate-500">Telephone: {donor?.phone || "Indisponible"}</p>
                      <p className="mt-1 text-sm text-slate-500">Centre: {centerName}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${getStatusBadgeClassName(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-700">{appointment.notes || "Aucune note pour ce rendez-vous."}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
             Aucun rendez-vous disponible.
          </p>
        )}
      </div>
    </div>
  );
}
