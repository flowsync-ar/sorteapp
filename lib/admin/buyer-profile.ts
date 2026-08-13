import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export class AdminBuyerProfileError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AdminBuyerProfileError";
  }
}

export interface BuyerOrderView {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerDni: string;
  editionMonth: number;
  editionYear: number;
  editionStatus: string;
  prizeTitle: string | null;
  chances: number;
  amountArs: number;
  method: string;
  status: string;
  numbers: number[];
  createdAtIso: string;
}

type OrdersQueryClient = Pick<SupabaseClient, "from">;

interface BuyerOrderRow {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_dni: string;
  method: string;
  status: string;
  amount_ars: string | number;
  created_at: string;
  raffle_edition: {
    month: number;
    year: number;
    status: string;
    prize_title: string | null;
  } | null;
  tier: { numbers_granted: number } | null;
  raffle_number: Array<{ number: number }> | null;
}

/**
 * Buyer 360 lookup, cross-edition (tasks.md admin-panel-v2 work unit 1).
 * Unlike `listParticipants` (scoped to one `edition_id`), this reads the
 * `order` table unfiltered by edition and matches on `buyer_email` OR
 * `buyer_dni` via a single `.or()` filter — one round trip whether the
 * admin searched with an email or a DNI. Admin RLS (`order_admin_all`,
 * `raffle_edition_admin_all`) already grants full cross-edition visibility
 * to an admin session, so this runs against the session-scoped client, not
 * `service_role` — same precedent as `listParticipants`/`listEditions`.
 */
export async function findBuyerOrders(
  identifier: string,
  client: OrdersQueryClient,
): Promise<BuyerOrderView[]> {
  const normalized = identifier.trim();

  const { data, error } = await client
    .from("order")
    .select(
      "id, buyer_name, buyer_email, buyer_dni, method, status, amount_ars, created_at, raffle_edition:edition_id(month,year,status,prize_title), tier:tier_id(numbers_granted), raffle_number(number)",
    )
    .or(`buyer_email.eq.${normalized},buyer_dni.eq.${normalized}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AdminBuyerProfileError("No pudimos leer el historial del comprador.", error);
  }

  const rows = (data ?? []) as unknown as BuyerOrderRow[];

  return rows.map((row) => ({
    orderId: row.id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerDni: row.buyer_dni,
    editionMonth: row.raffle_edition?.month ?? 0,
    editionYear: row.raffle_edition?.year ?? 0,
    editionStatus: row.raffle_edition?.status ?? "",
    prizeTitle: row.raffle_edition?.prize_title ?? null,
    chances: row.tier?.numbers_granted ?? 0,
    amountArs: Number(row.amount_ars),
    method: row.method,
    status: row.status,
    numbers: (row.raffle_number ?? []).map((n) => n.number),
    createdAtIso: row.created_at,
  }));
}
