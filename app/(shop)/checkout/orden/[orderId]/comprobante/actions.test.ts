import { describe, expect, it, vi } from "vitest";
import { uploadReceiptAction } from "./actions";
import { ReceiptUploadError } from "@/lib/receipts/upload";

function makeFile() {
  return new File([new Uint8Array(1024).fill(1)], "comprobante.jpg", {
    type: "image/jpeg",
  });
}

describe("uploadReceiptAction", () => {
  it("returns a form error without calling upload() when no file was attached", async () => {
    const upload = vi.fn();
    const doRevalidate = vi.fn();
    const formData = new FormData();

    const result = await uploadReceiptAction("order-1", { status: "idle" }, formData, {
      upload,
      doRevalidate,
    });

    expect(result).toEqual({
      status: "error",
      formError: expect.stringMatching(/subí un archivo/i),
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns the upload error message when uploadReceiptForOrder rejects", async () => {
    const upload = vi.fn().mockRejectedValue(new ReceiptUploadError("Ya tenés un comprobante en revisión."));
    const doRevalidate = vi.fn();
    const formData = new FormData();
    formData.set("receipt", makeFile());

    const result = await uploadReceiptAction("order-1", { status: "idle" }, formData, {
      upload,
      doRevalidate,
    });

    expect(result).toEqual({
      status: "error",
      formError: "Ya tenés un comprobante en revisión.",
    });
    expect(doRevalidate).not.toHaveBeenCalled();
  });

  it("rethrows unexpected errors instead of swallowing them", async () => {
    const upload = vi.fn().mockRejectedValue(new Error("unexpected"));
    const formData = new FormData();
    formData.set("receipt", makeFile());

    await expect(
      uploadReceiptAction("order-1", { status: "idle" }, formData, {
        upload,
        doRevalidate: vi.fn(),
      }),
    ).rejects.toThrow("unexpected");
  });

  it("uploads, revalidates the comprobante route, and returns success", async () => {
    const upload = vi.fn().mockResolvedValue({ receiptId: "receipt-1" });
    const doRevalidate = vi.fn();
    const file = makeFile();
    const formData = new FormData();
    formData.set("receipt", file);

    const result = await uploadReceiptAction("order-1", { status: "idle" }, formData, {
      upload,
      doRevalidate,
    });

    expect(result).toEqual({ status: "success" });
    expect(upload).toHaveBeenCalledWith({ orderId: "order-1", file });
    expect(doRevalidate).toHaveBeenCalledWith("/checkout/orden/order-1/comprobante");
  });
});
