"use client";

import { DashboardKPICards } from "@/features/center-dashboard/components/DashboardKPICards";
import { QuickActions } from "@/features/center-dashboard/components/QuickActions";
import { DashboardCharts } from "@/features/center-dashboard/components/DashboardCharts";
import { useTodayStats } from "@/features/center-dashboard/lib/hooks";

function WelcomeBar() {
  const { data: stats } = useTodayStats();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bonjour, {stats?.centerName ?? "Centre"}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Voici un aperçu de votre activité du jour
        </p>
      </div>
      <QuickActions />
    </div>
  );
}

export default function DashboardView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <WelcomeBar />
      <DashboardKPICards />
      <DashboardCharts />
    </div>
  );
}
