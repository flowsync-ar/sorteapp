import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export class AdminRevenueError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AdminRevenueError";
  }
}

export interface RevenueByEdition {
  editionId: string;
  editionMonth: number;
  editionYear: number;
  editionStatus: string;
  totalArs: number;
}

export interface RevenueSummary {
  totalArs: number;
  byEdition: RevenueByEdition[];
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
}

type OrdersQueryClient = Pick<SupabaseClient, "from">;

interface RevenueOrderRow {
  edition_id: string;
  method: string;
  status: string;
  amount_ars: string | number;
  raffle_edition: {
    month: number;
    year: number;
    status: string;
  } | null;
}

/**
 * Revenue summary across every edition (tasks.md admin-panel-v2 work unit 2
 * "Dashboard de recaudación"). Aggregates `amount_ars` by edition, by
 * payment method (mp/transfer) and by order status (pending/approved/
 * rejected/expired) over every order — a single in-memory reduce over one
 * unfiltered `order` read, same MVP-scale precedent `listParticipants`'s
 * free-text filter already set (explicit batch instruction: no RPC, no
 * materialized view). Runs against the session-scoped client — admin RLS
 * (`order_admin_all`, `raffle_edition_admin_all`) already grants full
 * cross-edition visibility, same as `findBuyerOrders`.
 *
 * `totalArs` (the "Recaudado (aprobado)" headline figure) AND every
 * `byEdition[].totalArs` only sum orders with `status === "approved"` —
 * money that was actually collected. Pending and rejected orders must never
 * inflate either figure; an edition with no approved orders still appears
 * in `byEdition` (with `totalArs: 0`) if it has any order at all. Pending
 * and rejected amounts are still visible, correctly bucketed by their own
 * key, in `byStatus` — `byMethod`/`byStatus` intentionally sum every status,
 * since they answer "how much per method/status", not "how much collected".
 */
export async function getRevenueSummary(client: OrdersQueryClient): Promise<RevenueSummary> {
  const { data, error } = await client
    .from("order")
    .select("edition_id, method, status, amount_ars, raffle_edition:edition_id(month,year,status)");

  if (error) {
    throw new AdminRevenueError("No pudimos calcular la recaudación.", error);
  }

  const rows = (data ?? []) as unknown as RevenueOrderRow[];

  let totalArs = 0;
  const byMethod: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const editionTotals = new Map<string, RevenueByEdition>();

  for (const row of rows) {
    const amount = Number(row.amount_ars);
    const isApproved = row.status === "approved";
    if (isApproved) {
      totalArs += amount;
    }
    byMethod[row.method] = (byMethod[row.method] ?? 0) + amount;
    byStatus[row.status] = (byStatus[row.status] ?? 0) + amount;

    const existing = editionTotals.get(row.edition_id);
    if (existing) {
      if (isApproved) {
        existing.totalArs += amount;
      }
    } else {
      editionTotals.set(row.edition_id, {
        editionId: row.edition_id,
        editionMonth: row.raffle_edition?.month ?? 0,
        editionYear: row.raffle_edition?.year ?? 0,
        editionStatus: row.raffle_edition?.status ?? "",
        totalArs: isApproved ? amount : 0,
      });
    }
  }

  return {
    totalArs,
    byEdition: Array.from(editionTotals.values()),
    byMethod,
    byStatus,
  };
}
