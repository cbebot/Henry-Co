-- SA-1 — Studio Brief refactor: server-persisted brief flow + the SA-D5 discriminator.
--
-- WHY (docs/v3/studio-agency/PHASED-PLAN.md §SA-1, ratified 2026-07-18):
--   1. Abandoned-brief recovery: the only resumable brief draft today is a
--      frozen-v1 localStorage envelope — a cleared cache or a device change
--      loses the whole brief. studio_brief_flow_drafts persists the SAME
--      envelope server-side, keyed by the existing anonymous copilot session
--      cookie (studio_copilot_session) and/or the signed-in user.
--   2. Coach-conversation durability: copilot transcripts live only in
--      client localStorage (studio_brief_drafts is an anti-abuse LEDGER, not
--      a transcript store). studio_brief_conversations(+_messages) follows
--      the shipped intelligence_conversations idiom (hub migration
--      20260704120000) — deny-RLS, service-role-only writes, ownership =
--      user_id match OR (user_id IS NULL AND session_id match).
--   3. The discriminator: studio_briefs.brief_class persists the SA-D5
--      template/agency classification computed at submit. It drives review
--      routing now and SA-2 track selection + Mode-A envelope defaults later.
--
-- TABLE-OPS:
--   public.studio_brief_flow_drafts        (CREATE) — resumable draft envelope.
--   public.studio_brief_conversations      (CREATE) — coach conversation heads.
--   public.studio_brief_conversation_messages (CREATE) — coach turns.
--   public.studio_briefs (ALTER)           — add brief_class (nullable, additive).
--
-- MONEY: OFF the money path entirely. No pricing, payment, invoice, or
--   settlement table is touched; brief_class is a routing label, not a price.
--
-- RLS: all three new tables enable RLS with a SELECT-own policy for
--   authenticated users and ZERO write policies (service-role-only writes —
--   the app re-checks session/user ownership before every write, the
--   persist.ts idiom). Anonymous rows (user_id null) are unreadable via the
--   Data API by anyone; they are served only through server actions that
--   hold the session cookie.
--
-- DEPLOY ORDER: safe to ship code-first — the studio store's
--   writeWithSchemaRetry strips the brief_class column until this migration
--   is applied, and the flow-draft writers no-op on missing tables.
--
-- DOWN: drop the three tables + the added column.

-- ─────────────────────────────────────────────────────────────────────
-- 1. The SA-D5 discriminator on the brief itself
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_briefs
  add column if not exists brief_class text
    check (brief_class is null or brief_class in ('template','agency'));

comment on column public.studio_briefs.brief_class is
  'SA-1 — template|agency, classified at submit (package_intent seeded, '
  'refined by package resolution + estimated total). Drives SA-D5 review '
  'routing (template auto-sends, agency holds in_review), SA-2 track '
  'selection, and Mode-A envelope defaults. Null on pre-SA-1 briefs.';

-- ─────────────────────────────────────────────────────────────────────
-- 2. studio_brief_flow_drafts — abandoned-brief recovery
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_brief_flow_drafts (
  id uuid primary key default gen_random_uuid(),
  -- The stable anonymous identity: the studio_copilot_session cookie value.
  session_id text not null check (char_length(session_id) between 1 and 128),
  user_id uuid references auth.users(id) on delete set null,
  -- The frozen-v1 StudioBriefDraft envelope value (request-fields.ts).
  draft jsonb not null,
  draft_version integer not null default 1,
  source text not null default 'composer'
    check (source in ('composer','guided','copilot')),
  status text not null default 'active'
    check (status in ('active','submitted')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- One ACTIVE draft per session — the recovery target is always unambiguous.
create unique index if not exists studio_brief_flow_drafts_active_session_idx
  on public.studio_brief_flow_drafts (session_id)
  where status = 'active';

create index if not exists studio_brief_flow_drafts_user_idx
  on public.studio_brief_flow_drafts (user_id, updated_at desc)
  where user_id is not null;

comment on table public.studio_brief_flow_drafts is
  'SA-1 — server-side copy of the brief composer draft envelope, keyed by the '
  'anonymous copilot session cookie and/or the signed-in user. Local (same- '
  'device) drafts win; this row fills in after a device change or cleared '
  'cache. Contains NO activation PII (name/email/phone are never in the '
  'envelope). Writes are service-role-only.';

alter table public.studio_brief_flow_drafts enable row level security;

drop policy if exists studio_brief_flow_drafts_read_own on public.studio_brief_flow_drafts;
create policy studio_brief_flow_drafts_read_own on public.studio_brief_flow_drafts
  for select to authenticated
  using (user_id = auth.uid());
-- No INSERT / UPDATE / DELETE policy: writes are service-role-only. The
-- server action re-checks session/user ownership before every write and
-- never reuses a row across identities (the persist.ts idiom).

-- ─────────────────────────────────────────────────────────────────────
-- 3. studio_brief_conversations — durable coach transcripts
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_brief_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (char_length(session_id) between 1 and 128),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active'
    check (status in ('active','handed_off')),
  title text check (title is null or char_length(title) <= 160),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_brief_conversations_session_idx
  on public.studio_brief_conversations (session_id, updated_at desc);

create index if not exists studio_brief_conversations_user_idx
  on public.studio_brief_conversations (user_id, updated_at desc)
  where user_id is not null;

comment on table public.studio_brief_conversations is
  'SA-1 — server-persisted brief-coach conversation heads (the '
  'intelligence_conversations idiom, studio-local until the shared '
  'extraction lands). Transcript content is PII-redacted before persist '
  '(redactChatText). Writes are service-role-only, best-effort.';

alter table public.studio_brief_conversations enable row level security;

drop policy if exists studio_brief_conversations_read_own on public.studio_brief_conversations;
create policy studio_brief_conversations_read_own on public.studio_brief_conversations
  for select to authenticated
  using (user_id = auth.uid());
-- No INSERT / UPDATE / DELETE policy: service-role-only writes.

create table if not exists public.studio_brief_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.studio_brief_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_brief_conversation_messages_convo_idx
  on public.studio_brief_conversation_messages (conversation_id, created_at);

comment on table public.studio_brief_conversation_messages is
  'SA-1 — one row per persisted coach turn (PII-redacted before insert). '
  'Writes are service-role-only, best-effort: a failed persist never blocks '
  'a reply the client already has.';

alter table public.studio_brief_conversation_messages enable row level security;

drop policy if exists studio_brief_conversation_messages_read_own on public.studio_brief_conversation_messages;
create policy studio_brief_conversation_messages_read_own on public.studio_brief_conversation_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.studio_brief_conversations c
      where c.id = studio_brief_conversation_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
-- No INSERT / UPDATE / DELETE policy: service-role-only writes.

-- end of migration --
