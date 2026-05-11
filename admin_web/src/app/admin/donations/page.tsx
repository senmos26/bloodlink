import { getDonations } from "@/features/donations/lib/actions";
import { DonationsPage } from "@/features/donations/components/DonationsPage";

export default async function DonationsPageRoute() {
  const result = await getDonations();

  const donations = "error" in result ? [] : result.data || [];

  return <DonationsPage initialDonations={donations} />;
}
