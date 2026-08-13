"use client";

import { useActionState, useId, useState } from "react";
import type { LoginAction, LoginFormState } from "@/lib/member/types";

interface LoginFormProps {
  action: LoginAction;
  /** Test-only seam, same pattern as `CheckoutForm`. */
  initialStateOverride?: LoginFormState;
}

const idleState: LoginFormState = { status: "idle" };

const inputClassName =
  "mt-1 w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-champagne focus:outline-none aria-[invalid=true]:border-red-400";

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
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <input
            id={`${baseId}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className={`${inputClassName} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                <path d="M9.88 5.09A9.77 9.77 0 0 1 12 5c5 0 9 4.5 10 7-.42 1.06-1.14 2.24-2.12 3.31M6.12 6.69C4.14 7.76 2.43 9.39 2 12c1 2.5 5 7 10 7 1.06 0 2.06-.18 2.99-.5" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
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
