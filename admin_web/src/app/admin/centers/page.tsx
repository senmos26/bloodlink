import { getCenters } from "@/features/centers/lib/actions";
import { CentersPage } from "@/features/centers/components/CentersPage";

export default async function CentersPageRoute() {
  const result = await getCenters();

  const centers = "error" in result ? [] : result.data || [];

  return <CentersPage initialCenters={centers} />;
}
