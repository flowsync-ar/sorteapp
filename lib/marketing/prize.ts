import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type PublicEditionsClient = Pick<SupabaseClient, "from">;

interface OpenEditionRow {
  prize_image: string | null;
  prize_title: string | null;
  draw_date: string | null;
}

export interface OpenEditionPrize {
  imageUrl: string | null;
  title: string | null;
  /** Real `draw_date` of the open edition, for `DrawCountdown` — `null` pre-launch. */
  drawDateIso: string | null;
}

/**
 * Public "premio vigente" read (tasks.md prize-image Phase 5, design.md §5).
 * Reads the single `status='open'` `raffle_edition` row directly —
 * `raffle_edition_public_select` (RLS, PR2) already exposes non-draft rows
 * to `anon`, so this is safe with an unauthenticated session, same reasoning
 * `getPublishedWinners` documents. Returns `null` when there is no open
 * edition (pre-launch) or the query fails, so callers can fall back to the
 * static `currentPrize`/placeholder image without a special-case branch.
 */
export async function getOpenEditionPrize(
  client: PublicEditionsClient,
): Promise<OpenEditionPrize | null> {
  const { data, error } = await client
    .from("raffle_edition")
    .select("prize_image, prize_title, draw_date")
    .eq("status", "open")
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0] as OpenEditionRow;
  return {
    imageUrl: row.prize_image,
    title: row.prize_title,
    drawDateIso: row.draw_date,
  };
}
