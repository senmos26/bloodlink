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
  const { data, error } = await supabase.rpc("get_center_alerts", {
    p_center_id: centerId,
    p_status_filter: "active",
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
  if (!centerId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_center_alerts", {
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
  const { data, error } = await supabase.rpc("get_center_alerts", {
    p_center_id: centerId,
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
    return { totalActive: 0, criticalCount: 0, responseRate: 0, avgResponseTime: 0, expiredToday: 0, donorsResponded: 0 };
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
    totalActive: Number(row?.total_active ?? 0),
    criticalCount: Number(row?.critical_count ?? 0),
    responseRate: Number(row?.response_rate ?? 0),
    avgResponseTime: Number(row?.avg_response_hours ?? 0),
    expiredToday: Number(row?.expired_today ?? 0),
    donorsResponded: Number(row?.total_donors_responded ?? 0),
  };
}

export async function createAlert(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateAlertSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_center_alert", {
    p_blood_type_required: parsed.data.blood_type_required,
    p_urgency_level: parsed.data.urgency_level,
    p_radius_km: parsed.data.radius_km,
    p_message: parsed.data.message,
    p_donors_needed: parsed.data.donors_needed ?? 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/alerts");
  revalidatePath("/");
  return { success: true };
}

export async function closeAlert(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_center_alert", {
    p_alert_id: id,
  });

  if (error) return { error: error.message };

  revalidatePath("/alerts");
  revalidatePath("/");
  return { success: true };
}

export async function escalateAlert(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("escalate_center_alert", {
    p_alert_id: id,
  });

  if (error) return { error: error.message };

  revalidatePath("/alerts");
  revalidatePath("/");
  return { success: true };
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
