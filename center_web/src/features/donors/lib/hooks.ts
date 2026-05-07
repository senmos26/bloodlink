import { useQuery } from "@tanstack/react-query";
import { searchDonors } from "@/features/donors/lib/actions";
import type { Donor, BloodType } from "@/entities";

export function useSearchDonors(query: string, bloodType?: BloodType) {
  return useQuery<Donor[]>({
    queryKey: ["donors", "search", query, bloodType],
    queryFn: () => searchDonors(query, bloodType),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60,
  });
}
