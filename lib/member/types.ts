import type { ClaimAccountErrors, LoginErrors } from "./validation";

/**
 * `useActionState` result shapes for the member-area forms — same
 * `{status}` discriminated-union pattern as `lib/checkout/types.ts`.
 */
export type ClaimAccountFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; formError?: string; fieldErrors?: ClaimAccountErrors };

export type ClaimAccountAction = (
  prevState: ClaimAccountFormState,
  formData: FormData,
) => Promise<ClaimAccountFormState>;

export type LoginFormState =
  | { status: "idle" }
  | { status: "error"; formError?: string; fieldErrors?: LoginErrors };

export type LoginAction = (
  prevState: LoginFormState,
  formData: FormData,
) => Promise<LoginFormState>;
