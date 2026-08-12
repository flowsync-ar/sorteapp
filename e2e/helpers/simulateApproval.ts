import { execFileSync } from "node:child_process";

// Local Supabase's fixed `db` port (`supabase status` -> DB_URL), same
// connection string PR6/PR7's batches used for their own ad hoc `psql`
// workarounds (raffle_edition seeding for Playwright — see apply-progress
// for `sdd/raffle-platform`). Overridable via env for CI environments that
// run Supabase on a different port.
const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * Test-only helper (tasks.md PR8.5): fast-forwards an order straight to
 * `approved` with a real assigned number, bypassing the Mercado Pago
 * webhook (PR6) and comprobante-review (PR7) flows entirely — those are
 * already covered by their own dedicated tests. This spec's job is proving
 * the member-area claim/login/gate flow (spec.md §7), not re-testing "how
 * an order becomes approved".
 *
 * Deliberately raw SQL via `psql` (not the app's own `assign_numbers` RPC
 * caller) so this stays a pure test fixture with zero production code
 * dependency — mirrors the project's own documented `psql` ad hoc workaround
 * for seeding `raffle_edition` before Playwright runs.
 */
export function simulateOrderApproval(orderId: string): void {
  const sql = `
    update "order" set status = 'approved', decided_at = now() where id = '${orderId}';
    insert into raffle_number (edition_id, order_id, user_id, number)
    select o.edition_id, o.id, o.user_id, (floor(random() * 999999))::int
    from "order" o
    where o.id = '${orderId}'
    on conflict do nothing;
  `;

  execFileSync("psql", [DB_URL, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    stdio: "pipe",
  });
}
