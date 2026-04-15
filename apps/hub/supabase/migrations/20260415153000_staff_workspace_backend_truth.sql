begin;

create extension if not exists pgcrypto;

create or replace function public.workspace_auth_email()
returns text
language sql
stable
as $$
  select nullif(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '');
$$;

create or replace function public.workspace_current_actor_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (
      select op.role
      from public.owner_profiles op
      where op.is_active = true
        and (
          op.user_id = auth.uid()
          or (
            op.email is not null
            and lower(trim(op.email)) = public.workspace_auth_email()
          )
        )
      order by op.updated_at desc nulls last, op.created_at desc nulls last
      limit 1
    ),
    (
      select p.role
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    ),
    'staff'
  );
$$;

create or replace function public.workspace_is_owner_operator()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.owner_profiles op
    where op.is_active = true
      and coalesce(op.role, 'owner') in ('owner', 'admin')
      and (
        op.user_id = auth.uid()
        or (
          op.email is not null
          and lower(trim(op.email)) = public.workspace_auth_email()
        )
      )
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(trim(coalesce(p.role, ''))) = 'owner'
  );
$$;

create or replace function public.workspace_has_shared_profile_support()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(trim(coalesce(p.role, ''))) in ('owner', 'manager', 'support', 'staff', 'rider', 'finance')
  );
$$;

create or replace function public.workspace_has_membership_in_table(p_table text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_email text := public.workspace_auth_email();
  v_exists boolean := false;
  v_sql text;
begin
  if p_table is null or btrim(p_table) = '' then
    return false;
  end if;

  if to_regclass('public.' || p_table) is null then
    return false;
  end if;

  v_sql := format(
    $fmt$
      select exists (
        select 1
        from public.%I membership
        where coalesce(membership.is_active, true) = true
          and (
            membership.user_id = auth.uid()
            or (
              membership.normalized_email is not null
              and membership.normalized_email = %L
            )
          )
      )
    $fmt$,
    p_table,
    coalesce(v_email, '')
  );

  execute v_sql into v_exists;
  return coalesce(v_exists, false);
end;
$$;

create or replace function public.workspace_has_any_staff_membership()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.workspace_is_owner_operator()
    or public.workspace_has_shared_profile_support()
    or public.workspace_has_membership_in_table('workspace_staff_memberships')
    or public.workspace_has_membership_in_table('workspace_division_memberships')
    or public.workspace_has_membership_in_table('care_role_memberships')
    or public.workspace_has_membership_in_table('marketplace_role_memberships')
    or public.workspace_has_membership_in_table('studio_role_memberships')
    or public.workspace_has_membership_in_table('jobs_role_memberships')
    or public.workspace_has_membership_in_table('property_role_memberships')
    or public.workspace_has_membership_in_table('learn_role_memberships')
    or public.workspace_has_membership_in_table('logistics_role_memberships');
$$;

create or replace function public.workspace_has_division_access(p_division text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_division text := lower(trim(coalesce(p_division, '')));
  v_email text := public.workspace_auth_email();
begin
  if public.workspace_is_owner_operator() then
    return true;
  end if;

  if v_division = '' or v_division = 'account' then
    return public.workspace_has_any_staff_membership();
  end if;

  if to_regclass('public.workspace_division_memberships') is not null then
    if exists (
      select 1
      from public.workspace_division_memberships membership
      where coalesce(membership.is_active, true) = true
        and lower(trim(coalesce(membership.division, ''))) = v_division
        and (
          membership.user_id = auth.uid()
          or (
            membership.normalized_email is not null
            and membership.normalized_email = v_email
          )
        )
    ) then
      return true;
    end if;
  end if;

  if to_regclass('public.workspace_staff_memberships') is not null then
    if exists (
      select 1
      from public.workspace_staff_memberships membership
      where coalesce(membership.is_active, true) = true
        and lower(trim(coalesce(membership.primary_division, ''))) = v_division
        and (
          membership.user_id = auth.uid()
          or (
            membership.normalized_email is not null
            and membership.normalized_email = v_email
          )
        )
    ) then
      return true;
    end if;
  end if;

  if v_division = 'care' and public.workspace_has_shared_profile_support() then
    return true;
  end if;

  return case v_division
    when 'care' then public.workspace_has_membership_in_table('care_role_memberships')
    when 'marketplace' then public.workspace_has_membership_in_table('marketplace_role_memberships')
    when 'studio' then public.workspace_has_membership_in_table('studio_role_memberships')
    when 'jobs' then public.workspace_has_membership_in_table('jobs_role_memberships')
    when 'property' then public.workspace_has_membership_in_table('property_role_memberships')
    when 'learn' then public.workspace_has_membership_in_table('learn_role_memberships')
    when 'logistics' then public.workspace_has_membership_in_table('logistics_role_memberships')
    else false
  end;
end;
$$;

grant execute on function public.workspace_auth_email() to authenticated;
grant execute on function public.workspace_current_actor_role() to authenticated;
grant execute on function public.workspace_is_owner_operator() to authenticated;
grant execute on function public.workspace_has_shared_profile_support() to authenticated;
grant execute on function public.workspace_has_membership_in_table(text) to authenticated;
grant execute on function public.workspace_has_any_staff_membership() to authenticated;
grant execute on function public.workspace_has_division_access(text) to authenticated;

update public.support_threads
set
  status = case
    when lower(trim(coalesce(status, ''))) in ('open', 'awaiting_reply', 'pending_customer', 'in_progress', 'resolved', 'closed')
      then lower(trim(status))
    else 'open'
  end,
  priority = case
    when lower(trim(coalesce(priority, ''))) in ('low', 'normal', 'high', 'urgent')
      then lower(trim(priority))
    else 'normal'
  end;

update public.support_messages
set sender_type = case
  when lower(trim(coalesce(sender_type, ''))) in ('customer', 'agent', 'system')
    then lower(trim(sender_type))
  else 'customer'
end;

alter table public.support_threads
  alter column status set default 'open',
  alter column priority set default 'normal',
  add column if not exists last_customer_activity_at timestamptz,
  add column if not exists last_staff_activity_at timestamptz,
  add column if not exists last_activity_at timestamptz,
  add column if not exists last_escalated_at timestamptz;

alter table public.support_messages
  alter column sender_type set default 'customer',
  alter column attachments set default '[]'::jsonb,
  alter column is_read set default false;

alter table public.support_threads
  drop constraint if exists support_threads_status_check;
alter table public.support_threads
  add constraint support_threads_status_check
  check (status in ('open', 'awaiting_reply', 'pending_customer', 'in_progress', 'resolved', 'closed'));

alter table public.support_threads
  drop constraint if exists support_threads_priority_check;
alter table public.support_threads
  add constraint support_threads_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));

