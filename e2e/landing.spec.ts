import { expect, test } from "@playwright/test";
import { ensureOpenEdition } from "./helpers/seedEdition";

// Supersedes the PR1 placeholder smoke test (home.spec.ts) now that PR4
// builds the real landing (spec.md §1 "Secciones obligatorias").
test.describe("Landing pública", () => {
  test("shows the hero, prize and every mandatory section", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: "Premio con respaldo" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Cómo funciona" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Elegí tus chances" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /transparencia/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ganadores anteriores" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Preguntas frecuentes" }),
    ).toBeVisible();
  });

  test("shows chance options with ARS pricing in a single selectable card (spec.md §2)", async ({
    page,
  }) => {
    ensureOpenEdition();
    await page.goto("/");

    const select = page.getByRole("combobox");
    await expect(select).toBeVisible();
    await expect(select.locator("option")).toContainText([
      "1 chance — $ 15.000",
      "3 chances — $ 35.000",
    ]);
    await expect(page.getByText("$ 15.000", { exact: true })).toBeVisible();
  });

  test("shows the lottery authorization and escribano data in Transparencia (spec.md Scenario: Visitante ve confianza verificable)", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByText("Autorización de lotería"),
    ).toBeVisible();
    await expect(page.getByText("Escribanía interviniente")).toBeVisible();
  });

  test("FAQ questions expand and collapse their answer on click", async ({
    page,
  }) => {
    await page.goto("/");

    const question = page.getByRole("button", { name: "¿Cómo se paga?" });
    await expect(question).toHaveAttribute("aria-expanded", "false");

    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("acreditación automática")).toBeVisible();
  });

  test("footer links to Términos y Condiciones, which renders the real legal document", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Términos y Condiciones" }).click();
    await expect(page).toHaveURL(/\/terminos$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Términos y Condiciones" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "1. Identificación del organizador" }),
    ).toBeVisible();
  });

  test("footer links to a Política de Privacidad page (no dead link)", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Política de Privacidad" }).click();
    await expect(page).toHaveURL(/\/privacidad$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Política de Privacidad" }),
    ).toBeVisible();
  });
});
