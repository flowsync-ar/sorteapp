import "server-only";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getRequiredEnv } from "@/lib/env";

/**
 * Thin, server-only wrapper over the official `mercadopago` SDK
 * (design.md `lib/mercadopago/ # SDK wrapper, preference builder, webhook
 * verify`). Mirrors `lib/supabase/admin.ts`'s pattern: a plain factory
 * function (not a module-level singleton) so the access token is only read
 * when a client is actually needed, and so tests can inject their own
 * fake `Preference`/`Payment` clients instead of exercising this factory.
 */
export function createMercadoPagoConfig(): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken: getRequiredEnv("MERCADOPAGO_ACCESS_TOKEN", process.env),
  });
}

export function createPreferenceClient(
  config: MercadoPagoConfig = createMercadoPagoConfig(),
): Preference {
  return new Preference(config);
}

export function createPaymentClient(
  config: MercadoPagoConfig = createMercadoPagoConfig(),
): Payment {
  return new Payment(config);
}
