-- V3 PASS 21 — Jobs interview rooms (Distinctive Rule #2).
--
-- WHY:
--   PRODUCT-GAP-LEDGER names "interview room" as a feature promise but no
--   scheduled-video-call surface ships. This migration adds the persistence
--   layer behind <InterviewRoom> — a Daily.co iframe embed with chat
--   sidebar and employer notes — plus a side table for room events
--   captured via Daily.co webhook.
--
-- TABLES:
--   public.jobs_interview_rooms        (room state, join urls, recordings)
--   public.jobs_interview_room_events  (Daily.co webhook capture)
--
-- ENV REALITY (V3 PASS 21 preflight):
--   - DAILY_API_KEY, DAILY_DOMAIN, DAILY_DOMAIN_NAME, DAILY_WEBHOOK_ID,
--     DAILY_WEBHOOK_SECRET are all provisioned. provider='daily.co' is the
--     primary path. The contract's alt-provider section (Jitsi / Meet /
--     Zoom) is OBSOLETE — we ship Daily.co as the only configured provider.
--     The provider enum still accepts those values so future ops can swap
--     without a schema change.
--
-- RLS:
--   - Candidate: select rows belonging to their applications.
--   - Employer member: select rows for pipelines under their employer
--     membership (admin client filters; RLS uses simple ownership check
--     via the linked application's candidate_user_id; broader staff reads
--     route through service-role).
--   - Service role: full.
--
-- DOWN:
--   drop table if exists public.jobs_interview_room_events;
--   drop table if exists public.jobs_interview_rooms;
--
-- IDEMPOTENT: yes.

create table if not exists public.jobs_interview_rooms (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.jobs_applications(id) on delete cascade,
  interview_id uuid references public.jobs_interviews(id) on delete set null,
  provider text not null default 'daily.co'
    check (provider in ('daily.co', 'jitsi', 'google-meet', 'zoom')),
  provider_room_name text,
  join_url text,
  candidate_token text,
  employer_token text,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30
    check (duration_minutes between 5 and 240),
  status text not null default 'scheduled'
    check (status in (
      'scheduled', 'active', 'completed', 'cancelled', 'no_show', 'failed'
    )),
  recording_enabled boolean not null default false,
  recording_url text,
  employer_notes text,
  candidate_feedback text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_interview_rooms_application_idx
  on public.jobs_interview_rooms (application_id);
create index if not exists jobs_interview_rooms_scheduled_idx
  on public.jobs_interview_rooms (scheduled_at);
create index if not exists jobs_interview_rooms_status_idx
  on public.jobs_interview_rooms (status);

alter table public.jobs_interview_rooms enable row level security;

drop policy if exists "jobs interview rooms: candidate read" on public.jobs_interview_rooms;
create policy "jobs interview rooms: candidate read"
  on public.jobs_interview_rooms
  for select
  using (
    exists (
      select 1
      from public.jobs_applications app
      where app.id = jobs_interview_rooms.application_id
        and app.candidate_user_id = auth.uid()
    )
  );

drop policy if exists "jobs interview rooms: service role" on public.jobs_interview_rooms;
create policy "jobs interview rooms: service role"
  on public.jobs_interview_rooms
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.jobs_interview_room_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.jobs_interview_rooms(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_interview_room_events_room_idx
  on public.jobs_interview_room_events (room_id, occurred_at desc);
create index if not exists jobs_interview_room_events_type_idx
  on public.jobs_interview_room_events (event_type);

alter table public.jobs_interview_room_events enable row level security;

drop policy if exists "jobs interview room events: service role" on public.jobs_interview_room_events;
create policy "jobs interview room events: service role"
  on public.jobs_interview_room_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.jobs_interview_rooms is
  'V3 PASS 21 — Daily.co interview rooms (Distinctive Rule #2). One room '
  'per scheduled interview. Provider default daily.co; enum keeps other '
  'providers open for ops swap without schema change. join_url is the '
  'public-shaped url for candidate + employer; candidate_token / '
  'employer_token are one-shot moderation tokens for room join.';
comment on table public.jobs_interview_room_events is
  'V3 PASS 21 — Daily.co webhook capture. /api/webhooks/daily inserts '
  'one row per delivered event. Used for room health, missed-interview '
  'detection, and recording readiness signals.';

-- end of migration --
