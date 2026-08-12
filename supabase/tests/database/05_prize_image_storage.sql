-- pgTAP: `prize-images` Storage bucket RLS (change: prize-image, design.md
-- §1 "Storage migration"). Proves the bucket is genuinely public for reads
-- and admin-only for writes, mirroring 03_receipt_review.sql's style for
-- the `receipts` bucket (private there; public here on purpose).
begin;
select plan(7);

select test_helpers.create_user('prize-image-admin@example.com', 'admin') as admin_id \gset
select test_helpers.create_user('prize-image-buyer@example.com') as buyer_id \gset

select is(
  (select public from storage.buckets where id = 'prize-images'),
  true,
  'prize-images bucket exists and is public'
);

-- Non-admin authenticated session cannot write (INSERT) into the bucket.
select test_helpers.authenticate_as(:'buyer_id'::uuid);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner) values ('prize-images', 'edition-1', null) $$,
  '42501',
  null,
  'a non-admin authenticated session cannot INSERT a prize-images object'
);

-- Admin can INSERT (initial upload).
select test_helpers.authenticate_as(:'admin_id'::uuid, 'admin');
insert into storage.objects (bucket_id, name, owner)
values ('prize-images', 'edition-1', :'admin_id'::uuid);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'prize-images' and name = 'edition-1'),
  1,
  'admin can INSERT a prize-images object'
);

-- Admin can UPDATE the same path (upsert / re-upload, ADR-3's extensionless
-- deterministic path).
select lives_ok(
  $$ update storage.objects set owner = null where bucket_id = 'prize-images' and name = 'edition-1' $$,
  'admin can UPDATE (re-upload/upsert) an existing prize-images object'
);

-- Non-admin authenticated session's UPDATE silently touches ZERO rows: RLS's
-- USING clause filters the row out of the update's candidate set for a
-- non-admin, so Postgres reports success with 0 rows affected instead of
-- raising (unlike INSERT's WITH CHECK, which raises 42501 outright).
select test_helpers.authenticate_as(:'buyer_id'::uuid);
update storage.objects set owner = :'buyer_id'::uuid
where bucket_id = 'prize-images' and name = 'edition-1';

select test_helpers.authenticate_as(:'admin_id'::uuid, 'admin');
select isnt(
  (select owner from storage.objects where bucket_id = 'prize-images' and name = 'edition-1'),
  :'buyer_id'::uuid,
  'a non-admin UPDATE does not actually change a prize-images object (RLS filters the row out)'
);

-- Anonymous (no auth) CAN read the object -- public bucket, no signed URL
-- needed (ADR-1).
select test_helpers.authenticate_as_anon();
select is(
  (select count(*)::int from storage.objects where bucket_id = 'prize-images' and name = 'edition-1'),
  1,
  'anon can SELECT a prize-images object (public read)'
);

-- A regular authenticated (non-admin) session can also read it -- select is
-- public to both roles, only writes are admin-gated.
select test_helpers.authenticate_as(:'buyer_id'::uuid);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'prize-images' and name = 'edition-1'),
  1,
  'a non-admin authenticated session can SELECT a prize-images object (public read)'
);

select * from finish();
rollback;
