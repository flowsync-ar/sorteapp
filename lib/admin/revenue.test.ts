import { describe, expect, it, vi } from "vitest";
import { getRevenueSummary } from "./revenue";

function fakeClient(rows: unknown[] | null, error: unknown = null) {
  const select = vi.fn(async () => ({ data: rows, error }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as never, from, select };
}

const rows = [
  {
    edition_id: "ed-1",
    method: "mp",
    status: "approved",
    amount_ars: "15000",
    raffle_edition: { month: 1, year: 2026, status: "closed" },
  },
  {
    edition_id: "ed-1",
    method: "transfer",
    status: "pending",
    amount_ars: "9000",
    raffle_edition: { month: 1, year: 2026, status: "closed" },
  },
  {
    edition_id: "ed-2",
    method: "mp",
    status: "rejected",
    amount_ars: "5000",
    raffle_edition: { month: 2, year: 2026, status: "open" },
  },
];

describe("getRevenueSummary", () => {
  it("reads every order, unfiltered, joined with its edition", async () => {
    const { client, from } = fakeClient(rows);

    await getRevenueSummary(client);

    expect(from).toHaveBeenCalledWith("order");
  });

  it("aggregates the grand total across every order", async () => {
    const { client } = fakeClient(rows);

    const summary = await getRevenueSummary(client);

    expect(summary.totalArs).toBe(29000);
  });

  it("aggregates totals per edition", async () => {
    const { client } = fakeClient(rows);

    const summary = await getRevenueSummary(client);

    expect(summary.byEdition).toEqual([
      {
        editionId: "ed-1",
        editionMonth: 1,
        editionYear: 2026,
        editionStatus: "closed",
        totalArs: 24000,
      },
      {
        editionId: "ed-2",
        editionMonth: 2,
        editionYear: 2026,
        editionStatus: "open",
        totalArs: 5000,
      },
    ]);
  });

  it("aggregates totals per payment method (mp vs transfer)", async () => {
    const { client } = fakeClient(rows);

    const summary = await getRevenueSummary(client);

    expect(summary.byMethod).toEqual({ mp: 20000, transfer: 9000 });
  });

  it("aggregates totals per order status (approved/pending/rejected)", async () => {
    const { client } = fakeClient(rows);

    const summary = await getRevenueSummary(client);

    expect(summary.byStatus).toEqual({ approved: 15000, pending: 9000, rejected: 5000 });
  });

  it("returns a zeroed summary when there are no orders, without throwing", async () => {
    const { client } = fakeClient([]);

    const summary = await getRevenueSummary(client);

    expect(summary).toEqual({ totalArs: 0, byEdition: [], byMethod: {}, byStatus: {} });
  });

  it("throws a domain error when the query fails", async () => {
    const { client } = fakeClient(null, { message: "boom" });

    await expect(getRevenueSummary(client)).rejects.toThrow(/No pudimos calcular la recaudación/);
  });
});
