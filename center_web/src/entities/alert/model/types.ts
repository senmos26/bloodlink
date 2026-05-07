export type AlertStatus = "active" | "expired" | "closed";
export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export interface Alert {
  id: string;
  bloodTypeRequired: string;
  urgencyLevel: UrgencyLevel;
  radiusKm: number;
  message: string | null;
  deadline: string;
  status: AlertStatus;
  createdAt: string;
  isExpired: boolean;
  daysUntilDeadline: number;
  donorsNeeded: number;
  donorsResponded: number;
}

export interface CreateAlertInput {
  bloodTypeRequired: string;
  urgencyLevel: UrgencyLevel;
  radiusKm?: number;
  message?: string;
  deadline?: string;
}
