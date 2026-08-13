"use client";

import { useActionState, useId } from "react";
import type { CreateEditionAction, CreateEditionFormState } from "@/lib/admin/types";
import { PrizeImageInput } from "./PrizeImageInput";
import { TierPricingCalculator } from "./TierPricingCalculator";

interface CreateEditionFormProps {
  action: CreateEditionAction;
  /** Test-only seam, same pattern as `CheckoutForm`/`LoginForm`. */
  initialStateOverride?: CreateEditionFormState;
}

const idleState: CreateEditionFormState = { status: "idle" };

const inputClassName =
  "mt-1 w-full rounded-lg border border-surface bg-ink px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-champagne focus:outline-none aria-[invalid=true]:border-red-400";

/**
 * "Crear edición" form (tasks.md PR9.4, spec.md §8; status selector added in
 * admin-panel-v2 work unit 3, prize catalog). Defaults to `open` — the
 * schema's own single-open-edition constraint (`raffle_edition_single_open`,
 * PR2) surfaces as this form's own `formError` when another edition is
 * already open, per this batch's own instruction ("mostrar error claro si lo
 * intenta"). Picking "Borrador" instead creates a planned-prize edition that
 * never competes with that constraint — any number of `draft` rows can
 * coexist; `EditionsTable`'s "Activar edición" button (`publishEdition`)
 * flips one to `open` later.
 */
export function CreateEditionForm({ action, initialStateOverride }: CreateEditionFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialStateOverride ?? idleState,
  );
  const baseId = useId();
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={`${baseId}-month`} className="text-sm font-medium text-foreground">
          Mes
        </label>
        <input
          id={`${baseId}-month`}
          name="month"
          type="number"
          min={1}
          max={12}
          aria-invalid={Boolean(errors.month)}
          className={inputClassName}
        />
        {errors.month ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.month}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${baseId}-year`} className="text-sm font-medium text-foreground">
          Año
        </label>
        <input
          id={`${baseId}-year`}
          name="year"
          type="number"
          min={2024}
          aria-invalid={Boolean(errors.year)}
          className={inputClassName}
        />
        {errors.year ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.year}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${baseId}-numberCap`} className="text-sm font-medium text-foreground">
          Cupo de números
        </label>
        <input
          id={`${baseId}-numberCap`}
          name="numberCap"
          type="number"
          min={1}
          max={1000000}
          aria-invalid={Boolean(errors.numberCap)}
          className={inputClassName}
        />
        {errors.numberCap ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.numberCap}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${baseId}-drawDate`} className="text-sm font-medium text-foreground">
          Fecha de sorteo
        </label>
        <input
          id={`${baseId}-drawDate`}
          name="drawDate"
          type="datetime-local"
          aria-invalid={Boolean(errors.drawDate)}
          className={inputClassName}
        />
        {errors.drawDate ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.drawDate}
          </p>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${baseId}-prizeTitle`} className="text-sm font-medium text-foreground">
          Premio
        </label>
        <input
          id={`${baseId}-prizeTitle`}
          name="prizeTitle"
          type="text"
          aria-invalid={Boolean(errors.prizeTitle)}
          className={inputClassName}
        />
        {errors.prizeTitle ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.prizeTitle}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${baseId}-status`} className="text-sm font-medium text-foreground">
          Estado
        </label>
        <select
          id={`${baseId}-status`}
          name="status"
          defaultValue="open"
          className={inputClassName}
        >
          <option value="open">Abierta</option>
          <option value="draft">Borrador (premio futuro)</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-foreground">Opciones de chances</label>
        <div className="mt-1">
          <TierPricingCalculator />
        </div>
      </div>

      <div className="sm:col-span-2">
        <PrizeImageInput name="prizeImage" />
      </div>

      {state.status === "success" && state.warning ? (
        <p
          role="status"
          className="sm:col-span-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-300"
        >
          {state.warning}
        </p>
      ) : null}

      {state.status === "error" && state.formError ? (
        <p
          role="alert"
          className="sm:col-span-2 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-champagne px-6 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creando..." : "Crear edición"}
        </button>
      </div>
    </form>
  );
}
