import "server-only";
import { createClient } from "@/shared/lib/supabase/server";

export interface ProfileLite {
  full_name: string | null;
  avatar_url: string | null;
}

export async function getCurrentProfile(): Promise<ProfileLite | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return null;
  }

  // Fallback sur les métadonnées utilisateur ou l'email
  const full_name =
    (user.user_metadata?.full_name as string | undefined) ?? 
    user.email?.split("@")[0] ?? null;
  const avatar_url =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;
  return { full_name, avatar_url };
}
