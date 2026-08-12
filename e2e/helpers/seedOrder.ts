import { execFileSync } from "node:child_process";

// Same local Supabase `db` connection string every other ad hoc `psql`
// helper in this directory uses (see `simulateApproval.ts`, `adminUser.ts`).
const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export interface SeedOrderInput {
  editionId: string;
  method: "mp" | "transfer";
  status: "pending" | "approved" | "rejected" | "expired";
  amountArs: number;
  tierKey?: string;
}

/**
 * Test-only helper (admin-panel-v2 work unit 2, revenue dashboard e2e):
 * inserts one complete `order` row directly via SQL, owned by a throwaway
 * `auth.users` row created in the same statement — same
 * zero-production-code-dependency rationale `simulateOrderApproval`/
 * `ensureOpenEdition`/`createAdminUser` already document. Lets the revenue
 * e2e assert exact totals across every method/status combination without
 * driving 4 separate real checkout (one of them a real Mercado Pago
 * redirect) flows through the UI.
 */
export function seedOrder({
  editionId,
  method,
  status,
  amountArs,
  tierKey = "plus",
}: SeedOrderInput): void {
  const email = `seed.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;
  const decidedAt = status === "pending" ? "null" : "now()";

  const sql = `
    with new_user as (
      insert into auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change
      ) values (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        '${email}', crypt('seedpassword123', gen_salt('bf')),
        now(), '{}'::jsonb, '{}'::jsonb,
        now(), now(), '', '', '', ''
      )
      returning id
    )
    insert into "order" (
      user_id, edition_id, tier_key, method, status, amount_ars,
      buyer_name, buyer_email, buyer_dni, buyer_phone, created_at, decided_at
    )
    select
      new_user.id, '${editionId}', '${tierKey}', '${method}', '${status}', ${amountArs},
      'Seed Buyer', '${email}', '00000000', '+5491100000000', now(), ${decidedAt}
    from new_user;
  `;

  execFileSync("psql", [DB_URL, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    stdio: "pipe",
  });
}
