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

type TrendPoint = {
  label: string;
  value: number;
};

const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const chartColors = ["#ef4444", "#fb7185", "#f97316", "#facc15", "#38bdf8", "#60a5fa", "#818cf8", "#a78bfa"];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date indisponible";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : date.toLocaleString("fr-FR");
}

export default function DashboardOverview() {
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
            supabase
              .from("alerts")
              .select("*")
              .eq("center_id", centerId)
              .order("created_at", { ascending: false }),
            supabase
              .from("appointments")
              .select("*")
              .eq("center_id", centerId)
              .order("scheduled_date", { ascending: false }),
            supabase
              .from("donations")
              .select("*")
              .eq("center_id", centerId)
              .order("donation_date", { ascending: false }),
          ]);

          if (alertsRes.error) throw alertsRes.error;
          if (appointmentsRes.error) throw appointmentsRes.error;
          if (donationsRes.error) throw donationsRes.error;

          const appointments = Array.isArray(appointmentsRes.data)
            ? (appointmentsRes.data as Appointment[])
            : [];
          const donations = Array.isArray(donationsRes.data)
            ? (donationsRes.data as Donation[])
            : [];
          const donorIds = Array.from(
            new Set(
              [...appointments.map((item) => item.donor_id), ...donations.map((item) => item.donor_id)].filter(Boolean)
            )
          );

          let profiles: Profile[] = [];

          if (donorIds.length > 0) {
            const profilesRes = await supabase
              .from("profiles")
              .select("*")
              .in("id", donorIds);

            if (profilesRes.error) throw profilesRes.error;
            profiles = Array.isArray(profilesRes.data)
              ? (profilesRes.data as Profile[])
              : [];
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

        const [profilesRes, alertsRes, appointmentsRes, donationsRes, centersRes] =
          await Promise.all([
            supabase.from("profiles").select("*").order("created_at", { ascending: false }),
            supabase.from("alerts").select("*").order("created_at", { ascending: false }),
            supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }),
            supabase.from("donations").select("*").order("donation_date", { ascending: false }),
            supabase.from("centers").select("id"),
          ]);

        for (const result of [
          profilesRes,
          alertsRes,
          appointmentsRes,
          donationsRes,
          centersRes,
        ]) {
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
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Chargement du tableau de bord impossible."
          );
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

  const dashboardData = useMemo(() => {
    const profiles = Array.isArray(state?.profiles) ? state.profiles : [];
    const alerts = Array.isArray(state?.alerts) ? state.alerts : [];
    const appointments = Array.isArray(state?.appointments) ? state.appointments : [];
    const donations = Array.isArray(state?.donations) ? state.donations : [];
    const donorProfiles = profiles.filter((item) => item.role === "donor");
    const totalDonors =
      donorProfiles.length > 0
        ? donorProfiles.length
        : new Set([
            ...appointments.map((item) => item.donor_id),
            ...donations.map((item) => item.donor_id),
          ]).size;
    const today = new Date().toISOString().slice(0, 10);
    const totalVolume = donations
      .filter((item) => item.status === "validated")
      .reduce((sum, item) => sum + item.volume_ml, 0);

    return {
      profiles,
      alerts,
      appointments,
      donations,
      totalDonors,
      activeAlerts: alerts.filter((item) => item.status === "active").length,
      criticalAlerts: alerts.filter((item) => item.urgency_level === "critical").length,
      validatedDonations: donations.filter((item) => item.status === "validated").length,
      pendingAppointments: appointments.filter((item) => item.status === "pending").length,
      confirmedAppointments: appointments.filter((item) => item.status === "confirmed").length,
      appointmentsToday: appointments.filter(
        (item) => (item.scheduled_date ?? "").slice(0, 10) === today
      ).length,
      totalVolume,
    };
  }, [state]);

  const monthlyDonations = useMemo<TrendPoint[]>(() => {
    const donations = Array.isArray(state?.donations) ? state.donations : [];

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      return {
        label: date.toLocaleDateString("fr-FR", { month: "short" }),
        value: donations.filter((item) => (item.donation_date ?? "").startsWith(key)).length,
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
        background:
          total === 0
            ? "conic-gradient(#e2e8f0 0% 100%)"
            : `conic-gradient(${segments.join(", ")})`,
      },
    };
  }, [state]);

  if (loading) {
    return <PageMessage message="Chargement du tableau de bord..." theme={theme} tone="neutral" />;
  }

  if (error) {
    return <PageMessage message={error} theme={theme} tone="error" />;
  }

  if (!state || !context) {
    return <PageMessage message="Aucune donnée disponible." theme={theme} tone="neutral" />;
  }

  const latestAlerts = state.alerts.slice(0, 5);
  const latestAppointments = state.appointments.slice(0, 5);
  const isCenterAdmin = context.role === "center_admin" && !!context.center;

  const heroClass =
    theme === "dark"
      ? "rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#111827_55%,#1f2937_100%)] p-7 text-white"
      : "rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_35%),linear-gradient(135deg,#f0f9ff_0%,#eff6ff_55%,#ffffff_100%)] p-7 text-slate-950 shadow-sm";
  const panelClass =
    theme === "dark"
      ? "rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm"
      : "rounded-[2rem] border border-sky-100 bg-white p-6 shadow-sm";
  const softSurface = theme === "dark" ? "bg-slate-800" : "bg-slate-50";
  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const faintText = theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-6">
      <section className={heroClass}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-400">
              BloodLink Overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold">{state.title}</h1>
            <p className={`mt-3 max-w-2xl text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
              {state.subtitle}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroMetricCard
              label="Taux validation dons"
              theme={theme}
              value={`${state.donations.length > 0 ? Math.round((dashboardData.validatedDonations / state.donations.length) * 100) : 0}%`}
            />
            <HeroMetricCard
              label="Taux complétion RDV"
              theme={theme}
              value={`${state.appointments.length > 0 ? Math.round((dashboardData.confirmedAppointments / state.appointments.length) * 100) : 0}%`}
            />
            <HeroMetricCard
              label="Dons en attente"
              theme={theme}
              value={String(state.donations.filter((item) => item.status === "pending").length)}
            />
          </div>
        </div>
      </section>

      {isCenterAdmin ? (
        <section className={panelClass}>
          <SectionHeading subtitle="Centre connecté" title="Vue du centre" theme={theme} />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoItem label="Centre associé" theme={theme} value={context.center?.name ?? "Non renseigné"} />
            <InfoItem label="Ville" theme={theme} value={context.center?.city ?? "Non renseignée"} />
            <InfoItem label="Email" theme={theme} value={context.center?.email ?? "Non renseigné"} />
            <InfoItem label="Téléphone" theme={theme} value={context.center?.phone ?? "Non renseigné"} />
          </div>
          <p className={`mt-4 text-sm ${mutedText}`}>
            Vous voyez uniquement les données liées à ce centre.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          helper="base de donneurs"
          label="Total Donneurs"
          theme={theme}
          tone="sky"
          value={dashboardData.totalDonors}
        />
        <StatCard
          helper="surveillance temps réel"
          label="Alertes Actives"
          theme={theme}
          tone="amber"
          value={dashboardData.activeAlerts}
        />
        <StatCard
          helper={`${dashboardData.totalVolume} ml collectés`}
          label="Dons Validés"
          theme={theme}
          tone="red"
          value={dashboardData.validatedDonations}
        />
        <StatCard
          helper="pour aujourd'hui"
          label="RDV Aujourd'hui"
          theme={theme}
          tone="emerald"
          value={dashboardData.appointmentsToday}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={panelClass}>
          <SectionHeading subtitle="Sur 6 derniers mois" title="Dons mensuels" theme={theme} />
          <BarChart bars={monthlyDonations} theme={theme} />
        </div>

        <div className={panelClass}>
          <SectionHeading subtitle="Profils enregistrés" title="Groupes sanguins" theme={theme} />
          <div className="mt-6 flex flex-col items-center gap-6">
            <div className="h-48 w-48 rounded-full" style={bloodTypeBreakdown.style} />
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {bloodTypeBreakdown.counts.map((item, index) => (
                <div
                  key={item.type}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 ${softSurface}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: chartColors[index] }}
                    />
                    <span className={`text-sm font-medium ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
                      {item.type}
                    </span>
                  </div>
                  <span className={`text-sm ${faintText}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className={panelClass}>
          <SectionHeading subtitle="Synthèse rapide" title="Indicateurs métier" theme={theme} />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <MetricTile label="Alertes critiques" theme={theme} value={dashboardData.criticalAlerts} />
            <MetricTile label="RDV en attente" theme={theme} value={dashboardData.pendingAppointments} />
            <MetricTile label="RDV confirmés" theme={theme} value={dashboardData.confirmedAppointments} />
            <MetricTile label="Volume validé" theme={theme} value={`${dashboardData.totalVolume} ml`} />
          </div>
        </div>

        <ListCard
          emptyMessage={isCenterAdmin ? "Aucun rendez-vous pour ce centre." : "Aucun rendez-vous récent."}
          items={latestAppointments.map((item) => ({
            id: item.id,
            title: item.status,
            subtitle: item.notes ?? `Donneur: ${item.donor_id}`,
            meta: formatDateTime(item.scheduled_date),
          }))}
          theme={theme}
          title="Derniers rendez-vous"
        />
      </section>

      <ListCard
        emptyMessage="Aucune alerte récente."
        items={latestAlerts.map((item) => ({
          id: item.id,
          title: `${item.blood_type_required} • ${item.urgency_level}`,
          subtitle: item.message ?? "Sans message",
          meta: formatDateTime(item.deadline),
        }))}
        theme={theme}
        title="Dernières alertes"
      />
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  theme,
}: {
  title: string;
  subtitle: string;
  theme: "light" | "dark";
}) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
        {subtitle}
      </p>
      <h2 className={`mt-2 text-xl font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>
        {title}
      </h2>
    </div>
  );
}

