"use client";

import { useEffect, useState } from "react";

import { getCurrentAdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types/database";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const context = await getCurrentAdminContext();
        const query =
          context.role === "super_admin"
            ? supabase.from("notifications").select("*")
            : supabase.from("notifications").select("*").eq("user_id", context.profile.id);

        const { data, error: fetchError } = await query.order("created_at", { ascending: false });
        if (fetchError) throw fetchError;
        if (!active) return;

        setNotifications(Array.isArray(data) ? (data as Notification[]) : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Chargement impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  async function handleMarkAsRead(notificationId: string) {
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: now })
        .eq("id", notificationId);

      if (updateError) throw updateError;

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true, read_at: now }
            : notification
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Notifications</h1>
        <p className="mt-2 text-sm text-slate-500">Suivez les notifications disponibles dans Supabase.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : Array.isArray(notifications) && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-2xl border border-slate-200 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{notification.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{notification.body}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${notification.is_read ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-700"}`}>
                    {notification.is_read ? "Lu" : "Non lu"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-wide text-slate-500">
                  <span>Type: {notification.type}</span>
                  <span>Créé le: {new Date(notification.created_at).toLocaleString("fr-FR")}</span>
                  <span>Lu le: {notification.read_at ? new Date(notification.read_at).toLocaleString("fr-FR") : "Non lu"}</span>
                </div>
                {!notification.is_read ? (
                  <button type="button" onClick={() => handleMarkAsRead(notification.id)} className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                    Marquer comme lu
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Aucune notification disponible.</p>
        )}
      </div>
    </div>
  );
}
