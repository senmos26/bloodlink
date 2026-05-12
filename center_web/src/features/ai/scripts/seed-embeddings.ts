/**
 * Seed script: generates embeddings for knowledge_base FAQ entries
 * that have NULL embeddings, using the OpenRouter embedding API.
 *
 * Usage: npx tsx src/features/ai/scripts/seed-embeddings.ts
 */

import { createClient } from "@/shared/lib/supabase/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free";
const BATCH_SIZE = 5; // OpenRouter rate limit safety

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

async function main() {
  if (!OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set");
    process.exit(1);
  }

  console.log("🔍 Fetching FAQ entries without embeddings...");

  // Use service role key directly for script
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: entries, error } = await supabase
    .from("knowledge_base")
    .select("id, content")
    .is("embedding", null);

  if (error) {
    console.error("Failed to fetch entries:", error);
    process.exit(1);
  }

  if (!entries || entries.length === 0) {
    console.log("✅ All entries already have embeddings!");
    process.exit(0);
  }

  console.log(`📝 Found ${entries.length} entries without embeddings`);

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    console.log(
      `🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(entries.length / BATCH_SIZE)}`
    );

    for (const entry of batch) {
      try {
        console.log(`  → Embedding: ${entry.content.substring(0, 60)}...`);
        const embedding = await generateEmbedding(entry.content);

        const { error: updateError } = await supabase
          .from("knowledge_base")
          .update({ embedding: JSON.stringify(embedding) })
          .eq("id", entry.id);

        if (updateError) {
          console.error(`  ✗ Failed to update ${entry.id}:`, updateError);
        } else {
          console.log(`  ✓ Updated ${entry.id} (${embedding.length} dims)`);
        }
      } catch (err) {
        console.error(`  ✗ Failed to embed ${entry.id}:`, err);
      }
    }

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < entries.length) {
      console.log("  ⏳ Waiting 2s before next batch...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("🎉 Seed complete!");
}

main().catch(console.error);
