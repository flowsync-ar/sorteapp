import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/comprobantes", label: "Comprobantes" },
  { href: "/admin/participantes", label: "Participantes" },
  { href: "/admin/ediciones", label: "Ediciones" },
];

/**
 * `(admin)/admin` route group guard (design.md §1: "`(admin)/admin/` #
 * role-gated"). Same defense-in-depth-only pattern as `app/(member)/
 * layout.tsx` — a layout's `redirect()` does NOT reliably stop its page
 * children from rendering (they run concurrently, no `middleware.ts` in
 * this project), so every `/admin/*` page ALSO calls `requireAdminUser()`
 * (`lib/admin/guard.ts`) itself. This layout is the first line of defense
 * plus the shared nav chrome — deliberately dense/utilitarian, not
 * editorial (batch scope instruction), unlike the public marketing layout.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }
  if (data.user.app_metadata?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <div className="border-b border-surface bg-surface/40">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <span className="font-display text-lg text-champagne">Panel admin</span>
          <nav className="flex gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
