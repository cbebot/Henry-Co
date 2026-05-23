-- REALTIME-01 — backfill missing tables into supabase_realtime publication.
--
-- Diagnostic finding (see docs/v3/realtime-diagnostic-2026-05-23.md):
-- the production `supabase_realtime` publication is missing three tables
-- that the dashboard-shell realtime provider + the rooms provider
-- subscribe to unconditionally:
--
--     - public.customer_notifications
--     - public.rooms_messages
--     - public.rooms_participants
--
-- The disk-only source migrations
--     20260501130000_notification_realtime_publication.sql
--     20260515100600_rooms_realtime_publication.sql
-- never reached the live project (verified via list_migrations:
-- both versions are absent). The shell currently subscribes to a
-- non-published `customer_notifications` table; the broker rejects the
-- channel; the provider's watchdog times out and retries with backoff
-- → the visible "always connecting / reconnecting" loop the owner
-- reported.
--
-- This migration is idempotent: each table is only added if it isn't
-- already a member. Re-running is a no-op. Mirrors the pattern in
-- 20260522154818_message_read_state.sql §7 (which successfully added
-- support_messages + support_threads to the same publication).
--
-- RLS posture is unchanged: every table targeted here keeps its
-- existing row-level policies, and Supabase Realtime applies those
-- policies to the subscription stream. Adding a table to the
-- publication only enables logical replication for it; isolation
-- remains policy-enforced.
--
-- DRY RUN
--   The following two queries let an operator preview + verify
--   without committing:
--
--     -- Pre-state — should NOT list customer_notifications,
--     -- rooms_messages, rooms_participants.
--     select tablename from pg_publication_tables
--      where pubname = 'supabase_realtime'
--        and schemaname = 'public'
--      order by tablename;
--
--     -- Apply (this migration body).
--
--     -- Post-state — should now include all three rows.
--     select tablename from pg_publication_tables
--      where pubname = 'supabase_realtime'
--        and schemaname = 'public'
--        and tablename in ('customer_notifications', 'rooms_messages', 'rooms_participants')
--      order by tablename;
--
-- OWNER GATE
--   Per REALTIME-01 spec: "NO migrations applied to production without
--   owner explicit approval." This file lives in the repo so the PR
--   carries the diff; the actual `apply_migration` call is owner-gated.

do $$
begin
  -- Belt-and-braces: ensure the publication exists. Supabase-managed
  -- projects create it on first login; this guards self-hosted clones
  -- and any future project that lost it.
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  -- customer_notifications — subscribed by
  -- packages/dashboard-shell/src/shell/supabase-realtime-provider.tsx
  -- (customer channel, every authenticated viewer).
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'customer_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.customer_notifications';
  end if;

  -- rooms_messages — subscribed by
  -- packages/rooms/src/realtime/rooms-realtime.tsx (page-scoped chat).
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'rooms_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.rooms_messages';
  end if;

  -- rooms_participants — subscribed by the rooms provider for
  -- presence + hand-raise.
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'rooms_participants'
  ) then
    execute 'alter publication supabase_realtime add table public.rooms_participants';
  end if;
end
$$;

comment on table public.customer_notifications is
  'In-app notification inbox per user. RLS: SELECT own only (auth.uid() = user_id). '
  'Realtime publication: supabase_realtime (backfilled 2026-05-23 via REALTIME-01). '
  'Subscribed by @henryco/dashboard-shell SupabaseRealtimeProvider.';
