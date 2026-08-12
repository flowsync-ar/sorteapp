import { describe, expect, it, vi } from "vitest";
import { ReceiptUploadError, uploadReceiptForOrder } from "./upload";

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    upsert: vi.fn(() => builder),
  };
  return builder;
}

function makeFile(overrides: Partial<{ name: string; type: string; size: number }> = {}) {
  const bytes = new Uint8Array(overrides.size ?? 1024).fill(1);
  return new File([bytes], overrides.name ?? "comprobante.jpg", {
    type: overrides.type ?? "image/jpeg",
  });
}

function fakeSupabase(options: {
  order?: { data: unknown; error: unknown };
  existingReceipt?: { data: unknown; error: unknown };
  receiptUpsertResult?: { data: unknown; error: unknown };
  storageUploadError?: unknown;
}) {
  const orderBuilder = makeQueryBuilder(
    options.order ?? {
      data: { id: "order-1", method: "transfer", status: "pending" },
      error: null,
    },
  );
  const receiptSelectBuilder = makeQueryBuilder(
    options.existingReceipt ?? { data: null, error: null },
  );
  const receiptUpsertBuilder = makeQueryBuilder(
    options.receiptUpsertResult ?? { data: { id: "receipt-1" }, error: null },
  );

  const upload = vi.fn(async () => ({
    data: options.storageUploadError ? null : { path: "uploaded" },
    error: options.storageUploadError ?? null,
  }));

  let receiptCallCount = 0;

  return {
    client: {
      from: vi.fn((table: string) => {
        if (table === "order") return orderBuilder;
        if (table === "receipt") {
          receiptCallCount += 1;
          // First call is the pre-existing-receipt lookup (select+eq+maybeSingle),
          // second is the upsert.
          return receiptCallCount === 1 ? receiptSelectBuilder : receiptUpsertBuilder;
        }
        throw new Error(`Unexpected table ${table}`);
      }),
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket !== "receipts") throw new Error(`Unexpected bucket ${bucket}`);
          return { upload };
        }),
      },
    },
    upload,
    orderBuilder,
    receiptUpsertBuilder,
  };
}

describe("uploadReceiptForOrder", () => {
  it("rejects an invalid file before touching the database", async () => {
    const { client } = fakeSupabase({});

    await expect(
      uploadReceiptForOrder(
        { orderId: "order-1", file: makeFile({ type: "application/x-msdownload" }) },
        { getClient: async () => client as never },
      ),
    ).rejects.toThrow(ReceiptUploadError);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rejects when the order does not exist", async () => {
    const { client } = fakeSupabase({ order: { data: null, error: null } });

    await expect(
      uploadReceiptForOrder(
        { orderId: "order-1", file: makeFile() },
        { getClient: async () => client as never },
      ),
    ).rejects.toThrow(/no encontramos tu orden/i);
  });

  it("rejects an order that isn't a transfer order", async () => {
    const { client } = fakeSupabase({
      order: { data: { id: "order-1", method: "mp", status: "pending" }, error: null },
    });

    await expect(
      uploadReceiptForOrder(
        { orderId: "order-1", file: makeFile() },
        { getClient: async () => client as never },
      ),
    ).rejects.toThrow(/no admite comprobante/i);
  });

  it("rejects an order that was already decided", async () => {
    const { client } = fakeSupabase({
      order: { data: { id: "order-1", method: "transfer", status: "approved" }, error: null },
    });

    await expect(
      uploadReceiptForOrder(
        { orderId: "order-1", file: makeFile() },
        { getClient: async () => client as never },
      ),
    ).rejects.toThrow(/ya fue decidida/i);
  });

  it("rejects re-upload when the receipt was already verified", async () => {
    const { client } = fakeSupabase({
      existingReceipt: { data: { id: "receipt-1", status: "verified" }, error: null },
    });

    await expect(
      uploadReceiptForOrder(
        { orderId: "order-1", file: makeFile() },
        { getClient: async () => client as never },
      ),
    ).rejects.toThrow(/ya fue verificado/i);
  });

  it("rejects re-upload while a receipt is still pending review", async () => {
    const { client } = fakeSupabase({
      existingReceipt: { data: { id: "receipt-1", status: "pending" }, error: null },
    });

    await expect(
      uploadReceiptForOrder(
        { orderId: "order-1", file: makeFile() },
        { getClient: async () => client as never },
      ),
    ).rejects.toThrow(/en revisión/i);
  });

  it("allows re-upload when the previous receipt was rejected, uploads to a sanitized path, and upserts the receipt row", async () => {
    const { client, upload, receiptUpsertBuilder } = fakeSupabase({
      existingReceipt: { data: { id: "receipt-1", status: "rejected" }, error: null },
    });

    const result = await uploadReceiptForOrder(
      { orderId: "order-1", file: makeFile({ name: "mi comprobante (1).jpg" }) },
      { getClient: async () => client as never },
    );

    expect(result).toEqual({ receiptId: "receipt-1" });
    expect(upload).toHaveBeenCalledOnce();
    const [path] = upload.mock.calls[0] as unknown as [string, unknown, unknown];
    expect(path).toMatch(/^order-1\/\d+-mi_comprobante__1_\.jpg$/);
    expect(receiptUpsertBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: "order-1",
        status: "pending",
        reject_reason: null,
      }),
      { onConflict: "order_id" },
    );
  });

  it("throws when the Storage upload itself fails", async () => {
    const { client } = fakeSupabase({ storageUploadError: { message: "boom" } });

    await expect(
      uploadReceiptForOrder(
        { orderId: "order-1", file: makeFile() },
        { getClient: async () => client as never },
      ),
    ).rejects.toThrow(/no pudimos subir/i);
  });

  it("throws when the receipt row upsert fails after a successful upload", async () => {
    const { client } = fakeSupabase({
      receiptUpsertResult: { data: null, error: { message: "db down" } },
    });

    await expect(
      uploadReceiptForOrder(
        { orderId: "order-1", file: makeFile() },
        { getClient: async () => client as never },
      ),
    ).rejects.toThrow(/no pudimos registrar/i);
  });
});
