import { getCurrentAdminProfile } from "@/features/auth/lib/actions";
import { SettingsPageClient } from "@/features/settings/components/SettingsPage";

export default async function SettingsPage() {
  const profile = await getCurrentAdminProfile();

  if (!profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Impossible de charger votre profil.
      </div>
    );
  }

  return <SettingsPageClient profile={profile} />;
}
