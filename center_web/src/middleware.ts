import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { locales, defaultLocale } from "@/shared/config/i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
  alternateLinks: true,
});

const publicRoutes = ["login", "forgot-password", "new-password", "email-confirmation"];

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let next-intl handle locale redirect first (e.g. / -> /fr/)
  const localeMatch = pathname.match(/^\/([^\/]+)/);
  const locale = localeMatch ? localeMatch[1] : defaultLocale;

  // If no valid locale prefix, let intl middleware handle it
  if (!locales.includes(locale as "fr" | "en" | "de" | "es")) {
    return intlMiddleware(request);
  }

  // Public routes: no auth check needed
  const isPublic = publicRoutes.some((route) =>
    pathname.startsWith(`/${locale}/${route}`)
  );

  // Create a response object that both intl middleware and Supabase can use
  const response = intlMiddleware(request);

  if (isPublic) {
    return response;
  }

  // Use Supabase SSR client to properly detect session cookies
  // Cookie names are project-ref based: sb-<ref>-auth-token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().filter(
          (c) => c.name.startsWith("sb-")
        );
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  console.log(`[MW] Path: ${pathname} | User: ${user?.id || 'none'} | Error: ${error?.message || 'none'}`);

  if (error || !user) {
    if (!isPublic) {
      console.log(`[MW] 🛑 No user, redirecting to login`);
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Verify project-specific role (center_admin or super_admin) and account active
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  console.log(`[MW] Profile: ${JSON.stringify(profile)} | Error: ${profileError?.message || 'none'}`);

  if (!profile || profile.role !== "center_admin") {
    console.log(`[MW] 🛑 Invalid role: ${profile?.role || 'none'}, signing out`);
    // If user is logged in but not a center admin, sign them out and redirect
    await supabase.auth.signOut();
    const loginUrl = new URL(`/${locale}/login`, request.url);
    if (profile?.role === "donor") {
      loginUrl.searchParams.set("error", "Les donneurs doivent utiliser l'application mobile.");
    } else if (profile?.role === "super_admin") {
      loginUrl.searchParams.set("error", "Les super admins doivent utiliser le portail d'administration générale.");
    } else {
      loginUrl.searchParams.set("error", "Accès réservé aux administrateurs de centre.");
    }
    return NextResponse.redirect(loginUrl);
  }

  if (!profile.is_active) {
    console.log(`[MW] 🛑 Account deactivated`);
    await supabase.auth.signOut();
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log(`[MW] ✅ Access granted`);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
