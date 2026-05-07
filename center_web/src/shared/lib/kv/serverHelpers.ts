/**
 * Server-Only Activity Helpers
 * Functions that require server-side APIs (cookies, headers, etc.)
 * DO NOT import this file in client components!
 */

import { cookies } from 'next/headers';

// ============================================================================
// Locale Detection (Server-Side Only)
// ============================================================================

/**
 * Détecte la locale courante de l'utilisateur via cookies
 * Utilisé pour générer les descriptions d'activités dans la bonne langue
 * 
 * ⚠️ SERVER-ONLY: Ne pas utiliser dans client components
 * 
 * @returns Code locale (fr, en, de, es) - défaut: 'fr'
 */
export async function getUserLocale(): Promise<string> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE');
  return localeCookie?.value || 'fr';
}
