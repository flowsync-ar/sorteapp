-- Seed data for local development / preview environments.
-- Loaded automatically by `supabase db reset` (see [db.seed] in config.toml).
-- Tier pricing/números per spec.md section 2 (3 tiers: Inicial/Plus/Premium).
-- track_ids intentionally left empty ('{}') -- course_track lands with the
-- member-area PR; tiers are usable for checkout/number-assignment without it.
insert into tier (key, price_ars, numbers_granted)
values
  ('inicial', 15000, 1),
  ('plus', 35000, 3),
  ('premium', 60000, 6)
on conflict (key) do update set
  price_ars = excluded.price_ars,
  numbers_granted = excluded.numbers_granted;
