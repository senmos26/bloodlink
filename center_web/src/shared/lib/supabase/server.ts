import "server-only";
/**
 * @file Creates Supabase clients for server-side usage.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Server Actions, or Route Handlers.
 *
 * This function is designed to be called in a server-side context where it can access
 * the request's cookies. It creates a client that is authenticated as the
 * current user, respecting all Row Level Security policies.
 *
 * @param {boolean} [isAdmin=false] - If true, creates an admin client with elevated privileges.
 * @returns A Supabase client instance.
 *
 * @example
 * // In a Server Component
 * const supabase = createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 *
 * @example
 * // In a Server Action
 * "use server";
 * import { createClient } from '@/shared/lib/supabase/server';
 *
 * export async function updateUser(formData) {
 *   const supabase = createClient();
 *   // ...
 * }
 */
export async function createClient(
  isAdmin = false,
  options: { noCache?: boolean } = {}
) {
  // Guard against accidental client-side usage
  if (typeof window !== "undefined") {
    throw new Error(
      "createClient() is server-only. Use a browser client on the client."
    );
  }

  // In newer Next.js versions `cookies()` may be typed as returning a Promise.
  // Awaiting works for both Promise and non-Promise return types.
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

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
  if (isAdmin && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set for admin client.");
  }

  // Define fetch options based on the noCache flag
  const fetchOptions: RequestInit | undefined = options.noCache
    ? { cache: "no-store" }
    : undefined;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // `ReadonlyRequestCookies` may not expose `set` in some contexts.
          // Use a safe cast via unknown to call when available.
          (
            cookieStore as unknown as {
              set: (
                opts: { name: string; value: string } & CookieOptions
              ) => void;
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
              set: (
                opts: { name: string; value: string } & CookieOptions
              ) => void;
            }
          ).set({ name, value: "", ...options });
        } catch {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
    ...(fetchOptions && {
      global: {
        fetch: (url, config) => fetch(url, { ...config, ...fetchOptions }),
      },
    }),
  });
}

/**
 * Creates a Supabase client that always authenticates requests with a specific JWT.
 *
 * @remarks
 * This bypasses cookie-based session detection and is intended for backend-to-backend
 * calls (e.g. FastAPI → Next.js → Supabase) where the JWT is provided explicitly
 * in the Authorization header.
 *
 * Row-Level Security will see the request as the user represented by the JWT.
 */
export function createClientWithJwt(jwtToken: string) {
  // Guard against accidental client-side usage
  if (typeof window !== "undefined") {
    throw new Error(
      "createClientWithJwt() is server-only. Use a browser client on the client."
    );
  }

  if (!jwtToken || jwtToken.trim().length === 0) {
    throw new Error("jwtToken must be a non-empty string");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  });
}
