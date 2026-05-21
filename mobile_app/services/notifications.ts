import { supabase } from "@/services/supabase";

// ── Types ──────────────────────────────────────────────────────────────
export type NotificationType = "alert" | "appointment" | "donation" | "system";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
}

// ── Row type from Supabase ─────────────────────────────────────────────
interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────
function toAppError(error: unknown, fallback: string) {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && "message" in error) {
    return new Error(typeof error.message === "string" ? error.message : fallback);
  }
  return new Error(fallback);
}

/** Temps relatif style Facebook/TikTok : "à l'instant", "il y a 5 min", "hier", etc. */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "à l'instant";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  // Au-delà d'un mois, afficher la date
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

/** Icône MaterialIcons selon le type de notification */
export function getNotificationIcon(type: NotificationType): {
  name: string;
  color: string;
  bgColor: string;
} {
  switch (type) {
    case "alert":
      return { name: "emergency", color: "#b80035", bgColor: "#ffdada" };
    case "appointment":
      return { name: "event", color: "#006591", bgColor: "#c9e6ff" };
    case "donation":
      return { name: "volunteer-activism", color: "#006847", bgColor: "#6ffbbe" };
    case "system":
    default:
      return { name: "info", color: "#5c3f40", bgColor: "#eff4ff" };
  }
}

// ── API ────────────────────────────────────────────────────────────────

/** Récupérer les notifications de l'utilisateur */
export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw toAppError(error, "Impossible de récupérer les notifications.");

  return ((data ?? []) as NotificationRow[]).map(rowToNotification);
}

/** Compter les notifications non lues (pour le badge) */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

/** Marquer une notification comme lue */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) throw toAppError(error, "Impossible de marquer la notification comme lue.");
}

/** Marquer toutes les notifications comme lues */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw toAppError(error, "Impossible de marquer les notifications comme lues.");
}

/** Supprimer une notification */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw toAppError(error, "Impossible de supprimer la notification.");
}

// ── Mapper ─────────────────────────────────────────────────────────────
function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    type: row.type,
    isRead: row.is_read,
    data: row.data,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}
