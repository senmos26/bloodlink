import { z } from "zod/v3";
import { adminClient, json, distanceKm, daysUntil } from "./utils";

export const centerTools = {
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
};
