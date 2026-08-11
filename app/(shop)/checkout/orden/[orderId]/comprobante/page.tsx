import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderPlaceholder } from "@/components/checkout/OrderPlaceholder";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

/**
 * Placeholder destination for `method=transfer` orders (tasks.md PR5 batch
 * scope). Real comprobante upload + admin verification land in PR7
 * (design.md §5). RLS scopes the SELECT to the order's owner.
 */
export default async function ComprobantePlaceholderPage({ params }: PageProps) {
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
      title="Transferencia bancaria"
      noticeText="Tu orden quedó registrada como pendiente. Muy pronto vas a poder subir tu comprobante de transferencia desde acá para que lo verifiquemos."
    />
  );
}
