-- pgTAP: schema shape + structural constraints for raffle-platform core tables.
-- Covers tasks.md 2.1: raffle_edition, tier, "order", raffle_number, receipt,
-- unique(edition_id, number) defense-in-depth, single-open-edition partial unique index.
begin;
select plan(23);

-- Tables exist
select has_table('public', 'raffle_edition', 'raffle_edition table exists');
select has_table('public', 'tier', 'tier table exists');
select has_table('public', 'order', 'order table exists');
select has_table('public', 'raffle_number', 'raffle_number table exists');
select has_table('public', 'receipt', 'receipt table exists');

-- Primary keys
select col_is_pk('public', 'raffle_edition', 'id', 'raffle_edition.id is PK');
select col_is_pk('public', 'tier', 'id', 'tier.id is PK');
select col_is_pk('public', 'order', 'id', 'order.id is PK');
select col_is_pk('public', 'raffle_number', 'id', 'raffle_number.id is PK');
select col_is_pk('public', 'receipt', 'id', 'receipt.id is PK');

-- raffle_edition key columns
select has_column('public', 'raffle_edition', 'status', 'raffle_edition.status exists');
select has_column('public', 'raffle_edition', 'number_cap', 'raffle_edition.number_cap exists');
select has_column('public', 'raffle_edition', 'permutation_key', 'raffle_edition.permutation_key exists (ADR-1 bijection)');
select col_not_null('public', 'raffle_edition', 'number_cap', 'number_cap is NOT NULL');

-- raffle_number: 6-digit range + defense-in-depth unique(edition_id, number)
select col_is_unique('public', 'raffle_number', array['edition_id', 'number'], 'raffle_number has unique(edition_id, number)');

-- RLS is enabled on every RLS-bearing table
select is(relrowsecurity, true, 'raffle_edition has RLS enabled')
  from pg_class where relname = 'raffle_edition' and relnamespace = 'public'::regnamespace;
select is(relrowsecurity, true, 'order has RLS enabled')
  from pg_class where relname = 'order' and relnamespace = 'public'::regnamespace;
select is(relrowsecurity, true, 'raffle_number has RLS enabled')
  from pg_class where relname = 'raffle_number' and relnamespace = 'public'::regnamespace;
select is(relrowsecurity, true, 'receipt has RLS enabled')
  from pg_class where relname = 'receipt' and relnamespace = 'public'::regnamespace;

-- Behavioral constraint tests (functional, not just structural)
insert into tier (key, price_ars, numbers_granted)
values ('inicial', 1000, 1)
on conflict (key) do nothing;

insert into raffle_edition (month, year, status, number_cap)
values (1, 2026, 'open', 100);

select throws_ok(
  $$ insert into raffle_edition (month, year, status, number_cap) values (2, 2026, 'open', 100) $$,
  '23505',
  null,
  'only one open edition allowed at a time (partial unique index)'
);

select lives_ok(
  $$ insert into raffle_edition (month, year, status, number_cap) values (2, 2026, 'closed', 100) $$,
  'a second closed edition is allowed (partial index only guards status=open)'
);

select throws_ok(
  $$ insert into raffle_edition (month, year, status, number_cap) values (3, 2026, 'weird', 100) $$,
  '23514',
  null,
  'status is constrained to the known enum values'
);

select test_helpers.create_user('schema-test-buyer@example.com') as buyer_id \gset

insert into "order" (id, user_id, edition_id, tier_key, method, status, amount_ars)
select gen_random_uuid(), :'buyer_id'::uuid, id, 'inicial', 'mp', 'approved', 1000
from raffle_edition where status = 'open' limit 1
returning id as order_id \gset

select throws_ok(
  format(
    $$ insert into raffle_number (edition_id, order_id, user_id, number)
       select edition_id, %L, %L, 1000000 from "order" where id = %L $$,
    :'order_id', :'buyer_id', :'order_id'
  ),
  '23514',
  null,
  'raffle_number.number is bounded to 0..999999'
);

select * from finish();
rollback;
