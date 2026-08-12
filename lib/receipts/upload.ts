import "server-only";
import { createClient } from "@/lib/supabase/server";
import { validateReceiptFile } from "@/lib/receipts/validation";

export const RECEIPTS_BUCKET = "receipts";

/**
 * Thrown for every buyer-facing failure uploading a comprobante — invalid
 * file, wrong/decided order, or a receipt that's already been verified.
 * Every failure normalizes into one type so the Server Action needs only
 * one catch clause (mirrors `MercadoPagoPreferenceError`).
 */
export class ReceiptUploadError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ReceiptUploadError";
  }
}

export interface UploadReceiptInput {
  orderId: string;
  file: File;
}

interface UploadReceiptOverrides {
  getClient?: () => ReturnType<typeof createClient>;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Uploads a comprobante for a `transfer` order (tasks.md PR7, design.md §5
 * "Comprobante flow"). Uses the session-scoped Supabase client (not
 * `service_role`) so both the Storage write and the `receipt` row insert go
 * through the same RLS ownership checks a direct client call would —
 * `orderId` here is a courtesy for the file path, not the source of trust.
 *
 * Business rules (spec.md §5, defense-in-depth beyond RLS which only
 * enforces row ownership, not the state machine):
 * - the order must exist, use `method: "transfer"`, and still be `pending`
 * - a re-upload is allowed to REPLACE a `rejected` receipt (buyer fixing a
 *   mistake) but is blocked while a receipt is still `pending` (avoid
 *   racing an in-flight admin review) or already `verified` (immutable —
 *   numbers were already assigned).
 */
export async function uploadReceiptForOrder(
  { orderId, file }: UploadReceiptInput,
  overrides: UploadReceiptOverrides = {},
): Promise<{ receiptId: string }> {
  const validation = validateReceiptFile({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  if (!validation.success) {
    throw new ReceiptUploadError(validation.error);
  }

  const getClient = overrides.getClient ?? createClient;
  const supabase = await getClient();

  const { data: order, error: orderError } = await supabase
    .from("order")
    .select("id, method, status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new ReceiptUploadError("No encontramos tu orden.", orderError);
  }
  if (order.method !== "transfer") {
    throw new ReceiptUploadError(
      "Esta orden no admite comprobante manual (elegiste Mercado Pago).",
    );
  }
  if (order.status !== "pending") {
    throw new ReceiptUploadError(
      "Esta orden ya fue decidida, no se puede subir un comprobante nuevo.",
    );
  }

  const { data: existingReceipt } = await supabase
    .from("receipt")
    .select("id, status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existingReceipt?.status === "verified") {
    throw new ReceiptUploadError("Tu comprobante ya fue verificado.");
  }
  if (existingReceipt?.status === "pending") {
    throw new ReceiptUploadError("Ya tenés un comprobante en revisión.");
  }

  const storagePath = `${orderId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    throw new ReceiptUploadError(
      "No pudimos subir tu comprobante. Probá de nuevo en unos minutos.",
      uploadError,
    );
  }

  const { data: receipt, error: receiptError } = await supabase
    .from("receipt")
    .upsert(
      {
        order_id: orderId,
        storage_path: storagePath,
        status: "pending",
        uploaded_at: new Date().toISOString(),
        reviewed_at: null,
        reject_reason: null,
      },
      { onConflict: "order_id" },
    )
    .select("id")
    .single();

  if (receiptError || !receipt) {
    throw new ReceiptUploadError(
      "Subimos tu archivo pero no pudimos registrar el comprobante. Contactanos.",
      receiptError,
    );
  }

  return { receiptId: receipt.id };
}
