"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

// ─── Appointment actions ─────────────────────────────────────────────

export async function updateAppointmentStatus(appointmentId: string, newStatus: AppointmentStatus) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase.rpc("update_appointment_status", {
    p_appointment_id: appointmentId,
    p_new_status: newStatus,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/appointments");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function createDonationFromAppointment(appointmentId: string, volumeMl: number, notes?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data, error } = await supabase.rpc("create_center_donation", {
    p_appointment_id: appointmentId,
    p_volume_ml: volumeMl,
    p_notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/appointments");
  revalidatePath("/admin/donations");
  revalidatePath("/admin/dashboard");
  return { success: true, donationId: data };
}

export async function getAppointments(filters?: {
  status?: AppointmentStatus;
  centerId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("*, profiles:donor_id(full_name, blood_type, phone), centers:center_id(name, address, phone)")
    .order("scheduled_date", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.centerId) query = query.eq("center_id", filters.centerId);
  if (filters?.dateFrom) query = query.gte("scheduled_date", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("scheduled_date", filters.dateTo);

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data };
}
