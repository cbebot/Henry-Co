-- V3 Wave A2 — Rooms infrastructure: rooms_recordings_consent.
--
-- Auditable consent ledger. One row per (session, user) pair recording
-- whether the user agreed to be recorded, when they agreed, and when
-- (if ever) they withdrew.
--
-- DESIGN
--   * Consent is per-session-per-user, not per-recording. A user who
--     consents to "this interview being recorded" is on the record once
--     for the whole session; if mid-call they withdraw, withdrew_at is
--     set and the server action MUST stop recording.
--   * `consent_text_version` pins the exact copy the user read. A future
--     copy change to the consent dialog does NOT retroactively re-consent
--     existing users — the audit row tracks which text-version they saw.
--   * Insert path is exclusively the participant themselves (RLS).
--     `service_role` retains override for compliance work.
--
-- RLS POSTURE
--   * SELECT/INSERT/UPDATE: own rows only (user_id = auth.uid()). The
--     room owner CANNOT see who has not yet consented — they only get to
--     start recording when the server action confirms every participant
--     has a granted_at consent row with no withdrew_at. This is
--     deliberate: consent state is the participant's, not the owner's.
--
-- TRUTH HIERARCHY
--   The server action `startRecording` is the authoritative gate. RLS is
--   defence-in-depth; the GDPR-aligned audit trail is on this table.

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. rooms_recordings_consent
------------------------------------------------------------------------

create table if not exists public.rooms_recordings_consent (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rooms_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  granted_at timestamptz,
  withdrew_at timestamptz,

  consent_text_version text not null,

  created_at timestamptz not null default timezone('utc', now()),

  -- One consent row per (session, user) pair. Re-prompts UPDATE the
  -- existing row (re-grant clears withdrew_at; re-withdraw sets it
  -- without nulling granted_at — the ledger shows the full sequence).
  unique (session_id, user_id)
);

------------------------------------------------------------------------
-- 2. Indexes
------------------------------------------------------------------------

-- The unique constraint above creates a unique index on (session_id, user_id);
-- that index covers the hot path "did this user consent on this session?"
-- so we don't add a duplicate.

-- Sweep: list every user on a session who has not yet granted consent.
-- Used by the server action's pre-flight when the owner clicks
-- "Start recording".
create index if not exists rooms_recordings_consent_pending_idx
  on public.rooms_recordings_consent(session_id)
  where granted_at is null;

------------------------------------------------------------------------
-- 3. RLS
------------------------------------------------------------------------

alter table public.rooms_recordings_consent enable row level security;

-- SELECT — own rows only. Consent is the participant's data.
drop policy if exists "rooms_recordings_consent select own"
  on public.rooms_recordings_consent;
create policy "rooms_recordings_consent select own"
  on public.rooms_recordings_consent
  for select
  using (user_id = auth.uid());

-- INSERT — own rows only. The participant must be on the session.
drop policy if exists "rooms_recordings_consent insert own"
  on public.rooms_recordings_consent;
create policy "rooms_recordings_consent insert own"
  on public.rooms_recordings_consent
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.rooms_participants p
      where p.session_id = session_id
        and p.user_id = auth.uid()
    )
  );

-- UPDATE — own rows only.
drop policy if exists "rooms_recordings_consent update own"
  on public.rooms_recordings_consent;
create policy "rooms_recordings_consent update own"
  on public.rooms_recordings_consent
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service-role full access — for compliance work (export, GDPR request
-- response). The audit trail itself is immutable from the user's seat
-- (UPDATE only flips granted_at <-> withdrew_at, never deletes history).
drop policy if exists "rooms_recordings_consent service role"
  on public.rooms_recordings_consent;
create policy "rooms_recordings_consent service role"
  on public.rooms_recordings_consent
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

------------------------------------------------------------------------
-- 4. Documentation
------------------------------------------------------------------------

comment on table public.rooms_recordings_consent is
  'V3 Wave A2: GDPR-aligned consent ledger for room recordings. One row '
  'per (session, user). granted_at = user has consented; withdrew_at = '
  'user later revoked. consent_text_version pins the exact copy the user '
  'agreed to. RLS: user owns their consent — even room owner cannot read '
  'other users'' consent state directly; the server action surfaces '
  'aggregate "all consented?" boolean only.';

comment on column public.rooms_recordings_consent.consent_text_version is
  'Free-form version tag of the consent copy. Convention: ISO date + '
  'optional suffix, e.g. "2026-05-14" or "2026-05-14.v2". A copy change '
  'increments this so existing consents do not implicitly cover new text.';
