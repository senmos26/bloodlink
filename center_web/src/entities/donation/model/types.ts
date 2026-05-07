export type DonationStatus = "pending" | "validated" | "rejected";

export interface Donation {
  id: string;
  donorId: string;
  donorFullName: string | null;
  donorBloodType: string | null;
  appointmentId: string | null;
  donationDate: string;
  volumeMl: number | null;
  status: DonationStatus;
  validatedBy: string | null;
  validatedAt: string | null;
  notes: string | null;
}

export interface CreateDonationInput {
  appointmentId: string;
  volumeMl?: number;
  notes?: string;
}
