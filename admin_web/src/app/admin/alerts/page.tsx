import { getAlerts } from "@/features/alerts/lib/actions";
import { AlertsPage } from "@/features/alerts/components/AlertsPage";

export default async function AlertsPageRoute() {
  const result = await getAlerts();

  const alerts = "error" in result ? [] : result.data || [];

  return <AlertsPage initialAlerts={alerts} />;
}
