interface OrderPlaceholderProps {
  order: {
    id: string;
    tier_key: string;
    amount_ars: number;
    status: string;
  };
  title: string;
  noticeText: string;
  /** Extra content below the order summary — e.g. the member-area CTA
   * `mercadopago/page.tsx`/`comprobante/page.tsx` render once approved
   * (tasks.md PR8). */
  children?: React.ReactNode;
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Shared shell for the two "in construction" post-checkout destinations
 * (`/checkout/orden/[orderId]/mercadopago` and `.../comprobante`, PR5 batch
 * scope). Real Mercado Pago (PR6) and comprobante upload (PR7) replace the
 * notice card's content, not this summary layout.
 */
export function OrderPlaceholder({
  order,
  title,
  noticeText,
  children,
}: OrderPlaceholderProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <p className="font-sans text-sm tracking-widest text-champagne uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
        {title}
      </h1>

      <div
        role="status"
        className="mt-6 rounded-xl border border-champagne/30 bg-surface/60 p-5"
      >
        <p className="font-semibold text-foreground">
          Integración en construcción
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{noticeText}</p>
      </div>

      <dl className="mt-6 space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <dt>Orden</dt>
          <dd className="text-foreground">#{order.id.slice(0, 8)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Tier</dt>
          <dd className="text-foreground">{order.tier_key}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Monto</dt>
          <dd className="text-foreground">{formatArs(order.amount_ars)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Estado</dt>
          <dd className="text-foreground">{order.status}</dd>
        </div>
      </dl>

      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
