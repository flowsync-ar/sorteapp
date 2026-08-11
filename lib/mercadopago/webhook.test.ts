import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  MercadoPagoWebhookProcessingError,
  MercadoPagoWebhookSignatureError,
  processMercadoPagoWebhookNotification,
  verifyMercadoPagoSignature,
} from "./webhook";

const SECRET = "test-webhook-secret";

function signedHeaders(dataId: string, requestId = "req-1", ts = "1700000000") {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
  return {
    xSignature: `ts=${ts},v1=${v1}`,
    xRequestId: requestId,
    dataId,
  };
}

describe("verifyMercadoPagoSignature", () => {
  it("does not throw for a correctly signed notification", () => {
    const headers = signedHeaders("123456789");
    expect(() => verifyMercadoPagoSignature(headers, SECRET)).not.toThrow();
  });

  it("tolerates extra whitespace around the ts/v1 pairs (design.md open risk note)", () => {
    const headers = signedHeaders("123456789");
    // A stray space after the comma (`ts=..., v1=...`) is a real variation
    // MP notifications are documented to send; each key/value is trimmed
    // before comparison.
    const looselySpaced = { ...headers, xSignature: headers.xSignature.replace(",", ", ") };
    expect(() => verifyMercadoPagoSignature(looselySpaced, SECRET)).not.toThrow();
  });

  it("throws MercadoPagoWebhookSignatureError when v1 does not match the computed HMAC", () => {
    const headers = signedHeaders("123456789");
    const tampered = { ...headers, xSignature: "ts=1700000000,v1=deadbeef" };
    expect(() => verifyMercadoPagoSignature(tampered, SECRET)).toThrow(
      MercadoPagoWebhookSignatureError,
    );
  });

  it("throws MercadoPagoWebhookSignatureError when x-signature is missing", () => {
    expect(() =>
      verifyMercadoPagoSignature(
        { xSignature: null, xRequestId: "req-1", dataId: "123456789" },
        SECRET,
      ),
    ).toThrow(MercadoPagoWebhookSignatureError);
  });

  it("throws MercadoPagoWebhookSignatureError on a malformed x-signature (no ts=/v1=)", () => {
    expect(() =>
      verifyMercadoPagoSignature(
        { xSignature: "garbage-header", xRequestId: "req-1", dataId: "123456789" },
        SECRET,
      ),
    ).toThrow(MercadoPagoWebhookSignatureError);
  });

  it("throws when the manifest was built from a different data.id than the one being verified", () => {
    const headers = signedHeaders("123456789");
    const wrongDataId = { ...headers, dataId: "999999999" };
    expect(() => verifyMercadoPagoSignature(wrongDataId, SECRET)).toThrow(
      MercadoPagoWebhookSignatureError,
    );
  });
});

function fakeOrderBuilder(
  result: { data: unknown; error: unknown },
  captureUpdate?: (payload: unknown) => void,
) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    update: vi.fn((payload: unknown) => {
      captureUpdate?.(payload);
      return builder;
    }),
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
  };
  return builder;
}

function fakeTierBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(async () => result),
  };
  return builder;
}

