import Image from "next/image";
import Link from "next/link";
import type { CurrentPrize } from "@/lib/marketing/content";

interface PrizeOfMonthProps {
  prize: CurrentPrize;
}

/**
 * "Premio del mes" (spec.md §1): detailed section for the current prize,
 * distinct from the compact summary shown in `HeroPrize`.
 */
export function PrizeOfMonth({ prize }: PrizeOfMonthProps) {
  return (
    <section aria-labelledby="premio-heading" className="px-6 py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 sm:items-center">
        {/* Real photo when the open edition has one (lib/marketing/prize.ts);
            falls back to the static placeholder otherwise. */}
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-dashed border-champagne/30 sm:aspect-square">
          <Image
            src={prize.imageUrl || "/prize-placeholder.svg"}
            alt={prize.imageAlt}
            fill
            sizes="(min-width: 640px) 40vw, 90vw"
            className="object-cover"
          />
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
            {prize.editionLabel}
          </p>
          <h2
            id="premio-heading"
            className="mt-2 font-display text-3xl text-foreground sm:text-4xl"
          >
            {prize.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{prize.description}</p>
          <Link
            href="/terminos"
            className="mt-4 inline-block font-sans text-sm font-semibold text-champagne underline underline-offset-4"
          >
            Ver detalles completos del premio →
          </Link>
        </div>
      </div>
    </section>
  );
}
