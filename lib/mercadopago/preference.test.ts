import { describe, expect, it, vi } from "vitest";
import { createPreferenceForOrder, MercadoPagoPreferenceError } from "./preference";

const order = {
  id: "order-1",
  tierKey: "inicial",
  amountArs: 15000,
  buyerName: "Martín García",
  buyerEmail: "martin@example.com",
};

function fakeClient(create: ReturnType<typeof vi.fn>) {
  return { create } as unknown as NonNullable<
    Parameters<typeof createPreferenceForOrder>[1]
  >["client"];
}

describe("createPreferenceForOrder", () => {
  it("creates a preference with external_reference=orderId, the tier amount, and the notification_url", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "pref-1",
      init_point: "https://mercadopago.com/checkout/pref-1",
    });

    const result = await createPreferenceForOrder(order, {
      client: fakeClient(create),
      notificationUrl: "https://sorteapp.example.com/api/webhooks/mercadopago",
    });

    expect(result).toEqual({
      initPoint: "https://mercadopago.com/checkout/pref-1",
      preferenceId: "pref-1",
    });
    expect(create).toHaveBeenCalledWith({
      body: expect.objectContaining({
        external_reference: "order-1",
        notification_url: "https://sorteapp.example.com/api/webhooks/mercadopago",
        items: [
          expect.objectContaining({
            id: "inicial",
            quantity: 1,
            unit_price: 15000,
            currency_id: "ARS",
          }),
        ],
        payer: expect.objectContaining({
          name: "Martín García",
          email: "martin@example.com",
        }),
      }),
    });
  });

  it("wraps a Mercado Pago API failure (e.g. down, invalid credentials) in MercadoPagoPreferenceError", async () => {
    const create = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      createPreferenceForOrder(order, {
        client: fakeClient(create),
        notificationUrl: "https://sorteapp.example.com/api/webhooks/mercadopago",
      }),
    ).rejects.toThrow(MercadoPagoPreferenceError);
  });

  it("preserves the original failure as `cause` for debugging/logging", async () => {
    const cause = new Error("invalid access token");
    const create = vi.fn().mockRejectedValue(cause);

    try {
      await createPreferenceForOrder(order, {
        client: fakeClient(create),
        notificationUrl: "https://sorteapp.example.com/api/webhooks/mercadopago",
      });
      expect.unreachable("createPreferenceForOrder should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MercadoPagoPreferenceError);
      expect((err as MercadoPagoPreferenceError).cause).toBe(cause);
    }
  });

  it("throws MercadoPagoPreferenceError when MP responds without an init_point", async () => {
    const create = vi.fn().mockResolvedValue({ id: "pref-1" });

    await expect(
      createPreferenceForOrder(order, {
        client: fakeClient(create),
        notificationUrl: "https://sorteapp.example.com/api/webhooks/mercadopago",
      }),
    ).rejects.toThrow(MercadoPagoPreferenceError);
  });
});
