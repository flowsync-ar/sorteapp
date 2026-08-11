import type { Tier } from "@/lib/marketing/content";

interface TierCatalogProps {
  tiers: Tier[];
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Read-only catalog preview for the landing (spec.md §2). The interactive
 * `TierCards` + `CheckoutButton` island (design.md §7) is PR5 scope, on
 * `/checkout/[tier]` — this component just links there; it doesn't start a
 * checkout flow itself.
 */
export function TierCatalog({ tiers }: TierCatalogProps) {
  return (
    <section id="tiers" aria-labelledby="tiers-heading" className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <h2
          id="tiers-heading"
          className="text-center font-display text-3xl text-foreground sm:text-4xl"
        >
          Elegí tu curso
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Cada tier incluye tu número de participación para el sorteo del mes.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.key}
              className="flex flex-col rounded-2xl border border-surface bg-surface/40 p-6"
            >
              <h3 className="font-display text-xl text-foreground">
                {tier.name}
              </h3>
              <p className="mt-2 font-display text-3xl text-champagne">
                {formatArs(tier.priceArs)}
              </p>
              <p className="text-xs text-muted-foreground">
                {tier.transferDiscountPercent}% off pagando por transferencia
              </p>
              <p className="mt-3 text-sm font-semibold text-emerald">
                {tier.numbersGranted}{" "}
                {tier.numbersGranted === 1
                  ? "número de 6 cifras"
                  : "números de 6 cifras"}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {tier.includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-emerald">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href={`/checkout/${tier.key}`}
                className="mt-6 inline-flex items-center justify-center rounded-lg border border-champagne/50 px-4 py-2 font-sans text-sm font-semibold text-champagne transition hover:bg-champagne/10"
              >
                Elegir {tier.name}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
