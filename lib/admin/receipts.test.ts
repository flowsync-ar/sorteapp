import { describe, expect, it, vi } from "vitest";
import { getReceiptSignedUrl, listPendingReceipts } from "./receipts";

function fakeListClient(rows: unknown[] | null, error: unknown = null) {
  const order = vi.fn(async () => ({ data: rows, error }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as never, from, select, eq, order };
}

describe("listPendingReceipts", () => {
  it("maps pending receipts joined with their order's buyer info", async () => {
    const { client, from } = fakeListClient([
      {
        id: "receipt-1",
        order_id: "order-1",
        storage_path: "order-1/file.png",
        uploaded_at: "2026-08-01T00:00:00Z",
        order: {
          buyer_name: "Ana Test",
          buyer_email: "ana@example.com",
          amount_ars: "35000",
          method: "transfer",
          tier: { numbers_granted: 3 },
        },
      },
    ]);

    const result = await listPendingReceipts(client);

    expect(from).toHaveBeenCalledWith("receipt");
    expect(result).toEqual([
      {
        id: "receipt-1",
        orderId: "order-1",
        storagePath: "order-1/file.png",
        uploadedAt: "2026-08-01T00:00:00Z",
        buyerName: "Ana Test",
        buyerEmail: "ana@example.com",
        chances: 3,
        amountArs: 35000,
      },
    ]);
  });

  it("returns an empty list when there are no pending receipts", async () => {
    const { client } = fakeListClient([]);
    const result = await listPendingReceipts(client);
    expect(result).toEqual([]);
  });

  it("throws a domain error when the query fails", async () => {
    const { client } = fakeListClient(null, { message: "boom" });
    await expect(listPendingReceipts(client)).rejects.toThrow(
      /No pudimos leer los comprobantes pendientes/,
    );
  });
});

describe("getReceiptSignedUrl", () => {
  it("requests a short-lived signed URL from the receipts bucket", async () => {
    const createSignedUrl = vi.fn(async () => ({
      data: { signedUrl: "https://signed.example.com/file.png" },
      error: null,
    }));
    const client = {
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    } as never;

    const url = await getReceiptSignedUrl("order-1/file.png", client);

    expect(url).toBe("https://signed.example.com/file.png");
    expect(createSignedUrl).toHaveBeenCalledWith("order-1/file.png", 300);
  });

  it("throws a domain error when the signed URL request fails", async () => {
    const createSignedUrl = vi.fn(async () => ({
      data: null,
      error: { message: "not found" },
    }));
    const client = {
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    } as never;

    await expect(getReceiptSignedUrl("order-1/file.png", client)).rejects.toThrow(
      /No pudimos generar el link del comprobante/,
    );
  });
});
