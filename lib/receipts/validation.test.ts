import { describe, expect, it } from "vitest";
import { validateReceiptFile } from "./validation";

describe("validateReceiptFile", () => {
  it("rejects when no file was selected", () => {
    const result = validateReceiptFile(null);

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/subí un archivo/i),
    });
  });

  it("rejects an empty (0-byte) file", () => {
    const result = validateReceiptFile({
      name: "comprobante.jpg",
      type: "image/jpeg",
      size: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a disallowed mime type", () => {
    const result = validateReceiptFile({
      name: "comprobante.exe",
      type: "application/x-msdownload",
      size: 1024,
    });

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/formato no permitido/i),
    });
  });

  it("rejects a file over the size limit", () => {
    const result = validateReceiptFile({
      name: "comprobante.pdf",
      type: "application/pdf",
      size: 11 * 1024 * 1024,
    });

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/tamaño máximo/i),
    });
  });

  it.each([
    ["image/jpeg", "comprobante.jpg"],
    ["image/png", "comprobante.png"],
    ["image/webp", "comprobante.webp"],
    ["application/pdf", "comprobante.pdf"],
  ])("accepts a valid %s file within the size limit", (type, name) => {
    const result = validateReceiptFile({ name, type, size: 2 * 1024 * 1024 });

    expect(result).toEqual({ success: true });
  });
});
