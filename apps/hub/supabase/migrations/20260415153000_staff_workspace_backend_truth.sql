create extension if not exists pgcrypto;

create or replace function public.ops_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

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
begin
  if public.workspace_is_owner_operator() then
    return true;
  end if;

  if v_division = '' or v_division = 'account' then
    return public.workspace_has_any_staff_membership();
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
grant execute on function public.workspace_has_membership_in_table(text) to authenticated;
grant execute on function public.workspace_has_any_staff_membership() to authenticated;
grant execute on function public.workspace_has_division_access(text) to authenticated;

create table if not exists public.care_role_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  scope_type text not null default 'platform',
  scope_id uuid,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jobs_role_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  scope_type text not null default 'platform',
  scope_id uuid,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.logistics_role_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  scope_type text not null default 'platform',
  scope_id uuid,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.logistics_role_memberships
  add column if not exists normalized_email text,
  add column if not exists scope_type text not null default 'platform',
  add column if not exists scope_id uuid,
  add column if not exists role text,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists care_role_memberships_user_idx
  on public.care_role_memberships(user_id);
create index if not exists care_role_memberships_email_idx
  on public.care_role_memberships(normalized_email);
create unique index if not exists care_role_memberships_scope_role_idx
  on public.care_role_memberships(user_id, normalized_email, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid), role);
create index if not exists jobs_role_memberships_user_idx
  on public.jobs_role_memberships(user_id);
create index if not exists jobs_role_memberships_email_idx
  on public.jobs_role_memberships(normalized_email);
create unique index if not exists jobs_role_memberships_scope_role_idx
  on public.jobs_role_memberships(user_id, normalized_email, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid), role);
create index if not exists logistics_role_memberships_user_idx
  on public.logistics_role_memberships(user_id);
create index if not exists logistics_role_memberships_email_idx
  on public.logistics_role_memberships(normalized_email);
create unique index if not exists logistics_role_memberships_scope_role_idx
  on public.logistics_role_memberships(user_id, normalized_email, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid), role);

drop trigger if exists care_role_memberships_updated_at on public.care_role_memberships;
create trigger care_role_memberships_updated_at
before update on public.care_role_memberships
for each row execute function public.ops_set_updated_at();

drop trigger if exists jobs_role_memberships_updated_at on public.jobs_role_memberships;
create trigger jobs_role_memberships_updated_at
before update on public.jobs_role_memberships
for each row execute function public.ops_set_updated_at();

drop trigger if exists logistics_role_memberships_updated_at on public.logistics_role_memberships;
create trigger logistics_role_memberships_updated_at
before update on public.logistics_role_memberships
for each row execute function public.ops_set_updated_at();

alter table public.care_role_memberships enable row level security;
alter table public.jobs_role_memberships enable row level security;
alter table public.logistics_role_memberships enable row level security;

drop policy if exists care_role_memberships_visible on public.care_role_memberships;
create policy care_role_memberships_visible
on public.care_role_memberships
for select
using (
  public.workspace_is_owner_operator()
  or user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.workspace_auth_email()
  )
);

drop policy if exists care_role_memberships_manage on public.care_role_memberships;
create policy care_role_memberships_manage
on public.care_role_memberships
for all
using (public.workspace_is_owner_operator())
with check (public.workspace_is_owner_operator());

drop policy if exists jobs_role_memberships_visible on public.jobs_role_memberships;
create policy jobs_role_memberships_visible
on public.jobs_role_memberships
for select
using (
  public.workspace_is_owner_operator()
  or user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.workspace_auth_email()
  )
);

drop policy if exists jobs_role_memberships_manage on public.jobs_role_memberships;
create policy jobs_role_memberships_manage
on public.jobs_role_memberships
for all
using (public.workspace_is_owner_operator())
with check (public.workspace_is_owner_operator());

drop policy if exists logistics_role_memberships_visible on public.logistics_role_memberships;
create policy logistics_role_memberships_visible
on public.logistics_role_memberships
for select
using (
  public.workspace_is_owner_operator()
  or user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.workspace_auth_email()
  )
);

