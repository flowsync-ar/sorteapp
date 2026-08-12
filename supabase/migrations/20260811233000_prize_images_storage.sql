-- Public Storage bucket for prize photos (change: prize-image,
-- design.md §1 "Storage migration"). Unlike `receipts` (private, buyer-
-- scoped, 20260811230600_receipts_storage.sql), this bucket is PUBLIC read —
-- a prize photo is marketing content shown to anonymous visitors on the
-- landing (lib/marketing/prize.ts). Only an admin session may write, via the
-- same `public.is_admin()` helper `raffle_edition_admin_all`/
-- `receipt_admin_all_object` already use (20260811221044_rls.sql).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prize-images',
  'prize-images',
  true, -- public read: prize photo is marketing content, no auth required
  5242880, -- 5MB, matches lib/marketing/prize-image-validation.ts MAX_SIZE_BYTES
  array['image/jpeg', 'image/png', 'image/webp'] -- images only, no pdf (unlike receipts)
)
on conflict (id) do nothing;

-- storage.objects ships with RLS already enabled by Supabase; only policies
-- are added here.
create policy prize_image_public_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'prize-images');

-- Covers INSERT + UPDATE (needed for `upload(..., { upsert: true })`,
-- lib/admin/prize-image.ts#uploadPrizeImage) in one policy, mirroring
-- receipt_admin_all_object -- read here is public, not admin-only.
create policy prize_image_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'prize-images' and public.is_admin())
  with check (bucket_id = 'prize-images' and public.is_admin());
