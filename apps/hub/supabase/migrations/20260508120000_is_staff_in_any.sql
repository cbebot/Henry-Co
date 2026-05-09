-- V2-DASH-09 (G2): is_staff_in_any() + audit_logs column extensions for Track C.
--
-- WHY:
--   The cross-division Track C modules (staff-overview, staff-support,
--   staff-moderation, staff-finance-operator, staff-settings) need a
--   short-circuit predicate: "does this caller hold ANY staff
--   membership at all?" — separate from the per-division check.
--   Calling is_staff_in('marketplace') OR is_staff_in('studio') OR ...
--   for every division at the predicate site is verbose and risks
--   missing a division when COMPANY.divisions grows.
--
--   Track C also writes to audit_logs on every state-changing action
--   (V19 verification gate). The existing audit_logs table is solid
--   but needs two additions:
--     * `division` — division attribution for cross-division queries
--                    (Track C operators may act on cross-division
--                     resources; the division the action targets is
--                     not always the same as the calling viewer's
--                     primary division).
--     * `correlation_id` — bulk-operation grouping. When an operator
--                          executes a bulk action on N rows, every
--                          per-row audit_logs row shares the same
--                          correlation_id so the bulk can be replayed
--                          or audited as one unit.
--
-- SHIPS WITH TRACK C (DASH-9). The is_staff_in_any() predicate is
-- not used by RLS today; it is read by Track C TS callers and by the
-- public.add_audit_log() helper to decide which audit_logs rows
-- the calling staff may insert.
--
-- IDEMPOTENT: safe to re-apply (create or replace + add column if not
-- exists + drop policy if exists/create policy).

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. is_staff_in_any() — short-circuit predicate
------------------------------------------------------------------------
--
-- Returns true if the authenticated caller holds staff access in ANY
-- division — equivalent to the disjunction of is_staff_in() across
-- every division this organisation recognises.
--
-- Implementation reuses the divisional + legacy_resolved CTE shape from
-- is_staff_in() so the two functions cannot drift on division identity.
-- A single SELECT EXISTS short-circuits at the first matching row.
--
-- SECURITY DEFINER + SET search_path = public + REVOKE ALL FROM PUBLIC
-- + GRANT EXECUTE TO authenticated, service_role: per V3 requirement.

create or replace function public.is_staff_in_any()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with caller as (
    select auth.uid() as uid
  ),
  divisional as (
    select 1
    from public.marketplace_role_memberships
    where is_active = true and user_id = (select uid from caller)
    union all
    select 1
    from public.studio_role_memberships
    where is_active = true and user_id = (select uid from caller)
    union all
    select 1
    from public.property_role_memberships
    where is_active = true and user_id = (select uid from caller)
    union all
    select 1
    from public.learn_role_memberships
    where is_active = true and user_id = (select uid from caller)
  ),
  legacy_profile as (
    -- Legacy fallback: care, logistics, jobs, hub, staff, account,
    -- security, system. Mirror the SQL is_staff_in() function's
    -- legacy_resolved CTE — any of these profile.role values confer
    -- some division-bound operator access.
    select 1
    from public.profiles p
    where p.id = (select uid from caller)
      and lower(coalesce(p.role, '')) in (
        'owner', 'admin', 'superadmin', 'staff',
        'manager', 'support', 'rider', 'finance',
        'care_owner', 'care_admin', 'care_lead', 'care_concierge', 'care_specialist',
        'logistics_owner', 'logistics_admin', 'logistics_dispatch', 'logistics_support',
        'jobs_owner', 'jobs_admin', 'jobs_recruiter'
      )
  )
  select exists (
    select 1 from divisional
    union all
    select 1 from legacy_profile
  );
$$;

revoke all on function public.is_staff_in_any() from public;
grant execute on function public.is_staff_in_any() to authenticated, service_role;

comment on function public.is_staff_in_any() is
  'Predicate: does auth.uid() hold staff access in ANY division? '
  'Short-circuit companion to public.is_staff_in(). Returns true on the first '
  'matching division/role membership; false if the caller has zero staff '
  'access across all 12 staff divisions. SECURITY DEFINER with pinned '
  'search_path. Used by cross-division Track C surfaces (staff-overview, '
  'staff-support, staff-moderation, staff-finance-operator, staff-settings) '
  'and by public.add_audit_log() defence-in-depth. Returns boolean only — '
  'no row enumeration vector.';

