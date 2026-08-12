"use client";

import { useActionState } from "react";
import type { CloseEditionAction, CloseEditionFormState } from "@/lib/admin/types";

interface CloseEditionButtonProps {
  action: CloseEditionAction;
  /** Test-only seam, same pattern as other action-bound forms. */
  initialStateOverride?: CloseEditionFormState;
}

const idleState: CloseEditionFormState = { status: "idle" };

/**
 * "Cerrar edición activa" (tasks.md PR9.4). One button, bound to a single
 * edition id via `closeEditionAction.bind(null, editionId)` (same pattern
 * `uploadReceiptAction.bind(null, orderId)` uses, PR7).
 */
export function CloseEditionButton({ action, initialStateOverride }: CloseEditionButtonProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialStateOverride ?? idleState,
  );

  return (
    <form action={formAction} className="space-y-1">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-champagne/50 px-3 py-1.5 text-sm font-semibold text-champagne transition hover:bg-champagne/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Cerrando..." : "Cerrar edición"}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
