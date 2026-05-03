-- STUDIO-MSG-01 — Studio Client Messaging System
--
-- Extends the existing studio_project_messages table (created in
-- 20260402190000_studio_init.sql, extended by STUDIO-CP-01 in
-- 20260503120000_studio_client_portal.sql) with the columns the
-- messaging UI needs: reply_to_id (threaded replies), message_type
-- (text / file / milestone_update / file_share / payment_update /
-- approval_request / system), metadata (structured payload for
-- non-text messages) and deleted_at (soft delete — messages are
-- never hard-deleted).
--
-- Adds three new companion tables:
--   studio_message_reactions       — per-user emoji reactions
--   studio_message_read_receipts   — granular per-user read receipts
--   studio_typing_indicators       — ephemeral typing state
--
-- studio_project_messages.read_by (jsonb) coexists with the new
-- studio_message_read_receipts table during transition. New code
-- writes to BOTH and reads from the receipts table.
--
-- All three new tables are added to the supabase_realtime publication
-- so the messaging surface can subscribe to live updates.

-- ─────────────────────────────────────────────────────────────────────
-- 1. Extend studio_project_messages with the messaging-system columns.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_project_messages
  add column if not exists reply_to_id uuid
    references public.studio_project_messages(id) on delete set null,
  add column if not exists message_type text not null default 'text',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists deleted_at timestamptz;

-- Constrain message_type to the spec's enumerated set. We use a CHECK
-- rather than a Postgres enum so future additions don't require a
-- type migration. Legacy rows default to 'text' via the column default.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'studio_project_messages_message_type_check'
  ) then
    alter table public.studio_project_messages
      add constraint studio_project_messages_message_type_check
      check (message_type in (
        'text',
        'file',
        'milestone_update',
        'file_share',
        'payment_update',
        'approval_request',
        'system'
      ));
  end if;
end $$;

create index if not exists studio_project_messages_reply_to_idx
  on public.studio_project_messages(reply_to_id)
  where reply_to_id is not null;
create index if not exists studio_project_messages_created_at_idx
  on public.studio_project_messages(project_id, created_at desc);
create index if not exists studio_project_messages_active_idx
  on public.studio_project_messages(project_id, created_at desc)
  where deleted_at is null;

-- ─────────────────────────────────────────────────────────────────────
-- 2. studio_message_reactions — per-user emoji reactions on messages.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.studio_project_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (message_id, user_id, emoji)
);

create index if not exists studio_message_reactions_message_idx
  on public.studio_message_reactions(message_id);
create index if not exists studio_message_reactions_user_idx
  on public.studio_message_reactions(user_id);

-- Limit reactions to the curated set defined in the messaging spec.
-- This keeps the surface honest — only meaningful, contextual reactions.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'studio_message_reactions_emoji_check'
  ) then
    alter table public.studio_message_reactions
      add constraint studio_message_reactions_emoji_check
      check (emoji in ('👍','✅','❤️','🔁','❓','🙏'));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. studio_message_read_receipts — per-user, per-message read state.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_message_read_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.studio_project_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  unique (message_id, user_id)
);

create index if not exists studio_message_read_receipts_message_idx
  on public.studio_message_read_receipts(message_id);
