import type { EditionView } from "@/lib/admin/editions";
import type {
  CloseEditionAction,
  PublishWinnerAction,
  SetPrizeImageAction,
} from "@/lib/admin/types";
import { CloseEditionButton } from "./CloseEditionButton";
import { PrizeImageForm } from "./PrizeImageForm";
import { WinnerForm } from "./WinnerForm";

interface EditionsTableProps {
  editions: EditionView[];
  closeAction: (editionId: string) => CloseEditionAction;
  publishAction: (editionId: string) => PublishWinnerAction;
  prizeImageAction: (editionId: string) => SetPrizeImageAction;
}

const STATUS_LABEL: Record<EditionView["status"], string> = {
  draft: "Borrador",
  open: "Abierta",
  closed: "Cerrada",
  drawn: "Sorteada",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatNumber(value: number) {
  return value.toString().padStart(6, "0");
}

/**
 * Edition manager table (tasks.md PR9.4/9.5, design.md §7 `EditionManager` +
 * `WinnerPublisher` — merged into one dense table instead of two separate
 * components, per this batch's "usabilidad de tabla/lista sobre estética
 * editorial" instruction). Server-renderable: takes bound action factories
 * so each row's `CloseEditionButton`/`WinnerForm` island gets its own
 * `editionId`-bound Server Action, same `.bind(null, id)` convention PR7's
 * `uploadReceiptAction` uses.
 */
export function EditionsTable({
  editions,
  closeAction,
  publishAction,
  prizeImageAction,
}: EditionsTableProps) {
  if (editions.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay ediciones.</p>;
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-surface text-muted-foreground">
          <th className="py-2 pr-4">Edición</th>
          <th className="py-2 pr-4">Estado</th>
          <th className="py-2 pr-4">Premio</th>
          <th className="py-2 pr-4">Vendidos</th>
          <th className="py-2 pr-4">Sorteo</th>
          <th className="py-2 pr-4">Foto del premio</th>
          <th className="py-2 pr-4">Acción</th>
        </tr>
      </thead>
      <tbody>
        {editions.map((edition) => (
          <tr key={edition.id} className="border-b border-surface/60 align-top">
            <td className="py-3 pr-4 text-foreground">
              {edition.month}/{edition.year}
            </td>
            <td className="py-3 pr-4 text-muted-foreground">{STATUS_LABEL[edition.status]}</td>
            <td className="py-3 pr-4 text-foreground">{edition.prizeTitle ?? "—"}</td>
            <td className="py-3 pr-4 text-muted-foreground">
              {edition.numbersSold} / {edition.numberCap}
            </td>
            <td className="py-3 pr-4 text-muted-foreground">{formatDate(edition.drawDateIso)}</td>
            <td className="py-3 pr-4">
              <PrizeImageForm
                action={prizeImageAction(edition.id)}
                initialPreviewUrl={edition.prizeImageUrl}
              />
            </td>
            <td className="py-3 pr-4">
              {edition.status === "open" ? (
                <CloseEditionButton action={closeAction(edition.id)} />
              ) : null}
              {edition.status === "closed" ? (
                <WinnerForm action={publishAction(edition.id)} />
              ) : null}
              {edition.status === "drawn" ? (
                <p className="text-champagne">
                  🏆 {edition.winnerNumber !== null ? formatNumber(edition.winnerNumber) : "—"} ·{" "}
                  {edition.winnerDisplayName ?? "Ganador/a"}
                </p>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
