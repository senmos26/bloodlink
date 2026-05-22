"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireCenterAdmin } from "@/shared/lib/auth";
import type { Donor, BloodType } from "@/entities";

function mapDonorRow(row: Record<string, unknown>): Donor {
  return {
    id: row.id as string,
    fullName: (row.full_name as string) ?? null,
    phone: (row.phone as string) ?? null,
    bloodType: (row.blood_type as BloodType) ?? null,
    nextDonationDate: (row.next_donation_date as string) ?? null,
    totalDonations: (row.total_donations as number) ?? 0,
    lastDonationDate: (row.last_donation_date as string) ?? null,
  };
}

export async function searchDonors(
  query: string,
  bloodType?: BloodType
): Promise<Donor[]> {
  const { center } = await requireCenterAdmin();
  const centerId = center?.id;
  if (!centerId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_center_donors", {
    p_center_id: centerId,
    p_query: query || "",
    p_blood_type: bloodType ?? null,
    p_limit: 50,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDonorRow);
}
