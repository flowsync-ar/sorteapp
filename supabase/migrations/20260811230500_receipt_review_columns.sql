-- PR7 gap discovered mid-batch (same pattern as PR5's buyer_* columns and
-- PR6's mp_preference_id persistence): the PR2 schema created `receipt` with
-- only (id, order_id, storage_path, uploaded_at, reviewed_at) — no column to
-- record the admin's decision. spec.md §5 requires a receipt-level state
-- machine (`pending` -> `verified` | `rejected`), distinct from
-- `"order".status` (which stays `pending|approved|rejected|expired` and is
-- shared with the Mercado Pago flow).
alter table receipt
  add column status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  add column reject_reason text,
  add column reviewed_by uuid references auth.users (id);

comment on column receipt.status is
  'Admin review state (spec.md §5), independent from "order".status. Driven by lib/receipts/review.ts, mirrors the guarded-update idempotency pattern lib/mercadopago/webhook.ts uses for order transitions.';
