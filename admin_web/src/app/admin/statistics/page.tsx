export { default } from "@/components/admin-pages/StatisticsDashboard";

/*
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AdminContext } from "@/types/database";

export const dynamic = "force-dynamic";

interface Statistics {
  activeAlerts: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingDonations: number;
  validatedDonations: number;
  rejectedDonations: number;
  activeCenters?: number;
  totalDonors?: number;
}
* /

"use client";

import { useEffect, useMemo, useState } from "react";

import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Alert, Appointment, Center, Donation, Profile } from "@/types/database";

export default function StatisticsPage() {
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

          const profilesRes =
            donorIds.length > 0
              ? await supabase.from("profiles").select("*").in("id", donorIds)
              : { data: [], error: null };

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
        <p className="mt-2 text-sm text-slate-500">
          {context?.role === "center_admin" ? "Vue dédiée à votre centre." : "Vue globale du réseau BloodLink."}
        </p>
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
* /
/*
export default function StatisticsPage() {
  const router = useRouter();
  const [context, setContext] = useState<AdminContext | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const adminContext = await getCurrentAdminContext();

        if (!adminContext) {
          router.push("/login");
          return;
        }

        setContext(adminContext);

        if (adminContext.role === "center_admin" && adminContext.center) {
          // Center admin stats
          const [alertsRes, appointmentsRes, donationsRes] = await Promise.all([
            supabaseClient
              .from("alerts")
              .select("id, status")
              .eq("center_id", adminContext.center.id),
            supabaseClient
              .from("appointments")
              .select("id, status")
              .eq("center_id", adminContext.center.id),
            supabaseClient
              .from("donations")
              .select("id, status")
              .eq("center_id", adminContext.center.id),
          ]);

          const alerts = alertsRes.data || [];
          const appointments = appointmentsRes.data || [];
          const donations = donationsRes.data || [];

          setStats({
            activeAlerts: Array.isArray(alerts)
              ? alerts.filter((a: any) => a.status === "active").length
              : 0,
            pendingAppointments: Array.isArray(appointments)
              ? appointments.filter((a: any) => a.status === "pending").length
              : 0,
            completedAppointments: Array.isArray(appointments)
              ? appointments.filter((a: any) => a.status === "completed").length
              : 0,
            cancelledAppointments: Array.isArray(appointments)
              ? appointments.filter((a: any) => a.status === "cancelled").length
              : 0,
            pendingDonations: Array.isArray(donations)
              ? donations.filter((d: any) => d.status === "pending").length
              : 0,
            validatedDonations: Array.isArray(donations)
              ? donations.filter((d: any) => d.status === "validated").length
              : 0,
            rejectedDonations: Array.isArray(donations)
              ? donations.filter((d: any) => d.status === "rejected").length
              : 0,
          });
        } else if (adminContext.role === "super_admin") {
          // Global stats
          const [
            centersRes,
            alertsRes,
            appointmentsRes,
            donationsRes,
            donorsRes,
          ] = await Promise.all([
            supabaseClient.from("centers").select("id").eq("is_active", true),
            supabaseClient.from("alerts").select("id, status"),
            supabaseClient.from("appointments").select("id, status"),
            supabaseClient.from("donations").select("id, status"),
            supabaseClient.from("profiles").select("id").eq("role", "donor"),
          ]);

          const alerts = alertsRes.data || [];
          const appointments = appointmentsRes.data || [];
          const donations = donationsRes.data || [];

          setStats({
            activeAlerts: Array.isArray(alerts)
              ? alerts.filter((a: any) => a.status === "active").length
              : 0,
            pendingAppointments: Array.isArray(appointments)
              ? appointments.filter((a: any) => a.status === "pending").length
              : 0,
            completedAppointments: Array.isArray(appointments)
              ? appointments.filter((a: any) => a.status === "completed").length
              : 0,
            cancelledAppointments: Array.isArray(appointments)
              ? appointments.filter((a: any) => a.status === "cancelled").length
              : 0,
            pendingDonations: Array.isArray(donations)
              ? donations.filter((d: any) => d.status === "pending").length
              : 0,
            validatedDonations: Array.isArray(donations)
              ? donations.filter((d: any) => d.status === "validated").length
              : 0,
            rejectedDonations: Array.isArray(donations)
              ? donations.filter((d: any) => d.status === "rejected").length
              : 0,
            activeCenters: (centersRes.data || []).length,
            totalDonors: (donorsRes.data || []).length,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des statistiques"
        );
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [router]);

  if (loading) {
    return <div className="text-gray-600">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-600">Erreur: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Statistiques</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Alertes actives" value={stats?.activeAlerts || 0} />
        <StatCard
          title="Rendez-vous en attente"
          value={stats?.pendingAppointments || 0}
        />
        <StatCard
          title="Rendez-vous complétés"
          value={stats?.completedAppointments || 0}
        />
        <StatCard
          title="Rendez-vous annulés"
          value={stats?.cancelledAppointments || 0}
        />
        <StatCard
          title="Dons en attente"
          value={stats?.pendingDonations || 0}
        />
        <StatCard title="Dons validés" value={stats?.validatedDonations || 0} />
        <StatCard title="Dons rejetés" value={stats?.rejectedDonations || 0} />

        {context?.role === "super_admin" && (
          <>
            <StatCard
              title="Centres actifs"
              value={stats?.activeCenters || 0}
            />
            <StatCard title="Total donneurs" value={stats?.totalDonors || 0} />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
*/
