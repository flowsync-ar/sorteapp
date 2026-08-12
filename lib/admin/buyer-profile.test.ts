import { describe, expect, it, vi } from "vitest";
import { findBuyerOrders } from "./buyer-profile";

function fakeClient(rows: unknown[] | null, error: unknown = null) {
  const order = vi.fn(async () => ({ data: rows, error }));
  const or = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ or }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as never, from, or, order };
}

const baseRow = {
  id: "order-1",
  buyer_name: "Ana Test",
  buyer_email: "ana@example.com",
  buyer_dni: "30111222",
  tier_key: "plus",
  method: "mp",
  status: "approved",
  amount_ars: "15000",
  created_at: "2026-01-05T10:00:00Z",
  raffle_edition: { month: 1, year: 2026, status: "closed", prize_title: "Premio Enero" },
  raffle_number: [{ number: 123456 }],
};

describe("findBuyerOrders", () => {
  it("matches by buyer_email OR buyer_dni via a single .or() filter, joining edition + numbers", async () => {
    const { client, from, or } = fakeClient([baseRow]);

    const result = await findBuyerOrders("ana@example.com", client);

    expect(from).toHaveBeenCalledWith("order");
    expect(or).toHaveBeenCalledWith(
      "buyer_email.eq.ana@example.com,buyer_dni.eq.ana@example.com",
    );
    expect(result).toEqual([
      {
        orderId: "order-1",
        buyerName: "Ana Test",
        buyerEmail: "ana@example.com",
        buyerDni: "30111222",
        editionMonth: 1,
        editionYear: 2026,
        editionStatus: "closed",
        prizeTitle: "Premio Enero",
        tierKey: "plus",
        amountArs: 15000,
        method: "mp",
        status: "approved",
        numbers: [123456],
        createdAtIso: "2026-01-05T10:00:00Z",
      },
    ]);
  });

  it("matches when searching by DNI instead of email", async () => {
    const { client, or } = fakeClient([baseRow]);

    await findBuyerOrders("30111222", client);

    expect(or).toHaveBeenCalledWith("buyer_email.eq.30111222,buyer_dni.eq.30111222");
  });

  it("orders results newest first via created_at", async () => {
    const { client, order } = fakeClient([baseRow]);

    await findBuyerOrders("ana@example.com", client);

    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns an empty list when no order matches, without throwing", async () => {
    const { client } = fakeClient([]);

    const result = await findBuyerOrders("nadie@example.com", client);

    expect(result).toEqual([]);
  });

  it("throws a domain error when the query fails", async () => {
    const { client } = fakeClient(null, { message: "boom" });

    await expect(findBuyerOrders("ana@example.com", client)).rejects.toThrow(
      /No pudimos leer el historial/,
    );
  });
});
