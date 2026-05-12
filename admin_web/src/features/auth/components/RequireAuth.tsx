import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: "super_admin";
}

/**
 * Server component that enforces authentication and role-based access.
 * Must be used in server-side layouts to protect routes.
 *
 * - No session → redirect to /login
 * - Profile inactive → redirect to /login?error=blocked
 * - center_admin → redirect to center_web
 * - Required role not matched → redirect to /login?error=unauthorized
 */
export async function RequireAuth({ children, requiredRole }: RequireAuthProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || !profile.is_active) {
    redirect("/login?error=blocked");
  }

  // center_admin should use center_web, not admin_web
  if (profile.role === "center_admin") {
    const centerWebUrl = process.env.NEXT_PUBLIC_CENTER_WEB_URL || "http://localhost:3000";
    redirect(centerWebUrl);
  }

  // donor should never access admin
  if (profile.role === "donor") {
    redirect("/login?error=unauthorized");
  }

  // Check required role if specified
  if (requiredRole && profile.role !== requiredRole) {
    redirect("/admin/dashboard");
  }

  return <>{children}</>;
}
