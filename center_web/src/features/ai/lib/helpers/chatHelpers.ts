import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sangbotTools } from "../tools";

// ── Helpers ──────────────────────────────────────────────────────────

export function normalizeIntentText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

export function daysUntil(date: string | null | undefined): number {
  if (!date) return 0;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function createTextStreamResponse(text: string, headers: Record<string, string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "text-delta", delta: text })}\n\n`)
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// ── Direct Profiling Checks ──────────────────────────────────────────

export function shouldAnswerDonorProfileDirectly(message: string): boolean {
  const text = normalizeIntentText(message);
  return hasAny(text, [
    "eligible",
    "elligible",
    "eligibilite",
    "peux donner",
    "peut donner",
    "donner aujourd",
    "donner du sang",
    "profil",
    "manque",
    "complet",
    "incomplet",
    "prendre rendez",
    "prendre rdv",
    "bloque",
  ]);
}

export async function buildDirectDonorProfileAnswer({
  supabaseAdmin,
  supabaseUrl,
  anonKey,
  authToken,
  userId,
}: {
  supabaseAdmin: any;
  supabaseUrl: string;
  anonKey: string;
  authToken?: string;
  userId: string | undefined;
}): Promise<string> {
  if (!userId) {
    return "Je n'arrive pas à accéder à votre session BloodLink. Reconnectez-vous puis réessayez pour que je puisse vérifier votre profil et votre éligibilité.";
  }

  let profile: any = null;
  let error: any = null;

  try {
    const firstQuery = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone, blood_type, date_of_birth, weight_kg, next_donation_date, latitude, longitude, is_active")
      .eq("id", userId)
      .single();
    profile = firstQuery.data;
    error = firstQuery.error;

    if ((error || !profile) && authToken) {
      const supabaseUserClient = createSupabaseClient(supabaseUrl, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      });
      const fallback = await supabaseUserClient
        .from("profiles")
        .select("full_name, phone, blood_type, date_of_birth, weight_kg, next_donation_date, latitude, longitude, is_active")
        .eq("id", userId)
        .single();
      profile = fallback.data;
      error = fallback.error;
    }

    if (error || !profile) {
      return "Je n'arrive pas à récupérer votre profil BloodLink pour le moment. Vérifiez que vous êtes connecté, puis réessayez.";
    }

    const missingFields = [
      !profile.full_name ? "nom complet" : null,
      !profile.phone ? "téléphone" : null,
      !profile.blood_type ? "groupe sanguin" : null,
      !profile.date_of_birth ? "date de naissance" : null,
      !profile.weight_kg ? "poids" : null,
      profile.latitude === null || profile.longitude === null ? "localisation" : null,
    ].filter(Boolean);
    const waitingDays = daysUntil(profile.next_donation_date);
    const canDonate = Boolean(profile.is_active) && missingFields.length === 0 && waitingDays === 0;

    if (canDonate) {
      return `Oui, votre profil BloodLink semble complet et vous êtes éligible pour donner du sang maintenant. Votre groupe sanguin est ${profile.blood_type}. Vous pouvez passer à la réservation d'un rendez-vous.`;
    }

    const reasons = [];
    if (!profile.is_active) reasons.push("votre compte n'est pas actif");
    if (missingFields.length > 0) reasons.push(`il manque : ${missingFields.join(", ")}`);
    if (waitingDays > 0) {
      reasons.push(`votre prochain don est possible à partir du ${profile.next_donation_date}`);
    }

    return `Pas encore. ${reasons.join("; ")}. Complétez ces informations dans votre profil BloodLink avant de prendre rendez-vous.`;
  } catch (err: any) {
    throw new Error(`[buildDirectDonorProfileAnswer Error] ${err.message || err}. State - profile: ${JSON.stringify(profile)}, error: ${JSON.stringify(error)}`);
  }
}

// ── Live Donor Context Generator ─────────────────────────────────────

export async function buildLiveDonorContext(userId: string | undefined, message: string): Promise<string> {
  if (!userId) return "";

  const text = normalizeIntentText(message);
  const sections: string[] = [];
  const toolSet = sangbotTools as any;

  const wantsEligibility = hasAny(text, [
    "eligible",
    "elligible",
    "eligibilite",
    "peux donner",
    "peut donner",
    "donner aujourd",
    "donner du sang",
    "prochain don",
    "prendre rendez",
    "prendre rdv",
    "bloque",
  ]);
  const wantsProfile = hasAny(text, [
    "profil",
    "manque",
    "complet",
    "incomplet",
    "renseigne",
  ]);
  const wantsStats = hasAny(text, [
    "combien de dons",
    "nombre de dons",
    "vies",
    "sauve",
    "stat",
    "resume donneur",
    "dernier don",
    "historique don",
  ]);
  const wantsAppointments = hasAny(text, [
    "rendez-vous",
    "rdv",
    "appointment",
    "prochain rendez",
    "mes rendez",
  ]);
  const wantsAlerts = hasAny(text, [
    "alerte",
    "alertes",
    "compatible",
    "urgence",
    "penurie",
  ]);
  const wantsNotifications = hasAny(text, [
    "notification",
    "notifications",
    "non lue",
    "non lues",
  ]);

  if (wantsEligibility) {
    sections.push(`Éligibilité donneur:\n${await toolSet.checkDonationEligibility.execute({ userId })}`);
  }
  if (wantsProfile) {
    sections.push(`Profil donneur:\n${await toolSet.checkProfileCompleteness.execute({ userId })}`);
  }
  if (wantsStats) {
    sections.push(`Statistiques donneur:\n${await toolSet.getDonorStats.execute({ userId })}`);
    sections.push(`Historique des dons:\n${await toolSet.getDonationHistory.execute({ userId })}`);
  }
  if (wantsAppointments) {
    sections.push(`Prochain rendez-vous:\n${await toolSet.getNextAppointment.execute({ userId })}`);
    sections.push(`Rendez-vous récents:\n${await toolSet.getDonorAppointments.execute({ userId, limit: 5 })}`);
  }
  if (wantsAlerts) {
    sections.push(`Alertes personnalisées:\n${await toolSet.getPersonalizedUrgentAlerts.execute({ userId, limit: 5 })}`);
  }
  if (wantsNotifications) {
    sections.push(`Notifications non lues:\n${await toolSet.getUnreadNotifications.execute({ userId, limit: 5 })}`);
  }

  return sections.length > 0 ? `Données BloodLink temps réel:\n${sections.join("\n\n")}` : "";
}
