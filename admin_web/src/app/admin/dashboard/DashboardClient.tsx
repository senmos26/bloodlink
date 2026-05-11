"use client";

import {
  Users,
  Building2,
  Bell,
  HeartPulse,
  CalendarDays,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { UrgencyLevel } from "@/types/database";

// ─── Types ──────────────────────────────────────────────────────────

interface DashboardStats {
  totalDonors: number;
  totalCenters: number;
  activeAlerts: number;
  criticalAlerts: number;
  validatedDonations: number;
  pendingDonations: number;
  todayAppointments: number;
  pendingAppointments: number;
  bloodTypeCounts: Record<string, number>;
  monthlyDonations: Record<string, number>;
}

interface RecentAlert {
  id: string;
  blood_type_required: string;
  urgency_level: UrgencyLevel;
  status: string;
  deadline: string;
  created_at: string;
  centers?: { name: string; city: string } | null;
}

interface RecentAppointment {
  id: string;
  scheduled_date: string;
  status: string;
  profiles?: { full_name: string; blood_type: string | null } | null;
  centers?: { name: string } | null;
}

interface DashboardClientProps {
  stats: DashboardStats | null;
  recentAlerts: RecentAlert[];
  recentAppointments: RecentAppointment[];
}

// ─── Constants ──────────────────────────────────────────────────────

const BLOOD_TYPE_COLORS: Record<string, string> = {
  "A+": "#dc2626",
  "A-": "#ef4444",
  "B+": "#2563eb",
  "B-": "#3b82f6",
  "AB+": "#7c3aed",
  "AB-": "#8b5cf6",
  "O+": "#16a34a",
  "O-": "#22c55e",
};

const URGENCY_LABELS: Record<UrgencyLevel, { label: string; color: string }> = {
  low: { label: "Basse", color: "bg-green-100 text-green-700" },
  medium: { label: "Moyenne", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "Haute", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Critique", color: "bg-red-100 text-red-700" },
};

const APPOINTMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmé", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Complété", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

// ─── Component ──────────────────────────────────────────────────────

export function DashboardClient({ stats, recentAlerts, recentAppointments }: DashboardClientProps) {
  if (!stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Impossible de charger les statistiques du tableau de bord.
      </div>
    );
  }

  // Prepare chart data
  const bloodTypeData = Object.entries(stats.bloodTypeCounts).map(([type, count]) => ({
    name: type,
    value: count,
    color: BLOOD_TYPE_COLORS[type] || "#94a3b8",
  }));

  const monthlyDonationData = Object.entries(stats.monthlyDonations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      name: month.substring(5), // MM only
      dons: count,
    }));

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vue d&apos;ensemble de la plateforme BloodLink
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={Users}
          label="Donneurs actifs"
          value={stats.totalDonors}
          trend="+12%"
          color="rose"
        />
        <KPICard
          icon={Building2}
          label="Centres actifs"
          value={stats.totalCenters}
          color="blue"
        />
        <KPICard
          icon={Bell}
          label="Alertes actives"
          value={stats.activeAlerts}
          subtitle={stats.criticalAlerts > 0 ? `${stats.criticalAlerts} critiques` : undefined}
          color={stats.criticalAlerts > 0 ? "red" : "amber"}
        />
        <KPICard
          icon={HeartPulse}
          label="Dons validés"
          value={stats.validatedDonations}
          subtitle={stats.pendingDonations > 0 ? `${stats.pendingDonations} en attente` : undefined}
          color="green"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KPICard
          icon={CalendarDays}
          label="RDV aujourd'hui"
          value={stats.todayAppointments}
          subtitle={stats.pendingAppointments > 0 ? `${stats.pendingAppointments} en attente` : undefined}
          color="violet"
        />
        <KPICard
          icon={TrendingUp}
          label="Dons ce mois"
          value={monthlyDonationData.length > 0 ? monthlyDonationData[monthlyDonationData.length - 1].dons : 0}
          color="emerald"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Blood type distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Répartition par groupe sanguin</h2>
          <p className="mt-1 text-sm text-slate-500">Donneurs actifs</p>
          <div className="mt-4 h-64">
            {bloodTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bloodTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {bloodTypeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Monthly donations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dons mensuels</h2>
          <p className="mt-1 text-sm text-slate-500">6 derniers mois</p>
          <div className="mt-4 h-64">
            {monthlyDonationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDonationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="dons" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Alertes récentes</h2>
            <a href="/admin/alerts" className="text-sm font-medium text-rose-600 hover:text-rose-700">
              Voir tout
            </a>
          </div>
          <div className="mt-4 space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-4 text-rose-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {alert.centers?.name || "Centre inconnu"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {alert.blood_type_required} · Échéance: {formatDate(alert.deadline)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      URGENCY_LABELS[alert.urgency_level]?.color || "bg-slate-100 text-slate-600"
                    )}
                  >
                    {URGENCY_LABELS[alert.urgency_level]?.label || alert.urgency_level}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Aucune alerte active</p>
            )}
          </div>
        </div>

        {/* Recent appointments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Rendez-vous récents</h2>
            <a href="/admin/appointments" className="text-sm font-medium text-rose-600 hover:text-rose-700">
              Voir tout
            </a>
          </div>
          <div className="mt-4 space-y-3">
            {recentAppointments.length > 0 ? (
              recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="size-4 text-violet-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {apt.profiles?.full_name || "Donneur inconnu"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {apt.centers?.name || "Centre inconnu"} · {formatDate(apt.scheduled_date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      APPOINTMENT_STATUS_LABELS[apt.status]?.color || "bg-slate-100 text-slate-600"
                    )}
                  >
                    {APPOINTMENT_STATUS_LABELS[apt.status]?.label || apt.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Aucun rendez-vous</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; icon: string; ring: string }> = {
  rose: { bg: "bg-rose-50", icon: "text-rose-600", ring: "ring-rose-100" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100" },
  red: { bg: "bg-red-50", icon: "text-red-600", ring: "ring-red-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-100" },
  green: { bg: "bg-green-50", icon: "text-green-600", ring: "ring-green-100" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", ring: "ring-violet-100" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
};

function KPICard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  subtitle?: string;
  trend?: string;
  color: string;
}) {
  const colors = COLOR_MAP[color] || COLOR_MAP.rose;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={cn("flex size-12 items-center justify-center rounded-2xl ring-4", colors.bg, colors.ring)}>
          <Icon className={cn("size-6", colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{value.toLocaleString("fr-FR")}</p>
            {trend && (
              <span className="text-xs font-medium text-green-600">{trend}</span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
