import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/guard";
import { findBuyerOrders } from "@/lib/admin/buyer-profile";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

function formatNumber(value: number) {
  return value.toString().padStart(6, "0");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR");
}

function formatAmount(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const EDITION_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  open: "Abierta",
  closed: "Cerrada",
  drawn: "Sorteada",
};

const METHOD_LABEL: Record<string, string> = {
  mp: "Mercado Pago",
  transfer: "Transferencia",
};

/**
 * `/admin/compradores` (tasks.md admin-panel-v2 work unit 1 "Buyer 360").
 * Search by email or DNI, see every order for that person across every
 * edition — same plain `<form method="get">` + Server Component pattern as
 * `/admin/participantes` (vercel-react-best-practices: no client island
 * needed for URL-driven filtering). Reuses `requireAdminUser()` for
 * defense-in-depth, same as every other `(admin)/admin/*` page.
 */
export default async function AdminCompradoresPage({ searchParams }: PageProps) {
  await requireAdminUser();

  const { q } = await searchParams;
  const identifier = q?.trim();

  const supabase = await createClient();
  const orders = identifier ? await findBuyerOrders(identifier, supabase) : [];
  const buyerName = orders[0]?.buyerName;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Compradores</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Buscá por email o DNI para ver el historial completo de un comprador, en todas las
        ediciones.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="q" className="text-sm font-medium text-foreground">
            Email o DNI
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q ?? ""}
            className="mt-1 rounded-lg border border-surface bg-ink px-3 py-2 text-sm text-foreground"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-champagne px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90"
        >
          Buscar
        </button>
      </form>

      {identifier ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {buyerName ? `${buyerName} — ` : ""}
            {orders.length} orden{orders.length === 1 ? "" : "es"}
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-surface text-muted-foreground">
                  <th className="py-2 pr-4">Edición</th>
                  <th className="py-2 pr-4">Chances</th>
                  <th className="py-2 pr-4">Monto</th>
                  <th className="py-2 pr-4">Método</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Números</th>
                  <th className="py-2 pr-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId} className="border-b border-surface/60">
                    <td className="py-2 pr-4 text-foreground">
                      {order.editionMonth}/{order.editionYear} (
                      {EDITION_STATUS_LABEL[order.editionStatus] ?? order.editionStatus})
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{order.chances}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatAmount(order.amountArs)}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {METHOD_LABEL[order.method] ?? order.method}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </td>
                    <td className="py-2 pr-4 text-champagne">
                      {order.numbers.map(formatNumber).join(", ") || "—"}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatDate(order.createdAtIso)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
