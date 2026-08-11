"use client";

import { useId, useState } from "react";
import type { Tier } from "@/lib/marketing/content";
import { CheckoutButton } from "./CheckoutButton";

interface TierCardsProps {
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
 * Interactive tier picker (design.md §7 `TierCards` island, tasks.md 5.1).
 * Distinct from PR4's read-only `TierCatalog`: this one holds selection
 * state and feeds `CheckoutButton`, which starts the real checkout flow at
 * `/checkout/[tier]`. Quantity selection is intentionally NOT offered — each
 * tier already grants a fixed `numbersGranted` (see `supabase/seed.sql`);
 * there is no per-tier "buy N packs" concept in the current data model
 * (see apply-progress deviations for this batch).
 */
export function TierCards({ tiers }: TierCardsProps) {
  const [selected, setSelected] = useState<Tier["key"] | null>(null);
  const groupName = useId();

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

        <fieldset className="mt-10">
          <legend className="sr-only">Elegí un tier para continuar</legend>
          <div className="grid gap-6 sm:grid-cols-3">
            {tiers.map((tier) => {
              const isSelected = selected === tier.key;

              return (
                <label
                  key={tier.key}
                  className={`relative flex cursor-pointer flex-col rounded-2xl border p-6 transition ${
                    isSelected
                      ? "border-champagne bg-surface/70 ring-1 ring-champagne"
                      : "border-surface bg-surface/40 hover:border-champagne/50"
                  }`}
                >
                  {/*
                    Not `sr-only`: that CSS trick shrinks the input to a 1px
                    box, which real browsers can occlude behind the card's
                    own content (a Playwright e2e run caught this — the
                    heading intercepted pointer events, exactly the class of
                    bug RTL's synthetic events don't catch; see PR4's
                    apply-progress "Deviations" for the same lesson).
                    `absolute inset-0 opacity-0` keeps the whole card as the
                    input's real clickable/checkable hit area instead.
                  */}
                  <input
                    type="radio"
                    name={`tier-${groupName}`}
                    value={tier.key}
                    checked={isSelected}
                    onChange={() => setSelected(tier.key)}
                    aria-label={tier.name}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />

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
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-8 text-center">
          <CheckoutButton selectedTier={selected} />
        </div>
      </div>
    </section>
  );
}
