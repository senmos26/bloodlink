"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DonationStatus } from "@/types/database";

// ─── Donation actions ───────────────────────────────────────────────

export async function validateDonation(donationId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("donations")
    .update({
      status: "validated",
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    })
    .eq("id", donationId);

  if (error) return { error: error.message };

  revalidatePath("/admin/donations");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function rejectDonation(donationId: string, reason?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("donations")
    .update({
      status: "rejected",
      validated_by: user.id,
      validated_at: new Date().toISOString(),
      notes: reason || "Rejeté par l'administrateur",
    })
    .eq("id", donationId);

  if (error) return { error: error.message };

  revalidatePath("/admin/donations");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function getDonations(filters?: {
  status?: DonationStatus;
  centerId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("donations")
    .select("*, profiles:donor_id(full_name, blood_type), centers:center_id(name, city)")
    .order("donation_date", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.centerId) query = query.eq("center_id", filters.centerId);
  if (filters?.dateFrom) query = query.gte("donation_date", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("donation_date", filters.dateTo);

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data };
}
