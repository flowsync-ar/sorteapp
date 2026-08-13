import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RECEIPTS_BUCKET } from "@/lib/receipts/upload";

export class AdminReceiptsError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AdminReceiptsError";
  }
}

export interface PendingReceiptView {
  id: string;
  orderId: string;
  storagePath: string;
  uploadedAt: string;
  buyerName: string;
  buyerEmail: string;
  chances: number;
  amountArs: number;
}

type ReceiptsQueryClient = Pick<SupabaseClient, "from">;
type StorageClient = Pick<SupabaseClient, "storage">;

interface PendingReceiptRow {
  id: string;
  order_id: string;
  storage_path: string;
  uploaded_at: string;
  order: {
    buyer_name: string;
    buyer_email: string;
    amount_ars: string | number;
    tier: { numbers_granted: number } | null;
  } | null;
}

/**
 * Reads the comprobante review queue (tasks.md PR9.2, spec.md §5 "Carga y
 * verificación"). Reuses PR7's `receipt`/`order` tables and RLS (admin sees
 * every row via `receipt_admin_all`/`order_admin_all`) — this is a read-only
 * data shaper for the queue UI; the actual verify/reject decision still goes
 * through PR7's `lib/receipts/review.ts` + its Route Handler, not duplicated
 * here.
 */
export async function listPendingReceipts(
  client: ReceiptsQueryClient,
): Promise<PendingReceiptView[]> {
  const { data, error } = await client
    .from("receipt")
    .select(
      "id, order_id, storage_path, uploaded_at, order:order_id(buyer_name, buyer_email, amount_ars, tier:tier_id(numbers_granted))",
    )
    .eq("status", "pending")
    .order("uploaded_at", { ascending: true });

  if (error) {
    throw new AdminReceiptsError("No pudimos leer los comprobantes pendientes.", error);
  }

  const rows = (data ?? []) as unknown as PendingReceiptRow[];

  return rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    storagePath: row.storage_path,
    uploadedAt: row.uploaded_at,
    buyerName: row.order?.buyer_name ?? "",
    buyerEmail: row.order?.buyer_email ?? "",
    chances: row.order?.tier?.numbers_granted ?? 0,
    amountArs: Number(row.order?.amount_ars ?? 0),
  }));
}

const SIGNED_URL_EXPIRES_IN_SECONDS = 300;

/**
 * Short-lived signed URL to view a comprobante file (design.md §5 "Admin
 * reviews via short-lived SIGNED URL"). The bucket stays private forever —
 * this is the only sanctioned way to read a comprobante's contents.
 */
export async function getReceiptSignedUrl(
  storagePath: string,
  client: StorageClient,
  expiresInSeconds: number = SIGNED_URL_EXPIRES_IN_SECONDS,
): Promise<string> {
  const { data, error } = await client.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw new AdminReceiptsError("No pudimos generar el link del comprobante.", error);
  }

  return data.signedUrl;
}
