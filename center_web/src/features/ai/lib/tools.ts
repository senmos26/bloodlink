import { z } from "zod/v3";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// AI SDK v5 `tool()` is an identity function but has strict Zod v3 typing.
// We define tools as plain objects and cast when passing to streamText.
// This avoids the Zod v4/v3 incompatibility at the type level.

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function json(data: unknown) {
  return JSON.stringify(data, null, 2);
}

function daysUntil(date: string | null | undefined) {
  if (!date) return 0;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

export const sangbotTools = {
  getNearbyCenters: {
    description:
      "Récupère les centres de transfusion sanguine proches d'une localisation donnée.",
    parameters: z.object({
      lat: z.number().optional().describe("Latitude de l'utilisateur (alternative)"),
      lng: z.number().optional().describe("Longitude de l'utilisateur (alternative)"),
      latitude: z.number().optional().describe("Latitude de l'utilisateur"),
      longitude: z.number().optional().describe("Longitude de l'utilisateur"),
      limit: z.number().optional().default(5).describe("Nombre de centres à retourner"),
    }),
    execute: async (args: { lat?: number; lng?: number; latitude?: number; longitude?: number; limit?: number }) => {
      try {
        const lat = args.lat ?? args.latitude;
        const lng = args.lng ?? args.longitude;
        const limit = args.limit;

        if (lat === undefined || lng === undefined) {
          return "Erreur: La latitude et la longitude sont requises.";
        }

        const supabase = adminClient();
        const { data, error } = await supabase
          .from("centers")
          .select("id, name, address, city, phone, latitude, longitude")
          .eq("is_active", true);
        if (error) return "Erreur: " + error.message;

        const centers = ((data ?? []) as {
          id: string;
          name: string;
          address: string;
          city: string;
          phone: string;
          latitude: string | number;
          longitude: string | number;
        }[])
          .map((center) => ({
            ...center,
            latitude: Number(center.latitude),
            longitude: Number(center.longitude),
          }))
          .map((center) => ({
            ...center,
            distance_km: Number(distanceKm(lat, lng, center.latitude, center.longitude).toFixed(1)),
          }))
          .sort((a, b) => a.distance_km - b.distance_km)
          .slice(0, limit ?? 5);

        return json(centers);
      } catch {
        return "Impossible de récupérer les centres proches.";
      }
    },
  },

  getUrgentAlerts: {
    description: "Récupère les alertes de pénurie de sang actuellement actives.",
    parameters: z.object({
      bloodType: z.string().optional().describe("Filtrer par groupe sanguin"),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ bloodType, limit }: { bloodType?: string; limit?: number }) => {
      try {
        const supabase = adminClient();
        let query = supabase
          .from("alerts_with_center")
          .select("id, center_id, center_name, center_city, blood_type_required, urgency_level, deadline, message")
          .gte("deadline", new Date().toISOString())
          .order("deadline", { ascending: true })
          .limit(limit ?? 5);

        if (bloodType) {
          query = query.eq("blood_type_required", bloodType);
        }

        const { data, error } = await query;
        if (error) return "Erreur: " + error.message;
        return json(data);
      } catch {
        return "Impossible de récupérer les alertes.";
      }
    },
  },

  checkDonationEligibility: {
    description:
      "Vérifie si un donneur peut prendre rendez-vous pour donner maintenant selon son profil BloodLink.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
    }),
    execute: async ({ userId }: { userId: string }) => {
      try {
        const supabase = adminClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, full_name, blood_type, date_of_birth, weight_kg, next_donation_date, is_active")
          .eq("id", userId)
          .single();

        if (error || !profile) return "Impossible de vérifier l'éligibilité.";

        const missingFields = [
          !profile.blood_type ? "groupe sanguin" : null,
          !profile.date_of_birth ? "date de naissance" : null,
          !profile.weight_kg ? "poids" : null,
        ].filter(Boolean);
        const waitingDays = daysUntil(profile.next_donation_date);
        const eligible = Boolean(profile.is_active) && missingFields.length === 0 && waitingDays === 0;

        return json({
          eligible,
          reason: !profile.is_active
            ? "Compte inactif."
            : missingFields.length > 0
              ? `Profil incomplet: ${missingFields.join(", ")}.`
              : waitingDays > 0
                ? `Prochain don possible dans ${waitingDays} jour${waitingDays > 1 ? "s" : ""}.`
                : "Donneur éligible selon les informations BloodLink disponibles.",
          nextDonationDate: profile.next_donation_date,
          missingFields,
        });
      } catch {
        return "Impossible de vérifier l'éligibilité.";
      }
    },
  },

  getDonorStats: {
    description:
      "Récupère les statistiques donneur: nombre de dons validés, vies aidées, dernier don et prochaine date possible.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
    }),
    execute: async ({ userId }: { userId: string }) => {
      try {
        const supabase = adminClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("blood_type, next_donation_date")
          .eq("id", userId)
          .single();
        const { count, error: countError } = await supabase
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("donor_id", userId)
          .eq("status", "validated");
        const { data: lastDonation, error: lastError } = await supabase
          .from("donations")
          .select("donation_date, volume_ml, centers:center_id(name, city)")
          .eq("donor_id", userId)
          .eq("status", "validated")
          .order("donation_date", { ascending: false })
          .limit(1);

        if (countError || lastError) return "Impossible de récupérer les statistiques donneur.";

        return json({
          donationCount: count ?? 0,
          livesSaved: (count ?? 0) * 3,
          bloodType: profile?.blood_type ?? null,
          nextDonationDate: profile?.next_donation_date ?? null,
          lastDonation: lastDonation?.[0] ?? null,
        });
      } catch {
        return "Impossible de récupérer les statistiques donneur.";
      }
    },
  },

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

  checkAlertCompatibility: {
    description:
      "Vérifie si le donneur peut répondre à une alerte précise selon groupe sanguin, statut de l'alerte et éligibilité.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
      alertId: z.string().describe("ID de l'alerte"),
    }),
    execute: async ({ userId, alertId }: { userId: string; alertId: string }) => {
      try {
        const supabase = adminClient();
        const [{ data: profile }, { data: alert, error: alertError }] = await Promise.all([
          supabase
            .from("profiles")
            .select("blood_type, next_donation_date, is_active")
            .eq("id", userId)
            .single(),
          supabase
            .from("alerts_with_center")
            .select("id, center_id, center_name, center_city, blood_type_required, urgency_level, deadline, status, message")
            .eq("id", alertId)
            .single(),
        ]);

        if (alertError || !alert) return "Alerte introuvable ou inactive.";

        const bloodCompatible = profile?.blood_type === alert.blood_type_required;
        const waitingDays = daysUntil(profile?.next_donation_date);
        const eligible = Boolean(profile?.is_active) && waitingDays === 0;

        return json({
          compatible: bloodCompatible && eligible,
          bloodCompatible,
          eligible,
          reason: !profile?.blood_type
            ? "Groupe sanguin du donneur manquant."
            : !bloodCompatible
              ? `Groupe ${profile.blood_type} non compatible avec l'alerte ${alert.blood_type_required} selon la règle actuelle de l'application.`
              : waitingDays > 0
                ? `Donneur non éligible avant ${profile?.next_donation_date}.`
                : "Donneur compatible avec cette alerte.",
          alert,
        });
      } catch {
        return "Impossible de vérifier la compatibilité avec l'alerte.";
      }
    },
  },

  getPersonalizedUrgentAlerts: {
    description:
      "Récupère les alertes actives pertinentes pour un donneur, avec compatibilité groupe sanguin et éligibilité.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ userId, limit }: { userId: string; limit?: number }) => {
      try {
        const supabase = adminClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("blood_type, next_donation_date, is_active")
          .eq("id", userId)
          .single();
        const { data, error } = await supabase
          .from("alerts_with_center")
          .select("id, center_id, center_name, center_city, blood_type_required, urgency_level, deadline, message")
          .gte("deadline", new Date().toISOString())
          .order("deadline", { ascending: true })
          .limit(limit ?? 5);

        if (error) return "Impossible de récupérer les alertes personnalisées.";

        const waitingDays = daysUntil(profile?.next_donation_date);
        const alerts = (data ?? []).map((alert) => ({
          ...alert,
          bloodCompatible: profile?.blood_type === alert.blood_type_required,
          eligibleNow: Boolean(profile?.is_active) && waitingDays === 0,
        }));

        return json({
          donorBloodType: profile?.blood_type ?? null,
          nextDonationDate: profile?.next_donation_date ?? null,
          alerts,
        });
      } catch {
        return "Impossible de récupérer les alertes personnalisées.";
      }
    },
  },

  checkProfileCompleteness: {
    description: "Vérifie les champs manquants du profil donneur nécessaires aux fonctionnalités BloodLink.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
    }),
    execute: async ({ userId }: { userId: string }) => {
      try {
        const supabase = adminClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, phone, blood_type, date_of_birth, weight_kg, latitude, longitude, is_active")
          .eq("id", userId)
          .single();

        if (error || !profile) return "Impossible de vérifier le profil.";

        const missingFields = [
          !profile.full_name ? "nom complet" : null,
          !profile.phone ? "téléphone" : null,
          !profile.blood_type ? "groupe sanguin" : null,
          !profile.date_of_birth ? "date de naissance" : null,
          !profile.weight_kg ? "poids" : null,
          profile.latitude === null || profile.longitude === null ? "localisation" : null,
        ].filter(Boolean);

        return json({
          complete: missingFields.length === 0,
          active: profile.is_active,
          missingFields,
        });
      } catch {
        return "Impossible de vérifier le profil.";
      }
    },
  },

  getUnreadNotifications: {
    description: "Récupère les notifications non lues du donneur pour les résumer.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ userId, limit }: { userId: string; limit?: number }) => {
      try {
        const supabase = adminClient();
        const { data, error, count } = await supabase
          .from("notifications")
          .select("id, title, body, type, created_at, data", { count: "exact" })
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(limit ?? 5);

        if (error) return "Impossible de récupérer les notifications.";

        return json({
          unreadCount: count ?? data?.length ?? 0,
          notifications: data ?? [],
        });
      } catch {
        return "Impossible de récupérer les notifications.";
      }
    },
  },
} as const;
