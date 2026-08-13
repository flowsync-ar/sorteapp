"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateBuyerInfo } from "@/lib/checkout/validation";
import { computeAmountArs, type PaymentMethod } from "@/lib/checkout/pricing";
import type { CheckoutFormState } from "@/lib/checkout/types";

const PAYMENT_METHODS: PaymentMethod[] = ["mp", "transfer"];

/**
 * Minimal shape of the Supabase client this action depends on — matches the
 * `RpcCapableClient` pattern in `lib/raffle/assign.ts`: keep the dependency
 * injectable (`overrides.getClient`) so business logic is unit-testable
 * without a live Supabase instance or Next.js request context.
 */
type RedirectFn = (path: string) => never;

interface CreateOrderOverrides {
  getClient?: () => ReturnType<typeof createClient>;
  doRedirect?: RedirectFn;
}

/**
 * Server action bound to a tier id from `app/(shop)/checkout/[tier]/page.tsx`
 * (`createOrder.bind(null, tierId)`), per design.md
 * `(shop)/checkout/[tier]/ # tier detail + start checkout (server action)`.
 * Tiers are per-edition now (change: edition-tiers) — `tierId` is
 * `tier.id` (uuid), not the old global `key` string.
 *
 * PR5 scope only: creates the order in `pending` status and redirects to a
 * placeholder page per payment method. Real Mercado Pago preference
 * creation (PR6) and real comprobante upload (PR7) are NOT wired here.
 */
export async function createOrder(
  tierId: string,
  _prevState: CheckoutFormState,
  formData: FormData,
  overrides: CreateOrderOverrides = {},
): Promise<CheckoutFormState> {
  const getClient = overrides.getClient ?? createClient;
  const doRedirect: RedirectFn = overrides.doRedirect ?? redirect;

  const buyerResult = validateBuyerInfo({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    dni: String(formData.get("dni") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!buyerResult.success) {
    return { status: "error", fieldErrors: buyerResult.errors };
  }

  const methodRaw = String(formData.get("method") ?? "");
  if (!PAYMENT_METHODS.includes(methodRaw as PaymentMethod)) {
    return { status: "error", formError: "Elegí un método de pago." };
  }
  const method = methodRaw as PaymentMethod;

  // NOTE: no generated Database types yet (project convention, see
  // lib/raffle/assign.ts) — every Supabase table access here is untyped.
  const supabase = await getClient();

  const { data: tier, error: tierError } = await supabase
    .from("tier")
    .select("id, price_ars")
    .eq("id", tierId)
    .single();

  if (tierError || !tier) {
    return {
      status: "error",
      formError: "El tier seleccionado ya no está disponible.",
    };
  }

  const { data: edition, error: editionError } = await supabase
    .from("raffle_edition")
    .select("id")
    .eq("status", "open")
    .maybeSingle();

  if (editionError || !edition) {
    return {
      status: "error",
      formError:
        "No hay una edición activa en este momento. Volvé a intentar más tarde.",
    };
  }

  const { data: userData } = await supabase.auth.getUser();
  let userId: string | undefined = userData?.user?.id;

  if (!userId) {
    // Guest checkout: spec.md §3 has no login step. The order row still
    // requires a non-null user_id FK to auth.users (design.md §3), so we
    // create a real (anonymous) Supabase Auth session here instead of
    // requiring a signup form — see supabase/config.toml for the rationale.
    const { data: anonData, error: anonError } =
      await supabase.auth.signInAnonymously();

    if (anonError || !anonData.user) {
      return {
        status: "error",
        formError:
          "No pudimos iniciar tu compra. Probá de nuevo en unos segundos.",
      };
    }

    userId = anonData.user.id;
  }

  const amountArs = computeAmountArs(Number(tier.price_ars), method);

  const { data: order, error: orderError } = await supabase
    .from("order")
    .insert({
      user_id: userId,
      edition_id: edition.id,
      tier_id: tier.id,
      method,
      status: "pending",
      amount_ars: amountArs,
      buyer_name: buyerResult.data.name,
      buyer_email: buyerResult.data.email,
      buyer_dni: buyerResult.data.dni,
      buyer_phone: buyerResult.data.phone,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return {
      status: "error",
      formError: "No pudimos crear tu orden. Probá de nuevo en unos segundos.",
    };
  }

  // PR6/PR7 land the real integrations; for now both destinations are
  // "in construction" placeholders (see the PR5 batch scope note in
  // apply-progress).
  doRedirect(
    method === "mp"
      ? `/checkout/orden/${order.id}/mercadopago`
      : `/checkout/orden/${order.id}/comprobante`,
  );
}
