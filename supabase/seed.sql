-- Seed data for local development / preview environments.
-- Loaded automatically by `supabase db reset` (see [db.seed] in config.toml).
-- Tiers are per-edition now (change: edition_tiers) -- created via the admin
-- price calculator when an edition is created, not seeded globally here.

-- Fixed local admin account (same real-GoTrue-user shape as
-- e2e/helpers/adminUser.ts's createAdminUser) so /admin can be reached with
-- stable credentials after a `supabase db reset` instead of the throwaway
-- Date.now()-suffixed emails the e2e suite creates per run.
-- Login: sorteapp@admin.com / Disney2026!
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
select
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'sorteapp@admin.com', crypt('Disney2026!', gen_salt('bf')),
  now(), '{"role":"admin"}'::jsonb, '{}'::jsonb,
  now(), now(), '', '', '', ''
where not exists (
  select 1 from auth.users where email = 'sorteapp@admin.com'
);
