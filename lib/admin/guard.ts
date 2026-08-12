import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type RedirectFn = (path: string) => never;

export interface RequireAdminOverrides {
  getClient?: () => ReturnType<typeof createClient>;
  doRedirect?: RedirectFn;
}

/**
 * Admin-only route guard (tasks.md PR9.1, spec.md §9 "Protección del panel
 * admin"). Reuses `app_metadata.role === "admin"` — the exact claim
 * `is_admin()` checks in RLS (`supabase/migrations/*_rls.sql`) and the same
 * one `app/api/admin/receipts/[receiptId]/review/route.ts` (PR7) checks —
 * one definition of "admin" for the whole app.
 *
 * Same `getClient`/`doRedirect` override seam as `signOutAction`/
 * `loginAction` so this is unit-testable without a live Supabase instance,
 * and the same "every page re-checks, the layout alone is not a reliable
 * gate" lesson `app/(member)/layout.tsx` documents (Next.js renders a
 * layout's body concurrently with its page children) — `(admin)/admin/
 * layout.tsx` calls this for defense-in-depth, and every `(admin)/admin/*`
 * page calls it again itself.
 */
export async function requireAdminUser(
  overrides: RequireAdminOverrides = {},
): Promise<User> {
  const getClient = overrides.getClient ?? createClient;
  const doRedirect: RedirectFn = overrides.doRedirect ?? redirect;

  const supabase = await getClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    doRedirect("/login");
  }
  if (data.user!.app_metadata?.role !== "admin") {
    doRedirect("/");
  }

  return data.user as User;
}
