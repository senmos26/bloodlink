"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Center } from "@/types/database";

// ─── Center actions ─────────────────────────────────────────────────

export async function getCenters(filters?: { isActive?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("centers")
    .select("*, profiles:admin_id(full_name, email)")
    .order("created_at", { ascending: false });

  if (filters?.isActive !== undefined) query = query.eq("is_active", filters.isActive);

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data: data as (Center & { profiles?: { full_name: string; email: string } | null })[] };
}

export async function toggleCenterActive(centerId: string, isActive: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "super_admin") {
    return { error: "Seul un super administrateur peut modifier les centres." };
  }

  const { error } = await supabase
    .from("centers")
    .update({ is_active: isActive })
    .eq("id", centerId);

  if (error) return { error: error.message };

  revalidatePath("/admin/centers");
  return { success: true };
}

export async function updateCenter(centerId: string, updates: Partial<Pick<Center, "name" | "address" | "city" | "phone" | "email" | "latitude" | "longitude">>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("centers")
    .update(updates)
    .eq("id", centerId);

  if (error) return { error: error.message };

  revalidatePath("/admin/centers");
  return { success: true };
}

export async function createCenterAccount(payload: {
  responsibleFullName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  temporaryPassword: string;
  centerName: string;
  centerAddress: string;
  centerCity: string;
  centerPhone: string;
  centerEmail: string;
  latitude: number;
  longitude: number;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "super_admin") {
    return { error: "Seul un super administrateur peut créer un compte centre." };
  }

  // Get the session token for the edge function
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session introuvable." };

  // Invoke the edge function with proper auth
  const { data, error: invokeError } = await supabase.functions.invoke(
    "create-center-account",
    { body: payload }
  );

  if (invokeError) return { error: invokeError.message };
  if (!data?.success) return { error: "La création du compte centre a échoué." };

  revalidatePath("/admin/centers");
  revalidatePath("/admin/profiles");
  return { success: true, userId: data.userId, centerId: data.centerId };
}
