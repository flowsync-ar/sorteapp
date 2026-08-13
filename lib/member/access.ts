import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export class MemberAccessError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MemberAccessError";
  }
}

export interface MemberOrderView {
  id: string;
  chances: number;
  status: string;
  method: string;
  amountArs: number;
  numbers: number[];
}

export interface MemberAccountOverview {
  orders: MemberOrderView[];
  hasCourseAccess: boolean;
}

type OrdersCapableClient = Pick<SupabaseClient, "from">;

/**
 * Reads everything `/mi-cuenta` needs for one buyer (tasks.md PR8.3,
 * spec.md §7 "Member Area"): their orders (tier, status, amount) plus the
 * 6-digit numbers assigned to each, and the gating decision spec.md §7
 * requires — course access is granted ONLY when at least one order is
 * `approved` (design.md's schema truth for "paid"/"verified"; see
 * apply-progress deviation note), NEVER merely from being logged in.
 *
 * Explicitly filters `.eq("user_id", userId)` even though RLS
 * (`order_owner_select`) already scopes every row to its owner — same
 * defensive-filtering convention `lib/receipts/upload.ts` follows, and it
 * lets this function stay unit-testable with a fake client that has no RLS
 * of its own.
 */
export async function getMemberAccountOverview(
  userId: string,
  client: OrdersCapableClient,
): Promise<MemberAccountOverview> {
  const { data: orders, error: ordersError } = await client
    .from("order")
    .select("id, status, method, amount_ars, tier:tier_id(numbers_granted)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw new MemberAccessError(
      `No pudimos leer las órdenes del usuario ${userId}.`,
      ordersError,
    );
  }

  const orderRows = (orders ?? []) as unknown as Array<{
    id: string;
    status: string;
    method: string;
    amount_ars: string | number;
    tier: { numbers_granted: number } | null;
  }>;

  if (orderRows.length === 0) {
    return { orders: [], hasCourseAccess: false };
  }

  const { data: numbers, error: numbersError } = await client
    .from("raffle_number")
    .select("order_id, number")
    .eq("user_id", userId);

  if (numbersError) {
    throw new MemberAccessError(
      `No pudimos leer los números asignados al usuario ${userId}.`,
      numbersError,
    );
  }

  const numbersByOrder = new Map<string, number[]>();
  for (const row of (numbers ?? []) as Array<{ order_id: string; number: number }>) {
    const list = numbersByOrder.get(row.order_id) ?? [];
    list.push(row.number);
    numbersByOrder.set(row.order_id, list);
  }

  const views: MemberOrderView[] = orderRows.map((order) => ({
    id: order.id,
    chances: order.tier?.numbers_granted ?? 0,
    status: order.status,
    method: order.method,
    amountArs: Number(order.amount_ars),
    numbers: numbersByOrder.get(order.id) ?? [],
  }));

  return {
    orders: views,
    hasCourseAccess: views.some((order) => order.status === "approved"),
  };
}
