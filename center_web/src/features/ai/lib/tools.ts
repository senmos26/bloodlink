import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";

/**
 * Tool definitions for the AI assistant.
 * Each tool has a name, description, parameter schema, and execute function.
 */

export const tools = {
  getNearbyCenters: {
    description:
      "Récupère les centres de transfusion sanguine proches d'une localisation donnée.",
    parameters: z.object({
      lat: z.number().describe("Latitude de l'utilisateur"),
      lng: z.number().describe("Longitude de l'utilisateur"),
      limit: z.number().optional().default(5).describe("Nombre de centres à retourner"),
    }),
    execute: async ({ lat, lng, limit }: { lat: number; lng: number; limit: number }) => {
      const supabase = await createClient(true);
      const { data, error } = await supabase.rpc("get_nearby_centers", {
        user_lat: lat,
        user_lng: lng,
        max_distance_km: 50,
        limit_count: limit,
      });
      if (error) return { error: error.message };
      return { centers: data };
    },
  },

  getUrgentAlerts: {
    description: "Récupère les alertes de pénurie de sang actuellement actives.",
    parameters: z.object({
      bloodType: z.string().optional().describe("Filtrer par groupe sanguin spécifique"),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ bloodType, limit }: { bloodType?: string; limit: number }) => {
      const supabase = await createClient(true);
      let query = supabase
        .from("alerts")
        .select("id, title, blood_type, urgency_level, center_id, created_at, centers(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (bloodType) {
        query = query.eq("blood_type", bloodType);
      }

      const { data, error } = await query;
      if (error) return { error: error.message };
      return { alerts: data };
    },
  },

  getUserProfile: {
    description: "Récupère le profil et l'historique de dons de l'utilisateur connecté.",
    parameters: z.object({
      userId: z.string().describe("UUID de l'utilisateur"),
    }),
    execute: async ({ userId }: { userId: string }) => {
      const supabase = await createClient(true);
      const { data, error } = await supabase.rpc("get_my_profile_dashboard", {
        p_user_id: userId,
      });
      if (error) return { error: error.message };
      return { profile: data };
    },
  },
} as const;

export type ToolName = keyof typeof tools;
