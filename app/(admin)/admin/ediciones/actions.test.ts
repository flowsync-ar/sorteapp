import { describe, expect, it, vi } from "vitest";
import {
  closeEditionAction,
  createEditionAction,
  publishEditionAction,
  publishWinnerAction,
  setPrizeImageAction,
} from "./actions";

function adminUser() {
  return { id: "admin-1", app_metadata: { role: "admin" } } as never;
}

function makeImageFile(overrides: Partial<{ name: string; type: string; size: number }> = {}) {
  const bytes = new Uint8Array(overrides.size ?? 1024).fill(1);
  return new File([bytes], overrides.name ?? "premio.jpg", {
    type: overrides.type ?? "image/jpeg",
  });
}

const validFormData = (overrides: Record<string, string> = {}) => {
  const data: Record<string, string> = {
    month: "9",
    year: "2026",
    numberCap: "500",
    prizeTitle: "TV 55",
    drawDate: "2026-09-30T21:00",
    tiers: JSON.stringify([{ numbersGranted: 1, priceArs: 15000 }]),
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }
  return formData;
};

describe("createEditionAction", () => {
  it("returns field errors without calling createEdition when the form is invalid", async () => {
    const create = vi.fn();
    const result = await createEditionAction(
      { status: "idle" },
      validFormData({ prizeTitle: "" }),
      {
        requireAdmin: vi.fn().mockResolvedValue(adminUser()),
        create,
        getClient: async () => ({}) as never,
        doRevalidate: vi.fn(),
      },
    );

    expect(result.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the edition, revalidates, and returns success", async () => {
    const create = vi.fn().mockResolvedValue({ success: true, editionId: "edition-1" });
    const doRevalidate = vi.fn();

    const result = await createEditionAction({ status: "idle" }, validFormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      create,
      createTiers: vi.fn().mockResolvedValue(undefined),
      getClient: async () => ({}) as never,
      doRevalidate,
    });

    expect(result).toEqual({ status: "success" });
    expect(create).toHaveBeenCalled();
    expect(doRevalidate).toHaveBeenCalledWith("/admin/ediciones");
  });

  it("surfaces a warning instead of an error when create() fell back to draft", async () => {
    const create = vi
      .fn()
      .mockResolvedValue({ success: true, editionId: "edition-1", fellBackToDraft: true });
    const doRevalidate = vi.fn();

    const result = await createEditionAction({ status: "idle" }, validFormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      create,
      createTiers: vi.fn().mockResolvedValue(undefined),
      getClient: async () => ({}) as never,
      doRevalidate,
    });

    expect(result).toEqual({
      status: "success",
      warning: expect.stringMatching(/ya había una edición abierta/i),
    });
    expect(doRevalidate).toHaveBeenCalledWith("/admin/ediciones");
  });

  it("surfaces the domain error (e.g. already-open edition) without throwing", async () => {
    const create = vi
      .fn()
      .mockResolvedValue({ success: false, error: "Ya hay una edición abierta." });

    const result = await createEditionAction({ status: "idle" }, validFormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      create,
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(result).toEqual({ status: "error", formError: "Ya hay una edición abierta." });
  });

  it("returns a form error and never creates the edition when tiers are missing/invalid", async () => {
    const create = vi.fn();

    const result = await createEditionAction(
      { status: "idle" },
      validFormData({ tiers: "[]" }),
      {
        requireAdmin: vi.fn().mockResolvedValue(adminUser()),
        create,
        getClient: async () => ({}) as never,
        doRevalidate: vi.fn(),
      },
    );

    expect(result.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });

  it("still creates the edition and returns success with a warning when saving tiers fails", async () => {
    const create = vi.fn().mockResolvedValue({ success: true, editionId: "edition-1" });
    const createTiers = vi.fn().mockRejectedValue(new Error("No pudimos guardar las opciones de chances."));
    const doRevalidate = vi.fn();

    const result = await createEditionAction({ status: "idle" }, validFormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      create,
      createTiers,
      getClient: async () => ({}) as never,
      doRevalidate,
    });

    expect(result).toEqual({
      status: "success",
      warning: "No pudimos guardar las opciones de chances.",
    });
    expect(doRevalidate).toHaveBeenCalledWith("/admin/ediciones");
  });

  it("skips the image upload entirely when no file was provided", async () => {
    const create = vi.fn().mockResolvedValue({ success: true, editionId: "edition-1" });
    const uploadImage = vi.fn();

    const result = await createEditionAction({ status: "idle" }, validFormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      create,
      createTiers: vi.fn().mockResolvedValue(undefined),
      uploadImage,
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(result).toEqual({ status: "success" });
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("uploads the prize image after creating the edition when a valid file is provided", async () => {
    const create = vi.fn().mockResolvedValue({ success: true, editionId: "edition-1" });
    const uploadImage = vi.fn().mockResolvedValue({ imageUrl: "http://x/edition-1?v=1" });
    const doRevalidate = vi.fn();
    const formData = validFormData();
    formData.set("prizeImage", makeImageFile());

    const result = await createEditionAction({ status: "idle" }, formData, {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      create,
      createTiers: vi.fn().mockResolvedValue(undefined),
      uploadImage,
      getClient: async () => ({}) as never,
      doRevalidate,
    });

    expect(result).toEqual({ status: "success" });
    expect(uploadImage).toHaveBeenCalledWith(
      { editionId: "edition-1", file: expect.any(File) },
      expect.anything(),
    );
    expect(doRevalidate).toHaveBeenCalledWith("/");
    expect(doRevalidate).toHaveBeenCalledWith("/admin/ediciones");
  });

  it("passes the chosen status through to createEdition (prize catalog draft/open)", async () => {
    const create = vi.fn().mockResolvedValue({ success: true, editionId: "edition-1" });

    await createEditionAction({ status: "idle" }, validFormData({ status: "draft" }), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      create,
      createTiers: vi.fn().mockResolvedValue(undefined),
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "draft" }),
      expect.anything(),
    );
  });

  it("still creates the edition and returns success with a warning when the image upload fails", async () => {
    const create = vi.fn().mockResolvedValue({ success: true, editionId: "edition-1" });
    const uploadImage = vi.fn().mockRejectedValue(new Error("No pudimos subir la imagen."));
    const formData = validFormData();
    formData.set("prizeImage", makeImageFile());

    const result = await createEditionAction({ status: "idle" }, formData, {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      create,
      createTiers: vi.fn().mockResolvedValue(undefined),
      uploadImage,
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(result).toEqual({
      status: "success",
      warning: "No pudimos subir la imagen.",
    });
  });
});

describe("setPrizeImageAction", () => {
  it("uploads the image and revalidates on success", async () => {
    const uploadImage = vi.fn().mockResolvedValue({ imageUrl: "http://x/edition-1?v=1" });
    const doRevalidate = vi.fn();
    const formData = new FormData();
    formData.set("prizeImage", makeImageFile());

    const result = await setPrizeImageAction("edition-1", { status: "idle" }, formData, {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      uploadImage,
      getClient: async () => ({}) as never,
      doRevalidate,
    });

    expect(result).toEqual({ status: "success" });
    expect(uploadImage).toHaveBeenCalledWith(
      { editionId: "edition-1", file: expect.any(File) },
      expect.anything(),
    );
    expect(doRevalidate).toHaveBeenCalledWith("/");
    expect(doRevalidate).toHaveBeenCalledWith("/admin/ediciones");
  });

  it("returns an error without throwing when no file was provided", async () => {
    const uploadImage = vi.fn();

    const result = await setPrizeImageAction("edition-1", { status: "idle" }, new FormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      uploadImage,
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(result.status).toBe("error");
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("surfaces the upload error without throwing", async () => {
    const uploadImage = vi.fn().mockRejectedValue(new Error("Formato no permitido."));
    const formData = new FormData();
    formData.set("prizeImage", makeImageFile({ type: "application/pdf" }));

    const result = await setPrizeImageAction("edition-1", { status: "idle" }, formData, {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      uploadImage,
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(result).toEqual({ status: "error", formError: "Formato no permitido." });
  });
});

describe("closeEditionAction", () => {
  it("closes the edition and revalidates", async () => {
    const close = vi.fn().mockResolvedValue({ applied: true });
    const doRevalidate = vi.fn();

    const result = await closeEditionAction("edition-1", { status: "idle" }, new FormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      close,
      getClient: async () => ({}) as never,
      doRevalidate,
    });

    expect(result).toEqual({ status: "idle" });
    expect(close).toHaveBeenCalledWith("edition-1", expect.anything());
    // Regression: closing sales is what starts the public "Ver Sorteo en
    // Vivo" window (once the draw time arrives) -- "/" must revalidate
    // immediately, not just the admin table.
    expect(doRevalidate).toHaveBeenCalledWith("/");
    expect(doRevalidate).toHaveBeenCalledWith("/admin/ediciones");
  });
});

describe("publishEditionAction", () => {
  it("activates the draft edition and revalidates on success", async () => {
    const publish = vi.fn().mockResolvedValue({ success: true });
    const doRevalidate = vi.fn();

    const result = await publishEditionAction("edition-draft-1", { status: "idle" }, new FormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      publish,
      getClient: async () => ({}) as never,
      doRevalidate,
    });

    expect(result).toEqual({ status: "idle" });
    expect(publish).toHaveBeenCalledWith("edition-draft-1", expect.anything());
    expect(doRevalidate).toHaveBeenCalledWith("/");
    expect(doRevalidate).toHaveBeenCalledWith("/admin/ediciones");
  });

  it("surfaces the domain error (e.g. another edition already open) without throwing", async () => {
    const publish = vi
      .fn()
      .mockResolvedValue({ success: false, error: "Ya hay una edición abierta. Cerrala antes de activar esta." });

    const result = await publishEditionAction("edition-draft-1", { status: "idle" }, new FormData(), {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      publish,
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(result).toEqual({
      status: "error",
      formError: "Ya hay una edición abierta. Cerrala antes de activar esta.",
    });
  });
});

describe("publishWinnerAction", () => {
  it("rejects a malformed winner number without calling publishWinner", async () => {
    const formData = new FormData();
    formData.set("winnerNumber", "not-a-number");
    const publish = vi.fn();

    const result = await publishWinnerAction("edition-1", { status: "idle" }, formData, {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      publish,
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(result.status).toBe("error");
    expect(publish).not.toHaveBeenCalled();
  });

  it("publishes the winner and revalidates on success", async () => {
    const formData = new FormData();
    formData.set("winnerNumber", "555555");
    const publish = vi.fn().mockResolvedValue({ applied: true });
    const doRevalidate = vi.fn();

    const result = await publishWinnerAction("edition-1", { status: "idle" }, formData, {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      publish,
      getClient: async () => ({}) as never,
      doRevalidate,
    });

    expect(result).toEqual({ status: "success" });
    expect(publish).toHaveBeenCalledWith("edition-1", 555555, expect.anything());
    // Regression: publishing the winner ends the public live window
    // ("/" reads `getCurrentDrawStatus`, which stops matching once the
    // edition is `drawn`) -- must revalidate "/" too, not just the admin table.
    expect(doRevalidate).toHaveBeenCalledWith("/");
    expect(doRevalidate).toHaveBeenCalledWith("/admin/ediciones");
  });

  it("surfaces a domain error thrown by publishWinner", async () => {
    const formData = new FormData();
    formData.set("winnerNumber", "555555");
    const publish = vi.fn().mockRejectedValue(new Error("Ese número no fue asignado en esta edición."));

    const result = await publishWinnerAction("edition-1", { status: "idle" }, formData, {
      requireAdmin: vi.fn().mockResolvedValue(adminUser()),
      publish,
      getClient: async () => ({}) as never,
      doRevalidate: vi.fn(),
    });

    expect(result).toEqual({
      status: "error",
      formError: "Ese número no fue asignado en esta edición.",
    });
  });
});
