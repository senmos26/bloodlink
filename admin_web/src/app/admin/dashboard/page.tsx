import { getDashboardStats, getRecentAlerts, getRecentAppointments } from "@/features/dashboard/lib/actions";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const [statsResult, alertsResult, appointmentsResult] = await Promise.all([
    getDashboardStats(),
    getRecentAlerts(5),
    getRecentAppointments(5),
  ]);

  const stats = "error" in statsResult ? null : statsResult;
  const recentAlerts = "error" in alertsResult ? [] : alertsResult.data || [];
  const recentAppointments = "error" in appointmentsResult ? [] : appointmentsResult.data || [];

  return (
    <DashboardClient
      stats={stats}
      recentAlerts={recentAlerts}
      recentAppointments={recentAppointments}
    />
  );
}
