-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260406065148  name=20260406_auth_hardening_orders_and_care_reviews
-- project: rzkbgwuznmdxnnhmjazy (HENRY ONYX)
-- classification: GENUINE_GAP (applied on prod; no app-folder migration file existed)
--
-- BYTE-FAITHFUL capture of the SQL prod actually applied for this migration
-- (supabase_migrations.schema_migrations.statements). Recorded so the repo
-- migration record mirrors prod. Like supabase/prod-actual/schema.sql this is a
-- REFERENCE capture: NOT part of any app auto-apply chain, and must NOT be
-- re-applied to prod (these objects already exist there). See
-- supabase/prod-actual/captured-migrations/README.md and
-- .codex-temp/v3-reconcile-01/report.md.
-- ============================================================================

begin;

-- Restrict orders inserts to authenticated users and tie to auth.uid() when provided
drop policy if exists orders_insert_public on public.orders;

create policy orders_insert_authenticated
  on public.orders
  as permissive
  for insert
  to authenticated
  with check (
    auth.uid() is not null
  );

-- Restrict care_reviews inserts to authenticated users
drop policy if exists "public submit reviews" on public.care_reviews;

create policy care_reviews_insert_authenticated
  on public.care_reviews
  as permissive
  for insert
  to authenticated
  with check (auth.uid() is not null);

commit;
