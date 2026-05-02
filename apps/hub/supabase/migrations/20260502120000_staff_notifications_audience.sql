-- V2-NOT-02-A: Staff notification audience architecture.
--
-- Closes the architectural gap from V2-NOT-01-D: customer_notifications
-- carries the customer-facing inbox; this migration adds the operator-side
-- equivalent without conflating audiences.
--
-- DESIGN:
--   * `staff_notifications`        — content + targeting (recipient_user_id |
--                                    recipient_role | recipient_division).
--                                    Inserted by service role only via the
--                                    publishStaffNotification() shim.
--   * `staff_notification_states`  — per-recipient lifecycle (is_read,
--                                    archived_at, deleted_at, restored_at).
--                                    Authored by each recipient via authenticated
--                                    session; RLS isolates per-user.
--                                    Created lazily on first action.
--
-- WHY THE SPLIT:
--   Staff broadcasts target a role or division and fan out to many recipients.
--   If lifecycle (read/archive/delete) lived on the content row, one operator
--   marking it read or deleting it would wipe the state for every targeted
--   peer. The states table preserves per-recipient inbox semantics for
--   broadcast notifications without duplicating content.
--
-- WHY A NEW TABLE INSTEAD OF EXTENDING workspace_notifications:
--   `public.workspace_notifications` was created in 20260402235500 but is
--   dead schema (zero references in app code). Its FK to the also-dead
--   workspace_staff_memberships table makes it unusable without first
--   activating that whole platform. A clean new table is faster, safer, and
--   reflects how staff identity actually lives today (in per-division
--   *_role_memberships tables + legacy profiles.role for divisions without
--   their own table).
--
-- STAFF IDENTITY SOURCES (the predicate function joins these):
--   - public.marketplace_role_memberships
--   - public.studio_role_memberships
--   - public.property_role_memberships
--   - public.learn_role_memberships
--   - public.profiles (legacy fallback for care, logistics, jobs, hub,
--                      staff, account, security, system)
--
--   logistics_role_memberships and jobs_role_memberships do not exist on
--   disk today; staff identity for those divisions lives entirely in
--   profiles.role until those divisions ship their own role table.

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. is_staff_in() — RLS predicate function
------------------------------------------------------------------------
--
-- Returns true if the authenticated caller has staff access to the supplied
-- division (and optionally a specific role within it).
--
--   role_key = NULL  -> "any role on this division" (broadcast targeting)
--   role_key set     -> the caller must hold that exact role (case-insensitive)
--
-- SECURITY DEFINER is required because the per-division *_role_memberships
-- tables enforce their own RLS that would otherwise prevent a calling
-- session from reading rows for evaluation. The function reads as the
-- function owner, returns only a boolean, and never echoes data — so no
-- role enumeration vector is exposed.
--
-- search_path is pinned to public so a hostile schema cannot shadow the
-- referenced tables (Supabase-recommended hardening).

