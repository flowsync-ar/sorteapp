import { describe, expect, it, vi } from "vitest";
import { createOrder } from "./actions";

/** Typed no-op redirect for tests that assert `createOrder` never redirects. */
function noopRedirect() {
  return vi.fn() as unknown as (path: string) => never;
}

const validFormData = (overrides: Record<string, string> = {}) => {
  const data: Record<string, string> = {
    name: "Martín García",
    email: "martin@example.com",
    dni: "30123456",
    phone: "+5491123456789",
    method: "mp",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }
  return formData;
};

function makeQueryBuilder(
  result: { data: unknown; error: unknown },
  captureInsert?: (payload: unknown) => void,
) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
    insert: vi.fn((payload: unknown) => {
      captureInsert?.(payload);
      return builder;
    }),
  };
  return builder;
}

function fakeSupabase(options: {
  tier?: { data: unknown; error: unknown };
  edition?: { data: unknown; error: unknown };
  getUser?: { data: unknown; error: unknown };
  signInAnonymously?: { data: unknown; error: unknown };
  insertResult?: { data: unknown; error: unknown };
  captureInsert?: (payload: unknown) => void;
}) {
  const tierBuilder = makeQueryBuilder(
    options.tier ?? { data: { id: "tier-1", price_ars: "15000.00" }, error: null },
  );
  const editionBuilder = makeQueryBuilder(
    options.edition ?? { data: { id: "edition-1" }, error: null },
  );
  const orderBuilder = makeQueryBuilder(
    options.insertResult ?? { data: { id: "order-1" }, error: null },
    options.captureInsert,
  );

  return {
    from: vi.fn((table: string) => {
      if (table === "tier") return tierBuilder;
      if (table === "raffle_edition") return editionBuilder;
      if (table === "order") return orderBuilder;
      throw new Error(`Unexpected table ${table}`);
    }),
    auth: {
      getUser: vi.fn(
        async () => options.getUser ?? { data: { user: null }, error: null },
      ),
      signInAnonymously: vi.fn(
        async () =>
          options.signInAnonymously ?? {
            data: { user: { id: "anon-user-1" } },
            error: null,
          },
      ),
    },
  };
}

describe("createOrder", () => {
  it("returns field errors and never queries the DB when buyer data is invalid", async () => {
    const client = fakeSupabase({});
    const doRedirect = noopRedirect();

    const result = await createOrder(
      "tier-1",
      { status: "idle" },
      validFormData({ name: "Al" }),
      { getClient: async () => client as never, doRedirect },
    );

    expect(result).toEqual({
      status: "error",
      fieldErrors: expect.objectContaining({ name: expect.any(String) }),
    });
    expect(client.from).not.toHaveBeenCalled();
    expect(doRedirect).not.toHaveBeenCalled();
  });

  it("rejects an invalid or missing payment method", async () => {
    const client = fakeSupabase({});

    const result = await createOrder(
      "tier-1",
      { status: "idle" },
      validFormData({ method: "cash" }),
      { getClient: async () => client as never, doRedirect: noopRedirect() },
    );

    expect(result).toEqual({
      status: "error",
      formError: expect.stringMatching(/método de pago/i),
    });
  });

  it("returns a form error when the tier no longer exists", async () => {
    const client = fakeSupabase({ tier: { data: null, error: { message: "not found" } } });

    const result = await createOrder("tier-1", { status: "idle" }, validFormData(), {
      getClient: async () => client as never,
      doRedirect: noopRedirect(),
    });

    expect(result.status).toBe("error");
  });

  it("returns a form error when there is no open edition", async () => {
    const client = fakeSupabase({ edition: { data: null, error: null } });

    const result = await createOrder("tier-1", { status: "idle" }, validFormData(), {
      getClient: async () => client as never,
      doRedirect: noopRedirect(),
    });

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.formError).toMatch(/edición activa/i);
    }
  });

  it("signs in anonymously when there is no session, inserts a pending order with the full MP price, and redirects to the MP placeholder", async () => {
    let insertedPayload: Record<string, unknown> | undefined;
    const client = fakeSupabase({
      captureInsert: (payload) => {
        insertedPayload = payload as Record<string, unknown>;
      },
    });
    const doRedirect = vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });

    await expect(
      createOrder("tier-1", { status: "idle" }, validFormData({ method: "mp" }), {
        getClient: async () => client as never,
        doRedirect: doRedirect as never,
      }),
    ).rejects.toThrow("REDIRECT:/checkout/orden/order-1/mercadopago");

    expect(client.auth.signInAnonymously).toHaveBeenCalledOnce();
    expect(insertedPayload).toMatchObject({
      user_id: "anon-user-1",
      edition_id: "edition-1",
      tier_id: "tier-1",
      method: "mp",
      status: "pending",
      amount_ars: 15000,
      buyer_name: "Martín García",
      buyer_email: "martin@example.com",
      buyer_dni: "30123456",
    });
  });

  it("applies the transfer discount and redirects to the comprobante placeholder", async () => {
    let insertedPayload: Record<string, unknown> | undefined;
    const client = fakeSupabase({
      captureInsert: (payload) => {
        insertedPayload = payload as Record<string, unknown>;
      },
    });
    const doRedirect = vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });

    await expect(
      createOrder("tier-1", { status: "idle" }, validFormData({ method: "transfer" }), {
        getClient: async () => client as never,
        doRedirect: doRedirect as never,
      }),
    ).rejects.toThrow("REDIRECT:/checkout/orden/order-1/comprobante");

    expect(insertedPayload).toMatchObject({ amount_ars: 13500, method: "transfer" });
  });

  it("reuses the existing session's user id instead of signing in anonymously again", async () => {
    const client = fakeSupabase({
      getUser: { data: { user: { id: "existing-user-1" } }, error: null },
    });
    const doRedirect = vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });
    let insertedPayload: Record<string, unknown> | undefined;
    client.from = vi.fn((table: string) => {
      if (table === "order") {
        return makeQueryBuilder({ data: { id: "order-2" }, error: null }, (p) => {
          insertedPayload = p as Record<string, unknown>;
        });
      }
      if (table === "tier")
        return makeQueryBuilder({ data: { id: "tier-1", price_ars: "15000.00" }, error: null });
      if (table === "raffle_edition")
        return makeQueryBuilder({ data: { id: "edition-1" }, error: null });
      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      createOrder("tier-1", { status: "idle" }, validFormData(), {
        getClient: async () => client as never,
        doRedirect: doRedirect as never,
      }),
    ).rejects.toThrow();

    expect(client.auth.signInAnonymously).not.toHaveBeenCalled();
    expect(insertedPayload).toMatchObject({ user_id: "existing-user-1" });
  });

  it("returns a form error when the order insert fails", async () => {
    const client = fakeSupabase({
      insertResult: { data: null, error: { message: "insert failed" } },
    });

    const result = await createOrder("tier-1", { status: "idle" }, validFormData(), {
      getClient: async () => client as never,
      doRedirect: noopRedirect(),
    });

    expect(result.status).toBe("error");
  });
});
