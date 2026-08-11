import "server-only";
import type { Preference } from "mercadopago";
import { createPreferenceClient } from "@/lib/mercadopago/client";
import { getRequiredEnv } from "@/lib/env";

/**
 * Thrown for ANY failure creating a Checkout Pro preference — missing/
 * invalid `MERCADOPAGO_ACCESS_TOKEN`, Mercado Pago being unreachable, or an
 * API-level rejection. Callers (the `mercadopago` checkout page) catch this
 * one type and render a graceful, user-visible error instead of leaving the
 * page hanging or crashing with an unhandled RSC error (tasks.md PR6.5).
 */
export class MercadoPagoPreferenceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MercadoPagoPreferenceError";
  }
}

export interface OrderForPreference {
  id: string;
  tierKey: string;
  amountArs: number;
  buyerName: string;
  buyerEmail: string;
}

type PreferenceCreateCapableClient = Pick<Preference, "create">;

interface CreatePreferenceOverrides {
  client?: PreferenceCreateCapableClient;
  notificationUrl?: string;
}

function defaultNotificationUrl(): string {
  const siteUrl = getRequiredEnv("NEXT_PUBLIC_SITE_URL", process.env);
  return new URL("/api/webhooks/mercadopago", siteUrl).toString();
}

/**
 * Creates a Checkout Pro preference for a `pending` order (design.md §4):
 * `external_reference=order.id`, `notification_url` pointing at our webhook,
 * a single line item for the tier's amount, and the buyer's name/email
 * pre-filled from the checkout form. Returns the `init_point` the buyer must
 * be redirected to.
 *
 * Every failure mode (missing/invalid access token, MP down, MP rejecting
 * the request, a malformed response with no `init_point`) is normalized
 * into a single `MercadoPagoPreferenceError` so callers only need one catch
 * clause.
 */
export async function createPreferenceForOrder(
  order: OrderForPreference,
  overrides: CreatePreferenceOverrides = {},
): Promise<{ initPoint: string; preferenceId: string | undefined }> {
  try {
    const client = overrides.client ?? createPreferenceClient();
    const notificationUrl =
      overrides.notificationUrl ?? defaultNotificationUrl();

    const response = await client.create({
      body: {
        external_reference: order.id,
        notification_url: notificationUrl,
        items: [
          {
            id: order.tierKey,
            title: `Sorteo — tier ${order.tierKey}`,
            quantity: 1,
            unit_price: order.amountArs,
            currency_id: "ARS",
          },
        ],
        payer: {
          name: order.buyerName,
          email: order.buyerEmail,
        },
      },
    });

    if (!response.init_point) {
      throw new Error(
        "Mercado Pago respondió sin init_point (respuesta inesperada de la API)",
      );
    }

    return { initPoint: response.init_point, preferenceId: response.id };
  } catch (cause) {
    throw new MercadoPagoPreferenceError(
      "No pudimos iniciar el pago con Mercado Pago. Probá de nuevo en unos minutos.",
      cause,
    );
  }
}
