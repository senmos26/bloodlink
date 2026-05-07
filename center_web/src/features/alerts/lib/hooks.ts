import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveAlerts,
  getFilteredAlerts,
  getAllAlerts,
  getAlertStats,
  createAlert,
  closeAlert,
  escalateAlert,
  getActiveAlertsCount,
  type AlertFilters,
  type AlertStats,
} from "@/features/alerts/lib/actions";
import type { Alert, UrgencyLevel, AlertStatus } from "@/entities";

export function useActiveAlerts() {
  return useQuery<Alert[]>({
    queryKey: ["alerts", "active"],
    queryFn: () => getActiveAlerts(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useFilteredAlerts(filters: {
  status: AlertStatus | "all";
  bloodType: string;
  urgencyLevel: UrgencyLevel | "all";
  searchTerm: string;
}) {
  return useQuery<Alert[]>({
    queryKey: ["alerts", "filtered", filters],
    queryFn: () => getFilteredAlerts(filters as AlertFilters),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 60,
  });
}

export function useAllAlerts() {
  return useQuery<Alert[]>({
    queryKey: ["alerts", "all"],
    queryFn: () => getAllAlerts(),
    staleTime: 1000 * 60,
  });
}

export function useAlertStats() {
  return useQuery<AlertStats>({
    queryKey: ["alerts", "stats"],
    queryFn: () => getAlertStats(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useActiveAlertsCount() {
  return useQuery<number>({
    queryKey: ["alerts", "active-count"],
    queryFn: () => getActiveAlertsCount(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => createAlert(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["center", "today-stats"] });
    },
  });
}

export function useCloseAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => closeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["center", "today-stats"] });
    },
  });
}

export function useEscalateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => escalateAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
