import { createOpenAI } from "@ai-sdk/openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * OpenRouter client compatible with Vercel AI SDK.
 * Uses the free tier models (no credit card required).
 */
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://bloodlink.ma",
    "X-Title": "BloodLink AI Assistant",
  },
});

/**
 * Default chat model: Llama 3.1 8B Instruct (free tier)
 * Fast, good at French, sufficient for FAQ and medical guidance.
 */
export const defaultChatModel = openrouter.chat("meta-llama/llama-3.1-8b-instruct:free");

/**
 * Creative model for social content generation.
 */
export const creativeModel = openrouter.chat("mistralai/mistral-7b-instruct:free");

/**
 * Embedding model for RAG via OpenRouter.
 * Nomic Embed Text v1 (free tier, 768 dimensions).
 */
export const embeddingModel = "nomic-ai/nomic-embed-text-v1";
