"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { signOut, updatePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasRecoveryToken = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.location.hash.includes("type=recovery");
  }, []);

  useEffect(() => {
    let active = true;

    async function prepareReset() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setReady(Boolean(session) || hasRecoveryToken);
      setLoading(false);
    }

    prepareReset();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(Boolean(session));
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hasRecoveryToken]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setSaving(true);

    try {
      await updatePassword(password);
      await signOut();
      setMessage("Mot de passe mis à jour avec succès. Redirection vers la connexion...");
      setTimeout(() => {
        router.replace("/login?message=Mot%20de%20passe%20mis%20%C3%A0%20jour.%20Reconnectez-vous%20avec%20le%20nouveau%20mot%20de%20passe.");
      }, 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible de définir le nouveau mot de passe."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(185,28,28,0.14),_transparent_35%),linear-gradient(135deg,#dbeafe_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden lg:flex lg:flex-col lg:justify-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-sm">
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
              Choisissez un nouveau mot de passe pour votre espace administrateur.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Après validation, vous serez redirigé vers la page de connexion pour vous reconnecter avec le nouveau mot de passe.
            </p>
          </section>

          <section className="w-full">
            <div className="mx-auto max-w-md rounded-[2rem] border border-sky-100 bg-white/85 p-8 shadow-2xl backdrop-blur">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
                  Sécurité
                </p>
                <h2 className="mt-3 text-3xl font-semibold">Nouveau mot de passe</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Saisissez le nouveau mot de passe reçu après avoir cliqué sur le lien dans votre email.
                </p>
              </div>

              {error ? (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              {loading ? (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-6 text-center text-sm text-slate-600">
                  Vérification du lien de récupération...
                </div>
              ) : !ready ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">
                  Le lien de réinitialisation n&apos;est plus valide. Recommencez depuis la section profil de l&apos;administrateur.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Nouveau mot de passe
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                      placeholder="Confirmez le nouveau mot de passe"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-2xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? "Validation..." : "Valider le nouveau mot de passe"}
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
