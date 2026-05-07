import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTodayStats,
  getMonthlyDonations,
  getBloodTypeStats,
} from "@/features/center-dashboard/lib/actions";
import type { TodayStats, MonthlyDonation, BloodTypeStat } from "@/entities";

export function useTodayStats() {
  return useQuery<TodayStats>({
    queryKey: ["center", "today-stats"],
    queryFn: () => getTodayStats(),
    staleTime: 1000 * 60,
  });
}

export function useMonthlyDonations(year?: number) {
  return useQuery<MonthlyDonation[]>({
    queryKey: ["center", "monthly-donations", year],
    queryFn: () => getMonthlyDonations(year),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBloodTypeStats() {
  return useQuery<BloodTypeStat[]>({
    queryKey: ["center", "blood-type-stats"],
    queryFn: () => getBloodTypeStats(),
    staleTime: 1000 * 60 * 5,
  });
}
