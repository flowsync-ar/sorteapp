import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components ("use client"). Only ever exposes
 * the public URL + anon key — safe to ship to the browser.
 *
 * Deliberately does NOT go through `getRequiredEnv(key, source)`
 * (lib/env.ts) like every other env read in this codebase: Next.js inlines
 * `NEXT_PUBLIC_*` vars into the client bundle by statically pattern-matching
 * the literal `process.env.NEXT_PUBLIC_X` token at build time — routed
 * through a `source[key]` indirection, that literal never appears, so
 * nothing gets inlined and `process.env` is empty in the browser (bugfix:
 * this was latent until `LiveChat` became the first client-side caller of
 * this factory — every prior client component only ever went through
 * Server Actions, never a real browser Supabase connection). The two
 * `process.env.NEXT_PUBLIC_*` references below must stay literal.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(url, anonKey);
}
