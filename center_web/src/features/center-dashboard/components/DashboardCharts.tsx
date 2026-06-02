"use client";

import { useTranslations } from "next-intl";
import { useMonthlyDonations, useBloodTypeStats } from "@/features/center-dashboard/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, BarChart3 } from "lucide-react";

function MonthlyChart() {
  const t = useTranslations("dashboard.charts");
  const { data: monthlyData, isLoading } = useMonthlyDonations();
  const monthLabels = t.raw("months") as string[];

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  const maxCount = Math.max(...(monthlyData?.map((d) => d.donationCount) ?? [1]), 1);

  return (
    <div className="flex items-end gap-1.5 h-48 px-1">
      {monthLabels.map((label, i) => {
        const monthData = monthlyData?.find((d) => d.month === i + 1);
        const count = monthData?.donationCount ?? 0;
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div 
            key={label} 
            className="flex flex-1 flex-col items-center h-full justify-end group p-0.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-200"
          >
            <span className="text-[10px] font-semibold text-slate-500 mb-1 group-hover:text-rose-600 group-hover:scale-110 transition-all duration-200">
              {count > 0 ? count : ""}
            </span>
            <div className="w-full flex-1 flex items-end bg-slate-50/40 border border-slate-100/50 rounded-t-lg p-0.5 relative min-h-[30px]">
              {/* Glow overlay on hover */}
              <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg pointer-events-none" />
              
              <div
                className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                  count > 0
                    ? "bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_2px_8px_rgba(244,63,94,0.2)] group-hover:from-rose-500 group-hover:to-rose-300"
                    : "bg-slate-100/60"
                }`}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
            </div>
            <span className="text-[9px] font-medium text-slate-400 mt-1.5 group-hover:text-rose-600 transition-colors duration-200">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function BloodTypeChart() {
  const t = useTranslations("dashboard.charts");
  const { data: bloodData, isLoading } = useBloodTypeStats();

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  const totalDonors = bloodData?.reduce((sum, d) => sum + d.donorCount, 0) ?? 1;

  const BLOOD_COLORS: Record<string, string> = {
    "A+": "bg-red-500",
    "A-": "bg-red-400",
    "B+": "bg-blue-500",
    "B-": "bg-blue-400",
    "AB+": "bg-purple-500",
    "AB-": "bg-purple-400",
    "O+": "bg-amber-500",
    "O-": "bg-amber-400",
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {bloodData?.map((bt) => (
        <div
          key={bt.bloodType}
          className="flex flex-col items-center gap-1 rounded-lg border bg-white p-2 shadow-sm"
        >
          <div className={`rounded-full ${BLOOD_COLORS[bt.bloodType] ?? "bg-slate-400"} px-2 py-0.5 text-xs font-bold text-white`}>
            {bt.bloodType}
          </div>
          <span className="text-sm font-semibold text-slate-700">{bt.donorCount}</span>
          <span className="text-[9px] text-slate-400">
            {totalDonors > 0 ? Math.round((bt.donorCount / totalDonors) * 100) : 0}%
          </span>
        </div>
      ))}
      {(!bloodData || bloodData.length === 0) && (
        <div className="col-span-4 flex items-center justify-center py-8 text-sm text-slate-400">
          {t("empty")}
        </div>
      )}
    </div>
  );
}

export function DashboardCharts() {
  const t = useTranslations("dashboard.charts");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-rose-500" />
            {t("monthlyDonations")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Droplets className="h-4 w-4 text-rose-500" />
            {t("bloodGroups")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BloodTypeChart />
        </CardContent>
      </Card>
    </div>
  );
}
