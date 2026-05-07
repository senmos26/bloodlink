import { chromium, type FullConfig } from "@playwright/test";
import * as dotenv from "dotenv";

// Carrega variáveis específicas de teste
dotenv.config({ path: ".env.test" });

export default async function globalSetup(config: FullConfig) {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL e TEST_USER_PASSWORD precisam estar definidos em .env.test"
    );
  }

  // Usa baseURL e storageState da configuração
  const projectUse = (config.projects[0].use || {}) as {
    baseURL?: string;
    storageState?: string;
  };
  const baseURL = projectUse.baseURL || "http://localhost:3000";
  const storageStatePath =
    projectUse.storageState || "playwright/.auth/user.json";

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);

  // Attend que le champ email soit visible avant de continuer
  await page.locator("#email").waitFor();

  // Preenche o formulário de login (ajuste labels se necessário)
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  // Aguarda a navegação/indicador de que o login funcionou
  await page.waitForLoadState("networkidle");

  // Persiste a sessão para ser reutilizada pelos testes
  await context.storageState({ path: storageStatePath });
  await browser.close();
}
