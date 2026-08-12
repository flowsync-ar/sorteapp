import type { MemberOrderView } from "@/lib/member/access";

interface OrdersListProps {
  orders: MemberOrderView[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Zero-pads a raffle number to the 6-digit display format (spec.md §6). */
function formatNumber(value: number) {
  return value.toString().padStart(6, "0");
}

/**
 * "Mis órdenes" list (tasks.md PR8.3, spec.md §7 "ve el/los cursos de su
 * tier y sus números asignados"). Pure presentational component — data
 * comes pre-shaped from `lib/member/access.ts`'s `getMemberAccountOverview`.
 */
export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no tenés compras. Elegí tu tier desde la página principal.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-xl border border-surface bg-surface/40 p-5"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{order.tierKey}</span>
            <span className="text-sm text-muted-foreground">
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatArs(order.amountArs)} · #{order.id.slice(0, 8)}
          </p>
          {order.numbers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {order.numbers.map((number) => (
                <span
                  key={number}
                  className="rounded-lg bg-champagne/10 px-3 py-1 font-display text-champagne"
                >
                  {formatNumber(number)}
                </span>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
