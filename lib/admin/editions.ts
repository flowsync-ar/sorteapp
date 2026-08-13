import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export class AdminEditionsError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AdminEditionsError";
  }
}

export interface EditionView {
  id: string;
  month: number;
  year: number;
  status: "draft" | "open" | "closed" | "drawn";
  numberCap: number;
  numbersSold: number;
  prizeTitle: string | null;
  drawDateIso: string | null;
  winnerNumber: number | null;
  winnerDisplayName: string | null;
  prizeImageUrl: string | null;
}

type EditionsQueryClient = Pick<SupabaseClient, "from">;

interface EditionRow {
  id: string;
  month: number;
  year: number;
  status: EditionView["status"];
  number_cap: number;
  numbers_sold: number;
  prize_title: string | null;
  draw_date: string | null;
  winner_number: number | null;
  winner_display_name: string | null;
  prize_image: string | null;
}

function toEditionView(row: EditionRow): EditionView {
  return {
    id: row.id,
    month: row.month,
    year: row.year,
    status: row.status,
    numberCap: row.number_cap,
    numbersSold: row.numbers_sold,
    prizeTitle: row.prize_title,
    drawDateIso: row.draw_date,
    winnerNumber: row.winner_number,
    winnerDisplayName: row.winner_display_name,
    prizeImageUrl: row.prize_image,
  };
}

/**
 * Lists every edition, newest first (tasks.md PR9.4, spec.md §8). Admin RLS
 * (`raffle_edition_admin_all`) already grants full visibility to an admin
 * session, so this can safely run against the session-scoped client, not
 * `service_role`.
 */
export async function listEditions(client: EditionsQueryClient): Promise<EditionView[]> {
  const { data, error } = await client
    .from("raffle_edition")
    .select(
      "id, month, year, status, number_cap, numbers_sold, prize_title, draw_date, winner_number, winner_display_name, prize_image",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new AdminEditionsError("No pudimos leer las ediciones.", error);
  }

  return ((data ?? []) as EditionRow[]).map(toEditionView);
}

export interface CreateEditionInput {
  month: number;
  year: number;
  numberCap: number;
  prizeTitle: string;
  drawDateIso: string;
  /**
   * Prize catalog (admin-panel-v2 work unit 3): `"draft"` plans a future
   * prize without competing with the current `open` edition —
   * `raffle_edition_single_open` (PR2) only indexes `status = 'open'`, so
   * any number of `draft` rows coexist freely. Defaults to `"open"` to stay
   * backward-compatible with every caller that predates this field.
   */
  status?: "draft" | "open";
  /**
   * Calculator input memory (change: edition-tiers) — the prize cost the
   * admin typed to generate the suggested tier table. Purely informational
   * (lets the calculator re-seed itself if the admin re-opens this edition);
   * never used to compute anything at read time.
   */
  prizeCostArs?: number;
}

export type CreateEditionResult =
  | { success: true; editionId: string; fellBackToDraft?: boolean }
  | { success: false; error: string };

/**
 * Creates a new edition, `open` by default (tasks.md PR9.4: "crear nueva
 * edición... cerrar edición activa" implies the natural admin workflow is
 * close-then-create). Relies entirely on the schema's own partial unique
 * index (`raffle_edition_single_open`, PR2) to enforce "one open edition at
 * a time" — this function does NOT pre-check for an existing open edition
 * itself (a check-then-insert race would be a TOCTOU bug); it just catches
 * the resulting `23505`.
 *
 * When the admin didn't explicitly ask for `draft`, that `23505` no longer
 * hard-fails the whole submission: it retries the same insert as `draft`
 * instead, so "create while one's already open" queues a planned edition
 * (`fellBackToDraft: true`, surfaced as a warning) rather than losing
 * everything the admin just filled in. An explicit `status: "draft"`
 * request that somehow still collides (shouldn't happen — draft rows aren't
 * indexed by `raffle_edition_single_open`) keeps the old hard-error message.
 */
