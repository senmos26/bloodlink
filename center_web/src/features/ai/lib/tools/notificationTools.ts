import { z } from "zod/v3";
import { adminClient, json } from "./utils";

export const notificationTools = {
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

  markNotificationsAsRead: {
    description: "Marque les notifications non lues de l'utilisateur comme lues.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
      notificationIds: z.array(z.string()).optional().describe("Liste optionnelle d'IDs de notifications spécifiques. Si vide, toutes les notifications de l'utilisateur seront marquées comme lues."),
    }),
    execute: async ({ userId, notificationIds }: { userId: string; notificationIds?: string[] }) => {
      try {
        const supabase = adminClient();
        let query = supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", userId);

        if (notificationIds && notificationIds.length > 0) {
          query = query.in("id", notificationIds);
        } else {
          query = query.eq("is_read", false);
        }

        const { data, error } = await query.select("id");
        if (error) return "Erreur lors du marquage des notifications: " + error.message;

        return json({
          success: true,
          message: `${data?.length ?? 0} notification(s) marquée(s) comme lue(s).`,
        });
      } catch {
        return "Impossible de mettre à jour les notifications.";
      }
    },
  },
};
