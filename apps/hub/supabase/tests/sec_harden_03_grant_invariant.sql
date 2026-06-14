-- SEC-HARDEN-03 backstop — world-writable data-table lockdown invariant.
--
-- Run AFTER _bootstrap_supabase_env.sql + membership_min.sql + sec_harden_03_min.sql
-- + 20260614120000_sec_harden_03_world_writable_lockdown.sql, against a freshly
-- migrated DB. The data-table analogue of the membership + money-RPC grant
-- invariants. It also doubles as the prod post-apply verification (every table check
-- is to_regclass-guarded, so the same file asserts the CI fixture subset AND the full
-- prod surface).
--
-- It asserts:
--   1. LOCKED tables (Cat-1 service-role-only + Cat-2 public-read): anon +
--      authenticated + PUBLIC hold NO INSERT/UPDATE/DELETE/TRUNCATE; service_role
--      keeps writes; the world-writable "Service role full access" policy is gone.
--   2. Cat-2 tables additionally keep a PUBLIC SELECT policy (the reference read).
--   3. Cat-3 tables (legitimate authenticated writer): the broad policy is gone, a
--      scoped write policy survives, and NO true-qual permissive write policy targets
--      a request role.
--   4. CLASS-DRIFT GUARD (generic): the set of public tables carrying a PERMISSIVE
--      write policy with a TRUE qual targeting a request role must be a SUBSET of the
--      documented deferral allowlist (studio_payments, profiles, audit_logs). A NEW
--      world-writable table anywhere → RED.
--   5. Behavioural: as the authenticated role, an INSERT into a locked table is rejected.
--   6. Academy seed reconciliation: the seed row is on the current brand mailbox.
--
-- psql runs with ON_ERROR_STOP=1, so any RAISE EXCEPTION exits non-zero → CI RED.

do $$
declare
  t text;
  violations int := 0;
  writes text[] := array['INSERT','UPDATE','DELETE'];
  p text;
  oid_t oid;
  bad_true_write int;
  -- Cat-1 (service-role-only) + Cat-2 (public-read) = the fully write-locked set.
  locked text[] := array[
    'jobs_applications','jobs_contact_masks','jobs_conversations','jobs_hiring_pipelines',
    'jobs_interviews','jobs_messages','jobs_moderation_queue',
    'logistics_addresses','logistics_assignments','logistics_events','logistics_expenses',
    'logistics_issues','logistics_notifications','logistics_proof_of_delivery','logistics_rate_cards',
    'logistics_settings','logistics_shipments','logistics_zones',
    'referral_programs','referral_rewards','referrals','trust_flags','platform_moderation_queue',
    'studio_briefs','studio_custom_requests','studio_leads','studio_notifications',
    'studio_project_assignments','studio_project_files','studio_project_milestones',
    'studio_project_updates','studio_projects','studio_proposal_milestones','studio_proposals',
    'studio_reviews','studio_revisions',
    'hub_homepage_content','platform_countries'
  ];
  cat2 text[] := array['hub_homepage_content','platform_countries'];
  cat3 text[] := array['studio_deliverables','studio_project_messages'];
  checked int := 0;