create or replace function public.is_staff_in(
  division_key text,
  role_key text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with caller as (
    select auth.uid() as uid
  ),
  norm as (
    select
      lower(coalesce(division_key, '')) as div,
      nullif(lower(coalesce(role_key, '')), '') as r
  ),
  divisional as (
    select 'marketplace'::text as division, lower(role) as role
    from public.marketplace_role_memberships
    where is_active = true and user_id = (select uid from caller)
    union all
    select 'studio'::text, lower(role)
    from public.studio_role_memberships
    where is_active = true and user_id = (select uid from caller)
    union all
    select 'property'::text, lower(role)
    from public.property_role_memberships
    where is_active = true and user_id = (select uid from caller)
    union all
    select 'learn'::text, lower(role)
    from public.learn_role_memberships
    where is_active = true and user_id = (select uid from caller)
  ),
  legacy_profile as (
    select lower(coalesce(role, '')) as role
    from public.profiles
    where id = (select uid from caller)
  ),
  -- Map a single profiles.role value onto the division+role pairs it
  -- confers operator access to. The mapping mirrors apps/staff/lib/staff-auth.ts
  -- LEGACY_PROFILE_FALLBACK_DIVISIONS + the de-facto operator roles
  -- documented in docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md.
  legacy_resolved as (
    -- Care: explicit care.* roles + the umbrella operator roles.
    select 'care'::text as division, l.role
    from legacy_profile l
    where l.role in (
      'owner', 'admin', 'superadmin', 'staff',
      'care_owner', 'care_admin', 'care_lead', 'care_concierge', 'care_specialist'
    )
    union all
    -- Logistics has no division role table yet; legacy operator roles confer access.
    select 'logistics'::text, l.role
    from legacy_profile l
    where l.role in ('owner', 'admin', 'superadmin', 'staff', 'logistics_owner', 'logistics_admin', 'logistics_dispatch', 'logistics_support')
    union all
    -- Jobs has no division role table yet.
    select 'jobs'::text, l.role
    from legacy_profile l
    where l.role in ('owner', 'admin', 'superadmin', 'staff', 'jobs_owner', 'jobs_admin', 'jobs_recruiter')
    union all
    -- Hub / staff / account / security / system: org-wide operator surfaces.
    select 'hub'::text, l.role from legacy_profile l where l.role in ('owner', 'admin', 'superadmin', 'staff')
    union all
    select 'staff'::text, l.role from legacy_profile l where l.role in ('owner', 'admin', 'superadmin', 'staff')
    union all
    select 'account'::text, l.role from legacy_profile l where l.role in ('owner', 'admin', 'superadmin', 'staff')
    union all
    select 'security'::text, l.role from legacy_profile l where l.role in ('owner', 'admin', 'superadmin')
    union all
    select 'system'::text, l.role from legacy_profile l where l.role in ('owner', 'admin', 'superadmin')
  )
  select exists (
    select 1
    from (
      select division, role from divisional
      union all
      select division, role from legacy_resolved
    ) m, norm
    where m.division = norm.div
      and (norm.r is null or m.role = norm.r)
  );
$$;

revoke all on function public.is_staff_in(text, text) from public;
grant execute on function public.is_staff_in(text, text) to authenticated, service_role;

comment on function public.is_staff_in(text, text) is
  'Predicate: does auth.uid() hold staff access to (division_key[, role_key])? '
  'Joins per-division role tables + legacy profiles.role fallback. '
  'Used by RLS on staff_notifications and any staff-side row-targeting policy. '
  'Returns boolean only — no row enumeration vector. SECURITY DEFINER with pinned search_path.';

------------------------------------------------------------------------
-- 2. staff_notifications — content + targeting
------------------------------------------------------------------------

create table if not exists public.staff_notifications (
  id uuid primary key default gen_random_uuid(),

  -- Targeting selectors. At least one must be set; multiple may be combined
  -- (e.g., "all marketplace owners" = recipient_division='marketplace' +
  -- recipient_role='marketplace_owner').
  recipient_user_id uuid references auth.users(id) on delete cascade,
  recipient_role text,
  recipient_division text,

  -- Content
  division text not null,
  category text not null,
  priority text not null default 'info',
  title text not null,
  body text,
  action_url text,
  action_label text,
  detail_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  -- Reference back to the source entity that produced this signal
  reference_type text,
  reference_id uuid,

  -- Audit
  actor_user_id uuid references auth.users(id) on delete set null,
  publisher text,
  request_id text,

  created_at timestamptz not null default timezone('utc', now()),

  constraint staff_notifications_targeting_present check (
    recipient_user_id is not null
    or recipient_division is not null
    or recipient_role is not null
  ),
  constraint staff_notifications_priority_known check (
    priority in ('info', 'success', 'warning', 'urgent', 'security')
  )
);

------------------------------------------------------------------------
-- 3. staff_notification_states — per-recipient lifecycle
------------------------------------------------------------------------

create table if not exists public.staff_notification_states (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null references public.staff_notifications(id) on delete cascade,

  is_read boolean not null default false,
  read_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  restored_at timestamptz,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  unique (recipient_user_id, notification_id)
);

drop trigger if exists staff_notification_states_updated_at on public.staff_notification_states;
create trigger staff_notification_states_updated_at
before update on public.staff_notification_states
for each row execute function public.workspace_set_updated_at();

------------------------------------------------------------------------
-- 4. Indexes
------------------------------------------------------------------------

-- Hot-path: list active (non-deleted, non-archived) notifications targeted
-- at a specific recipient + division + role.
create index if not exists staff_notifications_recipient_user_idx
  on public.staff_notifications(recipient_user_id, created_at desc)
  where recipient_user_id is not null;

create index if not exists staff_notifications_recipient_division_idx
  on public.staff_notifications(recipient_division, created_at desc)
  where recipient_division is not null;

create index if not exists staff_notifications_recipient_role_idx
  on public.staff_notifications(recipient_role, created_at desc)
  where recipient_role is not null;

create index if not exists staff_notifications_reference_idx
  on public.staff_notifications(reference_type, reference_id)
  where reference_type is not null;

create index if not exists staff_notification_states_recipient_idx
  on public.staff_notification_states(recipient_user_id, deleted_at, archived_at, is_read);

-- Recently-deleted page query: list states with deleted_at IS NOT NULL,
-- ordered by deletion time, scoped to the calling user.
create index if not exists staff_notification_states_recipient_deleted_idx
  on public.staff_notification_states(recipient_user_id, deleted_at desc)
  where deleted_at is not null;

-- 30-day purge cron sweep: find state rows whose deleted_at is past the cutoff.
create index if not exists staff_notification_states_purge_candidate_idx
  on public.staff_notification_states(deleted_at)
  where deleted_at is not null;

-- Mirror customer-side purge index for parity.
create index if not exists customer_notifications_purge_candidate_idx
  on public.customer_notifications(deleted_at)
  where deleted_at is not null;

------------------------------------------------------------------------
-- 5. RLS
------------------------------------------------------------------------

alter table public.staff_notifications enable row level security;
alter table public.staff_notification_states enable row level security;

-- staff_notifications: SELECT only when the calling staff is targeted.
-- Direct user targeting OR division/role targeting via is_staff_in().
drop policy if exists "staff can read targeted notifications" on public.staff_notifications;
create policy "staff can read targeted notifications"
  on public.staff_notifications
  for select
  using (
    (recipient_user_id is not null and recipient_user_id = auth.uid())
    or (
      recipient_division is not null
      and public.is_staff_in(recipient_division, recipient_role)
    )
    or (
      -- Pure role broadcasts (no division pin): e.g., "all admins" — rare,
      -- but supported. The role_key carries the intended audience and the
      -- function evaluates it across every division the caller belongs to.
      recipient_division is null
      and recipient_role is not null
      and exists (
        select 1
        from (values
          ('marketplace'),('studio'),('property'),('learn'),
          ('logistics'),('jobs'),('care'),('hub'),('staff'),
          ('account'),('security'),('system')
        ) v(div)
        where public.is_staff_in(v.div, recipient_role)
      )
    )
  );

-- staff_notifications: service-role full access (publisher + cron paths).
drop policy if exists "service role manages staff notifications" on public.staff_notifications;
create policy "service role manages staff notifications"
  on public.staff_notifications
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- staff_notification_states: callers see + manage their own state rows only.
drop policy if exists "staff can read own notification state" on public.staff_notification_states;
create policy "staff can read own notification state"
  on public.staff_notification_states
  for select
  using (recipient_user_id = auth.uid());

drop policy if exists "staff can insert own notification state" on public.staff_notification_states;
create policy "staff can insert own notification state"
  on public.staff_notification_states
  for insert
  with check (
    recipient_user_id = auth.uid()
    -- Cross-check: the underlying staff_notification row must be visible
    -- to the caller per the SELECT policy on staff_notifications. RLS on
    -- the FK target enforces this at lookup time; callers cannot fabricate
    -- a state row for a notification they were not targeted by.
    and exists (
      select 1 from public.staff_notifications n
      where n.id = notification_id
    )
  );

drop policy if exists "staff can update own notification state" on public.staff_notification_states;
create policy "staff can update own notification state"
  on public.staff_notification_states
  for update
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

drop policy if exists "service role manages staff notification states" on public.staff_notification_states;
create policy "service role manages staff notification states"
  on public.staff_notification_states
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

------------------------------------------------------------------------
-- 6. Realtime publication
------------------------------------------------------------------------
--
-- Add both tables to the supabase_realtime publication so the staff
-- bell can subscribe and update without polling. RLS applies to the
-- subscription stream; cross-staff isolation holds at the channel layer
-- without extra filters (mirrors NOT-01-B B3.1's customer_notifications
-- realtime treatment).

do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'staff_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.staff_notifications';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'staff_notification_states'
  ) then
    execute 'alter publication supabase_realtime add table public.staff_notification_states';
  end if;
