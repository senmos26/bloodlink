"use client";

import { useEffect, useMemo, useState } from "react";

import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Alert, Appointment, Center, Donation, Profile } from "@/types/database";

export default function StatisticsPageContent() {
  const [context, setContext] = useState<AdminContext | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      try {
        const adminContext = await getCurrentAdminContext();

        if (adminContext.role === "center_admin" && adminContext.center) {
          const centerId = adminContext.center.id;
          const [alertsRes, appointmentsRes, donationsRes] = await Promise.all([
            supabase.from("alerts").select("*").eq("center_id", centerId),
            supabase.from("appointments").select("*").eq("center_id", centerId),
            supabase.from("donations").select("*").eq("center_id", centerId),
          ]);

          if (alertsRes.error) throw alertsRes.error;
          if (appointmentsRes.error) throw appointmentsRes.error;
          if (donationsRes.error) throw donationsRes.error;

          const donorIds = Array.from(
            new Set([
              ...(Array.isArray(appointmentsRes.data) ? appointmentsRes.data.map((item) => item.donor_id) : []),
              ...(Array.isArray(donationsRes.data) ? donationsRes.data.map((item) => item.donor_id) : []),
            ])
          );

          const profilesRes = donorIds.length > 0 ? await supabase.from("profiles").select("*").in("id", donorIds) : { data: [], error: null };
          if (profilesRes.error) throw profilesRes.error;
          if (!active) return;

          setContext(adminContext);
          setProfiles(Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : []);
          setAlerts(Array.isArray(alertsRes.data) ? (alertsRes.data as Alert[]) : []);
          setAppointments(Array.isArray(appointmentsRes.data) ? (appointmentsRes.data as Appointment[]) : []);
          setDonations(Array.isArray(donationsRes.data) ? (donationsRes.data as Donation[]) : []);
          setCenters(adminContext.center ? [adminContext.center] : []);
          return;
        }

        const [profilesRes, centersRes, alertsRes, appointmentsRes, donationsRes] = await Promise.all([
          supabase.from("profiles").select("*"),
          supabase.from("centers").select("*"),
          supabase.from("alerts").select("*"),
          supabase.from("appointments").select("*"),
          supabase.from("donations").select("*"),
        ]);

        for (const result of [profilesRes, centersRes, alertsRes, appointmentsRes, donationsRes]) {
          if (result.error) throw result.error;
        }

        if (!active) return;

        setContext(adminContext);
        setProfiles(Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : []);
        setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
        setAlerts(Array.isArray(alertsRes.data) ? (alertsRes.data as Alert[]) : []);
        setAppointments(Array.isArray(appointmentsRes.data) ? (appointmentsRes.data as Appointment[]) : []);
        setDonations(Array.isArray(donationsRes.data) ? (donationsRes.data as Donation[]) : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Chargement des statistiques impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStatistics();

    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(() => {
    const donorCount = profiles.filter((item) => item.role === "donor").length || new Set([...appointments.map((item) => item.donor_id), ...donations.map((item) => item.donor_id)]).size;
    return [
      { label: "Total donneurs", value: donorCount },
      { label: "Total centres", value: centers.length },
      { label: "Centres actifs", value: centers.filter((item) => item.is_active).length },
      { label: "Alertes actives", value: alerts.filter((item) => item.status === "active").length },
      { label: "Alertes critiques", value: alerts.filter((item) => item.urgency_level === "critical").length },
      { label: "RDV en attente", value: appointments.filter((item) => item.status === "pending").length },
      { label: "RDV confirmés", value: appointments.filter((item) => item.status === "confirmed").length },
      { label: "RDV complétés", value: appointments.filter((item) => item.status === "completed").length },
      { label: "Dons validés", value: donations.filter((item) => item.status === "validated").length },
      { label: "Dons rejetés", value: donations.filter((item) => item.status === "rejected").length },
    ];
  }, [alerts, appointments, centers, donations, profiles]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Statistiques</h1>
        {context?.role === "center_admin" && context.center ? (
          <p className="mt-3 text-sm text-slate-600">
            Centre associé : {context.center.name} — {context.center.city}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-500">{context?.role === "center_admin" ? "Vue dédiée à votre centre." : "Vue globale du réseau BloodLink."}</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">Chargement...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
