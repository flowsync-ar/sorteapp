import type { Winner } from "@/lib/marketing/content";

interface PreviousWinnersProps {
  winners: Winner[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * "Ganadores anteriores" (spec.md §1). Winner cards use partial names only
 * (privacy) — see lib/marketing/content.ts for the example data convention.
 */
export function PreviousWinners({ winners }: PreviousWinnersProps) {
  return (
    <section aria-labelledby="ganadores-heading" className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <h2
          id="ganadores-heading"
          className="text-center font-display text-3xl text-foreground sm:text-4xl"
        >
          Ganadores anteriores
        </h2>

        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {winners.map((winner) => (
            <li
              key={winner.id}
              className="rounded-xl border border-surface bg-surface/40 p-6 text-center"
            >
              <p className="text-xs font-semibold tracking-wide text-emerald uppercase">
                {winner.editionLabel}
              </p>
              <p className="mt-2 font-display text-xl text-foreground">
                {winner.displayName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span>Ganó: </span>
                <span className="font-medium text-foreground">
                  {winner.prize}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(winner.dateIso)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
