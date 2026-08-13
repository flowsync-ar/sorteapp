"use client";

import { useId, useState } from "react";
import type { OpenEditionTier } from "@/lib/marketing/tiers";
import { CheckoutButton } from "./CheckoutButton";

interface ChanceSelectorProps {
  tiers: OpenEditionTier[];
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Single-card chance picker (replaces the old 3-fixed-tier `TierCards`
 * grid): one card, one dropdown, price updates with the selection. Tiers are
 * per-edition now (`lib/marketing/tiers.ts`, admin price calculator), so the
 * options themselves vary edition to edition instead of being a fixed
 * catalog of 3 named plans.
 */
export function ChanceSelector({ tiers }: ChanceSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(tiers[0]?.id ?? null);
  const selectId = useId();

  const selected = tiers.find((tier) => tier.id === selectedId) ?? null;
  // Smallest chance count sets the reference per-chance price; every larger
  // tier's discount is shown relative to it.
  const baselineTier = tiers.reduce(
    (smallest, tier) => (tier.numbersGranted < smallest.numbersGranted ? tier : smallest),
    tiers[0],
  );
  const baselinePerChance = baselineTier ? baselineTier.priceArs / baselineTier.numbersGranted : 0;

  const pricePerChance = selected ? selected.priceArs / selected.numbersGranted : 0;
  const savingsPercent =
    selected && baselinePerChance > 0 && selected.id !== baselineTier?.id
      ? Math.round((1 - pricePerChance / baselinePerChance) * 100)
      : 0;

  return (
    <section id="tiers" aria-labelledby="tiers-heading" className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <h2
          id="tiers-heading"
          className="text-center font-display text-3xl text-foreground sm:text-4xl"
        >
          Elegí tus chances
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Cada chance es un número de 6 cifras para el sorteo del mes.
        </p>

        <div className="mt-10 rounded-2xl border border-champagne/30 bg-surface/40 p-6">
          {tiers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Todavía no hay chances disponibles para esta edición.
            </p>
          ) : (
            <>
              <label htmlFor={selectId} className="text-sm font-medium text-foreground">
                Cantidad de chances
              </label>
              <select
                id={selectId}
                value={selectedId ?? ""}
                onChange={(event) => setSelectedId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-surface bg-ink px-3 py-2.5 text-sm text-foreground focus:border-champagne focus:outline-none"
              >
                {tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.numbersGranted} chance{tier.numbersGranted > 1 ? "s" : ""} —{" "}
                    {formatArs(tier.priceArs)}
                  </option>
                ))}
              </select>

              {selected ? (
                <div className="mt-6 text-center">
                  <p className="font-display text-4xl text-champagne">
                    {formatArs(selected.priceArs)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatArs(Math.round(pricePerChance))} por chance
                    {savingsPercent > 0 ? (
                      <span className="ml-2 rounded-full bg-emerald/15 px-2 py-0.5 text-xs font-semibold text-emerald">
                        Ahorrás {savingsPercent}%
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald">
                    {selected.numbersGranted}{" "}
                    {selected.numbersGranted === 1
                      ? "número de 6 cifras"
                      : "números de 6 cifras"}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 flex justify-center">
                <CheckoutButton selectedTier={selectedId} />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
