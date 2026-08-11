import type { BuyerInfoErrors } from "./validation";

/**
 * `useActionState` result shape for `createOrder` (design.md
 * `(shop)/checkout/[tier]/ # tier detail + start checkout (server action)`).
 * Success is NOT a state variant: on success the action calls Next.js
 * `redirect()`, which throws internally and never returns — the caller only
 * ever observes `idle` (initial) or `error` (validation/business failure).
 */
export type CheckoutFormState =
  | { status: "idle" }
  | { status: "error"; formError?: string; fieldErrors?: BuyerInfoErrors };

export type CreateOrderAction = (
  prevState: CheckoutFormState,
  formData: FormData,
) => Promise<CheckoutFormState>;
