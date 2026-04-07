-- HenryCo HQ internal communications: visibility, attachments, full-text search helpers,
-- presence, client idempotency, strict RLS for authenticated clients + storage policies.

begin;

-- ---------------------------------------------------------------------------
-- Thread visibility (company-wide vs explicit membership)
-- ---------------------------------------------------------------------------
alter table public.hq_internal_comm_threads
  add column if not exists visibility text not null default 'members_only';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'hq_internal_comm_threads_visibility_chk'
  ) then
    alter table public.hq_internal_comm_threads
      add constraint hq_internal_comm_threads_visibility_chk
      check (visibility in ('all_owners', 'members_only'));
  end if;
end $$;

update public.hq_internal_comm_threads
set visibility = 'all_owners'
where kind in ('broadcast', 'announcement') and visibility = 'members_only';

update public.hq_internal_comm_threads
set visibility = 'members_only'
where kind in ('dm', 'group') and visibility is distinct from 'members_only';

-- ---------------------------------------------------------------------------
-- Messages: allow empty body (attachments-only), idempotency, search vector
-- ---------------------------------------------------------------------------
alter table public.hq_internal_comm_messages
  add column if not exists client_nonce uuid;

alter table public.hq_internal_comm_messages
  add column if not exists delivery_state text not null default 'sent';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'hq_internal_comm_messages_delivery_state_chk'
  ) then
    alter table public.hq_internal_comm_messages
      add constraint hq_internal_comm_messages_delivery_state_chk
      check (delivery_state in ('pending', 'sent', 'failed'));
  end if;
end $$;

alter table public.hq_internal_comm_messages
  drop constraint if exists hq_internal_comm_messages_body_check;

alter table public.hq_internal_comm_messages
  drop constraint if exists hq_internal_comm_messages_body_len_chk;

alter table public.hq_internal_comm_messages
  add constraint hq_internal_comm_messages_body_len_chk
  check (char_length(coalesce(body, '')) < 8000);

create unique index if not exists hq_internal_comm_messages_client_nonce_uidx
  on public.hq_internal_comm_messages (client_nonce)
  where client_nonce is not null;

do $bodytsv$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hq_internal_comm_messages'
      and column_name = 'body_tsv'
  ) then
    alter table public.hq_internal_comm_messages
      add column body_tsv tsvector
      generated always as (to_tsvector('english', coalesce(body, ''))) stored;
  end if;
end $bodytsv$;

create index if not exists hq_internal_comm_messages_body_tsv_idx
  on public.hq_internal_comm_messages using gin (body_tsv);

-- ---------------------------------------------------------------------------
-- Attachments (photos, video, files, voice)
-- ---------------------------------------------------------------------------
create table if not exists public.hq_internal_comm_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.hq_internal_comm_messages(id) on delete cascade,
  thread_id uuid not null references public.hq_internal_comm_threads(id) on delete cascade,
  uploader_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('image', 'video', 'file', 'voice')),
  storage_bucket text not null default 'hq-internal-comms',
  storage_path text not null,
  file_name text,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 536870912),
  duration_seconds numeric(12, 3),
  width integer,
  height integer,
  upload_status text not null default 'complete' check (upload_status in ('pending', 'complete', 'failed')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (storage_bucket, storage_path)
);

create index if not exists hq_internal_comm_attachments_message_idx
  on public.hq_internal_comm_attachments (message_id);

create index if not exists hq_internal_comm_attachments_thread_idx
  on public.hq_internal_comm_attachments (thread_id, created_at desc);

alter table public.hq_internal_comm_attachments enable row level security;

-- ---------------------------------------------------------------------------
-- Lightweight presence (optional UI)
-- ---------------------------------------------------------------------------
create table if not exists public.hq_internal_comm_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  thread_id uuid references public.hq_internal_comm_threads(id) on delete set null,
  last_seen_at timestamptz not null default timezone('utc', now())
);

create index if not exists hq_internal_comm_presence_thread_idx
  on public.hq_internal_comm_presence (thread_id, last_seen_at desc);

alter table public.hq_internal_comm_presence enable row level security;

