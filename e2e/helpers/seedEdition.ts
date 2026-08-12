import { execFileSync } from "node:child_process";

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * Test-only helper: makes sure exactly one `open` edition exists before an
 * e2e run (`createOrder`, `app/(shop)/checkout/[tier]/actions.ts`, requires
 * one). This project has no automated seed for it (documented, ad hoc
 * `psql` workaround already relied on by every prior checkout/comprobante/
 * member-area e2e spec) — this helper makes that step explicit and
 * idempotent (`where not exists (...)`) so PR9's own admin spec doesn't
 * depend on a manual step having already been run.
 */
export function ensureOpenEdition(prizeTitle = "Premio E2E"): void {
  const sql = `
    insert into raffle_edition (month, year, status, number_cap, prize_title)
    select 1, 2099, 'open', 500, '${prizeTitle}'
    where not exists (select 1 from raffle_edition where status = 'open');
  `;

  execFileSync("psql", [DB_URL, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    stdio: "pipe",
  });
}
