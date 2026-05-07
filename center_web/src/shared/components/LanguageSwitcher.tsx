"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import {
  locales,
  localeLabels,
  localeCountryCodes,
  type Locale,
} from "@/shared/config/i18n";

/**
 * LanguageSwitcher Component (Enhanced with Framer Motion)
 *
 * A beautifully animated dropdown menu that allows users to switch between available languages.
 * Features smooth animations and modern UX patterns.
 *
 * Features:
 * - Smooth fade + slide animations
 * - Displays current language with flag emoji
 * - Highlights currently active language
 * - Maintains navigation context during language switch
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
 *
 * function Header() {
 *   return (
 *     <nav>
 *       <LanguageSwitcher />
 *     </nav>
 *   );
 * }
 * ```
 */
export function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Switches to the selected locale while preserving the current page path.
   *
   * Example:
   * - Current URL: /fr/manager
   * - User selects: English
   * - New URL: /en/manager
   *
   * @param newLocale - The locale to switch to (fr, en, or de)
   */
  const switchLocale = (newLocale: Locale) => {
    // Don't do anything if the user clicks the current language
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Remove the current locale from the pathname
    const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, "");

    // Navigate to the new locale with the same path
    router.push(`/${newLocale}${pathnameWithoutLocale}`);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={(e) => {
          // Close dropdown when focus leaves, but allow clicking inside
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => setIsOpen(false), 150);
          }
        }}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
        aria-label={t("switch")}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <ReactCountryFlag
          countryCode={localeCountryCodes[currentLocale]}
          svg
          style={{
            width: "1.25em",
            height: "1.25em",
            borderRadius: "2px",
          }}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{localeLabels[currentLocale]}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Animated Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-2 w-48 origin-top-right z-50"
          >
            <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white overflow-hidden">
              <div className="py-1" role="menu" aria-orientation="vertical">
                {locales.map((locale) => {
                  const isActive = currentLocale === locale;
                  return (
                    <motion.button
                      key={locale}
                      onClick={() => switchLocale(locale)}
                      whileHover={{
                        backgroundColor: "rgba(59, 130, 246, 0.05)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors duration-150 ${
                        isActive
                          ? "text-primary font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      role="menuitem"
                      aria-current={isActive ? "true" : undefined}
                    >
                      <ReactCountryFlag
                        countryCode={localeCountryCodes[locale]}
                        svg
                        style={{
                          width: "1.5em",
                          height: "1.5em",
                          borderRadius: "3px",
                        }}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{localeLabels[locale]}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-primary"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
