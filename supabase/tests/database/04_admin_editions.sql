-- pgTAP: admin edition management (tasks.md PR9.4, spec.md §8 "cargar
-- resultado del sorteo... publicar ganador"). Covers the new `draw_date`/
-- `winner_display_name` columns (20260811231500_admin_editions.sql) and
-- proves the write path is genuinely admin-only via RLS (raffle_edition
-- already has `raffle_edition_admin_all`/`raffle_edition_public_select`
-- from 20260811221044_rls.sql — this file exercises them against the new
-- columns instead of re-testing the policies themselves).
begin;
select plan(9);

select has_column('public', 'raffle_edition', 'draw_date', 'raffle_edition.draw_date exists');
select has_column(
  'public', 'raffle_edition', 'winner_display_name',
  'raffle_edition.winner_display_name exists'
);

select test_helpers.create_user('edition-admin@example.com', 'admin') as admin_id \gset
select test_helpers.create_user('edition-buyer@example.com') as buyer_id \gset

-- Admin can create a new edition with a draw_date (tasks.md PR9.4 "crear
-- nueva edición... fecha de sorteo").
select test_helpers.authenticate_as(:'admin_id'::uuid, 'admin');
select lives_ok(
  $$
    insert into raffle_edition (month, year, status, number_cap, prize_title, draw_date)
    values (9, 2026, 'open', 100, 'Premio de prueba', now() + interval '30 days')
  $$,
  'admin can create a new edition with a draw_date'
);

-- A non-admin authenticated session cannot (RLS blocks the write, not just
-- the table-level GRANT -- authenticated already has insert/update/delete
-- GRANTed on raffle_edition per 20260811221044_rls.sql).
select test_helpers.authenticate_as(:'buyer_id'::uuid);
select throws_ok(
  $$
    insert into raffle_edition (month, year, status, number_cap)
    values (10, 2026, 'draft', 100)
  $$,
  '42501',
  null,
  'a non-admin authenticated session cannot create a raffle_edition'
);

-- Admin publishes a winner on a closed edition: status -> drawn,
-- winner_number + winner_display_name set (lib/admin/winners.ts).
select test_helpers.authenticate_as(:'admin_id'::uuid, 'admin');
insert into raffle_edition (month, year, status, number_cap, prize_title)
values (8, 2026, 'closed', 100, 'Premio cerrado')
returning id as closed_edition_id \gset

update raffle_edition
set status = 'drawn', winner_number = 555555, winner_display_name = 'Ana T.'
where id = :'closed_edition_id'::uuid;

-- Public (anon) can read the published winner's scrubbed data -- the
-- `raffle_edition_public_select` policy already allows status <> 'draft'.
select test_helpers.authenticate_as_anon();
select is(
  (
    select winner_display_name from raffle_edition
    where id = :'closed_edition_id'::uuid
  ),
  'Ana T.',
  'anon can read the winner_display_name of a drawn edition (curated, no raw PII)'
);

-- Prize catalog (admin-panel-v2 work unit 3): multiple `draft` editions
-- coexist freely, and activating one (draft -> open) only fails once
-- another edition is already `open` — raffle_edition_single_open
-- (20260811221041_schema.sql) indexes `(true) where status = 'open'` only,
-- so `draft` rows never collide with it or with each other.
select test_helpers.authenticate_as(:'admin_id'::uuid, 'admin');

-- This file's earlier `lives_ok` test left an `open` edition behind
-- (month 9 / year 2026) -- close it first so the draft-activation
-- assertions below start from a clean "no edition currently open" state.
update raffle_edition set status = 'closed'
where month = 9 and year = 2026 and status = 'open';

select lives_ok(
  $$
    insert into raffle_edition (month, year, status, number_cap, prize_title)
    values (11, 2030, 'draft', 100, 'Premio futuro 1')
  $$,
  'admin can create a first draft edition while other editions exist'
);

select lives_ok(
  $$
    insert into raffle_edition (month, year, status, number_cap, prize_title)
    values (12, 2030, 'draft', 100, 'Premio futuro 2')
  $$,
  'admin can create a second draft edition alongside the first (no conflict between drafts)'
);

select lives_ok(
  $$
    update raffle_edition set status = 'open'
    where month = 11 and year = 2030 and status = 'draft'
  $$,
  'lib/admin/editions.ts#publishEdition: draft -> open succeeds when no edition is currently open'
);

select throws_ok(
  $$
    update raffle_edition set status = 'open'
    where month = 12 and year = 2030 and status = 'draft'
  $$,
  '23505',
  null,
  'activating a second draft while one is already open violates raffle_edition_single_open'
);

select * from finish();
rollback;
