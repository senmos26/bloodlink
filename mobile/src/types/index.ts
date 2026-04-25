export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  blood_type?: BloodType;
  role: UserRole;
  created_at: string;
}

export interface Center {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  center_id: string;
  date: string;
  status: DonationStatus;
  notes?: string;
  created_at: string;
}

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type UserRole = "donor" | "center_admin" | "super_admin";

export type DonationStatus = "pending" | "confirmed" | "completed" | "cancelled";
