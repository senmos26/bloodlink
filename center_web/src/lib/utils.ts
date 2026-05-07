import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tremor Raw cx [v0.0.0]
export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args));
}

// Tremor focusInput [v0.0.2]
export const focusInput = [
  "focus:ring-2",
  "focus:ring-blue-200 dark:focus:ring-blue-700/30",
  "focus:border-blue-500 dark:focus:border-blue-700",
];

// Tremor Raw focusRing [v0.0.1]
export const focusRing = [
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  "outline-blue-500 dark:outline-blue-500",
];

// Tremor Raw hasErrorInput [v0.0.1]
export const hasErrorInput = [
  "ring-2",
  "border-red-500 dark:border-red-700",
  "ring-red-200 dark:ring-red-700/30",
];

/**
 * Construit l'URL de base de l'application de manière dynamique
 * en fonction de l'environnement d'exécution (local, preview Vercel, production).
 * Important: Pour que cela fonctionne, vous devez configurer NEXT_PUBLIC_SITE_URL
 * dans vos variables d'environnement Vercel pour l'environnement de production.
 * @returns {string} L'URL de base complète avec le protocole.
 */
export const getURL = (): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_URL;
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === 'production' && siteUrl) {
    return siteUrl;
  }

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return 'http://localhost:3000';
};