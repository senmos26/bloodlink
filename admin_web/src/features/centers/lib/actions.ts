"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Center } from "@/types/database";

// ─── Center actions ─────────────────────────────────────────────────

export async function getCenters(filters?: { isActive?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("centers")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.isActive !== undefined) query = query.eq("is_active", filters.isActive);

  const { data: centers, error: centersError } = await query;

  if (centersError) return { error: centersError.message };
  if (!centers || centers.length === 0) return { data: [] };

  // Fetch admin profiles separately to handle NULL admin_id gracefully
  const adminIds = centers
    .map((c) => c.admin_id)
    .filter((id): id is string => !!id);

  let profilesMap: Record<string, { full_name: string; email: string }> = {};

  if (adminIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", adminIds);

    profilesMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
    );
  }

  const enriched = centers.map((center) => ({
    ...center,
    profiles: center.admin_id ? profilesMap[center.admin_id] ?? null : null,
  }));

  return { data: enriched as (Center & { profiles?: { full_name: string; email: string } | null })[] };
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

export async function deleteCenter(centerId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "super_admin") {
    return { error: "Seul un super administrateur peut supprimer un centre." };
  }

  // 1. Get the center to retrieve its admin_id
  const { data: center } = await supabase
    .from("centers")
    .select("admin_id")
    .eq("id", centerId)
    .single();

  // 2. Delete the center from the table
  const { error: deleteError } = await supabase
    .from("centers")
    .delete()
    .eq("id", centerId);

  if (deleteError) return { error: deleteError.message };

  // 3. Delete the associated user profile
  if (center?.admin_id) {
    await supabase
      .from("profiles")
      .delete()
      .eq("id", center.admin_id);
  }

  revalidatePath("/admin/centers");
  revalidatePath("/admin/profiles");
  return { success: true };
}
