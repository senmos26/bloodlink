import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { defaultLocale, locales, type Locale } from "@/shared/config/i18n";

/**
 * Detects the user's locale from cookies or returns default locale
 */
function getLocaleFromCookies(request: Request): Locale {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return defaultLocale;

  // next-intl stores locale in NEXT_LOCALE cookie
  const localeMatch = cookieHeader.match(/NEXT_LOCALE=([^;]+)/);
  if (localeMatch) {
    const locale = localeMatch[1];
    if (locales.includes(locale as Locale)) {
      return locale as Locale;
    }
  }
  return defaultLocale;
}

/**
 * Ensures the path has a locale prefix
 */
function ensureLocaleInPath(path: string, locale: Locale): string {
  // If path already has a locale prefix, return as is
  if (locales.some(l => path.startsWith(`/${l}/`) || path === `/${l}`)) {
    return path;
  }
  // Add locale prefix
  return `/${locale}${path}`;
}

// Only allow safe relative redirects
function getSafeNext(nextParam: string | null, locale: Locale): string {
  if (
    typeof nextParam === "string" &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//")
  ) {
    return ensureLocaleInPath(nextParam, locale);
  }
  return `/${locale}/`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const locale = getLocaleFromCookies(request);
  const next = getSafeNext(url.searchParams.get("next"), locale);
  console.log("[auth/callback] received code:", Boolean(code), "next:", next, "locale:", locale);

  if (!code) {
    const target = new URL(`/${locale}/login?error=missing_code`, url.origin);
    return NextResponse.redirect(target);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchange error:", error.message);
    const target = new URL(
      `/${locale}/login?error=${encodeURIComponent(
        "Lien de confirmation invalide ou expiré."
      )}`,
      url.origin
    );
    return NextResponse.redirect(target);
  }

  // Touch the user's profile row so updated_at reflects this account change
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  } catch (e) {
    console.warn(
      "[auth/callback] profile touch failed:",
      (e as Error)?.message
    );
  }

  // Add success message to the redirect URL
  const target = new URL(next, url.origin);
  target.searchParams.set("message", "email_confirmed");
  
  // Note: NextResponse.rewrite() is not supported in route handlers.
  // Using redirect() is the correct approach. The session cookie is set by the
  // exchangeCodeForSession call above, which completes before this redirect.
  return NextResponse.redirect(target);
}
