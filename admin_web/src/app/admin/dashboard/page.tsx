/*
"use client";

import { useEffect, useMemo, useState } from "react";

import { useAdminTheme } from "@/components/AdminThemeContext";
import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Alert, Appointment, BloodType, Donation, Profile } from "@/types/database";

type DashboardState = {
  title: string;
  subtitle: string;
  profiles: Profile[];
  alerts: Alert[];
  appointments: Appointment[];
  donations: Donation[];
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Date indisponible";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date indisponible" : date.toLocaleString("fr-FR");
}

const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const chartColors = ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#38bdf8", "#60a5fa", "#818cf8", "#c4b5fd"];

export default function DashboardPage() {
  const { theme } = useAdminTheme();
  const [context, setContext] = useState<AdminContext | null>(null);
  const [state, setState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const adminContext = await getCurrentAdminContext();

        if (adminContext.role === "center_admin" && adminContext.center) {
          const centerId = adminContext.center.id;
          const [alertsRes, appointmentsRes, donationsRes] = await Promise.all([
            supabase.from("alerts").select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
            supabase.from("appointments").select("*").eq("center_id", centerId).order("scheduled_date", { ascending: false }),
            supabase.from("donations").select("*").eq("center_id", centerId).order("donation_date", { ascending: false }),
          ]);

          if (alertsRes.error) throw alertsRes.error;
          if (appointmentsRes.error) throw appointmentsRes.error;
          if (donationsRes.error) throw donationsRes.error;

          const appointments = Array.isArray(appointmentsRes.data) ? (appointmentsRes.data as Appointment[]) : [];
          const donations = Array.isArray(donationsRes.data) ? (donationsRes.data as Donation[]) : [];
          const donorIds = Array.from(
            new Set(
              [...appointments.map((item) => item.donor_id), ...donations.map((item) => item.donor_id)].filter(Boolean)
            )
          );

          let profiles: Profile[] = [];

          if (donorIds.length > 0) {
            const profilesRes = await supabase.from("profiles").select("*").in("id", donorIds);

            if (profilesRes.error) throw profilesRes.error;
            profiles = Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : [];
          }

          if (!active) return;

          setContext(adminContext);
          setState({
            title: "Espace Centre",
            subtitle: adminContext.center.name,
            profiles,
            alerts: Array.isArray(alertsRes.data) ? (alertsRes.data as Alert[]) : [],
            appointments,
            donations,
          });
          return;
        }

        const [profilesRes, alertsRes, appointmentsRes, donationsRes, centersRes] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("alerts").select("*").order("created_at", { ascending: false }),
          supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }),
          supabase.from("donations").select("*").order("donation_date", { ascending: false }),
          supabase.from("centers").select("id"),
        ]);

        for (const result of [profilesRes, alertsRes, appointmentsRes, donationsRes, centersRes]) {
          if (result.error) throw result.error;
        }

        if (!active) return;

        setContext(adminContext);
        setState({
          title: "Tableau de bord",
          subtitle: `${Array.isArray(centersRes.data) ? centersRes.data.length : 0} centre(s) suivis`,
          profiles: Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : [],
          alerts: Array.isArray(alertsRes.data) ? (alertsRes.data as Alert[]) : [],
          appointments: Array.isArray(appointmentsRes.data) ? (appointmentsRes.data as Appointment[]) : [],
          donations: Array.isArray(donationsRes.data) ? (donationsRes.data as Donation[]) : [],
        });
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Chargement du tableau de bord impossible.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const profiles = Array.isArray(state?.profiles) ? state.profiles : [];
    const alerts = Array.isArray(state?.alerts) ? state.alerts : [];
    const appointments = Array.isArray(state?.appointments) ? state.appointments : [];
    const donations = Array.isArray(state?.donations) ? state.donations : [];
    const donorProfiles = profiles.filter((item) => item.role === "donor");
    const totalDonors = donorProfiles.length > 0
      ? donorProfiles.length
      : new Set([...appointments.map((item) => item.donor_id), ...donations.map((item) => item.donor_id)]).size;
    const today = new Date().toISOString().slice(0, 10);

    return {
      totalDonors,
      activeAlerts: alerts.filter((item) => item.status === "active").length,
      validatedDonations: donations.filter((item) => item.status === "validated").length,
      appointmentsToday: appointments.filter((item) => (item.scheduled_date ?? "").slice(0, 10) === today).length,
    };
  }, [state]);

  const monthlyDonations = useMemo(() => {
    const donations = Array.isArray(state?.donations) ? state.donations : [];
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        label: date.toLocaleDateString("fr-FR", { month: "short" }),
        count: donations.filter((item) => (item.donation_date ?? "").startsWith(key)).length,
      };
    });
  }, [state]);

  const bloodTypeBreakdown = useMemo(() => {
    const profiles = Array.isArray(state?.profiles) ? state.profiles : [];
    const counts = bloodTypes.map((type) => ({
      type,
      count: profiles.filter((item) => item.blood_type === type).length,
    }));
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    let cursor = 0;
    const segments = counts.map((item, index) => {
      const start = total === 0 ? 0 : (cursor / total) * 100;
      cursor += item.count;
      const end = total === 0 ? 100 : (cursor / total) * 100;
      return `${chartColors[index]} ${start}% ${end}%`;
    });

    return {
      counts,
      style: {
        background: total === 0 ? "conic-gradient(#e2e8f0 0% 100%)" : `conic-gradient(${segments.join(", ")})`,
      },
    };
  }, [state]);

  if (loading) return <PageMessage message="Chargement du tableau de bord..." theme={theme} tone="neutral" />;
  if (error) return <PageMessage message={error} theme={theme} tone="error" />;
  if (!state || !context) return <PageMessage message="Aucune donnée disponible." tone="neutral" />;

  const latestAlerts = Array.isArray(state.alerts) ? state.alerts.slice(0, 5) : [];
  const latestAppointments = Array.isArray(state.appointments) ? state.appointments.slice(0, 5) : [];
  const maxMonthlyCount = Math.max(...monthlyDonations.map((item) => item.count), 1);
  const isCenterAdmin = context.role === "center_admin" && !!context.center;
  const heroClasses =
    theme === "dark"
      ? "rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#111827_55%,#1f2937_100%)] px-6 py-8 text-white"
      : "rounded-3xl border border-sky-100 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_40%),linear-gradient(135deg,#dbeafe_0%,#eff6ff_55%,#ffffff_100%)] px-6 py-8 text-slate-900 shadow-sm";
  const sectionClasses =
    theme === "dark"
      ? "rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm"
      : "rounded-3xl border border-sky-100 bg-white p-6 shadow-sm";
  const faintTextClasses =
    theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-8">
      <div className={heroClasses}>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-400">BloodLink</p>
        <h1 className="mt-3 text-3xl font-semibold">{state.title}</h1>
        <p className={`mt-2 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{state.subtitle}</p>
      </div>

      {isCenterAdmin ? (
        <section className={sectionClasses}>
          <h2 className="text-xl font-semibold text-slate-900">Centre associé</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Centre associé :</span>{" "}
              {context.center?.name ?? "Non renseigné"}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Ville :</span>{" "}
              {context.center?.city ?? "Non renseignée"}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Email :</span>{" "}
              {context.center?.email ?? "Non renseigné"}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Téléphone :</span>{" "}
              {context.center?.phone ?? "Non renseigné"}
            </p>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Vous voyez uniquement les données liées à ce centre.
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
            Center ID: {context.center?.id ?? "indisponible"}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Donneurs" theme={theme} value={stats.totalDonors} />
        <StatCard label="Alertes Actives" theme={theme} value={stats.activeAlerts} />
        <StatCard label="Dons Validés" value={stats.validatedDonations} />
        <StatCard label="RDV Aujourd'hui" theme={theme} value={stats.appointmentsToday} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={sectionClasses}>
          <h2 className="text-xl font-semibold">Dons mensuels</h2>
          {monthlyDonations.length > 0 ? (
            <div className="mt-6 flex items-end gap-4">
              {monthlyDonations.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className={`flex h-48 w-full items-end rounded-2xl p-2 ${theme === "dark" ? "bg-slate-800" : "bg-sky-50"}`}>
                    <div
                      className="w-full rounded-xl bg-red-600"
                      style={{ height: `${Math.max((item.count / maxMonthlyCount) * 100, item.count > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{item.count}</p>
                    <p className={`text-xs uppercase tracking-wide ${faintTextClasses}`}>{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun historique de don pour le moment." theme={theme} />
          )}
        </div>

        <div className={sectionClasses}>
          <h2 className="text-xl font-semibold text-slate-900">Répartition des groupes sanguins</h2>
          <div className="mt-6 flex flex-col items-center gap-6">
            <div className="h-48 w-48 rounded-full" style={bloodTypeBreakdown.style} />
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {bloodTypeBreakdown.counts.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                    <span className="font-medium text-slate-700">{item.type}</span>
                  </div>
                  <span className="text-slate-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ListCard
          title="Dernières alertes"
          emptyMessage="Aucune alerte récente."
          items={latestAlerts.map((item) => ({
            id: item.id,
            title: `${item.blood_type_required} • ${item.urgency_level}`,
            subtitle: item.message ?? "Sans message",
            meta: formatDateTime(item.deadline),
          }))}
        />
        <ListCard
          title="Derniers rendez-vous"
          emptyMessage={isCenterAdmin ? "Aucun rendez-vous pour ce centre." : "Aucun rendez-vous récent."}
          items={latestAppointments.map((item) => ({
            id: item.id,
            title: item.status,
            subtitle: item.notes ?? `Donneur: ${item.donor_id}`,
            meta: formatDateTime(item.scheduled_date),
          }))}
        />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  theme = "light",
}: {
  label: string;
  value: number;
  theme?: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ${
        theme === "dark"
          ? "border border-slate-800 bg-slate-900"
          : "border border-sky-100 bg-white"
      }`}
    >
      <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}
*/
export { default } from "@/components/admin-pages/DashboardOverview";
/*

function ListCard({
  title,
  emptyMessage,
  items,
  theme = "light",
}: {
  title: string;
  emptyMessage: string;
  items: { id: string; title: string; subtitle: string; meta: string }[];
  theme?: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-sm ${
        theme === "dark"
          ? "border border-slate-800 bg-slate-900"
          : "border border-sky-100 bg-white"
      }`}
    >
      <h2 className={`text-xl font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{title}</h2>
      {Array.isArray(items) && items.length > 0 ? (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl px-4 py-4 ${
                theme === "dark" ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className={`font-medium ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{item.title}</p>
                <span className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{item.meta}</span>
              </div>
              <p className={`mt-2 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{item.subtitle}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} theme={theme} />
      )}
    </div>
  );
}

function EmptyState({
  message,
  theme = "light",
}: {
  message: string;
  theme?: "light" | "dark";
}) {
  return (
    <p
      className={`mt-6 rounded-2xl px-4 py-6 text-sm ${
        theme === "dark"
          ? "bg-slate-800 text-slate-300"
          : "bg-slate-50 text-slate-500"
      }`}
    >
      {message}
    </p>
  );
}

function PageMessage({
  message,
  tone,
  theme = "light",
}: {
  message: string;
  tone: "neutral" | "error";
  theme?: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-3xl border px-5 py-4 text-sm ${
        tone === "error"
          ? theme === "dark"
            ? "border-red-500/30 bg-red-500/10 text-red-200"
            : "border-red-200 bg-red-50 text-red-700"
          : theme === "dark"
            ? "border-slate-800 bg-slate-900 text-slate-300"
            : "border-sky-100 bg-white text-slate-600"
      }`}
    >
      {message}
    </div>
  );
}
*/
