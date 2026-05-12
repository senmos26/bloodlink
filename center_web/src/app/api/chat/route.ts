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

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const reqId = `chat-${t0.toString(36)}`;

  // CORS headers for mobile app / Expo web
  const origin = req.headers.get("origin") ?? "";
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": isLocalhost ? origin : "",
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

    const { messages, userId, location } = parsed.data;
    const lastUserMsg = messages.slice().reverse().find((m) => m.role === "user")?.content ?? "";
    console.log(`[${reqId}] 📩 Incoming: "${lastUserMsg.substring(0, 80)}${lastUserMsg.length > 80 ? "…" : ""}" | user=${userId ?? "anon"} | msgs=${messages.length} | origin=${origin || "none"}`);

    // ── 0. Supabase clients ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Service role client for server-side data access (donor profile, donations)
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

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
          setTimeout(() => resolve([]), 5000)
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
      stopWhen: stepCountIs(5),
      maxRetries: 1,
      maxOutputTokens: 800,
      temperature: 0.7,
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
