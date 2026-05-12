import { streamText, type CoreMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { defaultChatModel } from "@/features/ai/lib/models";
import { buildSystemPrompt } from "@/features/ai/lib/prompts";
import { searchKnowledge, formatRagContext } from "@/features/ai/lib/rag";
import { tools } from "@/features/ai/lib/tools";
import { createClient } from "@/shared/lib/supabase/server";

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
  // CORS headers for mobile app
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_MOBILE_APP_URL,
    process.env.NEXT_PUBLIC_DONOR_WEB_URL,
    "http://localhost:8081", // Expo dev client
    "http://localhost:19006", // Expo web
  ].filter(Boolean);

  const isAllowed =
    allowedOrigins.some((o) => o && origin.includes(new URL(o).hostname)) ||
    origin.includes("localhost");

  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { messages, userId, location } = parsed.data;

    // Build donor context from Supabase if userId is provided
    let donorContext: {
      bloodType?: string | null;
      nextDonationDate?: string | null;
      recentDonations?: number;
    } = {};

    if (userId) {
      try {
        const supabase = await createClient(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("blood_type, next_donation_date")
          .eq("id", userId)
          .single();

        const { count } = await supabase
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("donor_id", userId);

        donorContext = {
          bloodType: profile?.blood_type,
          nextDonationDate: profile?.next_donation_date,
          recentDonations: count ?? 0,
        };
      } catch (err) {
        console.warn("Failed to load donor context:", err);
      }
    }

    // RAG: enrich with knowledge base
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");

    let ragContext = "";
    if (lastUserMessage) {
      const results = await searchKnowledge(lastUserMessage.content, {
        limit: 3,
        threshold: 0.55,
      });
      ragContext = formatRagContext(results);
    }

    const systemPrompt = buildSystemPrompt(
      {
        userId,
        bloodType: donorContext.bloodType,
        nextDonationDate: donorContext.nextDonationDate,
        recentDonations: donorContext.recentDonations,
        location: location ?? null,
      },
      ragContext
    );

    // Convert messages to AI SDK format
    const coreMessages: CoreMessage[] = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Tool definitions for the model
    const toolDefs = Object.fromEntries(
      Object.entries(tools).map(([name, tool]) => [
        name,
        {
          description: tool.description,
          parameters: tool.parameters,
        },
      ])
    );

    const result = streamText({
      model: defaultChatModel,
      system: systemPrompt,
      messages: coreMessages,
      tools: toolDefs,
      maxTokens: 800,
      temperature: 0.7,
      async onStepFinish({ toolCalls, toolResults }) {
        // Log tool usage for observability
        if (toolCalls.length > 0) {
          console.log("AI tool calls:", toolCalls.map((t) => t.toolName));
        }
      },
    });

    return result.toDataStreamResponse({
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
