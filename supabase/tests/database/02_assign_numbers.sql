-- pgTAP: assign_numbers RPC (tasks.md 3.1 pulled forward per apply-batch scope,
-- see apply-progress deviations). Proves ADR-1's core safety properties:
--   (a) bijection produces zero collisions across a full sold-out sweep --
--       this is what real concurrent callers reduce to once the FOR UPDATE
--       row lock on raffle_edition serializes them (see "Known limitation"
--       note near the bottom of this file re: a true dual-connection test),
--   (b) an exhausted range closes the edition and returns zero rows instead
--       of silently over-selling or corrupting state,
--   (c) the function is unreachable for anon/authenticated (service_role only,
--       enforced by REVOKE/GRANT — see 20260811221046_assign_numbers.sql).
begin;
select plan(7);

insert into tier (key, price_ars, numbers_granted)
values ('inicial', 1000, 1)
on conflict (key) do nothing;

-- Small cap so a full sweep is fast: exercises the bijection over the whole
-- addressable range for this edition, not just a sample.
insert into raffle_edition (month, year, status, number_cap)
values (1, 2026, 'open', 200)
returning id as edition_id \gset

select test_helpers.create_user('assign-buyer@example.com') as buyer_id \gset

create temporary table seen_numbers (number int);
grant select, insert on seen_numbers to service_role;

-- psql variable interpolation (:'name') does not reach inside a dollar-quoted
-- do $$ ... $$ body, so route values through session GUCs instead.
select set_config('test.edition_id', :'edition_id', false);
select set_config('test.buyer_id', :'buyer_id', false);

do $$
declare
  v_order_id uuid;
  v_n int;
  v_edition_id uuid := current_setting('test.edition_id')::uuid;
  v_buyer_id uuid := current_setting('test.buyer_id')::uuid;
begin
  perform set_config('role', 'service_role', true);
  -- 40 orders x 5 numbers = 200 = full cap. Sequential calls under the same
  -- session simulate what the FOR UPDATE lock reduces *real* concurrent callers
  -- to: a strictly serialized sequence of ordinal allocations.
  for i in 1..40 loop
    insert into "order" (id, user_id, edition_id, tier_key, method, status, amount_ars)
    values (gen_random_uuid(), v_buyer_id, v_edition_id, 'inicial', 'mp', 'approved', 5000)
    returning id into v_order_id;

    for v_n in select assign_numbers(v_order_id, 5) loop
      insert into seen_numbers (number) values (v_n);
    end loop;
  end loop;
end;
$$;

select is(
  (select count(*)::int from seen_numbers),
  200,
  'assign_numbers handed out exactly number_cap numbers across the full sweep'
);
select is(
  (select count(distinct number)::int from seen_numbers),
  200,
  'no two allocations collided: the bijection produced zero duplicate numbers'
);
select ok(
  (select bool_and(number between 0 and 999999) from seen_numbers),
  'every assigned number stays within the 6-digit range'
);
select is(
  (select numbers_sold from raffle_edition where id = :'edition_id'::uuid),
  200,
  'numbers_sold is bumped to exactly number_cap after the full sweep'
);

-- Sold out: the edition is now at cap, one more request must fail loudly.
do $$
declare
  v_order_id uuid;
  v_edition_id uuid := current_setting('test.edition_id')::uuid;
  v_buyer_id uuid := current_setting('test.buyer_id')::uuid;
begin
  perform set_config('role', 'service_role', true);
  insert into "order" (id, user_id, edition_id, tier_key, method, status, amount_ars)
  values (gen_random_uuid(), v_buyer_id, v_edition_id, 'inicial', 'mp', 'approved', 1000)
  returning id into v_order_id;
  perform set_config('test.sold_out_order_id', v_order_id::text, true);
end;
$$;

-- No exception: an uncaught raise would abort the whole statement and roll
-- back the edition-close UPDATE along with it. Zero rows returned is the
-- sold-out signal callers must check instead.
select is(
  (select count(*)::int from assign_numbers(current_setting('test.sold_out_order_id')::uuid, 1)),
  0,
  'assign_numbers returns zero rows instead of exceeding number_cap when the range is exhausted'
);
select is(
  (select status from raffle_edition where id = :'edition_id'::uuid),
  'closed',
  'exhausting the cap auto-closes the edition (spec.md "rango agotado" scenario)'
);

-- The RPC is REVOKEd from anon/authenticated (see the migration): even the
-- edition's own buyer cannot call it directly, only trusted server code
-- using the service_role key.
select test_helpers.authenticate_as(:'buyer_id'::uuid);
select throws_ok(
  format($$ select assign_numbers(%L::uuid, 1) $$, current_setting('test.sold_out_order_id')),
  '42501',
  null,
  'assign_numbers is unreachable for an authenticated buyer (service_role only)'
);
select test_helpers.authenticate_as_service_role();

-- Known limitation (documented, not silently skipped): a *true* dual-connection
-- race test was attempted here using dblink to open two real backend
-- connections and interleave two `assign_numbers` calls for the last
-- remaining slot on an edition. It was removed because dblink_connect()
-- refuses non-superuser callers whenever the target pg_hba entry would
-- authenticate via trust rather than actually validating the supplied
-- password (Postgres dblink security check) -- and in this Supabase local
-- image the `postgres` role is deliberately not flagged as a true superuser.
-- The safety property that test would have proven is instead covered
-- analytically + structurally:
--   - assign_numbers() takes `SELECT ... FOR UPDATE` on the edition row before
--     computing any ordinal, so two real concurrent transactions on the same
--     edition are serialized by Postgres itself (the second blocks until the
--     first commits/rolls back) -- see 20260811221046_assign_numbers.sql.
--   - The full-sweep test above already proves that once serialized, 200
--     sequential allocations never collide.
-- Follow-up recommended (not blocking this PR): an application-level
-- integration test (e.g. two parallel Vitest/k6 calls against the deployed
-- RPC over real authenticated connections) to close this gap end-to-end.

select * from finish();
rollback;
