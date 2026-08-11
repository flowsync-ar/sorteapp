import { describe, expect, it } from "vitest";
import { TRANSFER_DISCOUNT_PERCENT, computeAmountArs } from "./pricing";

describe("computeAmountArs", () => {
  it("charges the full tier price for Mercado Pago", () => {
    expect(computeAmountArs(15000, "mp")).toBe(15000);
  });

  it("applies the transfer discount for bank-transfer orders", () => {
    expect(computeAmountArs(15000, "transfer")).toBe(13500);
  });

  it("rounds to the nearest peso (no decimals in ARS pricing)", () => {
    expect(computeAmountArs(35000, "transfer")).toBe(31500);
  });

  it("exposes the discount percent used, kept in sync with lib/marketing/content.ts", () => {
    expect(TRANSFER_DISCOUNT_PERCENT).toBe(10);
  });
});
