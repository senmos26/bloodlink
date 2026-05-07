export const locales = ["fr", "en", "de", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeLabels: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  es: "Español",
};

// English names for universal clarity (used in Settings)
export const localeEnglishNames: Record<Locale, string> = {
  fr: "French",
  en: "English",
  de: "German",
  es: "Spanish",
};

// ISO 3166-1 alpha-2 country codes for react-country-flag
export const localeCountryCodes: Record<Locale, string> = {
  fr: "FR",
  en: "GB",
  de: "DE",
  es: "ES",
};

// Deprecated: Use localeCountryCodes with react-country-flag instead
export const localeFlags: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  de: "🇩🇪",
  es: "🇪🇸",
};
