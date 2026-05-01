import { supabase } from "@/services/supabase";

// ── Types ──────────────────────────────────────────────────────────────
export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  donorId: string;
  centerId: string;
  centerName: string;
  centerAddress: string;
  centerPhone: string;
  alertId: string | null;
  scheduledDate: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
  available: boolean;
}

export interface AppointmentSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  centerId: string;
}

export interface CreateAppointmentParams {
  centerId: string;
  scheduledDate: string;
  alertId?: string;
  notes?: string;
}

// ── Row types from Supabase ────────────────────────────────────────────
interface AppointmentRow {
  id: string;
  donor_id: string;
  center_id: string;
  alert_id: string | null;
  scheduled_date: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

interface AppointmentWithCenterRow extends AppointmentRow {
  centers: {
    name: string;
    address: string;
    phone: string;
  } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────
function toAppError(error: unknown, fallback: string) {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && "message" in error) {
    return new Error(typeof error.message === "string" ? error.message : fallback);
  }
  return new Error(fallback);
}

function formatTimeSlot(hour: number, minute: number): string {
  const h = hour.toString().padStart(2, "0");
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m}`;
}

// ── Time slots generation ──────────────────────────────────────────────
// Centres ouverts de 08h à 16h, créneaux de 30 min
const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 16;
const SLOT_INTERVAL_MIN = 30;

export function generateTimeSlots(date: Date): TimeSlot[] {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const slots: TimeSlot[] = [];

  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL_MIN) {
      // Si c'est aujourd'hui, on ne montre que les créneaux futurs (+1h marge)
      if (isToday) {
        const slotMinutes = h * 60 + m;
        const nowMinutes = now.getHours() * 60 + now.getMinutes() + 60;
        if (slotMinutes < nowMinutes) continue;
      }

      const label = formatTimeSlot(h, m);
      slots.push({ hour: h, minute: m, label, available: true });
    }
  }

  return slots;
}

// ── API ────────────────────────────────────────────────────────────────

/** Créer un rendez-vous */
export async function createAppointment(
  donorId: string,
  params: CreateAppointmentParams,
): Promise<Appointment> {
  const insert = {
    donor_id: donorId,
    center_id: params.centerId,
    scheduled_date: params.scheduledDate,
    alert_id: params.alertId ?? null,
    notes: params.notes ?? null,
    status: "pending" as AppointmentStatus,
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(insert)
    .select("id, donor_id, center_id, alert_id, scheduled_date, status, notes, created_at, centers:center_id(name, address, phone)")
    .single();

  if (error) throw toAppError(error, "Impossible de créer le rendez-vous.");
  if (!data) throw new Error("Aucune donnée retournée après création.");

  return rowToAppointment(data as unknown as AppointmentWithCenterRow);
}

/** Récupérer les rendez-vous du donneur */
export async function getDonorAppointments(donorId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, donor_id, center_id, alert_id, scheduled_date, status, notes, created_at, centers:center_id(name, address, phone)")
    .eq("donor_id", donorId)
    .order("scheduled_date", { ascending: true });

  if (error) throw toAppError(error, "Impossible de récupérer vos rendez-vous.");

  return ((data ?? []) as unknown as AppointmentWithCenterRow[]).map(rowToAppointment);
}

/** Annuler un rendez-vous */
export async function cancelAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (error) throw toAppError(error, "Impossible d'annuler le rendez-vous.");
}

/** Compter les créneaux déjà pris pour un centre à une date donnée */
export async function getBookedSlots(centerId: string, date: string): Promise<string[]> {
  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;

  const { data, error } = await supabase
    .from("appointments")
    .select("scheduled_date")
    .eq("center_id", centerId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_date", startOfDay)
    .lte("scheduled_date", endOfDay);

  if (error) return [];

  // Retourne les labels des créneaux occupés (ex: ["08:00", "09:30"])
  return ((data ?? []) as { scheduled_date: string }[]).map((row) => {
    const d = new Date(row.scheduled_date);
    return formatTimeSlot(d.getHours(), d.getMinutes());
  });
}

// ── Mapper ─────────────────────────────────────────────────────────────
function rowToAppointment(row: AppointmentWithCenterRow): Appointment {
  const center = row.centers;
  return {
    id: row.id,
    donorId: row.donor_id,
    centerId: row.center_id,
    centerName: center?.name ?? "Centre inconnu",
    centerAddress: center?.address ?? "",
    centerPhone: center?.phone ?? "",
    alertId: row.alert_id,
    scheduledDate: row.scheduled_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