describe("processMercadoPagoWebhookNotification", () => {
  it("approves the order, dedupes via WHERE status=pending, and assigns numbers on an approved payment", async () => {
    const assign = vi.fn().mockResolvedValue({ numbers: [123456], soldOut: false });
    let updatePayload: Record<string, unknown> | undefined;
    const orderBuilder = fakeOrderBuilder(
      { data: { id: "order-1", tier_key: "inicial" }, error: null },
      (p) => {
        updatePayload = p as Record<string, unknown>;
      },
    );
    const tierBuilder = fakeTierBuilder({ data: { numbers_granted: 1 }, error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "order") return orderBuilder;
        if (table === "tier") return tierBuilder;
        throw new Error(`Unexpected table ${table}`);
      }),
    };
    const paymentClient = {
      get: vi.fn().mockResolvedValue({
        id: 555,
        status: "approved",
        external_reference: "order-1",
      }),
    };

    const outcome = await processMercadoPagoWebhookNotification("555", {
      supabase: supabase as never,
      paymentClient,
      assign,
    });

    expect(outcome).toEqual({ applied: true, orderId: "order-1", status: "approved" });
    expect(updatePayload).toMatchObject({ status: "approved", mp_payment_id: "555" });
    expect(assign).toHaveBeenCalledWith("order-1", 1, supabase);
  });

  it("is idempotent: a duplicate notification for an already-processed order does not call assign again", async () => {
    const assign = vi.fn();
    // The guarded update (`.eq("status", "pending")`) matches zero rows
    // because the order is no longer pending -- Supabase's `.maybeSingle()`
    // then resolves with `data: null`.
    const orderBuilder = fakeOrderBuilder({ data: null, error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "order") return orderBuilder;
        throw new Error(`Unexpected table ${table}`);
      }),
    };
    const paymentClient = {
      get: vi.fn().mockResolvedValue({
        id: 555,
        status: "approved",
        external_reference: "order-1",
      }),
    };

    const outcome = await processMercadoPagoWebhookNotification("555", {
      supabase: supabase as never,
      paymentClient,
      assign,
    });

    expect(outcome).toEqual({ applied: false, reason: "already-processed" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("marks the order rejected on a rejected payment and never calls assign", async () => {
    const assign = vi.fn();
    let updatePayload: Record<string, unknown> | undefined;
    const orderBuilder = fakeOrderBuilder(
      { data: { id: "order-2", tier_key: "plus" }, error: null },
      (p) => {
        updatePayload = p as Record<string, unknown>;
      },
    );
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "order") return orderBuilder;
        throw new Error("tier should not be queried for a rejected payment");
      }),
    };
    const paymentClient = {
      get: vi.fn().mockResolvedValue({
        id: 777,
        status: "rejected",
        status_detail: "cc_rejected_high_risk",
        external_reference: "order-2",
      }),
    };

    const outcome = await processMercadoPagoWebhookNotification("777", {
      supabase: supabase as never,
      paymentClient,
      assign,
    });

    expect(outcome).toEqual({ applied: true, orderId: "order-2", status: "rejected" });
    expect(updatePayload).toMatchObject({
      status: "rejected",
      reject_reason: "cc_rejected_high_risk",
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it("no-ops without touching the DB when the payment is still in-flight (pending/in_process)", async () => {
    const assign = vi.fn();
    const supabase = { from: vi.fn() };
    const paymentClient = {
      get: vi.fn().mockResolvedValue({
        id: 888,
        status: "in_process",
        external_reference: "order-3",
      }),
    };

    const outcome = await processMercadoPagoWebhookNotification("888", {
      supabase: supabase as never,
      paymentClient,
      assign,
    });

    expect(outcome).toEqual({ applied: false, reason: "unmapped-status" });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("throws MercadoPagoWebhookProcessingError when the payment has no external_reference", async () => {
    const supabase = { from: vi.fn() };
    const paymentClient = {
      get: vi.fn().mockResolvedValue({ id: 999, status: "approved" }),
    };

    await expect(
      processMercadoPagoWebhookNotification("999", {
        supabase: supabase as never,
        paymentClient,
        assign: vi.fn(),
      }),
    ).rejects.toThrow(MercadoPagoWebhookProcessingError);
  });

  it("throws MercadoPagoWebhookProcessingError when fetching the payment from MP fails", async () => {
    const supabase = { from: vi.fn() };
    const paymentClient = { get: vi.fn().mockRejectedValue(new Error("network down")) };

    await expect(
      processMercadoPagoWebhookNotification("1", {
        supabase: supabase as never,
        paymentClient,
        assign: vi.fn(),
      }),
    ).rejects.toThrow(MercadoPagoWebhookProcessingError);
  });
});
