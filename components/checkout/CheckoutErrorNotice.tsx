interface CheckoutErrorNoticeProps {
  title: string;
  message: string;
  retryHref: string;
}

/**
 * User-visible failure state for checkout steps that depend on an external
 * provider (Mercado Pago preference creation) — tasks.md PR6.5 "no dejar la
 * UI colgada": every failure mode (provider down, invalid credentials,
 * unexpected response) surfaces here instead of an unhandled RSC error or a
 * silently stuck page.
 */
export function CheckoutErrorNotice({
  title,
  message,
  retryHref,
}: CheckoutErrorNoticeProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <p className="font-sans text-sm tracking-widest text-champagne uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
        {title}
      </h1>

      <div
        role="alert"
        className="mt-6 rounded-xl border border-champagne/30 bg-surface/60 p-5"
      >
        <p className="font-semibold text-foreground">No pudimos continuar</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>

      <a
        href={retryHref}
        className="mt-6 inline-block font-sans text-sm text-champagne underline"
      >
        Volver a intentar
      </a>
    </div>
  );
}
