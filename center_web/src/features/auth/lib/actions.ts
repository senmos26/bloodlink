/**
 * @file Contains server actions for the authentication feature.
 * These actions handle backend logic for login, signup, etc., and are
 * designed to be called directly from client-side forms.
 */
"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export interface FormState {
  errorKey?: string | null;
  success?: boolean;
  message?: string | null; // deprecated, use errorKey
}

/**
 * Helper to determine the site URL for redirects.
 */
async function getSiteURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set on Vercel exports
    "http://localhost:3000";
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
}

/**
 * Server action to handle user login.
 * It signs in the user with email and password using Supabase.
 * On success, it redirects to the dashboard. On failure, it returns an error key.
 *
 * @param prevState - The previous state of the form, used by `useFormState`.
 * @param formData - The data submitted from the form.
 * @returns An object with an errorKey for translation, or redirects on success.
 */
export async function login(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  console.log("[LOGIN] Starting login process...");
  
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
    console.log("[LOGIN] Supabase client created successfully");
  } catch (err) {
    console.error("[LOGIN] Supabase server client init failed:", err);
    return { errorKey: "auth.serverErrors.unknownError" };
  }

  const emailRaw = (formData.get("email") ?? "") as string;
  const password = (formData.get("password") ?? "") as string;
  const email = emailRaw.trim().toLowerCase();

  console.log("[LOGIN] Attempting login for email:", email);

  if (!email || !password) {
    console.log("[LOGIN] Missing email or password");
    return { errorKey: "auth.serverErrors.fieldsRequired" };
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[LOGIN] Login Error:", error.message);
    return { errorKey: "auth.serverErrors.invalidCredentials" };
  }

  if (!authData.user) {
    console.error("[LOGIN] No user returned after login");
    return { errorKey: "auth.serverErrors.invalidCredentials" };
  }

  console.log("[LOGIN] Login successful for user:", authData.user.id);
  console.log("[LOGIN] User email:", authData.user.email);
  console.log("[LOGIN] Session exists:", !!authData.session);

  const locale = await getLocale();

  // Check role: only center_admin and super_admin can access Centre app
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profile?.role !== "center_admin" && profile?.role !== "super_admin") {
    await supabase.auth.signOut();
    return { errorKey: "auth.serverErrors.unauthorized" };
  }

  redirect(`/${locale}/`);
}

/**
 * Server action to initiate Google OAuth sign in.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const siteUrl = await getSiteURL();
  const callbackUrl = `${siteUrl}api/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("Google Sign In Error:", error.message);
    throw new Error("auth.serverErrors.oauthFailed");
  }

  if (data.url) {
    redirect(data.url);
  }
}

// ---- Sign Up / Reset Password / Update Password actions are temporarily
// commented out because the SignUpSchema import from @/entities was removed
// during cleanup. Re-enable by adding a local Zod schema if needed.

// export type SignUpResult =
//   | { ok: true; status: "confirm_email" | "signed_up"; successKey?: string }
//   | { ok: false; errorKey: string; fieldErrors?: Record<string, string> };

// export async function signUp(formData: FormData): Promise<SignUpResult> { ... }
// function mapSupabaseErrorToKey(original: string): string { ... }
// export async function resetPassword(...) { ... }
// export async function updatePassword(...) { ... }

/**
 * Server action to handle user sign out.
 * It signs out the current user and redirects to the login page.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect(`/${locale}/login`);
}
