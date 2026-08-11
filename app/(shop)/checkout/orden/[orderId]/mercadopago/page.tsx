import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderPlaceholder } from "@/components/checkout/OrderPlaceholder";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

/**
 * Placeholder destination for `method=mp` orders (tasks.md PR5 batch scope).
 * Real Mercado Pago Checkout Pro redirect + preference creation land in PR6
 * (design.md §4). RLS scopes the SELECT to the order's owner, so a stray
 * orderId or a different session's cookie yields `notFound()`, not a leak.
 */
export default async function MercadoPagoPlaceholderPage({ params }: PageProps) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("order")
    .select("id, tier_key, amount_ars, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  return (
    <OrderPlaceholder
      order={{ ...order, amount_ars: Number(order.amount_ars) }}
      title="Pago con Mercado Pago"
      noticeText="Tu orden quedó registrada como pendiente. Muy pronto vas a poder completar el pago con Mercado Pago desde acá."
    />
  );
}
