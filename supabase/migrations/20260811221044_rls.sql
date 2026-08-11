-- RLS per design.md section 3: buyers see only their own orders/numbers, admin
-- (app_metadata.role='admin') sees everything, public sees only published
-- catalog/aggregate data. Matches spec.md sections 7 (member area) and 9 (admin
-- panel protection).

-- app_metadata is set server-side only (service_role / Supabase Admin API), never
-- editable by the end user — unlike user_metadata, safe to gate RLS on.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant execute on function is_admin() to anon, authenticated;

alter table raffle_edition enable row level security;
alter table tier enable row level security;
alter table "order" enable row level security;
alter table raffle_number enable row level security;
alter table receipt enable row level security;

-- raffle_edition: public sees published (non-draft) editions; admin sees/manages all.
create policy raffle_edition_public_select on raffle_edition
  for select to anon, authenticated
  using (status <> 'draft');

create policy raffle_edition_admin_all on raffle_edition
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- tier: always public (pricing/catalog), admin-only writes.
create policy tier_public_select on tier
  for select to anon, authenticated
  using (true);

create policy tier_admin_all on tier
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- "order": owner can read/create their own; no client UPDATE (status transitions
-- are RPC/admin-only, per design.md); admin has full access.
create policy order_owner_select on "order"
  for select to authenticated
  using (auth.uid() = user_id);

create policy order_owner_insert on "order"
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy order_admin_all on "order"
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- raffle_number: owner/admin read-only via RLS; the only writer is the
-- SECURITY DEFINER assign_numbers() RPC (owned by the migration role, which
-- bypasses RLS as the table owner) — no INSERT/UPDATE policy is granted here
-- on purpose, so direct client writes are rejected (42501).
create policy raffle_number_owner_select on raffle_number
  for select to authenticated
  using (auth.uid() = user_id);

create policy raffle_number_admin_select on raffle_number
  for select to authenticated
  using (is_admin());

-- receipt: owner can read/upload for their own order; admin manages all
-- (verify/reject flow lands in PR7).
create policy receipt_owner_select on receipt
  for select to authenticated
  using (auth.uid() = (select o.user_id from "order" o where o.id = receipt.order_id));

create policy receipt_owner_insert on receipt
  for insert to authenticated
  with check (auth.uid() = (select o.user_id from "order" o where o.id = receipt.order_id));

create policy receipt_admin_all on receipt
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- Table-level GRANTs. This project's local config leaves `auto_expose_new_tables`
-- at its new (safer) default of *off*, so tables created in `public` are NOT
-- auto-exposed to the Data API roles — RLS policies alone are not enough, the
-- role also needs the underlying SQL privilege before a policy is even
-- evaluated. Grants are scoped to exactly what each RLS policy above allows;
-- raffle_number stays write-locked for anon/authenticated on purpose (only the
-- SECURITY DEFINER assign_numbers() RPC writes it, running as the table owner).
grant select on raffle_edition to anon, authenticated;
grant insert, update, delete on raffle_edition to authenticated;

grant select on tier to anon, authenticated;
grant insert, update, delete on tier to authenticated;

grant select, insert on "order" to authenticated;
grant update, delete on "order" to authenticated;

grant select on raffle_number to authenticated;

-- anon also needs the base SELECT privilege to even run a query against
-- "order"/raffle_number -- RLS then filters every row out (no anon policy
-- exists on either table), giving a correctly-empty result instead of a
-- permission-denied error.
grant select on "order", raffle_number to anon;

grant select, insert on receipt to authenticated;
grant update, delete on receipt to authenticated;

-- service_role is the trusted server-side role (webhook handler, comprobante
-- Server Actions, admin client) and already has BYPASSRLS locally, but table
-- privileges are still a separate check from RLS -- it needs explicit grants
-- too under this project's `auto_expose_new_tables = off` default.
grant select, insert, update, delete on raffle_edition, tier, "order", raffle_number, receipt to service_role;
