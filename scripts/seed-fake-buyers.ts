/**
 * Seeds fake, clearly-labeled buyers (real `auth.users` + `order` +
 * `assign_numbers` RPC — the exact same path a real approved purchase
 * takes, not a raw table insert) against the currently `open` edition, so
 * the draw ("¿quién ganó?") flow can be exercised against realistic data.
 *
 * Run with your real project's credentials loaded from `.env.local`:
 *
 *   npx tsx scripts/seed-fake-buyers.ts [count]
 *
 * `count` defaults to 98. Every fake buyer is unmistakably fake:
 * `test-buyer-NNN@sorteapp.test` email, "Comprador Test NNN" name, DNI
 * `00000NNN`. Safe to re-run — buyer emails are unique per run via a
 * timestamp prefix, so it never collides with a previous seed batch.
 *
 * Deliberately NOT wired into the app itself (no route, no admin button):
 * this creates real `auth.users` rows via the admin API, which is
 * destructive-adjacent enough (and pointless outside active development)
 * that it should always be a conscious, explicit, one-off action.
 */
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const count = Number(process.argv[2] ?? "98");
if (!Number.isInteger(count) || count <= 0) {
  console.error("count must be a positive integer");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Distinguishes this run's buyers from a previous one, so re-running the
// script never collides on the unique auth.users email or order's unique
// mp_payment_id-adjacent constraints.
const RUN_TAG = Date.now();

async function main() {
  const { data: edition, error: editionError } = await supabase
    .from("raffle_edition")
    .select("id, prize_title, month, year")
    .eq("status", "open")
    .limit(1)
    .single();

  if (editionError || !edition) {
    console.error(
      "No hay ninguna edición 'open' ahora mismo -- abrí/activá una desde /admin/ediciones primero.",
      editionError?.message ?? "",
    );
    process.exit(1);
  }

  const { data: tiers, error: tiersError } = await supabase
    .from("tier")
    .select("id, numbers_granted, price_ars")
    .eq("edition_id", edition.id)
    .order("numbers_granted", { ascending: true })
    .limit(1);

  const tier = tiers?.[0];
  if (tiersError || !tier) {
    console.error(
      "Esa edición no tiene chances (tier) configuradas todavía -- creala desde el formulario de admin primero.",
      tiersError?.message ?? "",
    );
    process.exit(1);
  }

  console.log(
    `Edición ${edition.month}/${edition.year} — "${edition.prize_title ?? "(sin título)"}" (${edition.id})`,
  );
  console.log(
    `Tier: ${tier.numbers_granted} chance(s) x $${tier.price_ars} — creando ${count} compradores falsos...\n`,
  );

  let created = 0;
  let failed = 0;
  const assignedNumbers: number[] = [];

  for (let i = 1; i <= count; i++) {
    const label = String(i).padStart(3, "0");
    const email = `test-buyer-${RUN_TAG}-${label}@sorteapp.test`;
    const name = `Comprador Test ${label}`;
    const dni = `00000${label}`.slice(-8);

    try {
      const { data: userResult, error: userError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          app_metadata: { role: "buyer_test_seed" },
        });
      if (userError || !userResult.user) {
        throw userError ?? new Error("createUser returned no user");
      }

      const { data: order, error: orderError } = await supabase
        .from("order")
        .insert({
          user_id: userResult.user.id,
          edition_id: edition.id,
          tier_id: tier.id,
          method: "transfer",
          status: "approved",
          amount_ars: tier.price_ars,
          decided_at: new Date().toISOString(),
          buyer_name: name,
          buyer_email: email,
          buyer_dni: dni,
          buyer_phone: "0000000000",
        })
        .select("id")
        .single();
      if (orderError || !order) {
        throw orderError ?? new Error("order insert returned no row");
      }

      const { data: numbers, error: rpcError } = await supabase.rpc(
        "assign_numbers",
        { p_order_id: order.id, p_qty: tier.numbers_granted },
      );
      if (rpcError) {
        throw rpcError;
      }

      assignedNumbers.push(...((numbers ?? []) as number[]));
      created++;
      process.stdout.write(`\r${created}/${count} creados...`);
    } catch (error) {
      failed++;
      console.error(
        `\n  ✗ ${label} (${email}): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  console.log(`\n\nListo: ${created} compradores creados, ${failed} fallidos.`);
  console.log(`Números asignados: ${assignedNumbers.length}`);
  if (assignedNumbers.length > 0) {
    console.log(
      `Rango: ${Math.min(...assignedNumbers)} - ${Math.max(...assignedNumbers)}`,
    );
  }
}

main();
