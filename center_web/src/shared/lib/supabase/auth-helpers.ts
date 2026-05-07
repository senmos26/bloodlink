/**
 * ==========================================
 * BLOODLINK SUPABASE AUTH HELPERS
 * ==========================================
 * Helper functions for authentication and center context
 */

import { createClient } from "./server";

/**
 * Get the center_id of the current user with profile fallback
 */
export async function getCurrentUserCenter() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("User not authenticated");
  }
  
  // 1. Try user metadata
  const centerIdFromMetadata = user.user_metadata?.center_id || user.user_metadata?.organization_id;
  if (centerIdFromMetadata) {
    return {
      user_id: user.id,
      center_id: centerIdFromMetadata,
      source: 'metadata'
    };
  }

  // 2. Try profile table (More reliable)
  const adminClient = await createClient(true);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("center_id")
    .eq("id", user.id)
    .single();

  if (profile?.center_id) {
    return {
      user_id: user.id,
      center_id: profile.center_id,
      source: 'profile'
    };
  }
  
  // 3. Fallback: If it's a super_admin, they might need a specific center selector
  return {
    user_id: user.id,
    center_id: user.id, // This is a last resort, likely to fail RLS but prevents crash
    source: 'fallback'
  };
}

/**
 * Verify if user has access to a specific center
 */
export async function verifyCenterAccess(targetCenterId: string) {
  const { center_id } = await getCurrentUserCenter();
  
  if (center_id !== targetCenterId) {
    throw new Error("Unauthorized access to this center");
  }
  
  return true;
}

/**
 * Check user type (admin or donor)
 */
export async function getUserType() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("User not authenticated");
  }

  // Use admin client to bypass RLS for role check
  const adminClient = await createClient(true);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, center_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return {
      type: profile.role,
      user_id: user.id,
      center_id: profile.center_id || user.id,
      role: profile.role,
    };
  }

  // Default fallback
  return {
    type: "donor" as const,
    user_id: user.id,
    center_id: null,
    role: "donor",
  };
}
