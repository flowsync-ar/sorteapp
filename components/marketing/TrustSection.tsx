import type { Transparency } from "@/lib/marketing/content";

interface TrustSectionProps {
  transparency: Transparency;
}

/**
 * Legal credibility section (spec.md §1 "Transparencia"): lottery
 * authorization number + escribano data, with a link to the latest sorteo
 * acta. This is the section that makes the promise ("premio con respaldo")
 * verifiable, not just marketing copy — see design.md §6.
 */
export function TrustSection({ transparency }: TrustSectionProps) {
  return (
    <section
      id="transparencia"
      role="region"
      aria-labelledby="transparencia-eyebrow transparencia-heading"
      className="border-y border-surface bg-surface/40 px-6 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-3xl">
        <p
          id="transparencia-eyebrow"
          className="font-sans text-sm tracking-widest text-champagne uppercase"
        >
          Transparencia
        </p>
        <h2
          id="transparencia-heading"
          className="mt-2 font-display text-3xl text-foreground sm:text-4xl"
        >
          Un sorteo con respaldo legal verificable
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Cada edición cuenta con autorización oficial y es certificada por
          escribano público. Nada de esto depende de nuestra palabra: podés
          verificarlo vos mismo.
        </p>

        <dl className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald/30 bg-ink/60 p-6">
            <dt className="text-sm font-semibold text-emerald">
              Autorización de lotería
            </dt>
            <dd className="mt-2 text-foreground">
              {transparency.lotteryAuthority}
              <br />
              N° de autorización:{" "}
              <span className="font-semibold">
                {transparency.authorizationNumber}
              </span>
              <br />
              Jurisdicción: {transparency.jurisdiction}
            </dd>
          </div>

          <div className="rounded-xl border border-emerald/30 bg-ink/60 p-6">
            <dt className="text-sm font-semibold text-emerald">
              Escribanía interviniente
            </dt>
            <dd className="mt-2 text-foreground">
              {transparency.notary.name}
              <br />
              Matrícula N°{" "}
              <span className="font-semibold">
                {transparency.notary.registrationNumber}
              </span>
            </dd>
          </div>
        </dl>

        <a
          href={transparency.lastActaUrl}
          className="mt-8 inline-flex items-center gap-2 font-sans text-sm font-semibold text-champagne underline decoration-champagne/50 underline-offset-4 hover:decoration-champagne"
        >
          Ver acta del último sorteo →
        </a>
      </div>
    </section>
  );
}
