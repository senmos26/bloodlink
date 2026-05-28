import { streamText, stepCountIs } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { defaultChatModel } from "@/features/ai/lib/models";
import { buildSystemPrompt } from "@/features/ai/lib/prompts";
import { searchKnowledge, formatRagContext } from "@/features/ai/lib/rag";
import type { RagResult } from "@/features/ai/types";
import { sangbotTools } from "@/features/ai/lib/tools";

const requestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  userId: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional()
    .nullable(),
});

function normalizeIntentText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function daysUntil(date: string | null | undefined) {
  if (!date) return 0;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function createTextStreamResponse(text: string, headers: Record<string, string>) {
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

function shouldAnswerDonorProfileDirectly(message: string) {
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

async function buildDirectDonorProfileAnswer({
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
}) {
  if (!userId) {
    return "Je n'arrive pas à accéder à votre session BloodLink. Reconnectez-vous puis réessayez pour que je puisse vérifier votre profil et votre éligibilité.";
  }

  let { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone, blood_type, date_of_birth, weight_kg, next_donation_date, latitude, longitude, is_active")
    .eq("id", userId)
    .single();

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
    console.warn(`[chat] Direct profile lookup failed: ${error?.message ?? "profile not found"}`);
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
}

async function buildLiveDonorContext(userId: string | undefined, message: string) {
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

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const reqId = `chat-${t0.toString(36)}`;

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      console.warn(`[${reqId}] ❌ Invalid request body`);
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { messages, location } = parsed.data;
    let userId = parsed.data.userId;
    const lastUserMsg = messages.slice().reverse().find((m) => m.role === "user")?.content ?? "";

    // ── 0. Supabase clients ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const authToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    // Service role client for server-side data access (donor profile, donations)
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (!userId) {
      if (authToken) {
        const { data, error } = await supabaseAdmin.auth.getUser(authToken);
        if (!error && data.user?.id) {
          userId = data.user.id;
        }
      }
    }
    console.log(`[${reqId}] 📩 Incoming: "${lastUserMsg.substring(0, 80)}${lastUserMsg.length > 80 ? "…" : ""}" | user=${userId ?? "anon"} | msgs=${messages.length} | origin=${origin || "none"}`);

    if (shouldAnswerDonorProfileDirectly(lastUserMsg)) {
      const directAnswer = await buildDirectDonorProfileAnswer({
        supabaseAdmin,
        supabaseUrl,
        anonKey: supabaseAnonKey,
        authToken,
        userId,
      });
      console.log(`[${reqId}] 🩸 Direct donor profile answer | user=${userId ?? "anon"} | reply="${directAnswer.substring(0, 100)}${directAnswer.length > 100 ? "…" : ""}"`);
      return createTextStreamResponse(directAnswer, corsHeaders);
    }

    // ── 1. Donor context (loaded server-side, injected into prompt) ──
    let donorContext: {
      fullName?: string | null;
      bloodType?: string | null;
      nextDonationDate?: string | null;
      recentDonations?: number;
    } = {};
    const t1 = Date.now();

    if (userId) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("blood_type, full_name, next_donation_date")
          .eq("id", userId)
          .single();

        const { count } = await supabaseAdmin
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("donor_id", userId);

        donorContext = {
          fullName: profile?.full_name,
          bloodType: profile?.blood_type,
          nextDonationDate: profile?.next_donation_date,
          recentDonations: count ?? 0,
        };
        console.log(`[${reqId}] 👤 Donor: name=${donorContext.fullName ?? "?"} | blood=${donorContext.bloodType ?? "?"} | donations=${donorContext.recentDonations} | ${Date.now() - t1}ms`);
      } catch (err) {
        console.warn(`[${reqId}] ⚠️ Donor context failed: ${err}`);
      }
    } else {
      console.log(`[${reqId}] 👤 Anonymous user (no userId)`);
    }

    // ── 2. RAG ──
    const lastUserMessage = messages.slice().reverse().find((m) => m.role === "user");
    let ragContext = "";
    let ragCount = 0;
    const t2 = Date.now();

    if (lastUserMessage) {
      try {
        const ragPromise = searchKnowledge(lastUserMessage.content, {
          limit: 3,
          threshold: 0.35,
          supabase: supabaseAdmin,
        });
        const ragTimeout = new Promise<RagResult[]>((resolve) =>
          setTimeout(() => resolve([]), 1500)
        );
        const results = await Promise.race([ragPromise, ragTimeout]);
        ragContext = formatRagContext(results);
        ragCount = results.length;
        console.log(`[${reqId}] 🔍 RAG: ${ragCount} results | threshold=0.35 | ${Date.now() - t2}ms`);
        if (ragCount > 0) {
          results.forEach((r, i) => {
            console.log(`[${reqId}]   → [${i + 1}] sim=${(r.similarity ?? 0).toFixed(3)} cat=${r.category} "${r.content.substring(0, 60)}…"`);
          });
        }
      } catch (err) {
        console.warn(`[${reqId}] ⚠️ RAG failed (${Date.now() - t2}ms): ${err}`);
      }
    }

    const tLive = Date.now();
    const liveContext = await buildLiveDonorContext(userId, lastUserMsg);
    if (liveContext) {
      ragContext = [liveContext, ragContext].filter(Boolean).join("\n\n");
      console.log(`[${reqId}] 🩸 Live donor context injected | ${liveContext.length} chars | ${Date.now() - tLive}ms`);
    }

    // ── 3. System prompt ──
    const systemPrompt = buildSystemPrompt(
      {
        userId,
        fullName: donorContext.fullName,
        bloodType: donorContext.bloodType,
        nextDonationDate: donorContext.nextDonationDate,
        recentDonations: donorContext.recentDonations,
        location: location ?? null,
      },
      ragContext
    );
    console.log(`[${reqId}] 📝 Prompt: ${systemPrompt.length} chars | RAG context: ${ragContext.length} chars`);

    // ── 4. Stream LLM ──
    const chatMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    const t3 = Date.now();
    let totalTokens = 0;
    let toolCalls: string[] = [];
    let finishReason = "unknown";

    // Tools (getUserProfile removed — donor info is in the system prompt)
    const toolsToUse = sangbotTools;

    const result = streamText({
      model: defaultChatModel as any,
      system: systemPrompt,
      messages: chatMessages,
      tools: toolsToUse as any,
      stopWhen: stepCountIs(3),
      maxRetries: 1,
      maxOutputTokens: 450,
      temperature: 0.4,
      async onStepFinish(step) {
        if (step.toolCalls.length > 0) {
          toolCalls = step.toolCalls.map((t: any) => t.toolName);
          console.log(`[${reqId}] 🔧 Tool calls: ${toolCalls.join(", ")}`);
        }
        if (step.usage) {
          totalTokens += (step.usage.inputTokens ?? 0) + (step.usage.outputTokens ?? 0);
        }
        finishReason = step.finishReason ?? "unknown";
      },
    });

    console.log(`[${reqId}] 🤖 LLM streaming started | ${Date.now() - t3}ms init`);

    // Use toUIMessageStreamResponse for structured SSE stream (compatible with useChat)
    const response = result.toUIMessageStreamResponse({
      headers: corsHeaders,
    });

    // Log completion after stream ends (fire-and-forget)
    result.text.then((text: string) => {
      const totalMs = Date.now() - t0;
      console.log(`[${reqId}] ✅ Done | ${totalMs}ms total | tokens≈${totalTokens} | tools=${toolCalls.length > 0 ? toolCalls.join(",") : "none"} | finish=${finishReason} | reply="${text.substring(0, 100)}${text.length > 100 ? "…" : ""}"`);
    }, () => {});

    return response;
  } catch (error) {
    const totalMs = Date.now() - t0;
    console.error(`[${reqId}] ❌ Error (${totalMs}ms):`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Explicit OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
