import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReceiptReviewError, reviewReceipt, type ReceiptDecision } from "@/lib/receipts/review";

const VALID_DECISIONS: ReceiptDecision[] = ["verified", "rejected"];

interface RouteParams {
  params: Promise<{ receiptId: string }>;
}

/**
 * Admin decision endpoint for a comprobante (tasks.md PR7.4). The full
 * admin panel UI (queue, drawer, etc. — design.md §7 `ReceiptReviewDrawer`)
 * is PR9 scope; this route is the minimal server-side surface the review
 * flow needs so it isn't blocked on PR9. Gated by session + `app_metadata.
 * role === "admin"` (the same claim `is_admin()` checks in RLS — see
 * `supabase/migrations/*_rls.sql`), using the session-scoped client so the
 * caller's own JWT is what's checked, not a self-reported id.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { receiptId } = await params;
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (userData.user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { decision?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!VALID_DECISIONS.includes(body.decision as ReceiptDecision)) {
    return NextResponse.json({ error: "invalid decision" }, { status: 400 });
  }

  try {
    const outcome = await reviewReceipt(receiptId, body.decision as ReceiptDecision, {
      reviewedBy: userData.user.id,
      reason: body.reason,
    });
    return NextResponse.json(outcome, { status: 200 });
  } catch (error) {
    if (error instanceof ReceiptReviewError) {
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }
    throw error;
  }
}
