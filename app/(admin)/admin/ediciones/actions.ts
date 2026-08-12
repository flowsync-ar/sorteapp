"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/guard";
import {
  closeEdition,
  createEdition,
  validateCreateEditionInput,
  type CloseEditionResult,
  type CreateEditionResult,
} from "@/lib/admin/editions";
import { publishWinner, type PublishWinnerResult } from "@/lib/admin/winners";
import { uploadPrizeImage } from "@/lib/admin/prize-image";
import type {
  CloseEditionFormState,
  CreateEditionFormState,
  PublishWinnerFormState,
  SetPrizeImageFormState,
} from "@/lib/admin/types";

/**
 * Server Actions for `/admin/ediciones` (tasks.md PR9.4/9.5). Every action
 * re-checks `requireAdminUser()` itself (design.md `server-auth-actions`:
 * "Checkout preference creation and webhook handling are route handlers/
 * server actions authenticated like APIs") — Server Actions are directly
 * callable HTTP endpoints, so the page's own RSC-level guard is not enough,
 * same reasoning as every `(admin)`/`(member)` page re-checking its own
 * layout's guard.
 */

interface CreateEditionActionOverrides {
  requireAdmin?: typeof requireAdminUser;
  create?: (
    input: Parameters<typeof createEdition>[0],
    client: never,
  ) => Promise<CreateEditionResult>;
  uploadImage?: (
    input: Parameters<typeof uploadPrizeImage>[0],
    client: never,
  ) => ReturnType<typeof uploadPrizeImage>;
  getClient?: () => ReturnType<typeof createClient>;
  doRevalidate?: (path: string) => void;
}

/**
 * `formData.get("prizeImage")` is a `File` even for an empty `<input
 * type="file">` (0-byte, empty name) -- treat that the same as "no file
 * chosen" so create-without-a-photo never attempts an upload.
 */
function extractOptionalFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function createEditionAction(
  _prevState: CreateEditionFormState,
  formData: FormData,
  overrides: CreateEditionActionOverrides = {},
): Promise<CreateEditionFormState> {
  const requireAdmin = overrides.requireAdmin ?? requireAdminUser;
  const create = overrides.create ?? createEdition;
  const uploadImage = overrides.uploadImage ?? uploadPrizeImage;
  const getClient = overrides.getClient ?? createClient;
  const doRevalidate = overrides.doRevalidate ?? revalidatePath;

  await requireAdmin();

  const validation = validateCreateEditionInput({
    month: String(formData.get("month") ?? ""),
    year: String(formData.get("year") ?? ""),
    numberCap: String(formData.get("numberCap") ?? ""),
    prizeTitle: String(formData.get("prizeTitle") ?? ""),
    drawDate: String(formData.get("drawDate") ?? ""),
  });

  if (!validation.success) {
    return { status: "error", fieldErrors: validation.errors };
  }

  const supabase = await getClient();
  const result = await create(validation.data, supabase as never);

  if (!result.success) {
    return { status: "error", formError: result.error };
  }

  // The edition needs an id before the image can be uploaded (deterministic
  // `{editionId}` Storage path, design.md ADR-3), so this can only happen
  // after `create` succeeds -- and a failure here must NOT roll back the
  // edition (design.md §4: non-fatal, admin can retry via edit).
  let warning: string | undefined;
  const file = extractOptionalFile(formData, "prizeImage");
  if (file) {
    try {
      await uploadImage({ editionId: result.editionId, file }, supabase as never);
    } catch (error) {
      warning = error instanceof Error ? error.message : "No pudimos subir la imagen del premio.";
    }
  }

  doRevalidate("/");
  doRevalidate("/admin/ediciones");
  return warning ? { status: "success", warning } : { status: "success" };
}

interface CloseEditionActionOverrides {
  requireAdmin?: typeof requireAdminUser;
  close?: (editionId: string, client: never) => Promise<CloseEditionResult>;
  getClient?: () => ReturnType<typeof createClient>;
  doRevalidate?: (path: string) => void;
}

