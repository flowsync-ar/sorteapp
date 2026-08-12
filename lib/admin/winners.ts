import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export class PublishWinnerError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PublishWinnerError";
  }
}

export type PublishWinnerResult = { applied: boolean };

type PublishWinnerClient = Pick<SupabaseClient, "from">;

/**
 * Privacy-scrubbed display name for a published winner (tasks.md PR9.5,
 * design.md §3: the public "ganadores" view is "no PII"). Keeps the first
 * given name and only the initial of the last surname — same shape as the
 * existing example data's convention (`lib/marketing/content.ts`'s
 * `previousWinners`, e.g. "Martín G."). Middle names are dropped entirely.
 */
export function derivePartialDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return parts[0] ?? "";
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

/**
 * Publishes a sorteo's result (tasks.md PR9.5, spec.md §8 "cargar resultado
 * del sorteo... publicar ganador"). Only operates on a `closed` edition
 * (guarded update, same idempotency pattern `lib/receipts/review.ts` and
 * `lib/admin/editions.ts#closeEdition` use) and only accepts a number that
 * was genuinely assigned in THIS edition (`raffle_number`, ADR-1's
 * bijection output) — looks up the owning order to compute the scrubbed
 * display name, never persists the raw `order.buyer_name`.
 *
 * Defaults to `createAdminClient()` (service_role) like `assignNumbers`/
 * `reviewReceipt`, overridable for tests.
 */
export async function publishWinner(
  editionId: string,
  winnerNumber: number,
  client: PublishWinnerClient = createAdminClient(),
): Promise<PublishWinnerResult> {
  const { data: edition, error: editionError } = await client
    .from("raffle_edition")
    .select("id, status")
    .eq("id", editionId)
    .maybeSingle();

  if (editionError) {
    throw new PublishWinnerError("No pudimos leer la edición.", editionError);
  }
  if (!edition) {
    throw new PublishWinnerError("No encontramos esa edición.");
  }
  if (edition.status !== "closed") {
    throw new PublishWinnerError(
      "La edición debe estar cerrada para poder cargar un ganador.",
    );
  }

  const { data: raffleNumber, error: numberError } = await client
    .from("raffle_number")
    .select("user_id, order_id")
    .eq("edition_id", editionId)
    .eq("number", winnerNumber)
    .maybeSingle();

  if (numberError) {
    throw new PublishWinnerError("No pudimos leer el número ganador.", numberError);
  }
  if (!raffleNumber) {
    throw new PublishWinnerError(
      "Ese número no fue asignado en esta edición.",
    );
  }

  const { data: order, error: orderError } = await client
    .from("order")
    .select("buyer_name")
    .eq("id", raffleNumber.order_id)
    .single();

  if (orderError || !order) {
    throw new PublishWinnerError(
      "No pudimos leer los datos del ganador.",
      orderError,
    );
  }

  const { data: updated, error: updateError } = await client
    .from("raffle_edition")
    .update({
      status: "drawn",
      winner_number: winnerNumber,
      winner_participant_id: raffleNumber.user_id,
      winner_display_name: derivePartialDisplayName(order.buyer_name as string),
    })
    .eq("id", editionId)
    .eq("status", "closed")
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new PublishWinnerError("No pudimos publicar el ganador.", updateError);
  }

  return { applied: Boolean(updated) };
}
