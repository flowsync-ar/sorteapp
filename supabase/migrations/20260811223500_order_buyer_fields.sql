-- PR5 (tasks.md 5.2): checkout collects buyer identity data (nombre, email,
-- DNI, teléfono) for eligibility/winner-notification and audit purposes
-- (spec.md §9 "registro inmutable de orden, comprador..."). design.md's
-- original order schema didn't include these columns — added here, scoped
-- tightly to what the checkout form actually collects. The table is empty in
-- every environment this migration has run in so far, so plain NOT NULL
-- columns (no backfill step) are safe.
alter table "order"
  add column buyer_name text not null,
  add column buyer_email text not null,
  add column buyer_dni text not null,
  add column buyer_phone text not null,
  add constraint order_buyer_email_format check (buyer_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  add constraint order_buyer_dni_format check (buyer_dni ~ '^\d{7,8}$');
