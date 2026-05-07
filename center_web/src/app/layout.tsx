import "./globals.css";
import type { ReactNode } from "react";

// Root layout required by Next.js
// Defines the global <html> and <body> tags. Locale-specific logic
// (i18n, providers, etc.) is handled in app/[locale]/layout.tsx.
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="h-full antialiased">
        {children}
      </body>
    </html>
  );
}
