import { expect, test } from "@playwright/test";
import { ensureOpenEdition } from "./helpers/seedEdition";

// PR5 batch scope (tasks.md 5.3, spec.md §3 "Flujo de selección"): covers
// tier selection on the landing through order creation, for BOTH payment
// methods. Comprobante upload (PR7) is NOT exercised here — that
// destination is still an "en construcción" placeholder.
//
// PR6 note: the Mercado Pago test below does NOT exercise a real payment.
// This environment has no MERCADOPAGO_ACCESS_TOKEN configured (deliberately
// absent from CI and local dev — see env.local.example), so preference
// creation fails fast on the missing-env-var check before ever reaching
// the network. That is a genuine exercise of the "no dejar la UI colgada"
// error path (tasks.md PR6.5), not a mock — it just can't reach MP's real
// Checkout Pro UI without real sandbox credentials, which this sandbox does
// not have (no internet access). A real MP sandbox run is left as a manual
// verification step for whoever configures real credentials.
test.describe("Checkout flow", () => {
  // Tiers are per-edition now (change: edition-tiers) — `ensureOpenEdition()`
  // upserts the same $15.000/1-chance and $35.000/3-chances tiers the old
  // global "inicial"/"plus" tiers had, so every price assertion below stays
  // unchanged; only the checkout URL is a uuid now, not a name.
  let tierIds: { oneChance: string; threeChances: string };

  test.beforeEach(() => {
    tierIds = ensureOpenEdition().tierIds;
  });

  test("selecting a tier on the landing navigates to its checkout page", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("combobox").selectOption({ label: "1 chance — $ 15.000" });
    await page.getByRole("link", { name: /continuar/i }).click();

    await expect(page).toHaveURL(new RegExp(`/checkout/${tierIds.oneChance}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: "1 chance" }),
    ).toBeVisible();
  });

  test("buying with Mercado Pago creates a pending order and shows a graceful error when Mercado Pago is unreachable/unconfigured", async ({
    page,
  }) => {
    await page.goto(`/checkout/${tierIds.oneChance}`);

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
    // Next.js's own route announcer (`#__next-route-announcer__`) also has
    // `role="alert"`, so scope precisely instead of `getByRole("alert")`
    // alone (strict-mode violation caught by this test, not RTL, since
    // jsdom component tests never render Next's router chrome).
    await expect(
      page.getByRole("alert").filter({ hasText: "No pudimos continuar" }),
    ).toBeVisible();
    await expect(page.getByText(/no pudimos iniciar el pago/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /volver a intentar/i }),
    ).toBeVisible();
  });

  test("buying with bank transfer applies the discount and redirects to the comprobante placeholder", async ({
    page,
  }) => {
    await page.goto(`/checkout/${tierIds.threeChances}`);

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
    await page.goto(`/checkout/${tierIds.oneChance}`);

    await page.getByLabel(/dni/i).fill("123");
    await page.getByRole("button", { name: /confirmar compra/i }).click();

    await expect(page).toHaveURL(new RegExp(`/checkout/${tierIds.oneChance}$`));
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(
      page.getByText(/dni válido/i),
    ).toBeVisible();
  });
});
