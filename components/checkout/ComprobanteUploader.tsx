"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import { validateReceiptFile } from "@/lib/receipts/validation";
import type { ComprobanteFormState, UploadReceiptAction } from "@/lib/receipts/types";

interface ComprobanteUploaderProps {
  action: UploadReceiptAction;
  /** Test-only seam, mirrors `CheckoutForm`'s `initialStateOverride`. */
  initialStateOverride?: ComprobanteFormState;
}

const idleState: ComprobanteFormState = { status: "idle" };

/**
 * Comprobante upload island (design.md §7 `ComprobanteUploader` island,
 * tasks.md PR7). Client-validates the selected file with the same
 * `validateReceiptFile` the server re-runs (defense in depth, mirrors
 * `CheckoutForm`'s pattern), then defers to the `uploadReceiptAction`
 * server action bound to the current order.
 */
export function ComprobanteUploader({
  action,
  initialStateOverride,
}: ComprobanteUploaderProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialStateOverride ?? idleState,
  );
  const [clientError, setClientError] = useState<string | undefined>();
  const baseId = useId();
  const errorId = `${baseId}-receipt-error`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Deliberately read the file straight off the `<input type="file">`
    // element instead of `new FormData(event.currentTarget)`: jsdom (the
    // test environment) rebuilds `File` entries constructed that way as an
    // empty `application/octet-stream` blob (size 0, name ""), losing the
    // real file's metadata — a jsdom-only quirk, real browsers preserve it
    // correctly. `input.files[0]` is unaffected in both environments.
    const input = event.currentTarget.elements.namedItem("receipt") as HTMLInputElement | null;
    const file = input?.files?.[0];
    const result = validateReceiptFile(
      file ? { name: file.name, type: file.type, size: file.size } : null,
    );

    if (!result.success) {
      event.preventDefault();
      setClientError(result.error);
      return;
    }

    setClientError(undefined);
  }

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-xl border border-emerald/30 bg-surface/60 p-5">
        <p className="font-semibold text-foreground">Comprobante recibido</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu comprobante quedó pendiente de revisión. Te avisamos apenas lo verifiquemos.
        </p>
      </div>
    );
  }

  const errorMessage = clientError ?? (state.status === "error" ? state.formError : undefined);

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${baseId}-receipt`} className="text-sm font-medium text-foreground">
          Comprobante de transferencia (imagen o PDF)
        </label>
        <input
          id={`${baseId}-receipt`}
          name="receipt"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? errorId : undefined}
          className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-champagne file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink"
        />
        {errorMessage ? (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-400">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-champagne px-6 py-3 font-sans text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Subiendo..." : "Subir comprobante"}
      </button>
    </form>
  );
}
