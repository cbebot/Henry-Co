-- V3 Wave A2 — Rooms infrastructure: rooms_sessions.
--
-- The canonical "room exists" row. One per audiovisual + collaborative
-- session across every HenryCo portal (Care consult, Marketplace dispute,
-- Studio review, Academy live class, Logistics live-tracking call,
-- Property virtual tour, Jobs interview).
--
-- DESIGN
--   * `provider` carries the driver that handled creation ("daily"|"jitsi").
--     Set once at create-time; never updated (a switch mid-session would
--     orphan the participants).
--   * `provider_room_id` is the opaque id the provider issued (Daily room
--     name, Jitsi room slug). Plain text — provider URLs may include this
--     verbatim and there is no PII content here.
--   * `metadata` is consumer-defined jsonb. Each portal stores its own
--     refs (Jobs: { jobId, applicationId, scorecardId }; Care: { bookingId }).
--   * `owner_user_id` is the staff / employer / property host. RLS uses
--     this + the participants table to decide visibility.
--
-- RLS POSTURE
--   * INSERT: any authenticated viewer may create a session targeted at
--     themselves as owner. Server actions enforce role-by-kind beyond RLS.
--   * SELECT/UPDATE/DELETE: owner OR participant. Non-participants get 0
--     rows — verified by Playwright in V3 of the Wave A2 PR.
--
-- WHY HUB-CANONICAL
--   Cross-cutting schema lives in apps/hub/supabase/migrations/ per audit
--   §7.1 ("Wave A2 rooms migrations land here"). Every portal app reads
--   the canonical schema through @henryco/rooms — no per-portal mirrors.

set check_function_bodies = off;

create extension if not exists "uuid-ossp";

------------------------------------------------------------------------
-- 1. rooms_sessions
------------------------------------------------------------------------

create table if not exists public.rooms_sessions (
  id uuid primary key default gen_random_uuid(),

  kind text not null check (kind in (
    'care_consult',
    'marketplace_dispute',
    'studio_review',
    'academy_class',
    'logistics_call',
    'property_tour',
    'jobs_interview'
  )),

  provider text not null check (provider in ('daily', 'jitsi')),
  provider_room_id text,

  scheduled_at timestamptz,
  joined_at timestamptz,
  ended_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'ended', 'cancelled')),

  owner_user_id uuid not null references auth.users(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

------------------------------------------------------------------------
-- 2. Indexes
------------------------------------------------------------------------

-- Hot path: owner's "my upcoming rooms" + dashboard widgets.
create index if not exists rooms_sessions_owner_idx
  on public.rooms_sessions(owner_user_id, scheduled_at desc);

-- Listing pages per kind (e.g. /interviews, /classes) ordered by time.
create index if not exists rooms_sessions_kind_scheduled_idx
  on public.rooms_sessions(kind, scheduled_at desc);

-- Operational dashboards filter on status (live now / upcoming / ended).
create index if not exists rooms_sessions_status_idx
  on public.rooms_sessions(status);

-- Reverse lookup from provider room id (used by webhook handlers — Wave
-- B/C consumers wire the provider webhook routes, but the index is here
-- so those routes don't trigger a sequential scan).
create unique index if not exists rooms_sessions_provider_room_idx
  on public.rooms_sessions(provider, provider_room_id)
  where provider_room_id is not null;

------------------------------------------------------------------------
-- 3. updated_at trigger
------------------------------------------------------------------------

-- Reuse the hub-wide trigger function created in
-- 20260402235500_workspace_staff_platform.sql:workspace_set_updated_at()
-- so we don't duplicate the helper.

drop trigger if exists rooms_sessions_updated_at on public.rooms_sessions;
create trigger rooms_sessions_updated_at
before update on public.rooms_sessions
for each row execute function public.workspace_set_updated_at();

------------------------------------------------------------------------
-- 4. RLS
------------------------------------------------------------------------

alter table public.rooms_sessions enable row level security;

-- SELECT — owner OR participant.
-- The participants check is via a subquery against rooms_participants
-- (which has its own RLS — but is_staff_in isn't relevant here; the
-- predicate is "did the caller ever join this session?").
drop policy if exists "rooms_sessions select owner or participant"
  on public.rooms_sessions;
create policy "rooms_sessions select owner or participant"
  on public.rooms_sessions
  for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.rooms_participants p
      where p.session_id = rooms_sessions.id
        and p.user_id = auth.uid()
    )
  );

-- INSERT — any authenticated viewer may create a session as themselves
-- as owner. Server actions enforce role-by-kind (e.g. only employers
-- create jobs_interview rooms) beyond RLS.
drop policy if exists "rooms_sessions insert authenticated"
  on public.rooms_sessions;
create policy "rooms_sessions insert authenticated"
  on public.rooms_sessions
  for insert
  with check (
    auth.uid() is not null
    and owner_user_id = auth.uid()
  );

-- UPDATE — owner only. Participants don't get to mutate the session
-- shape (their own join/leave state is on rooms_participants).
drop policy if exists "rooms_sessions update owner only"
  on public.rooms_sessions;
create policy "rooms_sessions update owner only"
  on public.rooms_sessions
  for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- DELETE — owner only. Cancellation is normally an UPDATE to status
-- 'cancelled', but DELETE remains for true wipes (e.g. accidental
-- create).
drop policy if exists "rooms_sessions delete owner only"
  on public.rooms_sessions;
create policy "rooms_sessions delete owner only"
  on public.rooms_sessions
  for delete
  using (owner_user_id = auth.uid());

-- Service-role full access (server actions that need to bypass RLS by
-- intent — recording-row insert from webhook handler, scheduled cleanup
-- cron).
drop policy if exists "rooms_sessions service role full"
  on public.rooms_sessions;
create policy "rooms_sessions service role full"
  on public.rooms_sessions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

------------------------------------------------------------------------
-- 5. Documentation
------------------------------------------------------------------------

comment on table public.rooms_sessions is
  'V3 Wave A2 (rebuild/dashboard-rooms): the canonical room session. One '
  'per audiovisual + collaborative session across every portal (Care, '
  'Marketplace, Studio, Academy, Logistics, Property, Jobs). Provider is '
  'pinned at create-time ("daily" or "jitsi"). RLS: SELECT/UPDATE/DELETE '
  'gated on owner OR participant; INSERT to authenticated. Server actions '
  'in @henryco/rooms enforce kind+role authorization beyond RLS.';

comment on column public.rooms_sessions.provider_room_id is
  'Opaque provider identifier (Daily room name, Jitsi room slug). Stable '
  'across re-joins for the lifetime of the room. Indexed for webhook '
  'reverse-lookup in (provider, provider_room_id).';

comment on column public.rooms_sessions.metadata is
  'Consumer-defined jsonb. Jobs interviews store '
  '{ jobId, applicationId, scorecardId }; Care consults store { bookingId }; '
  'Studio reviews store { projectId, milestoneId }. No PII keys.';
