import { createBrowserClient } from "@supabase/ssr";

/**
 * Singleton Supabase client for browser-side usage.
 * Uses @supabase/ssr for proper cookie-based session management.
 */
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createSupabaseBrowserClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