function HeroMetricCard({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-4 ${
        theme === "dark"
          ? "border border-white/15 bg-white/10"
          : "border border-sky-100 bg-white/85 shadow-sm"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme === "dark" ? "text-slate-200" : "text-slate-600"}`}>
        {label}
      </p>
      <p className={`mt-3 text-4xl font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
  theme,
}: {
  label: string;
  value: number;
  helper: string;
  tone: "sky" | "emerald" | "red" | "amber";
  theme: "light" | "dark";
}) {
  const tones = {
    sky: "from-sky-400 to-cyan-400",
    emerald: "from-emerald-400 to-green-400",
    red: "from-red-400 to-orange-400",
    amber: "from-amber-400 to-orange-300",
  };

  return (
    <div
      className={`rounded-[2rem] p-5 shadow-sm ${
        theme === "dark"
          ? "border border-slate-800 bg-slate-900"
          : "border border-sky-100 bg-white"
      }`}
    >
      <div className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${tones[tone]}`} />
      <p className={`mt-4 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{value}</p>
      <p className={`mt-2 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{helper}</p>
    </div>
  );
}

function InfoItem({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: "light" | "dark";
}) {
  return (
    <div className={`rounded-2xl px-4 py-4 ${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}>
      <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-2 text-sm font-medium ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function BarChart({
  bars,
  theme,
}: {
  bars: TrendPoint[];
  theme: "light" | "dark";
}) {
  const maxValue = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="mt-6 flex items-end gap-3">
      {bars.map((bar) => (
        <div key={bar.label} className="flex flex-1 flex-col items-center gap-3">
          <div className={`flex h-56 w-full items-end rounded-2xl p-2 ${theme === "dark" ? "bg-slate-800" : "bg-sky-50"}`}>
            <div
              className="w-full rounded-xl bg-red-500"
              style={{
                height: `${Math.max((bar.value / maxValue) * 100, bar.value > 0 ? 12 : 0)}%`,
              }}
            />
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{bar.value}</p>
            <p className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{bar.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricTile({
  label,
  value,
  theme,
}: {
  label: string;
  value: number | string;
  theme: "light" | "dark";
}) {
  return (
    <div className={`rounded-2xl px-4 py-5 ${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}>
      <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function ListCard({
  title,
  emptyMessage,
  items,
  theme,
}: {
  title: string;
  emptyMessage: string;
  items: { id: string; title: string; subtitle: string; meta: string }[];
  theme: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-[2rem] p-6 shadow-sm ${
        theme === "dark"
          ? "border border-slate-800 bg-slate-900"
          : "border border-sky-100 bg-white"
      }`}
    >
      <h2 className={`text-xl font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-950"}`}>{title}</h2>
      {items.length > 0 ? (
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
              <p className={`mt-2 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{item.subtitle}</p>
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
  theme,
}: {
  message: string;
  theme: "light" | "dark";
}) {
  return (
    <p
      className={`mt-6 rounded-2xl px-4 py-6 text-sm ${
        theme === "dark"
          ? "bg-slate-800 text-slate-300"
          : "bg-slate-50 text-slate-600"
      }`}
    >
      {message}
    </p>
  );
}

function PageMessage({
  message,
  tone,
  theme,
}: {
  message: string;
  tone: "neutral" | "error";
  theme: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-[2rem] border px-5 py-4 text-sm ${
        tone === "error"
          ? theme === "dark"
            ? "border-red-500/30 bg-red-500/10 text-red-200"
            : "border-red-200 bg-red-50 text-red-700"
          : theme === "dark"
            ? "border-slate-800 bg-slate-900 text-slate-300"
            : "border-sky-100 bg-white text-slate-700"
      }`}
    >
      {message}
    </div>
  );
}
