import { getDashboardStats } from "@/features/dashboard/lib/actions";
import { StatisticsPage } from "@/features/dashboard/components/StatisticsPage";

export default async function StatisticsPageRoute() {
  const result = await getDashboardStats();

  const stats = "error" in result ? null : result;

  return <StatisticsPage stats={stats} />;
}
