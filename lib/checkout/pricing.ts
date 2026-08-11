/**
 * Server-authoritative pricing for `createOrder` (spec.md §2 "descuento por
 * transferencia visible"). `lib/marketing/content.ts` shows the same 10%
 * discount per tier for presentation purposes only — this constant is the
 * one actually charged. Kept as a single flat constant because all 3 seeded
 * tiers currently share the same `transferDiscountPercent` (see
 * `supabase/seed.sql` / `lib/marketing/content.ts`); if a tier ever needs a
 * different discount, this must become per-tier and read from the `tier`
 * table instead of a shared constant.
 */
export const TRANSFER_DISCOUNT_PERCENT = 10;

export type PaymentMethod = "mp" | "transfer";

/** Computes the amount to charge (ARS, rounded to the nearest peso). */
export function computeAmountArs(
  tierPriceArs: number,
  method: PaymentMethod,
): number {
  if (method === "mp") {
    return tierPriceArs;
  }

  return Math.round(tierPriceArs * (1 - TRANSFER_DISCOUNT_PERCENT / 100));
}
