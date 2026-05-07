import { test, expect } from "@playwright/test";

test.describe("Charges Page Flow", () => {
  // On n'a plus besoin de test.beforeEach pour le cookie.
  // L'authentification est gérée par global.setup.ts et storageState.

  test("should display charges on page load", async ({ page }) => {
    await page.goto("/charges");

    // Attendre l'apparition d'un bouton "Open menu" présent sur chaque carte de charge
    await expect(
      page.getByRole("button", { name: "Open menu" }).first()
    ).toBeVisible({ timeout: 15000 });

    const cards = await page.getByRole("button", { name: "Open menu" }).count();
    expect(cards).toBeGreaterThan(0);
  });

  test("should filter charges by status and reset", async ({ page }) => {
    await page.goto("/charges");

    // Assurer que des cartes sont visibles avant d'interagir avec les filtres
    await expect(
      page.getByRole("button", { name: "Open menu" }).first()
    ).toBeVisible({ timeout: 15000 });

    // 1. Ouvrir le filtre par statut
    await page.getByLabel("Filtrer par statut").click();

    // 2. Choisir "Finalisé"
    await page.getByRole("option", { name: "Finalisé" }).click();

    // 3. Attendre le changement d'URL
    await page.waitForURL("**/charges?status=final&page=1");

    // 4. Vérifier qu'au moins une carte avec le texte "final" est visible
    await expect(page.locator('div:has-text("final")').first()).toBeVisible({
      timeout: 15000,
    });

    // 5. Réinitialiser
    await page.getByRole("button", { name: "Réinitialiser" }).click();

    // 6. Attendre le retour à l'URL de base
    await page.waitForURL("**/charges");
    await expect(page).toHaveURL("/charges");
  });

  test("should allow creating a new charge", async ({ page }) => {
    await page.goto("/charges");

    // Titre de la page visible
    await expect(
      page.locator('h1:has-text("Gestion des Charges")')
    ).toBeVisible();

    // 1. Ouvrir le wizard
    await page.getByRole("button", { name: "Ajouter une Charge" }).click();

    // Récupérer le conteneur du wizard (dialog)
    const wizard = page.getByRole("dialog", {
      name: /Ajouter une Nouvelle Charge/i,
    });

    // Attendre un contrôle stable du wizard (bouton "Suivant")
    await expect(wizard.getByRole("button", { name: "Suivant" })).toBeVisible({
      timeout: 15000,
    });

    // -- Etape 1: Catégorie --
    await wizard.getByText("Factures").click();
    await wizard.getByText("Facture d'eau", { exact: true }).click();
    await wizard.getByRole("button", { name: "Suivant" }).click();

    // -- Etape 2: Détails --
    await wizard.getByLabel(/Montant \(MAD\)/).fill("150.55");
    await wizard
      .getByLabel("Libellé personnalisé")
      .fill("Test Charge Playwright");

    // Upload d'un fichier (simulation)
    const fileChooserPromise = page.waitForEvent("filechooser");
    await wizard
      .locator('div:text("Glissez-déposez ou cliquez pour sélectionner")')
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "facture-test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("ceci est un faux pdf"),
    });
    await expect(page.getByText("facture-test.pdf")).toBeVisible();
    await wizard.getByRole("button", { name: "Suivant" }).click();

    // -- Etape 3: Allocation --
    await wizard.getByText("Une Propriété").click();
    await wizard.getByRole("combobox").first().click();
    await wizard.getByRole("option").first().click(); // On choisit la première propriété
    await wizard.getByRole("button", { name: "Suivant" }).click();

    // -- Etape 4: Confirmation --
    await expect(
      wizard.getByText("Veuillez vérifier votre nouvelle charge")
    ).toBeVisible();
    await expect(wizard.getByText("Test Charge Playwright")).toBeVisible();
    await expect(wizard.getByText("150.55 MAD")).toBeVisible();

    // Confirmer et ajouter
    await wizard.getByRole("button", { name: "Confirmer & Ajouter" }).click();

    // Attendre que le dialog se ferme et que la nouvelle charge apparaisse
    await expect(wizard).not.toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('div:has-text("Test Charge Playwright")').last()
    ).toBeVisible({ timeout: 15000 });
  });
});
