import "server-only";
import { createClient } from "@/shared/lib/supabase/server";
type UserRole = "center_admin" | "super_admin" | "donor";
type Profile = { id: string; role: UserRole; full_name: string | null; is_active: boolean; [key: string]: unknown };
type Center = { id: string; name: string; admin_id: string; is_active: boolean; [key: string]: unknown };
type AdminContext = { profile: Profile; role: UserRole; center: Center | null };

const ALLOWED_ROLES: UserRole[] = ["center_admin"];

export async function getAdminContext(): Promise<{
  context: AdminContext | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { context: null, error: "Authentication failed." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    return { context: null, error: "Could not fetch profile." };
  }

  if (!ALLOWED_ROLES.includes(profile.role)) {
    return { context: null, error: "Forbidden." };
  }

  if (!profile.is_active) {
    return { context: null, error: "Compte désactivé." };
  }

  let center: Center | null = null;
  if (profile.role === "center_admin") {
    const { data: centerData } = await supabase
      .from("centers")
      .select("*")
      .eq("admin_id", profile.id)
      .single();

    if (!centerData) {
      return { context: null, error: "Aucun centre associé à ce compte." };
    }

    if (!centerData.is_active) {
      return { context: null, error: "Votre centre est désactivé." };
    }

    center = centerData;
  }

  return {
    context: {
      profile,
      role: profile.role,
      center,
    },
    error: null,
  };
}

export async function requireCenterAdmin() {
  const { context, error } = await getAdminContext();

  if (error || !context) {
    throw new Error(error || "Access denied.");
  }

  return context;
}
