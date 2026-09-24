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
  raise exception 'RETIRED MIGRATION — DO NOT APPLY: %  (docs/v3/ACTIVATION-RUNBOOK-2026-09-24.md §4)', '20260515100400_rooms_scorecards.sql';
end
$retired$;

-- V3 Wave A2 — Rooms infrastructure: rooms_scorecards.
--
-- Interviewer / reviewer scorecards. JSON-driven dimensions so each
-- consumer (Jobs interview, Studio review, Care peer review) defines
-- its own shape without a schema change.
--
-- DESIGN
--   * `dimensions` is jsonb. The Jobs default scaffold is
--     `{ technical: 0-5, communication: 0-5, culture: 0-5,
--        recommendation: 'strong_yes'|'yes'|'no'|'strong_no' }`. Studio
--     review uses `{ visual: 0-5, polish: 0-5, brief_match: 0-5 }`.
--   * `notes_md` is the reviewer's free-form note (Markdown).
--   * `submitted_at` is set only once the reviewer commits. Unsubmitted
--     drafts are scorecards with submitted_at IS NULL.
--   * UNIQUE (session_id, reviewer_user_id) — one scorecard per reviewer
--     per session. Multiple interviewers each get their own row.
--
-- RLS POSTURE
--   * SELECT: the reviewer (own scorecard), the session owner (sees
--     every scorecard for their session), OR `is_staff_in(<division>)`
--     where division is derived from `rooms_sessions.kind`. The
--     audit §4.4 spec calls this out specifically for owner +
--     `is_staff_in()` visibility.
--   * INSERT/UPDATE: the reviewer only — reviewers don't get to edit
--     someone else's scorecard.

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. rooms_scorecards
------------------------------------------------------------------------

create table if not exists public.rooms_scorecards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rooms_sessions(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,

  dimensions jsonb not null default '{}'::jsonb,
  notes_md text,
  submitted_at timestamptz,

  created_at timestamptz not null default timezone('utc', now()),

  unique (session_id, reviewer_user_id)
);

------------------------------------------------------------------------
-- 2. Indexes
------------------------------------------------------------------------

-- Hot path: session detail page loads every scorecard.
create index if not exists rooms_scorecards_session_idx
  on public.rooms_scorecards(session_id);

-- Reviewer's "my scorecards" list.
create index if not exists rooms_scorecards_reviewer_idx
  on public.rooms_scorecards(reviewer_user_id, submitted_at desc);

------------------------------------------------------------------------
-- 3. RLS
------------------------------------------------------------------------

alter table public.rooms_scorecards enable row level security;

-- Map rooms_sessions.kind to is_staff_in division — the same string
-- the predicate accepts. The mapping is mostly identity (jobs_interview
-- → 'jobs'); we encode it inline here to avoid a CASE blowing out into
-- a helper function.
--
-- Wave C may extend rooms_sessions.kind; if so, this CASE updates too.

-- SELECT — reviewer OR session owner OR division-staff.
drop policy if exists "rooms_scorecards select reviewer owner staff"
  on public.rooms_scorecards;
create policy "rooms_scorecards select reviewer owner staff"
  on public.rooms_scorecards
  for select
  using (
    reviewer_user_id = auth.uid()
    or exists (
      select 1
      from public.rooms_sessions s
      where s.id = rooms_scorecards.session_id
        and s.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.rooms_sessions s
      where s.id = rooms_scorecards.session_id
        and public.is_staff_in(
          case s.kind
            when 'care_consult' then 'care'
            when 'marketplace_dispute' then 'marketplace'
            when 'studio_review' then 'studio'
            when 'academy_class' then 'learn'
            when 'logistics_call' then 'logistics'
            when 'property_tour' then 'property'
            when 'jobs_interview' then 'jobs'
            else 'hub'
          end,
          null
        )
    )
  );

-- INSERT — reviewer self, and the reviewer must be on the session.
drop policy if exists "rooms_scorecards insert self participant"
  on public.rooms_scorecards;
create policy "rooms_scorecards insert self participant"
  on public.rooms_scorecards
  for insert
  with check (
    reviewer_user_id = auth.uid()
    and exists (
      select 1
      from public.rooms_participants p
      where p.session_id = session_id
        and p.user_id = auth.uid()
    )
  );

-- UPDATE — reviewer self only.
drop policy if exists "rooms_scorecards update self"
  on public.rooms_scorecards;
create policy "rooms_scorecards update self"
  on public.rooms_scorecards
  for update
  using (reviewer_user_id = auth.uid())
  with check (reviewer_user_id = auth.uid());

-- Service-role full access.
drop policy if exists "rooms_scorecards service role full"
  on public.rooms_scorecards;
create policy "rooms_scorecards service role full"
  on public.rooms_scorecards
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

------------------------------------------------------------------------
-- 4. Documentation
------------------------------------------------------------------------

comment on table public.rooms_scorecards is
  'V3 Wave A2: interviewer / reviewer scorecard. Dimensions are jsonb '
  '(consumer-defined shape). Notes are Markdown. UNIQUE (session, '
  'reviewer) — one per pair. RLS: reviewer + session owner + division '
  'staff via is_staff_in() may SELECT; only the reviewer INSERTs / '
  'UPDATEs their own row.';
