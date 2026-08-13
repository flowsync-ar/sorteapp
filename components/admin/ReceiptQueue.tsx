"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PendingReceiptView } from "@/lib/admin/receipts";

export interface ReceiptQueueItem extends PendingReceiptView {
  signedUrl: string;
}

export interface ReviewOutcome {
  ok: boolean;
  error?: string;
}

export type ReviewReceiptFn = (
  receiptId: string,
  decision: "verified" | "rejected",
  reason?: string,
) => Promise<ReviewOutcome>;

interface ReceiptQueueProps {
  receipts: ReceiptQueueItem[];
  /**
   * Defaults to a real `fetch` against PR7's `POST /api/admin/receipts/
   * [receiptId]/review` endpoint (reused, not reimplemented). Overridable
   * so this component stays unit-testable without a live server.
   */
  onReview?: ReviewReceiptFn;
}

async function fetchReviewReceipt(
  receiptId: string,
  decision: "verified" | "rejected",
  reason?: string,
): Promise<ReviewOutcome> {
  const response = await fetch(`/api/admin/receipts/${receiptId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reason }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "processing failed" }));
    return { ok: false, error: body.error ?? "processing failed" };
  }

  return { ok: true };
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

interface ReceiptRowProps {
  receipt: ReceiptQueueItem;
  onReview: ReviewReceiptFn;
}

function ReceiptRow({ receipt, onReview }: ReceiptRowProps) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const reasonId = useId();

  function handleDecision(decision: "verified" | "rejected") {
    setError(undefined);
    startTransition(async () => {
      const outcome = await onReview(
        receipt.id,
        decision,
        decision === "rejected" ? reason.trim() || undefined : undefined,
      );
      if (!outcome.ok) {
        setError(outcome.error ?? "No pudimos procesar la revisión.");
        return;
      }
      setShowReject(false);
      router.refresh();
    });
  }

  return (
    <li className="rounded-xl border border-surface bg-surface/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground">{receipt.buyerName}</p>
          <p className="text-sm text-muted-foreground">{receipt.buyerEmail}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-foreground">
              {receipt.chances} {receipt.chances === 1 ? "chance" : "chances"}
            </span>{" "}
            · {formatArs(receipt.amountArs)}
          </p>
          <a
            href={receipt.signedUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-champagne underline"
          >
            Ver comprobante
          </a>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDecision("verified")}
              className="rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Verificar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowReject((value) => !value)}
              className="rounded-lg border border-red-400/50 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Rechazar
            </button>
          </div>

          {showReject ? (
            <div className="w-full min-w-64 space-y-2 text-left">
              <label htmlFor={reasonId} className="text-sm font-medium text-foreground">
                Motivo del rechazo
              </label>
              <textarea
                id={reasonId}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm text-foreground focus:border-champagne focus:outline-none"
              />
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDecision("rejected")}
                className="w-full rounded-lg bg-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirmar rechazo
              </button>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * Comprobante review queue (tasks.md PR9.2, design.md §7 `ReceiptQueue`).
 * Deliberately a flat table/list with inline actions instead of design.md's
 * `ReceiptReviewDrawer` modal — the batch's own instruction prioritizes
 * table/list usability over editorial polish for the admin panel, and an
 * inline row action is one click faster than opening a drawer per receipt.
 * Reuses PR7's `POST /api/admin/receipts/[receiptId]/review` endpoint via
 * `onReview` (injected so this component has zero direct `fetch` coupling —
 * easier to unit-test, and the real implementation lives in the page's
 * client wrapper).
 */
export function ReceiptQueue({ receipts, onReview = fetchReviewReceipt }: ReceiptQueueProps) {
  if (receipts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay comprobantes pendientes de revisión.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {receipts.map((receipt) => (
        <ReceiptRow key={receipt.id} receipt={receipt} onReview={onReview} />
      ))}
    </ul>
  );
}
