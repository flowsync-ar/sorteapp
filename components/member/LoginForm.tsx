"use client";

import { useActionState, useId } from "react";
import type { LoginAction, LoginFormState } from "@/lib/member/types";

interface LoginFormProps {
  action: LoginAction;
  /** Test-only seam, same pattern as `CheckoutForm`. */
  initialStateOverride?: LoginFormState;
}

const idleState: LoginFormState = { status: "idle" };

const inputClassName =
  "mt-1 w-full rounded-lg border border-surface bg-ink px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-champagne focus:outline-none aria-[invalid=true]:border-red-400";

/**
 * `/login` form (tasks.md PR8.2, spec.md §7): lets a buyer who already
 * claimed their account (`ClaimAccountForm`) sign in again from another
 * device/browser. Same `useActionState` shape as `CheckoutForm`.
 */
export function LoginForm({ action, initialStateOverride }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialStateOverride ?? idleState,
  );
  const baseId = useId();
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-4">
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
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          className={inputClassName}
        />
        {errors.password ? (
          <p role="alert" className="mt-1 text-sm text-red-400">
            {errors.password}
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
        {isPending ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
