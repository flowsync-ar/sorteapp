import { expect, test } from "@playwright/test";

// Smoke test only — this scaffold has no real landing UI yet (PR4).
// It proves the Playwright pipeline and the dev server boot correctly.
test("home page loads and shows the placeholder headline", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Premio con respaldo" }),
  ).toBeVisible();
});
