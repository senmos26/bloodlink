"use client";

import { Activity, AlertTriangle, Droplets, PackageOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBloodTypeStats,
  useTodayStats,
} from "@/features/center-dashboard/lib/hooks";

type StockLevel = "critical" | "warning" | "healthy";

const BLOOD_TYPE_ORDER = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
const TARGET_BY_BLOOD_TYPE: Record<string, number> = {
  "O-": 12,
  "O+": 18,
  "A-": 10,
  "A+": 18,
  "B-": 8,
  "B+": 12,
  "AB-": 6,
  "AB+": 8,
};

function getStockLevel(value: number, target: number): StockLevel {
  const ratio = target === 0 ? 1 : value / target;
  if (ratio < 0.45) return "critical";
  if (ratio < 0.8) return "warning";
  return "healthy";
}

function getBadgeVariant(level: StockLevel): "destructive" | "secondary" | "default" {
  if (level === "critical") return "destructive";
  if (level === "warning") return "secondary";
  return "default";
}

function getProgressClassName(level: StockLevel) {
  if (level === "critical") return "[&>div]:bg-red-500";
  if (level === "warning") return "[&>div]:bg-amber-500";
  return "[&>div]:bg-emerald-500";
}

export default function StockPage() {
  const t = useTranslations("dashboard.stock");
  const { data: stats, isLoading: statsLoading } = useTodayStats();
  const { data: bloodTypeStats, isLoading: bloodTypesLoading } = useBloodTypeStats();

  const rows = BLOOD_TYPE_ORDER.map((bloodType) => {
    const count =
      bloodTypeStats?.find((item) => item.bloodType === bloodType)?.donorCount ?? 0;
    const target = TARGET_BY_BLOOD_TYPE[bloodType];
    const percentage = Math.min(100, Math.round((count / target) * 100));
    const level = getStockLevel(count, target);

    return {
      bloodType,
      count,
      target,
      percentage,
      level,
    };
  });

  const criticalCount = rows.filter((row) => row.level === "critical").length;
  const warningCount = rows.filter((row) => row.level === "warning").length;
  const healthyCount = rows.filter((row) => row.level === "healthy").length;
  const totalUnits = rows.reduce((sum, row) => sum + row.count, 0);
  const levelLabels: Record<StockLevel, string> = {
    critical: t("levels.critical"),
    warning: t("levels.warning"),
    healthy: t("levels.healthy"),
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("subtitle", {
              centerName: stats?.centerName || t("defaultCenterName"),
            })}
          </p>
        </div>
        <Badge variant={criticalCount > 0 ? "destructive" : "default"} className="w-fit">
          {criticalCount > 0
            ? t("status.criticalCount", { count: criticalCount })
            : t("status.stable")}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>{t("cards.totalTracked.title")}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PackageOpen className="h-5 w-5 text-rose-600" />
              {bloodTypesLoading ? <Skeleton className="h-8 w-16" /> : totalUnits}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            {t("cards.totalTracked.hint")}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>{t("cards.stableGroups.title")}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Droplets className="h-5 w-5 text-emerald-600" />
              {bloodTypesLoading ? <Skeleton className="h-8 w-10" /> : healthyCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            {t("cards.stableGroups.hint")}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>{t("cards.warningGroups.title")}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="h-5 w-5 text-amber-600" />
              {bloodTypesLoading ? <Skeleton className="h-8 w-10" /> : warningCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            {t("cards.warningGroups.hint")}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>{t("cards.activeAlerts.title")}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {statsLoading ? (
                <Skeleton className="h-8 w-10" />
              ) : (
                stats?.activeAlertsCount ?? 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">
            {t("cards.activeAlerts.hint")}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
          <CardDescription>
            {t("table.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bloodTypesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.headers.group")}</TableHead>
                  <TableHead>{t("table.headers.available")}</TableHead>
                  <TableHead>{t("table.headers.target")}</TableHead>
                  <TableHead>{t("table.headers.coverage")}</TableHead>
                  <TableHead>{t("table.headers.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.bloodType}>
                    <TableCell className="font-semibold text-slate-900">
                      {row.bloodType}
                    </TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{row.target}</TableCell>
                    <TableCell className="min-w-48">
                      <div className="flex items-center gap-3">
                        <Progress
                          value={row.percentage}
                          className={getProgressClassName(row.level)}
                        />
                        <span className="w-12 text-xs font-medium text-slate-500">
                          {row.percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(row.level)}>
                        {levelLabels[row.level]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
