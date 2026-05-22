export const dynamic = 'force-dynamic';

import { getAppointments } from "@/features/appointments/lib/actions";
import { AppointmentsPage } from "@/features/appointments/components/AppointmentsPage";

export default async function AppointmentsPageRoute() {
  const result = await getAppointments();

  const appointments = "error" in result ? [] : result.data || [];

  return <AppointmentsPage initialAppointments={appointments} />;
}