end
$$;

------------------------------------------------------------------------
-- 7. Documentation
------------------------------------------------------------------------

comment on table public.staff_notifications is
  'Operator-side notification inbox. Content + targeting only; per-recipient '
  'lifecycle (read/archive/delete) lives in staff_notification_states so a '
  'broadcast notification (recipient_role / recipient_division targeting) '
  'preserves per-staff inbox semantics. RLS: SELECT via is_staff_in() match; '
  'INSERT service-role only via packages/notifications publishStaffNotification(). '
  'Realtime publication: supabase_realtime.';

comment on column public.staff_notifications.recipient_user_id is
  'Direct targeting: the specific staff this notification is for. Either '
  'this OR recipient_division OR recipient_role (or any combination) must '
  'be set, enforced by staff_notifications_targeting_present check.';

comment on column public.staff_notifications.recipient_role is
  'Role-broadcast targeting (e.g. ''marketplace_owner'', ''property_admin''). '
  'Pairs with recipient_division to scope to a division+role audience, or '
  'stands alone for cross-division role broadcasts (rare). Matched against '
  'is_staff_in() with case-insensitive comparison.';

comment on column public.staff_notifications.recipient_division is
  'Division-broadcast targeting (e.g. ''marketplace'', ''property''). All '
  'staff with any role on that division see the notification.';

