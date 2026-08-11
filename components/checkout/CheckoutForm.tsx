"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import { validateBuyerInfo, type BuyerInfoErrors } from "@/lib/checkout/validation";
import type { CheckoutFormState, CreateOrderAction } from "@/lib/checkout/types";

interface CheckoutFormProps {
  action: CreateOrderAction;
  tierName: string;
  /** Test-only seam: lets tests render straight into an error state without
   * exercising the full async `useActionState` transition. */
  initialStateOverride?: CheckoutFormState;
}

const idleState: CheckoutFormState = { status: "idle" };

const inputClassName =
  "mt-1 w-full rounded-lg border border-surface bg-ink px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-champagne focus:outline-none aria-[invalid=true]:border-red-400";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-400">
      {message}
    </p>
  );
}

/**
 * Checkout buyer form (tasks.md 5.2, spec.md §3). Client-validates on
 * submit with the same `validateBuyerInfo` the server action re-runs
 * (defense in depth — spec.md §9 audit data must never rely on a
 * client-only check), then defers to the `createOrder` server action bound
 * to the current tier.
 */
export function CheckoutForm({
  action,
  tierName,
  initialStateOverride,
}: CheckoutFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialStateOverride ?? idleState,
  );
  const [clientErrors, setClientErrors] = useState<BuyerInfoErrors>({});
  const baseId = useId();

  const serverErrors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const errors: BuyerInfoErrors = { ...serverErrors, ...clientErrors };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const result = validateBuyerInfo({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      dni: String(formData.get("dni") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });

    if (!result.success) {
      event.preventDefault();
      setClientErrors(result.errors);
      return;
    }

    setClientErrors({});
  }

  const nameErrorId = `${baseId}-name-error`;
  const emailErrorId = `${baseId}-email-error`;
  const dniErrorId = `${baseId}-dni-error`;
  const phoneErrorId = `${baseId}-phone-error`;

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor={`${baseId}-name`} className="text-sm font-medium text-foreground">
            Nombre y apellido
          </label>
          <input
            id={`${baseId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? nameErrorId : undefined}
            className={inputClassName}
          />
          <FieldError id={nameErrorId} message={errors.name} />
        </div>

        <div>
          <label htmlFor={`${baseId}-email`} className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id={`${baseId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? emailErrorId : undefined}
            className={inputClassName}
          />
          <FieldError id={emailErrorId} message={errors.email} />
        </div>

        <div>
          <label htmlFor={`${baseId}-dni`} className="text-sm font-medium text-foreground">
            DNI
          </label>
          <input
            id={`${baseId}-dni`}
            name="dni"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={Boolean(errors.dni)}
            aria-describedby={errors.dni ? dniErrorId : undefined}
            className={inputClassName}
          />
          <FieldError id={dniErrorId} message={errors.dni} />
        </div>

        <div>
          <label htmlFor={`${baseId}-phone`} className="text-sm font-medium text-foreground">
            Teléfono
          </label>
          <input
            id={`${baseId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? phoneErrorId : undefined}
            className={inputClassName}
          />
          <FieldError id={phoneErrorId} message={errors.phone} />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Método de pago</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-surface bg-surface/40 p-4 has-[:checked]:border-champagne has-[:checked]:ring-1 has-[:checked]:ring-champagne">
            <input type="radio" name="method" value="mp" defaultChecked />
            <span>
              <span className="block font-semibold text-foreground">Mercado Pago</span>
              <span className="block text-sm text-muted-foreground">
                Acreditación automática
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-surface bg-surface/40 p-4 has-[:checked]:border-champagne has-[:checked]:ring-1 has-[:checked]:ring-champagne">
            <input type="radio" name="method" value="transfer" />
            <span>
              <span className="block font-semibold text-foreground">Transferencia bancaria</span>
              <span className="block text-sm text-muted-foreground">
                Con comprobante, descuento incluido
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {state.status === "error" && state.formError ? (
        <p role="alert" className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
          {state.formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-champagne px-6 py-3 font-sans text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Procesando..." : `Confirmar compra — ${tierName}`}
      </button>
    </form>
  );
}
