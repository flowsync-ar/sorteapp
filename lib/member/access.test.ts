import { describe, expect, it, vi } from "vitest";
import { getMemberAccountOverview, MemberAccessError } from "./access";

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(async () => result),
  };
  return builder;
}

function fakeSupabase(options: {
  orders?: { data: unknown; error: unknown };
  numbers?: { data: unknown; error: unknown };
}) {
  const ordersBuilder = makeQueryBuilder(
    options.orders ?? { data: [], error: null },
  );
  const numbersBuilder = {
    select: vi.fn(() => numbersBuilder),
    eq: vi.fn(async () => options.numbers ?? { data: [], error: null }),
  };

  return {
    client: {
      from: vi.fn((table: string) => {
        if (table === "order") return ordersBuilder;
        if (table === "raffle_number") return numbersBuilder;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as never,
  };
}

describe("getMemberAccountOverview", () => {
  it("returns no course access when the buyer has no orders", async () => {
    const { client } = fakeSupabase({});

    const result = await getMemberAccountOverview("user-1", client);

    expect(result).toEqual({ orders: [], hasCourseAccess: false });
  });

  it("returns no course access when every order is still pending/rejected", async () => {
    const { client } = fakeSupabase({
      orders: {
        data: [
          {
            id: "order-1",
            status: "pending",
            method: "transfer",
            amount_ars: "13500",
            tier: { numbers_granted: 1 },
          },
          {
            id: "order-2",
            status: "rejected",
            method: "mp",
            amount_ars: "35000",
            tier: { numbers_granted: 3 },
          },
        ],
        error: null,
      },
    });

    const result = await getMemberAccountOverview("user-1", client);

    expect(result.hasCourseAccess).toBe(false);
    expect(result.orders).toHaveLength(2);
  });

  it("grants course access when at least one order is approved, and attaches its assigned numbers", async () => {
    const { client } = fakeSupabase({
      orders: {
        data: [
          {
            id: "order-1",
            status: "approved",
            method: "mp",
            amount_ars: "60000",
            tier: { numbers_granted: 6 },
          },
        ],
        error: null,
      },
      numbers: {
        data: [
          { order_id: "order-1", number: 4821 },
          { order_id: "order-1", number: 990001 },
        ],
        error: null,
      },
    });

    const result = await getMemberAccountOverview("user-1", client);

    expect(result.hasCourseAccess).toBe(true);
    expect(result.orders).toEqual([
      {
        id: "order-1",
        chances: 6,
        status: "approved",
        method: "mp",
        amountArs: 60000,
        numbers: [4821, 990001],
      },
    ]);
  });

  it("throws MemberAccessError when the orders query fails", async () => {
    const { client } = fakeSupabase({
      orders: { data: null, error: { message: "db down" } },
    });

    await expect(getMemberAccountOverview("user-1", client)).rejects.toThrow(
      MemberAccessError,
    );
  });
});
