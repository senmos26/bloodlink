import { getNotifications } from "@/features/notifications/lib/actions";
import { NotificationsPage } from "@/features/notifications/components/NotificationsPage";

export default async function NotificationsPageRoute() {
  const result = await getNotifications();

  const notifications = "error" in result ? [] : result.data || [];

  return <NotificationsPage initialNotifications={notifications} />;
}
