-- =============================================================================
-- INTELLIGENCE LIVE L1 — conversation persistence (the owner's window)
-- =============================================================================
-- Every Henry Onyx Intelligence support conversation is durable: the owner can
-- see every chat across every division, and a signed-in person can revisit their
-- own. Two tables — conversations (the thread) and messages (the turns).
--
-- The line that must not be crossed: a conversation belongs to exactly one person
-- (or one anonymous session), and no client may write these rows or read anyone
-- else's. ALL writes go through the account server action on the service role;
-- RLS is default-deny and exposes ONLY a signed-in person's own read.
--
-- Invariants enforced here:
--   1. Default-deny RLS on both tables. No INSERT/UPDATE/DELETE policy exists, so
--      no client (anon or authenticated) can ever write — only the service role
--      (which bypasses RLS) writes, from the governed server action.
--   2. A signed-in person reads ONLY their own conversations + messages
--      (user_id = auth.uid()). Anonymous conversations (user_id null) are
--      unreadable via the Data API by anyone — they live server-side only and in
--      the visitor's own in-session client state. auth.uid() is never null-matched.
--   3. The owner's window (L2 console) reads via the service role, exactly like
--      the existing support queue — no is_owner() policy is added here, so the
--      known owner_profiles RLS-recursion path is never touched.
--   4. Escalation is a durable link, not a copy: escalated_thread_id points at the
--      existing Onyx Line support_threads row the handoff created.
-- service_role bypasses RLS by default (no explicit service_role policy needed).
-- =============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.intelligence_conversations (
  id                   uuid primary key default gen_random_uuid(),
  -- Null for an anonymous visitor; the session id groups their turns instead.
  user_id              uuid references auth.users(id) on delete set null,
  -- The stable synthetic session actor (e.g. "intelligence:<uuid>") — groups anon
  -- turns and rate-limits per visitor, mirroring the studio coach precedent.
  session_id           text not null check (char_length(session_id) between 1 and 128),
  division             text not null
                         check (division in
                           ('marketplace','care','jobs','learn','logistics','property','studio','account','hub')),
  status               text not null default 'active'
                         check (status in ('active','escalated','closed')),
  -- Set when the conversation handed off to a human on the Onyx Line: the id of the
  -- support_threads row the handoff created. A plain uuid, not a hard FK — support_threads
  -- is applied-not-in-repo (the account_platform_core capture), so a hard reference would
  -- break a fresh shadow build; integrity is held app-side (the server action inserts the
  -- thread first, and support threads are not deleted).
  escalated_thread_id  uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  last_message_at      timestamptz not null default now()
);

create table if not exists public.intelligence_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.intelligence_conversations(id) on delete cascade,
  role             text not null check (role in ('user','assistant','system')),
  content          text not null default '',
  -- Assistant turns: the resolved navigation buttons that were shown ([] when none).
  navigate         jsonb not null default '[]'::jsonb,
  -- Assistant turns: true when this turn escalated to a human.
  handoff          boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists intelligence_conversations_user_idx
  on public.intelligence_conversations (user_id) where user_id is not null;
create index if not exists intelligence_conversations_session_idx
  on public.intelligence_conversations (session_id);
create index if not exists intelligence_conversations_recent_idx
  on public.intelligence_conversations (last_message_at desc);
create index if not exists intelligence_conversations_escalated_idx
  on public.intelligence_conversations (status) where status = 'escalated';
create index if not exists intelligence_messages_conversation_idx
  on public.intelligence_messages (conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- updated_at trigger on conversations
-- -----------------------------------------------------------------------------
create or replace function public.intelligence_conversations_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists intelligence_conversations_updated_at on public.intelligence_conversations;
create trigger intelligence_conversations_updated_at
  before update on public.intelligence_conversations
  for each row
  execute function public.intelligence_conversations_set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security (default-deny; only a signed-in person's own read is opened)
-- -----------------------------------------------------------------------------
alter table public.intelligence_conversations enable row level security;
alter table public.intelligence_messages      enable row level security;

-- A signed-in person reads ONLY their own conversations. Anonymous rows (user_id
-- null) never match (auth.uid() is null for anon and null = null is not true), so
-- they are Data-API-invisible — server-side + in-session client state only.
drop policy if exists intelligence_conversations_read_own on public.intelligence_conversations;
create policy intelligence_conversations_read_own on public.intelligence_conversations
  for select to authenticated
  using (user_id = auth.uid());

-- Messages inherit the same ownership through their conversation.
drop policy if exists intelligence_messages_read_own on public.intelligence_messages;
create policy intelligence_messages_read_own on public.intelligence_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.intelligence_conversations c
       where c.id = intelligence_messages.conversation_id
         and c.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policy on either table by design: every write is made by
-- the account server action on the service role, which bypasses RLS. Clients can
-- never forge, edit, or delete a conversation or a turn.
