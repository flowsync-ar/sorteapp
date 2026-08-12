import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * `(member)` route group guard (design.md §1: "`(member)/layout.tsx` #
 * guards session via supabase server client"). Any authenticated session —
 * including the anonymous one PR5's guest checkout creates — passes this
 * gate; RLS already scopes every query to the caller's own rows, and
 * requiring a NON-anonymous session here would break the "see your order
 * right after paying, before claiming your account" flow (spec.md §7).
 * Course-content gating is a separate, stricter check in
 * `lib/member/access.ts` (order status, not session type).
 *
 * NOTE: Next.js renders a layout's body concurrently with its page
 * children, not strictly before them (no `middleware.ts` exists in this
 * project to enforce this at the request level) — this guard is
 * defense-in-depth, not sufficient on its own. Every page under `(member)`
 * MUST repeat its own `if (!user) redirect("/login")` check (see
 * `mi-cuenta/page.tsx`).
 */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <>{children}</>;
}
