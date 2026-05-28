import { streamText, stepCountIs } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { defaultChatModel } from "@/features/ai/lib/models";
import { buildSystemPrompt } from "@/features/ai/lib/prompts";
import { searchKnowledge, formatRagContext } from "@/features/ai/lib/rag";
import type { RagResult } from "@/features/ai/types";
import { sangbotTools } from "@/features/ai/lib/tools";
import {
  shouldAnswerDonorProfileDirectly,
  buildDirectDonorProfileAnswer,
  buildLiveDonorContext,
  createTextStreamResponse,
} from "@/features/ai/lib/helpers/chatHelpers";

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

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const reqId = `chat-${t0.toString(36)}`;
  const origin = req.headers.get("origin") ?? "";

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

    // Service role client for server-side data access
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (!userId && authToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(authToken);
      if (!error && data.user?.id) {
        userId = data.user.id;
      }
    }
    console.log(`[${reqId}] 📩 Incoming: "${lastUserMsg.substring(0, 80)}${lastUserMsg.length > 80 ? "…" : ""}" | user=${userId ?? "anon"} | msgs=${messages.length}`);

    // Direct answer for simple profile/eligibility check (fallback/fast-path)
    if (shouldAnswerDonorProfileDirectly(lastUserMsg)) {
      const directAnswer = await buildDirectDonorProfileAnswer({
        supabaseAdmin,
        supabaseUrl,
        anonKey: supabaseAnonKey,
        authToken,
        userId,
      });
      console.log(`[${reqId}] 🩸 Direct profile answer | user=${userId ?? "anon"}`);
      return createTextStreamResponse(directAnswer, corsHeaders);
    }

    // ── 1. Donor context (loaded server-side) ──
    let donorContext: {
      fullName?: string | null;
      bloodType?: string | null;
      nextDonationDate?: string | null;
      recentDonations?: number;
    } = {};

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
      } catch (err) {
        console.warn(`[${reqId}] ⚠️ Donor context failed: ${err}`);
      }
    }

    // ── 2. RAG & Live Context ──
    let ragContext = "";
    if (lastUserMsg) {
      try {
        const results = await searchKnowledge(lastUserMsg, {
          limit: 3,
          threshold: 0.35,
          supabase: supabaseAdmin,
        });
        ragContext = formatRagContext(results);
      } catch (err) {
        console.warn(`[${reqId}] ⚠️ RAG failed: ${err}`);
      }
    }

    const liveContext = await buildLiveDonorContext(userId, lastUserMsg);
    if (liveContext) {
      ragContext = [liveContext, ragContext].filter(Boolean).join("\n\n");
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

    // ── 4. Stream LLM ──
    const chatMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    let totalTokens = 0;
    let toolCalls: string[] = [];
    let finishReason = "unknown";

    const result = streamText({
      model: defaultChatModel as any,
      system: systemPrompt,
      messages: chatMessages,
      tools: sangbotTools as any,
      stopWhen: stepCountIs(3),
      maxRetries: 1,
      maxOutputTokens: 500,
      temperature: 0.3,
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

    const response = result.toUIMessageStreamResponse({
      headers: corsHeaders,
    });

    result.text.then((text: string) => {
      const totalMs = Date.now() - t0;
      console.log(`[${reqId}] ✅ Done | ${totalMs}ms | tokens≈${totalTokens} | tools=${toolCalls.join(",") || "none"} | finish=${finishReason}`);
    }, () => {});

    return response;
  } catch (error) {
    console.error(`[${reqId}] ❌ Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

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
