import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Winner } from "@/lib/marketing/content";

type PublicEditionsClient = Pick<SupabaseClient, "from">;

interface DrawnEditionRow {
  id: string;
  month: number;
  year: number;
  prize_title: string | null;
  winner_number: number;
  winner_display_name: string | null;
  draw_date: string | null;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/**
 * Public "ganadores" feed (tasks.md PR9.5, spec.md §8 "el número ganador...
 * quedan visibles en Transparencia/Ganadores"). Reads `raffle_edition`
 * directly — `raffle_edition_public_select` (RLS, PR2) already exposes any
 * non-`draft` row to `anon`, and `winner_display_name` is set once,
 * pre-scrubbed, by `lib/admin/winners.ts#publishWinner` (never the raw
 * `order.buyer_name`), so this is safe to call with an unauthenticated
 * session — no admin/service_role client needed.
 *
 * `app/(marketing)/page.tsx` and `app/(marketing)/ganadores/page.tsx` fall
 * back to `lib/marketing/content.ts`'s static example `previousWinners`
 * when this returns an empty list (pre-launch, no sorteo published yet) —
 * the minimal change this batch's own scope note asked for, instead of
 * ripping out the static fallback entirely.
 */
export async function getPublishedWinners(
  client: PublicEditionsClient,
  limitCount = 12,
): Promise<Winner[]> {
  const { data, error } = await client
    .from("raffle_edition")
    .select("id, month, year, prize_title, winner_number, winner_display_name, draw_date")
    .eq("status", "drawn")
    .not("winner_number", "is", null)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(limitCount);

  if (error || !data) {
    return [];
  }

  return (data as DrawnEditionRow[]).map((row) => ({
    id: row.id,
    displayName: row.winner_display_name ?? "Ganador/a",
    prize: row.prize_title ?? "Premio del mes",
    dateIso: row.draw_date ?? new Date(row.year, row.month - 1, 1).toISOString(),
    editionLabel: `Edición ${MONTH_NAMES[row.month - 1]} ${row.year}`,
  }));
}
