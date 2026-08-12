"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { claimAccount } from "@/lib/member/claim";
import type { ClaimAccountFormState } from "@/lib/member/types";

type RedirectFn = (path: string) => never;

interface ClaimAccountActionOverrides {
  claim?: typeof claimAccount;
  doRevalidate?: (path: string) => void;
}

/**
 * `/mi-cuenta` claim-account server action (tasks.md PR8.1). Thin wrapper
 * around `lib/member/claim.ts`'s `claimAccount()` — same
 * revalidate-instead-of-redirect pattern `uploadReceiptAction` uses (the
 * buyer is already on `/mi-cuenta`; a successful claim just needs the RSC
 * page to re-fetch `auth.getUser()` and see the account is no longer
 * anonymous).
 */
export async function claimAccountAction(
  _prevState: ClaimAccountFormState,
  formData: FormData,
  overrides: ClaimAccountActionOverrides = {},
): Promise<ClaimAccountFormState> {
  const claim = overrides.claim ?? claimAccount;
  const doRevalidate = overrides.doRevalidate ?? revalidatePath;

  const result = await claim({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!result.success) {
    return {
      status: "error",
      formError: result.formError,
      fieldErrors: result.fieldErrors,
    };
  }

  doRevalidate("/mi-cuenta");
  return { status: "success" };
}

interface SignOutActionOverrides {
  getClient?: () => ReturnType<typeof createClient>;
  doRedirect?: RedirectFn;
}

/**
 * Signs out of the current session and sends the caller back to `/login`
 * (used by `components/member/SignOutButton.tsx`).
 */
export async function signOutAction(
  overrides: SignOutActionOverrides = {},
): Promise<void> {
  const getClient = overrides.getClient ?? createClient;
  const doRedirect: RedirectFn = overrides.doRedirect ?? redirect;

  const supabase = await getClient();
  await supabase.auth.signOut();

  doRedirect("/login");
}
