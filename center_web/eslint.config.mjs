import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import playwright from "eslint-plugin-playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

 const eslintConfig = [
   ...compat.extends("next/core-web-vitals", "next/typescript"),
   // Playwright configuration - only for e2e/spec tests
   {
     files: ["tests/**/*.spec.{ts,tsx}"],
     ...playwright.configs["flat/recommended"],
   },
   // Relax TypeScript "no-explicit-any" for test files (unit + e2e)
   {
     files: [
       "tests/**/*.{test,spec}.{ts,tsx}",
       "src/**/*.{test,spec}.{ts,tsx}",
     ],
     rules: {
       "@typescript-eslint/no-explicit-any": "off",
     },
   },
 ];

export default eslintConfig;
