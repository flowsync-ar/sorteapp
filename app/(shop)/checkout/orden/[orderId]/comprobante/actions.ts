"use server";

import { revalidatePath } from "next/cache";
import { ReceiptUploadError, uploadReceiptForOrder } from "@/lib/receipts/upload";
import type { ComprobanteFormState } from "@/lib/receipts/types";

interface UploadReceiptActionOverrides {
  upload?: typeof uploadReceiptForOrder;
  doRevalidate?: (path: string) => void;
}

/**
 * Server action bound to an orderId from `page.tsx`
 * (`uploadReceiptAction.bind(null, orderId)`), per design.md §5.
 *
 * Unlike `createOrder` (PR5) this does NOT `redirect()` on success — the
 * buyer is already on the destination page (`/checkout/orden/[orderId]/
 * comprobante`), so a successful upload just needs the RSC page to re-fetch
 * the now-`pending` receipt row. `revalidatePath` does that (Next.js Router
 * Cache invalidation), and `<ComprobanteUploader>` also renders its own
 * inline success state immediately, before the revalidated page returns.
 */
export async function uploadReceiptAction(
  orderId: string,
  _prevState: ComprobanteFormState,
  formData: FormData,
  overrides: UploadReceiptActionOverrides = {},
): Promise<ComprobanteFormState> {
  const upload = overrides.upload ?? uploadReceiptForOrder;
  const doRevalidate = overrides.doRevalidate ?? revalidatePath;

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      formError: "Subí un archivo (imagen o PDF) del comprobante.",
    };
  }

  try {
    await upload({ orderId, file });
  } catch (error) {
    if (error instanceof ReceiptUploadError) {
      return { status: "error", formError: error.message };
    }
    throw error;
  }

  doRevalidate(`/checkout/orden/${orderId}/comprobante`);
  return { status: "success" };
}
