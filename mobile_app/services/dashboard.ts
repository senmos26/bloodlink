import { supabase } from "@/services/supabase";
import type { BloodType } from "@/services/profile";
import type { UrgencyLevel } from "@/services/map";

// ── Types ──────────────────────────────────────────────────────────────
export interface UrgentAlert {
  id: string;
  bloodType: BloodType;
  urgencyLevel: UrgencyLevel;
  centerName: string;
  centerCity: string;
  message: string | null;
  deadline: string;
}

export interface DonorStats {
  donationCount: number;
  livesSaved: number;
  nextDonationDate: string | null;
  lastDonationDate: string | null;
  bloodType: BloodType | null;
}

export interface NextAppointment {
  id: string;
  scheduledDate: string;
  centerName: string;
  status: string;
}

// ── Helpers ────────────────────────────────────────────────────────────
function toAppError(error: unknown, fallback: string) {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && "message" in error) {
    return new Error(typeof error.message === "string" ? error.message : fallback);
  }
  return new Error(fallback);
}

// ── API ────────────────────────────────────────────────────────────────

/** Récupérer les alertes urgentes actives (pour le dashboard) */
export async function getUrgentAlerts(limit = 5): Promise<UrgentAlert[]> {
  const { data, error } = await supabase
    .from("alerts_with_center")
    .select(
      "id, blood_type_required, urgency_level, deadline, message, center_name, center_city"
    )
    .eq("status", "active")
    .gte("deadline", new Date().toISOString())
    .order("deadline", { ascending: true })
    .limit(limit);

  if (error) throw toAppError(error, "Impossible de récupérer les alertes.");

  return ((data ?? []) as {
    id: string;
    blood_type_required: BloodType;
    urgency_level: UrgencyLevel;
    deadline: string;
    message: string | null;
    center_name: string;
    center_city: string;
  }[]).map((row) => ({
    id: row.id,
    bloodType: row.blood_type_required,
    urgencyLevel: row.urgency_level,
    centerName: row.center_name,
    centerCity: row.center_city,
    message: row.message,
    deadline: row.deadline,
  }));
}

/** Récupérer les stats du donneur */
export async function getDonorStats(donorId: string): Promise<DonorStats> {
  // Profil (blood type, next_donation_date)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("blood_type, next_donation_date")
    .eq("id", donorId)
    .single();

  if (profileError) throw toAppError(profileError, "Impossible de récupérer le profil.");

  // Dons validés
  const { count: donationCount, error: donError } = await supabase
    .from("donations")
    .select("*", { count: "exact", head: true })
    .eq("donor_id", donorId)
    .eq("status", "validated");

  if (donError) throw toAppError(donError, "Impossible de récupérer les dons.");

  // Dernier don
  const { data: lastDon, error: lastDonError } = await supabase
    .from("donations")
    .select("donation_date")
    .eq("donor_id", donorId)
    .eq("status", "validated")
    .order("donation_date", { ascending: false })
    .limit(1);

  if (lastDonError) throw toAppError(lastDonError, "Impossible de récupérer le dernier don.");

  return {
    donationCount: donationCount ?? 0,
    livesSaved: (donationCount ?? 0) * 3, // chaque don sauve ~3 vies
    nextDonationDate: (profile as any)?.next_donation_date ?? null,
    lastDonationDate: lastDon?.[0]?.donation_date ?? null,
    bloodType: (profile as any)?.blood_type ?? null,
  };
}

/** Récupérer le prochain rendez-vous du donneur */
export async function getNextAppointment(donorId: string): Promise<NextAppointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, scheduled_date, status, centers:center_id(name)")
    .eq("donor_id", donorId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_date", new Date().toISOString())
    .order("scheduled_date", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const row = data[0] as any;
  return {
    id: row.id,
    scheduledDate: row.scheduled_date,
    centerName: row.centers?.name ?? "Centre inconnu",
    status: row.status,
  };
}
