import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";

/**
 * Supabase client authenticated with the `service_role` key. Bypasses RLS —
 * SERVER-ONLY, and only for privileged operations (webhooks, admin actions).
 * The `server-only` import makes any accidental client-bundle usage a build
 * error instead of a leaked secret.
 */
export function createAdminClient() {
  return createSupabaseClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", process.env),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY", process.env),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
