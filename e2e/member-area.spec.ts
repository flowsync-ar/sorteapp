import { expect, test } from "@playwright/test";
import { simulateOrderApproval } from "./helpers/simulateApproval";
import { ensureOpenEdition } from "./helpers/seedEdition";

// PR8 batch scope (design.md §1 `(member)/`, spec.md §7 "Member Area"):
// covers the full loop this batch adds on top of PR5's anonymous guest
// checkout — buy -> (simulate) payment approved -> claim account -> log in
// again from a brand-new browser context (a different "device"/session) ->
// see the gated course content and assigned number persist. Order approval
// itself is faked via `simulateOrderApproval` (raw SQL) instead of driving
// the real MP/comprobante flows, which PR6/PR7's own specs already cover.
test.describe("Member area", () => {
  test("claim account after approval, then log in from a fresh session and see the gated course", async ({
    page,
    browser,
  }) => {
    const email = `claim.${Date.now()}@example.com`;
    const password = "secret123";

    const { tierIds } = ensureOpenEdition();
    await page.goto(`/checkout/${tierIds.oneChance}`);
    await page.getByLabel(/nombre y apellido/i).fill("Miembro Test");
    await page.getByLabel(/^email$/i).fill(`comprador.${Date.now()}@example.com`);
    await page.getByLabel(/dni/i).fill("30111222");
    await page.getByLabel(/tel[eé]fono/i).fill("+5491100003333");
    await page.getByRole("radio", { name: /transferencia/i }).check();
    await page.getByRole("button", { name: /confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/checkout\/orden\/.+\/comprobante$/);
    const orderId = page.url().match(/\/checkout\/orden\/([^/]+)\/comprobante$/)?.[1];
    if (!orderId) throw new Error("Could not extract orderId from URL");

    simulateOrderApproval(orderId);
    await page.reload();

    await expect(
      page.getByRole("heading", { level: 1, name: "¡Comprobante verificado!" }),
    ).toBeVisible();
    const memberAreaLink = page.getByRole("link", { name: /ver mi curso/i });
    await expect(memberAreaLink).toBeVisible();
    await memberAreaLink.click();

    await expect(page).toHaveURL("/mi-cuenta");
    await expect(page.getByRole("heading", { name: /reclamá tu cuenta/i })).toBeVisible();
    await expect(page.getByText(/1 chance/i).first()).toBeVisible();
    await expect(page.getByText(/bienvenida y primeros pasos/i)).toBeVisible();

    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByLabel(/repetir contraseña/i).fill(password);
    await page.getByRole("button", { name: /guardar y reclamar/i }).click();

    // `claimAccountAction`'s `revalidatePath("/mi-cuenta")` re-renders the
    // whole RSC page in the same commit as the response, so the client
    // island's own transient "¡Cuenta reclamada!" message isn't reliably
    // observable here (same gotcha `e2e/comprobante-upload.spec.ts`
    // documents for `uploadReceiptAction`/`ComprobanteUploader`) — assert
    // the real, server-rendered proof instead: the claim banner is gone
    // because `user.is_anonymous` really flipped to false.
    await expect(
      page.getByRole("heading", { name: /reclamá tu cuenta/i }),
    ).not.toBeVisible();
    await expect(page.getByRole("button", { name: /cerrar sesión/i })).toBeVisible();

    // Fresh browser context = no cookies from the anonymous session above,
    // simulating a genuinely different device/session.
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();

    await freshPage.goto("/login");
    await freshPage.getByLabel(/^email$/i).fill(email);
    await freshPage.getByLabel(/contraseña/i).fill(password);
    await freshPage.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(freshPage).toHaveURL("/mi-cuenta");
    // No longer anonymous -> no claim prompt, but the sign-out control shows.
    await expect(
      freshPage.getByRole("heading", { name: /reclamá tu cuenta/i }),
    ).not.toBeVisible();
    await expect(freshPage.getByRole("button", { name: /cerrar sesión/i })).toBeVisible();
    await expect(freshPage.getByText(/bienvenida y primeros pasos/i)).toBeVisible();

    await freshContext.close();
  });

  test("redirects an unauthenticated visitor from /mi-cuenta to /login", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/mi-cuenta");

    await expect(page).toHaveURL("/login");

    await context.close();
  });
});
