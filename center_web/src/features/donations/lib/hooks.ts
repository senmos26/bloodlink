import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTodayDonations,
  getCompletedAppointments,
  createDonation,
  verifyDonationQR,
  type QRVerificationResult,
} from "@/features/donations/lib/actions";
import type { Donation } from "@/entities";

export function useTodayDonations() {
  return useQuery<Donation[]>({
    queryKey: ["donations", "today"],
    queryFn: () => getTodayDonations(),
    staleTime: 1000 * 30,
  });
}

export function useCompletedAppointments() {
  return useQuery({
    queryKey: ["appointments", "completed"],
    queryFn: () => getCompletedAppointments(),
    staleTime: 1000 * 30,
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      notes,
    }: {
      appointmentId: string;
      notes?: string;
    }) => {
      const formData = new FormData();
      formData.append("appointmentId", appointmentId);
      if (notes) formData.append("notes", notes);
      const res = await createDonation(formData);
      if (res && "error" in res && res.error) {
        throw new Error(res.error);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["center", "today-stats"] });
    },
  });
}

export function useVerifyDonationQR() {
  const queryClient = useQueryClient();

  return useMutation<
    QRVerificationResult,
    Error,
    { donorId: string; timestamp: number }
  >({
    mutationFn: async ({ donorId, timestamp }) =>
      verifyDonationQR(donorId, timestamp),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["donations"] });
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.invalidateQueries({ queryKey: ["center", "today-stats"] });
      }
    },
  });
}
