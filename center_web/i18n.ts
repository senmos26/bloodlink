import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

import { locales, type Locale } from "./src/shared/config/i18n";

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` can be `undefined` for pages outside [locale] segment
  // It needs to be awaited when using dynamic params
  const locale = await requestLocale;

  // Validate and provide fallback
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  const localeKey = locale as Locale;

  return {
    locale: localeKey,
    messages: (
      await import(`./src/shared/config/i18n/locales/${localeKey}.json`)
    ).default,
  };
});
