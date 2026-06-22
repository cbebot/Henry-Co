-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260619015600  name=rename_orphan_businesses_for_v3_57
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

-- V3-57 prep: the pre-existing public.businesses is an unused orphan (0 rows, no committed
-- migration created it, no code reads it, no FKs) colliding with V3-57's identity table.
-- Owner-approved: rename it aside (non-destructive, reversible) to free the name.
alter table public.businesses rename to businesses_legacy_unused;
alter table public.businesses_legacy_unused rename constraint businesses_pkey to businesses_legacy_unused_pkey;
alter table public.businesses_legacy_unused rename constraint businesses_slug_key to businesses_legacy_unused_slug_key;
