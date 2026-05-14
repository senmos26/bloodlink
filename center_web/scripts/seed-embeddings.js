/**
 * Seed embeddings for knowledge_base (run from project root)
 * Usage: node -r dotenv/config scripts/seed-embeddings.js
 */
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free";

if (!API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not set in .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function embed(text) {
  const r = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, input: text }),
  });
  if (!r.ok) throw new Error(`Embedding ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.data[0].embedding;
}

async function main() {
  const { data: rows, error } = await supabase
    .from("knowledge_base")
    .select("id, content")
    .is("embedding", null);

  if (error) throw error;
  if (!rows?.length) {
    console.log("✅ All entries already have embeddings!");
    return;
  }

  console.log(`📝 ${rows.length} entries without embeddings`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      process.stdout.write(`  [${i + 1}/${rows.length}] `);
      const vec = await embed(row.content);
      const { error: e2 } = await supabase
        .from("knowledge_base")
        .update({ embedding: JSON.stringify(vec) })
        .eq("id", row.id);
      if (e2) console.log("✗ DB error:", e2.message);
      else console.log(`✓ ${vec.length}d`);
    } catch (err) {
      console.log("✗", err.message);
    }
    // Rate limit safety
    if (i % 5 === 4 && i < rows.length - 1) {
      process.stdout.write("  ⏳ 2s pause...\n");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log("🎉 Done!");
}

main().catch(console.error);
