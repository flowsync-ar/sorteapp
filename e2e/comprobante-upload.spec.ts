import { expect, test } from "@playwright/test";

// PR7 batch scope (design.md §5 "Comprobante flow", spec.md §5 "Comprobante
// Manual"): covers the real upload flow against a real local Supabase
// Storage bucket (`supabase start`, migrations applied) — no mocking, the
// file genuinely lands in the `receipts` bucket and a `receipt` row is
// genuinely inserted with `status: "pending"`.
test.describe("Comprobante upload flow", () => {
  test("uploading a valid comprobante moves the order to 'pending review' and blocks re-upload while it's under review", async ({
    page,
  }) => {
    await page.goto("/checkout/inicial");

    await page.getByLabel(/nombre y apellido/i).fill("Comprobante Test");
    await page
      .getByLabel(/^email$/i)
      .fill(`comprobante.${Date.now()}@example.com`);
    await page.getByLabel(/dni/i).fill("30456789");
    await page.getByLabel(/tel[eé]fono/i).fill("+5491100001111");
    await page.getByRole("radio", { name: /transferencia/i }).check();
    await page.getByRole("button", { name: /confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/checkout\/orden\/.+\/comprobante$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Transferencia bancaria" }),
    ).toBeVisible();

    await page.getByLabel(/comprobante de transferencia/i).setInputFiles({
      name: "comprobante.png",
      mimeType: "image/png",
      // Minimal valid 1x1 PNG.
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page.getByRole("button", { name: /subir comprobante/i }).click();

    // The server action revalidates the route on success, so the RSC parent
    // (`page.tsx`) re-renders straight to the "en revisión" branch in the
    // same commit — the client component's own transient "success" message
    // (covered separately by `ComprobanteUploader.test.tsx`) isn't reliably
    // observable here, but this IS the real, stronger proof: it means the
    // receipt row was genuinely persisted server-side, not just an
    // optimistic client-side flash.
    await expect(
      page.getByRole("heading", { level: 1, name: "Comprobante en revisión" }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      /pendiente de revisión/i,
    );

    // Reload the same URL to prove the state survives a full page refetch,
    // not just the client-side router cache from the action's revalidation.
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Comprobante en revisión" }),
    ).toBeVisible();
    await expect(
      page.getByLabel(/comprobante de transferencia/i),
    ).not.toBeVisible();
  });

  test("blocks an oversized/invalid file client-side with an accessible error before submitting", async ({
    page,
  }) => {
    await page.goto("/checkout/plus");

    await page.getByLabel(/nombre y apellido/i).fill("Invalido Test");
    await page
      .getByLabel(/^email$/i)
      .fill(`invalido.${Date.now()}@example.com`);
    await page.getByLabel(/dni/i).fill("30987654");
    await page.getByLabel(/tel[eé]fono/i).fill("+5491100002222");
    await page.getByRole("radio", { name: /transferencia/i }).check();
    await page.getByRole("button", { name: /confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/checkout\/orden\/.+\/comprobante$/);

    await page.getByLabel(/comprobante de transferencia/i).setInputFiles({
      name: "malware.exe",
      mimeType: "application/x-msdownload",
      buffer: Buffer.from("not a real receipt"),
    });
    await page.getByRole("button", { name: /subir comprobante/i }).click();

    // Next.js's own route announcer (`#__next-route-announcer__`) also has
    // `role="alert"` — scope by text instead of `getByRole("alert")` alone
    // (same strict-mode collision `e2e/checkout-flow.spec.ts` documents for
    // the Mercado Pago error path).
    await expect(
      page.getByRole("alert").filter({ hasText: "Formato no permitido" }),
    ).toBeVisible();
    // Client-side validation blocked the submit entirely -- still on the
    // upload form, not the success state.
    await expect(
      page.getByRole("button", { name: /subir comprobante/i }),
    ).toBeVisible();
  });
});
