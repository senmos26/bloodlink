import { getProfiles } from "@/features/profiles/lib/actions";
import { ProfilesPage } from "@/features/profiles/components/ProfilesPage";

export default async function ProfilesPageRoute() {
  const result = await getProfiles();

  const profiles = "error" in result ? [] : result.data || [];

  return <ProfilesPage initialProfiles={profiles} />;
}
