import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/guard";
import { getRevenueSummary } from "@/lib/admin/revenue";

function formatAmount(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

const METHOD_LABELS: Record<string, string> = {
  mp: "Mercado Pago",
  transfer: "Transferencia",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Expirado",
};

const EDITION_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  open: "Abierta",
  closed: "Cerrada",
  drawn: "Sorteada",
};

/**
 * `/admin/recaudacion` (tasks.md admin-panel-v2 work unit 2 "Dashboard de
 * recaudación"). Pure read-only summary — `getRevenueSummary` already did
 * the aggregation, this page only renders it in three breakdown tables plus
 * the grand total. Same Server Component pattern (no client island) as
 * every other `(admin)/admin/*` page. The headline total ("Recaudado
 * (aprobado)") AND the "Por edición" table's "Recaudado (aprobado)" column
 * only count `approved` orders — pending/rejected are still visible,
 * correctly bucketed, in the "Por estado" breakdown below.
 */
export default async function AdminRecaudacionPage() {
  await requireAdminUser();

  const supabase = await createClient();
  const summary = await getRevenueSummary(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Recaudación</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Dinero recaudado en toda la plataforma, por edición, método de pago y estado de orden.
      </p>

      <div className="mt-6 rounded-xl border border-surface bg-surface/40 p-5">
        <p className="text-sm text-muted-foreground">Recaudado (aprobado)</p>
        <p className="mt-2 font-display text-3xl text-champagne">
          {formatAmount(summary.totalArs)}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Por edición</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-surface text-muted-foreground">
                  <th className="py-2 pr-4">Edición</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Recaudado (aprobado)</th>
                </tr>
              </thead>
              <tbody>
                {summary.byEdition.map((edition) => (
                  <tr key={edition.editionId} className="border-b border-surface/60">
                    <td className="py-2 pr-4 text-foreground">
                      {edition.editionMonth}/{edition.editionYear}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {EDITION_STATUS_LABELS[edition.editionStatus] ?? edition.editionStatus}
                    </td>
                    <td className="py-2 pr-4 text-champagne">
                      {formatAmount(edition.totalArs)}
                    </td>
                  </tr>
                ))}
                {summary.byEdition.length === 0 ? (
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground" colSpan={3}>
                      Todavía no hay órdenes.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Por método de pago</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-surface text-muted-foreground">
                  <th className="py-2 pr-4">Método</th>
                  <th className="py-2 pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byMethod).map(([method, totalArs]) => (
                  <tr key={method} className="border-b border-surface/60">
                    <td className="py-2 pr-4 text-foreground">
                      {METHOD_LABELS[method] ?? method}
                    </td>
                    <td className="py-2 pr-4 text-champagne">{formatAmount(totalArs)}</td>
                  </tr>
                ))}
                {Object.keys(summary.byMethod).length === 0 ? (
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground" colSpan={2}>
                      Todavía no hay órdenes.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Por estado</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-surface text-muted-foreground">
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byStatus).map(([status, totalArs]) => (
                  <tr key={status} className="border-b border-surface/60">
                    <td className="py-2 pr-4 text-foreground">
                      {STATUS_LABELS[status] ?? status}
                    </td>
                    <td className="py-2 pr-4 text-champagne">{formatAmount(totalArs)}</td>
                  </tr>
                ))}
                {Object.keys(summary.byStatus).length === 0 ? (
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground" colSpan={2}>
                      Todavía no hay órdenes.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
