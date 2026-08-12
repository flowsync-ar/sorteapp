import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPreferenceForOrder,
  MercadoPagoPreferenceError,
} from "@/lib/mercadopago/preference";
import { OrderPlaceholder } from "@/components/checkout/OrderPlaceholder";
import { CheckoutErrorNotice } from "@/components/checkout/CheckoutErrorNotice";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

const DECIDED_STATUS_COPY: Record<string, { title: string; notice: string }> = {
  approved: {
    title: "¡Pago aprobado!",
    notice:
      "Tu pago fue aprobado y tu número ya fue asignado. Revisá tu email para más detalles.",
  },
  rejected: {
    title: "Pago rechazado",
    notice:
      "Mercado Pago rechazó este pago. Podés intentar de nuevo eligiendo tu tier otra vez.",
  },
  expired: {
    title: "Orden expirada",
    notice: "Esta orden ya no está disponible. Iniciá una compra nueva desde el catálogo.",
  },
};

/**
 * Real Mercado Pago Checkout Pro redirect (tasks.md PR6.2, design.md §4).
 * Replaces PR5's "in construction" placeholder. RLS scopes the SELECT to
 * the order's owner, so a stray orderId or a different session's cookie
 * yields `notFound()`, not a leak.
 *
 * - `pending` order: creates a fresh preference and redirects the buyer to
 *   `init_point`. Preference creation failures render a graceful error
 *   instead of hanging or crashing (tasks.md PR6.5).
 * - already-decided order (buyer navigated back/refreshed after the
 *   webhook already ran): shows the current status instead of creating yet
 *   another preference.
 */
export default async function MercadoPagoRedirectPage({ params }: PageProps) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("order")
    .select("id, tier_key, amount_ars, status, buyer_name, buyer_email")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  if (order.status !== "pending") {
    const copy = DECIDED_STATUS_COPY[order.status] ?? {
      title: "Estado de tu orden",
      notice: "Consultá el estado de tu orden.",
    };
    return (
      <OrderPlaceholder
        order={{ ...order, amount_ars: Number(order.amount_ars) }}
        title={copy.title}
        noticeText={copy.notice}
      >
        {order.status === "approved" ? (
          <Link href="/mi-cuenta" className="text-champagne underline">
            Ver mi curso / reclamar mi cuenta
          </Link>
        ) : null}
      </OrderPlaceholder>
    );
  }

  let initPoint: string;
  let preferenceId: string | undefined;
  try {
    const result = await createPreferenceForOrder({
      id: order.id,
      tierKey: order.tier_key,
      amountArs: Number(order.amount_ars),
      buyerName: order.buyer_name,
      buyerEmail: order.buyer_email,
    });
    initPoint = result.initPoint;
    preferenceId = result.preferenceId;
  } catch (error) {
    if (error instanceof MercadoPagoPreferenceError) {
      return (
        <CheckoutErrorNotice
          title="Pago con Mercado Pago"
          message="No pudimos iniciar el pago con Mercado Pago en este momento. Tu orden sigue pendiente — probá de nuevo en unos minutos."
          retryHref={`/checkout/${order.tier_key}`}
        />
      );
    }
    throw error;
  }

  // `order` UPDATE has no client-facing RLS policy (design.md §3: "NO
  // client UPDATE (status changes only via RPC/admin)") -- persisting the
  // preference id for admin/audit traceability is a privileged, system-
  // initiated write, so it uses the service_role client, same as the
  // webhook. Best-effort: never block the redirect on this.
  if (preferenceId) {
    await createAdminClient()
      .from("order")
      .update({ mp_preference_id: preferenceId })
      .eq("id", order.id);
  }

  // Deliberately OUTSIDE the try/catch above: `redirect()` works by
  // throwing a special Next.js error that must propagate up uncaught — a
  // generic catch around it would swallow the redirect instead of
  // navigating.
  redirect(initPoint);
}
