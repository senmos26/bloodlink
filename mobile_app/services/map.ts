import type { BloodType } from "@/services/profile";
import { supabase } from "@/services/supabase";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

interface CenterRow {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude: number | string;
  longitude: number | string;
}

interface AlertWithCenterRow {
  id: string;
  center_id: string;
  blood_type_required: BloodType;
  urgency_level: UrgencyLevel;
  radius_km: number;
  message: string | null;
  deadline: string;
  center_name: string;
  center_city: string;
  center_latitude: number | string;
  center_longitude: number | string;
}

export interface CenterAlert {
  id: string;
  centerId: string;
  bloodTypeRequired: BloodType;
  urgencyLevel: UrgencyLevel;
  radiusKm: number;
  message: string | null;
  deadline: string;
}

export interface MapCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
  alerts: CenterAlert[];
  activeAlertCount: number;
  urgentBloodTypes: BloodType[];
  topUrgency: UrgencyLevel | null;
}

function toAppError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = typeof error.message === "string" ? error.message : fallbackMessage;
    return new Error(message);
  }

  return new Error(fallbackMessage);
}

function toNumber(value: number | string) {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function urgencyRank(level: UrgencyLevel) {
  switch (level) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

export function getUrgencyColor(level: UrgencyLevel | null) {
  switch (level) {
    case "critical":
      return "#b80035";
    case "high":
      return "#dd6b20";
    case "medium":
      return "#006591";
    case "low":
      return "#006847";
    default:
      return "#006591";
  }
}

export async function getMapCenters(): Promise<MapCenter[]> {
  const [centersResult, alertsResult] = await Promise.all([
    supabase
      .from("centers")
      .select("id, name, address, city, phone, latitude, longitude")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("alerts_with_center")
      .select(
        "id, center_id, blood_type_required, urgency_level, radius_km, message, deadline, center_name, center_city, center_latitude, center_longitude"
      )
      .order("deadline", { ascending: true }),
  ]);

  if (centersResult.error) {
    throw toAppError(centersResult.error, "Impossible de récupérer les centres.");
  }

  if (alertsResult.error) {
    throw toAppError(alertsResult.error, "Impossible de récupérer les alertes actives.");
  }

  const alertsByCenter = new Map<string, CenterAlert[]>();

  for (const row of (alertsResult.data ?? []) as AlertWithCenterRow[]) {
    const centerAlerts = alertsByCenter.get(row.center_id) ?? [];
    centerAlerts.push({
      id: row.id,
      centerId: row.center_id,
      bloodTypeRequired: row.blood_type_required,
      urgencyLevel: row.urgency_level,
      radiusKm: row.radius_km,
      message: row.message,
      deadline: row.deadline,
    });
    alertsByCenter.set(row.center_id, centerAlerts);
  }

  return ((centersResult.data ?? []) as CenterRow[])
    .map((center) => {
      const alerts = (alertsByCenter.get(center.id) ?? []).sort((left, right) => {
        const urgencyDiff = urgencyRank(right.urgencyLevel) - urgencyRank(left.urgencyLevel);
        if (urgencyDiff !== 0) {
          return urgencyDiff;
        }

        return new Date(left.deadline).getTime() - new Date(right.deadline).getTime();
      });

      return {
        id: center.id,
        name: center.name,
        address: center.address,
        city: center.city,
        phone: center.phone,
        latitude: toNumber(center.latitude),
        longitude: toNumber(center.longitude),
        alerts,
        activeAlertCount: alerts.length,
        urgentBloodTypes: Array.from(new Set(alerts.map((alert) => alert.bloodTypeRequired))),
        topUrgency: alerts[0]?.urgencyLevel ?? null,
      } satisfies MapCenter;
    })
    .filter((center) => Number.isFinite(center.latitude) && Number.isFinite(center.longitude));
}
