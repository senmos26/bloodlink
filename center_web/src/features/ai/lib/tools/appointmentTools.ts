import { z } from "zod/v3";
import { adminClient, json, daysUntil } from "./utils";

// ── Helpers ──────────────────────────────────────────────────────────

function formatTimeSlot(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function generateTimeSlots(date: string) {
  const selectedDate = new Date(`${date}T00:00:00`);
  const now = new Date();
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();
  const slots: { hour: number; minute: number; label: string; available: boolean }[] = [];

  for (let hour = 8; hour < 16; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (isToday) {
        const slotMinutes = hour * 60 + minute;
        const nowMinutes = now.getHours() * 60 + now.getMinutes() + 60;
        if (slotMinutes < nowMinutes) continue;
      }
      slots.push({ hour, minute, label: formatTimeSlot(hour, minute), available: true });
    }
  }

  return slots;
}

async function getBookedSlotLabels(centerId: string, date: string) {
  const supabase = adminClient();
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

  return ((data ?? []) as { scheduled_date: string }[]).map((row) => {
    const dateValue = new Date(row.scheduled_date);
    return formatTimeSlot(dateValue.getHours(), dateValue.getMinutes());
  });
}

// ── Appointment Tools ────────────────────────────────────────────────

export const appointmentTools = {
  getNextAppointment: {
    description: "Récupère le prochain rendez-vous actif du donneur.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
    }),
    execute: async ({ userId }: { userId: string }) => {
      try {
        const supabase = adminClient();
        const { data, error } = await supabase
          .from("appointments")
          .select("id, scheduled_date, status, alert_id, centers:center_id(name, address, city, phone)")
          .eq("donor_id", userId)
          .in("status", ["pending", "confirmed"])
          .gte("scheduled_date", new Date().toISOString())
          .order("scheduled_date", { ascending: true })
          .limit(1);

        if (error) return "Impossible de récupérer le prochain rendez-vous.";

        return json({ appointment: data?.[0] ?? null });
      } catch {
        return "Impossible de récupérer le prochain rendez-vous.";
      }
    },
  },

  getDonorAppointments: {
    description: "Liste les rendez-vous du donneur avec leur statut et centre.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ userId, limit }: { userId: string; limit?: number }) => {
      try {
        const supabase = adminClient();
        const { data, error } = await supabase
          .from("appointments")
          .select("id, scheduled_date, status, notes, alert_id, centers:center_id(name, address, city, phone)")
          .eq("donor_id", userId)
          .order("scheduled_date", { ascending: false })
          .limit(limit ?? 5);

        if (error) return "Impossible de récupérer les rendez-vous.";

        return json(data ?? []);
      } catch {
        return "Impossible de récupérer les rendez-vous.";
      }
    },
  },

  getAvailableSlots: {
    description:
      "Récupère les créneaux horaires disponibles pour un centre à une date donnée au format YYYY-MM-DD.",
    parameters: z.object({
      centerId: z.string().describe("ID du centre de transfusion"),
      date: z.string().describe("Date au format YYYY-MM-DD"),
    }),
    execute: async ({ centerId, date }: { centerId: string; date: string }) => {
      try {
        const generated = generateTimeSlots(date);
        const booked = await getBookedSlotLabels(centerId, date);
        const slots = generated.map((slot) => ({
          ...slot,
          available: !booked.includes(slot.label),
        }));

        return json({
          date,
          centerId,
          availableSlots: slots.filter((slot) => slot.available),
          unavailableSlots: slots.filter((slot) => !slot.available),
        });
      } catch {
        return "Impossible de récupérer les créneaux disponibles.";
      }
    },
  },

  createAppointment: {
    description: "Prend un rendez-vous pour un donneur dans un centre à une date et heure précises.",
    parameters: z.object({
      userId: z.string().describe("ID du donneur"),
      centerId: z.string().describe("ID du centre"),
      date: z.string().describe("Date au format YYYY-MM-DD"),
      slot: z.string().describe("Heure au format HH:MM"),
      alertId: z.string().optional().describe("ID de l'alerte associée s'il y en a une"),
    }),
    execute: async ({ userId, centerId, date, slot, alertId }: { userId: string; centerId: string; date: string; slot: string; alertId?: string }) => {
      try {
        const supabase = adminClient();
        
        // 1. Vérifier l'éligibilité avant d'insérer
        const { data: profile } = await supabase
          .from("profiles")
          .select("next_donation_date, is_active")
          .eq("id", userId)
          .single();
          
        if (!profile?.is_active) {
          return "Erreur: Le profil est inactif.";
        }
        
        const waitingDays = daysUntil(profile.next_donation_date);
        if (waitingDays > 0) {
          return `Erreur: Prochain don possible à partir du ${profile.next_donation_date} (dans ${waitingDays} jours).`;
        }

        // 2. Combiner la date et l'heure au format ISO
        const scheduledDate = new Date(`${date}T${slot}:00`).toISOString();

        // 3. Insérer le rendez-vous
        const { data, error } = await supabase
          .from("appointments")
          .insert({
            donor_id: userId,
            center_id: centerId,
            scheduled_date: scheduledDate,
            status: "pending",
            alert_id: alertId || null,
          })
          .select("id, scheduled_date, centers:center_id(name)")
          .single();

        if (error) return "Erreur lors de la prise de rendez-vous: " + error.message;

        return json({
          success: true,
          message: "Rendez-vous enregistré avec succès !",
          appointment: data,
        });
      } catch {
        return "Impossible de prendre le rendez-vous.";
      }
    },
  },

  cancelAppointment: {
    description: "Annule un rendez-vous actif du donneur.",
    parameters: z.object({
      userId: z.string().describe("ID du donneur"),
      appointmentId: z.string().describe("ID du rendez-vous à annuler"),
    }),
    execute: async ({ userId, appointmentId }: { userId: string; appointmentId: string }) => {
      try {
        const supabase = adminClient();
        
        // Mettre à jour le statut du RDV à "cancelled"
        const { data, error } = await supabase
          .from("appointments")
          .update({ status: "cancelled" })
          .eq("id", appointmentId)
          .eq("donor_id", userId)
          .select("id, scheduled_date, status, centers:center_id(name)")
          .single();

        if (error) return "Erreur lors de l'annulation: " + error.message;

        return json({
          success: true,
          message: "Rendez-vous annulé avec succès.",
          appointment: data,
        });
      } catch {
        return "Impossible d'annuler le rendez-vous.";
      }
    },
  },
};
