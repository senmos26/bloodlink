import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";

async function handler(request: Request) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  const reqUrl = new URL(request.url);
  const target = new URL("/login", reqUrl.origin);
  if (error) {
    target.searchParams.set("error", "deconnexion");
  }
  // 303 ensures the browser follows with a GET even though this was a POST
  return NextResponse.redirect(target, 303);
}

export { handler as POST, handler as GET };
