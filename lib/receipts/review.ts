import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignNumbers } from "@/lib/raffle/assign";

/**
 * Thrown when a receipt/order update itself errors (permission denied, DB
 * down, tier lookup failure) — as opposed to a normal "already processed"
 * outcome, which is reported via `ReviewReceiptResult` instead (mirrors
 * `MercadoPagoWebhookProcessingError`'s distinction).
 */
export class ReceiptReviewError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ReceiptReviewError";
  }
}

export type ReceiptDecision = "verified" | "rejected";

export interface ReviewReceiptOptions {
  reviewedBy: string;
  reason?: string;
}

export interface ReviewReceiptOverrides {
  supabase?: SupabaseClient;
  assign?: typeof assignNumbers;
}

export type ReviewReceiptResult =
  | { applied: true; receiptId: string; orderId: string; decision: ReceiptDecision }
  | { applied: false; reason: "already-processed" };

/**
 * Admin decision on a comprobante (tasks.md PR7.4, spec.md §5 "Carga y
 * verificación"). Reuses the exact same `assignNumbers` wrapper the
 * Mercado Pago webhook uses (`lib/raffle/assign.ts`) instead of duplicating
 * the RPC call — one place decides how numbers get assigned, regardless of
 * payment method (design.md ADR-1).
 *
 * Idempotency (same pattern as `lib/mercadopago/webhook.ts`): the `receipt`
 * update is guarded with `.eq("status", "pending")`. A receipt that's
 * already been decided matches zero rows on the guarded update, so a
 * duplicate/double-click review request is a pure no-op — `assignNumbers`
 * is only ever called after the guarded update actually flips a row.
 *
 * Rejection notification (spec.md §5 "notificar al comprador en cada
 * transición"): this batch persists `reject_reason` on both `receipt` and
 * `order` (visible to the buyer via RLS on their own rows) but does NOT
 * send an email — no email provider is configured in this project yet.
 * Documented as a known gap, not simulated.
 */
export async function reviewReceipt(
  receiptId: string,
  decision: ReceiptDecision,
  options: ReviewReceiptOptions,
  overrides: ReviewReceiptOverrides = {},
): Promise<ReviewReceiptResult> {
  const supabase = overrides.supabase ?? createAdminClient();
  const assign = overrides.assign ?? assignNumbers;

  const { data: updatedReceipt, error: receiptError } = await supabase
    .from("receipt")
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: options.reviewedBy,
      reject_reason: decision === "rejected" ? (options.reason ?? null) : null,
    })
    .eq("id", receiptId)
    .eq("status", "pending")
    .select("id, order_id")
    .maybeSingle();

  if (receiptError) {
    throw new ReceiptReviewError(
      `No pudimos actualizar el comprobante ${receiptId}.`,
      receiptError,
    );
  }

  if (!updatedReceipt) {
    // Guarded update matched zero rows: already verified/rejected earlier,
    // or a concurrent request beat this one — pure no-op either way.
    return { applied: false, reason: "already-processed" };
  }

  const orderId = updatedReceipt.order_id as string;
  const orderStatus = decision === "verified" ? "approved" : "rejected";

  const { data: updatedOrder, error: orderError } = await supabase
    .from("order")
    .update({
      status: orderStatus,
      decided_at: new Date().toISOString(),
      decided_by: options.reviewedBy,
      reject_reason: decision === "rejected" ? (options.reason ?? "comprobante_rechazado") : null,
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id, tier_id")
    .maybeSingle();

  if (orderError) {
    throw new ReceiptReviewError(`No pudimos actualizar la orden ${orderId}.`, orderError);
  }

  if (decision === "verified" && updatedOrder) {
    const { data: tier, error: tierError } = await supabase
      .from("tier")
      .select("numbers_granted")
      .eq("id", updatedOrder.tier_id)
      .single();

    if (tierError || !tier) {
      throw new ReceiptReviewError(
        `No pudimos leer el tier de la orden ${orderId} para asignar números.`,
        tierError,
      );
    }

    await assign(orderId, tier.numbers_granted, supabase);
  }

  return { applied: true, receiptId, orderId, decision };
}
