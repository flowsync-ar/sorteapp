import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderPlaceholder } from "@/components/checkout/OrderPlaceholder";
import { ComprobanteUploader } from "@/components/checkout/ComprobanteUploader";
import { bankTransferInstructions } from "@/lib/marketing/content";
import { uploadReceiptAction } from "./actions";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

const DECIDED_ORDER_COPY: Record<string, { title: string; notice: string }> = {
  approved: {
    title: "¡Comprobante verificado!",
    notice:
      "Verificamos tu transferencia y tu número ya fue asignado. Revisá tu email para más detalles.",
  },
  expired: {
    title: "Orden expirada",
    notice: "Esta orden ya no está disponible. Iniciá una compra nueva desde el catálogo.",
  },
};

/**
 * Real comprobante upload + status page (tasks.md PR7, design.md §5).
 * Replaces PR5's "en construcción" placeholder. RLS scopes the SELECT to
 * the order's owner, so a stray orderId or a different session's cookie
 * yields `notFound()`, not a leak — same guard `mercadopago/page.tsx` uses.
 *
 * Branches on the order + receipt state (spec.md §5 "pending -> verified |
 * rejected"):
 * - order not `transfer` or not found -> notFound()
 * - order `approved` -> success card (numbers already assigned)
 * - order `rejected` with no re-uploadable receipt -> rejection card
 * - order `pending`, no receipt (or previous one `rejected`) -> upload form
 * - order `pending`, receipt `pending` -> "en revisión" status card (buyer
 *   status page, tasks.md PR7 item 5)
 */
export default async function ComprobantePage({ params }: PageProps) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("order")
    .select("id, amount_ars, status, method, reject_reason, tier:tier_id(numbers_granted)")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.method !== "transfer") {
    notFound();
  }

  const { data: receipt } = await supabase
    .from("receipt")
    .select("id, status, reject_reason, uploaded_at")
    .eq("order_id", orderId)
    .maybeSingle();

  // Untyped Supabase client (no generated Database types, project
  // convention) infers a to-one nested select as an array — same
  // `as unknown as X` escape hatch `lib/admin/buyer-profile.ts` uses.
  const tier = order.tier as unknown as { numbers_granted: number } | null;
  const orderView = {
    id: order.id,
    chances: tier?.numbers_granted ?? 0,
    amount_ars: Number(order.amount_ars),
    status: order.status,
  };

  if (order.status === "approved" || order.status === "expired") {
    const copy = DECIDED_ORDER_COPY[order.status];
    return (
      <OrderPlaceholder order={orderView} title={copy.title} noticeText={copy.notice}>
        {order.status === "approved" ? (
          // tasks.md PR8.1: the "reclamar cuenta" flow lives on /mi-cuenta
          // (single hub, see its deviation note), not duplicated here.
          <Link href="/mi-cuenta" className="text-champagne underline">
            Ver mi curso / reclamar mi cuenta
          </Link>
        ) : null}
      </OrderPlaceholder>
    );
  }

  if (order.status === "rejected" && receipt?.status !== "rejected") {
    return (
      <OrderPlaceholder
        order={orderView}
        title="Orden rechazada"
        noticeText={
          order.reject_reason
            ? `Tu orden fue rechazada: ${order.reject_reason}. Iniciá una compra nueva desde el catálogo.`
            : "Tu orden fue rechazada. Iniciá una compra nueva desde el catálogo."
        }
      />
    );
  }

  if (receipt?.status === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <p className="font-sans text-sm tracking-widest text-champagne uppercase">
          Checkout
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
          Comprobante en revisión
        </h1>
        <div
          role="status"
          className="mt-6 rounded-xl border border-champagne/30 bg-surface/60 p-5"
        >
          <p className="font-semibold text-foreground">
            Tu comprobante está pendiente de revisión
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Lo verificamos en menos de 48hs hábiles. Te avisamos por email
            apenas confirmemos tu pago y asignemos tu número.
          </p>
        </div>
      </div>
    );
  }

  const action = uploadReceiptAction.bind(null, orderId);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <p className="font-sans text-sm tracking-widest text-champagne uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
        Transferencia bancaria
      </h1>

      {receipt?.status === "rejected" ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 p-5"
        >
          <p className="font-semibold text-foreground">Comprobante rechazado</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {receipt.reject_reason
              ? `Motivo: ${receipt.reject_reason}. Podés subir un comprobante nuevo.`
              : "Podés subir un comprobante nuevo."}
          </p>
        </div>
      ) : null}

      <dl className="mt-6 space-y-2 rounded-xl border border-surface bg-surface/40 p-5 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <dt>Banco</dt>
          <dd className="text-foreground">{bankTransferInstructions.bankName}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Titular</dt>
          <dd className="text-foreground">{bankTransferInstructions.accountHolder}</dd>
        </div>
        <div className="flex justify-between">
          <dt>CBU</dt>
          <dd className="text-foreground">{bankTransferInstructions.cbu}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Alias</dt>
          <dd className="text-foreground">{bankTransferInstructions.alias}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Monto a transferir</dt>
          <dd className="text-foreground">
            {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              maximumFractionDigits: 0,
            }).format(orderView.amount_ars)}
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-sm text-muted-foreground">
        Una vez hecha la transferencia, subí el comprobante acá. Lo
        verificamos en menos de 48hs hábiles.
      </p>

      <div className="mt-4">
        <ComprobanteUploader action={action} />
      </div>
    </div>
  );
}
