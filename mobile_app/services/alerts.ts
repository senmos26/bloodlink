import { supabase } from "./supabase";

export interface Alert {
  id: string;
  center_id: string;
  center_name: string;
  blood_type_required: string;
  urgency_level: "low" | "medium" | "high" | "critical";
  radius_km: number;
  message: string;
  deadline: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

// Récupérer toutes les alertes actives
export async function getAlerts(): Promise<Alert[]> {
  try {
    const { data, error } = await supabase
      .from("alerts_with_center")
      .select("*")
      .eq("status", "active")
      .order("urgency_level", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw new Error("Impossible de récupérer les alertes");
  }
}

// Récupérer une alerte par son ID
export async function getAlert(id: string): Promise<Alert | null> {
  try {
    const { data, error } = await supabase
      .from("alerts_with_center")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error("Error fetching alert:", error);
    return null;
  }
}

// Créer une nouvelle alerte (pour les centres)
export async function createAlert(alert: Omit<Alert, "id" | "created_at" | "updated_at">): Promise<Alert> {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .insert(alert)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating alert:", error);
    throw new Error("Impossible de créer l'alerte");
  }
}
