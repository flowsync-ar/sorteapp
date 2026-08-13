"use client";

import { useId, useState } from "react";
import { suggestTierPrices, type TierSuggestion } from "@/lib/admin/tier-pricing";

interface TierPricingCalculatorProps {
  /** Existing tiers, when editing/regenerating for an edition that already has some. */
  initialTiers?: TierSuggestion[];
  initialPrizeCostArs?: number | null;
}

const inputClassName =
  "mt-1 w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-champagne focus:outline-none";

function formatArs(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

/** Strips everything but digits — the source of truth kept in state and
 * submitted via the hidden field is always the raw number as a string. */
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Price calculator for the "crear edición" form: the admin types the real
 * cost of the prize, gets a suggested table of chance tiers, and can edit
 * every price before submitting. The suggestion is a starting point, never a
 * verdict — see `lib/admin/tier-pricing.ts`, no formula can know real demand.
 * Serializes into two hidden fields (`prizeCostArs`, `tiers`) so the whole
 * thing rides along the surrounding native `<form>` without its own submit.
 */
export function TierPricingCalculator({
  initialTiers,
  initialPrizeCostArs,
}: TierPricingCalculatorProps) {
  const baseId = useId();
  const [costInput, setCostInput] = useState(
    initialPrizeCostArs ? String(initialPrizeCostArs) : "",
  );
  const [rows, setRows] = useState<TierSuggestion[]>(initialTiers ?? []);

  function handleSuggest() {
    const cost = Number(costInput);
    if (!Number.isFinite(cost) || cost <= 0) {
      return;
    }
    setRows(suggestTierPrices(cost));
  }

  function handlePriceChange(numbersGranted: number, priceArs: number) {
    setRows((current) =>
      current.map((row) => (row.numbersGranted === numbersGranted ? { ...row, priceArs } : row)),
    );
  }

  return (
    <div className="rounded-xl border border-champagne/30 bg-surface/40 p-4">
      <label htmlFor={`${baseId}-cost`} className="text-sm font-medium text-foreground">
        Costo del premio
      </label>
      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            $
          </span>
          <input
            id={`${baseId}-cost`}
            type="text"
            inputMode="numeric"
            placeholder="Ej: 3.000.000"
            value={costInput ? Number(costInput).toLocaleString("es-AR") : ""}
            onChange={(event) => setCostInput(digitsOnly(event.target.value))}
            className={`${inputClassName} pl-7`}
          />
        </div>
        <button
          type="button"
          onClick={handleSuggest}
          className="shrink-0 rounded-lg border border-champagne/50 px-4 py-2 text-sm font-semibold text-champagne transition hover:bg-champagne/10"
        >
          Sugerir precios
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Es un punto de partida en base al costo — cada precio de abajo es editable antes de crear
        la edición.
      </p>

      {rows.length > 0 ? (
        <div className="mt-4 space-y-2">
          {rows.map((row) => (
            <div key={row.numbersGranted} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm text-muted-foreground">
                {row.numbersGranted} chance{row.numbersGranted > 1 ? "s" : ""}
              </span>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  min={1}
                  value={row.priceArs}
                  onChange={(event) =>
                    handlePriceChange(row.numbersGranted, Number(event.target.value))
                  }
                  aria-label={`Precio para ${row.numbersGranted} chances`}
                  className={`${inputClassName} pl-7`}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                {formatArs(Math.round(row.priceArs / row.numbersGranted))}/chance
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Ingresá el costo del premio y tocá &ldquo;Sugerir precios&rdquo; para generar la tabla de
          chances.
        </p>
      )}

      <input type="hidden" name="prizeCostArs" value={costInput} />
      <input type="hidden" name="tiers" value={JSON.stringify(rows)} />
    </div>
  );
}
