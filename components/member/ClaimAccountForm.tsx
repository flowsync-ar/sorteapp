"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import { validateClaimAccountInput, type ClaimAccountErrors } from "@/lib/member/validation";
import type { ClaimAccountAction, ClaimAccountFormState } from "@/lib/member/types";

interface ClaimAccountFormProps {
  action: ClaimAccountAction;
  /** Test-only seam, same pattern as `CheckoutForm`. */
  initialStateOverride?: ClaimAccountFormState;
}

const idleState: ClaimAccountFormState = { status: "idle" };

const inputClassName =
  "mt-1 w-full rounded-lg border border-surface bg-ink px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-champagne focus:outline-none aria-[invalid=true]:border-red-400";

/**
 * "Reclamá tu cuenta" form (tasks.md PR8.1, spec.md §7): shown in
 * `/mi-cuenta` while the caller's session is still anonymous and has at
 * least one `approved` order. Client-validates with the same
 * `validateClaimAccountInput` the `claimAccount()` server action re-runs
 * (defense in depth, same convention as `CheckoutForm`), then defers to the
 * server action, which upgrades the anonymous session in place.
 */
export function ClaimAccountForm({ action, initialStateOverride }: ClaimAccountFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialStateOverride ?? idleState,
  );
  const [clientErrors, setClientErrors] = useState<ClaimAccountErrors>({});
  const baseId = useId();

  const serverErrors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const errors: ClaimAccountErrors = { ...serverErrors, ...clientErrors };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const result = validateClaimAccountInput({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!result.success) {
      event.preventDefault();
      setClientErrors(result.errors);
      return;
    }

    setClientErrors({});
  }

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-xl border border-emerald/30 bg-surface/60 p-5">
        <p className="font-semibold text-foreground">¡Cuenta reclamada!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ya podés volver a entrar desde{" "}
          <a href="/login" className="text-champagne underline">
            /login
          </a>{" "}
          con este email y contraseña, desde cualquier dispositivo.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
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
          className={inputClassName}
        />
        {errors.email ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${baseId}-password`} className="text-sm font-medium text-foreground">
          Contraseña
        </label>
        <input
          id={`${baseId}-password`}
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          className={inputClassName}
        />
        {errors.password ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.password}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={`${baseId}-confirmPassword`}
          className="text-sm font-medium text-foreground"
        >
          Repetir contraseña
        </label>
        <input
          id={`${baseId}-confirmPassword`}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          className={inputClassName}
        />
        {errors.confirmPassword ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.confirmPassword}
          </p>
        ) : null}
      </div>

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
        {isPending ? "Guardando..." : "Guardar y reclamar mi cuenta"}
      </button>
    </form>
  );
}
