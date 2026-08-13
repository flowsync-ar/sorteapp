import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type PublicTiersClient = Pick<SupabaseClient, "from">;

interface OpenEditionTierRow {
  id: string;
  numbers_granted: number;
  price_ars: number;
}

export interface OpenEditionTier {
  id: string;
  numbersGranted: number;
  priceArs: number;
}

/**
 * Public "chances disponibles" read (change: edition-tiers). Tiers are
 * per-edition now (`lib/admin/tier-pricing.ts`'s calculator), so — same
 * two-step shape as `getOpenEditionPrize` — this first resolves the current
 * `open` edition, then its `tier` rows, ascending by chance count. Returns
 * `[]` on any failure or when there's no open edition/no tiers configured
 * yet, so `ChanceSelector` can render an empty-state instead of crashing.
 */
export async function getOpenEditionTiers(client: PublicTiersClient): Promise<OpenEditionTier[]> {
  const { data: editionRows, error: editionError } = await client
    .from("raffle_edition")
    .select("id")
    .eq("status", "open")
    .limit(1);

  if (editionError || !editionRows || editionRows.length === 0) {
    return [];
  }

  const editionId = (editionRows[0] as { id: string }).id;

  const { data, error } = await client
    .from("tier")
    .select("id, numbers_granted, price_ars")
    .eq("edition_id", editionId)
    .order("numbers_granted", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as OpenEditionTierRow[]).map((row) => ({
    id: row.id,
    numbersGranted: row.numbers_granted,
    priceArs: Number(row.price_ars),
  }));
}
