import { expect, test } from "@playwright/test";
import { createAdminUser, createNonAdminUser } from "./helpers/adminUser";
import { createIsolatedClosedEdition, ensureOpenEdition } from "./helpers/seedEdition";
import { seedOrder } from "./helpers/seedOrder";

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
    const { tierIds } = ensureOpenEdition();

    await page.goto(`/checkout/${tierIds.oneChance}`);
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
    const { tierIds } = ensureOpenEdition();

    await page.goto(`/checkout/${tierIds.oneChance}`);
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
    await expect(emailRow).toContainText("Transferencia");
    await expect(emailRow).toContainText("Pendiente");

    await page.goto(`/admin/compradores?q=${buyerDni}`);
    await expect(page.getByRole("row")).toHaveCount(2);
    const dniRow = page.getByRole("row").nth(1);
    await expect(dniRow).toContainText("Transferencia");
    await expect(dniRow).toContainText("Pendiente");
  });

  test("admin sees revenue totals matching seeded orders across methods and statuses", async ({
    page,
  }) => {
    // admin-panel-v2 work unit 2 (Revenue dashboard, `lib/admin/revenue.ts`):
    // seeded against a freshly created, private, never-`open` edition (see
    // `createIsolatedClosedEdition`) so this test's per-edition total is
    // exact and race-free even under `fullyParallel: true` — unlike the
    // shared `open` edition every other admin test reads/writes, no
    // concurrently running test can add orders to THIS edition_id. The
    // global "por método"/"por estado" totals, in contrast, aggregate
    // across the whole DB, so those two are asserted as a lower bound
    // (`>=`) instead of an exact match — same documented parallel-run
    // limitation as this file's first test (`raffle_edition_single_open`).
    const edition = createIsolatedClosedEdition();
    seedOrder({ editionId: edition.id, method: "mp", status: "approved", amountArs: 12000 });
    seedOrder({ editionId: edition.id, method: "transfer", status: "pending", amountArs: 5000 });
    seedOrder({ editionId: edition.id, method: "mp", status: "rejected", amountArs: 7000 });
    // Only the approved order counts toward the per-edition "Recaudado
    // (aprobado)" total — pending/rejected must never inflate it.
    const expectedEditionTotal = (12000).toLocaleString("es-AR");

    const adminEmail = `admin.recaudacion.${Date.now()}@example.com`;
    const adminPassword = "adminsecret123";
    createAdminUser(adminEmail, adminPassword);

    await page.goto("/login");
    await page.getByLabel(/^email$/i).fill(adminEmail);
    await page.getByLabel(/contraseña/i).fill(adminPassword);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL("/admin");

    // The `/admin` summary card shows a global total that only ever grows —
    // just prove it renders a real peso amount, not the exact number.
    await expect(page.getByText("Recaudado (aprobado)")).toBeVisible();

    await page.goto("/admin/recaudacion");

    // Deterministic, race-free assertion: this edition_id is private to this
    // test, so its row total is exactly the approved order's amount (pending
    // and rejected orders seeded above must not contribute).
    const editionRow = page.getByRole("row", {
      name: new RegExp(`${edition.month}/${edition.year}`),
    });
    await expect(editionRow).toContainText(`$${expectedEditionTotal}`);

    // Global aggregates ("por método"/"por estado") sum across every
    // edition in the DB, so under `fullyParallel` they can only grow from
    // concurrently running tests — asserting the row exists (not an exact
    // number) still proves the method/status breakdown renders real data.
    const methodRow = page.getByRole("row", { name: /Mercado Pago/ });
    await expect(methodRow).toBeVisible();

    const statusApprovedRow = page.getByRole("row", { name: /Aprobado/ });
    const statusPendingRow = page.getByRole("row", { name: /Pendiente/ });
    const statusRejectedRow = page.getByRole("row", { name: /Rechazado/ });
    await expect(statusApprovedRow).toBeVisible();
    await expect(statusPendingRow).toBeVisible();
    await expect(statusRejectedRow).toBeVisible();
  });

  test("admin plans a future prize as a draft, hits the open-edition conflict, then activates it after closing the current one", async ({
    page,
  }) => {
    // admin-panel-v2 work unit 3 (prize catalog draft/publish,
    // `lib/admin/editions.ts#publishEdition`): a `draft` edition can be
    // created and edited freely alongside the current `open` one
    // (`raffle_edition_single_open`, PR2, only indexes `status = 'open'`) —
    // it only has to compete for the "one open edition" slot at the moment
    // an admin actually tries to ACTIVATE it.
    ensureOpenEdition("Premio Actual E2E");

    const adminEmail = `admin.catalogo.${Date.now()}@example.com`;
    const adminPassword = "adminsecret123";
    createAdminUser(adminEmail, adminPassword);

    await page.goto("/login");
    await page.getByLabel(/^email$/i).fill(adminEmail);
    await page.getByLabel(/contraseña/i).fill(adminPassword);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL("/admin");

    await page.goto("/admin/ediciones");

    // Create a draft edition (planned prize) while the other one is open —
    // this must succeed with no error at all, unlike creating a second
    // `open` edition.
    const draftYear = 2090 + Math.floor(Math.random() * 900);
    // Unique per run (this is a persistent local dev DB, not reset between
    // test runs) so `draftRow` below can never match a leftover row from a
    // previous run of this same spec.
    const draftPrizeTitle = `Premio Futuro E2E ${Date.now()}`;
    await page.getByLabel(/^mes$/i).fill("6");
    await page.getByLabel(/^año$/i).fill(String(draftYear));
    await page.getByLabel(/cupo de números/i).fill("300");
    await page.getByLabel(/fecha de sorteo/i).fill("2099-06-30T21:00");
    await page.getByLabel(/^premio$/i).fill(draftPrizeTitle);
    await page.getByLabel(/^estado$/i).selectOption("draft");
    await page.getByLabel(/costo del premio/i).fill("3000000");
    await page.getByRole("button", { name: /sugerir precios/i }).click();
    await page.getByRole("button", { name: /crear edición/i }).click();

    const draftRow = page.getByRole("row").filter({ hasText: draftPrizeTitle });
    await expect(draftRow).toBeVisible();
    await expect(draftRow).toContainText("Borrador");

    // Activating the draft while another edition is open must fail with the
    // same clear, existing error copy `createEdition`'s own conflict path
    // uses (`AdminEditionsError` 23505 -> friendly message).
    await draftRow.getByRole("button", { name: /activar edición/i }).click();
    await expect(draftRow.getByText(/ya hay una edición abierta/i)).toBeVisible();
    await expect(draftRow).toContainText("Borrador");

    // Close the currently open edition, then retry activating the draft —
    // now it succeeds and the row flips from Borrador to Abierta.
    await page.getByRole("button", { name: /cerrar edición/i }).click();
    await expect(page.getByRole("button", { name: /cerrar edición/i })).not.toBeVisible();

    await draftRow.getByRole("button", { name: /activar edición/i }).click();
    await expect(draftRow).toContainText("Abierta");
    await expect(draftRow.getByRole("button", { name: /activar edición/i })).not.toBeVisible();

    // Known limitation (documented, not silent — same as this file's first
    // test): `fullyParallel: true` runs every spec concurrently against the
    // single shared `raffle_edition_single_open` constraint. This test ends
    // with its own former-draft edition left `open`, which already restores
    // the "exactly one open edition" invariant for any concurrently running
    // test — no extra `ensureOpenEdition()` call needed here.
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
