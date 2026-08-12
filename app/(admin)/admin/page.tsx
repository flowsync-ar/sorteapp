import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/guard";
import { listPendingReceipts } from "@/lib/admin/receipts";
import { listEditions } from "@/lib/admin/editions";

/**
 * `/admin` dashboard root (tasks.md PR9, spec.md §8 "Gestión protegida").
 * Small at-a-glance summary + links into the three admin sections — the
 * detail lives in each section's own page, not duplicated here.
 */
export default async function AdminDashboardPage() {
  await requireAdminUser();

  const supabase = await createClient();
  const [pendingReceipts, editions] = await Promise.all([
    listPendingReceipts(supabase),
    listEditions(supabase),
  ]);

  const openEdition = editions.find((edition) => edition.status === "open");

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Resumen</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/comprobantes"
          className="rounded-xl border border-surface bg-surface/40 p-5 transition hover:border-champagne/50"
        >
          <p className="text-sm text-muted-foreground">Comprobantes pendientes</p>
          <p className="mt-2 font-display text-3xl text-champagne">{pendingReceipts.length}</p>
        </Link>

        <Link
          href="/admin/ediciones"
          className="rounded-xl border border-surface bg-surface/40 p-5 transition hover:border-champagne/50"
        >
          <p className="text-sm text-muted-foreground">Edición activa</p>
          <p className="mt-2 font-display text-2xl text-foreground">
            {openEdition ? `${openEdition.month}/${openEdition.year}` : "Ninguna"}
          </p>
          {openEdition ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {openEdition.numbersSold} / {openEdition.numberCap} vendidos
            </p>
          ) : null}
        </Link>

        <Link
          href="/admin/participantes"
          className="rounded-xl border border-surface bg-surface/40 p-5 transition hover:border-champagne/50"
        >
          <p className="text-sm text-muted-foreground">Participantes</p>
          <p className="mt-2 font-display text-2xl text-foreground">Buscar →</p>
        </Link>
      </div>
    </div>
  );
}
