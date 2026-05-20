"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireCenterAdmin } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Alert, UrgencyLevel, AlertStatus } from "@/entities";

const CreateAlertSchema = z.object({
  blood_type_required: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  urgency_level: z.enum(["low", "medium", "high", "critical"]),
  message: z.string().min(1),
  radius_km: z.coerce.number().min(1).max(100),
  donors_needed: z.coerce.number().min(0).max(100).optional(),
});

function mapAlertRow(row: Record<string, unknown>): Alert {
  return {
    id: row.id as string,
    bloodTypeRequired: row.blood_type_required as string,
    urgencyLevel: row.urgency_level as UrgencyLevel,
    radiusKm: row.radius_km as number,
    message: (row.message as string) ?? null,
    deadline: row.deadline as string,
    status: row.status as AlertStatus,
    createdAt: row.created_at as string,
    isExpired: row.is_expired as boolean,
    daysUntilDeadline: row.days_until_deadline as number,
    donorsNeeded: (row.donors_needed as number) ?? 0,
    donorsResponded: (row.donors_responded as number) ?? 0,
  };
}

export interface AlertFilters {
  status?: AlertStatus | "all";
  bloodType?: string;
  urgencyLevel?: UrgencyLevel | "all";
  searchTerm?: string;
}

export async function getActiveAlerts(): Promise<Alert[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_filtered_center_alerts", {
    p_center_id: centerId,
    p_status_filter: "active",
    p_blood_type: null,
    p_urgency_level: null,
    p_search_term: null,
  });
  if (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
  return (data ?? []).map(mapAlertRow);
}

export async function getFilteredAlerts(filters: AlertFilters): Promise<Alert[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) throw new Error("Aucun centre associé à ce compte.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_filtered_center_alerts", {
    p_center_id: centerId,
    p_status_filter: filters.status && filters.status !== "all" ? filters.status : null,
    p_blood_type: filters.bloodType && filters.bloodType !== "all" ? filters.bloodType : null,
    p_urgency_level: filters.urgencyLevel && filters.urgencyLevel !== "all" ? filters.urgencyLevel : null,
    p_search_term: filters.searchTerm || null,
  });
  if (error) {
    console.error("Error fetching filtered alerts:", error);
    return [];
  }
  return (data ?? []).map(mapAlertRow);
}

export async function getAllAlerts(): Promise<Alert[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_filtered_center_alerts", {
    p_center_id: centerId,
    p_status_filter: null,
    p_blood_type: null,
    p_urgency_level: null,
    p_search_term: null,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAlertRow);
}

export interface AlertStats {
  totalActive: number;
  criticalCount: number;
  responseRate: number;
  avgResponseTime: number;
  expiredToday: number;
  donorsResponded: number;
}

export async function getAlertStats(): Promise<AlertStats> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) {
    throw new Error("Aucun centre associé à ce compte.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_center_alert_stats", {
    p_center_id: centerId,
  });
  if (error || !data) {
    console.error("Error fetching alert stats:", error);
    return { totalActive: 0, criticalCount: 0, responseRate: 0, avgResponseTime: 0, expiredToday: 0, donorsResponded: 0 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalActive: Number(row?.active_alerts ?? 0),
    criticalCount: Number(row?.critical_alerts ?? 0),
    responseRate: Number(row?.response_rate ?? 0),
    avgResponseTime: 0,
    expiredToday: Number(row?.expired_alerts ?? 0),
    donorsResponded: Number(row?.total_donors_responded ?? 0),
  };
}

export async function createAlert(formData: FormData) {
  const { center } = await requireCenterAdmin();
  if (!center) {
    throw new Error("Seuls les administrateurs de centre peuvent créer des alertes.");
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateAlertSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Données invalides");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_center_alert", {
    p_blood_type_required: parsed.data.blood_type_required,
    p_urgency_level: parsed.data.urgency_level,
    p_radius_km: parsed.data.radius_km,
    p_message: parsed.data.message,
    p_donors_needed: parsed.data.donors_needed ?? 0,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/alerts");
  revalidatePath("/");
  return { success: true };
}

export async function closeAlert(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_center_alert", {
    p_alert_id: id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/alerts");
  revalidatePath("/");
}

export async function escalateAlert(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("escalate_center_alert", {
    p_alert_id: id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/alerts");
  revalidatePath("/");
}

export interface AlertResponse {
  responseId: string;
  alertId: string;
  donorId: string;
  donorFullName: string;
  donorBloodType: string | null;
  respondedAt: string;
  status: string;
}

export async function getAlertResponses(alertId?: string): Promise<AlertResponse[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  let query = supabase.rpc("get_center_alert_responses", {
    p_center_id: centerId,
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching alert responses:", error);
    return [];
  }

  const rows = (data ?? []).filter((r: Record<string, unknown>) =>
    alertId ? r.alert_id === alertId : true
  );

  return rows.map((r: Record<string, unknown>) => ({
    responseId: r.response_id as string,
    alertId: r.alert_id as string,
    donorId: r.donor_id as string,
    donorFullName: r.donor_full_name as string,
    donorBloodType: r.donor_blood_type as string | null,
    respondedAt: r.responded_at as string,
    status: r.status as string,
  }));
}

export async function relaunchAlert(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("relaunch_center_alert", {
    p_alert_id: id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/alerts");
  return { newAlertId: data as string };
}

function generateShortCode(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function shareAlert(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const shortCode = generateShortCode();
  // Expiration par défaut: 30 jours
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const { data, error } = await supabase
    .from("alert_shares")
    .insert({
      short_code: shortCode,
      original_url: `/alert/${id}`,
      share_data: { alert_id: id },
      user_id: user?.id,
      expires_at: expiresAt,
    })
    .select("short_code")
    .single();

  if (error) throw new Error(error.message);

  const returnedCode = (data as { short_code?: string })?.short_code;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bloodlink.app";
  return { url: `${baseUrl}/s/${returnedCode}` };
}

export async function getActiveAlertsCount(): Promise<number> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("center_id", centerId)
    .eq("status", "active");

  if (error) return 0;
  return count ?? 0;
}
