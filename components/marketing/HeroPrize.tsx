import Image from "next/image";
import type { CurrentPrize } from "@/lib/marketing/content";

interface HeroPrizeProps {
  prize: CurrentPrize;
}

function formatDrawDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Landing hero (design.md §7 `HeroPrize`): value proposition + the current
 * month's prize + primary CTA to the tier catalog. Kept a Server Component —
 * no client JS needed for the MVP hero; a live countdown can be layered on
 * as a small client island later without touching this shell.
 */
export function HeroPrize({ prize }: HeroPrizeProps) {
  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-champagne)_0%,_transparent_60%)] opacity-10"
      />
      <div className="relative mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 sm:items-center">
        <div>
          <p className="font-sans text-sm tracking-widest text-champagne uppercase">
            Sorteapp
          </p>
          <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">
            Premio con respaldo
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Comprá un curso digital y sumá automáticamente un número de 6
            cifras para el sorteo mensual, certificado por escribano público.
            Ganes o no, el curso ya es tuyo.
          </p>

          <div className="mt-8 rounded-xl border border-champagne/30 bg-surface/60 p-5">
            <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
              {prize.editionLabel}
            </p>
            <p className="mt-1 font-display text-2xl text-foreground">
              {prize.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sorteo el {formatDrawDate(prize.drawDateIso)}
            </p>
          </div>

          <a
            href="#tiers"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-champagne px-6 py-3 font-sans text-sm font-semibold text-ink transition hover:opacity-90"
          >
            Comprar mi número
          </a>
        </div>

        {/* Real photo when the open edition has one (lib/marketing/prize.ts);
            falls back to the static placeholder otherwise. */}
        <figure className="relative aspect-square overflow-hidden rounded-2xl border border-dashed border-champagne/30 bg-surface/40">
          <Image
            src={prize.imageUrl || "/prize-placeholder.svg"}
            alt={prize.imageAlt}
            fill
            sizes="(min-width: 640px) 40vw, 90vw"
            className="object-cover"
            priority
          />
        </figure>
      </div>
    </section>
  );
}
