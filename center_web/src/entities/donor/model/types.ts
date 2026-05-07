export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface Donor {
  id: string;
  fullName: string | null;
  phone: string | null;
  bloodType: BloodType | null;
  nextDonationDate: string | null;
  totalDonations: number;
  lastDonationDate: string | null;
}

export interface DonorSearchInput {
  query?: string;
  bloodType?: BloodType;
  limit?: number;
}
