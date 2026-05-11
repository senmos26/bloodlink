import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const publicRoutes = ["/login", "/register", "/api"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes: no auth check needed
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return NextResponse.next();
  }

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Create Supabase SSR client to detect session cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().filter((c) => c.name.startsWith("sb-"));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // No session → redirect to login
  if (error || !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  // No profile or inactive → sign out and redirect
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Compte désactivé");
    return NextResponse.redirect(loginUrl);
  }

  // donor → not allowed in admin
  if (profile.role === "donor") {
    await supabase.auth.signOut();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Accès réservé aux administrateurs");
    return NextResponse.redirect(loginUrl);
  }

  // center_admin → redirect to center_web (they should use center_web, not admin_web)
  if (profile.role === "center_admin") {
    const centerWebUrl = process.env.NEXT_PUBLIC_CENTER_WEB_URL || "/login";
    const redirectUrl = new URL(centerWebUrl);
    return NextResponse.redirect(redirectUrl);
  }

  // super_admin → access granted
  return response;
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
