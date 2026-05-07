export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  scheduledDate: string;
  status: AppointmentStatus;
  notes: string | null;
  donorId: string;
  donorFullName: string | null;
  donorPhone: string | null;
  donorBloodType: string | null;
}

export interface AppointmentFormData {
  id: string;
  status: AppointmentStatus;
}
