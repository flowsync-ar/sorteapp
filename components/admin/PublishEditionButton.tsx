"use client";

import { useActionState } from "react";
import type { PublishEditionAction, PublishEditionFormState } from "@/lib/admin/types";

interface PublishEditionButtonProps {
  action: PublishEditionAction;
  /** Test-only seam, same pattern as `CloseEditionButton`. */
  initialStateOverride?: PublishEditionFormState;
}

const idleState: PublishEditionFormState = { status: "idle" };

/**
 * "Activar" a planned (`draft`) edition (admin-panel-v2 work unit 3, prize
 * catalog) — flips it to `open`. Same one-button-bound-to-one-edition-id
 * shape as `CloseEditionButton`
 * (`publishEditionAction.bind(null, editionId)`). The conflict error (an
 * edition is already open — `raffle_edition_single_open`, PR2) surfaces
 * here as `state.formError`.
 */
export function PublishEditionButton({ action, initialStateOverride }: PublishEditionButtonProps) {
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
        {isPending ? "Activando..." : "Activar edición"}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
