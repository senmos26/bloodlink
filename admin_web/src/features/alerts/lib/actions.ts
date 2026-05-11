"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AlertStatus, UrgencyLevel } from "@/types/database";

// ─── Alert actions ──────────────────────────────────────────────────

export async function closeAlert(alertId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  // Use the RPC for proper business logic
  const { error } = await supabase.rpc("close_center_alert", {
    p_alert_id: alertId,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/alerts");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function escalateAlert(alertId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase.rpc("escalate_center_alert", {
    p_alert_id: alertId,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/alerts");
  return { success: true };
}

export async function relaunchAlert(alertId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase.rpc("relaunch_center_alert", {
    p_alert_id: alertId,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/alerts");
  return { success: true };
}

export async function getAlertResponses(alertId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_center_alert_responses", {
    p_alert_id: alertId,
  });

  if (error) return { error: error.message };
  return { data };
}

export async function getAlertStats() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_center_alert_stats");

  if (error) return { error: error.message };
  return { data };
}

export async function getAlerts(filters?: {
  status?: AlertStatus;
  urgencyLevel?: UrgencyLevel;
  centerId?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("alerts")
    .select("*, centers(name, city)")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.urgencyLevel) query = query.eq("urgency_level", filters.urgencyLevel);
  if (filters?.centerId) query = query.eq("center_id", filters.centerId);

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data };
}
