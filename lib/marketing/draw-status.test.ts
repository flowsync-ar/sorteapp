import { describe, expect, it, vi } from "vitest";
import { getCurrentDrawStatus, isDrawLive } from "./draw-status";

function mockClient(response: { data: unknown; error: unknown }) {
  const limit = vi.fn(async () => response);
  const order = vi.fn(() => ({ limit }));
  const inFilter = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ in: inFilter }));
  const from = vi.fn(() => ({ select }));
  return { from, select, inFilter, order, limit };
}

describe("getCurrentDrawStatus", () => {
  it("returns the open edition's draw date and status", async () => {
    const { from, inFilter } = mockClient({
      data: [{ draw_date: "2026-08-31T21:00:00-03:00", status: "open" }],
      error: null,
    });

    const result = await getCurrentDrawStatus({ from } as never);

    expect(from).toHaveBeenCalledWith("raffle_edition");
    expect(inFilter).toHaveBeenCalledWith("status", ["open", "closed"]);
    expect(result).toEqual({
      drawDateIso: "2026-08-31T21:00:00-03:00",
      status: "open",
    });
  });

  it("returns a closed edition awaiting its draw (live window)", async () => {
    const { from } = mockClient({
      data: [{ draw_date: "2026-08-31T21:00:00-03:00", status: "closed" }],
      error: null,
    });

    const result = await getCurrentDrawStatus({ from } as never);

    expect(result).toEqual({
      drawDateIso: "2026-08-31T21:00:00-03:00",
      status: "closed",
    });
  });

  it("returns null when there is no open or closed edition", async () => {
    const { from } = mockClient({ data: [], error: null });

    expect(await getCurrentDrawStatus({ from } as never)).toBeNull();
  });

  it("returns null when the row has no draw_date set", async () => {
    const { from } = mockClient({
      data: [{ draw_date: null, status: "open" }],
      error: null,
    });

    expect(await getCurrentDrawStatus({ from } as never)).toBeNull();
  });

  it("returns null on a query error", async () => {
    const { from } = mockClient({ data: null, error: new Error("boom") });

    expect(await getCurrentDrawStatus({ from } as never)).toBeNull();
  });
});

describe("isDrawLive", () => {
  it("returns false when there is no current draw", () => {
    expect(isDrawLive(null)).toBe(false);
  });

  it("is live once the draw time has passed even while still `open` (regression: closing sales and the draw starting are independent)", () => {
    const pastDrawDate = new Date(Date.now() - 60_000).toISOString();
    expect(isDrawLive({ drawDateIso: pastDrawDate, status: "open" })).toBe(true);
  });

  it("is not live yet, well before the draw", () => {
    const futureDrawDate = new Date(Date.now() + 60 * 60_000).toISOString();
    expect(isDrawLive({ drawDateIso: futureDrawDate, status: "open" })).toBe(false);
  });
});
