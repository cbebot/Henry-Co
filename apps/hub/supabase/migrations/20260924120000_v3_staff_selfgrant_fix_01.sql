-- V3-STAFF-SELFGRANT-FIX-01 — close the self-granted staff-role hole (I-risk: identity).
--
-- HELD FOR THE OWNER'S GO. Apply per docs/v3/ACTIVATION-RUNBOOK-2026-09-24.md (day-of
-- step "STAFF-SELFGRANT"): run the G10 review query FIRST, then this file, then the
-- owner-reviewed remediation script. ZERO contact with payments_private, the money RPCs,
-- or any money table. Idempotent, existence-guarded (runs identically on prod, the
-- prod-actual shadow and the CI fixture chain). Never `supabase db push`.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE HOLE (reproduced on the prod-actual shadow, 2026-09-24)
--   * profiles_insert_own: INSERT to authenticated WITH CHECK (id = auth.uid()) — nothing
--     constrains `role`. trg_profiles_protect_sensitive_fields guards UPDATE only.
--   * is_staff_in() (SECURITY DEFINER) maps a bare profiles.role of owner/admin/
--     superadmin/staff onto care, logistics, jobs, hub, staff, account (+ security/system
--     for owner/admin); is_staff_in_any(), current_role(), current_app_role() and
--     is_property_staff() trust the same column.
--   => any authenticated user WITHOUT a profiles row (legacy / pre-trigger /
--      service-role-deleted) could POST /rest/v1/profiles {id: me, role: 'staff'|'owner'}
--      and become staff in six divisions (owner => is_platform_staff()).
--   * Same class, owner console: owner_profiles_update_own lets any holder of an
--     owner_profiles row (viewer/editor) rewrite its own role to 'owner' => is_owner()
--     => admin_set_profile_role() => a "legitimate" staff grant. Closed here too, because
--     it is a back door into the trust anchor below.
--
-- THE PRINCIPLE (PR #349): privilege comes from a server-controlled, user_id-bound grant
-- record — never from a self-settable column.
--
-- TRUST ANCHOR: a write is "trusted" iff the executing SQL role could bypass RLS anyway
-- (rolsuper OR rolbypassrls): service_role (admin clients), postgres (SQL editor,
-- migrations, and SECURITY DEFINER RPCs such as the owner-gated admin_set_profile_role
-- and the signup trigger handle_new_user). PostgREST request roles (anon, authenticated)
-- are never trusted. This is read from current_user inside SECURITY INVOKER triggers —
-- a client cannot forge it the way it can forge user_metadata or a row value.
--
-- DEFENSE IN DEPTH — either layer alone stops the exploit:
--   LAYER W (write path) — four independent mechanisms on public.profiles:
--     W1 privileges: request roles hold no INSERT, and UPDATE only on
--        (full_name, phone, avatar_url);
--     W2 RLS: the self-insert policy is dropped (default-deny); anon insert stays gone;
--     W3 BEFORE INSERT/UPDATE trigger: an untrusted writer may only ever create its own
--        row as 'customer' and may never change role/id/freeze/re-auth/money columns;
--     W4 DEFERRED constraint trigger: a non-customer profiles.role must be backed by an
--        active, matching staff_role_grants row at COMMIT, whoever wrote it.
--   LAYER R (read path) — is_staff_in(), is_staff_in_any(), current_role(),
--     current_app_role(), is_property_staff() honour a profiles.role only when an active
--     staff_role_grants row for the same user_id carries the same role.
--   GRANT RECORD — public.staff_role_grants: RLS on, no policies, no request-role
--     privileges; written ONLY by the AFTER trigger below and ONLY when a trusted role
--     itself sets/changes profiles.role (a trusted write that leaves role untouched — e.g.
--     learn's admin upsert of full_name/phone — never mints a grant, so a forged role can
--     never be laundered into one).
--
-- EXISTING ROWS: every current non-customer profiles row is backfilled as a grant
-- (source 'backfill:v3_staff_selfgrant_fix_01') so genuine staff keep access. Rows the
-- owner judges illegitimate from the G10 review are demoted by the HELD remediation
-- script (docs/v3/staff-selfgrant-fix-01/remediate-self-granted-staff.sql).
-- ─────────────────────────────────────────────────────────────────────────────

do $guard$
begin
  if to_regclass('public.profiles') is null then
    raise notice 'V3-STAFF-SELFGRANT-FIX-01: public.profiles absent — nothing to do';
  end if;
end $guard$;

-- ── (1) The grant record ─────────────────────────────────────────────────────
create table if not exists public.staff_role_grants (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  role            text not null
                  check (role = lower(role) and role <> 'customer' and length(role) between 1 and 64),
  source          text not null,
  granted_by_role text not null default current_user,
  granted_at      timestamptz not null default timezone('utc', now()),
  revoked_at      timestamptz,
  revoked_reason  text
);

comment on table public.staff_role_grants is
  'V3-STAFF-SELFGRANT-FIX-01: server-controlled, user_id-bound evidence for a non-customer '
  'profiles.role. Written only by trg_profiles_mint_staff_grant when an RLS-bypassing '
  'role (service_role / postgres / SECURITY DEFINER RPC) sets profiles.role. Request roles '
  'have no privileges and no policies. is_staff_in() & co. require an active matching row.';

alter table public.staff_role_grants enable row level security;
revoke all on table public.staff_role_grants from public, anon, authenticated;
grant select, insert, update, delete on table public.staff_role_grants to service_role;

-- ── (2) Backfill genuine staff BEFORE any guard can reject their rows ────────
do $backfill$
begin
  if to_regclass('public.profiles') is null then return; end if;
  insert into public.staff_role_grants (user_id, role, source, granted_by_role)
  select p.id, lower(p.role), 'backfill:v3_staff_selfgrant_fix_01', current_user
  from public.profiles p
  where lower(coalesce(p.role, '')) not in ('', 'customer')
    and exists (select 1 from auth.users u where u.id = p.id)
  on conflict (user_id) do nothing;
end $backfill$;

-- ── (3) W3 — BEFORE INSERT/UPDATE guard on profiles (SECURITY INVOKER) ───────
create or replace function public.profiles_block_self_grant()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
declare
  v_trusted boolean;
begin
  -- SECURITY INVOKER on purpose: current_user is the role actually executing the write.
  select coalesce(r.rolsuper or r.rolbypassrls, false) into v_trusted
  from pg_catalog.pg_roles r where r.rolname = current_user;
  if coalesce(v_trusted, false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is null or new.id is distinct from auth.uid() then
      raise exception 'profiles: a request role may only create its own profile'
        using errcode = '42501';
    end if;
    if lower(coalesce(new.role, '')) <> 'customer' then
      raise exception 'profiles: a request role may only create a customer profile'
        using errcode = '42501';
    end if;
    -- A self-created row always starts from server defaults for every sensitive column.
    new.role := 'customer';
    new.wallet_balance_ngn := 0;
    new.is_active := true;
    new.is_frozen := false;
    new.frozen_at := null;
    new.frozen_reason := null;
    new.forced_signout_at := null;
    new.force_signout_at := null;
    new.force_reauth_after := null;
    new.disabled_reason := null;
    new.archived_at := null;
    new.archive_reason := null;
    new.deleted_at := null;
    new.deleted_reason := null;
    new.retention_hold_until := null;
    new.legal_hold_reason := null;
    return new;
  end if;

  -- UPDATE by a request role (own row via RLS; owners reach others via profiles_update_owner).
  if new.id is distinct from old.id then
    raise exception 'profiles: id is immutable for request roles' using errcode = '42501';
  end if;
  if new.role is distinct from old.role then
    raise exception 'profiles: role changes go through admin_set_profile_role() or the service role'
      using errcode = '42501';
  end if;
  if new.wallet_balance_ngn is distinct from old.wallet_balance_ngn then
    raise exception 'profiles: wallet_balance_ngn is server-controlled' using errcode = '42501';
  end if;
  return new;
end
$fn$;

-- ── (4) Grant mirror — AFTER INSERT/UPDATE OF role/id/DELETE (SECURITY INVOKER) ─
create or replace function public.profiles_sync_staff_role_grant()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
declare
  v_trusted boolean;
  v_new_role text;
begin
  select coalesce(r.rolsuper or r.rolbypassrls, false) into v_trusted
  from pg_catalog.pg_roles r where r.rolname = current_user;
  if not coalesce(v_trusted, false) then
    -- Untrusted writers never mint or revoke evidence. (Request roles also hold no
    -- privilege on staff_role_grants, so this is belt-and-braces.)
    return null;
  end if;

  if tg_op = 'DELETE' then
    update public.staff_role_grants
       set revoked_at = timezone('utc', now()), revoked_reason = 'profile_deleted'
     where user_id = old.id and revoked_at is null;
    return null;
  end if;

  -- Only a trusted write that itself SETS the role creates/updates evidence.
  if tg_op = 'UPDATE' and new.role is not distinct from old.role and new.id = old.id then
    return null;
  end if;

  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    update public.staff_role_grants
       set revoked_at = timezone('utc', now()), revoked_reason = 'profile_id_changed'
     where user_id = old.id and revoked_at is null;
  end if;

  v_new_role := lower(coalesce(new.role, ''));
  if v_new_role in ('', 'customer') then
    update public.staff_role_grants
       set revoked_at = timezone('utc', now()), revoked_reason = 'role_set_to_customer'
     where user_id = new.id and revoked_at is null;
  else
    insert into public.staff_role_grants (user_id, role, source, granted_by_role)
    values (new.id, v_new_role, 'profiles_write', current_user)
    on conflict (user_id) do update
      set role = excluded.role,
          source = excluded.source,
          granted_by_role = excluded.granted_by_role,
          granted_at = timezone('utc', now()),
          revoked_at = null,
          revoked_reason = null;
  end if;
  return null;
end
$fn$;

-- ── (5) W4 — DEFERRED invariant: non-customer role ⇒ active matching grant ────
-- SECURITY DEFINER only so it can READ staff_role_grants; it never writes.
create or replace function public.profiles_require_staff_grant()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_role text;
begin
  if tg_op = 'UPDATE' and new.role is not distinct from old.role and new.id = old.id then
    return null;
  end if;
  -- Re-read the committed-to-be state of the row (it may have changed since the event).
  select lower(coalesce(p.role, '')) into v_role from public.profiles p where p.id = new.id;
  if v_role is null or v_role in ('', 'customer') then
    return null;
  end if;
  if not exists (
    select 1 from public.staff_role_grants g
    where g.user_id = new.id and g.revoked_at is null and g.role = v_role
  ) then
    raise exception 'profiles: role % for % has no server-issued staff grant', v_role, new.id
      using errcode = '42501';
  end if;
  return null;
end
$fn$;

revoke all on function public.profiles_block_self_grant() from public, anon, authenticated;
revoke all on function public.profiles_sync_staff_role_grant() from public, anon, authenticated;
revoke all on function public.profiles_require_staff_grant() from public, anon, authenticated;

do $wire$
begin
  if to_regclass('public.profiles') is null then return; end if;

  -- W3
  drop trigger if exists trg_profiles_block_self_grant on public.profiles;
  create trigger trg_profiles_block_self_grant
    before insert or update on public.profiles
    for each row execute function public.profiles_block_self_grant();

  -- grant mirror. NAME ORDER MATTERS: same-event AFTER triggers fire alphabetically, so
  -- "…_mint_…" must sort before "…_require_…" — under SET CONSTRAINTS ALL IMMEDIATE the
  -- W4 check would otherwise run before the grant exists and reject a genuine promotion.
  drop trigger if exists trg_profiles_mint_staff_grant on public.profiles;
  create trigger trg_profiles_mint_staff_grant
    after insert or update of role, id or delete on public.profiles
    for each row execute function public.profiles_sync_staff_role_grant();

  -- W4 (deferred to COMMIT so a trusted INSERT + its mirrored grant land together)
  drop trigger if exists trg_profiles_require_staff_grant on public.profiles;
  create constraint trigger trg_profiles_require_staff_grant
    after insert or update of role, id on public.profiles
    deferrable initially deferred
    for each row execute function public.profiles_require_staff_grant();

  -- W2 — RLS: no request-role INSERT path at all (default-deny). The self-insert policy
  -- is unused (every legitimate insert is the signup trigger or the service role).
  drop policy if exists "anon can insert profiles" on public.profiles;
  drop policy if exists profiles_insert_own on public.profiles;

  -- W1 — privileges: request roles may not INSERT, and may UPDATE only cosmetic columns.
  revoke insert, delete, truncate on table public.profiles from anon, authenticated;
  revoke update on table public.profiles from anon, authenticated;
  execute (
    select 'grant update (' || string_agg(quote_ident(c.column_name), ', ') || ') on table public.profiles to authenticated'
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'profiles'
      and c.column_name in ('full_name', 'phone', 'avatar_url')
  );
end $wire$;

-- ── (6a) is_owner() — same predicate, SECURITY DEFINER ───────────────────────
-- PRE-EXISTING BUG (reproduced on the prod-actual shadow): is_owner() is SECURITY
-- INVOKER and reads owner_profiles, whose policy owner_profiles_select_self_or_owner
-- calls is_owner() again => "stack depth limit exceeded" for any authenticated caller
-- once owner_profiles holds another user's row. Every request-role path through it —
-- a self-read of profiles, current_role(), is_property_staff(), the owner console, the
-- owner_profiles guard below — errors instead of answering. SECURITY DEFINER (search_path
-- pinned) evaluates the identical predicate without re-entering RLS. Result unchanged:
-- true iff the CALLER holds an active owner/admin owner_profiles row.
create or replace function public.is_owner()
returns boolean
language sql
stable security definer
set search_path to 'public', 'pg_catalog'
as $function$
  select exists (
    select 1
    from public.owner_profiles op
    where op.user_id = auth.uid()
      and op.is_active = true
      and op.role in ('owner', 'admin')
  );
$function$;

-- ── (6) owner_profiles — a holder may not promote / re-activate / re-bind itself ─
create or replace function public.owner_profiles_block_self_promotion()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
declare
  v_trusted boolean;
begin
  select coalesce(r.rolsuper or r.rolbypassrls, false) into v_trusted
  from pg_catalog.pg_roles r where r.rolname = current_user;
  if coalesce(v_trusted, false) then
    return new;
  end if;
  -- is_owner() evaluates the caller's CURRENT (pre-statement) owner_profiles state.
  if public.is_owner() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.user_id is distinct from old.user_id then
    raise exception 'owner_profiles: role/is_active/user_id are owner-controlled'
      using errcode = '42501';
  end if;
  return new;
end
$fn$;
revoke all on function public.owner_profiles_block_self_promotion() from public, anon, authenticated;

do $owner$
begin
  if to_regclass('public.owner_profiles') is null then return; end if;
  drop trigger if exists trg_owner_profiles_block_self_promotion on public.owner_profiles;
  create trigger trg_owner_profiles_block_self_promotion
    before update on public.owner_profiles
    for each row execute function public.owner_profiles_block_self_promotion();
  -- Privilege layer too (identical to 20260710180000_hub_security_hardening HUB-2, which
  -- may or may not be applied yet): role / is_active are never request-role writable.
  revoke update (role, is_active) on public.owner_profiles from anon, authenticated;
end $owner$;

-- ── (7) LAYER R — every profiles.role consumer requires the grant ────────────
-- The caller's grant-verified legacy role (NULL when none). SECURITY DEFINER so request
-- roles can use it without any privilege on staff_role_grants; it only ever reveals the
-- caller's own role.
create or replace function public.verified_profile_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  select lower(p.role)
  from public.profiles p
  join public.staff_role_grants g
    on g.user_id = p.id and g.revoked_at is null and g.role = lower(p.role)
  where p.id = auth.uid()
$fn$;
revoke all on function public.verified_profile_role() from public;
grant execute on function public.verified_profile_role() to anon, authenticated, service_role;

-- is_staff_in: body identical to prod except legacy_profile, which now joins the grant.
create or replace function public.is_staff_in(division_key text, role_key text default null::text)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
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
  -- V3-STAFF-SELFGRANT-FIX-01: a legacy profiles.role counts ONLY when a server-issued,
  -- user_id-bound staff_role_grants row carries the same role. A self-set column alone
  -- confers nothing.
  legacy_profile as (
    select lower(p.role) as role
    from public.profiles p
    join public.staff_role_grants g
      on g.user_id = p.id and g.revoked_at is null and g.role = lower(p.role)
    where p.id = (select uid from caller)
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
$function$;

create or replace function public.is_staff_in_any()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
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
    -- some division-bound operator access. V3-STAFF-SELFGRANT-FIX-01:
    -- only when backed by an active, matching staff_role_grants row.
    select 1
    from public.profiles p
    join public.staff_role_grants g
      on g.user_id = p.id and g.revoked_at is null and g.role = lower(p.role)
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
$function$;

-- current_role(): a customer (or an unverified privileged row) reads 'customer'; no
-- row still reads NULL, as before.
create or replace function public."current_role"()
returns text
language sql
stable
set search_path to 'public', 'pg_catalog'
as $function$
  select coalesce(
    public.verified_profile_role(),
    (select 'customer'::text from public.profiles where id = auth.uid())
  );
$function$;

-- current_app_role(): previously coalesce(profiles.role, 'staff') — a caller with NO row
-- read 'staff'. Now: grant-verified role, else 'customer'. (Every consumer compares
-- against owner/manager/support only, so the no-row default changes no genuine path.)
create or replace function public.current_app_role()
returns text
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(public.verified_profile_role(), 'customer');
$function$;

create or replace function public.is_property_staff()
returns boolean
language sql
stable
set search_path to 'public', 'pg_catalog'
as $function$
  select coalesce(public.verified_profile_role(), '') in ('owner', 'manager', 'staff', 'support');
$function$;

-- ── (8) LAYER R — RLS policies that read profiles.role INLINE ──────────────────
-- Three owner-read policies bypass the functions above by querying profiles.role
-- directly. Re-point them at the grant-verified role; name, command and target roles are
-- unchanged. (Every other owner policy reads owner_profiles, guarded in (6).)
do $policies$
begin
  if to_regclass('public.staff_audit_logs') is not null then
    drop policy if exists audit_logs_owner_select on public.staff_audit_logs;
    create policy audit_logs_owner_select on public.staff_audit_logs
      as permissive for select to public
      using ((select public.verified_profile_role()) = 'owner');
  end if;
  if to_regclass('public.audit_logs') is not null then
    drop policy if exists "owner can read audit logs" on public.audit_logs;
    create policy "owner can read audit logs" on public.audit_logs
      as permissive for select to authenticated
      using ((select public.verified_profile_role()) = 'owner');
  end if;
  if to_regclass('public.orders') is not null then
    drop policy if exists "owner can read orders" on public.orders;
    create policy "owner can read orders" on public.orders
      as permissive for select to authenticated
      using ((select public.verified_profile_role()) = 'owner');
  end if;
end $policies$;

-- end of migration --
