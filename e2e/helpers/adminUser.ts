import { execFileSync } from "node:child_process";

// Same local Supabase `db` connection string PR6/PR7/PR8's own ad hoc `psql`
// helpers use (see `simulateApproval.ts`).
const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * Test-only helper (tasks.md PR9.6): creates a REAL GoTrue-authenticatable
 * admin user directly via SQL, using `pgcrypto`'s `crypt()`/`gen_salt('bf')`
 * to write a genuine bcrypt hash into `encrypted_password` — unlike
 * `test_helpers.create_user()` (PR2), which only forges request.jwt.claims
 * for pgTAP's in-Postgres impersonation, this user can actually complete a
 * real `POST /login` -> `supabase.auth.signInWithPassword()` round trip
 * through GoTrue, because `app/login/actions.ts`'s admin redirect and
 * `lib/admin/guard.ts` both depend on the REAL issued JWT's
 * `app_metadata.role` claim, not a forged one.
 */
function createUserWithPassword(email: string, password: string, appRole: string | null): void {
  const appMetadata = appRole ? `'{"role":"${appRole}"}'::jsonb` : "'{}'::jsonb";
  const sql = `
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '${email}', crypt('${password}', gen_salt('bf')),
      now(), ${appMetadata}, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
  `;

  execFileSync("psql", [DB_URL, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    stdio: "pipe",
  });
}

export function createAdminUser(email: string, password: string): void {
  createUserWithPassword(email, password, "admin");
}

/** Same real-login-capable user, but WITHOUT the admin role (tasks.md PR9.6's guard test). */
export function createNonAdminUser(email: string, password: string): void {
  createUserWithPassword(email, password, null);
}
