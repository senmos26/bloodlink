"use client";

import { CalendarDays, Droplets, Bell, Clock, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayStats } from "@/features/center-dashboard/lib/hooks";

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  subtitle?: string;
  isLoading?: boolean;
}

function KPICard({ title, value, icon, gradient, iconBg, subtitle, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${gradient} p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">{title}</p>
        <div className={`rounded-lg ${iconBg} p-2`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-white/70">{subtitle}</p>
      )}
    </div>
  );
}

export function DashboardKPICards() {
  const { data: stats, isLoading } = useTodayStats();

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KPICard
        title="Rendez-vous"
        value={stats?.todayAppointmentsCount ?? 0}
        icon={<CalendarDays className="h-4 w-4 text-white" />}
        gradient="from-blue-500 to-blue-600"
        iconBg="bg-blue-400/30"
        subtitle="aujourd'hui"
        isLoading={isLoading}
      />
      <KPICard
        title="En attente"
        value={stats?.pendingAppointmentsCount ?? 0}
        icon={<Clock className="h-4 w-4 text-white" />}
        gradient="from-amber-500 to-orange-500"
        iconBg="bg-amber-400/30"
        subtitle="à confirmer"
        isLoading={isLoading}
      />
      <KPICard
        title="Dons validés"
        value={stats?.validatedDonationsCount ?? 0}
        icon={<Droplets className="h-4 w-4 text-white" />}
        gradient="from-rose-500 to-red-600"
        iconBg="bg-rose-400/30"
        subtitle="aujourd'hui"
        isLoading={isLoading}
      />
      <KPICard
        title="Alertes actives"
        value={stats?.activeAlertsCount ?? 0}
        icon={<Bell className="h-4 w-4 text-white" />}
        gradient="from-purple-500 to-violet-600"
        iconBg="bg-purple-400/30"
        subtitle="à traiter"
        isLoading={isLoading}
      />
    </div>
  );
}
