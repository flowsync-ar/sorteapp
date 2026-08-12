import { describe, expect, it, vi } from "vitest";
import { loginAction } from "./actions";

function noopRedirect() {
  return vi.fn() as unknown as (path: string) => never;
}

const validFormData = (overrides: Record<string, string> = {}) => {
  const data: Record<string, string> = {
    email: "buyer@example.com",
    password: "secret123",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }
  return formData;
};

function fakeSupabase(options: {
  signInError?: { message: string } | null;
  role?: string;
}) {
  const signInWithPassword = vi.fn(async () => ({
    data: options.signInError
      ? { user: null }
      : { user: { id: "user-1", app_metadata: { role: options.role } } },
    error: options.signInError ?? null,
  }));

  return { client: { auth: { signInWithPassword } }, signInWithPassword };
}

describe("loginAction", () => {
  it("returns field errors and never calls Supabase when the form is invalid", async () => {
    const { client, signInWithPassword } = fakeSupabase({});
    const doRedirect = noopRedirect();

    const result = await loginAction({ status: "idle" }, validFormData({ email: "bad" }), {
      getClient: async () => client as never,
      doRedirect,
    });

    expect(result.status).toBe("error");
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(doRedirect).not.toHaveBeenCalled();
  });

  it("returns a friendly error on invalid credentials", async () => {
    const { client } = fakeSupabase({ signInError: { message: "Invalid login credentials" } });

    const result = await loginAction({ status: "idle" }, validFormData(), {
      getClient: async () => client as never,
      doRedirect: noopRedirect(),
    });

    expect(result).toEqual({
      status: "error",
      formError: expect.stringMatching(/email o contraseña/i),
    });
  });

  it("signs in and redirects to /mi-cuenta on success", async () => {
    const { client, signInWithPassword } = fakeSupabase({});
    const doRedirect = vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });

    await expect(
      loginAction({ status: "idle" }, validFormData(), {
        getClient: async () => client as never,
        doRedirect: doRedirect as never,
      }),
    ).rejects.toThrow("REDIRECT:/mi-cuenta");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "buyer@example.com",
      password: "secret123",
    });
  });

  it("redirects to /admin when the signed-in user has the admin role", async () => {
    const { client } = fakeSupabase({ role: "admin" });
    const doRedirect = vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });

    await expect(
      loginAction({ status: "idle" }, validFormData(), {
        getClient: async () => client as never,
        doRedirect: doRedirect as never,
      }),
    ).rejects.toThrow("REDIRECT:/admin");
  });
});
