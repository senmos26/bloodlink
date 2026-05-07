/**
 * @file Creates a Supabase client for use in client-side components (browser).
 *
 * This client is intended for scenarios where you need to interact with Supabase
 * from a component that has the "use client" directive. It uses environment
 * variables prefixed with `NEXT_PUBLIC_` which are safe to be exposed to the browser.
 *
 * Avoid using this for sensitive operations. For actions like login, signup, or
 * modifying data, always prefer using the server-side client within Server Actions.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates and exports a singleton instance of the Supabase client for the browser.
 *
 * The function reads the Supabase URL and anonymous key from the public
 * environment variables. Using a function ensures that the client is created
 * only when needed and avoids issues with server-side rendering environments.
 *
 * @returns {SupabaseClient} An instance of the Supabase client.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