export async function createEdition(
  input: CreateEditionInput,
  client: EditionsQueryClient,
): Promise<CreateEditionResult> {
  const requestedStatus = input.status ?? "open";
  const basePayload = {
    month: input.month,
    year: input.year,
    number_cap: input.numberCap,
    prize_title: input.prizeTitle,
    draw_date: input.drawDateIso,
    prize_cost_ars: input.prizeCostArs ?? null,
  };

  const { data, error } = await client
    .from("raffle_edition")
    .insert({ ...basePayload, status: requestedStatus })
    .select("id")
    .single();

  if (!error) {
    return { success: true, editionId: data!.id as string };
  }

  if (error.code !== "23505") {
    throw new AdminEditionsError("No pudimos crear la edición.", error);
  }

  if (requestedStatus !== "open") {
    return {
      success: false,
      error: "Ya hay una edición abierta. Cerrala antes de crear una nueva.",
    };
  }

  const retry = await client
    .from("raffle_edition")
    .insert({ ...basePayload, status: "draft" })
    .select("id")
    .single();

  if (retry.error) {
    throw new AdminEditionsError("No pudimos crear la edición.", retry.error);
  }

  return { success: true, editionId: retry.data!.id as string, fellBackToDraft: true };
}

export interface CreateEditionTierInput {
  numbersGranted: number;
  priceArs: number;
}

/**
 * Persists the edition's chance tiers (change: edition-tiers calculator).
 * Same non-atomic, best-effort pattern as `uploadPrizeImage` — the edition
 * needs an id before its tiers can reference it (`tier.edition_id` FK), so
 * this can only run after `createEdition` succeeds, and a failure here does
 * NOT roll back the edition. Unlike the prize photo, though, tiers are not
 * decorative: without them the edition has nothing to sell, so the caller
 * surfaces this failure as a loud warning, not a quiet one.
 */
export async function createEditionTiers(
  editionId: string,
  tiers: CreateEditionTierInput[],
  client: EditionsQueryClient,
): Promise<void> {
  const { error } = await client.from("tier").insert(
    tiers.map((tier) => ({
      edition_id: editionId,
      numbers_granted: tier.numbersGranted,
      price_ars: tier.priceArs,
    })),
  );

  if (error) {
    throw new AdminEditionsError("No pudimos guardar las opciones de chances.", error);
  }
}

export type ValidateTierRowsResult =
  | { success: true; data: CreateEditionTierInput[] }
  | { success: false; error: string };

/**
 * Validates the calculator's submitted tier rows (`TierPricingCalculator`
 * serializes its editable table into a single JSON form field). Kept
 * separate from `validateCreateEditionInput` because the tiers field isn't
 * a plain string input.
 */
export function validateTierRows(raw: string): ValidateTierRowsResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { success: false, error: "Las opciones de chances no tienen un formato válido." };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { success: false, error: "Agregá al menos una opción de chances." };
  }

  const data: CreateEditionTierInput[] = [];
  const seenChances = new Set<number>();

  for (const item of parsed) {
    const numbersGranted = Number((item as { numbersGranted?: unknown })?.numbersGranted);
    const priceArs = Number((item as { priceArs?: unknown })?.priceArs);

    if (!Number.isInteger(numbersGranted) || numbersGranted <= 0) {
      return { success: false, error: "Cada opción necesita una cantidad de chances válida." };
    }
    if (!Number.isFinite(priceArs) || priceArs <= 0) {
      return { success: false, error: "Cada opción necesita un precio válido." };
    }
    if (seenChances.has(numbersGranted)) {
      return { success: false, error: "No puede haber dos opciones con la misma cantidad de chances." };
    }
    seenChances.add(numbersGranted);
    data.push({ numbersGranted, priceArs });
  }

  return { success: true, data };
}

export type CloseEditionResult = { applied: boolean };

