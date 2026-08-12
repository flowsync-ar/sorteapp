"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateLoginInput } from "@/lib/member/validation";
import type { LoginFormState } from "@/lib/member/types";

type RedirectFn = (path: string) => never;

interface LoginActionOverrides {
  getClient?: () => ReturnType<typeof createClient>;
  doRedirect?: RedirectFn;
}

/**
 * `/login` server action (tasks.md PR8.2, spec.md §7): lets a buyer who
 * already claimed their account (see `lib/member/claim.ts`) start a fresh
 * session on another device/browser. Same `RedirectFn`/overrides seam as
 * `createOrder` so it's unit-testable without a live Supabase instance.
 */
export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
  overrides: LoginActionOverrides = {},
): Promise<LoginFormState> {
  const getClient = overrides.getClient ?? createClient;
  const doRedirect: RedirectFn = overrides.doRedirect ?? redirect;

  const validation = validateLoginInput({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!validation.success) {
    return { status: "error", fieldErrors: validation.errors };
  }

  const supabase = await getClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return {
      status: "error",
      formError: "Email o contraseña incorrectos.",
    };
  }

  // tasks.md PR9.1: reuses this same `/login` for both buyers and admins
  // instead of a separate admin login route — the only difference is where
  // it lands, decided by `app_metadata.role` (the exact claim `is_admin()`
  // checks in RLS and `lib/admin/guard.ts` checks for every `(admin)` page).
  const isAdmin = data.user?.app_metadata?.role === "admin";
  doRedirect(isAdmin ? "/admin" : "/mi-cuenta");
}
