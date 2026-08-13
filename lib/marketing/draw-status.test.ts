import { describe, expect, it, vi } from "vitest";
import { getCurrentDrawStatus, isDrawLive } from "./draw-status";

/**
 * Mocks `.from("raffle_edition").select(...).eq("status", X)...` where the
 * response depends on which status was queried — `getCurrentDrawStatus`
 * checks `open` first, then `closed`, as two separate calls.
 */
function mockClient(responses: {
  open?: { data: unknown; error: unknown };
  closed?: { data: unknown; error: unknown };
}) {
  const eqCalls: unknown[][] = [];

  const eq = vi.fn((...args: unknown[]) => {
    eqCalls.push(args);
    const status = args[1];
    const response =
      status === "open"
        ? (responses.open ?? { data: [], error: null })
        : (responses.closed ?? { data: [], error: null });
    return {
      limit: vi.fn(async () => response),
      order: vi.fn(() => ({ limit: vi.fn(async () => response) })),
    };
  });
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return { from, select, eq, eqCalls };
}

describe("getCurrentDrawStatus", () => {
  it("returns the open edition's draw date and status", async () => {
    const { from, eq } = mockClient({
      open: { data: [{ draw_date: "2026-08-31T21:00:00-03:00", status: "open" }], error: null },
    });

    const result = await getCurrentDrawStatus({ from } as never);

    expect(from).toHaveBeenCalledWith("raffle_edition");
    expect(eq).toHaveBeenCalledWith("status", "open");
    expect(result).toEqual({
      drawDateIso: "2026-08-31T21:00:00-03:00",
      status: "open",
    });
  });

  it("prefers the open edition over a closed one with a later draw_date (regression: a stale closed edition used to win by having the furthest-future date)", async () => {
    const { from } = mockClient({
      open: { data: [{ draw_date: "2026-08-13T04:10:00Z", status: "open" }], error: null },
      closed: { data: [{ draw_date: "2026-09-30T21:00:00Z", status: "closed" }], error: null },
    });

    const result = await getCurrentDrawStatus({ from } as never);

    expect(result).toEqual({ drawDateIso: "2026-08-13T04:10:00Z", status: "open" });
  });

  it("falls back to the closed edition when none is open (live window)", async () => {
    const { from } = mockClient({
      closed: { data: [{ draw_date: "2026-08-31T21:00:00-03:00", status: "closed" }], error: null },
    });

    const result = await getCurrentDrawStatus({ from } as never);

    expect(result).toEqual({
      drawDateIso: "2026-08-31T21:00:00-03:00",
      status: "closed",
    });
  });

  it("returns null when there is no open or closed edition", async () => {
    const { from } = mockClient({});

    expect(await getCurrentDrawStatus({ from } as never)).toBeNull();
  });

  it("returns null when the open row has no draw_date and there's no closed fallback", async () => {
    const { from } = mockClient({
      open: { data: [{ draw_date: null, status: "open" }], error: null },
    });

    expect(await getCurrentDrawStatus({ from } as never)).toBeNull();
  });

  it("returns null when both queries error", async () => {
    const { from } = mockClient({
      open: { data: null, error: new Error("boom") },
      closed: { data: null, error: new Error("boom") },
    });

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
