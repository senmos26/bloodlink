/**
 * Server-side formatting utilities
 * For use in Server Components and Server Actions
 */

import { getFormatter } from 'next-intl/server';

/**
 * Server-side formatting utilities
 * Returns formatters configured for the current locale
 */
export async function getServerFormatters() {
  const format = await getFormatter();

  return {
    /**
     * Format blood volume in ml
     */
    formatVolume: (amount: number): string => {
      return format.number(amount) + ' ml';
    },

    /**
     * Format blood pouches count
     */
    formatPouches: (count: number): string => {
      const label = count > 1 ? ' poches' : ' poche';
      return format.number(count) + label;
    },

    /**
     * Format number with locale-aware separators
     */
    formatNumber: (value: number, decimals: number = 0): string => {
      return format.number(value, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },

    /**
     * Format percentage
     */
    formatPercent: (value: number, decimals: number = 1): string => {
      return format.number(value / 100, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
  };
}
