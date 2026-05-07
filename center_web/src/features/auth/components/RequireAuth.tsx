import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";

// Server Component: wraps private areas and ensures a logged-in user exists
export async function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Always require explicit login
    redirect("/login");
  }

  return <>{children}</>;
}
