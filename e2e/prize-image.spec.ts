import { expect, test } from "@playwright/test";
import { createAdminUser } from "./helpers/adminUser";
import { ensureOpenEdition } from "./helpers/seedEdition";

// Minimal valid 1x1 PNG, same fixture `comprobante-upload.spec.ts` uses.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// prize-image batch scope (design.md §4-6, tasks.md Phase 6): covers the
// real upload flow against the real local Supabase `prize-images` Storage
// bucket (public, `supabase/migrations/*_prize_images_storage.sql`) — no
// mocking. An admin re-uploads a photo for the currently open edition
// (`EditionsTable`'s per-row `PrizeImageForm`, `setPrizeImageAction`) and the
// PUBLIC landing hero (`lib/marketing/prize.ts#getOpenEditionPrize`) picks it
// up after the action's own `revalidatePath("/")`.
test.describe("Prize image upload flow", () => {
  test("admin uploads a prize photo for the open edition and the landing hero shows it", async ({
    page,
  }) => {
    const adminEmail = `admin.prize.${Date.now()}@example.com`;
    const adminPassword = "adminsecret123";
    createAdminUser(adminEmail, adminPassword);
    // Same shared-open-edition race documented in `admin.spec.ts` — this
    // spec only ever writes `prize_image`, never `status`, so it doesn't
    // race the status transitions other specs perform on the same row.
    ensureOpenEdition();

    await page.goto("/login");
    await page.getByLabel(/^email$/i).fill(adminEmail);
    await page.getByLabel(/contraseña/i).fill(adminPassword);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL("/admin");

    await page.goto("/admin/ediciones");
    const openRow = page.getByRole("row").filter({ hasText: "Abierta" }).first();
    await expect(openRow).toBeVisible();

    await openRow.getByLabel(/foto del premio/i).setInputFiles({
      name: "premio.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_BASE64, "base64"),
    });
    const submitButton = openRow.getByRole("button", { name: /subir imagen/i });
    await submitButton.click();
    await expect(submitButton).toBeEnabled({ timeout: 15_000 });

    // Reload to read the persisted `prize_image` back from the server
    // (stronger proof than the client's own optimistic blob: preview).
    await page.reload();
    const reloadedRow = page.getByRole("row").filter({ hasText: "Abierta" }).first();
    await expect(reloadedRow.getByAltText(/vista previa del premio/i)).toHaveAttribute(
      "src",
      /prize-images/,
    );

    // `setPrizeImageAction` revalidates "/" — the public landing hero now
    // renders the real uploaded photo instead of the static placeholder.
    // Scoped to the `<figure>` (`HeroPrize`) since `PrizeOfMonth` further
    // down the page shares the exact same `imageAlt` text.
    await page.goto("/");
    const heroImage = page.getByRole("figure").getByAltText(
      "Moto 0km Honda Wave 110s, premio del sorteo de la edición vigente",
    );
    await expect(heroImage).toHaveAttribute("src", /prize-images/);
  });
});
