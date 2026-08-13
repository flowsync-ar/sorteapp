import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isWithinLiveWindow } from "./live-window";

type DrawStatusClient = Pick<SupabaseClient, "from">;

interface DrawStatusRow {
  draw_date: string | null;
  status: "open" | "closed";
}

export interface CurrentDrawStatus {
  drawDateIso: string;
  /** `open` = still selling; `closed` = sales stopped. Whether the draw is
   * "live" depends only on `drawDateIso` vs now (`isWithinLiveWindow`) —
   * not on this field, since closing sales and the draw actually starting
   * are independent admin actions with no guaranteed order. */
  status: "open" | "closed";
}

/**
 * Powers the header's "Ver Sorteo en Vivo" badge (`LiveDrawBadge`): the one
 * edition currently relevant to a live/upcoming draw.
 *
 * Two separate queries, deliberately NOT a single `.in(["open","closed"])
 * .order("draw_date", desc).limit(1)` (an earlier version of this function
 * did exactly that, and it's a real bug: with more than one `closed`
 * edition lying around — old test data, a re-run edition, whatever — "the
 * row with the furthest-future draw_date" can easily be a stale `closed`
 * edition instead of the one that's actually `open` right now, silently
 * pointing the live badge at the wrong draw). Only one edition can be
 * `open` at a time (`raffle_edition_single_open`, PR2), so it's checked
 * first and always wins when present; the `closed` fallback (most recent
 * draw_date) only runs when nothing is open. Once the admin publishes a
 * winner (`status` -> `drawn`), the edition drops out of both queries and
 * this returns `null` — the live window is over.
 */
export async function getCurrentDrawStatus(
  client: DrawStatusClient,
): Promise<CurrentDrawStatus | null> {
  const open = await client
    .from("raffle_edition")
    .select("draw_date, status")
    .eq("status", "open")
    .limit(1);

  if (!open.error && open.data && open.data.length > 0) {
    const row = open.data[0] as DrawStatusRow;
    if (row.draw_date) {
      return { drawDateIso: row.draw_date, status: "open" };
    }
  }

  const closed = await client
    .from("raffle_edition")
    .select("draw_date, status")
    .eq("status", "closed")
    .order("draw_date", { ascending: false })
    .limit(1);

  if (closed.error || !closed.data || closed.data.length === 0) {
    return null;
  }

  const row = closed.data[0] as DrawStatusRow;
  if (!row.draw_date) {
    return null;
  }

  return { drawDateIso: row.draw_date, status: "closed" };
}

/** Whether `draw` is inside its live window right now: draw time has
 * arrived (open or closed, either is fine — see `isWithinLiveWindow`),
 * winner not yet published (kept as a standalone helper, not inlined at the
 * call site, so Server Component render bodies don't call the impure
 * `Date.now()` directly — see `react-hooks/purity`). */
export function isDrawLive(draw: CurrentDrawStatus | null): boolean {
  if (!draw) return false;
  return isWithinLiveWindow(draw.drawDateIso);
}
