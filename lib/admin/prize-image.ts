import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { validatePrizeImageFile } from "@/lib/marketing/prize-image-validation";

export const PRIZE_IMAGES_BUCKET = "prize-images";

/**
 * Thrown for every admin-facing failure uploading a prize photo — invalid
 * file, Storage failure, or a row-update failure. Every failure normalizes
 * into one type so the Server Action needs only one catch clause (mirrors
 * `ReceiptUploadError`).
 */
export class PrizeImageUploadError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PrizeImageUploadError";
  }
}

export interface UploadPrizeImageInput {
  editionId: string;
  file: File;
}

type PrizeImageClient = Pick<SupabaseClient, "storage" | "from">;

/**
 * Uploads/replaces the prize photo for `editionId` (design.md §2 "Upload
 * mechanism", ADR-2/ADR-3/ADR-4). Called from a Server Action with the
 * session-scoped client (RLS `prize_image_admin_write` policy authorizes),
 * never `service_role`.
 *
 * Path is deterministic and EXTENSIONLESS (`{editionId}`, ADR-3): re-upload
 * of ANY mime type overwrites the SAME Storage object via `upsert: true`, so
 * switching jpg -> png never leaves an orphan file behind.
 *
 * The bucket is public and CDN-cached (ADR-1/ADR-4), so the freshly written
 * public URL gets a `?v={timestamp}` cache-bust query param appended before
 * being persisted on `raffle_edition.prize_image` — otherwise the landing
 * could keep serving the previous CDN-cached bytes after a re-upload.
 */
export async function uploadPrizeImage(
  { editionId, file }: UploadPrizeImageInput,
  client: PrizeImageClient,
): Promise<{ imageUrl: string }> {
  const validation = validatePrizeImageFile({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  if (!validation.success) {
    throw new PrizeImageUploadError(validation.error);
  }

  const { error: uploadError } = await client.storage
    .from(PRIZE_IMAGES_BUCKET)
    .upload(editionId, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    throw new PrizeImageUploadError(
      "No pudimos subir la imagen del premio. Probá de nuevo en unos minutos.",
      uploadError,
    );
  }

  const {
    data: { publicUrl },
  } = client.storage.from(PRIZE_IMAGES_BUCKET).getPublicUrl(editionId);
  const imageUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await client
    .from("raffle_edition")
    .update({ prize_image: imageUrl })
    .eq("id", editionId);

  if (updateError) {
    throw new PrizeImageUploadError(
      "Subimos la imagen pero no pudimos guardarla en la edición. Contactanos.",
      updateError,
    );
  }

  return { imageUrl };
}
