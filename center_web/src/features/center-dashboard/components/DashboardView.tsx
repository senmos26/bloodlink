"use client";

import { DashboardKPICards } from "@/features/center-dashboard/components/DashboardKPICards";
import { QuickActions } from "@/features/center-dashboard/components/QuickActions";
import { DashboardCharts } from "@/features/center-dashboard/components/DashboardCharts";
import { useTodayStats } from "@/features/center-dashboard/lib/hooks";
import { useTranslations } from "next-intl";

function WelcomeBar() {
  const { data: stats } = useTodayStats();
  const t = useTranslations("dashboard.centerHome");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("greeting", {
            centerName: stats?.centerName ?? t("defaultCenterName"),
          })}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
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