-- ---------------------------------------------------------------------------
-- Access helpers (SECURITY DEFINER — keep search_path pinned)
-- ---------------------------------------------------------------------------
create or replace function public.hq_ic_can_read_thread(p_thread_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  t record;
begin
  if uid is null then
    return false;
  end if;

  if exists (
    select 1 from public.hq_internal_comm_thread_members m
    where m.thread_id = p_thread_id and m.user_id = uid
  ) then
    return true;
  end if;

  select id, visibility, division, kind into t
  from public.hq_internal_comm_threads
  where id = p_thread_id;

  if not found then
    return false;
  end if;

  if t.visibility is distinct from 'all_owners' then
    return false;
  end if;

  if exists (
    select 1 from public.owner_profiles o
    where o.user_id = uid and o.is_active and lower(trim(o.role)) in ('owner', 'admin')
  ) then
    return true;
  end if;

  if t.division is null then
    return exists (
      select 1 from public.workspace_staff_memberships w
      where w.user_id = uid and w.is_active = true
    );
  end if;

  return exists (
    select 1 from public.workspace_division_memberships d
    where d.user_id = uid and d.is_active and d.division = t.division
  );
end;
$$;

create or replace function public.hq_ic_can_write_thread(p_thread_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  t record;
begin
  if uid is null then
    return false;
  end if;

  select id, visibility, kind into t
  from public.hq_internal_comm_threads
  where id = p_thread_id;

  if not found then
    return false;
  end if;

  if exists (
    select 1 from public.hq_internal_comm_thread_members m
    where m.thread_id = p_thread_id and m.user_id = uid and lower(coalesce(m.role, 'observer')) in ('owner', 'member')
  ) then
    return true;
  end if;

  if t.visibility = 'all_owners' then
    return exists (
      select 1 from public.owner_profiles o
      where o.user_id = uid and o.is_active and lower(trim(o.role)) in ('owner', 'admin')
    );
  end if;

  return false;
end;
$$;

grant execute on function public.hq_ic_can_read_thread(uuid) to authenticated;
grant execute on function public.hq_ic_can_write_thread(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS policies (service role bypasses; anon has no access)
-- ---------------------------------------------------------------------------
drop policy if exists hq_ic_threads_select on public.hq_internal_comm_threads;
create policy hq_ic_threads_select
  on public.hq_internal_comm_threads
  for select
  to authenticated
  using (public.hq_ic_can_read_thread(id));

drop policy if exists hq_ic_messages_select on public.hq_internal_comm_messages;
create policy hq_ic_messages_select
  on public.hq_internal_comm_messages
  for select
  to authenticated
  using (public.hq_ic_can_read_thread(thread_id));

drop policy if exists hq_ic_messages_insert on public.hq_internal_comm_messages;
create policy hq_ic_messages_insert
  on public.hq_internal_comm_messages
  for insert
  to authenticated
  with check (
    public.hq_ic_can_write_thread(thread_id)
    and author_id = auth.uid()
  );

drop policy if exists hq_ic_members_select on public.hq_internal_comm_thread_members;
create policy hq_ic_members_select
  on public.hq_internal_comm_thread_members
  for select
  to authenticated
  using (public.hq_ic_can_read_thread(thread_id));

drop policy if exists hq_ic_members_insert on public.hq_internal_comm_thread_members;
create policy hq_ic_members_insert
  on public.hq_internal_comm_thread_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.hq_ic_can_read_thread(thread_id)
  );

drop policy if exists hq_ic_members_update on public.hq_internal_comm_thread_members;
create policy hq_ic_members_update
  on public.hq_internal_comm_thread_members
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists hq_ic_attachments_select on public.hq_internal_comm_attachments;
create policy hq_ic_attachments_select
  on public.hq_internal_comm_attachments
  for select
  to authenticated
  using (public.hq_ic_can_read_thread(thread_id));

drop policy if exists hq_ic_attachments_insert on public.hq_internal_comm_attachments;
create policy hq_ic_attachments_insert
  on public.hq_internal_comm_attachments
  for insert
  to authenticated
  with check (
    public.hq_ic_can_write_thread(thread_id)
    and uploader_id = auth.uid()
  );

drop policy if exists hq_ic_attachments_update on public.hq_internal_comm_attachments;
create policy hq_ic_attachments_update
  on public.hq_internal_comm_attachments
  for update
  to authenticated
  using (
    uploader_id = auth.uid()
    and public.hq_ic_can_write_thread(thread_id)
  )
  with check (
    uploader_id = auth.uid()
    and public.hq_ic_can_write_thread(thread_id)
  );

drop policy if exists hq_ic_presence_select on public.hq_internal_comm_presence;
create policy hq_ic_presence_select
  on public.hq_internal_comm_presence
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      thread_id is not null
      and public.hq_ic_can_read_thread(thread_id)
    )
  );

drop policy if exists hq_ic_presence_upsert on public.hq_internal_comm_presence;
create policy hq_ic_presence_upsert
  on public.hq_internal_comm_presence
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists hq_ic_presence_update on public.hq_internal_comm_presence;
create policy hq_ic_presence_update
  on public.hq_internal_comm_presence
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket + object policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hq-internal-comms',
  'hq-internal-comms',
  false,
  524288000,
  null
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

create or replace function public.hq_ic_storage_thread_id_from_path(obj_name text)
returns uuid
language sql
immutable
as $$
  select split_part(obj_name, '/', 1)::uuid;
$$;

drop policy if exists hq_ic_storage_select on storage.objects;
create policy hq_ic_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'hq-internal-comms'
    and public.hq_ic_can_read_thread(public.hq_ic_storage_thread_id_from_path(name))
  );

drop policy if exists hq_ic_storage_insert on storage.objects;
create policy hq_ic_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'hq-internal-comms'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.hq_ic_can_write_thread(public.hq_ic_storage_thread_id_from_path(name))
  );

drop policy if exists hq_ic_storage_update on storage.objects;
create policy hq_ic_storage_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'hq-internal-comms'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.hq_ic_can_write_thread(public.hq_ic_storage_thread_id_from_path(name))
  )
  with check (
    bucket_id = 'hq-internal-comms'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.hq_ic_can_write_thread(public.hq_ic_storage_thread_id_from_path(name))
  );

drop policy if exists hq_ic_storage_delete on storage.objects;
create policy hq_ic_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'hq-internal-comms'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.hq_ic_can_write_thread(public.hq_ic_storage_thread_id_from_path(name))
  );

-- ---------------------------------------------------------------------------
-- Supabase Realtime (hosted projects expose supabase_realtime publication)
-- ---------------------------------------------------------------------------
do $pub$
declare
  tbl text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach tbl in array[
      'hq_internal_comm_messages',
      'hq_internal_comm_attachments',
      'hq_internal_comm_presence'
    ]
    loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = tbl
      ) then
        execute format('alter publication supabase_realtime add table public.%I', tbl);
      end if;
    end loop;
  end if;
end $pub$;

commit;
