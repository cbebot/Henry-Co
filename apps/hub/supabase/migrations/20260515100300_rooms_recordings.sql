-- V3 Wave A2 — Rooms infrastructure: rooms_recordings.
--
-- One row per recording artefact. The provider (Daily / Jitsi) emits the
-- URL + expiry via webhook after the recording is finalised; the row is
-- inserted at startRecording time (so the server action has a stable id
-- for the consumer UI) and updated by the webhook handler.
--
-- DESIGN
--   * `provider_recording_id` is the opaque provider-side id (Daily
--     recording id). Used to correlate the start call to the webhook.
--   * `url` is populated after the recording finalises. It may be
--     short-lived (Daily's URLs expire after 24h–48h); the consumer
--     re-fetches via a server action that re-signs.
--   * `expires_at` mirrors the provider's expiry so the UI can hint
--     "Download before <date>".
--   * `transcript_url` is optional and may be populated by a follow-up
--     transcription pass (out of Wave A2 scope).
--
-- RLS POSTURE
--   * SELECT: any participant of the session may read the recording row
--     (so candidates can re-watch the interview they consented to).
--   * INSERT/UPDATE: service-role only — the server action writes, the
--     webhook handler writes; no user-direct path.

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. rooms_recordings
------------------------------------------------------------------------

create table if not exists public.rooms_recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rooms_sessions(id) on delete cascade,

  provider_recording_id text,
  url text,
  expires_at timestamptz,
  transcript_url text,

  created_at timestamptz not null default timezone('utc', now())
);

------------------------------------------------------------------------
-- 2. Indexes
------------------------------------------------------------------------

create index if not exists rooms_recordings_session_idx
  on public.rooms_recordings(session_id, created_at desc);

-- Webhook handler reverse-lookup: find the row to UPDATE given the
-- provider id.
create index if not exists rooms_recordings_provider_idx
  on public.rooms_recordings(provider_recording_id)
  where provider_recording_id is not null;

------------------------------------------------------------------------
-- 3. RLS
------------------------------------------------------------------------

alter table public.rooms_recordings enable row level security;

-- SELECT — participants may read.
drop policy if exists "rooms_recordings select participants"
  on public.rooms_recordings;
create policy "rooms_recordings select participants"
  on public.rooms_recordings
  for select
  using (
    exists (
      select 1
      from public.rooms_participants p
      where p.session_id = rooms_recordings.session_id
        and p.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.rooms_sessions s
      where s.id = rooms_recordings.session_id
        and s.owner_user_id = auth.uid()
    )
  );

-- INSERT/UPDATE — service-role only. No user-direct path.
drop policy if exists "rooms_recordings service role insert"
  on public.rooms_recordings;
create policy "rooms_recordings service role insert"
  on public.rooms_recordings
  for insert
  with check (auth.role() = 'service_role');

drop policy if exists "rooms_recordings service role update"
  on public.rooms_recordings;
create policy "rooms_recordings service role update"
  on public.rooms_recordings
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "rooms_recordings service role delete"
  on public.rooms_recordings;
create policy "rooms_recordings service role delete"
  on public.rooms_recordings
  for delete
  using (auth.role() = 'service_role');

------------------------------------------------------------------------
-- 4. Documentation
------------------------------------------------------------------------

comment on table public.rooms_recordings is
  'V3 Wave A2: one row per provider recording artefact. INSERTED at '
  'startRecording time (service role) with a placeholder; UPDATED by '
  'the provider webhook handler with the final url + expires_at. RLS: '
  'participants + owner may SELECT; only service role INSERTs/UPDATEs.';