comment on column public.staff_notifications.division is
  'Producing division — which subsystem emitted the signal. Distinct from '
  'recipient_division (the audience). Drives accent color + source label '
  'in the UI.';

comment on column public.staff_notifications.publisher is
  'Identifier of the subsystem that inserted this row '
  '(e.g. ''shim:packages/notifications/staff'' or '
  '''dispatcher:apps/marketplace/lib/operator-alerts.ts''). Cross-correlates '
  'with notification_delivery_log.publisher for incident replay.';

comment on table public.staff_notification_states is
  'Per-recipient lifecycle for staff_notifications. Created lazily on first '
  'action (read / archive / delete). RLS: SELECT/INSERT/UPDATE own only. '
  'The 30-day purge cron hard-deletes rows where deleted_at < now() - 30 days; '
  'orphan staff_notifications (no live state row, no live targeted recipient) '
  'are cleaned up by a separate sweep.';

comment on column public.staff_notification_states.deleted_at is
  'Soft-delete timestamp. Recently-deleted page lists notifications with '
  'deleted_at IS NOT NULL. Restore clears it (and sets restored_at). The '
  '30-day purge cron hard-deletes the state row past the cutoff.';

comment on column public.staff_notification_states.restored_at is
  'Set when a previously-deleted notification is restored from the '
  'recently-deleted page. deleted_at is cleared at the same time. Preserves '
  'the audit trail of "was deleted, then restored".';

------------------------------------------------------------------------
-- 8. notification_delivery_log: purged_at audit column
------------------------------------------------------------------------
--
-- The 30-day purge cron (N6) writes a delivery_log row per hard-delete with
-- status='purged'. The dedicated purged_at column lets operators filter
-- purge events efficiently without parsing metadata jsonb.

alter table public.notification_delivery_log
  add column if not exists purged_at timestamptz;

create index if not exists notification_delivery_log_purged_idx
  on public.notification_delivery_log(purged_at desc)
  where purged_at is not null;

comment on column public.notification_delivery_log.purged_at is
  'Timestamp set when this delivery_log row records a 30-day purge cron '
  'hard-delete event. metadata.purged_id carries the original row id of '
  'the purged customer_notifications/staff_notification_states row, which '
  'no longer exists by the time this row is written.';