drop policy if exists logistics_role_memberships_manage on public.logistics_role_memberships;
create policy logistics_role_memberships_manage
on public.logistics_role_memberships
for all
using (public.workspace_is_owner_operator())
with check (public.workspace_is_owner_operator());

alter table public.support_threads
  add column if not exists last_customer_activity_at timestamptz,
  add column if not exists last_staff_activity_at timestamptz,
  add column if not exists last_activity_at timestamptz,
  add column if not exists last_escalated_at timestamptz;

create table if not exists public.support_thread_internal_notes (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'staff',
  body text not null,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

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

create table if not exists public.logistics_dispatch_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.logistics_shipments(id) on delete cascade,
  division text not null default 'logistics',
  event_type text not null,
  severity text not null default 'info',
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_dispatch_events_shipment_idx
  on public.logistics_dispatch_events(shipment_id, created_at desc);
create index if not exists logistics_dispatch_events_severity_idx
  on public.logistics_dispatch_events(severity, created_at desc);

create table if not exists public.ops_escalations (
  id uuid primary key default gen_random_uuid(),
  division text not null default 'platform',
  queue_key text not null default 'general',
  reference_type text not null,
  reference_id text not null,
  severity text not null default 'warning',
  status text not null default 'open',
  summary text not null,
  reason text,
  evidence jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  opened_by_user_id uuid references auth.users(id) on delete set null,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolved_by_user_id uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists ops_escalations_active_reference_uidx
  on public.ops_escalations(division, reference_type, reference_id)
  where status in ('open', 'acknowledged', 'in_review');
create index if not exists ops_escalations_queue_status_idx
  on public.ops_escalations(division, queue_key, status, severity, created_at desc);
create index if not exists ops_escalations_assignee_idx
  on public.ops_escalations(assigned_to_user_id, status, due_at);

create table if not exists public.ops_follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  division text not null default 'platform',
  escalation_id uuid references public.ops_escalations(id) on delete set null,
  reference_type text not null,
  reference_id text not null,
  summary text not null,
  description text,
  priority text not null default 'normal',
  status text not null default 'open',
  created_by_user_id uuid references auth.users(id) on delete set null,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ops_follow_up_tasks_status_idx
  on public.ops_follow_up_tasks(division, status, priority, due_at);
create index if not exists ops_follow_up_tasks_assignee_idx
  on public.ops_follow_up_tasks(assigned_to_user_id, status, due_at);
create index if not exists ops_follow_up_tasks_escalation_idx
  on public.ops_follow_up_tasks(escalation_id, created_at desc);

create table if not exists public.ops_alert_signals (
  id uuid primary key default gen_random_uuid(),
  division text not null default 'platform',
  signal_key text not null,
  severity text not null default 'warning',
  status text not null default 'open',
  source_table text,
  source_id text,
  entity_type text,
  entity_id text,
  actor_user_id uuid references auth.users(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  score integer not null default 0,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ops_alert_signals_status_idx
  on public.ops_alert_signals(division, status, severity, created_at desc);
create index if not exists ops_alert_signals_signal_idx
  on public.ops_alert_signals(signal_key, created_at desc);
create index if not exists ops_alert_signals_owner_idx
  on public.ops_alert_signals(owner_user_id, status, created_at desc);

drop trigger if exists ops_escalations_updated_at on public.ops_escalations;
create trigger ops_escalations_updated_at
before update on public.ops_escalations
for each row execute function public.ops_set_updated_at();

drop trigger if exists ops_follow_up_tasks_updated_at on public.ops_follow_up_tasks;
create trigger ops_follow_up_tasks_updated_at
before update on public.ops_follow_up_tasks
for each row execute function public.ops_set_updated_at();

drop trigger if exists ops_alert_signals_updated_at on public.ops_alert_signals;
create trigger ops_alert_signals_updated_at
before update on public.ops_alert_signals
for each row execute function public.ops_set_updated_at();

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_thread_internal_notes enable row level security;
alter table public.support_thread_events enable row level security;
alter table public.customer_activity enable row level security;
alter table public.customer_notifications enable row level security;
alter table public.staff_audit_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.staff_navigation_audit enable row level security;
alter table public.logistics_dispatch_events enable row level security;
alter table public.ops_escalations enable row level security;
alter table public.ops_follow_up_tasks enable row level security;
alter table public.ops_alert_signals enable row level security;

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
with check (user_id = auth.uid() or public.workspace_is_owner_operator() or public.workspace_has_division_access(division));

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

drop policy if exists logistics_dispatch_events_visible on public.logistics_dispatch_events;
create policy logistics_dispatch_events_visible
on public.logistics_dispatch_events
for select
using (public.workspace_has_division_access(division));

drop policy if exists logistics_dispatch_events_manage on public.logistics_dispatch_events;
create policy logistics_dispatch_events_manage
on public.logistics_dispatch_events
for all
using (public.workspace_has_division_access(division))
with check (public.workspace_has_division_access(division));

drop policy if exists ops_escalations_visible on public.ops_escalations;
create policy ops_escalations_visible
on public.ops_escalations
for select
using (public.workspace_has_division_access(division));

drop policy if exists ops_escalations_insert on public.ops_escalations;
create policy ops_escalations_insert
on public.ops_escalations
for insert
with check (public.workspace_has_division_access(division));

drop policy if exists ops_follow_up_tasks_visible on public.ops_follow_up_tasks;
create policy ops_follow_up_tasks_visible
on public.ops_follow_up_tasks
for select
using (public.workspace_has_division_access(division));

drop policy if exists ops_follow_up_tasks_insert on public.ops_follow_up_tasks;
create policy ops_follow_up_tasks_insert
on public.ops_follow_up_tasks
for insert
with check (public.workspace_has_division_access(division));

drop policy if exists ops_follow_up_tasks_update on public.ops_follow_up_tasks;
create policy ops_follow_up_tasks_update
on public.ops_follow_up_tasks
for update
using (public.workspace_has_division_access(division))
with check (public.workspace_has_division_access(division));

drop policy if exists ops_alert_signals_visible on public.ops_alert_signals;
create policy ops_alert_signals_visible
on public.ops_alert_signals
for select
using (public.workspace_has_division_access(division));

drop policy if exists ops_alert_signals_insert on public.ops_alert_signals;
create policy ops_alert_signals_insert
on public.ops_alert_signals
for insert
with check (public.workspace_has_division_access(division) or public.workspace_is_owner_operator());

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
  v_audit_id uuid;
  v_signal_key text := nullif(trim(coalesce(p_meta ->> 'signal_key', '')), '');
  v_signal_summary text := nullif(trim(coalesce(p_meta ->> 'summary', '')), '');
  v_score integer := greatest(coalesce((p_meta ->> 'score')::integer, 0), 0);
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
    coalesce(nullif(trim(p_action), ''), 'staff.action'),
    coalesce(nullif(trim(p_entity), ''), 'unknown'),
    nullif(trim(coalesce(p_entity_id, '')), ''),
    jsonb_strip_nulls(
      coalesce(p_meta, '{}'::jsonb) ||
      jsonb_build_object(
        'division', v_division,
        'severity', lower(trim(coalesce(p_severity, 'info'))),
        'recorded_at', timezone('utc', now())
      )
    )
  )
  returning id into v_audit_id;

  if v_signal_key is null then
    if lower(coalesce(p_action, '')) like 'staff.%' or lower(coalesce(p_action, '')) like 'membership.%' then
      v_signal_key := 'staff_governance';
    elsif lower(coalesce(p_action, '')) like 'support.%' and lower(coalesce(p_severity, 'info')) in ('warning', 'critical') then
      v_signal_key := 'support_pressure';
    elsif lower(coalesce(p_action, '')) like 'queue.%' then
      v_signal_key := 'queue_pressure';
    end if;
  end if;

  if v_signal_key is not null or lower(coalesce(p_severity, 'info')) in ('warning', 'critical') then
    insert into public.ops_alert_signals (
      division,
      signal_key,
      severity,
      status,
      source_table,
      source_id,
      entity_type,
      entity_id,
      actor_user_id,
      summary,
      details,
      score
    )
    values (
      coalesce(nullif(v_division, ''), 'platform'),
      coalesce(v_signal_key, replace(lower(coalesce(p_action, 'staff.action')), '.', '_')),
      case
        when lower(coalesce(p_severity, 'info')) = 'critical' then 'critical'
        when lower(coalesce(p_severity, 'info')) = 'warning' then 'warning'
        else 'info'
      end,
      'open',
      'staff_audit_logs',
      v_audit_id::text,
      coalesce(nullif(trim(p_entity), ''), 'unknown'),
      nullif(trim(coalesce(p_entity_id, '')), ''),
      v_actor_id,
      coalesce(v_signal_summary, initcap(replace(coalesce(p_action, 'staff action'), '.', ' '))),
      jsonb_strip_nulls(coalesce(p_meta, '{}'::jsonb)),
      v_score
    );
  end if;

  return v_audit_id;
end;
$$;

grant execute on function public.log_staff_action(text, text, text, text, text, jsonb) to authenticated;

create or replace function public.open_ops_escalation(
  p_division text,
  p_reference_type text,
  p_reference_id text,
  p_queue_key text,
  p_severity text,
  p_summary text,
  p_reason text default null,
  p_evidence jsonb default '[]'::jsonb,
  p_metadata jsonb default '{}'::jsonb,
  p_assigned_to_user_id uuid default null,
  p_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_division text := lower(trim(coalesce(p_division, 'platform')));
  v_escalation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authenticated actor required for open_ops_escalation';
  end if;

  if not public.workspace_has_division_access(v_division) then
    raise exception 'Division access denied for open_ops_escalation';
  end if;

  insert into public.ops_escalations (
    division,
    queue_key,
    reference_type,
    reference_id,
    severity,
    status,
    summary,
    reason,
    evidence,
    metadata,
    opened_by_user_id,
    assigned_to_user_id,
    due_at
  )
  values (
    v_division,
    coalesce(nullif(trim(p_queue_key), ''), 'general'),
    coalesce(nullif(trim(p_reference_type), ''), 'unknown'),
    coalesce(nullif(trim(p_reference_id), ''), gen_random_uuid()::text),
    case
      when lower(coalesce(p_severity, 'warning')) = 'critical' then 'critical'
      else 'warning'
    end,
    'open',
    coalesce(nullif(trim(p_summary), ''), 'Operational escalation'),
    nullif(trim(coalesce(p_reason, '')), ''),
    coalesce(p_evidence, '[]'::jsonb),
    coalesce(p_metadata, '{}'::jsonb),
    auth.uid(),
    p_assigned_to_user_id,
    p_due_at
  )
  on conflict do nothing
  returning id into v_escalation_id;

  if v_escalation_id is null then
    select id
    into v_escalation_id
    from public.ops_escalations
    where division = v_division
      and reference_type = coalesce(nullif(trim(p_reference_type), ''), 'unknown')
      and reference_id = coalesce(nullif(trim(p_reference_id), ''), '')
      and status in ('open', 'acknowledged', 'in_review')
    order by created_at desc
    limit 1;
  end if;

  perform public.log_staff_action(
    'ops.escalation.opened',
    'ops_escalation',
    v_escalation_id::text,
    v_division,
    case
      when lower(coalesce(p_severity, 'warning')) = 'critical' then 'critical'
      else 'warning'
    end,
    jsonb_strip_nulls(
      coalesce(p_metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'signal_key', 'ops_escalation',
        'summary', coalesce(nullif(trim(p_summary), ''), 'Operational escalation'),
        'reference_type', p_reference_type,
        'reference_id', p_reference_id,
        'queue_key', p_queue_key
      )
    )
  );

  return v_escalation_id;
end;
$$;

grant execute on function public.open_ops_escalation(text, text, text, text, text, text, text, jsonb, jsonb, uuid, timestamptz) to authenticated;

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

  insert into public.support_threads (
    user_id,
    subject,
    division,
    category,
    status,
    priority,
    reference_type,
    reference_id
  )
  values (
    v_user_id,
    trim(p_subject),
    lower(trim(coalesce(p_division, 'account'))),
    coalesce(nullif(trim(p_category), ''), 'general'),
    'open',
    coalesce(nullif(trim(p_priority), ''), 'normal'),
    nullif(trim(coalesce(p_reference_type, '')), ''),
    nullif(trim(coalesce(p_reference_id, '')), '')
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
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required for customer_reply_support_thread';
  end if;

  if nullif(trim(coalesce(p_body, '')), '') is null then
    raise exception 'Support reply body is required';
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
    priority = coalesce(nullif(trim(coalesce(p_priority, '')), ''), priority),
    customer_last_read_at = timezone('utc', now()),
    updated_at = timezone('utc', now()),
    resolved_at = null,
    closed_at = null
  where id = v_thread.id;

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
    last_escalated_at = case when v_next_priority in ('high', 'urgent') then timezone('utc', now()) else last_escalated_at end
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

    perform public.open_ops_escalation(
      coalesce(v_thread.division, 'account'),
      'support_thread',
      v_thread.id::text,
      'support-priority',
      v_signal_severity,
      coalesce(v_thread.subject, 'Support thread escalation'),
      'Support priority was raised above the standard queue.',
      jsonb_build_array(jsonb_build_object('priority', v_next_priority)),
      jsonb_build_object(
        'signal_key', 'support_priority',
        'thread_id', v_thread.id,
        'previous_priority', v_thread.priority,
        'next_priority', v_next_priority
      )
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
      'to_priority', v_next_priority,
      'signal_key', case when v_next_priority in ('high', 'urgent') then 'support_priority' else null end
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

  if v_next_status in ('resolved', 'closed') then
    update public.ops_escalations
    set
      status = 'resolved',
      resolved_at = v_now,
      resolved_by_user_id = auth.uid(),
      updated_at = v_now
    where division = coalesce(v_thread.division, 'account')
      and reference_type = 'support_thread'
      and reference_id = v_thread.id::text
      and status in ('open', 'acknowledged', 'in_review');
  end if;

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
    jsonb_build_object('division', coalesce(v_thread.division, 'account'))
  );

  if v_next_status in ('resolved', 'closed') then
    update public.ops_escalations
    set
      status = 'resolved',
      resolved_at = v_now,
      resolved_by_user_id = auth.uid(),
      updated_at = v_now
    where division = coalesce(v_thread.division, 'account')
      and reference_type = 'support_thread'
      and reference_id = v_thread.id::text
      and status in ('open', 'acknowledged', 'in_review');
  end if;

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

create or replace function public.notification_failure_rollup_rows()
returns table (
  division text,
  source_table text,
  channel text,
  failed_count bigint,
  queued_count bigint,
  latest_failure_at timestamptz,
  latest_created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if to_regclass('public.logistics_notifications') is not null then
    return query
    select
      'logistics'::text,
      'logistics_notifications'::text,
      coalesce(channel, 'unknown')::text,
      count(*) filter (where lower(coalesce(status, '')) = 'failed')::bigint,
      count(*) filter (where lower(coalesce(status, '')) = 'queued')::bigint,
      max(created_at) filter (where lower(coalesce(status, '')) = 'failed'),
      max(created_at)
    from public.logistics_notifications
    group by coalesce(channel, 'unknown');
  end if;

  if to_regclass('public.marketplace_notification_queue') is not null then
    return query
    select
      'marketplace'::text,
      'marketplace_notification_queue'::text,
      coalesce(channel, 'unknown')::text,
      count(*) filter (where lower(coalesce(status, '')) = 'failed')::bigint,
      count(*) filter (where lower(coalesce(status, '')) = 'queued')::bigint,
      max(created_at) filter (where lower(coalesce(status, '')) = 'failed'),
      max(created_at)
    from public.marketplace_notification_queue
    group by coalesce(channel, 'unknown');
  end if;

  if to_regclass('public.studio_notifications') is not null then
    return query
    select
      'studio'::text,
      'studio_notifications'::text,
      coalesce(channel, 'unknown')::text,
      count(*) filter (where lower(coalesce(status, '')) = 'failed')::bigint,
      count(*) filter (where lower(coalesce(status, '')) = 'queued')::bigint,
      max(created_at) filter (where lower(coalesce(status, '')) = 'failed'),
      max(created_at)
    from public.studio_notifications
    group by coalesce(channel, 'unknown');
  end if;

  if to_regclass('public.learn_notifications') is not null then
    return query
    select
      'learn'::text,
      'learn_notifications'::text,
      coalesce(channel, 'unknown')::text,
      count(*) filter (where lower(coalesce(status, '')) = 'failed')::bigint,
      count(*) filter (where lower(coalesce(status, '')) = 'queued')::bigint,
      max(created_at) filter (where lower(coalesce(status, '')) = 'failed'),
      max(created_at)
    from public.learn_notifications
    group by coalesce(channel, 'unknown');
  end if;

  if to_regclass('public.property_notifications') is not null then
    return query
    select
      'property'::text,
      'property_notifications'::text,
      coalesce(channel, 'unknown')::text,
      count(*) filter (where lower(coalesce(status, '')) = 'failed')::bigint,
      count(*) filter (where lower(coalesce(status, '')) = 'queued')::bigint,
      max(created_at) filter (where lower(coalesce(status, '')) = 'failed'),
      max(created_at)
    from public.property_notifications
    group by coalesce(channel, 'unknown');
  end if;
end;
$$;

grant execute on function public.notification_failure_rollup_rows() to authenticated;

create or replace view public.notification_failure_rollup as
select *
from public.notification_failure_rollup_rows()
where failed_count > 0 or queued_count > 0;

create or replace view public.owner_queue_health_rollup as
with support_rollup as (
  select
    coalesce(nullif(lower(trim(coalesce(division, ''))), ''), 'account') as division,
    'support_threads'::text as source,
    coalesce(nullif(lower(trim(coalesce(category, ''))), ''), 'general') as queue_key,
    count(*) filter (where status not in ('resolved', 'closed'))::bigint as open_count,
    count(*) filter (where priority in ('high', 'urgent') and status not in ('resolved', 'closed'))::bigint as urgent_count,
    count(*) filter (
      where status not in ('resolved', 'closed')
        and coalesce(last_activity_at, updated_at, created_at) < timezone('utc', now()) - interval '12 hours'
    )::bigint as stale_count,
    count(*) filter (where status not in ('resolved', 'closed') and assigned_to is null)::bigint as unassigned_count,
    min(created_at) filter (where status not in ('resolved', 'closed')) as oldest_item_at,
    max(coalesce(last_activity_at, updated_at, created_at)) as latest_item_at
  from public.support_threads
  group by coalesce(nullif(lower(trim(coalesce(division, ''))), ''), 'account'),
           coalesce(nullif(lower(trim(coalesce(category, ''))), ''), 'general')
),
escalation_rollup as (
  select
    coalesce(nullif(lower(trim(coalesce(division, ''))), ''), 'platform') as division,
    'ops_escalations'::text as source,
    coalesce(nullif(lower(trim(coalesce(queue_key, ''))), ''), 'general') as queue_key,
    count(*) filter (where status in ('open', 'acknowledged', 'in_review'))::bigint as open_count,
    count(*) filter (where severity = 'critical' and status in ('open', 'acknowledged', 'in_review'))::bigint as urgent_count,
    count(*) filter (
      where status in ('open', 'acknowledged', 'in_review')
        and created_at < timezone('utc', now()) - interval '6 hours'
    )::bigint as stale_count,
    count(*) filter (where status in ('open', 'acknowledged', 'in_review') and assigned_to_user_id is null)::bigint as unassigned_count,
    min(created_at) filter (where status in ('open', 'acknowledged', 'in_review')) as oldest_item_at,
    max(updated_at) as latest_item_at
  from public.ops_escalations
  group by coalesce(nullif(lower(trim(coalesce(division, ''))), ''), 'platform'),
           coalesce(nullif(lower(trim(coalesce(queue_key, ''))), ''), 'general')
),
follow_up_rollup as (
  select
    coalesce(nullif(lower(trim(coalesce(division, ''))), ''), 'platform') as division,
    'ops_follow_up_tasks'::text as source,
    'follow-up'::text as queue_key,
    count(*) filter (where status not in ('completed', 'cancelled'))::bigint as open_count,
    count(*) filter (where priority in ('high', 'urgent') and status not in ('completed', 'cancelled'))::bigint as urgent_count,
    count(*) filter (
      where status not in ('completed', 'cancelled')
        and due_at is not null
        and due_at < timezone('utc', now())
    )::bigint as stale_count,
    count(*) filter (where status not in ('completed', 'cancelled') and assigned_to_user_id is null)::bigint as unassigned_count,
    min(created_at) filter (where status not in ('completed', 'cancelled')) as oldest_item_at,
    max(updated_at) as latest_item_at
  from public.ops_follow_up_tasks
  group by coalesce(nullif(lower(trim(coalesce(division, ''))), ''), 'platform')
)
select *
from (
  select * from support_rollup
  union all
  select * from escalation_rollup
  union all
  select * from follow_up_rollup
) rollup
where open_count > 0 or urgent_count > 0 or stale_count > 0 or unassigned_count > 0;

create or replace view public.staff_governance_risk_rollup as
with signal_rollup as (
  select
    coalesce(nullif(lower(trim(coalesce(division, ''))), ''), 'platform') as division,
    signal_key,
    max(
      case severity
        when 'critical' then 3
        when 'warning' then 2
        else 1
      end
    ) as severity_rank,
    count(*) filter (where status in ('open', 'acknowledged'))::bigint as open_count,
    max(score) as peak_score,
    max(created_at) as latest_signal_at
  from public.ops_alert_signals
  group by coalesce(nullif(lower(trim(coalesce(division, ''))), ''), 'platform'), signal_key
),
audit_rollup as (
  select
    coalesce(nullif(lower(trim(coalesce(meta ->> 'division', ''))), ''), 'platform') as division,
    'staff_governance'::text as signal_key,
    case
      when count(*) >= 6 then 3
      when count(*) >= 3 then 2
      else 1
    end as severity_rank,
    count(*)::bigint as open_count,
    greatest(20, count(*)::integer * 15) as peak_score,
    max(created_at) as latest_signal_at
  from public.staff_audit_logs
  where action in ('staff.update', 'membership.create', 'membership.update', 'membership.remove')
    and created_at >= timezone('utc', now()) - interval '14 days'
  group by coalesce(nullif(lower(trim(coalesce(meta ->> 'division', ''))), ''), 'platform')
)
select
  division,
  signal_key,
  case severity_rank
    when 3 then 'critical'
    when 2 then 'warning'
    else 'info'
  end as severity,
  open_count,
  peak_score,
  latest_signal_at
from (
  select * from signal_rollup
  union all
  select * from audit_rollup
) risks
where open_count > 0;

grant select on public.care_role_memberships to authenticated;
grant select on public.jobs_role_memberships to authenticated;
grant select on public.logistics_role_memberships to authenticated;

grant select on public.support_threads to authenticated;
grant select on public.support_messages to authenticated;
grant select on public.support_thread_internal_notes to authenticated;
grant select on public.support_thread_events to authenticated;
grant select on public.customer_activity to authenticated;
grant select on public.customer_notifications to authenticated;
grant select on public.staff_audit_logs to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.staff_navigation_audit to authenticated;
grant select on public.logistics_dispatch_events to authenticated;
grant select on public.ops_escalations to authenticated;
grant select on public.ops_follow_up_tasks to authenticated;
grant select on public.ops_alert_signals to authenticated;

grant insert on public.support_threads to authenticated;
grant insert on public.support_messages to authenticated;
grant insert on public.support_thread_internal_notes to authenticated;
grant insert on public.customer_activity to authenticated;
grant insert on public.customer_notifications to authenticated;
grant insert on public.staff_audit_logs to authenticated;
grant insert on public.staff_navigation_audit to authenticated;
grant insert on public.logistics_dispatch_events to authenticated;
grant insert on public.ops_escalations to authenticated;
grant insert on public.ops_follow_up_tasks to authenticated;
grant insert on public.ops_alert_signals to authenticated;

grant update on public.customer_notifications to authenticated;
grant update on public.ops_follow_up_tasks to authenticated;

grant select on public.notification_failure_rollup to authenticated;
grant select on public.owner_queue_health_rollup to authenticated;
grant select on public.staff_governance_risk_rollup to authenticated;
