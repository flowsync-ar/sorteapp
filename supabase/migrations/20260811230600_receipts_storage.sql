-- Private Storage bucket for comprobantes (tasks.md PR7, design.md §5
-- "Comprobante flow": "Private Supabase Storage bucket `receipts`.").
-- Objects are keyed `{orderId}/{timestamp}-{filename}` (see
-- lib/receipts/upload.ts) so RLS can scope access by parsing the leading
-- path segment as the owning order, mirroring how the `receipt` table's own
-- RLS (20260811221044_rls.sql) scopes by `order.user_id`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false, -- never public: buyer uploads, only owner + admin may read (signed URLs)
  10485760, -- 10MB, matches lib/receipts/validation.ts MAX_SIZE_BYTES
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- storage.objects ships with RLS already enabled by Supabase; only policies
-- are added here.
create policy receipt_owner_insert_object on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and exists (
      select 1
      from "order" o
      where o.id::text = (storage.foldername(name))[1]
        and o.user_id = auth.uid()
    )
  );

create policy receipt_owner_select_object on storage.objects
  for select to authenticated
  using (
    bucket_id = 'receipts'
    and exists (
      select 1
      from "order" o
      where o.id::text = (storage.foldername(name))[1]
        and o.user_id = auth.uid()
    )
  );

-- Admin review (design.md §5 "Admin reviews via short-lived SIGNED URL").
-- The actual `createSignedUrl` call + review UI is PR9 scope; this policy
-- just makes sure an admin session CAN read/manage any receipt object once
-- that UI lands, without a further migration.
create policy receipt_admin_all_object on storage.objects
  for all to authenticated
  using (bucket_id = 'receipts' and public.is_admin())
  with check (bucket_id = 'receipts' and public.is_admin());