------------------------------------------------------------------------
-- 2. audit_logs.division + audit_logs.correlation_id
------------------------------------------------------------------------
--
-- Add two columns to the existing public.audit_logs table:
--   * `division` text       — division attribution for the action.
--                              Nullable: not every action is division-bound.
--                              Indexed for the per-division audit-log query
--                              ("show me every Marketplace moderation action
--                              over the last 24 hours").
--   * `correlation_id` uuid — bulk-operation grouping. Null for single-action
--                              writes; set to a generated uuid for every row
--                              of a bulk operation.

alter table public.audit_logs
  add column if not exists division text;

alter table public.audit_logs
  add column if not exists correlation_id uuid;

create index if not exists audit_logs_division_idx
  on public.audit_logs (division, created_at desc)
  where division is not null;

create index if not exists audit_logs_correlation_idx
  on public.audit_logs (correlation_id, created_at)
  where correlation_id is not null;

comment on column public.audit_logs.division is
  'Division the audited action targets (marketplace, studio, property, learn, '
  'logistics, jobs, care, hub, staff, account, security, system). Distinct '
  'from actor_role — the actor may be a cross-division moderator acting on '
  'a Marketplace listing; division here = "marketplace" while actor_role '
  'reflects the actor''s primary role. Nullable for actions that are '
  'genuinely cross-division (e.g. global setting toggle).';

comment on column public.audit_logs.correlation_id is
  'Bulk-operation grouping. NULL for single-action writes; set to a generated '
  'uuid for every per-row audit_log row of a bulk operation so a bulk-assign '
  'or bulk-close can be reconstructed or audited as a single event. Cron '
  'cleanup considers correlation_id when applying retention windows so a '
  'bulk audit trail is preserved or expired together.';

------------------------------------------------------------------------
-- 3. add_audit_log() — server-side helper used by Track C
------------------------------------------------------------------------
--
-- Wraps INSERT INTO public.audit_logs with division + correlation_id
-- support. The existing add_audit_log() function in the schema is
-- preserved (it predates this migration). This is a Track-C-specific
-- variant that takes the additional columns. Names different to avoid
-- collision; existing callers continue to use the existing function.

create or replace function public.add_audit_log_v2(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_reason text default null,
  p_division text default null,
  p_correlation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_entity_id uuid;
  v_audit_id uuid;
begin
  -- Defence-in-depth: caller must be a staff member in some division
  -- to write audit logs. Customers cannot fabricate audit log rows.
  if not public.is_staff_in_any() then
    raise exception 'add_audit_log_v2: caller is not staff' using errcode = '42501';
  end if;

  -- Best-effort actor_role lookup from profiles. Audit log rows still
  -- write if the profile lookup fails (the action being audited is
  -- more important than the role attribution).
  begin
    select lower(coalesce(role, '')) into v_actor_role
    from public.profiles
    where id = v_actor_id
    limit 1;
  exception when others then
    v_actor_role := null;
  end;

  -- Defensive cast: audit_logs.entity_id is uuid on prod. Callers pass
  -- the entity id as text (TS-side type is string). Empty/invalid
  -- inputs degrade to NULL so the audit row still writes.
  begin
    v_entity_id := nullif(p_entity_id, '')::uuid;
  exception when others then
    v_entity_id := null;
  end;

  insert into public.audit_logs (
    action,
    actor_id,
    actor_role,
    entity_type,
    entity_id,
    old_values,
    new_values,
    reason,
    division,
    correlation_id,
    created_at
  ) values (
    p_action,
    v_actor_id,
    v_actor_role,
    p_entity_type,
    v_entity_id,
    p_old_values,
    p_new_values,
    p_reason,
    p_division,
    p_correlation_id,
    timezone('utc', now())
  )
  returning id into v_audit_id;

  return v_audit_id;
end;
$$;

revoke all on function public.add_audit_log_v2(text, text, text, jsonb, jsonb, text, text, uuid) from public;
grant execute on function public.add_audit_log_v2(text, text, text, jsonb, jsonb, text, text, uuid) to authenticated, service_role;

comment on function public.add_audit_log_v2(text, text, text, jsonb, jsonb, text, text, uuid) is
  'Track C audit log writer. Inserts a row into public.audit_logs with '
  'division + correlation_id support. Defence-in-depth: caller must hold '
  'staff access in some division (public.is_staff_in_any()) to insert. '
  'SECURITY DEFINER with pinned search_path so audit log writes succeed '
  'even when the caller''s session-level RLS would otherwise block direct '
  'insert. Returns the new audit log row id; callers may store it on the '
  'business entity row for forward-link traceability.';

------------------------------------------------------------------------
-- 4. RLS — audit_logs read access for staff
------------------------------------------------------------------------
--
-- Allow staff to SELECT audit_logs rows scoped to their accessible
-- divisions. Service role retains full access (publisher + cron paths).
-- Customers and unauthenticated users see nothing.
--
-- The shipping policy is the LEAST-PRIVILEGE intersection: a staff
-- member may read an audit_log row if EITHER:
--   * the row's division matches a division they have staff access in
--     (public.is_staff_in(division)) — covers per-division audit views.
--   * the row's actor_id is themself — covers personal audit views.
--
-- Cross-division audit views (e.g. an org-wide audit search) require
-- service-role access via a SECURITY DEFINER aggregator function; this
-- migration does NOT ship one, deferring to a future cross-division
-- audit aggregator pass.

alter table public.audit_logs enable row level security;

drop policy if exists "staff can read audit logs in their divisions" on public.audit_logs;
create policy "staff can read audit logs in their divisions"
  on public.audit_logs
  for select
  using (
    auth.uid() = actor_id
    or (
      division is not null
      and public.is_staff_in(division)
    )
  );

drop policy if exists "service role manages audit logs" on public.audit_logs;
create policy "service role manages audit logs"
  on public.audit_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Staff INSERT rights: routed through public.add_audit_log_v2() above.
-- Direct INSERT to audit_logs is service-role-only; staff use the
-- SECURITY DEFINER function. This keeps the actor_id / actor_role
-- attribution honest (the function reads auth.uid()).

------------------------------------------------------------------------
-- 5. Self-test (commented out — run from psql shell to verify)
------------------------------------------------------------------------
--
-- SELECT public.is_staff_in_any() AS any_access;  -- expect: bool
-- SELECT public.add_audit_log_v2(
--   'staff.test.self_check',
--   'audit_log_self_test',
--   'self-test',
--   null,
--   '{"hello":"world"}'::jsonb,
--   'self-test reason',
--   'staff',
--   null
-- ) AS audit_id;
-- SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 1;

-- end of migration --
