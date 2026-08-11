import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentClient } from "@/lib/mercadopago/client";
import { assignNumbers } from "@/lib/raffle/assign";
import { mapMercadoPagoStatusToOrderStatus } from "@/lib/mercadopago/mapPaymentStatus";

/** Thrown when the `x-signature` header cannot be verified against the
 * configured `MERCADOPAGO_WEBHOOK_SECRET`. Callers MUST respond 401 and
 * MUST NOT process the notification (spec.md §4, ADR-2 open risk). */
export class MercadoPagoWebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MercadoPagoWebhookSignatureError";
  }
}

/** Thrown for a signature-VALID notification that still failed to process
 * (payment lookup failed, missing `external_reference`, DB error). Callers
 * SHOULD respond non-2xx so Mercado Pago retries the delivery later. */
export class MercadoPagoWebhookProcessingError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MercadoPagoWebhookProcessingError";
  }
}

export interface MercadoPagoWebhookHeaders {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}

/**
 * Verifies the `x-signature` header of an incoming Mercado Pago webhook
 * notification (Checkout Pro / webhooks v2 format: `ts=<timestamp>,v1=<hmac>`,
 * manifest `id:{data.id};request-id:{x-request-id};ts:{ts};`, HMAC-SHA256
 * against `MERCADOPAGO_WEBHOOK_SECRET`, constant-time compare). Delegates to
 * the official `mercadopago` SDK's `WebhookSignatureValidator`, which
 * implements exactly this format — see
 * `node_modules/mercadopago/dist/utils/webhook/index.js`.
 *
 * TODO: verificar contra la doc oficial de Mercado Pago antes de producción,
 * la API puede haber cambiado.
 *
 * @throws {MercadoPagoWebhookSignatureError} when the signature is missing,
 *   malformed, or does not match — the route handler MUST respond 401 and
 *   MUST NOT process the notification.
 */
export function verifyMercadoPagoSignature(
  headers: MercadoPagoWebhookHeaders,
  secret: string,
): void {
  try {
    WebhookSignatureValidator.validate({
      xSignature: headers.xSignature,
      xRequestId: headers.xRequestId,
      dataId: headers.dataId,
      secret,
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      throw new MercadoPagoWebhookSignatureError(error.message);
    }
    throw error;
  }
}

type PaymentGetCapableClient = {
  get(args: { id: string }): Promise<{
    id?: number | string;
    status?: string;
    status_detail?: string;
    external_reference?: string;
  }>;
};

export interface ProcessWebhookOverrides {
  supabase?: SupabaseClient;
  paymentClient?: PaymentGetCapableClient;
  assign?: typeof assignNumbers;
}

export type WebhookOutcome =
  | {
      applied: true;
      orderId: string;
      status: Exclude<
        ReturnType<typeof mapMercadoPagoStatusToOrderStatus>,
        "pending"
      >;
    }
  | { applied: false; reason: "already-processed" | "unmapped-status" };

/**
 * Processes an already-signature-verified Mercado Pago webhook notification
 * (design.md §4): fetches the payment by `data.id`, maps its status to this
 * project's order state machine, and — IDEMPOTENTLY — applies the
 * transition.
 *
 * Idempotency (spec.md §4 "Webhook duplicado"): the order update is guarded
 * with `.eq("status", "pending")`. `assign_numbers` itself is NOT
 * idempotent (calling it twice inserts two sets of numbers for the same
 * order — see `supabase/migrations/*_assign_numbers.sql`), so it is only
 * ever called when the guarded update actually flips a row from `pending`
 * to `approved`. A duplicate delivery for an already-decided order matches
 * zero rows on the guarded update and is a pure no-op.
 */
export async function processMercadoPagoWebhookNotification(
  dataId: string,
  overrides: ProcessWebhookOverrides = {},
): Promise<WebhookOutcome> {
  const supabase = overrides.supabase ?? createAdminClient();
  const paymentClient = overrides.paymentClient ?? createPaymentClient();
  const assign = overrides.assign ?? assignNumbers;

  let payment: Awaited<ReturnType<PaymentGetCapableClient["get"]>>;
  try {
    payment = await paymentClient.get({ id: dataId });
  } catch (cause) {
    throw new MercadoPagoWebhookProcessingError(
      `No pudimos consultar el pago ${dataId} en Mercado Pago.`,
      cause,
    );
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    throw new MercadoPagoWebhookProcessingError(
      `El pago ${dataId} no tiene external_reference — no se puede vincular a una orden.`,
    );
  }

  const orderStatus = mapMercadoPagoStatusToOrderStatus(payment.status);

  if (orderStatus === "pending") {
    // Still in-flight on MP's side (pending/in_process/authorized/etc.) —
    // nothing to transition yet, and definitely nothing to assign.
    return { applied: false, reason: "unmapped-status" };
  }

  const { data: updatedOrder, error } = await supabase
    .from("order")
    .update({
      status: orderStatus,
      mp_payment_id: String(payment.id ?? dataId),
      decided_at: new Date().toISOString(),
      reject_reason:
        orderStatus === "rejected"
          ? (payment.status_detail ?? "mercadopago_rejected")
          : null,
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id, tier_key")
    .maybeSingle();

  if (error) {
    throw new MercadoPagoWebhookProcessingError(
      `No pudimos actualizar la orden ${orderId}.`,
      error,
    );
  }

  if (!updatedOrder) {
    // The guarded update matched zero rows: this exact notification was
    // already processed, or a later one already decided the order.
    return { applied: false, reason: "already-processed" };
  }

  if (orderStatus === "approved") {
    const { data: tier, error: tierError } = await supabase
      .from("tier")
      .select("numbers_granted")
      .eq("key", updatedOrder.tier_key)
      .single();

    if (tierError || !tier) {
      throw new MercadoPagoWebhookProcessingError(
        `No pudimos leer el tier de la orden ${orderId} para asignar números.`,
        tierError,
      );
    }

    await assign(orderId, tier.numbers_granted, supabase);
  }

  return { applied: true, orderId, status: orderStatus };
}
