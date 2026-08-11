import { describe, expect, it } from "vitest";
import { faqItems, previousWinners, tiers, transparency } from "./content";

describe("marketing content", () => {
  it("exposes exactly the 3 tiers seeded in the database (inicial/plus/premium)", () => {
    expect(tiers.map((tier) => tier.key)).toEqual([
      "inicial",
      "plus",
      "premium",
    ]);
  });

  it("keeps tier price and numbersGranted in sync with supabase/seed.sql", () => {
    expect(tiers).toEqual([
      expect.objectContaining({ key: "inicial", priceArs: 15000, numbersGranted: 1 }),
      expect.objectContaining({ key: "plus", priceArs: 35000, numbersGranted: 3 }),
      expect.objectContaining({ key: "premium", priceArs: 60000, numbersGranted: 6 }),
    ]);
  });

  it("orders tiers by ascending price", () => {
    const prices = tiers.map((tier) => tier.priceArs);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("gives every tier at least one bullet point of included content", () => {
    for (const tier of tiers) {
      expect(tier.includes.length).toBeGreaterThan(0);
    }
  });

  it("provides at least one example winner card", () => {
    expect(previousWinners.length).toBeGreaterThan(0);
    for (const winner of previousWinners) {
      expect(winner.displayName).toMatch(/\S/);
      expect(winner.prize).toMatch(/\S/);
    }
  });

  it("provides a non-empty FAQ list", () => {
    expect(faqItems.length).toBeGreaterThan(0);
    for (const item of faqItems) {
      expect(item.question).toMatch(/\S/);
      expect(item.answer).toMatch(/\S/);
    }
  });

  it("marks the legally-sensitive transparency fields as pending real data", () => {
    // These must stay bracketed TODO placeholders (never invented data) until
    // the business supplies the real authorization/escribano details — same
    // convention as terminos-y-condiciones.md.
    expect(transparency.authorizationNumber).toMatch(/^\[.*\]$/);
    expect(transparency.notary.name).toMatch(/^\[.*\]$/);
    expect(transparency.notary.registrationNumber).toMatch(/^\[.*\]$/);
  });
});
