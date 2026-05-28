import { z } from "zod/v3";
import { adminClient, json, daysUntil } from "./utils";

export const profileTools = {
  checkDonationEligibility: {
    description:
      "Vérifie si un donneur peut prendre rendez-vous pour donner maintenant selon son profil BloodLink.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
    }),
    execute: async ({ userId }: { userId: string }) => {
      try {
        const supabase = adminClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, full_name, blood_type, date_of_birth, weight_kg, next_donation_date, is_active")
          .eq("id", userId)
          .single();

        if (error || !profile) return "Impossible de vérifier l'éligibilité.";

        const missingFields = [
          !profile.blood_type ? "groupe sanguin" : null,
          !profile.date_of_birth ? "date de naissance" : null,
          !profile.weight_kg ? "poids" : null,
        ].filter(Boolean);
        const waitingDays = daysUntil(profile.next_donation_date);
        const eligible = Boolean(profile.is_active) && missingFields.length === 0 && waitingDays === 0;

        return json({
          eligible,
          reason: !profile.is_active
            ? "Compte inactif."
            : missingFields.length > 0
              ? `Profil incomplet: ${missingFields.join(", ")}.`
              : waitingDays > 0
                ? `Prochain don possible dans ${waitingDays} jour${waitingDays > 1 ? "s" : ""}.`
                : "Donneur éligible selon les informations BloodLink disponibles.",
          nextDonationDate: profile.next_donation_date,
          missingFields,
        });
      } catch {
        return "Impossible de vérifier l'éligibilité.";
      }
    },
  },

  checkProfileCompleteness: {
    description: "Vérifie les champs manquants du profil donneur nécessaires aux fonctionnalités BloodLink.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
    }),
    execute: async ({ userId }: { userId: string }) => {
      try {
        const supabase = adminClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, phone, blood_type, date_of_birth, weight_kg, latitude, longitude, is_active")
          .eq("id", userId)
          .single();

        if (error || !profile) return "Impossible de vérifier le profil.";

        const missingFields = [
          !profile.full_name ? "nom complet" : null,
          !profile.phone ? "téléphone" : null,
          !profile.blood_type ? "groupe sanguin" : null,
          !profile.date_of_birth ? "date de naissance" : null,
          !profile.weight_kg ? "poids" : null,
          profile.latitude === null || profile.longitude === null ? "localisation" : null,
        ].filter(Boolean);

        return json({
          complete: missingFields.length === 0,
          active: profile.is_active,
          missingFields,
        });
      } catch {
        return "Impossible de vérifier le profil.";
      }
    },
  },

  updateUserProfile: {
    description: "Met à jour les champs du profil du donneur (ex: poids_kg, phone, groupe sanguin, date de naissance).",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
      fullName: z.string().optional().describe("Nom complet"),
      phone: z.string().optional().describe("Numéro de téléphone"),
      bloodType: z.string().optional().describe("Groupe sanguin (ex: A+, B-, O+, etc.)"),
      dateOfBirth: z.string().optional().describe("Date de naissance au format YYYY-MM-DD"),
      weightKg: z.number().optional().describe("Poids en kilogrammes"),
    }),
    execute: async ({ userId, fullName, phone, bloodType, dateOfBirth, weightKg }: { userId: string; fullName?: string; phone?: string; bloodType?: string; dateOfBirth?: string; weightKg?: number }) => {
      try {
        const supabase = adminClient();
        const updates: any = {};
        
        if (fullName !== undefined) updates.full_name = fullName;
        if (phone !== undefined) updates.phone = phone;
        if (bloodType !== undefined) updates.blood_type = bloodType;
        if (dateOfBirth !== undefined) updates.date_of_birth = dateOfBirth;
        if (weightKg !== undefined) updates.weight_kg = weightKg;

        if (Object.keys(updates).length === 0) {
          return "Aucune information à mettre à jour.";
        }

        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", userId)
          .select("full_name, phone, blood_type, date_of_birth, weight_kg")
          .single();

        if (error) return "Erreur lors de la mise à jour: " + error.message;

        return json({
          success: true,
          message: "Profil mis à jour avec succès !",
          profile: data,
        });
      } catch {
        return "Impossible de mettre à jour le profil.";
      }
    },
  },

  getDonorStats: {
    description:
      "Récupère les statistiques donneur: nombre de dons validés, vies aidées, dernier don et prochaine date possible.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
    }),
    execute: async ({ userId }: { userId: string }) => {
      try {
        const supabase = adminClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("blood_type, next_donation_date")
          .eq("id", userId)
          .single();
        const { count, error: countError } = await supabase
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("donor_id", userId)
          .eq("status", "validated");
        const { data: lastDonation, error: lastError } = await supabase
          .from("donations")
          .select("donation_date, volume_ml, centers:center_id(name, city)")
          .eq("donor_id", userId)
          .eq("status", "validated")
          .order("donation_date", { ascending: false })
          .limit(1);

        if (countError || lastError) return "Impossible de récupérer les statistiques donneur.";

        return json({
          donationCount: count ?? 0,
          livesSaved: (count ?? 0) * 3,
          bloodType: profile?.blood_type ?? null,
          nextDonationDate: profile?.next_donation_date ?? null,
          lastDonation: lastDonation?.[0] ?? null,
        });
      } catch {
        return "Impossible de récupérer les statistiques donneur.";
      }
    },
  },

  getDonationHistory: {
    description: "Récupère la liste détaillée de l'historique des dons (validés, en attente ou rejetés) du donneur.",
    parameters: z.object({
      userId: z.string().describe("ID Supabase du donneur"),
      limit: z.number().optional().default(10),
    }),
    execute: async ({ userId, limit }: { userId: string; limit?: number }) => {
      try {
        const supabase = adminClient();
        const { data, error } = await supabase
          .from("donations")
          .select("id, donation_date, volume_ml, status, centers:center_id(name, city)")
          .eq("donor_id", userId)
          .order("donation_date", { ascending: false })
          .limit(limit ?? 10);

        if (error) return "Impossible de récupérer l'historique des dons.";

        return json(data ?? []);
      } catch {
        return "Impossible de récupérer l'historique des dons.";
      }
    },
  },
};
