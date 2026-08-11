-- pgTAP: RLS policies (tasks.md 2.2). Verifies buyer/owner isolation, admin
-- bypass, and public-can-only-see-published semantics, per design.md section 3
-- and spec.md sections 7/9 (member area access, admin-only panel).
begin;
select plan(14);

insert into tier (key, price_ars, numbers_granted)
values ('inicial', 1000, 1)
on conflict (key) do nothing;

insert into raffle_edition (month, year, status, number_cap)
values (1, 2026, 'open', 100)
returning id as edition_id \gset

select test_helpers.create_user('rls-buyer-a@example.com') as buyer_a \gset
select test_helpers.create_user('rls-buyer-b@example.com') as buyer_b \gset
select test_helpers.create_user('rls-admin@example.com', 'admin') as admin_id \gset

-- Seed one order per buyer as postgres (owner/superuser, bypasses RLS for setup)
insert into "order" (id, user_id, edition_id, tier_key, method, status, amount_ars)
values (gen_random_uuid(), :'buyer_a'::uuid, :'edition_id'::uuid, 'inicial', 'mp', 'approved', 1000)
returning id as order_a \gset

insert into "order" (id, user_id, edition_id, tier_key, method, status, amount_ars)
values (gen_random_uuid(), :'buyer_b'::uuid, :'edition_id'::uuid, 'inicial', 'mp', 'approved', 1000)
returning id as order_b \gset

insert into raffle_number (edition_id, order_id, user_id, number)
values (:'edition_id'::uuid, :'order_a'::uuid, :'buyer_a'::uuid, 111111);

insert into raffle_number (edition_id, order_id, user_id, number)
values (:'edition_id'::uuid, :'order_b'::uuid, :'buyer_b'::uuid, 222222);

-- Buyer A can see own order, not buyer B's
select test_helpers.authenticate_as(:'buyer_a'::uuid);

select is(
  (select count(*)::int from "order" where id = :'order_a'::uuid),
  1,
  'buyer A can select their own order'
);
select is(
  (select count(*)::int from "order" where id = :'order_b'::uuid),
  0,
  'buyer A cannot select buyer B''s order (RLS blocks cross-user access)'
);
select is(
  (select count(*)::int from raffle_number where order_id = :'order_a'::uuid),
  1,
  'buyer A can select their own raffle_number'
);
select is(
  (select count(*)::int from raffle_number where order_id = :'order_b'::uuid),
  0,
  'buyer A cannot select buyer B''s raffle_number'
);
-- RLS silently filters rows out of an UPDATE's target set rather than raising:
-- a blocked write is 0 rows affected, not an exception. Prove the row is
-- untouched instead of expecting a thrown error.
update "order" set status = 'rejected' where id = :'order_a'::uuid;
select is(
  (select status from "order" where id = :'order_a'::uuid),
  'approved',
  'buyer A''s direct UPDATE on their own order is silently blocked by RLS (RPC/admin-only writer)'
);
select throws_ok(
  format(
    $$ insert into raffle_number (edition_id, order_id, user_id, number) values (%L, %L, %L, 333333) $$,
    :'edition_id', :'order_a', :'buyer_a'
  ),
  '42501',
  null,
  'buyer A cannot INSERT into raffle_number directly (RPC-only writer)'
);

-- Buyer B: same isolation, opposite direction
select test_helpers.authenticate_as(:'buyer_b'::uuid);
select is(
  (select count(*)::int from "order" where id = :'order_b'::uuid),
  1,
  'buyer B can select their own order'
);
select is(
  (select count(*)::int from "order" where id = :'order_a'::uuid),
  0,
  'buyer B cannot select buyer A''s order'
);

-- Anonymous: no order/raffle_number visibility, but public catalog tables readable
select test_helpers.authenticate_as_anon();
select is(
  (select count(*)::int from "order"),
  0,
  'anonymous sees zero orders'
);
select is(
  (select count(*)::int from raffle_number),
  0,
  'anonymous sees zero raffle_number rows'
);
select is(
  (select count(*)::int from tier where key = 'inicial'),
  1,
  'anonymous can read public tier catalog'
);
select is(
  (select count(*)::int from raffle_edition where status = 'open'),
  1,
  'anonymous can read the open raffle_edition (public catalog)'
);

-- Admin: full visibility across both buyers
select test_helpers.authenticate_as(:'admin_id'::uuid, 'admin');
select is(
  (select count(*)::int from "order"),
  2,
  'admin can select all orders across buyers'
);
select is(
  (select count(*)::int from raffle_number),
  2,
  'admin can select all raffle_number rows across buyers'
);

select * from finish();
rollback;
