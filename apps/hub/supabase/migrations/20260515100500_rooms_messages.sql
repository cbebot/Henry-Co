-- V3 Wave A2 — Rooms infrastructure: rooms_messages.
--
-- In-room chat stream. One row per message. Markdown body + jsonb
-- attachments shape (mirrors @henryco/chat-composer's ComposerAttachment
-- on the wire).
--
-- DESIGN
--   * Chat is the back-channel for everything the video iframe doesn't
--     surface: text Q&A in academy classes, screenshot drops in studio
--     reviews, the candidate's "I can't hear you" in interviews.
--   * `body_md` is Markdown — sanitised at render time. Wave A2 does
--     NOT bake a sanitiser; consumers (Wave B/C) pick the same Markdown
--     subset they use in their messaging surfaces (typically what
--     @henryco/messaging-thread renders).
--   * `attachments` is jsonb array of `{ id, url, contentType, bytes,
--     filename, thumbnailUrl? }`. Same shape as chat-composer attachments
--     so the composer's send payload feeds straight into sendRoomMessage.
--
-- RLS POSTURE
--   * SELECT / INSERT: only participants of the session.
--   * UPDATE / DELETE: forbidden via direct path (audit immutability).
--     Service-role retains override for compliance work.

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. rooms_messages
------------------------------------------------------------------------

create table if not exists public.rooms_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rooms_sessions(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,

  body_md text not null,
  attachments jsonb not null default '[]'::jsonb,

  sent_at timestamptz not null default timezone('utc', now())
);

------------------------------------------------------------------------
-- 2. Indexes
------------------------------------------------------------------------

-- Hot path: load the conversation for a session ordered newest-last
-- (RoomChat appends-down).
create index if not exists rooms_messages_session_sent_idx
  on public.rooms_messages(session_id, sent_at desc);

------------------------------------------------------------------------
-- 3. RLS
------------------------------------------------------------------------

alter table public.rooms_messages enable row level security;

-- SELECT — participants only.
drop policy if exists "rooms_messages select participants"
  on public.rooms_messages;
create policy "rooms_messages select participants"
  on public.rooms_messages
  for select
  using (
    exists (
      select 1
      from public.rooms_participants p
      where p.session_id = rooms_messages.session_id
        and p.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.rooms_sessions s
      where s.id = rooms_messages.session_id
        and s.owner_user_id = auth.uid()
    )
  );

-- INSERT — sender must be the caller AND the caller must be on the
-- session. Status check prevents posting to ended/cancelled rooms.
drop policy if exists "rooms_messages insert sender participant"
  on public.rooms_messages;
create policy "rooms_messages insert sender participant"
  on public.rooms_messages
  for insert
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1
      from public.rooms_participants p
      where p.session_id = session_id
        and p.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.rooms_sessions s
      where s.id = session_id
        and s.status in ('scheduled', 'live')
    )
  );

-- Service-role full access — compliance work.
drop policy if exists "rooms_messages service role"
  on public.rooms_messages;
create policy "rooms_messages service role"
  on public.rooms_messages
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

------------------------------------------------------------------------
-- 4. Documentation
------------------------------------------------------------------------

comment on table public.rooms_messages is
  'V3 Wave A2: in-room chat. body_md is Markdown (consumer sanitises). '
  'attachments jsonb mirrors @henryco/chat-composer''s ComposerAttachment '
  'shape so the composer''s send payload feeds straight in. RLS: '
  'participants + owner may SELECT; only the sender may INSERT (and '
  'only on a session they''re on). Updates / deletes blocked from '
  'authenticated paths (audit immutability).';
