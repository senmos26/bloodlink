import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTodayAppointments,
  getPendingAppointments,
  getAllAppointments,
  updateAppointmentStatus,
} from "@/features/appointments/lib/actions";
import type { Appointment, AppointmentStatus } from "@/entities";

export function useTodayAppointments(dateStr?: string) {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", "today", dateStr],
    queryFn: () => getTodayAppointments(dateStr),
    staleTime: 1000 * 30,
  });
}

export function usePendingAppointments() {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", "pending"],
    queryFn: () => getPendingAppointments(),
    staleTime: 1000 * 30,
  });
}

export function useAllAppointments() {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", "all"],
    queryFn: () => getAllAppointments(),
    staleTime: 1000 * 30,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentStatus;
    }) => {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("status", status);
      return updateAppointmentStatus(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["center", "today-stats"] });
    },
  });
}
