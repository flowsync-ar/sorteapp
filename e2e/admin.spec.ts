import { expect, test } from "@playwright/test";
import { createAdminUser, createNonAdminUser } from "./helpers/adminUser";
import { ensureOpenEdition } from "./helpers/seedEdition";

// PR9 batch scope (design.md `(admin)/admin/`, spec.md §8 "Panel Admin"):
// the full closing loop of the MVP — an admin logs in through the SAME
// `/login` PR8 built (role-based redirect, not a separate admin login
// route), reviews a comprobante using PR7's already-shipped review
// endpoint, closes the active edition, and publishes a winner that then
// shows up on the PUBLIC landing (`lib/marketing/winners.ts`).
test.describe("Admin panel", () => {
  test("admin reviews a comprobante, closes the edition, and publishes a winner visible on the landing", async ({
    page,
  }) => {
    const adminEmail = `admin.${Date.now()}@example.com`;
    const adminPassword = "adminsecret123";
    createAdminUser(adminEmail, adminPassword);

    const buyerName = "Comprador Admin Test";

    await page.goto("/checkout/inicial");
    await page.getByLabel(/nombre y apellido/i).fill(buyerName);
    await page.getByLabel(/^email$/i).fill(`buyer.${Date.now()}@example.com`);
    await page.getByLabel(/dni/i).fill("30555666");
    await page.getByLabel(/tel[eé]fono/i).fill("+5491100004444");
    await page.getByRole("radio", { name: /transferencia/i }).check();
    await page.getByRole("button", { name: /confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/checkout\/orden\/.+\/comprobante$/);
    await page.getByLabel(/comprobante de transferencia/i).setInputFiles({
      name: "comprobante.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page.getByRole("button", { name: /subir comprobante/i }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Comprobante en revisión" }),
    ).toBeVisible();

    // Admin signs in through the SAME /login PR8 built — the role-based
    // redirect (app/login/actions.ts) sends an admin session to /admin
    // instead of /mi-cuenta.
    await page.goto("/login");
    await page.getByLabel(/^email$/i).fill(adminEmail);
    await page.getByLabel(/contraseña/i).fill(adminPassword);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL("/admin");

    // Review the pending comprobante (reuses PR7's `reviewReceipt` +
    // `POST /api/admin/receipts/[receiptId]/review`, this batch only adds
    // the queue UI on top). Scoped to this buyer's own row: other e2e specs
    // (`comprobante-upload.spec.ts`) run in parallel and may have their own
    // pending receipts in the same queue at the same time.
    await page.goto("/admin/comprobantes");
    const receiptRow = page.locator("li").filter({ hasText: buyerName });
    await expect(receiptRow).toBeVisible();
    await receiptRow.getByRole("button", { name: /^verificar$/i }).click();
    await expect(receiptRow).not.toBeVisible();

    // Find the number `assignNumbers` just assigned via the participants view.
    await page.goto("/admin/participantes");
    await expect(page.getByText(buyerName)).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: buyerName });
    const numbersCell = row.locator("td").last();
    const numbersText = (await numbersCell.textContent())?.trim() ?? "";
    const winnerNumber = numbersText.split(",")[0]?.trim() ?? "";
    expect(winnerNumber).toMatch(/^\d{6}$/);

    // Close the active edition, then publish the winner.
    await page.goto("/admin/ediciones");
    await page.getByRole("button", { name: /cerrar edición/i }).click();
    await expect(page.getByRole("button", { name: /cerrar edición/i })).not.toBeVisible();

    await page.getByLabel(/número ganador/i).fill(winnerNumber);
    await page.getByRole("button", { name: /publicar ganador/i }).click();
    await expect(page.getByText(new RegExp(winnerNumber))).toBeVisible();

    // Publishing flips `raffle_edition.status` to `drawn` with a scrubbed
    // winner name (`lib/admin/winners.ts`) — `lib/marketing/winners.ts`
    // reads it straight from the public landing, no admin session needed.
    await page.goto("/");
    await expect(page.getByText("Premio E2E")).toBeVisible();
    await expect(page.getByText(/comprador t\./i)).toBeVisible();

    // Known limitation (documented, not silent): `fullyParallel: true`
    // (playwright.config.ts) runs every spec file's tests concurrently, but
    // the schema only ever allows ONE `open` edition at a time
    // (`raffle_edition_single_open`, PR2 — design.md's own "open risk").
    // Closing it here could race a concurrently-running
    // `checkout-flow`/`comprobante-upload`/`member-area` test that needs an
    // open edition to buy against. Re-opening immediately narrows that
    // window but does not eliminate it; a fully race-free fix would need
    // per-worker edition isolation, out of this batch's scope.
    ensureOpenEdition();
  });

  test("admin searches a buyer profile by email and by DNI across editions", async ({ page }) => {
    // admin-panel-v2 work unit 1 (Buyer 360, `lib/admin/buyer-profile.ts`):
    // one order, found by either identifier, no edition filter needed.
    const buyerName = "Comprador Perfil Test";
    const buyerEmail = `perfil.${Date.now()}@example.com`;
    // Unique per run (unlike the fixed DNIs elsewhere in this file) because
    // this test specifically searches BY dni and asserts an exact row count
    // — a repeated static value would collide with orders left by prior runs
    // against this same persistent local DB.
    const buyerDni = String(Date.now()).slice(-8);

    await page.goto("/checkout/inicial");
    await page.getByLabel(/nombre y apellido/i).fill(buyerName);
    await page.getByLabel(/^email$/i).fill(buyerEmail);
    await page.getByLabel(/dni/i).fill(buyerDni);
    await page.getByLabel(/tel[eé]fono/i).fill("+5491100005555");
    await page.getByRole("radio", { name: /transferencia/i }).check();
    await page.getByRole("button", { name: /confirmar compra/i }).click();
    await expect(page).toHaveURL(/\/checkout\/orden\/.+\/comprobante$/);

    const adminEmail = `admin.perfil.${Date.now()}@example.com`;
    const adminPassword = "adminsecret123";
    createAdminUser(adminEmail, adminPassword);

    await page.goto("/login");
    await page.getByLabel(/^email$/i).fill(adminEmail);
    await page.getByLabel(/contraseña/i).fill(adminPassword);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL("/admin");

    await page.goto(`/admin/compradores?q=${encodeURIComponent(buyerEmail)}`);
    await expect(page.getByRole("row")).toHaveCount(2);
    const emailRow = page.getByRole("row").nth(1);
    await expect(emailRow).toContainText("transfer");
    await expect(emailRow).toContainText("pending");

    await page.goto(`/admin/compradores?q=${buyerDni}`);
    await expect(page.getByRole("row")).toHaveCount(2);
    const dniRow = page.getByRole("row").nth(1);
    await expect(dniRow).toContainText("transfer");
    await expect(dniRow).toContainText("pending");
  });

  test("redirects an unauthenticated visitor away from /admin", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/admin");
    await expect(page).toHaveURL("/login");

    await context.close();
  });

  test("redirects an authenticated non-admin session away from /admin", async ({ browser }) => {
    const email = `buyer.${Date.now()}@example.com`;
    const password = "buyersecret123";
    createNonAdminUser(email, password);

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/login");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/contraseña/i).fill(password);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL("/mi-cuenta");

    await page.goto("/admin");
    await expect(page).toHaveURL("/");

    await context.close();
  });
});
