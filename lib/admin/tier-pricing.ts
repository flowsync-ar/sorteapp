/**
 * Suggests per-edition chance-tier pricing from the prize's real cost
 * (change: edition-tiers calculator). No formula can know actual demand
 * ahead of time, so this only produces a STARTING POINT — the admin form
 * renders every row editable before the edition is created.
 *
 * The volume-discount curve (price-per-chance as a fraction of the
 * 1-chance price) mirrors a validated real-world raffle pricing table,
 * scaled onto this prize's cost via `BASE_PRICE_RATIO` rather than
 * re-derived analytically.
 */

export const CHANCE_QUANTITIES = [1, 2, 4, 6, 10, 15, 20, 30, 50, 200] as const;

const PRICE_PER_CHANCE_RATIO: Record<(typeof CHANCE_QUANTITIES)[number], number> = {
  1: 1,
  2: 0.75,
  4: 0.625,
  6: 0.5833,
  10: 0.45,
  15: 0.4667,
  20: 0.45,
  30: 0.4,
  50: 0.3,
  200: 0.15,
};

/** 1-chance price as a fraction of the prize cost — keeps the entry ticket accessible. */
const BASE_PRICE_RATIO = 0.005;

export interface TierSuggestion {
  numbersGranted: number;
  priceArs: number;
}

export function suggestTierPrices(prizeCostArs: number): TierSuggestion[] {
  const basePricePerChance = prizeCostArs * BASE_PRICE_RATIO;

  return CHANCE_QUANTITIES.map((numbersGranted) => {
    const ratio = PRICE_PER_CHANCE_RATIO[numbersGranted];
    const rawTotal = basePricePerChance * ratio * numbersGranted;
    const priceArs = Math.round(rawTotal / 500) * 500;
    return { numbersGranted, priceArs };
  });
}
