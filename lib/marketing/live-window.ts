// No `server-only` guard here on purpose: this is imported both from the
// server (`draw-status.ts`'s `isDrawLive`) and from the client
// (`LiveDrawNavItem`), so the "vivo" threshold lives in exactly one place.

/** Minutes before the scheduled draw time the "Ver Sorteo en Vivo" badge and
 * `/vivo` switch to live — long enough to join before the real thing
 * starts, short enough the room doesn't sit empty for hours. */
export const LIVE_WINDOW_MINUTES = 15;

/**
 * Purely time-based: the draw's own schedule is what "vivo" means, not
 * whether the admin happened to close sales first — those are independent
 * actions and closing isn't guaranteed to land before the draw time. The
 * live window still ends correctly once the winner is published, because
 * `getCurrentDrawStatus`'s query (`status in ('open','closed')`) stops
 * returning the edition at all the moment it flips to `drawn`.
 */
export function isWithinLiveWindow(drawDateIso: string, now: number = Date.now()): boolean {
  return now >= new Date(drawDateIso).getTime() - LIVE_WINDOW_MINUTES * 60_000;
}
