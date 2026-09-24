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
-- below (psql meta-command + DO-block raise) aborts before any DDL runs via
-- psql -f (with or without ON_ERROR_STOP), the SQL editor or apply_migration.
-- If rooms is ever revived (real-time gaming phase / live consults), re-author
-- the family: create rooms_participants' dependency-free shape first, then
-- attach the participant-subselect policy on rooms_sessions after it exists.
-- ============================================================================
\set ON_ERROR_STOP on
do $retired$
begin
  raise exception 'RETIRED MIGRATION — DO NOT APPLY: %  (docs/v3/ACTIVATION-RUNBOOK-2026-09-24.md §4)', '20260515100100_rooms_participants.sql';
end
$retired$;

/* ===== RETIRED BODY — inert, kept for history only. Do not uncomment to apply;
   re-author instead (see header). ================================================

-- V3 Wave A2 — Rooms infrastructure: rooms_participants.
--
-- Per-user lifecycle inside a session. One row per (session, user) pair.
-- INSERT happens at join; UPDATE on leave / hand-raise; deletes are
-- rare (session-cascade only).
--
-- DESIGN
--   * `role` is the participant's posture in this session. Wave C (Jobs)
--     uses {host, candidate, interviewer, observer}; Care / Logistics
--     use {operator, customer}; Studio + Property tours use
--     {host, customer, observer}.
--   * `hand_raised` is a presence flag — toggled by the participant via
--     server action; broadcast via realtime so peers update without
--     polling.
--   * `joined_at` / `left_at` are nullable: a row may exist before the
--     user actually clicks "Join" (pre-registration for scheduled
--     interviews), and `left_at` stays NULL while the user is still in.
--
-- RLS POSTURE
--   * SELECT: same predicate as rooms_sessions — owner of the session
--     OR a participant on the session (so candidates can see who else
--     is on the call).
--   * INSERT: the inserter must be the same user as `user_id` AND the
--     session must be in a joinable status ('scheduled' or 'live').
--     This stops cross-tenant participants showing up uninvited.
--   * UPDATE: the participant updates their own row only (leave, hand
--     raise). The session owner cannot mutate someone else's leave time.

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. rooms_participants
------------------------------------------------------------------------

create table if not exists public.rooms_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rooms_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  role text not null check (role in (
    'host',
    'candidate',
    'interviewer',
    'observer',
    'customer',
    'operator'
  )),

  joined_at timestamptz,
  left_at timestamptz,
  hand_raised boolean not null default false,

  created_at timestamptz not null default timezone('utc', now()),

  -- A given user has exactly one participant row per session — re-joins
  -- update the existing row's joined_at + left_at rather than inserting
  -- a duplicate.
  unique (session_id, user_id)
);

------------------------------------------------------------------------
-- 2. Indexes
------------------------------------------------------------------------

-- Hot path: load all participants for a given session (PresencePane).
create index if not exists rooms_participants_session_idx
  on public.rooms_participants(session_id);

-- Reverse lookup: user's room history.
create index if not exists rooms_participants_user_idx
  on public.rooms_participants(user_id);

------------------------------------------------------------------------
-- 3. RLS
------------------------------------------------------------------------

alter table public.rooms_participants enable row level security;

-- SELECT — owner of the session OR a participant of the session can see
-- the full participant list (so peers know who's on the call).
drop policy if exists "rooms_participants select owner or participant"
  on public.rooms_participants;
create policy "rooms_participants select owner or participant"
  on public.rooms_participants
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.rooms_sessions s
      where s.id = rooms_participants.session_id
        and (
          s.owner_user_id = auth.uid()
          or exists (
            select 1
            from public.rooms_participants self
            where self.session_id = s.id
              and self.user_id = auth.uid()
          )
        )
    )
  );

-- INSERT — self-only, and the target session must be joinable.
-- Status check prevents inserting participants on ended/cancelled rooms,
-- which the server action also enforces but RLS is the belt-and-braces.
drop policy if exists "rooms_participants insert self joinable"
  on public.rooms_participants;
create policy "rooms_participants insert self joinable"
  on public.rooms_participants
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.rooms_sessions s
      where s.id = session_id
        and s.status in ('scheduled', 'live')
    )
  );

-- UPDATE — self-only. The participant manages their own joined_at,
-- left_at, and hand_raised state.
drop policy if exists "rooms_participants update self"
  on public.rooms_participants;
create policy "rooms_participants update self"
  on public.rooms_participants
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service-role full access — used by server actions when the owner needs
-- to forcibly mark a participant left (cleanup cron).
drop policy if exists "rooms_participants service role full"
  on public.rooms_participants;
create policy "rooms_participants service role full"
  on public.rooms_participants
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

------------------------------------------------------------------------
-- 4. Documentation
------------------------------------------------------------------------

comment on table public.rooms_participants is
  'V3 Wave A2: per-user lifecycle inside a rooms_sessions row. INSERT on '
  'join; UPDATE on leave / hand-raise. UNIQUE (session_id, user_id) so '
  're-joins update rather than duplicate. RLS: SELECT for owner + '
  'participants; INSERT/UPDATE self-only; service role bypasses for '
  'admin cleanup.';

===== end RETIRED BODY ===== */
