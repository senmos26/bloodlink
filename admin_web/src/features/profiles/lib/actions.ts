"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, Profile } from "@/types/database";

// ─── Role change guards ────────────────────────────────────────────

interface RoleChangeValidation {
  allowed: boolean;
  reason?: string;
}

/**
 * Business rules for role changes:
 * 1. Cannot demote yourself from super_admin
 * 2. Cannot change role to center_admin without a center assignment
 * 3. Cannot demote center_admin to donor without first unassigning their center
 * 4. Cannot demote the last super_admin
 */
export async function validateRoleChange(
  profileId: string,
  currentRole: UserRole,
  newRole: UserRole
): Promise<RoleChangeValidation> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { allowed: false, reason: "Non authentifié." };

  // 1. Cannot demote yourself from super_admin
  if (profileId === user.id && currentRole === "super_admin" && newRole !== "super_admin") {
    return { allowed: false, reason: "Vous ne pouvez pas retirer votre propre rôle super_admin." };
  }

  // 2. Cannot demote the last super_admin
  if (currentRole === "super_admin" && newRole !== "super_admin") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin")
      .eq("is_active", true);

    if (count !== null && count <= 1) {
      return { allowed: false, reason: "Impossible de rétrograder le dernier super administrateur actif." };
    }
  }

  // 3. Demoting center_admin → donor: must unassign center first
  if (currentRole === "center_admin" && newRole === "donor") {
    const { data: center } = await supabase
      .from("centers")
      .select("id, name")
      .eq("admin_id", profileId)
      .limit(1);

    if (center && center.length > 0) {
      return {
        allowed: false,
        reason: `Ce centre admin est assigné au centre "${center[0].name}". Veuillez d'abord réassigner ou désactiver le centre.`,
      };
    }
  }

  // 4. Promoting to center_admin: must have a center assignment
  if (newRole === "center_admin" && currentRole !== "center_admin") {
    const { data: center } = await supabase
      .from("centers")
      .select("id")
      .eq("admin_id", profileId)
      .limit(1);

    if (!center || center.length === 0) {
      return {
        allowed: false,
        reason: "Un centre_admin doit être assigné à un centre. Créez d'abord un centre avec ce compte.",
      };
    }
  }

  // 5. Promoting center_admin → super_admin: should unassign center
  if (currentRole === "center_admin" && newRole === "super_admin") {
    const { data: center } = await supabase
      .from("centers")
      .select("id, name")
      .eq("admin_id", profileId)
      .limit(1);

    if (center && center.length > 0) {
      // Allow but warn — we'll unassign the center automatically
      // The caller should handle this
    }
  }

  return { allowed: true };
}

// ─── Profile actions ────────────────────────────────────────────────

export async function changeUserRole(profileId: string, newRole: UserRole) {
  const supabase = await createClient();

  // Verify caller is super_admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "super_admin") {
    return { error: "Seul un super administrateur peut changer les rôles." };
  }

  // Get current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", profileId)
    .single<Profile>();

  if (!profile) return { error: "Profil introuvable." };

  // Validate the role change
  const validation = await validateRoleChange(profileId, profile.role, newRole);
  if (!validation.allowed) return { error: validation.reason };

  // If promoting center_admin → super_admin, unassign their center
  if (profile.role === "center_admin" && newRole === "super_admin") {
    await supabase
      .from("centers")
      .update({ admin_id: null })
      .eq("admin_id", profileId);
  }

  // Update the role
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", profileId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/profiles");
  return { success: true };
}

export async function toggleProfileActive(profileId: string, isActive: boolean) {
  const supabase = await createClient();

  // Verify caller is super_admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "super_admin") {
    return { error: "Seul un super administrateur peut activer/désactiver des comptes." };
  }

  // Cannot deactivate yourself
  if (profileId === user.id && !isActive) {
    return { error: "Vous ne pouvez pas désactiver votre propre compte." };
  }

  // If deactivating a center_admin, warn about their center
  if (!isActive) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", profileId)
      .single<Profile>();

    if (profile?.role === "center_admin") {
      // Also deactivate their center to prevent orphaned centers
      await supabase
        .from("centers")
        .update({ is_active: false })
        .eq("admin_id", profileId);
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/profiles");
  return { success: true };
}

export async function getProfiles(filters?: { role?: UserRole; isActive?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.role) query = query.eq("role", filters.role);
  if (filters?.isActive !== undefined) query = query.eq("is_active", filters.isActive);

  const { data, error, count } = await query;

  if (error) return { error: error.message };

  return { data: data as Profile[], count };
}
