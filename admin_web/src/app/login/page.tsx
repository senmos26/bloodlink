"use client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentAdminContext, signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [message] = useState<string | null>(searchParams.get("message"));

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        await getCurrentAdminContext();

        if (active) {
          router.replace("/admin/dashboard");
        }
      } catch {
        if (active) {
          setCheckingSession(false);
        }
      }
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
      await signIn(email, password);
      await getCurrentAdminContext();
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Connexion impossible pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(185,28,28,0.14),_transparent_35%),linear-gradient(135deg,#dbeafe_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-10 text-slate-900">
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
            <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-tight text-slate-900">
              Connectez votre centre à une gestion plus fluide des dons.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Suivez les alertes, les rendez-vous et les validations de dons
              dans une interface simple, rapide et sécurisée.
            </p>
          </section>

          <section className="w-full">
            <div className="mx-auto max-w-md rounded-[2rem] border border-sky-100 bg-white/80 p-8 shadow-2xl backdrop-blur">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
                  Espace Administratif
                </p>
                <h2 className="mt-3 text-3xl font-semibold">Connexion</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Utilisez votre compte centre ou administrateur.
                </p>
              </div>

              {error ? (
                <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              {checkingSession ? (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-6 text-center text-sm text-slate-600">
                  Vérification de la session en cours...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
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
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                      placeholder="admin@bloodlink.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Mot de passe
                    </label>
                    <div className="flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-400/30">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full bg-transparent px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Votre mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="px-4 text-sm font-medium text-slate-500 transition hover:text-slate-900"
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

              {/* <div className="mt-8 text-center text-sm text-slate-300">
                <Link href="/" className="transition hover:text-white">
                  Retour à l&apos;accueil
                </Link>
              </div> */} 
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
