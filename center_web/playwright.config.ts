import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // Hna kan 7ddo b tariqa sari7a fin homa les tests
  testMatch: "tests/**/*",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  // L'authentification ghadi tkon 9bel ga3 les tests
  globalSetup: "./global.setup.ts",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Ga3 les tests ghadi ista3mlo had la session li déja m'loggué
    storageState: "playwright/.auth/user.json",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
