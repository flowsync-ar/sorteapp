-- PR9 (tasks.md 9.4, spec.md §8 "cargar resultado del sorteo... publicar
-- ganador"): the admin edition CRUD needs two columns design.md's original
-- schema didn't include:
-- - `draw_date`: the scheduled sorteo date/time the admin sets when creating
--   an edition (previously only lived as static marketing content, see
--   lib/marketing/content.ts's `currentPrize.drawDateIso`). Reused as the
--   published winner's display date too (lib/marketing/winners.ts), instead
--   of a separate "drawn_at" column.
-- - `winner_display_name`: a PRIVACY-SCRUBBED partial name (e.g. "Ana T.",
--   same convention as lib/marketing/content.ts's example `previousWinners`)
--   computed once, server-side, when the admin publishes a winner
--   (lib/admin/winners.ts). Design.md §3 explicitly restricts the public
--   "ganadores" data to "no PII" — this column is what makes that possible:
--   the raw `order.buyer_name` stays admin/owner-only (existing RLS), and
--   only this already-anonymized value is ever exposed to the public
--   `raffle_edition_public_select` policy.
alter table raffle_edition
  add column draw_date timestamptz,
  add column winner_display_name text;

comment on column raffle_edition.winner_display_name is
  'Privacy-scrubbed partial name (e.g. "Ana T."), set by lib/admin/winners.ts. Never the raw order.buyer_name.';
