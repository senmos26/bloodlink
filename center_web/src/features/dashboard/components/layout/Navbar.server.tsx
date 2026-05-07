import { NavbarClient } from "./NavbarClient";
import { createClient } from "@/shared/lib/supabase/server";

// Fetches profile data server-side
export async function Navbar() {
  type Profile = {
    full_name: string | null;
    avatar_url: string | null;
    role: "center_admin" | "super_admin" | "donor" | null;
  };
  let profile: Profile | null = null;
  try {
    const supabase = await createClient(false, { noCache: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Utiliser le client admin pour lire le profil (bypass RLS)
      const adminClient = await createClient(true);
      const { data: adminProfile } = await adminClient
        .from("admin_profiles")
        .select("name, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle();

      if (adminProfile) {
        profile = {
          full_name: adminProfile.name,
          avatar_url: adminProfile.avatar_url,
          role: adminProfile.role as Profile["role"],
        };
      } else {
        // Fallback sur les métadonnées utilisateur
        profile = {
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          avatar_url: user.user_metadata?.avatar_url || null,
          role: null,
        };
      }
    }
  } catch (error) {
    console.error("Navbar error:", error);
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4">
        <NavbarClient profile={profile} />
      </div>
    </header>
  );
}
