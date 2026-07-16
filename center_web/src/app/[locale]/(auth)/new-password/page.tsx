"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function NewPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    console.log("[NEW_PASSWORD] useEffect trigger. code query param:", code);
    if (typeof window !== "undefined") {
      console.log("[NEW_PASSWORD] window.location.href:", window.location.href);
      console.log("[NEW_PASSWORD] window.location.hash present:", !!window.location.hash);
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let isMounted = true;

    async function checkSession() {
      console.log("[NEW_PASSWORD] Executing checkSession()");
      
      // 1. Check if session already exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("[NEW_PASSWORD] Initial getSession() result. Session:", !!session, "Error:", sessionError?.message || "none");
      
      if (session && isMounted) {
        console.log("[NEW_PASSWORD] Active session found at startup. Transitioning to setHasSession(true)");
        setHasSession(true);
        setChecking(false);
        return;
      }

      // 2. If no session, check if there is a query code (?code=...)
      if (!session && code) {
        console.log("[NEW_PASSWORD] No session but query code present. Verifying OTP via verifyOtp...");
        try {
          const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: code, type: "recovery" });
          console.log("[NEW_PASSWORD] verifyOtp finished. Error:", otpError?.message || "none");
          
          const refreshed = await supabase.auth.getSession();
          console.log("[NEW_PASSWORD] getSession() after verifyOtp. Session:", !!refreshed.data.session);
          
          if (refreshed.data.session && isMounted) {
            setHasSession(true);
            setChecking(false);
            return;
          }
        } catch (err) {
          console.error("[NEW_PASSWORD] OTP verification crashed:", err);
        }
      }

      // 3. Wait a little bit for the hash parsing if there's a hash in the URL
      if (typeof window !== "undefined" && window.location.hash) {
        console.log("[NEW_PASSWORD] Hash present in URL. Waiting 1.5 seconds for Supabase Client to parse hash...");
        setTimeout(async () => {
          if (!isMounted) return;
          const { data: { session: delayedSession }, error: delayedError } = await supabase.auth.getSession();
          console.log("[NEW_PASSWORD] getSession() after 1.5s delay. Session:", !!delayedSession, "Error:", delayedError?.message || "none");
          
          if (delayedSession) {
            setHasSession(true);
            setChecking(false);
          } else {
            console.log("[NEW_PASSWORD] No session found after 1.5s delay. Treating link as invalid.");
            toast.error("Lien invalide ou expiré.");
            setChecking(false);
          }
        }, 1500);
      } else {
        if (isMounted) {
          console.log("[NEW_PASSWORD] No query code and no hash. Setting checking to false (link invalid).");
          if (!code) {
            toast.error("Lien de réinitialisation invalide ou expiré.");
          } else {
            toast.error("Lien expiré ou invalide. Veuillez réessayer.");
          }
          setChecking(false);
        }
      }
    }

    // Subscribe to auth state changes as a backup
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[NEW_PASSWORD] onAuthStateChange event fired. Event:", event, "Session:", !!session);
      if (session && isMounted) {
        console.log("[NEW_PASSWORD] Session received from onAuthStateChange. Transitioning to setHasSession(true)");
        setHasSession(true);
        setChecking(false);
      }
    });

    checkSession();

    return () => {
      console.log("[NEW_PASSWORD] useEffect cleanup. Unmounting.");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSession) return;
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDone(true);
    toast.success("Mot de passe mis à jour avec succès !");
    setTimeout(() => router.push("/login?message=password_updated"), 2000);
  }

  if (checking) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-light px-4">
        <div className="w-full max-w-sm p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-300 animate-pulse" />
          <p className="mt-4 text-sm text-slate-500">Vérification du lien...</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-light px-4">
        <div className="w-full max-w-sm p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Mot de passe mis à jour</h1>
          <p className="mt-2 text-sm text-slate-500">Redirection vers la page de connexion...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-light px-4">
      <section className="relative z-10 flex w-full max-w-md flex-col items-center justify-center py-12">
        <div className="w-full space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-slate-500"
              onClick={() => router.push("/login")}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retour
            </Button>

            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {hasSession ? (
                  <Lock className="h-6 w-6 text-primary" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                {hasSession ? "Nouveau mot de passe" : "Lien invalide"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {hasSession
                  ? "Choisissez un nouveau mot de passe sécurisé."
                  : "Ce lien de réinitialisation est expiré ou a déjà été utilisé."}
              </p>
            </div>

            {hasSession && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    placeholder="Nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-11"
                />

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function NewPasswordPage() {
  return (
    <React.Suspense fallback={
      <main className="flex min-h-dvh w-full items-center justify-center bg-light px-4">
        <div className="w-full max-w-sm p-8 text-center animate-pulse">
          <Lock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">Chargement...</p>
        </div>
      </main>
    }>
      <NewPasswordForm />
    </React.Suspense>
  );
}
