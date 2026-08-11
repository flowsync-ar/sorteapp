-- Core schema for raffle-platform: editions, tiers, orders, assigned numbers,
-- receipts. Mirrors design.md section 2 (Data model). course_track/track_lesson/
-- course_access are out of scope for this PR (not required by tasks.md 2.x; land
-- with the member-area/PR8 work).
create extension if not exists pgtap;
create extension if not exists pgcrypto; -- gen_random_uuid()

create table raffle_edition (
  id uuid primary key default gen_random_uuid(),
  month int not null check (month between 1 and 12),
  year int not null check (year >= 2024),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'drawn')),
  number_cap int not null check (number_cap > 0 and number_cap <= 1000000),
  numbers_sold int not null default 0 check (numbers_sold >= 0),
  prize_title text,
  prize_image text,
  acta_pdf_path text,
  winner_number int check (winner_number between 0 and 999999),
  winner_participant_id uuid references auth.users (id),
  -- ADR-1: per-edition bijection f(i) = (permutation_key * i + permutation_offset) mod 1_000_000.
  -- permutation_key ("a") must be coprime with 1_000_000 to guarantee a full-period
  -- bijection over the 6-digit space (see assign_numbers migration).
  permutation_key bigint check (permutation_key is null or gcd(permutation_key, 1000000) = 1),
  permutation_offset bigint check (permutation_offset is null or permutation_offset between 0 and 999999),
  created_at timestamptz not null default now(),
  constraint numbers_sold_within_cap check (numbers_sold <= number_cap)
);

-- Risk called out explicitly in design.md "Open risks": only one open edition at a time.
-- The (true) trick makes every matching row collide on the same indexed value.
create unique index raffle_edition_single_open on raffle_edition ((true)) where status = 'open';

create or replace function raffle_edition_default_permutation()
returns trigger
language plpgsql
as $$
declare
  v_a bigint;
begin
  if new.permutation_key is null then
    loop
      v_a := 1 + floor(random() * 999999)::bigint;
      exit when gcd(v_a, 1000000) = 1;
    end loop;
    new.permutation_key := v_a;
  end if;
  if new.permutation_offset is null then
    new.permutation_offset := floor(random() * 1000000)::bigint;
  end if;
  return new;
end;
$$;

create trigger trg_raffle_edition_default_permutation
before insert on raffle_edition
for each row execute function raffle_edition_default_permutation();

create table tier (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in ('inicial', 'plus', 'premium')),
  price_ars numeric(12, 2) not null check (price_ars > 0),
  numbers_granted int not null check (numbers_granted > 0),
  track_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- "order" is a reserved SQL keyword; always double-quoted, matching design.md naming.
create table "order" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  edition_id uuid not null references raffle_edition (id),
  tier_key text not null references tier (key),
  method text not null check (method in ('mp', 'transfer')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  amount_ars numeric(12, 2) not null check (amount_ars > 0),
  mp_payment_id text unique,
  mp_preference_id text,
  reject_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id)
);

create index order_user_id_idx on "order" (user_id);
create index order_edition_id_idx on "order" (edition_id);

create table raffle_number (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references raffle_edition (id),
  order_id uuid not null references "order" (id),
  user_id uuid not null references auth.users (id),
  number int not null check (number between 0 and 999999),
  created_at timestamptz not null default now(),
  -- Defense-in-depth per ADR-1: the bijection already guarantees uniqueness,
  -- this constraint makes a collision impossible to persist even under a bug.
  unique (edition_id, number)
);

create index raffle_number_user_id_idx on raffle_number (user_id);
create index raffle_number_order_id_idx on raffle_number (order_id);

create table receipt (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references "order" (id),
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz
);
