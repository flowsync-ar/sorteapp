import { NextRequest, NextResponse } from "next/server";
import { getRequiredEnv } from "@/lib/env";
import {
  MercadoPagoWebhookProcessingError,
  MercadoPagoWebhookSignatureError,
  processMercadoPagoWebhookNotification,
  verifyMercadoPagoSignature,
} from "@/lib/mercadopago/webhook";

/**
 * Mercado Pago webhook route handler (design.md §4
 * `api/webhooks/mercadopago/route.ts # POST, signature verify, idempotent`).
 * Thin HTTP adapter: extracts headers/query params, delegates signature
 * verification and processing to `lib/mercadopago/webhook.ts`, and maps the
 * result to the right HTTP status so Mercado Pago knows whether to retry.
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  try {
    verifyMercadoPagoSignature(
      {
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId,
      },
      getRequiredEnv("MERCADOPAGO_WEBHOOK_SECRET", process.env),
    );
  } catch (error) {
    if (error instanceof MercadoPagoWebhookSignatureError) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    throw error;
  }

  if (!dataId) {
    return NextResponse.json({ error: "missing data.id" }, { status: 400 });
  }

  try {
    const outcome = await processMercadoPagoWebhookNotification(dataId);
    return NextResponse.json(outcome, { status: 200 });
  } catch (error) {
    if (error instanceof MercadoPagoWebhookProcessingError) {
      // Non-2xx so Mercado Pago retries the delivery on its own schedule.
      // design.md's suggested `after()` + reconciliation-polling-job
      // pattern is NOT implemented in this batch (see apply-progress PR6
      // notes) -- MP's built-in retry-on-non-2xx substitutes for it at MVP
      // scope.
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }
    throw error;
  }
}