/**
 * Closes the given edition (tasks.md PR9.4 "cerrar edición activa").
 * Guarded update (`.eq("status", "open")`, same idempotency pattern
 * `lib/receipts/review.ts` uses): closing an already-closed/drawn edition
 * is a pure no-op instead of an error.
 */
export async function closeEdition(
  editionId: string,
  client: EditionsQueryClient,
): Promise<CloseEditionResult> {
  const { data, error } = await client
    .from("raffle_edition")
    .update({ status: "closed" })
    .eq("id", editionId)
    .eq("status", "open")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AdminEditionsError("No pudimos cerrar la edición.", error);
  }

  return { applied: Boolean(data) };
}

export type PublishEditionResult = { success: true } | { success: false; error: string };

/**
 * Activates a planned prize (admin-panel-v2 work unit 3, "catálogo de
 * premios planificable"): flips a `draft` edition to `open`. Guarded update
 * (`.eq("status", "draft")`, same idempotency pattern as `closeEdition`), so
 * activating an edition that already moved on (published concurrently,
 * closed, etc.) is reported as a friendly error instead of silently
 * clobbering state. Relies on `raffle_edition_single_open` (PR2) to enforce
 * "one open edition at a time" — same TOCTOU-safe "catch the 23505" pattern
 * `createEdition` uses, not a pre-check.
 */
export async function publishEdition(
  editionId: string,
  client: EditionsQueryClient,
): Promise<PublishEditionResult> {
  const { data, error } = await client
    .from("raffle_edition")
    .update({ status: "open" })
    .eq("id", editionId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Ya hay una edición abierta. Cerrala antes de activar esta.",
      };
    }
    throw new AdminEditionsError("No pudimos activar la edición.", error);
  }

  if (!data) {
    return {
      success: false,
      error: "Esta edición ya no está en borrador.",
    };
  }

  return { success: true };
}

export type CreateEditionErrors = Partial<
  Record<"month" | "year" | "numberCap" | "prizeTitle" | "drawDate", string>
>;

export type CreateEditionValidation =
  | { success: true; data: CreateEditionInput }
  | { success: false; errors: CreateEditionErrors };

/**
 * Validates the "crear edición" form (tasks.md PR9.4). Same pure,
 * framework-agnostic pattern as `lib/checkout/validation.ts` — runs
 * client-side (inline errors) and server-side (defense in depth).
 */
export function validateCreateEditionInput(input: {
  month: string;
  year: string;
  numberCap: string;
  prizeTitle: string;
  drawDate: string;
  /** Prize catalog (work unit 3). Any other value quietly falls back to `"open"`. */
  status?: string;
  /** Calculator input memory — blank/invalid quietly omits it, never blocks submission. */
  prizeCostArs?: string;
}): CreateEditionValidation {
  const errors: CreateEditionErrors = {};

  const month = Number(input.month);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    errors.month = "Elegí un mes entre 1 y 12.";
  }

  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 2024) {
    errors.year = "Ingresá un año válido.";
  }

  const numberCap = Number(input.numberCap);
  if (!Number.isInteger(numberCap) || numberCap <= 0 || numberCap > 1000000) {
    errors.numberCap = "El cupo debe ser un entero entre 1 y 1.000.000.";
  }

  const prizeTitle = input.prizeTitle.trim();
  if (prizeTitle.length === 0) {
    errors.prizeTitle = "Ingresá el nombre del premio.";
  }

  const drawDate = input.drawDate.trim();
  const drawDateIso = drawDate ? new Date(drawDate).toISOString() : "";
  if (!drawDate || Number.isNaN(new Date(drawDate).getTime())) {
    errors.drawDate = "Ingresá una fecha de sorteo válida.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const status: CreateEditionInput["status"] = input.status === "draft" ? "draft" : "open";
  const parsedCost = Number(input.prizeCostArs);
  const prizeCostArs = Number.isFinite(parsedCost) && parsedCost > 0 ? parsedCost : undefined;

  return {
    success: true,
    data: { month, year, numberCap, prizeTitle, drawDateIso, status, prizeCostArs },
  };
}
