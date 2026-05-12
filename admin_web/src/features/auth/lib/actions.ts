"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getURL } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Verify the user has an admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Compte désactivé." };
  }

  if (profile.role === "donor") {
    await supabase.auth.signOut();
    return { error: "Accès réservé aux administrateurs." };
  }

  if (profile.role === "center_admin") {
    // center_admin should use center_web
    return { redirect: "center_web" };
  }

  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getCurrentAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active || profile.role === "donor") return null;

  return profile;
}

export async function updateAdminProfile(data: { full_name?: string; phone?: string | null }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      phone: data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function sendPasswordReset() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Email non disponible." };

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${getURL()}/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}
