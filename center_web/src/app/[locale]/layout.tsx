import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { locales, type Locale } from "@/shared/config/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BloodLink Centre — Gestion des dons de sang",
  description:
    "Interface de gestion pour les centres de transfusion sanguine BloodLink. Gérez vos rendez-vous, validez les dons et suivez l'activité de votre centre.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages - this will use the locale set by setRequestLocale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <QueryProvider>
        <TooltipProvider>
          <div
            className={`${inter.variable} h-full antialiased`}
          >
            {children}
          </div>
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </QueryProvider>
      <SpeedInsights />
      <Analytics />
    </NextIntlClientProvider>
  );
}
