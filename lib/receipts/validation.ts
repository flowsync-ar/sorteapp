/**
 * Comprobante-file validation (spec.md §5 "Comprobante Manual": "El sistema
 * MUST aceptar imagen/PDF"). Pure, framework-agnostic function (mirrors
 * `lib/checkout/validation.ts`'s `validateBuyerInfo` pattern) so the exact
 * same rules run client-side (`components/checkout/ComprobanteUploader.tsx`,
 * fast inline feedback) and server-side (`lib/receipts/upload.ts`, defense
 * in depth — never trust a client-only check before writing to Storage).
 */

export interface ReceiptFileInput {
  name: string;
  type: string;
  size: number;
}

export type ReceiptFileValidation =
  | { success: true }
  | { success: false; error: string };

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// Comfortably under the local Storage default (`file_size_limit = "50MiB"`
// in supabase/config.toml) — a comprobante is a single photo/PDF, not a
// large document, so 10MB keeps upload latency reasonable on mobile data.
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function validateReceiptFile(
  file: ReceiptFileInput | null | undefined,
): ReceiptFileValidation {
  if (!file || !file.size) {
    return {
      success: false,
      error: "Subí un archivo (imagen o PDF) del comprobante.",
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Formato no permitido. Subí una imagen (JPG, PNG, WEBP) o un PDF.",
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: "El archivo supera el tamaño máximo permitido (10 MB).",
    };
  }

  return { success: true };
}
