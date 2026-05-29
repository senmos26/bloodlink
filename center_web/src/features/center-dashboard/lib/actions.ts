"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireCenterAdmin } from "@/shared/lib/auth";
import type { TodayStats, MonthlyDonation, BloodTypeStat } from "@/entities";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    dateOnly: start.toISOString().slice(0, 10),
    nextDateOnly: end.toISOString().slice(0, 10),
  };
}

export async function getTodayStats(): Promise<TodayStats> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;

  if (!centerId) throw new Error("Centre non trouvé");

  const supabase = await createClient();
  const { startIso, endIso, dateOnly, nextDateOnly } = getTodayRange();
  const [
    todayAppointmentsResult,
    pendingAppointmentsResult,
    validatedDonationsResult,
    activeAlertsResult,
    centerResult,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("center_id", centerId)
      .gte("scheduled_date", dateOnly)
      .lt("scheduled_date", nextDateOnly),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("center_id", centerId)
      .eq("status", "pending")
      .gte("scheduled_date", dateOnly)
      .lt("scheduled_date", nextDateOnly),
    supabase
      .from("donations")
      .select("*", { count: "exact", head: true })
      .eq("center_id", centerId)
      .eq("status", "validated")
      .gte("donation_date", startIso)
      .lt("donation_date", endIso),
    supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("center_id", centerId)
      .eq("status", "active"),
    supabase.from("centers").select("name").eq("id", centerId).single(),
  ]);

  const firstError =
    todayAppointmentsResult.error ||
    pendingAppointmentsResult.error ||
    validatedDonationsResult.error ||
    activeAlertsResult.error ||
    centerResult.error;

  if (firstError) throw new Error(firstError.message);
  return {
    todayAppointmentsCount: todayAppointmentsResult.count ?? 0,
    pendingAppointmentsCount: pendingAppointmentsResult.count ?? 0,
    validatedDonationsCount: validatedDonationsResult.count ?? 0,
    activeAlertsCount: activeAlertsResult.count ?? 0,
    centerName: centerResult.data?.name ?? "Mon centre",
  };
}

export async function getMonthlyDonations(
  year?: number
): Promise<MonthlyDonation[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const targetYear = year ?? new Date().getFullYear();
  const yearStart = `${targetYear}-01-01T00:00:00.000Z`;
  const yearEnd = `${targetYear + 1}-01-01T00:00:00.000Z`;
  const { data, error } = await supabase
    .from("donations")
    .select("donation_date")
    .eq("center_id", centerId)
    .eq("status", "validated")
    .gte("donation_date", yearStart)
    .lt("donation_date", yearEnd);

  if (error) throw new Error(error.message);

  const monthlyCounts = new Map<number, number>();
  for (const donation of data ?? []) {
    const month = new Date(String(donation.donation_date)).getMonth() + 1;
    monthlyCounts.set(month, (monthlyCounts.get(month) ?? 0) + 1);
  }

  return Array.from(monthlyCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, donationCount]) => ({
      month,
      donationCount,
    }));
}

export async function getBloodTypeStats(): Promise<BloodTypeStat[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("donor_id")
    .eq("center_id", centerId);

  if (error) throw new Error(error.message);

  const donorIds = Array.from(
    new Set(
      (appointments ?? [])
        .map((appointment) => appointment.donor_id)
        .filter((donorId): donorId is string => Boolean(donorId))
    )
  );

  if (donorIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("blood_type")
    .in("id", donorIds)
    .eq("role", "donor")
    .not("blood_type", "is", null);

  if (profilesError) throw new Error(profilesError.message);

  const counts = new Map<string, number>();
  for (const profile of profiles ?? []) {
    const bloodType = profile.blood_type as string | null;
    if (!bloodType) continue;
    counts.set(bloodType, (counts.get(bloodType) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([bloodType, donorCount]) => ({
      bloodType,
      donorCount,
    }));
}
