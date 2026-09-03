-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260416025830  name=support_thread_internal_notes
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

-- support_thread_internal_notes: staff-only notes on support threads
-- Not visible to customers. Service-role only access.

create table if not exists public.support_thread_internal_notes (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  visibility text not null default 'staff',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_thread_internal_notes_thread_idx
  on public.support_thread_internal_notes (thread_id, created_at desc);

create index if not exists support_thread_internal_notes_author_idx
  on public.support_thread_internal_notes (author_id, created_at desc);

alter table public.support_thread_internal_notes enable row level security;

-- Service role full access only (staff-only, never customer-visible)
create policy "Service role full access to support_thread_internal_notes"
  on public.support_thread_internal_notes for all
  using (auth.role() = 'service_role');

-- updated_at trigger
create trigger support_thread_internal_notes_updated_at
  before update on public.support_thread_internal_notes
  for each row execute function public.update_updated_at();