alter table public.support_messages
  drop constraint if exists support_messages_sender_type_check;
alter table public.support_messages
  add constraint support_messages_sender_type_check
  check (sender_type in ('customer', 'agent', 'system'));

create table if not exists public.support_thread_internal_notes (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'staff',
  body text not null,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.support_thread_internal_notes
  alter column visibility set default 'staff',
  alter column evidence set default '[]'::jsonb,
  drop constraint if exists support_thread_internal_notes_visibility_check;
alter table public.support_thread_internal_notes
  add constraint support_thread_internal_notes_visibility_check
  check (visibility in ('staff', 'owner'));

create table if not exists public.support_thread_events (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  event_type text not null,
  from_status text,
  to_status text,
  from_priority text,
  to_priority text,
  from_assignee uuid references auth.users(id) on delete set null,
  to_assignee uuid references auth.users(id) on delete set null,
  customer_visible boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_thread_internal_notes_thread_idx
  on public.support_thread_internal_notes(thread_id, created_at desc);
create index if not exists support_thread_internal_notes_author_idx
  on public.support_thread_internal_notes(author_user_id, created_at desc);
create index if not exists support_thread_events_thread_idx
  on public.support_thread_events(thread_id, created_at desc);
create index if not exists support_thread_events_actor_idx
  on public.support_thread_events(actor_user_id, created_at desc);
create index if not exists support_threads_division_lifecycle_idx
  on public.support_threads(division, status, priority, updated_at desc);
create index if not exists support_threads_assignee_lifecycle_idx
  on public.support_threads(assigned_to, status, updated_at desc);

create or replace function public.refresh_support_thread_activity(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_last_customer timestamptz;
  v_last_staff timestamptz;
  v_last_activity timestamptz;
begin
  select
    max(created_at) filter (where sender_type = 'customer'),
    max(created_at) filter (where sender_type in ('agent', 'system')),
    max(created_at)
  into v_last_customer, v_last_staff, v_last_activity
  from public.support_messages
  where thread_id = p_thread_id;

  update public.support_threads
  set
    last_customer_activity_at = coalesce(v_last_customer, last_customer_activity_at, created_at),
    last_staff_activity_at = coalesce(v_last_staff, last_staff_activity_at),
    last_activity_at = coalesce(v_last_activity, updated_at, created_at),
    updated_at = greatest(
      coalesce(updated_at, created_at, timezone('utc', now())),
      coalesce(v_last_activity, updated_at, created_at, timezone('utc', now()))
    )
  where id = p_thread_id;
end;
$$;

create or replace function public.support_messages_touch_thread()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.refresh_support_thread_activity(new.thread_id);
  return new;
end;
$$;

drop trigger if exists support_messages_touch_thread on public.support_messages;
create trigger support_messages_touch_thread
after insert or update on public.support_messages
for each row execute function public.support_messages_touch_thread();

update public.support_threads threads
set
  last_customer_activity_at = summary.last_customer_activity_at,
  last_staff_activity_at = summary.last_staff_activity_at,
  last_activity_at = coalesce(summary.last_activity_at, threads.updated_at, threads.created_at)
from (
  select
    thread_id,
    max(created_at) filter (where sender_type = 'customer') as last_customer_activity_at,
    max(created_at) filter (where sender_type in ('agent', 'system')) as last_staff_activity_at,
    max(created_at) as last_activity_at
  from public.support_messages
  group by thread_id
) as summary
where summary.thread_id = threads.id;

update public.support_threads
set last_activity_at = coalesce(last_activity_at, updated_at, created_at)
where last_activity_at is null;

create or replace function public.log_staff_action(
  p_action text,
  p_entity text,
  p_entity_id text,
  p_division text default null,
  p_severity text default 'info',
  p_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text := public.workspace_current_actor_role();
  v_division text := lower(trim(coalesce(p_division, p_meta ->> 'division', 'platform')));
  v_entity text := coalesce(nullif(trim(coalesce(p_entity, '')), ''), 'unknown');
  v_entity_id text := nullif(trim(coalesce(p_entity_id, '')), '');
  v_audit_id uuid;
  v_meta jsonb := jsonb_strip_nulls(
    coalesce(p_meta, '{}'::jsonb) ||
    jsonb_build_object(
      'division', v_division,
      'severity', lower(trim(coalesce(p_severity, 'info'))),
      'recorded_at', timezone('utc', now())
    )
  );
begin
  if v_actor_id is null then
    raise exception 'Authenticated actor required for log_staff_action';
  end if;

  if not public.workspace_has_any_staff_membership() and not public.workspace_is_owner_operator() then
    raise exception 'Staff or owner access required for log_staff_action';
  end if;

  insert into public.staff_audit_logs (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id,
    meta
  )
  values (
    v_actor_id,
    v_actor_role,
    coalesce(nullif(trim(coalesce(p_action, '')), ''), 'staff.action'),
    v_entity,
    v_entity_id,
    v_meta
  )
  returning id into v_audit_id;

  insert into public.audit_logs (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    reason,
    new_values
  )
  values (
    v_actor_id,
    v_actor_role,
    coalesce(nullif(trim(coalesce(p_action, '')), ''), 'staff.action'),
    v_entity,
    v_entity_id,
    coalesce(nullif(trim(coalesce(p_action, '')), ''), 'staff.action'),
    v_meta
  );

  return v_audit_id;
end;
$$;

grant execute on function public.log_staff_action(text, text, text, text, text, jsonb) to authenticated;

create or replace function public.customer_create_support_thread(
  p_subject text,
  p_category text default 'general',
  p_division text default 'account',
  p_message text default '',
  p_priority text default 'normal',
  p_reference_type text default null,
  p_reference_id text default null
)
returns table (
  id uuid,
  division text,
  category text,
  priority text,
  status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_thread_id uuid;
  v_now timestamptz := timezone('utc', now());
  v_priority text := lower(trim(coalesce(p_priority, 'normal')));
begin
  if v_user_id is null then
    raise exception 'Authenticated user required for customer_create_support_thread';
  end if;

  if nullif(trim(coalesce(p_subject, '')), '') is null then
    raise exception 'Support subject is required';
  end if;

  if nullif(trim(coalesce(p_message, '')), '') is null then
    raise exception 'Support message is required';
  end if;

  if v_priority not in ('low', 'normal', 'high', 'urgent') then
    v_priority := 'normal';
  end if;

  insert into public.support_threads (
    user_id,
    subject,
    division,
    category,
    status,
    priority,
    reference_type,
    reference_id,
    customer_last_read_at,
    last_activity_at,
    last_customer_activity_at
  )
  values (
    v_user_id,
    trim(p_subject),
    lower(trim(coalesce(p_division, 'account'))),
    coalesce(nullif(trim(p_category), ''), 'general'),
    'open',
    v_priority,
    nullif(trim(coalesce(p_reference_type, '')), ''),
    nullif(trim(coalesce(p_reference_id, '')), ''),
    v_now,
    v_now,
    v_now
  )
  returning support_threads.id into v_thread_id;

  insert into public.support_messages (
    thread_id,
    sender_id,
    sender_type,
    body,
    attachments,
    is_read,
    read_at
  )
  values (
    v_thread_id,
    v_user_id,
    'customer',
    trim(p_message),
    '[]'::jsonb,
    false,
    null
  );

  insert into public.support_thread_events (
    thread_id,
    actor_user_id,
    actor_role,
    event_type,
    to_status,
    to_priority,
    customer_visible,
    metadata
  )
  values (
    v_thread_id,
    v_user_id,
    'customer',
    'customer_opened',
    'open',
    v_priority,
    true,
    jsonb_build_object('division', lower(trim(coalesce(p_division, 'account'))))
  );

  return query
  select t.id, t.division, t.category, t.priority, t.status
  from public.support_threads t
  where t.id = v_thread_id;
end;
$$;

grant execute on function public.customer_create_support_thread(text, text, text, text, text, text, text) to authenticated;

create or replace function public.customer_reply_support_thread(
  p_thread_id uuid,
  p_body text,
  p_attachments jsonb default '[]'::jsonb,
  p_priority text default null
)
returns table (
  id uuid,
  division text,
  category text,
  priority text,
  status text,
  subject text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_thread public.support_threads%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_priority text := nullif(lower(trim(coalesce(p_priority, ''))), '');
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required for customer_reply_support_thread';
  end if;

  if nullif(trim(coalesce(p_body, '')), '') is null then
    raise exception 'Support reply body is required';
  end if;

  if v_priority is not null and v_priority not in ('low', 'normal', 'high', 'urgent') then
    v_priority := null;
  end if;

  select *
  into v_thread
  from public.support_threads
  where id = p_thread_id
    and user_id = auth.uid()
  limit 1;

  if v_thread.id is null then
    raise exception 'Support thread not found';
  end if;

  if lower(coalesce(v_thread.status, '')) = 'closed' then
    raise exception 'Closed support threads cannot receive new customer replies';
  end if;

  insert into public.support_messages (
    thread_id,
    sender_id,
    sender_type,
    body,
    attachments,
    is_read,
    read_at
  )
  values (
    v_thread.id,
    auth.uid(),
    'customer',
    trim(p_body),
    coalesce(p_attachments, '[]'::jsonb),
    false,
    null
  );

  update public.support_threads
  set
    status = 'awaiting_reply',
    priority = coalesce(v_priority, priority),
    customer_last_read_at = v_now,
    updated_at = v_now,
    resolved_at = null,
    closed_at = null
  where id = v_thread.id;

  insert into public.support_thread_events (
    thread_id,
    actor_user_id,
    actor_role,
    event_type,
    from_status,
    to_status,
    from_priority,
    to_priority,
    customer_visible,
    metadata
  )
  values (
    v_thread.id,
    auth.uid(),
    'customer',
    'customer_reply',
    v_thread.status,
    'awaiting_reply',
    v_thread.priority,
    coalesce(v_priority, v_thread.priority),
    true,
    jsonb_build_object('division', coalesce(v_thread.division, 'account'))
  );

  return query
  select t.id, t.division, t.category, t.priority, t.status, t.subject
  from public.support_threads t
  where t.id = v_thread.id;
end;
$$;

grant execute on function public.customer_reply_support_thread(uuid, text, jsonb, text) to authenticated;

create or replace function public.customer_mark_support_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_thread_id uuid;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required for customer_mark_support_thread_read';
  end if;

  select id
  into v_thread_id
  from public.support_threads
  where id = p_thread_id
    and user_id = auth.uid()
  limit 1;

  if v_thread_id is null then
    raise exception 'Support thread not found';
  end if;

  update public.support_threads
  set customer_last_read_at = v_now
  where id = v_thread_id;

  update public.support_messages
  set is_read = true,
      read_at = v_now
  where thread_id = v_thread_id
    and sender_type <> 'customer'
    and coalesce(is_read, false) = false;
end;
$$;

grant execute on function public.customer_mark_support_thread_read(uuid) to authenticated;

create or replace function public.staff_mark_support_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_thread public.support_threads%rowtype;
  v_now timestamptz := timezone('utc', now());
begin
  select *
  into v_thread
  from public.support_threads
  where id = p_thread_id
  limit 1;

  if v_thread.id is null then
    raise exception 'Support thread not found';
  end if;

  if not public.workspace_has_division_access(v_thread.division) then
    raise exception 'Support thread access denied';
  end if;

  update public.support_threads
  set staff_last_read_at = v_now
  where id = v_thread.id;

  update public.support_messages
  set is_read = true,
      read_at = v_now
  where thread_id = v_thread.id
    and sender_type <> 'agent'
    and coalesce(is_read, false) = false;

  perform public.log_staff_action(
    'support.read',
    'support_thread',
    v_thread.id::text,
    v_thread.division,
    'info',
    jsonb_build_object(
      'subject', v_thread.subject,
      'category', v_thread.category
    )
  );
end;
$$;

grant execute on function public.staff_mark_support_thread_read(uuid) to authenticated;

create or replace function public.staff_assign_support_thread(
  p_thread_id uuid,
  p_assignee_user_id uuid default null
)
returns table (
  id uuid,
  user_id uuid,
  division text,
  category text,
  priority text,
  status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_thread public.support_threads%rowtype;
  v_previous_assignee uuid;
begin
  if auth.uid() is null then
    raise exception 'Authenticated actor required for staff_assign_support_thread';
  end if;

  select *
  into v_thread
  from public.support_threads
  where id = p_thread_id
  limit 1;

  if v_thread.id is null then
    raise exception 'Support thread not found';
  end if;

  if not public.workspace_has_division_access(v_thread.division) then
    raise exception 'Support thread access denied';
  end if;

  if p_assignee_user_id is not null and p_assignee_user_id <> auth.uid() and not public.workspace_is_owner_operator() then
    raise exception 'Only owner-level operators can assign support threads to other staff members';
  end if;

  v_previous_assignee := v_thread.assigned_to;

  update public.support_threads
  set
    assigned_to = p_assignee_user_id,
    updated_at = timezone('utc', now())
  where id = v_thread.id;

  insert into public.support_thread_events (
    thread_id,
    actor_user_id,
    actor_role,
    event_type,
    from_assignee,
    to_assignee,
    metadata
  )
  values (
    v_thread.id,
    auth.uid(),
    public.workspace_current_actor_role(),
    'assignment_changed',
    v_previous_assignee,
    p_assignee_user_id,
    jsonb_build_object('division', coalesce(v_thread.division, 'account'))
  );

  perform public.log_staff_action(
    'support.assignment.changed',
    'support_thread',
    v_thread.id::text,
    v_thread.division,
    'info',
    jsonb_build_object(
      'subject', v_thread.subject,
      'from_assignee', v_previous_assignee,
      'to_assignee', p_assignee_user_id
    )
  );

  return query
  select t.id, t.user_id, t.division, t.category, t.priority, t.status
  from public.support_threads t
  where t.id = v_thread.id;
end;
$$;

grant execute on function public.staff_assign_support_thread(uuid, uuid) to authenticated;

create or replace function public.staff_update_support_thread_priority(
  p_thread_id uuid,
  p_priority text
)
returns table (
  id uuid,
  user_id uuid,
  division text,
  category text,
  priority text,
  status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_thread public.support_threads%rowtype;
  v_next_priority text := lower(trim(coalesce(p_priority, 'normal')));
  v_signal_severity text := 'info';
begin
  if v_next_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Unsupported support priority %', v_next_priority;
  end if;

  select *
  into v_thread
  from public.support_threads
  where id = p_thread_id
  limit 1;

  if v_thread.id is null then
    raise exception 'Support thread not found';
  end if;

  if not public.workspace_has_division_access(v_thread.division) then
    raise exception 'Support thread access denied';
  end if;

  update public.support_threads
  set
    priority = v_next_priority,
    updated_at = timezone('utc', now()),
    last_escalated_at = case
      when v_next_priority in ('high', 'urgent') then timezone('utc', now())
      else last_escalated_at
    end
  where id = v_thread.id;

  insert into public.support_thread_events (
    thread_id,
    actor_user_id,
    actor_role,
    event_type,
    from_priority,
    to_priority,
    metadata
  )
  values (
    v_thread.id,
    auth.uid(),
    public.workspace_current_actor_role(),
    'priority_changed',
    v_thread.priority,
    v_next_priority,
    jsonb_build_object('division', coalesce(v_thread.division, 'account'))
  );

  if v_next_priority in ('high', 'urgent') then
    v_signal_severity := case when v_next_priority = 'urgent' then 'critical' else 'warning' end;
    insert into public.support_messages (
      thread_id,
      sender_id,
      sender_type,
      body,
      attachments,
      is_read,
      read_at
    )
    values (
      v_thread.id,
      auth.uid(),
      'system',
      'Support escalated this request for faster handling.',
      '[]'::jsonb,
      false,
      null
    );
  else
    insert into public.support_messages (
      thread_id,
      sender_id,
      sender_type,
      body,
      attachments,
      is_read,
      read_at
    )
    values (
      v_thread.id,
      auth.uid(),
      'system',
      'Support returned this request to the standard queue.',
      '[]'::jsonb,
      false,
      null
    );
  end if;

  perform public.log_staff_action(
    'support.priority.changed',
    'support_thread',
    v_thread.id::text,
    v_thread.division,
    v_signal_severity,
    jsonb_build_object(
      'subject', v_thread.subject,
      'from_priority', v_thread.priority,
      'to_priority', v_next_priority
    )
  );

  return query
  select t.id, t.user_id, t.division, t.category, t.priority, t.status
  from public.support_threads t
  where t.id = v_thread.id;
end;
$$;

grant execute on function public.staff_update_support_thread_priority(uuid, text) to authenticated;

create or replace function public.staff_update_support_thread_status(
  p_thread_id uuid,
  p_status text
)
returns table (
  id uuid,
  user_id uuid,
  division text,
  category text,
  priority text,
  status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_thread public.support_threads%rowtype;
  v_next_status text := lower(trim(coalesce(p_status, 'open')));
  v_now timestamptz := timezone('utc', now());
  v_message text := null;
begin
  if v_next_status not in ('open', 'awaiting_reply', 'pending_customer', 'in_progress', 'resolved', 'closed') then
    raise exception 'Unsupported support status %', v_next_status;
  end if;

  select *
  into v_thread
  from public.support_threads
  where id = p_thread_id
  limit 1;

  if v_thread.id is null then
    raise exception 'Support thread not found';
  end if;

  if not public.workspace_has_division_access(v_thread.division) then
    raise exception 'Support thread access denied';
  end if;

  update public.support_threads
  set
    status = v_next_status,
    updated_at = v_now,
    staff_last_read_at = v_now,
    resolved_at = case when v_next_status = 'resolved' then v_now else null end,
    closed_at = case when v_next_status = 'closed' then v_now else null end
  where id = v_thread.id;

  if v_next_status = 'resolved' then
    v_message := 'Support marked this thread resolved.';
  elsif v_next_status = 'closed' then
    v_message := 'Support closed this thread.';
  elsif lower(coalesce(v_thread.status, '')) in ('resolved', 'closed') and v_next_status not in ('resolved', 'closed') then
    v_message := 'Support reopened this thread.';
  elsif v_next_status = 'open' and lower(coalesce(v_thread.status, '')) <> 'open' then
    v_message := 'Support returned this thread to active handling.';
  end if;

  if v_message is not null then
    insert into public.support_messages (
      thread_id,
      sender_id,
      sender_type,
      body,
      attachments,
      is_read,
      read_at
    )
    values (
      v_thread.id,
      auth.uid(),
      'system',
      v_message,
      '[]'::jsonb,
      false,
      null
    );
  end if;

  insert into public.support_thread_events (
    thread_id,
    actor_user_id,
    actor_role,
    event_type,
    from_status,
    to_status,
    metadata
  )
  values (
    v_thread.id,
    auth.uid(),
    public.workspace_current_actor_role(),
    'status_changed',
    v_thread.status,
    v_next_status,
    jsonb_build_object('division', coalesce(v_thread.division, 'account'))
  );

  perform public.log_staff_action(
    'support.status.changed',
    'support_thread',
    v_thread.id::text,
    v_thread.division,
    case when v_next_status in ('resolved', 'closed') then 'info' else 'warning' end,
    jsonb_build_object(
      'subject', v_thread.subject,
      'from_status', v_thread.status,
      'to_status', v_next_status
    )
  );

  return query
  select t.id, t.user_id, t.division, t.category, t.priority, t.status
  from public.support_threads t
  where t.id = v_thread.id;
end;
$$;

grant execute on function public.staff_update_support_thread_status(uuid, text) to authenticated;

create or replace function public.staff_reply_support_thread(
  p_thread_id uuid,
  p_body text,
  p_next_status text default 'pending_customer',
  p_attachments jsonb default '[]'::jsonb
)
returns table (
  id uuid,
  user_id uuid,
  division text,
  category text,
  priority text,
  status text,
  subject text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_thread public.support_threads%rowtype;
  v_next_status text := lower(trim(coalesce(p_next_status, 'pending_customer')));
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then
    raise exception 'Authenticated actor required for staff_reply_support_thread';
  end if;

  if nullif(trim(coalesce(p_body, '')), '') is null then
    raise exception 'Support reply body is required';
  end if;

  if v_next_status not in ('pending_customer', 'in_progress', 'resolved', 'closed', 'awaiting_reply', 'open') then
    raise exception 'Unsupported support reply status %', v_next_status;
  end if;

  select *
  into v_thread
  from public.support_threads
  where id = p_thread_id
  limit 1;

  if v_thread.id is null then
    raise exception 'Support thread not found';
  end if;

  if not public.workspace_has_division_access(v_thread.division) then
    raise exception 'Support thread access denied';
  end if;

  insert into public.support_messages (
    thread_id,
    sender_id,
    sender_type,
    body,
    attachments,
    is_read,
    read_at
  )
  values (
    v_thread.id,
    auth.uid(),
    'agent',
    trim(p_body),
    coalesce(p_attachments, '[]'::jsonb),
    false,
    null
  );

  update public.support_threads
  set
    status = v_next_status,
    assigned_to = auth.uid(),
    updated_at = v_now,
    staff_last_read_at = v_now,
    resolved_at = case when v_next_status = 'resolved' then v_now else null end,
    closed_at = case when v_next_status = 'closed' then v_now else null end
  where id = v_thread.id;

  insert into public.support_thread_events (
    thread_id,
    actor_user_id,
    actor_role,
    event_type,
    from_status,
    to_status,
    from_assignee,
    to_assignee,
    customer_visible,
    metadata
  )
  values (
    v_thread.id,
    auth.uid(),
    public.workspace_current_actor_role(),
    'staff_reply',
    v_thread.status,
    v_next_status,
    v_thread.assigned_to,
    auth.uid(),
    true,
    jsonb_build_object('division', coalesce(v_thread.division, 'account'))
  );

  insert into public.customer_notifications (
    user_id,
    division,
    title,
    body,
    category,
    priority,
    action_url,
    reference_type,
    reference_id,
    is_read,
    read_at,
    detail_payload
  )
  values (
    v_thread.user_id,
    coalesce(v_thread.division, 'account'),
    'Support replied',
    left(trim(p_body), 280),
    'support',
    case
      when v_next_status in ('resolved', 'closed') then 'normal'
      else 'high'
    end,
    '/support/' || v_thread.id::text,
    'support_thread',
    v_thread.id::text,
    false,
    null,
    jsonb_strip_nulls(
      jsonb_build_object(
        'thread_id', v_thread.id,
        'subject', v_thread.subject,
        'next_status', v_next_status,
        'actor_user_id', auth.uid()
      )
    )
  );

  insert into public.customer_activity (
    user_id,
    division,
    activity_type,
    title,
    description,
    status,
    action_url,
    reference_type,
    reference_id,
    metadata
  )
  values (
    v_thread.user_id,
    coalesce(v_thread.division, 'account'),
    'support_replied',
    coalesce('Support replied: ' || nullif(trim(coalesce(v_thread.subject, '')), ''), 'Support replied'),
    left(trim(p_body), 280),
    v_next_status,
    '/support/' || v_thread.id::text,
    'support_thread',
    v_thread.id::text,
    jsonb_strip_nulls(
      jsonb_build_object(
        'thread_id', v_thread.id,
        'subject', v_thread.subject,
        'actor_user_id', auth.uid(),
        'actor_role', public.workspace_current_actor_role()
      )
    )
  );

  perform public.log_staff_action(
    'support.reply.sent',
    'support_thread',
    v_thread.id::text,
    v_thread.division,
    case when v_next_status in ('resolved', 'closed') then 'info' else 'warning' end,
    jsonb_build_object(
      'subject', v_thread.subject,
      'next_status', v_next_status,
      'assigned_to', auth.uid()
    )
  );

  return query
  select t.id, t.user_id, t.division, t.category, t.priority, t.status, t.subject
  from public.support_threads t
  where t.id = v_thread.id;
end;
$$;

grant execute on function public.staff_reply_support_thread(uuid, text, text, jsonb) to authenticated;

grant select on public.support_threads to authenticated;
grant select on public.support_messages to authenticated;
grant select, insert on public.support_thread_internal_notes to authenticated;
grant select on public.support_thread_events to authenticated;
grant select, insert on public.customer_activity to authenticated;
grant select, insert, update on public.customer_notifications to authenticated;
grant select, insert on public.staff_audit_logs to authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert on public.staff_navigation_audit to authenticated;

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_thread_internal_notes enable row level security;
alter table public.support_thread_events enable row level security;
alter table public.customer_activity enable row level security;
alter table public.customer_notifications enable row level security;
alter table public.staff_audit_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.staff_navigation_audit enable row level security;

drop policy if exists support_threads_customer_or_staff_read on public.support_threads;
create policy support_threads_customer_or_staff_read
on public.support_threads
for select
using (
  user_id = auth.uid()
  or public.workspace_has_division_access(division)
);

drop policy if exists support_threads_customer_create on public.support_threads;
create policy support_threads_customer_create
on public.support_threads
for insert
with check (user_id = auth.uid());

drop policy if exists support_messages_customer_or_staff_read on public.support_messages;
create policy support_messages_customer_or_staff_read
on public.support_messages
for select
using (
  exists (
    select 1
    from public.support_threads threads
    where threads.id = support_messages.thread_id
      and (
        threads.user_id = auth.uid()
        or public.workspace_has_division_access(threads.division)
      )
  )
);

drop policy if exists support_messages_customer_insert on public.support_messages;
create policy support_messages_customer_insert
on public.support_messages
for insert
with check (
  sender_type = 'customer'
  and sender_id = auth.uid()
  and exists (
    select 1
    from public.support_threads threads
    where threads.id = support_messages.thread_id
      and threads.user_id = auth.uid()
  )
);

drop policy if exists support_thread_internal_notes_staff_read on public.support_thread_internal_notes;
create policy support_thread_internal_notes_staff_read
on public.support_thread_internal_notes
for select
using (
  exists (
    select 1
    from public.support_threads threads
    where threads.id = support_thread_internal_notes.thread_id
      and public.workspace_has_division_access(threads.division)
  )
);

drop policy if exists support_thread_internal_notes_staff_insert on public.support_thread_internal_notes;
create policy support_thread_internal_notes_staff_insert
on public.support_thread_internal_notes
for insert
with check (
  author_user_id = auth.uid()
  and exists (
    select 1
    from public.support_threads threads
    where threads.id = support_thread_internal_notes.thread_id
      and public.workspace_has_division_access(threads.division)
  )
);

drop policy if exists support_thread_events_visible on public.support_thread_events;
create policy support_thread_events_visible
on public.support_thread_events
for select
using (
  exists (
    select 1
    from public.support_threads threads
    where threads.id = support_thread_events.thread_id
      and (
        public.workspace_has_division_access(threads.division)
        or (
          support_thread_events.customer_visible = true
          and threads.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists customer_activity_owner_or_staff_read on public.customer_activity;
create policy customer_activity_owner_or_staff_read
on public.customer_activity
for select
using (
  user_id = auth.uid()
  or public.workspace_has_division_access(division)
);

drop policy if exists customer_activity_owner_insert on public.customer_activity;
create policy customer_activity_owner_insert
on public.customer_activity
for insert
with check (
  user_id = auth.uid()
  or public.workspace_is_owner_operator()
  or public.workspace_has_division_access(division)
);

drop policy if exists customer_notifications_owner_or_staff_read on public.customer_notifications;
create policy customer_notifications_owner_or_staff_read
on public.customer_notifications
for select
using (
  user_id = auth.uid()
  or public.workspace_has_division_access(division)
);

drop policy if exists customer_notifications_owner_insert on public.customer_notifications;
create policy customer_notifications_owner_insert
on public.customer_notifications
for insert
with check (
  user_id = auth.uid()
  or public.workspace_is_owner_operator()
  or public.workspace_has_division_access(division)
);

drop policy if exists customer_notifications_owner_update on public.customer_notifications;
create policy customer_notifications_owner_update
on public.customer_notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists staff_audit_logs_self_or_owner_read on public.staff_audit_logs;
create policy staff_audit_logs_self_or_owner_read
on public.staff_audit_logs
for select
using (actor_id = auth.uid() or public.workspace_is_owner_operator());

drop policy if exists staff_audit_logs_self_insert on public.staff_audit_logs;
create policy staff_audit_logs_self_insert
on public.staff_audit_logs
for insert
with check (actor_id = auth.uid() or public.workspace_is_owner_operator());

drop policy if exists audit_logs_owner_read on public.audit_logs;
create policy audit_logs_owner_read
on public.audit_logs
for select
using (public.workspace_is_owner_operator());

drop policy if exists staff_navigation_audit_self_or_owner_read on public.staff_navigation_audit;
create policy staff_navigation_audit_self_or_owner_read
on public.staff_navigation_audit
for select
using (user_id = auth.uid() or public.workspace_is_owner_operator());

drop policy if exists staff_navigation_audit_self_insert on public.staff_navigation_audit;
create policy staff_navigation_audit_self_insert
on public.staff_navigation_audit
for insert
with check (user_id = auth.uid());

commit;
