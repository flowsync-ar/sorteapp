"use client";

import Image from "next/image";
import { useRef } from "react";

interface PrizeImageThumbnailProps {
  imageUrl: string | null;
  alt: string;
}

/**
 * Compact read-only preview for `EditionsTable`'s first column. Click opens
 * the full-size photo in a native `<dialog>` (no extra deps, same "keep it
 * simple" convention as the rest of the admin panel). Separate from
 * `PrizeImageForm`/`PrizeImageInput`, which stay further down the row as the
 * upload/replace control — this component is purely "look at the photo".
 */
export function PrizeImageThumbnail({ imageUrl, alt }: PrizeImageThumbnailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!imageUrl) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-white/15 bg-surface/40 text-center text-[10px] text-muted-foreground">
        Sin foto
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="block h-16 w-16 overflow-hidden rounded-lg border border-white/15 transition hover:opacity-80"
        aria-label={`Ver en tamaño completo: ${alt}`}
      >
        <div className="relative h-full w-full">
          <Image src={imageUrl} alt={alt} fill sizes="64px" className="object-cover" />
        </div>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={alt}
        className="max-w-2xl rounded-2xl border border-white/15 bg-ink p-4 backdrop:bg-black/70"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="relative aspect-square w-[min(80vw,32rem)]">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes="512px"
            className="rounded-lg object-contain"
          />
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-foreground transition hover:bg-white/5"
        >
          Cerrar
        </button>
      </dialog>
    </>
  );
}
