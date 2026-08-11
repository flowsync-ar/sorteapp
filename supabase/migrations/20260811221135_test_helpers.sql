-- Test tooling only. Not exposed via the Data API (schema "test_helpers" is not
-- listed in [api].schemas), so it carries no product surface area, only DB-console
-- access. Ships alongside real migrations so pgTAP test files (which each run in
-- their own transaction that gets rolled back) can rely on these functions
-- existing beforehand instead of re-creating and losing them every test file.
create schema if not exists test_helpers;

-- Creates a minimal auth.users row so FK-bound tables (order, raffle_number, ...)
-- can be exercised in tests. app_role, if given, is written into
-- raw_app_meta_data->>'role' so it flows through auth.jwt() the same way real
-- Supabase Auth issues it (app_metadata is server-controlled, unlike user_metadata).
create or replace function test_helpers.create_user(
  p_email text,
  p_app_role text default null
) returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  -- No password hash needed: these fixtures never authenticate through GoTrue,
  -- only via test_helpers.authenticate_as() forging the PostgREST JWT claims.
  insert into auth.users (
    id, instance_id, aud, role, email,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
    now(),
    case when p_app_role is null then '{}'::jsonb else jsonb_build_object('role', p_app_role) end,
    '{}'::jsonb,
    now(), now()
  );
  return v_id;
end;
$$;

-- Impersonates p_user_id as an "authenticated" Data API request for the rest of
-- the current transaction, mirroring how PostgREST forwards the verified JWT via
-- request.jwt.claims + the "authenticated" Postgres role.
-- NOTE: these three deliberately run with INVOKER rights (no "security
-- definer"). Postgres forbids "SET ROLE"/"SET LOCAL role" from inside a
-- security-definer function body (it would let the function escalate its own
-- privileges), so role-switching helpers must run as the caller. That's fine
-- here: tests always connect as the local "postgres" superuser, which already
-- has every local role (anon/authenticated/service_role) granted to it.
create or replace function test_helpers.authenticate_as(
  p_user_id uuid,
  p_app_role text default null
) returns void
language plpgsql
set search_path = public
as $$
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', p_user_id::text,
      'role', 'authenticated',
      'app_metadata', case when p_app_role is null then '{}'::jsonb else jsonb_build_object('role', p_app_role) end
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
end;
$$;

create or replace function test_helpers.authenticate_as_anon() returns void
language plpgsql
set search_path = public
as $$
begin
  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
end;
$$;

create or replace function test_helpers.authenticate_as_service_role() returns void
language plpgsql
set search_path = public
as $$
begin
  perform set_config('request.jwt.claims', '{}', true);
  set local role service_role;
end;
$$;

-- Granted broadly (not just postgres/service_role): tests call these helpers
-- to impersonate anon/authenticated/service_role mid-transaction, so the
-- helper functions themselves must stay callable no matter which role the
-- session has already switched to. Harmless: schema "test_helpers" is not in
-- [api].schemas, so it is never reachable through the Data API.
grant usage on schema test_helpers to public;
grant execute on all functions in schema test_helpers to public;
