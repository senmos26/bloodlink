import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { type Locale } from "@/shared/config/i18n";
import { AnimatedBackButton } from "./components/AnimatedBackButton";
import { AnimatedHeader } from "./components/AnimatedHeader";
import { AnimatedSections } from "./components/AnimatedSections";
import { AnimatedFooter } from "./components/AnimatedFooter";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/${locale}/terms`,
      languages: {
        fr: "/fr/terms",
        en: "/en/terms",
        de: "/de/terms",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}/terms`,
      siteName: "BloodLink Group Maroc",
      locale,
      type: "website",
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("terms");
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      key: "introduction",
      iconName: "fileText" as const,
      title: t("sections.introduction.title"),
      content: t("sections.introduction.content"),
    },
    {
      key: "accounts",
      iconName: "shield" as const,
      title: t("sections.accounts.title"),
      content: t("sections.accounts.content"),
    },
    {
      key: "acceptableUse",
      iconName: "scale" as const,
      title: t("sections.acceptableUse.title"),
      content: t("sections.acceptableUse.content"),
    },
    {
      key: "privacy",
      iconName: "shield" as const,
      title: t("sections.privacy.title"),
      content: t("sections.privacy.content"),
    },
    {
      key: "liability",
      iconName: "scale" as const,
      title: t("sections.liability.title"),
      content: t("sections.liability.content"),
    },
    {
      key: "modifications",
      iconName: "fileText" as const,
      title: t("sections.modifications.title"),
      content: t("sections.modifications.content"),
    },
    {
      key: "termination",
      iconName: "shield" as const,
      title: t("sections.termination.title"),
      content: t("sections.termination.content"),
    },
    {
      key: "contact",
      iconName: "fileText" as const,
      title: t("sections.contact.title"),
      content: t("sections.contact.content"),
    },
  ];

  return (
    <>
      <main
        id="main-content"
        className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900"
      >
        <AnimatedBackButton
          href={`/${locale}/login`}
          backText={t("navigation.back")}
          backAriaLabel={t("navigation.backAriaLabel")}
        />

        <AnimatedHeader
          title={t("header.title")}
          lastUpdated={t("header.lastUpdated")}
          effectiveDate={t("header.effectiveDate")}
        />

        <AnimatedSections sections={sections} />

        <AnimatedFooter
          copyright={t("footer.copyright", { year: currentYear })}
          loginText={t("footer.login")}
          loginHref={`/${locale}/login`}
          separator={t("footer.separator")}
          signupText={t("footer.signup")}
          signupHref={`/${locale}/signup`}
        />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: t("header.title"),
            description: t("metadata.description"),
            url: `https://pamgroupmaroc.com/${locale}/terms`,
            inLanguage: locale,
            isPartOf: {
              "@type": "WebSite",
              name: "BloodLink Group Maroc",
              url: "https://pamgroupmaroc.com",
            },
            dateModified: "2025-10-11",
            publisher: {
              "@type": "Organization",
              name: "BloodLink Group Maroc",
              url: "https://pamgroupmaroc.com",
            },
          }),
        }}
      />
    </>
  );
}
