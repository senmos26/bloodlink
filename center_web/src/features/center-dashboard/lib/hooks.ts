import { useQuery } from "@tanstack/react-query";
import {
  getTodayStats,
  getMonthlyDonations,
  getBloodTypeStats,
} from "@/features/center-dashboard/lib/actions";
import type { TodayStats, MonthlyDonation, BloodTypeStat } from "@/entities";

const EMPTY_TODAY_STATS: TodayStats = {
  todayAppointmentsCount: 0,
  pendingAppointmentsCount: 0,
  validatedDonationsCount: 0,
  activeAlertsCount: 0,
  centerName: "",
};

export function useTodayStats() {
  return useQuery<TodayStats>({
    queryKey: ["center", "today-stats"],
    queryFn: async () => {
      try {
        return await getTodayStats();
      } catch (error) {
        console.error("Failed to load today stats", error);
        return EMPTY_TODAY_STATS;
      }
    },
    staleTime: 1000 * 60,
  });
}

export function useMonthlyDonations(year?: number) {
  return useQuery<MonthlyDonation[]>({
    queryKey: ["center", "monthly-donations", year],
    queryFn: async () => {
      try {
        return await getMonthlyDonations(year);
      } catch (error) {
        console.error("Failed to load monthly donations", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useBloodTypeStats() {
  return useQuery<BloodTypeStat[]>({
    queryKey: ["center", "blood-type-stats"],
    queryFn: async () => {
      try {
        return await getBloodTypeStats();
      } catch (error) {
        console.error("Failed to load blood type stats", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}
