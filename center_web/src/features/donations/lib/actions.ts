"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireCenterAdmin } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import type { Donation } from "@/entities";

function mapDonationRow(row: Record<string, unknown>): Donation {
  return {
    id: row.id as string,
    donorId: row.donor_id as string,
    donorFullName: (row.donor_full_name as string) ?? null,
    donorBloodType: (row.donor_blood_type as string) ?? null,
    appointmentId: (row.appointment_id as string) ?? null,
    donationDate: row.donation_date as string,
    volumeMl: (row.volume_ml as number) ?? null,
    status: row.status as Donation["status"],
    validatedBy: (row.validated_by as string) ?? null,
    validatedAt: (row.validated_at as string) ?? null,
    notes: (row.notes as string) ?? null,
  };
}

export async function getTodayDonations(): Promise<Donation[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase.rpc("get_center_donations", {
    p_center_id: centerId,
    p_from_date: today,
    p_to_date: today,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDonationRow);
}

export async function getCompletedAppointments() {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase.rpc("get_center_appointments", {
    p_center_id: centerId,
    p_from_date: today,
    p_to_date: today,
  });

  if (error) throw new Error(error.message);
  const appointments = (data ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    donorId: a.donor_id as string,
    donorFullName: (a.donor_full_name as string) ?? null,
    donorBloodType: (a.donor_blood_type as string) ?? null,
    status: a.status as string,
    scheduledDate: a.scheduled_date as string,
  }));

  return appointments.filter((a: { status: string }) => a.status === "completed");
}

export async function createDonation(formData: FormData) {
  const supabase = await createClient();
  const appointmentId = formData.get("appointmentId") as string;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabase.rpc("create_center_donation", {
    p_appointment_id: appointmentId,
    p_volume_ml: 450,
    p_notes: notes,
  });

  if (error) return { error: error.message };

  revalidatePath("/(dashboard)");
  return { success: true };
}
