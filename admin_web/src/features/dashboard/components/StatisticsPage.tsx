"use client";

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
  LineChart,
  Line,
} from "recharts";
import { Users, Building2, Droplets, HeartPulse } from "lucide-react";

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

interface StatisticsPageProps {
  stats: DashboardStats | null;
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

// ─── Component ──────────────────────────────────────────────────────

export function StatisticsPage({ stats }: StatisticsPageProps) {
  if (!stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Impossible de charger les statistiques.
      </div>
    );
  }

  const bloodTypeData = Object.entries(stats.bloodTypeCounts).map(([type, count]) => ({
    name: type,
    value: count,
    color: BLOOD_TYPE_COLORS[type] || "#94a3b8",
  }));

  const monthlyDonationData = Object.entries(stats.monthlyDonations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      name: month.substring(5),
      dons: count,
    }));

  const kpiCards = [
    { icon: Users, label: "Donneurs actifs", value: stats.totalDonors, color: "text-rose-600 bg-rose-50" },
    { icon: Building2, label: "Centres actifs", value: stats.totalCenters, color: "text-blue-600 bg-blue-50" },
    { icon: Droplets, label: "Dons validés", value: stats.validatedDonations, color: "text-green-600 bg-green-50" },
    { icon: HeartPulse, label: "Alertes actives", value: stats.activeAlerts, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statistiques</h1>
        <p className="mt-1 text-sm text-slate-500">Analyse détaillée de la plateforme BloodLink</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-xl ${kpi.color}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className="text-xl font-bold text-slate-900">{kpi.value.toLocaleString("fr-FR")}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Blood type distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Répartition par groupe sanguin</h2>
          <p className="mt-1 text-sm text-slate-500">Donneurs actifs</p>
          <div className="mt-4 h-72">
            {bloodTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bloodTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
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
                Aucune donnée
              </div>
            )}
          </div>
        </div>

        {/* Monthly donations bar chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dons mensuels</h2>
          <p className="mt-1 text-sm text-slate-500">Historique</p>
          <div className="mt-4 h-72">
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
                Aucune donnée
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly donations line chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tendance des dons</h2>
        <p className="mt-1 text-sm text-slate-500">Évolution mensuelle</p>
        <div className="mt-4 h-72">
          {monthlyDonationData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyDonationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="dons" stroke="#e11d48" strokeWidth={2} dot={{ fill: "#e11d48" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Données insuffisantes pour afficher la tendance
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
