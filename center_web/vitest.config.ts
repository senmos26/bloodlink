 import { defineConfig } from "vitest/config";
 import path from "node:path";

 export default defineConfig({
   test: {
     environment: "node",
     globals: true,
     // Ne lancer que les tests unitaires dans tests/unit
     include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
   },
   resolve: {
     alias: {
       "@": path.resolve(__dirname, "./src"),
       // Mock du module Next.js "server-only" pour les tests Vitest
       "server-only": path.resolve(__dirname, "./tests/mocks/server-only.ts"),
     },
   },
 });
