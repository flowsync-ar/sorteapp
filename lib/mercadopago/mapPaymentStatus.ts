export type OrderStatus = "pending" | "approved" | "rejected" | "expired";

/**
 * Mercado Pago payment statuses that this project treats as a final
 * rejection of the order (spec.md §4 "Pago rechazado" / design.md §4
 * webhook state machine). `cancelled`/`charged_back`/`refunded` all mean
 * "this order did not end up paid" from our side — the nuance between them
 * (e.g. distinguishing a chargeback from an outright rejection for
 * bookkeeping) is out of scope for this MVP webhook and can be read off
 * `order.reject_reason` (stores the MP `status_detail`) later if needed.
 */
const REJECTED_MP_STATUSES = new Set([
  "rejected",
  "cancelled",
  "charged_back",
  "refunded",
]);

/**
 * Maps a Mercado Pago Payments API `status` to this project's `order.status`
 * state machine (`pending|approved|rejected|expired`, design.md §2).
 *
 * Unknown/未 future MP statuses (and the genuinely in-flight ones —
 * `pending`, `in_process`, `authorized`, `in_mediation`) all map to
 * `pending`, i.e. "no transition yet". `lib/mercadopago/webhook.ts` treats a
 * `pending` mapping as an idempotent no-op: nothing changes on the order and
 * `assign_numbers` is never called.
 */
export function mapMercadoPagoStatusToOrderStatus(
  mpStatus: string | undefined | null,
): OrderStatus {
  if (mpStatus === "approved") {
    return "approved";
  }

  if (mpStatus && REJECTED_MP_STATUSES.has(mpStatus)) {
    return "rejected";
  }

  return "pending";
}
