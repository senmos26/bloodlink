import "server-only";
import { createClient } from "@/shared/lib/supabase/server";
type UserRole = "center_admin" | "super_admin" | "donor";
type Profile = { id: string; role: UserRole; full_name: string | null; [key: string]: unknown };
type Center = { id: string; name: string; admin_id: string; [key: string]: unknown };
type AdminContext = { profile: Profile; role: UserRole; center: Center | null };


export async function getAuthenticatedUserWithRole(
  role: UserRole
): Promise<{
  user: Profile | null;
  supabase: Awaited<ReturnType<typeof createClient>> | null;
  center: Center | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { user: null, supabase: null, center: null, error: "Authentication failed." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    return { user: null, supabase: null, center: null, error: "Could not fetch profile." };
  }

  if (profile.role !== role) {
    return { user: null, supabase: null, center: null, error: "Forbidden." };
  }

  let center: Center | null = null;
  if (role === "center_admin" && profile) {
    const { data: centerData } = await supabase
      .from("centers")
      .select("*")
      .eq("admin_id", profile.id)
      .single();
    center = centerData || null;
  }

  return { user: profile, supabase, center, error: null };
}

export async function getCenterAdminContext(): Promise<{
  context: AdminContext | null;
  error: string | null;
}> {
  const { user, center, error } = await getAuthenticatedUserWithRole("center_admin");

  if (error || !user) {
    return { context: null, error: error || "Not authenticated." };
  }

  return {
    context: {
      profile: user,
      role: "center_admin",
      center,
    },
    error: null,
  };
}

export async function requireCenterAdmin() {
  const { context, error } = await getCenterAdminContext();

  if (error || !context) {
    throw new Error(error || "Access denied.");
  }

  return context;
}
