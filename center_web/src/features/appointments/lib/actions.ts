"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireCenterAdmin } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Appointment } from "@/entities";

const UpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

function mapAppointmentRow(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    scheduledDate: row.scheduled_date as string,
    status: row.status as Appointment["status"],
    notes: (row.notes as string) ?? null,
    donorId: row.donor_id as string,
    donorFullName: (row.donor_full_name as string) ?? null,
    donorPhone: (row.donor_phone as string) ?? null,
    donorBloodType: (row.donor_blood_type as string) ?? null,
  };
}

export async function getTodayAppointments(dateStr?: string): Promise<Appointment[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const targetDate = dateStr || new Date().toLocaleDateString("en-CA");

  const { data, error } = await supabase.rpc("get_center_appointments", {
    p_center_id: centerId,
    p_from_date: targetDate,
    p_to_date: targetDate,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAppointmentRow);
}

export async function getPendingAppointments(): Promise<Appointment[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_center_appointments", {
    p_center_id: centerId,
  });

  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const appointments: Appointment[] = (rows as Record<string, unknown>[]).map(mapAppointmentRow);
  return appointments.filter((appt: Appointment) => appt.status === "pending");
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_center_appointments", {
    p_center_id: centerId,
  });

  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return (rows as Record<string, unknown>[]).map(mapAppointmentRow);
}

export async function updateAppointmentStatus(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = UpdateStatusSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_appointment_status", {
    p_appointment_id: parsed.data.id,
    p_new_status: parsed.data.status,
  });

  if (error) return { error: error.message };

  revalidatePath("/(dashboard)");
  return { success: true };
}
