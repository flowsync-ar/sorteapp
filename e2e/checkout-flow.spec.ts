import { expect, test } from "@playwright/test";

// PR5 batch scope (tasks.md 5.3, spec.md §3 "Flujo de selección"): covers
// tier selection on the landing through order creation, for BOTH payment
// methods. Real Mercado Pago (PR6) and comprobante upload (PR7) are NOT
// exercised here — both destinations are "en construcción" placeholders by
// design for this batch.
test.describe("Checkout flow", () => {
  test("selecting a tier on the landing navigates to its checkout page", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("radio", { name: "Inicial" }).check();
    await page.getByRole("link", { name: /continuar/i }).click();

    await expect(page).toHaveURL(/\/checkout\/inicial$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Inicial" }),
    ).toBeVisible();
  });

  test("buying with Mercado Pago creates a pending order and redirects to the MP placeholder", async ({
    page,
  }) => {
    await page.goto("/checkout/inicial");

    await page.getByLabel(/nombre y apellido/i).fill("Martín García");
    await page.getByLabel(/^email$/i).fill(`martin.${Date.now()}@example.com`);
    await page.getByLabel(/dni/i).fill("30123456");
    await page.getByLabel(/tel[eé]fono/i).fill("+5491123456789");
    // Mercado Pago is the default-checked payment method.
    await page.getByRole("button", { name: /confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/checkout\/orden\/.+\/mercadopago$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Pago con Mercado Pago" }),
    ).toBeVisible();
    await expect(page.getByText("Integración en construcción")).toBeVisible();
    await expect(page.getByText("inicial")).toBeVisible();
    await expect(page.getByText("$ 15.000")).toBeVisible();
    await expect(page.getByText("pending")).toBeVisible();
  });

  test("buying with bank transfer applies the discount and redirects to the comprobante placeholder", async ({
    page,
  }) => {
    await page.goto("/checkout/plus");

    await page.getByLabel(/nombre y apellido/i).fill("Rocío Álvarez");
    await page.getByLabel(/^email$/i).fill(`rocio.${Date.now()}@example.com`);
    await page.getByLabel(/dni/i).fill("28123456");
    await page.getByLabel(/tel[eé]fono/i).fill("+5491199998888");
    await page.getByRole("radio", { name: /transferencia/i }).check();
    await page.getByRole("button", { name: /confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/checkout\/orden\/.+\/comprobante$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Transferencia bancaria" }),
    ).toBeVisible();
    // Plus tier: $35.000 - 10% descuento por transferencia = $31.500.
    await expect(page.getByText("$ 31.500")).toBeVisible();
  });

  test("blocks submission and shows accessible field errors on empty/invalid data", async ({
    page,
  }) => {
    await page.goto("/checkout/inicial");

    await page.getByLabel(/dni/i).fill("123");
    await page.getByRole("button", { name: /confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/checkout\/inicial$/);
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(
      page.getByText(/dni válido/i),
    ).toBeVisible();
  });
});
