import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { locales, type Locale } from './index';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const localeKey = locale as Locale;

  return {
    locale: localeKey,
    messages: (await import(`./locales/${localeKey}.json`)).default,
  };
});
