import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/guard";
import { listEditions } from "@/lib/admin/editions";
import { listParticipants } from "@/lib/admin/participants";

interface PageProps {
  searchParams: Promise<{ edition?: string; q?: string }>;
}

function formatNumber(value: number) {
  return value.toString().padStart(6, "0");
}

/**
 * `/admin/participantes` (tasks.md PR9.3, spec.md §8 "buscar participantes
 * por edición/número"). A plain `<form method="get">` drives the edition +
 * text filters through the URL's `searchParams` — no client JS needed
 * (vercel-react-best-practices: avoid a client island where a Server
 * Component + URL state does the same job).
 */
export default async function AdminParticipantesPage({ searchParams }: PageProps) {
  await requireAdminUser();

  const { edition: editionParam, q } = await searchParams;
  const supabase = await createClient();
  const editions = await listEditions(supabase);

  const selectedEditionId =
    editionParam ?? editions.find((e) => e.status === "open")?.id ?? editions[0]?.id;

  const participants = selectedEditionId
    ? await listParticipants(selectedEditionId, supabase, q)
    : [];

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Participantes</h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="edition" className="text-sm font-medium text-foreground">
            Edición
          </label>
          <select
            id="edition"
            name="edition"
            defaultValue={selectedEditionId}
            className="mt-1 rounded-lg border border-surface bg-ink px-3 py-2 text-sm text-foreground"
          >
            {editions.map((edition) => (
              <option key={edition.id} value={edition.id}>
                {edition.month}/{edition.year} ({edition.status})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="q" className="text-sm font-medium text-foreground">
            Buscar (nombre, email o número)
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
          Filtrar
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        {participants.length} participante{participants.length === 1 ? "" : "s"}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-surface text-muted-foreground">
              <th className="py-2 pr-4">Comprador</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Tier</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Números</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.orderId} className="border-b border-surface/60">
                <td className="py-2 pr-4 text-foreground">{participant.buyerName}</td>
                <td className="py-2 pr-4 text-muted-foreground">{participant.buyerEmail}</td>
                <td className="py-2 pr-4 text-muted-foreground">{participant.tierKey}</td>
                <td className="py-2 pr-4 text-muted-foreground">{participant.status}</td>
                <td className="py-2 pr-4 text-champagne">
                  {participant.numbers.map(formatNumber).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
