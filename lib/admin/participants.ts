import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export class AdminParticipantsError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AdminParticipantsError";
  }
}

export interface ParticipantView {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  chances: number;
  status: string;
  method: string;
  numbers: number[];
}

type OrdersQueryClient = Pick<SupabaseClient, "from">;

interface ParticipantRow {
  id: string;
  buyer_name: string;
  buyer_email: string;
  status: string;
  method: string;
  tier: { numbers_granted: number } | null;
  raffle_number: Array<{ number: number }> | null;
}

/**
 * Participant search for one edition (tasks.md PR9.3, spec.md §8 "buscar
 * participantes por edición/número"). Reads through the same `order`/
 * `raffle_number` tables the buyer-facing `lib/member/access.ts` reads, just
 * scoped by `edition_id` instead of `user_id` — admin RLS (`order_admin_all`,
 * `raffle_number_admin_select`) grants full visibility.
 *
 * The free-text filter (buyer name/email or a 6-digit number) runs in memory
 * after the fetch: this MVP's expected edition size (a few hundred orders at
 * most) makes a second round-trip or a `.ilike`/`.textSearch` query
 * unnecessary complexity for now.
 */
export async function listParticipants(
  editionId: string,
  client: OrdersQueryClient,
  query?: string,
): Promise<ParticipantView[]> {
  const { data, error } = await client
    .from("order")
    .select(
      "id, buyer_name, buyer_email, status, method, tier:tier_id(numbers_granted), raffle_number(number)",
    )
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AdminParticipantsError("No pudimos leer los participantes de la edición.", error);
  }

  const rows = (data ?? []) as unknown as ParticipantRow[];

  const views: ParticipantView[] = rows.map((row) => ({
    orderId: row.id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    chances: row.tier?.numbers_granted ?? 0,
    status: row.status,
    method: row.method,
    numbers: (row.raffle_number ?? []).map((n) => n.number),
  }));

  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) {
    return views;
  }

  return views.filter(
    (view) =>
      view.buyerName.toLowerCase().includes(normalizedQuery) ||
      view.buyerEmail.toLowerCase().includes(normalizedQuery) ||
      view.numbers.some((number) => number.toString().padStart(6, "0").includes(normalizedQuery)),
  );
}