export async function closeEditionAction(
  editionId: string,
  _prevState: CloseEditionFormState,
  _formData: FormData,
  overrides: CloseEditionActionOverrides = {},
): Promise<CloseEditionFormState> {
  const requireAdmin = overrides.requireAdmin ?? requireAdminUser;
  const close = overrides.close ?? closeEdition;
  const getClient = overrides.getClient ?? createClient;
  const doRevalidate = overrides.doRevalidate ?? revalidatePath;

  await requireAdmin();

  const supabase = await getClient();
  await close(editionId, supabase as never);

  doRevalidate("/admin/ediciones");
  return { status: "idle" };
}

interface PublishWinnerActionOverrides {
  requireAdmin?: typeof requireAdminUser;
  publish?: (
    editionId: string,
    winnerNumber: number,
    client: never,
  ) => Promise<PublishWinnerResult>;
  getClient?: () => ReturnType<typeof createClient>;
  doRevalidate?: (path: string) => void;
}

export async function publishWinnerAction(
  editionId: string,
  _prevState: PublishWinnerFormState,
  formData: FormData,
  overrides: PublishWinnerActionOverrides = {},
): Promise<PublishWinnerFormState> {
  const requireAdmin = overrides.requireAdmin ?? requireAdminUser;
  const publish = overrides.publish ?? publishWinner;
  const getClient = overrides.getClient ?? createClient;
  const doRevalidate = overrides.doRevalidate ?? revalidatePath;

  await requireAdmin();

  const raw = String(formData.get("winnerNumber") ?? "").trim();
  const winnerNumber = Number(raw);
  if (!/^\d{1,6}$/.test(raw) || !Number.isInteger(winnerNumber) || winnerNumber < 0 || winnerNumber > 999999) {
    return { status: "error", formError: "Ingresá un número de 6 cifras válido (000000-999999)." };
  }

  const supabase = await getClient();

  try {
    await publish(editionId, winnerNumber, supabase as never);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos publicar el ganador.";
    return { status: "error", formError: message };
  }

  doRevalidate("/admin/ediciones");
  return { status: "success" };
}

interface SetPrizeImageActionOverrides {
  requireAdmin?: typeof requireAdminUser;
  uploadImage?: (
    input: Parameters<typeof uploadPrizeImage>[0],
    client: never,
  ) => ReturnType<typeof uploadPrizeImage>;
  getClient?: () => ReturnType<typeof createClient>;
  doRevalidate?: (path: string) => void;
}

/**
 * "Re-subir imagen del premio" for an EXISTING edition (`EditionsTable` row
 * edit control, design.md §4/§6) -- the create-time counterpart lives inline
 * in `createEditionAction` above; this is the standalone re-upload path,
 * bound to a single edition id the same way `closeEditionAction`/
 * `publishWinnerAction` are (`.bind(null, editionId)`).
 */
export async function setPrizeImageAction(
  editionId: string,
  _prevState: SetPrizeImageFormState,
  formData: FormData,
  overrides: SetPrizeImageActionOverrides = {},
): Promise<SetPrizeImageFormState> {
  const requireAdmin = overrides.requireAdmin ?? requireAdminUser;
  const uploadImage = overrides.uploadImage ?? uploadPrizeImage;
  const getClient = overrides.getClient ?? createClient;
  const doRevalidate = overrides.doRevalidate ?? revalidatePath;

  await requireAdmin();

  const file = extractOptionalFile(formData, "prizeImage");
  if (!file) {
    return { status: "error", formError: "Elegí una imagen para subir." };
  }

  const supabase = await getClient();

  try {
    await uploadImage({ editionId, file }, supabase as never);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pudimos subir la imagen del premio.";
    return { status: "error", formError: message };
  }

  doRevalidate("/");
  doRevalidate("/admin/ediciones");
  return { status: "success" };
}
