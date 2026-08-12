"use client";

import { useActionState } from "react";
import type { SetPrizeImageAction, SetPrizeImageFormState } from "@/lib/admin/types";
import { PrizeImageInput } from "./PrizeImageInput";

interface PrizeImageFormProps {
  action: SetPrizeImageAction;
  /** Current `prize_image` URL, if any — shown as the initial preview. */
  initialPreviewUrl?: string | null;
  /** Test-only seam, same pattern as other action-bound forms. */
  initialStateOverride?: SetPrizeImageFormState;
}

const idleState: SetPrizeImageFormState = { status: "idle" };

/**
 * Per-row "re-subir imagen del premio" control (tasks.md prize-image Phase 4,
 * design.md §4/§6). Bound to a single edition id via
 * `setPrizeImageAction.bind(null, editionId)`, same convention
 * `closeEditionAction`/`publishWinnerAction` use in `EditionsTable`.
 */
export function PrizeImageForm({
  action,
  initialPreviewUrl = null,
  initialStateOverride,
}: PrizeImageFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialStateOverride ?? idleState,
  );

  return (
    <form action={formAction} className="space-y-1">
      <PrizeImageInput name="prizeImage" initialPreviewUrl={initialPreviewUrl} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-champagne/50 px-3 py-1.5 text-sm font-semibold text-champagne transition hover:bg-champagne/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Subiendo..." : "Subir imagen"}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
