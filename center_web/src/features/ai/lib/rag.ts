import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { RagResult } from "../types";

/**
 * Create a direct admin Supabase client (no cookies) for RAG operations.
 */
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Generate embeddings via Google Generative AI (text-embedding-004).
 * Gratuit, 768 dimensions, rapide.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    // Pas de clé embedding — RAG désactivé silencieusement
    return [];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    embedding: { values: number[] };
  };

  return data.embedding.values;
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
    supabase?: any;
  }
): Promise<RagResult[]> {
  const supabase = options?.supabase ?? createAdminClient();
  const embedding = await generateEmbedding(query);

  if (embedding.length === 0) return []; // no embedding API configured

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
