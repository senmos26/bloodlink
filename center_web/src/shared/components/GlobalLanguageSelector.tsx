"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import {
  locales,
  localeLabels,
  localeCountryCodes,
  type Locale,
} from "@/shared/config/i18n";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * GlobalLanguageSelector Component
 *
 * A premium, best-in-class language selector inspired by Airbnb and Spotify.
 * Designed to be used across the entire application (header, login footer, etc.).
 *
 * Features:
 * - Minimalist trigger with globe icon + current language
 * - Smooth fade + scale animation (150ms)
 * - Soft shadows and rounded corners
 * - Native language names (no country codes)
 * - Bold text + checkmark for active language
 * - Subtle hover states
 * - Premium visual quality
 * - Smart positioning: opens upward or downward based on available viewport space
 * - Internal scrolling when needed (no page scroll required)
 * - Fully responsive across all breakpoints
 * - Optimized for mobile with full-width modal on small screens
 */
export function GlobalLanguageSelector() {
  const currentLocale = useLocale() as Locale;
  const t = useTranslations("common.language");
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number>(300);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Calculate optimal dropdown position and max-height based on viewport
   * Opens upward if insufficient space below, with internal scrolling if needed
   */
  const calculateDropdownPosition = () => {
    if (!containerRef.current) return;

    const triggerRect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Buffer space from viewport edges
    const BUFFER = 20;
    const ITEM_HEIGHT = 44; // Approximate height per language item
    const DROPDOWN_PADDING = 16; // py-2 = 8px top + 8px bottom
    const MIN_ITEMS_VISIBLE = 2; // Always show at least 2 items

    // Calculate required height for all items
    const totalItemsHeight = locales.length * ITEM_HEIGHT + DROPDOWN_PADDING;

    // Calculate available space below and above
    const spaceBelow = viewportHeight - triggerRect.bottom - BUFFER;
    const spaceAbove = triggerRect.top - BUFFER;

    // Determine if we should open upward
    const shouldOpenUpward =
      spaceBelow < totalItemsHeight && spaceAbove > spaceBelow;

    // Calculate max height based on available space
    let calculatedMaxHeight: number;
    if (viewportWidth < 768) {
      // Mobile: use most of viewport height, centered
      calculatedMaxHeight = viewportHeight - BUFFER * 4;
    } else {
      // Desktop/Tablet: use available space in direction of opening
      const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;
      calculatedMaxHeight = Math.max(
        MIN_ITEMS_VISIBLE * ITEM_HEIGHT + DROPDOWN_PADDING,
        Math.min(totalItemsHeight, availableSpace)
      );
    }

    setOpenUpward(shouldOpenUpward);
    setMaxHeight(calculatedMaxHeight);
  };

  // Calculate position when dropdown opens or window resizes
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();

      const handleResize = () => calculateDropdownPosition();
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Language change handler
  const handleLanguageChange = useCallback(
    (newLocale: Locale) => {
      if (newLocale === currentLocale) {
        setIsOpen(false);
        return;
      }

      // Show confirmation toast
      toast.success("Language updated", {
        description: `Switched to ${localeLabels[newLocale]}`,
        duration: 3000,
      });

      // Remove current locale from path
      const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, "");

      // Navigate to new locale
      router.push(`/${newLocale}${pathnameWithoutLocale}`);

      setIsOpen(false);
    },
    [currentLocale, pathname, router]
  );

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Keyboard navigation for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentIndex = locales.findIndex((loc) => loc === currentLocale);

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex =
              prev === -1
                ? currentIndex
                : Math.min(prev + 1, locales.length - 1);
            return nextIndex;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex =
              prev === -1 ? currentIndex : Math.max(prev - 1, 0);
            return nextIndex;
          });
          break;
        case "Enter":
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < locales.length) {
            handleLanguageChange(locales[focusedIndex]);
          }
          break;
        case "Home":
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          event.preventDefault();
          setFocusedIndex(locales.length - 1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedIndex, currentLocale, handleLanguageChange]);

  // Reset focused index when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Trigger Button - Only Flag with Tooltip */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center p-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-150 min-h-[44px] min-w-[44px]"
              aria-label={`Change language. Current language: ${localeLabels[currentLocale]}`}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            >
              <ReactCountryFlag
                countryCode={localeCountryCodes[currentLocale]}
                svg
                style={{
                  width: "1.5em",
                  height: "1.5em",
                  borderRadius: "3px",
                }}
                aria-hidden="true"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-medium">
            {t("chooseLanguage")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile with blur effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown Menu */}
            <motion.div
              ref={dropdownRef}
              initial={{
                opacity: 0,
                scale: 0.95,
                y: openUpward ? 10 : -10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: openUpward ? 10 : -10,
              }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className={`
                z-[100] bg-white rounded-xl shadow-2xl border border-gray-200
                
                /* Mobile: Centered modal with better positioning */
                fixed md:absolute
                left-1/2 md:left-auto md:right-0
                -translate-x-1/2 md:translate-x-0
                top-1/2 md:top-auto
                -translate-y-1/2 md:translate-y-0
                w-[calc(100vw-3rem)] md:w-64
                max-w-[320px] md:max-w-none
                
                /* Desktop: Position based on available space */
                ${openUpward ? "md:bottom-full md:mb-2" : "md:top-full md:mt-2"}
              `}
              style={{
                maxHeight: `${maxHeight}px`,
              }}
            >
              {/* Scrollable container for language options */}
              <div
                className="overflow-y-auto overflow-x-hidden py-2"
                style={{ maxHeight: `${maxHeight}px` }}
                role="listbox"
                aria-label="Language selection"
              >
                {locales.map((locale, index) => {
                  const isActive = locale === currentLocale;
                  const isFocused = index === focusedIndex;

                  return (
                    <motion.button
                      key={locale}
                      onClick={() => handleLanguageChange(locale)}
                      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full px-4 py-3 md:py-2.5 text-left flex items-center gap-3 
                        transition-colors duration-150 
                        min-h-[48px] md:min-h-[44px]
                        ${
                          isActive
                            ? "font-semibold text-primary"
                            : "font-normal text-gray-700"
                        }
                        ${
                          isFocused
                            ? "ring-2 ring-inset ring-primary/50 bg-gray-50"
                            : ""
                        }
                      `}
                      role="option"
                      aria-selected={isActive}
                      aria-label={`${localeLabels[locale]}${
                        isActive ? " (current)" : ""
                      }`}
                      tabIndex={isFocused ? 0 : -1}
                    >
                      {/* Flag Icon */}
                      <ReactCountryFlag
                        countryCode={localeCountryCodes[locale]}
                        svg
                        style={{
                          width: "1.5em",
                          height: "1.5em",
                          borderRadius: "3px",
                        }}
                        className="flex-shrink-0"
                        aria-hidden="true"
                      />

                      {/* Language Name */}
                      <span className="text-base md:text-sm flex-1">
                        {localeLabels[locale]}
                      </span>

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Check className="h-5 w-5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
