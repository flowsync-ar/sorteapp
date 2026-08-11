import { describe, expect, it } from "vitest";
import { getRequiredEnv } from "./env";

describe("getRequiredEnv", () => {
  it("returns the value when the key is present and non-empty", () => {
    const source = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" };

    expect(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", source)).toBe(
      "https://example.supabase.co",
    );
  });

  it("throws a descriptive error when the key is missing", () => {
    const source = {};

    expect(() => getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY", source)).toThrow(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY",
    );
  });

  it("throws a descriptive error when the key is present but empty", () => {
    const source = { NEXT_PUBLIC_SUPABASE_ANON_KEY: "" };

    expect(() =>
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", source),
    ).toThrow("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });
});
