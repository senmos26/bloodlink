import { createClient } from "@/shared/lib/supabase/server";
import { RagResult } from "../types";
import { embeddingModel } from "./models";

/**
 * Generate embeddings via OpenRouter's compatible endpoint.
 * Uses Nomic Embed Text (free tier, 768 dimensions).
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    data: { embedding: number[] }[];
  };

  return data.data[0].embedding;
}

/**
 * Search the knowledge base for semantically similar documents.
 */
export async function searchKnowledge(
  query: string,
  options?: {
    category?: string;
    threshold?: number;
    limit?: number;
  }
): Promise<RagResult[]> {
  const supabase = await createClient(true); // admin client for unrestricted read
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding,
    match_threshold: options?.threshold ?? 0.5,
    match_count: options?.limit ?? 5,
    filter_category: options?.category ?? null,
  });

  if (error) {
    console.error("RAG search error:", error);
    return [];
  }

  return (data ?? []) as RagResult[];
}

/**
 * Format RAG results into a string for injection into the system prompt.
 */
export function formatRagContext(results: RagResult[]): string {
  if (results.length === 0) return "";

  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.content}${r.metadata?.source ? ` (Source: ${r.metadata.source})` : ""}`
    )
    .join("\n\n");
}
