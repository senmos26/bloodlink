import "server-only";

import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Server Actions, or Route Handlers.
 * Authenticated as the current user, respecting all Row Level Security policies.
 */
export async function createClient(isAdmin = false) {
  if (typeof window !== "undefined") {
    throw new Error("createClient() is server-only. Use a browser client on the client.");
  }

  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");

  const supabaseKey = isAdmin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error(
      isAdmin
        ? "SUPABASE_SERVICE_ROLE_KEY is not set"
        : "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          (
            cookieStore as unknown as {
              set: (opts: { name: string; value: string } & CookieOptions) => void;
            }
          ).set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          (
            cookieStore as unknown as {
              set: (opts: { name: string; value: string } & CookieOptions) => void;
            }
          ).set({ name, value: "", ...options });
        } catch {
          // The `delete` method was called from a Server Component.
        }
      },
    },
  });
}
