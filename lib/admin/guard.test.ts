import { describe, expect, it, vi } from "vitest";
import { requireAdminUser } from "./guard";

function redirectThrows() {
  return vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }) as unknown as (path: string) => never;
}

function fakeSupabase(user: { id: string; role?: string } | null) {
  return {
    auth: {
      getUser: vi.fn(async () =>
        user
          ? { data: { user: { id: user.id, app_metadata: { role: user.role } } }, error: null }
          : { data: { user: null }, error: null },
      ),
    },
  };
}

describe("requireAdminUser", () => {
  it("redirects to /login when there is no session", async () => {
    const client = fakeSupabase(null);
    const doRedirect = redirectThrows();

    await expect(
      requireAdminUser({ getClient: async () => client as never, doRedirect }),
    ).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects to / when the session is not an admin", async () => {
    const client = fakeSupabase({ id: "user-1", role: "authenticated" });
    const doRedirect = redirectThrows();

    await expect(
      requireAdminUser({ getClient: async () => client as never, doRedirect }),
    ).rejects.toThrow("REDIRECT:/");
  });

  it("returns the user when the session is an admin", async () => {
    const client = fakeSupabase({ id: "admin-1", role: "admin" });
    const doRedirect = redirectThrows();

    const user = await requireAdminUser({
      getClient: async () => client as never,
      doRedirect,
    });

    expect(user.id).toBe("admin-1");
    expect(doRedirect).not.toHaveBeenCalled();
  });
});
