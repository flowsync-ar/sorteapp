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

/**
 * Test-only helper (admin-panel-v2 work unit 2, revenue dashboard e2e):
 * creates a brand-new, already-`closed` edition (never `open`, so it can
 * never collide with `raffle_edition_single_open` or with a concurrently
 * running test's own open edition) with a random-ish `year` so it is
 * guaranteed to be exclusively "owned" by the caller — no other test in this
 * `fullyParallel` suite can be seeding orders against the SAME edition_id at
 * the same time, unlike the shared `open` edition every other admin test
 * reads/writes. Returns the new edition's id AND year (month is always `1`)
 * so a test can both seed orders (`seedOrder.ts`) and locate the resulting
 * row on `/admin/recaudacion` unambiguously.
 */
export function createIsolatedClosedEdition(prizeTitle = "Premio Recaudación E2E"): {
  id: string;
  month: number;
  year: number;
} {
  const month = 1;
  const year = 2024 + Math.floor(Math.random() * 900);
  const output = execFileSync(
    "psql",
    [
      DB_URL,
      "-v",
      "ON_ERROR_STOP=1",
      "-t",
      "-A",
      "-c",
      `insert into raffle_edition (month, year, status, number_cap, prize_title) values (${month}, ${year}, 'closed', 500, '${prizeTitle}') returning id;`,
    ],
    { stdio: "pipe" },
  );

  // `psql -t -A` suppresses column headers/alignment but NOT the trailing
  // `INSERT 0 1` command-completion tag that follows a `RETURNING` result —
  // only the first line is the actual id.
  const id = output.toString().trim().split("\n")[0]!.trim();

  return { id, month, year };
}
