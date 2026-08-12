import { describe, expect, it, vi } from "vitest";
import { reviewReceipt } from "./review";

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    update: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
  };
  return builder;
}

function fakeSupabase(options: {
  receiptUpdateResult?: { data: unknown; error: unknown };
  orderUpdateResult?: { data: unknown; error: unknown };
  tierResult?: { data: unknown; error: unknown };
}) {
  const receiptBuilder = makeQueryBuilder(
    options.receiptUpdateResult ?? {
      data: { id: "receipt-1", order_id: "order-1" },
      error: null,
    },
  );
  const orderBuilder = makeQueryBuilder(
    options.orderUpdateResult ?? {
      data: { id: "order-1", tier_key: "inicial" },
      error: null,
    },
  );
  const tierBuilder = makeQueryBuilder(
    options.tierResult ?? { data: { numbers_granted: 3 }, error: null },
  );

  return {
    from: vi.fn((table: string) => {
      if (table === "receipt") return receiptBuilder;
      if (table === "order") return orderBuilder;
      if (table === "tier") return tierBuilder;
      throw new Error(`Unexpected table ${table}`);
    }),
    receiptBuilder,
    orderBuilder,
  };
}

describe("reviewReceipt", () => {
  it("verifies a pending receipt, approves the order, and assigns numbers via the shared assign_numbers wrapper", async () => {
    const supabase = fakeSupabase({});
    const assign = vi.fn().mockResolvedValue({ numbers: [111111, 222222, 333333], soldOut: false });

    const result = await reviewReceipt(
      "receipt-1",
      "verified",
      { reviewedBy: "admin-1" },
      { supabase: supabase as never, assign },
    );

    expect(result).toEqual({
      applied: true,
      receiptId: "receipt-1",
      orderId: "order-1",
      decision: "verified",
    });
    expect(supabase.receiptBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "verified", reject_reason: null }),
    );
    expect(supabase.orderBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" }),
    );
    expect(assign).toHaveBeenCalledWith("order-1", 3, supabase);
  });

  it("rejects a pending receipt with a reason, rejects the order, and never assigns numbers", async () => {
    const supabase = fakeSupabase({});
    const assign = vi.fn();

    const result = await reviewReceipt(
      "receipt-1",
      "rejected",
      { reviewedBy: "admin-1", reason: "Monto no coincide" },
      { supabase: supabase as never, assign },
    );

    expect(result).toEqual({
      applied: true,
      receiptId: "receipt-1",
      orderId: "order-1",
      decision: "rejected",
    });
    expect(supabase.receiptBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", reject_reason: "Monto no coincide" }),
    );
    expect(supabase.orderBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", reject_reason: "Monto no coincide" }),
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("is idempotent: a receipt that is no longer pending is a no-op (already-processed)", async () => {
    const supabase = fakeSupabase({ receiptUpdateResult: { data: null, error: null } });
    const assign = vi.fn();

    const result = await reviewReceipt(
      "receipt-1",
      "verified",
      { reviewedBy: "admin-1" },
      { supabase: supabase as never, assign },
    );

    expect(result).toEqual({ applied: false, reason: "already-processed" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("throws when the receipt update itself errors", async () => {
    const supabase = fakeSupabase({
      receiptUpdateResult: { data: null, error: { message: "db down" } },
    });

    await expect(
      reviewReceipt(
        "receipt-1",
        "verified",
        { reviewedBy: "admin-1" },
        { supabase: supabase as never, assign: vi.fn() },
      ),
    ).rejects.toThrow(/no pudimos actualizar el comprobante/i);
  });

  it("throws when the tier lookup fails while verifying", async () => {
    const supabase = fakeSupabase({ tierResult: { data: null, error: { message: "not found" } } });

    await expect(
      reviewReceipt(
        "receipt-1",
        "verified",
        { reviewedBy: "admin-1" },
        { supabase: supabase as never, assign: vi.fn() },
      ),
    ).rejects.toThrow(/no pudimos leer el tier/i);
  });
});
