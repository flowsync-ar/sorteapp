-- ADR-1 (design.md section 2): concurrency-safe number assignment.
-- SECURITY DEFINER RPC, one transaction:
--   1. SELECT ... FOR UPDATE on raffle_edition -> serializes concurrent callers
--      on the same edition to a single hot-row lock.
--   2. Guard numbers_sold + qty <= number_cap, else close the edition and raise.
--   3. Map each ordinal i in [numbers_sold, numbers_sold+qty) through the
--      per-edition bijection f(i) = (a*i + c) mod 1_000_000 -> zero collisions,
--      no retry loop, non-sequential (doesn't leak how many numbers are sold).
--   4. Insert into raffle_number (unique(edition_id, number) = defense-in-depth),
--      bump numbers_sold, commit.
--
-- Not exposed to anon/authenticated via GRANT (REVOKE below) so it can only be
-- invoked with the service_role key from trusted server code (MP webhook,
-- comprobante-approval Server Action) -- never directly from the browser.
create or replace function assign_numbers(p_order_id uuid, p_qty int)
returns setof int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_edition_id uuid;
  v_user_id uuid;
  v_cap int;
  v_sold int;
  v_a bigint;
  v_c bigint;
  v_i int;
  v_number int;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'assign_numbers: qty must be positive, got %', p_qty
      using errcode = '22023'; -- invalid_parameter_value
  end if;

  select o.edition_id, o.user_id into v_edition_id, v_user_id
  from "order" o
  where o.id = p_order_id;

  if v_edition_id is null then
    raise exception 'assign_numbers: order not found: %', p_order_id
      using errcode = 'P0002'; -- no_data_found
  end if;

  -- Lock the edition row: this single lock is what makes concurrent callers on
  -- the same edition behave as if serialized, which is the property the pgTAP
  -- concurrency tests exercise.
  select number_cap, numbers_sold, permutation_key, permutation_offset
    into v_cap, v_sold, v_a, v_c
    from raffle_edition
    where id = v_edition_id
    for update;

  if v_sold + p_qty > v_cap then
    -- Deliberately NOT `raise exception` here: an uncaught exception aborts the
    -- whole statement, which would roll back this very UPDATE along with it
    -- (Postgres statement atomicity) -- discovered by the pgTAP sold-out test
    -- failing with status still 'open' after a raise. Emitting a WARNING and
    -- returning zero rows lets the edition-close commit while still giving
    -- callers an unambiguous signal: fewer rows returned than requested means
    -- sold out (spec.md "rango agotado" -> close edition, offer the next one).
    update raffle_edition set status = 'closed' where id = v_edition_id and status = 'open';
    raise warning 'assign_numbers: edition sold out (cap=%, sold=%, requested=%), edition closed', v_cap, v_sold, p_qty;
    return;
  end if;

  for v_i in v_sold .. (v_sold + p_qty - 1) loop
    v_number := ((v_a * v_i + v_c) % 1000000)::int;
    insert into raffle_number (edition_id, order_id, user_id, number)
    values (v_edition_id, p_order_id, v_user_id, v_number);
    return next v_number;
  end loop;

  update raffle_edition set numbers_sold = numbers_sold + p_qty where id = v_edition_id;
  return;
end;
$$;

revoke all on function assign_numbers(uuid, int) from public, anon, authenticated;
grant execute on function assign_numbers(uuid, int) to service_role;
