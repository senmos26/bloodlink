"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Wrap in Suspense because useSearchParams() requires it for static rendering
export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-full max-w-sm p-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-slate-300 animate-pulse" />
            <p className="mt-4 text-sm text-slate-500">Chargement...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </React.Suspense>
  );
}

function ResetPasswordContent() {
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

  // Supabase browser client auto-exchanges ?code= on creation via PKCE.
  // If that fails, we fallback to verifyOtp with the code as token_hash.
  React.useEffect(() => {
    async function init() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let { data: { session } } = await supabase.auth.getSession();

      // If auto-exchange didn't give us a session, try verifyOtp fallback
      if (!session && code) {
        await supabase.auth.verifyOtp({ token_hash: code, type: "recovery" });
        // Re-check session after verifyOtp
        const refreshed = await supabase.auth.getSession();
        session = refreshed.data.session;
      }

      if (session) {
        setHasSession(true);
      } else if (!code) {
        toast.error("Lien de réinitialisation invalide ou expiré.");
      } else {
        toast.error("Lien expiré ou invalide. Veuillez réessayer.");
      }
      setChecking(false);
    }
    init();
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
    setTimeout(() => router.push("/login"), 2000);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-300 animate-pulse" />
          <p className="mt-4 text-sm text-slate-500">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Mot de passe mis à jour</h1>
          <p className="mt-2 text-sm text-slate-500">Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm p-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-slate-500"
          onClick={() => router.push("/login")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Retour
        </Button>

        <div className="text-center mb-8">
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
  );
}
