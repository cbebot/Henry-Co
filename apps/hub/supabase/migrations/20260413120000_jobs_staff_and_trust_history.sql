begin;

create or replace function public.account_normalized_email_from_jwt()
returns text
language sql
stable
as $$
  select nullif(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '');
$$;

create table if not exists public.jobs_role_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  scope_type text not null default 'platform',
  scope_id text,
  role text not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_reason text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_role_memberships_role_chk'
  ) then
    alter table public.jobs_role_memberships
      add constraint jobs_role_memberships_role_chk
      check (
        role in (
          'recruiter',
          'employer_success',
          'jobs_support',
          'jobs_moderator',
          'internal_recruitment_coordinator',
          'talent_success'
        )
      );
  end if;
end $$;

create index if not exists jobs_role_memberships_user_idx
  on public.jobs_role_memberships(user_id, is_active);
create index if not exists jobs_role_memberships_email_idx
  on public.jobs_role_memberships(normalized_email, is_active);
create index if not exists jobs_role_memberships_role_idx
  on public.jobs_role_memberships(role, is_active);
create unique index if not exists jobs_role_memberships_scope_role_uidx
  on public.jobs_role_memberships(
    coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(normalized_email, ''),
    scope_type,
    coalesce(scope_id, ''),
    role
  );

insert into public.jobs_role_memberships (
  user_id,
  normalized_email,
  scope_type,
  scope_id,
  role,
  granted_reason,
  is_active,
  metadata,
  created_at,
  updated_at
)
select
  membership.user_id,
  membership.normalized_email,
  coalesce(membership.scope_type, 'platform'),
  membership.scope_id,
  membership.role,
  'Backfilled from workspace division membership',
  membership.is_active,
  jsonb_build_object(
    'backfilled_from', 'workspace_division_memberships',
    'workspace_division_membership_id', membership.id
  ),
  membership.created_at,
  membership.updated_at
