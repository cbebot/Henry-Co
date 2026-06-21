-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260416025825  name=support_thread_events
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

-- support_thread_events: lifecycle audit trail for support threads
-- Tracks status changes, assignments, escalations, and other lifecycle events

create table if not exists public.support_thread_events (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'system',
  old_value text,
  new_value text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_thread_events_thread_idx
  on public.support_thread_events (thread_id, created_at desc);

create index if not exists support_thread_events_type_idx
  on public.support_thread_events (event_type, created_at desc);

create index if not exists support_thread_events_actor_idx
  on public.support_thread_events (actor_id, created_at desc);

alter table public.support_thread_events enable row level security;

-- Service role full access (staff backend writes via admin client)
create policy "Service role full access to support_thread_events"
  on public.support_thread_events for all
  using (auth.role() = 'service_role');

-- Customers can view events on their own threads (read-only)
create policy "Users can view events on own threads"
  on public.support_thread_events for select
  using (
    exists (
      select 1 from public.support_threads
      where support_threads.id = support_thread_events.thread_id
        and support_threads.user_id = auth.uid()
    )
  );
