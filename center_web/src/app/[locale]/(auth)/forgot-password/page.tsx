"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { sendPasswordReset, type FormState } from "@/features/auth/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: FormState = {};

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const tCommon = useTranslations("auth.common");
  const tErrors = useTranslations();

  const [state, formAction, pending] = useActionState(sendPasswordReset, initialState);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (state?.errorKey) {
      toast.error(t("toast.errorTitle"), {
        description: tErrors(state.errorKey),
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }
    if (state?.success) {
      setSubmitted(true);
      toast.success(t("toast.successTitle"), {
        description: t("toast.emailSent"),
        icon: <CheckCircle2 className="h-4 w-4" />,
        duration: 5000,
      });
    }
  }, [state, t, tErrors]);

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-light text-slate-900 px-4">
      <section className="relative z-10 flex w-full max-w-md flex-col items-center justify-center py-12">
        <div className="w-full space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                {submitted ? t("titleSent") : t("title")}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                {submitted ? t("subtitleSent") : t("subtitle")}
              </p>
            </div>

            {submitted ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="mt-4 text-sm text-slate-600">{t("checkEmail")}</p>
                </div>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("backToLogin")}
                </Link>
              </div>
            ) : (
              <form action={formAction} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{t("labelEmail")}</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      name="email"
                      type="email"
                      placeholder={t("placeholderEmail")}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-primary font-semibold text-white hover:bg-primary/90"
                >
                  {pending ? t("buttons.submitting") : t("buttons.submit")}
                </Button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("backToLogin")}
                </Link>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
