import type { CreateEditionErrors } from "./editions";

/**
 * `useActionState` result shapes for the admin panel's forms — same
 * `{status}` discriminated-union pattern as `lib/checkout/types.ts` /
 * `lib/member/types.ts`.
 */
export type CreateEditionFormState =
  | { status: "idle" }
  // `warning` covers the non-fatal "edition created but the prize image
  // upload failed" case (design.md §4: "Upload failure = non-fatal... admin
  // can retry via edit") -- the edition itself is never rolled back for it.
  | { status: "success"; warning?: string }
  | { status: "error"; formError?: string; fieldErrors?: CreateEditionErrors };

export type CreateEditionAction = (
  prevState: CreateEditionFormState,
  formData: FormData,
) => Promise<CreateEditionFormState>;

export type SetPrizeImageFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; formError: string };

export type SetPrizeImageAction = (
  prevState: SetPrizeImageFormState,
  formData: FormData,
) => Promise<SetPrizeImageFormState>;

export type CloseEditionFormState =
  | { status: "idle" }
  | { status: "error"; formError: string };

export type CloseEditionAction = (
  prevState: CloseEditionFormState,
  formData: FormData,
) => Promise<CloseEditionFormState>;

/**
 * "Activar" a draft edition (admin-panel-v2 work unit 3, prize catalog) —
 * same idle/error-only shape as `CloseEditionFormState` (no explicit success
 * state needed: `revalidatePath` + the row disappearing from the draft list
 * is the success signal).
 */
export type PublishEditionFormState =
  | { status: "idle" }
  | { status: "error"; formError: string };

export type PublishEditionAction = (
  prevState: PublishEditionFormState,
  formData: FormData,
) => Promise<PublishEditionFormState>;

export type PublishWinnerFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; formError: string };

export type PublishWinnerAction = (
  prevState: PublishWinnerFormState,
  formData: FormData,
) => Promise<PublishWinnerFormState>;
