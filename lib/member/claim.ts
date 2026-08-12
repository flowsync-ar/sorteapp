import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { validateClaimAccountInput, type ClaimAccountInput } from "./validation";
import type { ClaimAccountErrors } from "./validation";

export type ClaimAccountResult =
  | { success: true }
  | { success: false; formError?: string; fieldErrors?: ClaimAccountErrors };

interface ClaimAccountOverrides {
  getClient?: () => Promise<Pick<SupabaseClient, "auth">> | Pick<SupabaseClient, "auth">;
}

/**
 * Upgrades the caller's current (anonymous) Supabase Auth session into a
 * real email+password account (tasks.md PR8.1, spec.md §7 "Member Area").
 *
 * This is exactly the path `supabase/config.toml`'s `enable_anonymous_sign_ins`
 * comment anticipated when PR5 introduced guest checkout:
 * `supabase.auth.updateUser({ email, password })` on the SAME session-scoped
 * client that already holds the anonymous session — Supabase links the
 * identity in place (same `auth.uid()`, so every existing `order`/
 * `raffle_number` row the buyer already owns stays owned by the exact same
 * user, no data migration needed). `auth.email.enable_confirmations = false`
 * locally, so this takes effect immediately without an email-confirmation
 * round trip; a hosted project with confirmations enabled would require the
 * buyer to click a confirmation link before the new email fully replaces
 * the session, but the call itself is identical either way.
 *
 * Deliberately does NOT require `getUser().user.is_anonymous` to be true —
 * calling this while already a real account just changes email/password,
 * which is harmless and keeps the function usable from a single form
 * without an extra branch to test.
 */
export async function claimAccount(
  input: ClaimAccountInput,
  overrides: ClaimAccountOverrides = {},
): Promise<ClaimAccountResult> {
  const validation = validateClaimAccountInput(input);
  if (!validation.success) {
    return { success: false, fieldErrors: validation.errors };
  }

  const getClient = overrides.getClient ?? createClient;
  const supabase = await getClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return {
      success: false,
      formError: "Tu sesión expiró. Volvé a entrar desde el estado de tu orden.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    if (/already|registrad/i.test(error.message)) {
      return {
        success: false,
        formError: "Ese email ya está registrado. Iniciá sesión en su lugar.",
      };
    }
    return {
      success: false,
      formError: "No pudimos guardar tus datos. Probá de nuevo en unos segundos.",
    };
  }

  return { success: true };
}
