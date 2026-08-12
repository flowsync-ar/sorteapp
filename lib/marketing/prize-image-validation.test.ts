import { describe, expect, it } from "vitest";
import { validatePrizeImageFile } from "./prize-image-validation";

describe("validatePrizeImageFile", () => {
  it("rejects when no file was selected", () => {
    const result = validatePrizeImageFile(null);

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/subí una imagen/i),
    });
  });

  it("rejects an empty (0-byte) file", () => {
    const result = validatePrizeImageFile({
      name: "premio.jpg",
      type: "image/jpeg",
      size: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a disallowed mime type (e.g. pdf)", () => {
    const result = validatePrizeImageFile({
      name: "premio.pdf",
      type: "application/pdf",
      size: 1024,
    });

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/formato no permitido/i),
    });
  });

  it("rejects a file over the 5MB size limit", () => {
    const result = validatePrizeImageFile({
      name: "premio.png",
      type: "image/png",
      size: 6 * 1024 * 1024,
    });

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/5 ?mb/i),
    });
  });

  it.each([
    ["image/jpeg", "premio.jpg"],
    ["image/png", "premio.png"],
    ["image/webp", "premio.webp"],
  ])("accepts a valid %s file within the size limit", (type, name) => {
    const result = validatePrizeImageFile({ name, type, size: 2 * 1024 * 1024 });

    expect(result).toEqual({ success: true });
  });
});
