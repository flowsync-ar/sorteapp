import { describe, expect, it, vi } from "vitest";
import { listParticipants } from "./participants";

function fakeClient(rows: unknown[] | null, error: unknown = null) {
  const order = vi.fn(async () => ({ data: rows, error }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as never, from };
}

const baseRow = {
  id: "order-1",
  buyer_name: "Ana Test",
  buyer_email: "ana@example.com",
  status: "approved",
  method: "mp",
  tier: { numbers_granted: 3 },
  raffle_number: [{ number: 123456 }, { number: 654321 }],
};

describe("listParticipants", () => {
  it("maps orders + assigned numbers for the given edition", async () => {
    const { client, from } = fakeClient([baseRow]);

    const result = await listParticipants("edition-1", client);

    expect(from).toHaveBeenCalledWith("order");
    expect(result).toEqual([
      {
        orderId: "order-1",
        buyerName: "Ana Test",
        buyerEmail: "ana@example.com",
        chances: 3,
        status: "approved",
        method: "mp",
        numbers: [123456, 654321],
      },
    ]);
  });

  it("filters in-memory by buyer name, email, or number when a query is given", async () => {
    const { client } = fakeClient([
      baseRow,
      { ...baseRow, id: "order-2", buyer_name: "Beto Otro", buyer_email: "beto@example.com", raffle_number: [{ number: 999999 }] },
    ]);

    const byName = await listParticipants("edition-1", client, "ana");
    expect(byName).toHaveLength(1);
    expect(byName[0].orderId).toBe("order-1");

    const byNumber = await listParticipants("edition-1", client, "999999");
    expect(byNumber).toHaveLength(1);
    expect(byNumber[0].orderId).toBe("order-2");
  });

  it("throws a domain error when the query fails", async () => {
    const { client } = fakeClient(null, { message: "boom" });
    await expect(listParticipants("edition-1", client)).rejects.toThrow(
      /No pudimos leer los participantes/,
    );
  });
});