from public.workspace_division_memberships membership
where membership.division = 'jobs'
  and membership.is_active = true
  and membership.role in (
    'recruiter',
    'employer_success',
    'jobs_support',
    'jobs_moderator',
    'internal_recruitment_coordinator',
    'talent_success'
  )
  and not exists (
    select 1
    from public.jobs_role_memberships existing
    where coalesce(existing.user_id, '00000000-0000-0000-0000-000000000000'::uuid) =
      coalesce(membership.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and coalesce(existing.normalized_email, '') = coalesce(membership.normalized_email, '')
      and existing.scope_type = coalesce(membership.scope_type, 'platform')
      and coalesce(existing.scope_id, '') = coalesce(membership.scope_id, '')
      and existing.role = membership.role
  );

alter table public.jobs_role_memberships enable row level security;

drop trigger if exists jobs_role_memberships_updated_at on public.jobs_role_memberships;
create trigger jobs_role_memberships_updated_at
before update on public.jobs_role_memberships
for each row execute function public.account_set_updated_at();

drop policy if exists jobs_role_memberships_self_select on public.jobs_role_memberships;
create policy jobs_role_memberships_self_select
  on public.jobs_role_memberships
  for select
  to authenticated
  using (
    (user_id is not null and user_id = auth.uid())
    or (
      normalized_email is not null
      and normalized_email <> ''
      and normalized_email = public.account_normalized_email_from_jwt()
    )
  );

create or replace function public.jobs_has_staff_role(p_allowed_roles text[] default null)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  normalized_email text := public.account_normalized_email_from_jwt();
begin
  if uid is null and normalized_email is null then
    return false;
  end if;

  if uid is not null and exists (
    select 1
    from public.owner_profiles owner_profile
    where owner_profile.user_id = uid
      and owner_profile.is_active = true
      and lower(trim(coalesce(owner_profile.role, 'owner'))) in ('owner', 'admin')
  ) then
    return true;
  end if;

  return exists (
    select 1
    from public.jobs_role_memberships membership
    where membership.is_active = true
      and (
        (uid is not null and membership.user_id = uid)
        or (
          normalized_email is not null
          and normalized_email <> ''
          and membership.normalized_email = normalized_email
        )
      )
      and (
        p_allowed_roles is null
        or cardinality(p_allowed_roles) = 0
        or membership.role = any (p_allowed_roles)
      )
  );
end;
$$;

create table if not exists public.jobs_trust_snapshots (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  trust_tier text not null,
  trust_score integer not null check (trust_score >= 0 and trust_score <= 100),
  trust_state jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  update_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (entity_type, entity_id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_trust_snapshots_entity_type_chk'
  ) then
    alter table public.jobs_trust_snapshots
      add constraint jobs_trust_snapshots_entity_type_chk
      check (entity_type in ('candidate_profile', 'employer'));
  end if;
end $$;

create table if not exists public.jobs_trust_score_transitions (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.jobs_trust_snapshots(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  old_trust_tier text,
  new_trust_tier text not null,
  old_trust_score integer,
  new_trust_score integer not null check (new_trust_score >= 0 and new_trust_score <= 100),
  old_trust_state jsonb not null default '{}'::jsonb,
  new_trust_state jsonb not null default '{}'::jsonb,
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  change_source text not null default 'system_sync',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jobs_trust_override_history (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid references public.jobs_trust_snapshots(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  override_key text not null,
  old_value jsonb,
  new_value jsonb not null default '{}'::jsonb,
  reason text not null,
  changed_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_trust_snapshots_entity_idx
  on public.jobs_trust_snapshots(entity_type, entity_id);
create index if not exists jobs_trust_snapshots_user_idx
  on public.jobs_trust_snapshots(user_id, updated_at desc);
create index if not exists jobs_trust_transitions_entity_idx
  on public.jobs_trust_score_transitions(entity_type, entity_id, created_at desc);
create index if not exists jobs_trust_transitions_snapshot_idx
  on public.jobs_trust_score_transitions(snapshot_id, created_at desc);
create index if not exists jobs_trust_transitions_user_idx
  on public.jobs_trust_score_transitions(user_id, created_at desc);
create index if not exists jobs_trust_override_entity_idx
  on public.jobs_trust_override_history(entity_type, entity_id, created_at desc);
create index if not exists jobs_trust_override_snapshot_idx
  on public.jobs_trust_override_history(snapshot_id, created_at desc);
create index if not exists jobs_trust_override_user_idx
  on public.jobs_trust_override_history(user_id, created_at desc);

alter table public.jobs_trust_snapshots enable row level security;
alter table public.jobs_trust_score_transitions enable row level security;
alter table public.jobs_trust_override_history enable row level security;

drop trigger if exists jobs_trust_snapshots_updated_at on public.jobs_trust_snapshots;
create trigger jobs_trust_snapshots_updated_at
before update on public.jobs_trust_snapshots
for each row execute function public.account_set_updated_at();

create or replace function public.jobs_record_trust_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and new.trust_score is not distinct from old.trust_score
    and new.trust_tier is not distinct from old.trust_tier
    and new.trust_state is not distinct from old.trust_state then
    return new;
  end if;

  insert into public.jobs_trust_score_transitions (
    snapshot_id,
    entity_type,
    entity_id,
    user_id,
    old_trust_tier,
    new_trust_tier,
    old_trust_score,
    new_trust_score,
    old_trust_state,
    new_trust_state,
    changed_by,
    reason,
    change_source,
    metadata
  ) values (
    new.id,
    new.entity_type,
    new.entity_id,
    new.user_id,
    case when tg_op = 'UPDATE' then old.trust_tier else null end,
    new.trust_tier,
    case when tg_op = 'UPDATE' then old.trust_score else null end,
    new.trust_score,
    case when tg_op = 'UPDATE' then coalesce(old.trust_state, '{}'::jsonb) else '{}'::jsonb end,
    coalesce(new.trust_state, '{}'::jsonb),
    new.updated_by,
    new.update_reason,
    coalesce(new.metadata->>'changeSource', 'system_sync'),
    coalesce(new.metadata, '{}'::jsonb)
  );

  return new;
end;
$$;

drop trigger if exists jobs_trust_snapshots_transition_history on public.jobs_trust_snapshots;
create trigger jobs_trust_snapshots_transition_history
after insert or update on public.jobs_trust_snapshots
for each row execute function public.jobs_record_trust_transition();

drop policy if exists jobs_trust_snapshots_select on public.jobs_trust_snapshots;
create policy jobs_trust_snapshots_select
  on public.jobs_trust_snapshots
  for select
  to authenticated
  using (
    (user_id is not null and user_id = auth.uid())
    or public.jobs_has_staff_role(array[
      'recruiter',
      'jobs_moderator',
      'employer_success',
      'internal_recruitment_coordinator'
    ])
  );

drop policy if exists jobs_trust_score_transitions_select on public.jobs_trust_score_transitions;
create policy jobs_trust_score_transitions_select
  on public.jobs_trust_score_transitions
  for select
  to authenticated
  using (
    (user_id is not null and user_id = auth.uid())
    or public.jobs_has_staff_role(array[
      'recruiter',
      'jobs_moderator',
      'employer_success',
      'internal_recruitment_coordinator'
    ])
  );

drop policy if exists jobs_trust_override_history_select on public.jobs_trust_override_history;
create policy jobs_trust_override_history_select
  on public.jobs_trust_override_history
  for select
  to authenticated
  using (
    (user_id is not null and user_id = auth.uid())
    or public.jobs_has_staff_role(array[
      'recruiter',
      'jobs_moderator',
      'employer_success',
      'internal_recruitment_coordinator'
    ])
  );

commit;
