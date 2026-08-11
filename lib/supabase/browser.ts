import { createBrowserClient } from "@supabase/ssr";
import { getRequiredEnv } from "@/lib/env";

/**
 * Supabase client for Client Components ("use client"). Only ever exposes
 * the public URL + anon key — safe to ship to the browser.
 */
export function createClient() {
  return createBrowserClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", process.env),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env),
  );
}
