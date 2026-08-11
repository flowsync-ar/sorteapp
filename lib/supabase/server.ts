import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getRequiredEnv } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the session via Next.js cookies. NEVER import this from a
 * client component — it depends on `next/headers`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", process.env),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component without a mutable cookie jar
            // (e.g. rendering, not an action). Session refresh is handled
            // by middleware in that case — safe to ignore here.
          }
        },
      },
    },
  );
}
