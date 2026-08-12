"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { validatePrizeImageFile } from "@/lib/marketing/prize-image-validation";

interface PrizeImageInputProps {
  name?: string;
  label?: string;
  /** Existing `prize_image` URL, shown before the admin picks a new file (edit flow). */
  initialPreviewUrl?: string | null;
}

/**
 * File input + inline preview for the prize photo (tasks.md prize-image
 * Phase 4, design.md §6 `PrizeImageInput`). Used both by `CreateEditionForm`
 * (`name="prizeImage"`, no `initialPreviewUrl`) and by `EditionsTable`'s
 * per-row re-upload control (existing `prize_image` as the initial preview).
 * Client-side validation runs the exact same `validatePrizeImageFile` the
 * server re-checks in `lib/admin/prize-image.ts` (defense in depth).
 */
export function PrizeImageInput({
  name = "prizeImage",
  label = "Foto del premio",
  initialPreviewUrl = null,
}: PrizeImageInputProps) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    const validation = validatePrizeImageFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.success) {
      setError(validation.error);
      event.target.value = "";
      return;
    }

    setError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  }

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-champagne file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
      />
      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-400">
          {error}
        </p>
      ) : null}
      {previewUrl ? (
        <div className="relative mt-2 h-24 w-24 overflow-hidden rounded-lg border border-surface">
          <Image
            src={previewUrl}
            alt="Vista previa del premio"
            fill
            unoptimized
            sizes="96px"
            className="object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
