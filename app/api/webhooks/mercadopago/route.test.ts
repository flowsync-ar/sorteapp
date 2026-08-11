import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

const SECRET = "test-webhook-secret";

// Only the DB/MP-dependent processing function is mocked -- signature
// verification runs for real against the actual crypto implementation
// (`vi.importActual`), so these tests exercise the real 401 path, not a
// simulated one.
vi.mock("@/lib/mercadopago/webhook", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/mercadopago/webhook")>();
  return {
    ...actual,
    processMercadoPagoWebhookNotification: vi.fn(),
  };
});

import { processMercadoPagoWebhookNotification } from "@/lib/mercadopago/webhook";
import { POST } from "./route";

function signedRequest(dataId: string, options: { secret?: string; ts?: string; requestId?: string } = {}) {
  const ts = options.ts ?? "1700000000";
  const requestId = options.requestId ?? "req-1";
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", options.secret ?? SECRET)
    .update(manifest)
    .digest("hex");

  return new NextRequest(
    `https://sorteapp.example.com/api/webhooks/mercadopago?data.id=${dataId}`,
    {
      method: "POST",
      headers: {
        "x-signature": `ts=${ts},v1=${v1}`,
        "x-request-id": requestId,
      },
      body: "{}",
    },
  );
}

describe("POST /api/webhooks/mercadopago", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(processMercadoPagoWebhookNotification).mockReset();
  });

  it("returns 401 and never calls processMercadoPagoWebhookNotification when the signature is invalid", async () => {
    const request = signedRequest("123456789", { secret: "wrong-secret" });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(processMercadoPagoWebhookNotification).not.toHaveBeenCalled();
  });

  it("returns 401 when the x-signature header is missing entirely", async () => {
    const request = new NextRequest(
      "https://sorteapp.example.com/api/webhooks/mercadopago?data.id=123456789",
      { method: "POST", body: "{}" },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(processMercadoPagoWebhookNotification).not.toHaveBeenCalled();
  });

  it("returns 200 and processes the notification when the signature is valid", async () => {
    vi.mocked(processMercadoPagoWebhookNotification).mockResolvedValue({
      applied: true,
      orderId: "order-1",
      status: "approved",
    });
    const request = signedRequest("123456789");

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(processMercadoPagoWebhookNotification).toHaveBeenCalledWith("123456789");
  });

  it("is idempotent end-to-end: two identical valid deliveries both return 200 and each call is independently a no-op per lib/mercadopago/webhook's own guard", async () => {
    vi.mocked(processMercadoPagoWebhookNotification)
      .mockResolvedValueOnce({ applied: true, orderId: "order-1", status: "approved" })
      .mockResolvedValueOnce({ applied: false, reason: "already-processed" });

    const first = await POST(signedRequest("123456789"));
    const second = await POST(signedRequest("123456789"));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(processMercadoPagoWebhookNotification).toHaveBeenCalledTimes(2);
  });

  it("returns 500 (so Mercado Pago retries) when processing fails after a valid signature", async () => {
    const { MercadoPagoWebhookProcessingError } = await vi.importActual<
      typeof import("@/lib/mercadopago/webhook")
    >("@/lib/mercadopago/webhook");
    vi.mocked(processMercadoPagoWebhookNotification).mockRejectedValue(
      new MercadoPagoWebhookProcessingError("boom"),
    );

    const response = await POST(signedRequest("123456789"));

    expect(response.status).toBe(500);
  });

  it("returns 400 when data.id is missing from the notification URL", async () => {
    const manifest = `request-id:req-1;ts:1700000000;`;
    const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
    const request = new NextRequest(
      "https://sorteapp.example.com/api/webhooks/mercadopago",
      {
        method: "POST",
        headers: {
          "x-signature": `ts=1700000000,v1=${v1}`,
          "x-request-id": "req-1",
        },
        body: "{}",
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(processMercadoPagoWebhookNotification).not.toHaveBeenCalled();
  });
});
