-- pgTAP: receipt review columns (tasks.md PR7.1) + `receipts` Storage bucket
-- RLS (design.md §5). Proves the buyer/admin isolation on storage.objects
-- mirrors the `receipt` table's own RLS (01_rls.sql), and that the new
-- status/reject_reason/reviewed_by columns behave as designed.
begin;
select plan(11);

insert into tier (key, price_ars, numbers_granted)
values ('inicial', 1000, 1)
on conflict (key) do nothing;

insert into raffle_edition (month, year, status, number_cap)
values (1, 2026, 'open', 100)
returning id as edition_id \gset

select test_helpers.create_user('receipt-buyer-a@example.com') as buyer_a \gset
select test_helpers.create_user('receipt-buyer-b@example.com') as buyer_b \gset
select test_helpers.create_user('receipt-admin@example.com', 'admin') as admin_id \gset

insert into "order" (
  id, user_id, edition_id, tier_key, method, status, amount_ars,
  buyer_name, buyer_email, buyer_dni, buyer_phone
)
values (
  gen_random_uuid(), :'buyer_a'::uuid, :'edition_id'::uuid, 'inicial', 'transfer', 'pending', 900,
  'Buyer A', 'receipt-buyer-a@example.com', '30111111', '+5491100000001'
)
returning id as order_a \gset

insert into "order" (
  id, user_id, edition_id, tier_key, method, status, amount_ars,
  buyer_name, buyer_email, buyer_dni, buyer_phone
)
values (
  gen_random_uuid(), :'buyer_b'::uuid, :'edition_id'::uuid, 'inicial', 'transfer', 'pending', 900,
  'Buyer B', 'receipt-buyer-b@example.com', '30222222', '+5491100000002'
)
returning id as order_b \gset

-- Column defaults/check constraint (2.1-equivalent coverage for the PR7 gap).
insert into receipt (order_id, storage_path)
values (:'order_a'::uuid, format('%s/1-comprobante.jpg', :'order_a'))
returning id as receipt_a \gset

select is(
  (select status from receipt where id = :'receipt_a'::uuid),
  'pending',
  'receipt.status defaults to pending'
);
select throws_ok(
  format($$ update receipt set status = 'bogus' where id = %L $$, :'receipt_a'),
  '23514',
  null,
  'receipt.status rejects a value outside pending/verified/rejected'
);

-- Storage RLS: buyer A can insert/select an object under their own order's
-- folder, not buyer B's.
select test_helpers.authenticate_as(:'buyer_a'::uuid);

insert into storage.objects (bucket_id, name, owner)
values ('receipts', format('%s/1-comprobante.jpg', :'order_a'), :'buyer_a'::uuid);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'receipts' and name = format('%s/1-comprobante.jpg', :'order_a')),
  1,
  'buyer A can INSERT+SELECT a storage object under their own order folder'
);

select throws_ok(
  format(
    $$ insert into storage.objects (bucket_id, name, owner) values ('receipts', %L, %L) $$,
    format('%s/1-comprobante.jpg', :'order_b'), :'buyer_a'
  ),
  '42501',
  null,
  'buyer A cannot INSERT a storage object under buyer B''s order folder'
);

select test_helpers.authenticate_as(:'buyer_b'::uuid);
insert into storage.objects (bucket_id, name, owner)
values ('receipts', format('%s/1-comprobante.jpg', :'order_b'), :'buyer_b'::uuid);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'receipts' and name = format('%s/1-comprobante.jpg', :'order_a')),
  0,
  'buyer B cannot SELECT buyer A''s storage object (RLS filters it out)'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'receipts' and name = format('%s/1-comprobante.jpg', :'order_b')),
  1,
  'buyer B can SELECT their own storage object'
);

select test_helpers.authenticate_as_anon();
select is(
  (select count(*)::int from storage.objects where bucket_id = 'receipts'),
  0,
  'anonymous sees zero receipt storage objects'
);

select test_helpers.authenticate_as(:'admin_id'::uuid, 'admin');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'receipts'),
  2,
  'admin can SELECT every receipt storage object across buyers'
);

-- receipt table: owner/admin review-column visibility, mirrors 01_rls.sql's
-- pattern for the pre-existing columns.
select test_helpers.authenticate_as_service_role();
update receipt
set status = 'rejected', reject_reason = 'Monto no coincide', reviewed_by = :'admin_id'::uuid
where id = :'receipt_a'::uuid;

select test_helpers.authenticate_as(:'buyer_a'::uuid);
select is(
  (select reject_reason from receipt where id = :'receipt_a'::uuid),
  'Monto no coincide',
  'buyer A can read the reject_reason on their own receipt'
);

select test_helpers.authenticate_as(:'buyer_b'::uuid);
select is(
  (select count(*)::int from receipt where id = :'receipt_a'::uuid),
  0,
  'buyer B cannot read buyer A''s receipt row'
);

select test_helpers.authenticate_as(:'admin_id'::uuid, 'admin');
select is(
  (select count(*)::int from receipt),
  1,
  'admin can read every receipt row'
);

select * from finish();
rollback;
