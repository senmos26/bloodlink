"use client";

import { useEffect, useMemo, useState } from "react";

import { useAdminTheme } from "@/components/AdminThemeContext";
import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Alert, Appointment, Center, Donation, Profile } from "@/types/database";

type TrendPoint = {
  label: string;
  value: number;
};

const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

export default function StatisticsDashboard() {
  const { theme } = useAdminTheme();
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
              ...(Array.isArray(appointmentsRes.data)
                ? appointmentsRes.data.map((item) => item.donor_id)
                : []),
              ...(Array.isArray(donationsRes.data)
                ? donationsRes.data.map((item) => item.donor_id)
                : []),
            ])
          );

          const profilesRes =
            donorIds.length > 0
              ? await supabase.from("profiles").select("*").in("id", donorIds)
              : { data: [], error: null };

          if (profilesRes.error) throw profilesRes.error;
          if (!active) return;

          setContext(adminContext);
          setProfiles(
            Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : []
          );
          setAlerts(Array.isArray(alertsRes.data) ? (alertsRes.data as Alert[]) : []);
          setAppointments(
            Array.isArray(appointmentsRes.data)
              ? (appointmentsRes.data as Appointment[])
              : []
          );
          setDonations(
            Array.isArray(donationsRes.data) ? (donationsRes.data as Donation[]) : []
          );
          setCenters(adminContext.center ? [adminContext.center] : []);
          return;
        }

        const [profilesRes, centersRes, alertsRes, appointmentsRes, donationsRes] =
          await Promise.all([
            supabase.from("profiles").select("*"),
            supabase.from("centers").select("*"),
            supabase.from("alerts").select("*"),
            supabase.from("appointments").select("*"),
            supabase.from("donations").select("*"),
          ]);

        for (const result of [
          profilesRes,
          centersRes,
          alertsRes,
          appointmentsRes,
          donationsRes,
        ]) {
          if (result.error) throw result.error;
        }

        if (!active) return;

        setContext(adminContext);
        setProfiles(Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : []);
        setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
        setAlerts(Array.isArray(alertsRes.data) ? (alertsRes.data as Alert[]) : []);
        setAppointments(
          Array.isArray(appointmentsRes.data)
            ? (appointmentsRes.data as Appointment[])
            : []
        );
        setDonations(
          Array.isArray(donationsRes.data) ? (donationsRes.data as Donation[]) : []
        );
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Chargement des statistiques impossible."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStatistics();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const donorCount =
      profiles.filter((item) => item.role === "donor").length ||
      new Set([
        ...appointments.map((item) => item.donor_id),
        ...donations.map((item) => item.donor_id),
      ]).size;

    const activeAlerts = alerts.filter((item) => item.status === "active").length;
    const criticalAlerts = alerts.filter(
      (item) => item.urgency_level === "critical"
    ).length;
    const pendingAppointments = appointments.filter(
      (item) => item.status === "pending"
    ).length;
    const confirmedAppointments = appointments.filter(
      (item) => item.status === "confirmed"
    ).length;
    const completedAppointments = appointments.filter(
      (item) => item.status === "completed"
    ).length;
    const validatedDonations = donations.filter(
      (item) => item.status === "validated"
    ).length;
    const rejectedDonations = donations.filter(
      (item) => item.status === "rejected"
    ).length;
    const pendingDonations = donations.filter(
      (item) => item.status === "pending"
    ).length;
    const activeCenters = centers.filter((item) => item.is_active).length;
    const totalVolume = donations
      .filter((item) => item.status === "validated")
      .reduce((sum, item) => sum + item.volume_ml, 0);

    return {
      donorCount,
      activeAlerts,
      criticalAlerts,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      validatedDonations,
      rejectedDonations,
      pendingDonations,
      activeCenters,
      totalCenters: centers.length,
      totalVolume,
      appointmentCompletionRate:
        appointments.length > 0
          ? Math.round((completedAppointments / appointments.length) * 100)
          : 0,
      donationValidationRate:
        donations.length > 0
          ? Math.round((validatedDonations / donations.length) * 100)
          : 0,
    };
  }, [alerts, appointments, centers, donations, profiles]);

  const monthlyDonations = useMemo<TrendPoint[]>(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      return {
        label: monthFormatter.format(date),
        value: donations.filter((item) =>
          (item.donation_date ?? "").startsWith(key)
        ).length,
      };
    });
  }, [donations]);

  const monthlyAppointments = useMemo<TrendPoint[]>(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      return {
        label: monthFormatter.format(date),
        value: appointments.filter((item) =>
          (item.scheduled_date ?? "").startsWith(key)
        ).length,
      };
    });
  }, [appointments]);

  const alertStatusBreakdown = useMemo(() => {
    const segments = [
      {
        label: "Actives",
        value: alerts.filter((item) => item.status === "active").length,
        color: "#38bdf8",
      },
      {
        label: "Expirées",
        value: alerts.filter((item) => item.status === "expired").length,
        color: "#fb923c",
      },
      {
        label: "Clôturées",
        value: alerts.filter((item) => item.status === "closed").length,
        color: "#22c55e",
      },
    ];

    const total = segments.reduce((sum, item) => sum + item.value, 0);
    let cursor = 0;
    const stops = segments.map((segment) => {
      const start = total === 0 ? 0 : (cursor / total) * 100;
      cursor += segment.value;
      const end = total === 0 ? 100 : (cursor / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    });

    return {
      segments,
      style: {
        background:
          total === 0
            ? "conic-gradient(#e2e8f0 0% 100%)"
            : `conic-gradient(${stops.join(", ")})`,
      },
    };
  }, [alerts]);

  const appointmentStatusRows = useMemo(
    () => [
      {
        label: "En attente",
        value: stats.pendingAppointments,
        accent: "bg-amber-400",
      },
      {
        label: "Confirmés",
        value: stats.confirmedAppointments,
        accent: "bg-sky-400",
      },
      {
        label: "Complétés",
        value: stats.completedAppointments,
        accent: "bg-emerald-400",
      },
    ],
    [stats]
  );

  const topCards = [
    {
      label: "Donneurs suivis",
      value: stats.donorCount,
      helper: "base active",
      tone: "sky" as const,
    },
    {
      label: "Centres actifs",
      value: stats.activeCenters,
      helper:
        context?.role === "center_admin"
          ? "votre espace"
          : `${stats.totalCenters} centres au total`,
      tone: "emerald" as const,
    },
    {
      label: "Dons validés",
      value: stats.validatedDonations,
      helper: `${stats.totalVolume} ml collectés`,
      tone: "red" as const,
    },
    {
      label: "Alertes critiques",
      value: stats.criticalAlerts,
      helper: `${stats.activeAlerts} alertes actives`,
      tone: "amber" as const,
    },
  ];

  const pageBg = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const panelClass =
    theme === "dark"
      ? "rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm"
      : "rounded-[2rem] border border-sky-100 bg-white p-6 shadow-sm";
  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const subtleSurface = theme === "dark" ? "bg-slate-800" : "bg-slate-50";
  const heroClass =
    theme === "dark"
      ? "rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#111827_100%)] p-7 text-white"
      : "rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_35%),linear-gradient(135deg,#ecfeff_0%,#eff6ff_50%,#ffffff_100%)] p-7 text-slate-900 shadow-sm";

  if (loading) {
    return (
      <div className={`${panelClass} ${pageBg}`}>
        <p className={mutedText}>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${pageBg}`}>
      <section className={heroClass}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-400">
              BloodLink Analytics
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Tableau statistique</h1>
            <p className={`mt-3 max-w-2xl text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
              {context?.role === "center_admin"
                ? `Vue dédiée au centre ${context.center?.name ?? ""} avec les rendez-vous, alertes et dons réellement enregistrés.`
                : "Vue globale du réseau BloodLink avec les volumes réels, les centres actifs et l'évolution des rendez-vous."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MiniHighlight label="Taux validation dons" value={`${stats.donationValidationRate}%`} />
            <MiniHighlight label="Taux complétion RDV" value={`${stats.appointmentCompletionRate}%`} />
            <MiniHighlight label="Dons en attente" value={String(stats.pendingDonations)} />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <KpiCard
            key={card.label}
            helper={card.helper}
            label={card.label}
            theme={theme}
            tone={card.tone}
            value={card.value}
          />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr_0.85fr]">
        <div className={panelClass}>
          <SectionHeading
            subtitle="Nombre de dons validés par mois"
            title="Performance des dons"
            theme={theme}
          />
          <BarChart bars={monthlyDonations} color="bg-orange-500" theme={theme} />
        </div>

        <div className={panelClass}>
          <SectionHeading
            subtitle="Répartition temps réel"
            title="État des alertes"
            theme={theme}
          />
          <div className="mt-6 flex flex-col items-center gap-6">
            <div className="h-44 w-44 rounded-full" style={alertStatusBreakdown.style} />
            <div className="grid w-full gap-3">
              {alertStatusBreakdown.segments.map((segment) => (
                <div
                  key={segment.label}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 ${subtleSurface}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm font-medium">{segment.label}</span>
                  </div>
                  <span className={`text-sm ${mutedText}`}>{segment.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={panelClass}>
          <SectionHeading
            subtitle="Pipeline opérationnel"
            title="Rendez-vous"
            theme={theme}
          />
          <div className="mt-6 space-y-4">
            {appointmentStatusRows.map((row) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className={mutedText}>{row.value}</span>
                </div>
                <div className={`h-3 overflow-hidden rounded-full ${subtleSurface}`}>
                  <div
                    className={`h-full rounded-full ${row.accent}`}
                    style={{
                      width: `${
                        appointments.length > 0
                          ? Math.max((row.value / appointments.length) * 100, row.value > 0 ? 8 : 0)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className={`rounded-2xl px-4 py-4 ${subtleSurface}`}>
              <p className={`text-xs uppercase tracking-[0.22em] ${mutedText}`}>
                Total rendez-vous
              </p>
              <p className="mt-2 text-3xl font-semibold">{appointments.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className={panelClass}>
          <SectionHeading
            subtitle="Tendance sur 6 mois"
            title="Évolution des rendez-vous"
            theme={theme}
          />
          <LineTrend points={monthlyAppointments} theme={theme} />
        </div>

        <div className={panelClass}>
          <SectionHeading
            subtitle="Chiffres clés métier"
            title="Résumé opérationnel"
            theme={theme}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <MetricTile label="Dons rejetés" theme={theme} value={stats.rejectedDonations} />
            <MetricTile label="RDV confirmés" theme={theme} value={stats.confirmedAppointments} />
            <MetricTile label="Volume validé" theme={theme} value={`${stats.totalVolume} ml`} />
            <MetricTile label="Alertes actives" theme={theme} value={stats.activeAlerts} />
          </div>
        </div>
      </section>
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
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
    </div>
  );
}

function MiniHighlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function KpiCard({
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
      <p className={`mt-4 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className={`mt-2 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{helper}</p>
    </div>
  );
}

function BarChart({
  bars,
  color,
  theme,
}: {
  bars: TrendPoint[];
  color: string;
  theme: "light" | "dark";
}) {
  const maxValue = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="mt-6 flex items-end gap-3">
      {bars.map((bar) => (
        <div key={bar.label} className="flex flex-1 flex-col items-center gap-3">
          <div
            className={`flex h-56 w-full items-end rounded-2xl p-2 ${
              theme === "dark" ? "bg-slate-800" : "bg-sky-50"
            }`}
          >
            <div
              className={`w-full rounded-xl ${color}`}
              style={{
                height: `${Math.max((bar.value / maxValue) * 100, bar.value > 0 ? 12 : 0)}%`,
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">{bar.value}</p>
            <p className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              {bar.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LineTrend({
  points,
  theme,
}: {
  points: TrendPoint[];
  theme: "light" | "dark";
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="mt-6">
      <div className="flex h-52 items-end gap-3">
        {points.map((point, index) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-44 items-end">
              <div
                className={`w-4 rounded-full ${index % 2 === 0 ? "bg-sky-400" : "bg-orange-400"}`}
                style={{
                  height: `${Math.max((point.value / maxValue) * 100, point.value > 0 ? 10 : 0)}%`,
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{point.value}</p>
              <p className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                {point.label}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className={`mt-4 rounded-2xl px-4 py-4 ${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}>
        <p className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
          Total rendez-vous observés sur la période:{" "}
          <span className="font-semibold text-inherit">
            {points.reduce((sum, point) => sum + point.value, 0)}
          </span>
        </p>
      </div>
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
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}
