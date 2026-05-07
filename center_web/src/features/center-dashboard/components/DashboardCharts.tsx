"use client";

import { useMonthlyDonations, useBloodTypeStats } from "@/features/center-dashboard/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, BarChart3 } from "lucide-react";

const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

function MonthlyChart() {
  const { data: monthlyData, isLoading } = useMonthlyDonations();

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  const maxCount = Math.max(...(monthlyData?.map((d) => d.donationCount) ?? [1]), 1);

  return (
    <div className="flex items-end gap-1.5 h-48 px-1">
      {MONTH_LABELS.map((label, i) => {
        const monthData = monthlyData?.find((d) => d.month === i + 1);
        const count = monthData?.donationCount ?? 0;
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-slate-500">
              {count > 0 ? count : ""}
            </span>
            <div
              className={`w-full rounded-t-md transition-all duration-300 ${
                count > 0
                  ? "bg-gradient-to-t from-rose-500 to-rose-400"
                  : "bg-slate-100"
              }`}
              style={{ height: `${Math.max(height, 4)}%` }}
            />
            <span className="text-[9px] text-slate-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function BloodTypeChart() {
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
          Aucune donnée disponible
        </div>
      )}
    </div>
  );
}

export function DashboardCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-rose-500" />
            Dons mensuels
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
            Groupes sanguins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BloodTypeChart />
        </CardContent>
      </Card>
    </div>
  );
}
