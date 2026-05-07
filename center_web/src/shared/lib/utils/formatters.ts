/**
 * Centralized formatting utilities for numbers and medical units
 */

import type { Locale } from '@/shared/config/i18n';

/**
 * Supported units in the application
 */
export const SUPPORTED_UNITS = ['ml', 'poche', 'donneur'] as const;
export type SupportedUnit = typeof SUPPORTED_UNITS[number];

/**
 * Unit formatting options
 */
export type NumberFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
};

/**
 * Format volume in ml
 */
export function formatVolume(amount: number, locale: Locale = 'fr'): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ml';
}

/**
 * Format blood pouches count
 */
export function formatPouches(count: number, locale: Locale = 'fr'): string {
  const label = count > 1 ? ' poches' : ' poche';
  return count + label;
}

/**
 * Generic number formatter
 */
export function formatNumber(
  value: number,
  locale: Locale = 'fr',
  options?: NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}
