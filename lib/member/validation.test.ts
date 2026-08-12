import { describe, expect, it } from "vitest";
import { validateClaimAccountInput, validateLoginInput } from "./validation";

describe("validateClaimAccountInput", () => {
  it("accepts a valid email + matching password", () => {
    const result = validateClaimAccountInput({
      email: "buyer@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      success: true,
      data: { email: "buyer@example.com", password: "secret123" },
    });
  });

  it("rejects an invalid email", () => {
    const result = validateClaimAccountInput({
      email: "not-an-email",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toMatch(/email válido/i);
    }
  });

  it("rejects a password shorter than 6 characters (matches minimum_password_length)", () => {
    const result = validateClaimAccountInput({
      email: "buyer@example.com",
      password: "abc12",
      confirmPassword: "abc12",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.password).toMatch(/6 caracteres/i);
    }
  });

  it("rejects mismatched password confirmation", () => {
    const result = validateClaimAccountInput({
      email: "buyer@example.com",
      password: "secret123",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.confirmPassword).toMatch(/no coinciden/i);
    }
  });

  it("reports every field error at once", () => {
    const result = validateClaimAccountInput({
      email: "bad",
      password: "abc",
      confirmPassword: "xyz",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "confirmPassword",
        "email",
        "password",
      ]);
    }
  });
});

describe("validateLoginInput", () => {
  it("accepts a valid email + non-empty password", () => {
    const result = validateLoginInput({
      email: "buyer@example.com",
      password: "secret123",
    });

    expect(result).toEqual({
      success: true,
      data: { email: "buyer@example.com", password: "secret123" },
    });
  });

  it("rejects an invalid email", () => {
    const result = validateLoginInput({ email: "bad", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = validateLoginInput({ email: "buyer@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});
