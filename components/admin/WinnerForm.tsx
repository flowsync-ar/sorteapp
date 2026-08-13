"use client";

import { useActionState, useId } from "react";
import type { PublishWinnerAction, PublishWinnerFormState } from "@/lib/admin/types";

interface WinnerFormProps {
  action: PublishWinnerAction;
  /** Test-only seam, same pattern as other action-bound forms. */
  initialStateOverride?: PublishWinnerFormState;
}

const idleState: PublishWinnerFormState = { status: "idle" };

/**
 * "Cargar resultado del sorteo" (tasks.md PR9.5, spec.md §8 "publicar
 * ganador"). Bound to a single closed edition id via
 * `publishWinnerAction.bind(null, editionId)`. Success flips the parent
 * edition row to `drawn` on revalidation (`lib/admin/winners.ts`
 * `publishWinner`), so this form's own transient "success" state is
 * secondary to that (same lesson `ClaimAccountForm`/`ComprobanteUploader`
 * document — the server-rendered result after revalidation is the stronger
 * proof).
 */
export function WinnerForm({ action, initialStateOverride }: WinnerFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialStateOverride ?? idleState,
  );
  const inputId = useId();

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          Número ganador
        </label>
        <input
          id={inputId}
          name="winnerNumber"
          type="text"
          inputMode="numeric"
          pattern="\d{1,6}"
          placeholder="000000"
          aria-invalid={state.status === "error"}
          className="mt-1 w-32 rounded-lg border border-white/15 bg-ink px-3 py-1.5 text-sm text-foreground focus:border-champagne focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-champagne px-4 py-1.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Publicando..." : "Publicar ganador"}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="w-full text-sm text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
