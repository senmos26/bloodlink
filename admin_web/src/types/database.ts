export type UserRole = "donor" | "center_admin" | "super_admin";

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type AlertStatus = "active" | "expired" | "closed";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type DonationStatus = "pending" | "validated" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  blood_type: BloodType | null;
  date_of_birth: string | null;
  weight_kg: number | null;
  role: UserRole;
  is_active: boolean;
  next_donation_date: string | null;
  fcm_token: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Center {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  admin_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  center_id: string;
  blood_type_required: BloodType;
  urgency_level: UrgencyLevel;
  radius_km: number;
  message: string | null;
  deadline: string;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
}

export interface AlertWithCenter extends Alert {
  center_name: string;
  center_city: string;
  center_latitude: number;
  center_longitude: number;
}

export interface Appointment {
  id: string;
  donor_id: string;
  center_id: string;
  alert_id: string | null;
  scheduled_date: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentFull extends Appointment {
  donor_name: string;
  donor_blood_type: BloodType | null;
  donor_phone: string;
  center_name: string;
  center_address: string;
  center_phone: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  center_id: string;
  appointment_id: string | null;
  donation_date: string;
  volume_ml: number;
  status: DonationStatus;
  validated_by: string | null;
  validated_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: "alert" | "appointment" | "donation" | "system";
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
}
