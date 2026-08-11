import { describe, expect, it } from "vitest";
import { validateBuyerInfo } from "./validation";

const valid = {
  name: "Martín García",
  email: "martin@example.com",
  dni: "30123456",
  phone: "+54 9 11 2345-6789",
};

describe("validateBuyerInfo", () => {
  it("accepts fully valid buyer data and returns normalized fields", () => {
    const result = validateBuyerInfo(valid);

    expect(result).toEqual({ success: true, data: valid });
  });

  it("rejects a name shorter than 3 characters", () => {
    const result = validateBuyerInfo({ ...valid, name: "Al" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toMatch(/nombre/i);
    }
  });

  it("rejects a malformed email", () => {
    const result = validateBuyerInfo({ ...valid, email: "not-an-email" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toMatch(/email/i);
    }
  });

  it("rejects a DNI that isn't 7-8 digits", () => {
    const result = validateBuyerInfo({ ...valid, dni: "123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.dni).toMatch(/dni/i);
    }
  });

  it("accepts a DNI written with dots and strips them", () => {
    const result = validateBuyerInfo({ ...valid, dni: "30.123.456" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dni).toBe("30123456");
    }
  });

  it("rejects a phone shorter than 8 digits", () => {
    const result = validateBuyerInfo({ ...valid, phone: "123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.phone).toMatch(/teléfono/i);
    }
  });

  it("reports every invalid field at once, not just the first", () => {
    const result = validateBuyerInfo({
      name: "",
      email: "bad",
      dni: "1",
      phone: "1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "dni",
        "email",
        "name",
        "phone",
      ]);
    }
  });
});
