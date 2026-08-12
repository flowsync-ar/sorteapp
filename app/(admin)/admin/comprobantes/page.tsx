import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/guard";
import { getReceiptSignedUrl, listPendingReceipts } from "@/lib/admin/receipts";
import { ReceiptQueue, type ReceiptQueueItem } from "@/components/admin/ReceiptQueue";

/**
 * `/admin/comprobantes` (tasks.md PR9.2, spec.md §8 "verificar
 * comprobantes"). Builds the UI on top of PR7's already-shipped
 * `lib/receipts/review.ts` + `POST /api/admin/receipts/[receiptId]/review`
 * — this batch only adds the queue read model (`lib/admin/receipts.ts`) and
 * the `ReceiptQueue` island, it does not touch the review decision logic.
 */
export default async function AdminComprobantesPage() {
  // Re-check pattern documented in lib/admin/guard.ts / app/(member)/layout.tsx:
  // every (admin) page calls this itself, the layout alone is defense-in-depth.
  await requireAdminUser();

  const supabase = await createClient();
  const pending = await listPendingReceipts(supabase);

  const receipts: ReceiptQueueItem[] = await Promise.all(
    pending.map(async (receipt) => ({
      ...receipt,
      signedUrl: await getReceiptSignedUrl(receipt.storagePath, supabase),
    })),
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">
        Comprobantes pendientes
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {receipts.length} comprobante{receipts.length === 1 ? "" : "s"} en cola
      </p>

      <div className="mt-6">
        <ReceiptQueue receipts={receipts} />
      </div>
    </div>
  );
}
