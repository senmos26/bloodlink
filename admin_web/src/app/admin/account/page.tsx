"use client";

import { useEffect, useState } from "react";

import { useAdminTheme } from "@/components/AdminThemeContext";
import {
  getCurrentAdminContext,
  sendPasswordResetEmail,
  updateAdminEmail,
  updateAdminProfile,
  verifyCurrentPassword,
  type AdminContext,
} from "@/lib/auth";

type Notice = {
  tone: "success" | "error";
  message: string;
};

export default function AdminAccountPage() {
  const { theme } = useAdminTheme();
  const [context, setContext] = useState<AdminContext | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const adminContext = await getCurrentAdminContext();

        if (!active) {
          return;
        }

        setContext(adminContext);
        setFullName(adminContext.profile.full_name ?? "");
        setPhone(adminContext.profile.phone ?? "");
        setEmail(adminContext.user.email ?? "");
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Impossible de charger le profil administrateur.",
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, []);

  async function refreshContext() {
    const adminContext = await getCurrentAdminContext();
    setContext(adminContext);
    setFullName(adminContext.profile.full_name ?? "");
    setPhone(adminContext.profile.phone ?? "");
    setEmail(adminContext.user.email ?? "");
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context) {
      return;
    }

    setSavingProfile(true);
    setNotice(null);

    try {
      await updateAdminProfile(context.profile.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
      });

      let message = "Les informations du profil ont été mises à jour.";

      if (email.trim() && email.trim() !== (context.user.email ?? "")) {
        await updateAdminEmail(email.trim());
        message =
          "Le profil a été mis à jour. Vérifiez aussi votre boîte mail pour confirmer la nouvelle adresse email.";
      }

      await refreshContext();
      setNotice({ tone: "success", message });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour le profil.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!context?.user.email) {
      setNotice({
        tone: "error",
        message: "Aucune adresse email n'est liée à ce compte.",
      });
      return;
    }

    setSendingReset(true);
    setNotice(null);

    try {
      await verifyCurrentPassword(context.user.email, currentPassword);
      await sendPasswordResetEmail(
        context.user.email,
        `${window.location.origin}/reset-password`
      );
      setCurrentPassword("");
      setNotice({
        tone: "success",
        message:
          "Un email de réinitialisation a été envoyé. Ouvrez le message Gmail puis cliquez sur le bouton pour définir votre nouveau mot de passe.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer l'email de réinitialisation.",
      });
    } finally {
      setSendingReset(false);
    }
  }

  const pageClasses =
    theme === "dark"
      ? "space-y-6 text-slate-100"
      : "space-y-6 text-slate-900";
  const cardClasses =
    theme === "dark"
      ? "rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm"
      : "rounded-3xl border border-sky-100 bg-white p-6 shadow-sm";
  const mutedTextClasses =
    theme === "dark" ? "text-slate-400" : "text-slate-500";
  const labelClasses =
    theme === "dark" ? "text-slate-200" : "text-slate-700";
  const inputClasses =
    theme === "dark"
      ? "w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/25"
      : "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/25";

  if (loading) {
    return (
      <div className={cardClasses}>
        <p className={mutedTextClasses}>Chargement du profil administrateur...</p>
      </div>
    );
  }

  return (
    <div className={pageClasses}>
      <div>
        <h1 className="text-3xl font-semibold">Mon profil</h1>
        <p className={`mt-2 text-sm ${mutedTextClasses}`}>
          Modifiez les informations du compte connecté et lancez une demande de changement de mot de passe.
        </p>
      </div>

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.tone === "success"
              ? theme === "dark"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
              : theme === "dark"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <section className={cardClasses}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Informations administrateur</h2>
          <p className={`mt-2 text-sm ${mutedTextClasses}`}>
            Ces données sont enregistrées dans Supabase pour le compte actuellement connecté.
          </p>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleProfileSubmit}>
          <div className="md:col-span-2">
            <label className={`mb-2 block text-sm font-medium ${labelClasses}`} htmlFor="full_name">
              Nom complet
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputClasses}
              required
              placeholder="Nom et prénom"
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${labelClasses}`} htmlFor="phone">
              Téléphone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClasses}
              required
              placeholder="+212..."
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${labelClasses}`} htmlFor="email">
              Email de connexion
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClasses}
              required
              placeholder="admin@bloodlink.com"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
            <span className={`text-sm ${mutedTextClasses}`}>
              Rôle actuel: {context?.role === "super_admin" ? "Super Admin" : "Centre Admin"}
            </span>
          </div>
        </form>
      </section>

      <section className={cardClasses}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Changer le mot de passe</h2>
          <p className={`mt-2 text-sm ${mutedTextClasses}`}>
            Saisissez votre ancien mot de passe, puis nous enverrons un email Gmail de réinitialisation vers votre adresse actuelle.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handlePasswordReset}>
          <div>
            <label className={`mb-2 block text-sm font-medium ${labelClasses}`} htmlFor="current_password">
              Ancien mot de passe
            </label>
            <input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={inputClasses}
              required
              placeholder="Saisissez l'ancien mot de passe"
            />
          </div>

          <button
            type="submit"
            disabled={sendingReset}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            {sendingReset ? "Envoi en cours..." : "Envoyer l'email de changement de mot de passe"}
          </button>
        </form>
      </section>
    </div>
  );
}
