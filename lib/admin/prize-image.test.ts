import { describe, expect, it, vi } from "vitest";
import { PrizeImageUploadError, uploadPrizeImage } from "./prize-image";

function makeFile(overrides: Partial<{ name: string; type: string; size: number }> = {}) {
  const bytes = new Uint8Array(overrides.size ?? 1024).fill(1);
  return new File([bytes], overrides.name ?? "premio.jpg", {
    type: overrides.type ?? "image/jpeg",
  });
}

function fakeSupabase(options: {
  uploadError?: unknown;
  publicUrl?: string;
  updateError?: unknown;
}) {
  const upload = vi.fn(async () => ({
    data: options.uploadError ? null : { path: "uploaded" },
    error: options.uploadError ?? null,
  }));
  const getPublicUrl = vi.fn(() => ({
    data: { publicUrl: options.publicUrl ?? "http://127.0.0.1:54321/storage/v1/object/public/prize-images/edition-1" },
  }));

  const updateBuilder = {
    eq: vi.fn(async () => ({ data: {}, error: options.updateError ?? null })),
  };
  const update = vi.fn(() => updateBuilder);

  return {
    client: {
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket !== "prize-images") throw new Error(`Unexpected bucket ${bucket}`);
          return { upload, getPublicUrl };
        }),
      },
      from: vi.fn((table: string) => {
        if (table !== "raffle_edition") throw new Error(`Unexpected table ${table}`);
        return { update };
      }),
    },
    upload,
    getPublicUrl,
    update,
    updateBuilder,
  };
}

describe("uploadPrizeImage", () => {
  it("rejects an invalid file before touching storage", async () => {
    const { client } = fakeSupabase({});

    await expect(
      uploadPrizeImage(
        { editionId: "edition-1", file: makeFile({ type: "application/pdf" }) },
        client as never,
      ),
    ).rejects.toThrow(PrizeImageUploadError);
    expect(client.storage.from).not.toHaveBeenCalled();
  });

  it("uploads to the deterministic extensionless path, upserts, and cache-busts the stored URL", async () => {
    const { client, upload, getPublicUrl, update, updateBuilder } = fakeSupabase({});

    const result = await uploadPrizeImage(
      { editionId: "edition-1", file: makeFile() },
      client as never,
    );

    expect(upload).toHaveBeenCalledWith(
      "edition-1",
      expect.anything(),
      expect.objectContaining({ contentType: "image/jpeg", upsert: true }),
    );
    expect(getPublicUrl).toHaveBeenCalledWith("edition-1");
    expect(result.imageUrl).toMatch(
      /^http:\/\/127\.0\.0\.1:54321\/storage\/v1\/object\/public\/prize-images\/edition-1\?v=\d+$/,
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ prize_image: result.imageUrl }),
    );
    expect(updateBuilder.eq).toHaveBeenCalledWith("id", "edition-1");
  });

  it("throws when the Storage upload itself fails", async () => {
    const { client } = fakeSupabase({ uploadError: { message: "boom" } });

    await expect(
      uploadPrizeImage({ editionId: "edition-1", file: makeFile() }, client as never),
    ).rejects.toThrow(/no pudimos subir/i);
  });

  it("throws when persisting the URL on the edition row fails", async () => {
    const { client } = fakeSupabase({ updateError: { message: "db down" } });

    await expect(
      uploadPrizeImage({ editionId: "edition-1", file: makeFile() }, client as never),
    ).rejects.toThrow(/no pudimos guardarla/i);
  });
});
