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
 * edition currently relevant to a live/upcoming draw. Only one edition can
 * be `open` at a time (`raffle_edition_single_open`, PR2) and it takes
 * priority; otherwise falls back to the most recently `closed` one (sales
 * stopped, awaiting/undergoing the draw). Once the admin publishes a winner
 * (`status` flips to `drawn`), it drops out of both buckets and this
 * returns `null` — the live window is over.
 */
export async function getCurrentDrawStatus(
  client: DrawStatusClient,
): Promise<CurrentDrawStatus | null> {
  const { data, error } = await client
    .from("raffle_edition")
    .select("draw_date, status")
    .in("status", ["open", "closed"])
    .order("draw_date", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0] as DrawStatusRow;
  if (!row.draw_date) {
    return null;
  }

  return { drawDateIso: row.draw_date, status: row.status };
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
