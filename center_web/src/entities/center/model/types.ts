export interface Center {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  adminId: string;
  adminName: string | null;
  totalDonations: number;
  totalAppointments: number;
  createdAt: string;
}

export type CenterProfile = Center;

export interface TodayStats {
  todayAppointmentsCount: number;
  pendingAppointmentsCount: number;
  validatedDonationsCount: number;
  activeAlertsCount: number;
  centerName: string;
}

export interface MonthlyDonation {
  month: number;
  donationCount: number;
}

export interface BloodTypeStat {
  bloodType: string;
  donorCount: number;
}