begin
  raise notice '--- world-writable data-table lockdown invariant ---';

  -- (1) LOCKED tables: no request-role write grant, service_role keeps writes,
  -- broad policy gone, no permissive true-qual write policy targets a request role.
  foreach t in array locked loop
    oid_t := to_regclass('public.' || t);
    if oid_t is null then continue; end if;
    checked := checked + 1;
    foreach p in array writes loop
      if has_table_privilege('anon', oid_t, p) then
        raise warning 'VIOLATION: anon has % on public.% (world-write re-opened)', p, t; violations := violations + 1; end if;
      if has_table_privilege('authenticated', oid_t, p) then
        raise warning 'VIOLATION: authenticated has % on public.% (world-write re-opened)', p, t; violations := violations + 1; end if;
    end loop;
    if has_table_privilege('anon', oid_t, 'TRUNCATE') then
      raise warning 'VIOLATION: anon has TRUNCATE on public.%', t; violations := violations + 1; end if;
    if has_table_privilege('authenticated', oid_t, 'TRUNCATE') then
      raise warning 'VIOLATION: authenticated has TRUNCATE on public.%', t; violations := violations + 1; end if;
    if not (has_table_privilege('service_role', oid_t, 'INSERT')
            and has_table_privilege('service_role', oid_t, 'UPDATE')
            and has_table_privilege('service_role', oid_t, 'DELETE')) then
      raise warning 'VIOLATION: service_role lost write on public.% (admin path would break)', t; violations := violations + 1; end if;
    if exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='Service role full access') then
      raise warning 'VIOLATION: world-writable "Service role full access" policy still present on public.%', t; violations := violations + 1; end if;
    select count(*) into bad_true_write from pg_policies
      where schemaname='public' and tablename=t and permissive='PERMISSIVE'
        and cmd in ('ALL','INSERT','UPDATE','DELETE')
        and coalesce(qual,'true')='true' and coalesce(with_check, qual, 'true')='true'
        and (roles @> array['authenticated']::name[] or roles @> array['anon']::name[] or roles @> array['public']::name[]);
    if bad_true_write > 0 then
      raise warning 'VIOLATION: public.% still has % true-qual permissive WRITE policy(ies) for a request role', t, bad_true_write; violations := violations + 1; end if;
  end loop;

  -- (2) Cat-2 keeps a PUBLIC SELECT policy (reference read preserved).
  foreach t in array cat2 loop
    oid_t := to_regclass('public.' || t);
    if oid_t is null then continue; end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t
                     and cmd in ('SELECT','ALL') and (roles @> array['public']::name[] or roles @> array['anon']::name[])) then
      raise warning 'VIOLATION: Cat-2 public.% lost its public SELECT policy (reference read broken)', t; violations := violations + 1; end if;
  end loop;

  -- (3) Cat-3 (legitimate authenticated writer): broad policy gone; a scoped write
  -- policy survives; no true-qual write policy targets a request role.
  foreach t in array cat3 loop
    oid_t := to_regclass('public.' || t);
    if oid_t is null then continue; end if;
    if exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='Service role full access') then
      raise warning 'VIOLATION: Cat-3 public.% still carries the broad "Service role full access" policy', t; violations := violations + 1; end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t
                     and cmd in ('ALL','INSERT','UPDATE','DELETE') and coalesce(qual,'true') <> 'true') then
      raise warning 'VIOLATION: Cat-3 public.% lost its scoped write policy (legitimate writer would break)', t; violations := violations + 1; end if;
    select count(*) into bad_true_write from pg_policies
      where schemaname='public' and tablename=t and permissive='PERMISSIVE'
        and cmd in ('ALL','INSERT','UPDATE','DELETE')
        and coalesce(qual,'true')='true' and coalesce(with_check, qual, 'true')='true'
        and (roles @> array['authenticated']::name[] or roles @> array['anon']::name[] or roles @> array['public']::name[]);
    if bad_true_write > 0 then
      raise warning 'VIOLATION: Cat-3 public.% has a true-qual permissive WRITE policy for a request role', t; violations := violations + 1; end if;
  end loop;

  if checked = 0 then
    raise exception 'invariant ran against ZERO known tables — fixture/migration not applied?';
  end if;
  if violations > 0 then
    raise exception 'world-writable data-table lockdown invariant FAILED with % violation(s)', violations;
  end if;
  raise notice 'lockdown invariant PASSED (% locked tables checked; writes service-role-only; Cat-2 read kept; Cat-3 scoped writer kept)', checked;
end $$;

-- (4) CLASS-DRIFT GUARD — generic. Any public table with a PERMISSIVE write policy
-- carrying a TRUE qual targeting a request role must be a documented deferral.
do $$
declare
  offenders text[];
  allowlist text[] := array['studio_payments','profiles','audit_logs'];
begin
  select coalesce(array_agg(distinct tablename order by tablename), array[]::text[]) into offenders
  from pg_policies
  where schemaname='public' and permissive='PERMISSIVE'
    and cmd in ('ALL','INSERT','UPDATE','DELETE')
    and coalesce(qual,'true')='true' and coalesce(with_check, qual, 'true')='true'
    and (roles @> array['authenticated']::name[] or roles @> array['anon']::name[] or roles @> array['public']::name[])
    and not (tablename = any(allowlist))
    and tablename not like '%\_role\_memberships';   -- closed by SEC-HARDEN-02
  if array_length(offenders, 1) > 0 then
    raise exception 'CLASS DRIFT: new world-writable table(s) outside the allowlist: %', array_to_string(offenders, ', ');
  end if;
  raise notice 'class-drift guard PASSED (no world-writable table outside the documented deferral allowlist)';
end $$;

-- (5) Behavioural teeth — as the authenticated request role, an INSERT into a locked
-- table (trust_flags, representative) must be rejected.
do $$
declare inserted boolean := false;
begin
  if to_regclass('public.trust_flags') is null then
    raise notice 'behavioural check skipped — trust_flags absent on this chain'; return;
  end if;
  set local role authenticated;
  begin
    execute $ins$ insert into public.trust_flags (user_id, reason) values ('00000000-0000-0000-0000-0000000000bb', 'self-clear') $ins$;
    inserted := true;
  exception when others then
    inserted := false;  -- denied (permission denied / RLS) — the desired outcome
  end;
  reset role;
  if inserted then
    delete from public.trust_flags where user_id = '00000000-0000-0000-0000-0000000000bb';
    raise exception 'VIOLATION: authenticated role INSERTED a trust_flags row — the world-write is LIVE';
  end if;
  raise notice 'behavioural check PASSED — authenticated INSERT into trust_flags is rejected';
end $$;

-- (6) Academy seed reconciliation — the seed row is on the current brand mailbox.
do $$
declare stale int := 0;
begin
  if to_regclass('public.learn_role_memberships') is null then
    raise notice 'academy reconciliation skipped — learn_role_memberships absent'; return;
  end if;
  select count(*) into stale from public.learn_role_memberships
    where id = '00000000-0000-4000-8000-000000001601' and normalized_email = 'academy@henrycogroup.com';
  if stale > 0 then
    raise exception 'VIOLATION: academy seed still bound to the retired brand mailbox academy@henrycogroup.com';
  end if;
  raise notice 'academy reconciliation PASSED (seed row not on the retired brand domain)';
end $$;

select 'sec-harden-03 world-writable lockdown invariant: all assertions passed' as status;
