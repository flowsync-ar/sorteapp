-- Tiers become per-edition, admin-configurable via a price calculator seeded
-- from the prize's real cost. Previously `tier` was a single global catalog
-- of 3 fixed rows (inicial/plus/premium) shared by every edition (see the
-- now-removed deviation note in lib/admin/editions.ts). Each edition now
-- gets its own set of "N chances for $X" rows.
--
-- Safe to run as plain ALTERs with no backfill: migrations always apply to
-- an empty schema before supabase/seed.sql inserts any rows (`supabase db
-- reset` order), so tier/"order" have zero rows at this point.

-- order.tier_key (FK on tier.key) has to go before tier.key itself.
alter table "order" drop constraint order_tier_key_fkey;
alter table "order" drop column tier_key;
alter table "order" add column tier_id uuid not null references tier (id);

alter table tier drop constraint tier_key_check;
alter table tier drop constraint tier_key_key;
alter table tier drop column key;
alter table tier add column edition_id uuid not null references raffle_edition (id);
-- Prevents the admin calculator from creating two tiers with the same
-- chance count within the same edition.
alter table tier add constraint tier_edition_id_numbers_granted_key unique (edition_id, numbers_granted);

-- Calculator input memory: lets the admin re-open an edition's tier table
-- and regenerate suggestions from the same cost basis instead of guessing
-- again from scratch.
alter table raffle_edition add column prize_cost_ars numeric(12, 2);
