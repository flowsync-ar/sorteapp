import { describe, expect, it, vi } from "vitest";
import { claimAccount } from "./claim";

function fakeSupabase(options: {
  user?: { id: string; is_anonymous?: boolean } | null;
  updateUserError?: { message: string } | null;
}) {
  const updateUser = vi.fn(async () => ({
    data: options.updateUserError ? null : { user: { id: "user-1" } },
    error: options.updateUserError ?? null,
  }));

  return {
    client: {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: options.user === undefined ? { id: "user-1" } : options.user },
          error: null,
        })),
        updateUser,
      },
    },
    updateUser,
  };
}

describe("claimAccount", () => {
  it("rejects invalid input before touching Supabase", async () => {
    const { client, updateUser } = fakeSupabase({});

    const result = await claimAccount(
      { email: "not-an-email", password: "secret123", confirmPassword: "secret123" },
      { getClient: async () => client as never },
    );

    expect(result.success).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("fails when there is no active session", async () => {
    const { client } = fakeSupabase({ user: null });

    const result = await claimAccount(
      { email: "buyer@example.com", password: "secret123", confirmPassword: "secret123" },
      { getClient: async () => client as never },
    );

    expect(result).toEqual({
      success: false,
      formError: expect.stringMatching(/sesión expiró/i),
    });
  });

  it("calls supabase.auth.updateUser with the claimed email + password", async () => {
    const { client, updateUser } = fakeSupabase({});

    const result = await claimAccount(
      { email: "buyer@example.com", password: "secret123", confirmPassword: "secret123" },
      { getClient: async () => client as never },
    );

    expect(result).toEqual({ success: true });
    expect(updateUser).toHaveBeenCalledWith({
      email: "buyer@example.com",
      password: "secret123",
    });
  });

  it("returns a friendly error when the email is already registered", async () => {
    const { client } = fakeSupabase({
      updateUserError: { message: "A user with this email address has already been registered" },
    });

    const result = await claimAccount(
      { email: "buyer@example.com", password: "secret123", confirmPassword: "secret123" },
      { getClient: async () => client as never },
    );

    expect(result).toEqual({
      success: false,
      formError: expect.stringMatching(/ya está registrado/i),
    });
  });

  it("returns a generic error on any other Supabase failure", async () => {
    const { client } = fakeSupabase({ updateUserError: { message: "network down" } });

    const result = await claimAccount(
      { email: "buyer@example.com", password: "secret123", confirmPassword: "secret123" },
      { getClient: async () => client as never },
    );

    expect(result).toEqual({
      success: false,
      formError: expect.stringMatching(/no pudimos/i),
    });
  });
});
