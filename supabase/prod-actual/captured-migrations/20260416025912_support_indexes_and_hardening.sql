-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260416025912  name=support_indexes_and_hardening
-- project: rzkbgwuznmdxnnhmjazy (HENRY ONYX)
-- classification: FOLLOWON_HARDEN (applied on prod; no app-folder migration file existed)
--
-- BYTE-FAITHFUL capture of the SQL prod actually applied for this migration
-- (supabase_migrations.schema_migrations.statements). Recorded so the repo
-- migration record mirrors prod. Like supabase/prod-actual/schema.sql this is a
-- REFERENCE capture: NOT part of any app auto-apply chain, and must NOT be
-- re-applied to prod (these objects already exist there). See
-- supabase/prod-actual/captured-migrations/README.md and
-- .codex-temp/v3-reconcile-01/report.md.
-- ============================================================================

-- Additional composite indexes for support query patterns used by staff intelligence

-- Staff queries filter by division + status + updated_at
create index if not exists support_threads_division_status_idx
  on public.support_threads (division, status, updated_at desc);

-- Staff queries filter by assigned_to
create index if not exists support_threads_assigned_idx
  on public.support_threads (assigned_to, status)
  where assigned_to is not null;

-- Message lookups by thread + created_at (already have thread idx but not composite)
create index if not exists support_messages_thread_created_idx
  on public.support_messages (thread_id, created_at asc);

-- Priority-based lookups for staff triage
create index if not exists support_threads_priority_updated_idx
  on public.support_threads (priority, updated_at desc)
  where status not in ('resolved', 'closed');
