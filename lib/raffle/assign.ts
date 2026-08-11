import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Thrown when the `assign_numbers` RPC itself errors (permission denied,
 * order not found, invalid qty, etc.) — as opposed to a normal "sold out"
 * outcome, which is reported via `AssignNumbersResult.soldOut` instead
 * (see `supabase/migrations/*_assign_numbers.sql` for why: the RPC returns
 * zero rows rather than raising on a sold-out edition, so callers must
 * check row count, not catch an exception).
 */
export class AssignNumbersError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AssignNumbersError";
  }
}

export interface AssignNumbersResult {
  /** The 6-digit numbers assigned to this order (may be fewer than `qty`). */
  numbers: number[];
  /**
   * True when fewer numbers were returned than requested — the edition's
   * range was exhausted mid-allocation and the RPC auto-closed it
   * (spec.md "rango agotado"). Callers must check this instead of relying
   * on an exception.
   */
  soldOut: boolean;
}

type RpcCapableClient = Pick<SupabaseClient, "rpc">;

/**
 * Server-only, thin typed wrapper around the `assign_numbers` Postgres RPC
 * (design.md `lib/raffle/assign.ts # thin caller of RPC assign_numbers`).
 * Must be called with a `service_role` client (`createAdminClient()`,
 * used by default) since the RPC is REVOKEd from anon/authenticated.
 */
export async function assignNumbers(
  orderId: string,
  qty: number,
  client: RpcCapableClient = createAdminClient(),
): Promise<AssignNumbersResult> {
  const { data, error } = await client.rpc("assign_numbers", {
    p_order_id: orderId,
    p_qty: qty,
  });

  if (error) {
    throw new AssignNumbersError(
      `assign_numbers RPC failed for order ${orderId}: ${error.message}`,
      error,
    );
  }

  const numbers = (data ?? []) as number[];

  return {
    numbers,
    soldOut: numbers.length < qty,
  };
}
