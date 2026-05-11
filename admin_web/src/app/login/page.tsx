"use client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { signIn } from "@/features/auth/lib/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(searchParams.get("error"));

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session && active) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, is_active")
            .eq("id", session.user.id)
            .single();

          if (profile && profile.is_active && profile.role !== "donor") {
            if (profile.role === "center_admin") {
              const centerWebUrl = process.env.NEXT_PUBLIC_CENTER_WEB_URL || "/login";
              window.location.href = centerWebUrl;
            } else {
              router.replace("/admin/dashboard");
            }
            return;
          }
        }
      } catch {
        // No valid session
      }

      if (active) setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.redirect === "center_web") {
        const centerWebUrl = process.env.NEXT_PUBLIC_CENTER_WEB_URL || "/login";
        window.location.href = centerWebUrl;
        return;
      }

      if (result.success) {
        router.replace("/admin/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(185,28,28,0.18),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#111827_45%,#1f2937_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden lg:flex lg:flex-col lg:justify-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl  shadow-sm">
              <Image
                src="/logo.png"
                alt="BloodLink Logo"
                width={70}
                height={70}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-tight">
              Supervisez l&apos;ensemble de la plateforme BloodLink.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Gérez les centres, les alertes, les donneurs et les statistiques
              depuis une interface centralisée et sécurisée.
            </p>
          </section>

          <section className="w-full">
            <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300">
                  Espace Super Admin
                </p>
                <h2 className="mt-3 text-3xl font-semibold">Connexion</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Réservé aux super administrateurs BloodLink.
                </p>
              </div>

              {error ? (
                <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              {checkingSession ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-300">
                  Vérification de la session en cours...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-100"
                    >
                      Adresse email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                      placeholder="admin@bloodlink.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-100"
                    >
                      Mot de passe
                    </label>
                    <div className="flex rounded-2xl border border-white/15 bg-slate-950/40 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-400/30">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        placeholder="Votre mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="px-4 text-sm font-medium text-slate-300 transition hover:text-white"
                      >
                        {showPassword ? "Masquer" : "Afficher"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                  </button>
                </form>
              )}

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
