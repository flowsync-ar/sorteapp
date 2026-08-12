import { describe, expect, it, vi } from "vitest";
import { getPublishedWinners } from "./winners";

describe("getPublishedWinners", () => {
  it("maps drawn editions into the public Winner shape", async () => {
    const limit = vi.fn(async () => ({
      data: [
        {
          id: "edition-1",
          month: 8,
          year: 2026,
          prize_title: "Moto 0km",
          winner_number: 555555,
          winner_display_name: "Martín G.",
          draw_date: "2026-08-31T21:00:00Z",
        },
      ],
      error: null,
    }));
    const order2 = vi.fn(() => ({ limit }));
    const order1 = vi.fn(() => ({ order: order2 }));
    const not = vi.fn(() => ({ order: order1 }));
    const eq = vi.fn(() => ({ not }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const result = await getPublishedWinners({ from } as never);

    expect(from).toHaveBeenCalledWith("raffle_edition");
    expect(result).toEqual([
      {
        id: "edition-1",
        displayName: "Martín G.",
        prize: "Moto 0km",
        dateIso: "2026-08-31T21:00:00Z",
        editionLabel: "Edición Agosto 2026",
      },
    ]);
  });

  it("returns an empty list when there are no drawn editions", async () => {
    const limit = vi.fn(async () => ({ data: [], error: null }));
    const order2 = vi.fn(() => ({ limit }));
    const order1 = vi.fn(() => ({ order: order2 }));
    const not = vi.fn(() => ({ order: order1 }));
    const eq = vi.fn(() => ({ not }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const result = await getPublishedWinners({ from } as never);
    expect(result).toEqual([]);
  });
});
