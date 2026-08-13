import { describe, expect, it } from "vitest";
import { CHANCE_QUANTITIES, suggestTierPrices } from "./tier-pricing";

describe("suggestTierPrices", () => {
  it("returns one row per chance quantity, in ascending order", () => {
    const rows = suggestTierPrices(3_000_000);
    expect(rows.map((row) => row.numbersGranted)).toEqual([...CHANCE_QUANTITIES]);
  });

  it("prices every row above zero and increasing with chance count", () => {
    const rows = suggestTierPrices(3_000_000);
    for (const row of rows) {
      expect(row.priceArs).toBeGreaterThan(0);
    }
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].priceArs).toBeGreaterThan(rows[i - 1].priceArs);
    }
  });

  it("makes price-per-chance decrease as volume grows (bulk discount)", () => {
    const rows = suggestTierPrices(3_000_000);
    const pricePerChance = (row: (typeof rows)[number]) => row.priceArs / row.numbersGranted;
    expect(pricePerChance(rows[0])).toBeGreaterThan(pricePerChance(rows[rows.length - 1]));
  });

  it("scales roughly linearly with prize cost", () => {
    const base = suggestTierPrices(1_000_000);
    const doubled = suggestTierPrices(2_000_000);
    expect(doubled[0].priceArs).toBeCloseTo(base[0].priceArs * 2, -2);
  });

  it("rounds every suggested price to the nearest $500", () => {
    const rows = suggestTierPrices(3_000_000);
    for (const row of rows) {
      expect(row.priceArs % 500).toBe(0);
    }
  });
});
