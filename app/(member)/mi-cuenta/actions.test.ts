import { describe, expect, it, vi } from "vitest";
import { claimAccountAction, signOutAction } from "./actions";

const validFormData = (overrides: Record<string, string> = {}) => {
  const data: Record<string, string> = {
    email: "buyer@example.com",
    password: "secret123",
    confirmPassword: "secret123",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }
  return formData;
};

describe("claimAccountAction", () => {
  it("returns field errors and never revalidates when claimAccount fails validation", async () => {
    const claim = vi.fn().mockResolvedValue({
      success: false,
      fieldErrors: { email: "Ingresá un email válido." },
    });
    const doRevalidate = vi.fn();

    const result = await claimAccountAction(
      { status: "idle" },
      validFormData({ email: "bad" }),
      { claim, doRevalidate },
    );

    expect(result).toEqual({
      status: "error",
      fieldErrors: { email: "Ingresá un email válido." },
    });
    expect(doRevalidate).not.toHaveBeenCalled();
  });

  it("revalidates /mi-cuenta and returns success when claimAccount succeeds", async () => {
    const claim = vi.fn().mockResolvedValue({ success: true });
    const doRevalidate = vi.fn();

    const result = await claimAccountAction({ status: "idle" }, validFormData(), {
      claim,
      doRevalidate,
    });

    expect(result).toEqual({ status: "success" });
    expect(doRevalidate).toHaveBeenCalledWith("/mi-cuenta");
  });

  it("surfaces a form-level error from claimAccount", async () => {
    const claim = vi.fn().mockResolvedValue({
      success: false,
      formError: "Ese email ya está registrado.",
    });

    const result = await claimAccountAction({ status: "idle" }, validFormData(), {
      claim,
      doRevalidate: vi.fn(),
    });

    expect(result).toEqual({
      status: "error",
      formError: "Ese email ya está registrado.",
    });
  });
});

describe("signOutAction", () => {
  it("signs out and redirects to /login", async () => {
    const signOut = vi.fn(async () => ({ error: null }));
    const client = { auth: { signOut } };
    const doRedirect = vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });

    await expect(
      signOutAction({
        getClient: async () => client as never,
        doRedirect: doRedirect as never,
      }),
    ).rejects.toThrow("REDIRECT:/login");

    expect(signOut).toHaveBeenCalledOnce();
  });
});