create index if not exists studio_message_read_receipts_user_idx
  on public.studio_message_read_receipts(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 4. studio_typing_indicators — ephemeral typing state per project/user.
--
--    Supabase Realtime presence handles the actual typing-state
--    propagation; this table exists for graceful fallback (presence
--    can drop on flaky networks) and so server-rendered surfaces can
--    show "currently typing" hints on first paint.
--
--    Rows are inserted on typing start, refreshed on continued typing,
--    and either explicitly deleted on stop or pruned by their TTL.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_typing_indicators (
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create index if not exists studio_typing_indicators_project_idx
  on public.studio_typing_indicators(project_id, started_at);

-- Helper: prune stale typing indicators (>10s old). Called by the
-- client when subscribing so the surface never shows ghost typists
-- left behind by a tab close or network drop.
create or replace function public.studio_prune_stale_typing()
returns void
language sql
as $$
  delete from public.studio_typing_indicators
  where started_at < timezone('utc', now()) - interval '10 seconds';
$$;

revoke all on function public.studio_prune_stale_typing() from public;
grant execute on function public.studio_prune_stale_typing()
  to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 5. RLS — studio_message_reactions.
--    Any project participant (client or staff) can see all reactions
--    on messages in projects they belong to. Each user can only
--    insert/delete their OWN reactions.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_message_reactions enable row level security;

drop policy if exists studio_message_reactions_select on public.studio_message_reactions;
create policy studio_message_reactions_select on public.studio_message_reactions
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_project_messages msg
    join public.studio_projects project on project.id = msg.project_id
    where msg.id = studio_message_reactions.message_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_message_reactions_insert on public.studio_message_reactions;
create policy studio_message_reactions_insert on public.studio_message_reactions
for insert with check (
  user_id = auth.uid()
  and (
    public.studio_is_staff()
    or exists (
      select 1
      from public.studio_project_messages msg
      join public.studio_projects project on project.id = msg.project_id
      where msg.id = studio_message_reactions.message_id
        and (
          project.client_user_id = auth.uid()
          or (
            project.normalized_email is not null
            and project.normalized_email = public.studio_auth_email()
          )
        )
    )
  )
);

drop policy if exists studio_message_reactions_delete on public.studio_message_reactions;
create policy studio_message_reactions_delete on public.studio_message_reactions
for delete using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- 6. RLS — studio_message_read_receipts.
--    Participants can insert their OWN receipts and select any
--    receipt for messages on their projects (so the UI can render
--    "seen by Adaeze and 1 other"). No update/delete — receipts are
--    append-only.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_message_read_receipts enable row level security;

drop policy if exists studio_message_read_receipts_select on public.studio_message_read_receipts;
create policy studio_message_read_receipts_select on public.studio_message_read_receipts
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_project_messages msg
    join public.studio_projects project on project.id = msg.project_id
    where msg.id = studio_message_read_receipts.message_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_message_read_receipts_insert on public.studio_message_read_receipts;
create policy studio_message_read_receipts_insert on public.studio_message_read_receipts
for insert with check (
  user_id = auth.uid()
  and (
    public.studio_is_staff()
    or exists (
      select 1
      from public.studio_project_messages msg
      join public.studio_projects project on project.id = msg.project_id
      where msg.id = studio_message_read_receipts.message_id
        and (
          project.client_user_id = auth.uid()
          or (
            project.normalized_email is not null
            and project.normalized_email = public.studio_auth_email()
          )
        )
    )
  )
);

-- ─────────────────────────────────────────────────────────────────────
-- 7. RLS — studio_typing_indicators.
--    All participants can select current indicators on their own
--    projects. Each user can only insert/delete their own indicator.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_typing_indicators enable row level security;

drop policy if exists studio_typing_indicators_select on public.studio_typing_indicators;
create policy studio_typing_indicators_select on public.studio_typing_indicators
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_typing_indicators.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_typing_indicators_insert on public.studio_typing_indicators;
create policy studio_typing_indicators_insert on public.studio_typing_indicators
for insert with check (
  user_id = auth.uid()
  and (
    public.studio_is_staff()
    or exists (
      select 1
      from public.studio_projects project
      where project.id = studio_typing_indicators.project_id
        and (
          project.client_user_id = auth.uid()
          or (
            project.normalized_email is not null
            and project.normalized_email = public.studio_auth_email()
          )
        )
    )
  )
);

drop policy if exists studio_typing_indicators_update on public.studio_typing_indicators;
create policy studio_typing_indicators_update on public.studio_typing_indicators
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists studio_typing_indicators_delete on public.studio_typing_indicators;
create policy studio_typing_indicators_delete on public.studio_typing_indicators
for delete using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- 8. Realtime publication — add the three new tables.
--    studio_project_messages is already published by STUDIO-CP-01.
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.studio_message_reactions;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.studio_message_read_receipts;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.studio_typing_indicators;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 9. Welcome-message trigger — when a project transitions to 'active'
--    (or is inserted directly as 'active'), drop a system welcome
--    message into the thread if no human-authored message exists yet.
--
--    Idempotent: only inserts when the thread has no existing
--    non-deleted messages, so the seed migration's welcome row (if
--    present) is honoured.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.studio_seed_welcome_message()
returns trigger
language plpgsql
as $$
declare
  resolved_team_label text;
begin
  if (tg_op = 'INSERT' and new.status = 'active')
     or (tg_op = 'UPDATE' and new.status = 'active' and coalesce(old.status, '') <> 'active')
  then
    if exists (
      select 1
      from public.studio_project_messages
      where project_id = new.id
        and deleted_at is null
    ) then
      return new;
    end if;

    select string_agg(coalesce(profile.name, assignment.label), ' and ' order by assignment.created_at)
      into resolved_team_label
    from public.studio_project_assignments assignment
    left join public.studio_team_profiles profile on profile.id = assignment.team_id
    where assignment.project_id = new.id;

    insert into public.studio_project_messages (
      project_id,
      sender,
      sender_role,
      body,
      is_internal,
      message_type,
      metadata
    ) values (
      new.id,
      'HenryCo Studio',
      'team',
      format(
        'Welcome to %s. %sWe will keep everything organised here — questions, updates, files, and decisions all in one place. Feel free to ask anything.',
        new.title,
        case
          when resolved_team_label is null then ''
          else format('Your Studio team is %s. ', resolved_team_label)
        end
      ),
      false,
      'system',
      jsonb_build_object('welcome', true, 'project_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists studio_projects_seed_welcome on public.studio_projects;
create trigger studio_projects_seed_welcome
  after insert or update of status on public.studio_projects
  for each row
  execute function public.studio_seed_welcome_message();
