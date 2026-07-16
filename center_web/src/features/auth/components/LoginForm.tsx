/**
 * @file LoginForm: authentication form (feature layer).
 *
 * @version 7.0 (Brand Identity & Final Polish)
 * @author Principal Engineer
 * @description
 *   - The primary call-to-action button now uses the brand's signature orange color,
 *     enhancing visual hierarchy and brand consistency.
 */
"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { login, signInWithGoogle, type FormState } from "@/features/auth/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompactLanguageSwitcher } from "@/shared/components/CompactLanguageSwitcher";

// ... (Le reste du code reste identique)
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.84-4.33 1.84-3.61 0-6.52-3-6.52-6.61s2.91-6.61 6.52-6.61c1.88 0 3.13.79 3.89 1.49l2.35-2.35C19.33 3.38 16.5 2.5 12.48 2.5c-5.48 0-9.84 4.41-9.84 9.84s4.36 9.84 9.84 9.84c5.18 0 9.4-4.22 9.4-9.52 0-.69-.07-1.3-.2-1.92z"
    />
  </svg>
);
const initialState: FormState = { message: null };

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("auth.common");
  const tErrors = useTranslations(); // Root translator for nested keys
  const tSuccess = useTranslations("auth.success");
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Redirect to new-password if an invitation/recovery code is detected in URL or hash fragment
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      router.push(`/new-password?code=${code}`);
      return;
    }

    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash && (hash.includes("access_token=") || hash.includes("type=invite") || hash.includes("type=recovery"))) {
        router.push(`/new-password${hash}`);
      }
    }
  }, [searchParams, router]);

  // Handle success messages from query params (e.g., email confirmation)
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "email_confirmed") {
      toast.success(t("toast.emailConfirmedTitle"), {
        description: tSuccess("emailConfirmed"),
        icon: <CheckCircle2 className="h-4 w-4" />,
        duration: 5000,
      });
    } else if (message === "password_updated") {
      toast.success(t("toast.passwordUpdatedTitle"), {
        description: tSuccess("passwordUpdated"),
        icon: <CheckCircle2 className="h-4 w-4" />,
        duration: 5000,
      });
    }
  }, [searchParams, t, tSuccess]);

  // Handle error messages from form submission
  useEffect(() => {
    if (state?.errorKey) {
      toast.error(t("toast.errorTitle"), {
        description: tErrors(state.errorKey),
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }
  }, [state, t, tErrors]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      toast.error(t("toast.errorTitle"), {
        description: tErrors("auth.serverErrors.oauthFailed"),
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col relative">
      {/* ... (Header et Formulaire restent identiques jusqu'au bouton) ... */}

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          {tCommon("brandName")}
        </h1>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm text-neutral-600">{t("subtitle")}</p>
      </div>
      <div className="space-y-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon className="mr-2 h-4 w-4" /> {t("buttons.google")}
        </Button>
        <div className="flex items-center">
          <div className="flex-grow border-t border-neutral-200"></div>
          <span className="mx-3 flex-shrink text-xs font-medium uppercase text-neutral-400">
            {t("buttons.divider")}
          </span>
          <div className="flex-grow border-t border-neutral-200"></div>
        </div>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5 group">
            <Label
              htmlFor="email"
              className="transition-colors duration-300 ease-in-out group-focus-within:text-primary"
            >
              {t("labels.email")}
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("placeholders.email")}
                required
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 group">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="transition-colors duration-300 ease-in-out group-focus-within:text-primary"
              >
                {t("labels.password")}
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("links.forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="password"
                name="password"
                required
                className="pl-9 pr-10"
                type={showPassword ? "text" : "password"}
                placeholder={t("placeholders.password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                aria-label={
                  showPassword ? t("aria.hidePassword") : t("aria.showPassword")
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* === CHANGEMENT DE COULEUR DU BOUTON === */}
          <Button
            type="submit"
            disabled={pending}
            className="w-full !mt-6 bg-primary font-semibold text-white hover:bg-primary/90 focus-visible:ring-primary"
          >
            {pending ? t("buttons.submitting") : t("buttons.submit")}
          </Button>
        </form>
      </div>
      <div className="mt-8 space-y-4 text-center">
        {/* Footer with Language Switcher and Copyright */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-2">
          <CompactLanguageSwitcher />
          <p>{tCommon("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </div>
  );
}
