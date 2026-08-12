import { describe, expect, it, vi } from "vitest";
import { getOpenEditionPrize } from "./prize";

describe("getOpenEditionPrize", () => {
  it("returns the open edition's image url and title", async () => {
    const limit = vi.fn(async () => ({
      data: [{ prize_image: "https://cdn.example.com/prize-images/edition-1?v=1", prize_title: "Moto 0km" }],
      error: null,
    }));
    const eq = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const result = await getOpenEditionPrize({ from } as never);

    expect(from).toHaveBeenCalledWith("raffle_edition");
    expect(eq).toHaveBeenCalledWith("status", "open");
    expect(result).toEqual({
      imageUrl: "https://cdn.example.com/prize-images/edition-1?v=1",
      title: "Moto 0km",
    });
  });

  it("returns a null imageUrl when the open edition has no prize image yet", async () => {
    const limit = vi.fn(async () => ({
      data: [{ prize_image: null, prize_title: "Moto 0km" }],
      error: null,
    }));
    const eq = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const result = await getOpenEditionPrize({ from } as never);

    expect(result).toEqual({ imageUrl: null, title: "Moto 0km" });
  });

  it("returns null when there is no open edition", async () => {
    const limit = vi.fn(async () => ({ data: [], error: null }));
    const eq = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const result = await getOpenEditionPrize({ from } as never);

    expect(result).toBeNull();
  });

  it("returns null on a query error", async () => {
    const limit = vi.fn(async () => ({ data: null, error: new Error("boom") }));
    const eq = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const result = await getOpenEditionPrize({ from } as never);

    expect(result).toBeNull();
  });
});
