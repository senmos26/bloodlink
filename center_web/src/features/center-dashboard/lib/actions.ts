"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireCenterAdmin } from "@/shared/lib/auth";
import type { TodayStats, MonthlyDonation, BloodTypeStat } from "@/entities";

export async function getTodayStats(): Promise<TodayStats> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;

  if (!centerId) throw new Error("Centre non trouvé");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_center_today_stats", {
    p_center_id: centerId,
  });

  if (error) throw new Error(error.message);

  return {
    todayAppointmentsCount: data.today_appointments_count ?? 0,
    pendingAppointmentsCount: data.pending_appointments_count ?? 0,
    validatedDonationsCount: data.validated_donations_count ?? 0,
    activeAlertsCount: data.active_alerts_count ?? 0,
    centerName: data.center_name ?? "Mon centre",
  };
}

export async function getMonthlyDonations(
  year?: number
): Promise<MonthlyDonation[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_center_monthly_donations", {
    p_center_id: centerId,
    p_year: year ?? new Date().getFullYear(),
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map((d: Record<string, unknown>) => ({
    month: d.month as number,
    donationCount: d.donation_count as number,
  }));
}

export async function getBloodTypeStats(): Promise<BloodTypeStat[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_center_blood_type_stats", {
    p_center_id: centerId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map((d: Record<string, unknown>) => ({
    bloodType: d.blood_type as string,
    donorCount: d.donor_count as number,
  }));
}
