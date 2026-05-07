"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronUp } from "lucide-react";
import { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import {
  locales,
  localeLabels,
  localeCountryCodes,
  type Locale,
} from "@/shared/config/i18n";

/**
 * CompactLanguageSwitcher Component
 *
 * A minimal, footer-friendly language switcher for authentication pages.
 * Designed to be non-intrusive and placed near copyright text.
 *
 * Features:
 * - Compact button with globe icon
 * - Upward-opening dropdown (since it's in footer)
 * - Smooth animations
 * - Mobile-responsive
 *
 * @example
 * ```tsx
 * import { CompactLanguageSwitcher } from '@/shared/components/CompactLanguageSwitcher';
 *
 * function AuthFooter() {
 *   return (
 *     <footer>
 *       <CompactLanguageSwitcher />
 *       <p>© 2025 BloodLink Group Maroc</p>
 *     </footer>
 *   );
 * }
 * ```
 */
export function CompactLanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, "");
    router.push(`/${newLocale}${pathnameWithoutLocale}`);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      {/* Compact Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => setIsOpen(false), 150);
          }
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-50 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="font-medium">{localeLabels[currentLocale]}</span>
        <ChevronUp
          className={`h-3 w-3 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Animated Dropdown (Opens Upward) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-0 bottom-full mb-2 w-48 origin-bottom-left z-[100]"
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
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors duration-150 ${
                        isActive
                          ? "text-primary font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      role="menuitem"
                      aria-current={isActive ? "true" : undefined}
                    >
                      <ReactCountryFlag
                        countryCode={localeCountryCodes[locale]}
                        svg
                        style={{
                          width: "1.25em",
                          height: "1.25em",
                          borderRadius: "2px",
                        }}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{localeLabels[locale]}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
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

      {/* Backdrop for mobile with blur */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
