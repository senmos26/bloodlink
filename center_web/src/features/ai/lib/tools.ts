import { z } from "zod/v3";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// AI SDK v5 `tool()` is an identity function but has strict Zod v3 typing.
// We define tools as plain objects and cast when passing to streamText.
// This avoids the Zod v4/v3 incompatibility at the type level.

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const sangbotTools = {
  getNearbyCenters: {
    description:
      "Récupère les centres de transfusion sanguine proches d'une localisation donnée.",
    parameters: z.object({
      lat: z.number().describe("Latitude de l'utilisateur"),
      lng: z.number().describe("Longitude de l'utilisateur"),
      limit: z.number().optional().default(5).describe("Nombre de centres à retourner"),
    }),
    execute: async ({ lat, lng, limit }: { lat: number; lng: number; limit?: number }) => {
      try {
        const supabase = adminClient();
        const { data, error } = await supabase.rpc("get_nearby_centers", {
          user_lat: lat,
          user_lng: lng,
          max_distance_km: 50,
          limit_count: limit ?? 5,
        });
        if (error) return "Erreur: " + error.message;
        return JSON.stringify(data);
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
          .from("alerts")
          .select("id, title, blood_type, urgency_level, center_id, created_at, centers(name)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(limit ?? 5);

        if (bloodType) {
          query = query.eq("blood_type", bloodType);
        }

        const { data, error } = await query;
        if (error) return "Erreur: " + error.message;
        return JSON.stringify(data);
      } catch {
        return "Impossible de récupérer les alertes.";
      }
    },
  },
} as const;
