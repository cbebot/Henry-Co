-- ============================================================================
-- RETIRED — DO NOT APPLY  (V3-ACTIVATION-RUNBOOK-FIX-01, 2026-09-24)
-- ----------------------------------------------------------------------------
-- The @henryco/rooms migration family (7 files, 20260515100000..100600) is
-- retired, not repaired:
--   * Dead code on main: no app depends on or imports @henryco/rooms
--     (apps/*/package.json, all app sources); pillar-gap-map P10 records it as
--     "fully built but unconsumed". Jobs interviews ship on their own
--     jobs_interview_rooms table (Daily.co), which does not reference rooms_*.
--   * Gaming chose Supabase Realtime over it for turn-based play
--     (docs/v3/gaming/ARCHITECTURE.md §4, PHASED-PLAN.md).
--   * Not applicable as authored: rooms_sessions' SELECT policy sub-selects
--     rooms_participants, which FKs back to rooms_sessions (a cycle), so the
--     first file fails and the other six cascade (runbook §2 ✗, §4).
-- Moved out of supabase/migrations/ so no CLI path picks it up. The guard
-- below makes a paste into the SQL editor fail before any DDL runs.
-- If rooms is ever revived (real-time gaming phase / live consults), re-author
-- the family: create rooms_participants' dependency-free shape first, then
-- attach the participant-subselect policy on rooms_sessions after it exists.
-- ============================================================================
do $retired$
begin
  raise exception 'RETIRED MIGRATION — DO NOT APPLY: %  (docs/v3/ACTIVATION-RUNBOOK-2026-09-24.md §4)', '20260515100600_rooms_realtime_publication.sql';
end
$retired$;

-- V3 Wave A2 — Rooms infrastructure: realtime publication.
--
-- Add `rooms_messages` and `rooms_participants` to the supabase_realtime
-- publication so the in-room chat + presence stream live without polling.
-- RLS applies to the subscription stream, so cross-session isolation
-- holds at the channel layer without extra filters.
--
-- DESIGN
--   * `rooms_messages` is the chat back-channel — every new message
--     should arrive on every participant's client within ~1s.
--   * `rooms_participants` carries join/leave + hand_raised — the
--     PresencePane renders this live.
--   * `rooms_sessions` is NOT added to realtime: its mutations are rare
--     (status transitions only) and the shell-level fetch on visibility
--     change picks them up. Avoiding extra subscriptions keeps the
--     realtime channel count low.
--
-- Mirrors the pattern in
-- `20260501130000_notification_realtime_publication.sql` (customer
-- notifications) and the tail of `20260502120000_staff_notifications_audience.sql`
-- (staff notifications + states).

do $$
begin
  -- Defensive: ensure the publication exists. Supabase managed projects
  -- always have it; self-hosted clones may not.
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  -- rooms_messages
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.rooms_messages';
  end if;

  -- rooms_participants
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

comment on table public.rooms_messages is
  'V3 Wave A2: in-room chat. body_md is Markdown (consumer sanitises). '
  'attachments jsonb mirrors @henryco/chat-composer''s ComposerAttachment '
  'shape so the composer''s send payload feeds straight in. RLS: '
  'participants + owner may SELECT; only the sender may INSERT (and '
  'only on a session they''re on). Updates / deletes blocked from '
  'authenticated paths (audit immutability). Realtime publication: '
  'supabase_realtime.';

comment on table public.rooms_participants is
  'V3 Wave A2: per-user lifecycle inside a rooms_sessions row. INSERT on '
  'join; UPDATE on leave / hand-raise. UNIQUE (session_id, user_id) so '
  're-joins update rather than duplicate. RLS: SELECT for owner + '
  'participants; INSERT/UPDATE self-only; service role bypasses for '
  'admin cleanup. Realtime publication: supabase_realtime.';
