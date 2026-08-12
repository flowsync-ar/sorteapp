/**
 * `useActionState` result shape for `uploadReceiptAction` (mirrors
 * `lib/checkout/types.ts`'s `CheckoutFormState`). Unlike `createOrder`,
 * success does NOT redirect away — the buyer stays on
 * `/checkout/orden/[orderId]/comprobante` and the action revalidates that
 * route so the RSC page re-renders with the new "pending review" status.
 */
export type ComprobanteFormState =
  | { status: "idle" }
  | { status: "error"; formError: string }
  | { status: "success" };

export type UploadReceiptAction = (
  prevState: ComprobanteFormState,
  formData: FormData,
) => Promise<ComprobanteFormState>;
