import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// ── Groq (primary — 14400 req/jour, ultra rapide) ──
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── Google Gemini (secondary) ──
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// ── OpenRouter (fallback) ──
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://bloodlink.ma",
    "X-Title": "BloodLink AI Assistant",
  },
});

/**
 * Priority: Groq > Gemini > OpenRouter
 * Groq: llama-3.1-8b-instant — très rapide, bon pour le chat mobile, 14400 req/jour gratuit
 */
function pickChatModel() {
  if (process.env.GROQ_API_KEY) {
    return groq("llama-3.1-8b-instant");
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google("gemini-2.0-flash");
  }
  return openrouter.chat("nvidia/nemotron-3-super-120b-a12b:free");
}

export const defaultChatModel = pickChatModel();
export const creativeModel = pickChatModel();
