import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberAccountOverview } from "@/lib/member/access";
import { OrdersList } from "@/components/member/OrdersList";
import { CoursePlaceholder } from "@/components/member/CoursePlaceholder";
import { ClaimAccountForm } from "@/components/member/ClaimAccountForm";
import { SignOutButton } from "@/components/member/SignOutButton";
import { claimAccountAction, signOutAction } from "./actions";

/**
 * `/mi-cuenta` (tasks.md PR8.3, spec.md §7 "Member Area"). Single hub for
 * an authenticated buyer (real OR still-anonymous session, see
 * `app/(member)/layout.tsx`): claim-account prompt (only while anonymous
 * AND at least one order is `approved`), the buyer's orders + assigned
 * numbers, and the gated course content.
 *
 * Deviation from design.md's route tree (documented, not silent): design.md
 * sketched separate `mis-numeros/` and `cursos/[track]/` routes under
 * `(member)/`, built on top of `course_track`/`course_access` tables that
 * were explicitly deferred ("land with the member-area/PR8 work" —
 * `supabase/migrations/*_schema.sql`). This batch's scope is proving the
 * access gate (spec.md §7), not a real course catalog, so those tables
 * were NOT added — see `lib/member/content.ts`'s TODO. Consolidating into
 * one page avoids building routes around a data model that doesn't exist
 * yet; splitting back into `mis-numeros`/`cursos/[track]` is straightforward
 * once `course_track` lands.
 */
export default async function MiCuentaPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  // NOT redundant with `(member)/layout.tsx`'s guard: Next.js renders a
  // layout's async body CONCURRENTLY with its `children` page, not before
  // it — a layout `redirect()` does not stop the page component from
  // running its own code first. Confirmed empirically via
  // `e2e/member-area.spec.ts`'s unauthenticated-visitor case, which
  // exercised this exact race before this check was added. Every
  // `(member)` page must re-check, the layout alone is not a real guard.
  if (!userData.user) {
    redirect("/login");
  }
  const user = userData.user;

  const overview = await getMemberAccountOverview(user.id, supabase);
  const approvedTierKeys = overview.orders
    .filter((order) => order.status === "approved")
    .map((order) => order.tierKey) as Array<"inicial" | "plus" | "premium">;

  const showClaimPrompt = Boolean(user.is_anonymous) && overview.hasCourseAccess;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-sm tracking-widest text-champagne uppercase">
            Mi cuenta
          </p>
          <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
            Tus compras y tu curso
          </h1>
        </div>
        {!user.is_anonymous ? <SignOutButton action={signOutAction} /> : null}
      </div>

      {showClaimPrompt ? (
        <section className="mt-8 rounded-xl border border-champagne/30 bg-surface/60 p-5">
          <h2 className="font-display text-xl text-foreground">
            Reclamá tu cuenta
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ponele un email y contraseña a tu compra para poder volver a
            entrar desde cualquier dispositivo.
          </p>
          <div className="mt-4">
            <ClaimAccountForm action={claimAccountAction} />
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl text-foreground">Tus órdenes</h2>
        <div className="mt-4">
          <OrdersList orders={overview.orders} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-foreground">Tu curso</h2>
        <div className="mt-4">
          <CoursePlaceholder
            hasCourseAccess={overview.hasCourseAccess}
            tierKeys={approvedTierKeys}
          />
        </div>
      </section>
    </div>
  );
}
