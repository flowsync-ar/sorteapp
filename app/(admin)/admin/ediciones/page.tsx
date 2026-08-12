import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/guard";
import { listEditions } from "@/lib/admin/editions";
import { CreateEditionForm } from "@/components/admin/CreateEditionForm";
import { EditionsTable } from "@/components/admin/EditionsTable";
import {
  closeEditionAction,
  createEditionAction,
  publishWinnerAction,
  setPrizeImageAction,
} from "./actions";

/**
 * `/admin/ediciones` (tasks.md PR9.4/9.5, spec.md §8). Create/close editions
 * and publish a sorteo's winner — the "una sola edición open" constraint
 * (PR2's `raffle_edition_single_open` partial unique index) is enforced by
 * the database itself; `lib/admin/editions.ts#createEdition` just turns its
 * `23505` into `CreateEditionForm`'s own error message.
 */
export default async function AdminEdicionesPage() {
  await requireAdminUser();

  const supabase = await createClient();
  const editions = await listEditions(supabase);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-foreground">Ediciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo puede haber una edición abierta a la vez.
        </p>
        <div className="mt-6 rounded-xl border border-surface bg-surface/40 p-5">
          <CreateEditionForm action={createEditionAction} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl text-foreground">Todas las ediciones</h2>
        <div className="mt-4 overflow-x-auto">
          <EditionsTable
            editions={editions}
            closeAction={(editionId) => closeEditionAction.bind(null, editionId)}
            publishAction={(editionId) => publishWinnerAction.bind(null, editionId)}
            prizeImageAction={(editionId) => setPrizeImageAction.bind(null, editionId)}
          />
        </div>
      </div>
    </div>
  );
}
