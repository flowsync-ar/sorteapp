import { describe, expect, it, vi } from "vitest";
import { AssignNumbersError, assignNumbers } from "./assign";

/**
 * Minimal fake of the slice of the Supabase client `assignNumbers` depends
 * on (`.rpc(...)`). Avoids pulling in a real `SupabaseClient` (and its env
 * requirements) just to unit-test this thin wrapper — see design.md
 * `lib/raffle/assign.ts # thin caller of RPC assign_numbers`.
 */
function fakeClient(rpc: ReturnType<typeof vi.fn>) {
  return { rpc } as unknown as Parameters<typeof assignNumbers>[2];
}

describe("assignNumbers", () => {
  it("calls the assign_numbers RPC with the order id and quantity", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [123456], error: null });

    await assignNumbers("order-1", 1, fakeClient(rpc));

    expect(rpc).toHaveBeenCalledWith("assign_numbers", {
      p_order_id: "order-1",
      p_qty: 1,
    });
  });

  it("returns the assigned numbers and soldOut=false on success", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: [123456, 654321], error: null });

    const result = await assignNumbers("order-1", 2, fakeClient(rpc));

    expect(result).toEqual({ numbers: [123456, 654321], soldOut: false });
  });

  it("reports soldOut=true when the RPC returns fewer rows than requested (rango agotado)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });

    const result = await assignNumbers("order-1", 5, fakeClient(rpc));

    expect(result).toEqual({ numbers: [], soldOut: true });
  });

  it("reports soldOut=true on a partial allocation (fewer numbers than requested)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [111111, 222222], error: null });

    const result = await assignNumbers("order-1", 5, fakeClient(rpc));

    expect(result.soldOut).toBe(true);
    expect(result.numbers).toEqual([111111, 222222]);
  });

  it("throws AssignNumbersError when the RPC call errors", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "permission denied for function assign_numbers" },
    });

    await expect(assignNumbers("order-1", 1, fakeClient(rpc))).rejects.toThrow(
      AssignNumbersError,
    );
    await expect(assignNumbers("order-1", 1, fakeClient(rpc))).rejects.toThrow(
      /permission denied for function assign_numbers/,
    );
  });

  it("preserves the original Supabase error as `cause` for debugging/logging", async () => {
    const supabaseError = { message: "boom", code: "XX000" };
    const rpc = vi.fn().mockResolvedValue({ data: null, error: supabaseError });

    try {
      await assignNumbers("order-1", 1, fakeClient(rpc));
      expect.unreachable("assignNumbers should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AssignNumbersError);
      expect((err as AssignNumbersError).cause).toBe(supabaseError);
    }
  });
});
