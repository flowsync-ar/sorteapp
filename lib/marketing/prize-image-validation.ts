/**
 * Prize-photo file validation (spec.md "storage-rls" / "edition-management":
 * jpg/png/webp only, up to 5MB). Pure, framework-agnostic function (mirrors
 * `lib/receipts/validation.ts`'s `validateReceiptFile` shape) so the exact
 * same rules run client-side (`components/admin/PrizeImageInput.tsx`, fast
 * inline feedback) and server-side (`lib/admin/prize-image.ts`, defense in
 * depth — never trust a client-only check before writing to Storage).
 */

export interface PrizeImageFileInput {
  name: string;
  type: string;
  size: number;
}

export type PrizeImageFileValidation =
  | { success: true }
  | { success: false; error: string };

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// design.md §1 "Storage migration": bucket `file_size_limit = 5242880`.
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function validatePrizeImageFile(
  file: PrizeImageFileInput | null | undefined,
): PrizeImageFileValidation {
  if (!file || !file.size) {
    return {
      success: false,
      error: "Subí una imagen del premio (JPG, PNG o WEBP).",
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Formato no permitido. Subí una imagen JPG, PNG o WEBP.",
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: "La imagen supera el tamaño máximo permitido (5 MB).",
    };
  }

  return { success: true };
}
