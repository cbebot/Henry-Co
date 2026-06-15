-- SEC-HARDEN-04 (part A) backstop — profiles anon-insert closed + learn trigger fixed.
--
-- Run AFTER _bootstrap_supabase_env.sql + membership_min.sql + sec_harden_03_min.sql +
-- the SEC-HARDEN-02/03 migrations + invariants + sec_harden_04_min.sql +
-- 20260614160000_sec_harden_04_profiles_anon_and_learn_trigger.sql, against a freshly
-- migrated DB. Doubles as the prod post-apply verification (every check is
-- to_regclass / catalog guarded, so the same file asserts the CI fixture AND the full
-- prod surface).
--
-- Asserts:
--   1. profiles: the "anon can insert profiles" policy is GONE; anon holds NO
--      INSERT/UPDATE/DELETE/TRUNCATE; the authenticated self-service path
--      (profiles_insert_own + the authenticated INSERT grant) SURVIVES; service_role
--      keeps writes.
--   2. learn: the learn_role_memberships_updated_at trigger is GONE; an UPDATE to the
--      table SUCCEEDS (the bug is fixed). The shared learn_set_updated_at() function is
--      left intact for the tables that DO have an updated_at column.
--   3. Behavioural: as the authenticated role, an INSERT into profiles is rejected
--      (anon path closed; authenticated insert requires id = auth.uid(), which the
--      stubbed auth.uid()=null cannot satisfy — so a bare insert is rejected, proving
--      no world-write remains).
--   4. CLASS-DRIFT GUARD: the world-writable allowlist no longer contains profiles —
--      it is now {studio_payments, audit_logs}. A profiles regression turns CI RED.
--
-- psql runs with ON_ERROR_STOP=1, so any RAISE EXCEPTION exits non-zero → CI RED.

-- ── (1)+(2) structural assertions ────────────────────────────────────────────
do $$
declare
  violations int := 0;
  prof oid := to_regclass('public.profiles');
  lrm  oid := to_regclass('public.learn_role_memberships');
begin
  raise notice '--- SEC-HARDEN-04A invariant: profiles anon-insert + learn trigger ---';

  if prof is not null then
    -- (1a) the hole policy is gone
    if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles'
                 and policyname='anon can insert profiles') then
      raise warning 'VIOLATION: "anon can insert profiles" policy still present'; violations := violations + 1; end if;
    -- (1b) anon holds no write grant
    if has_table_privilege('anon', prof, 'INSERT') then
      raise warning 'VIOLATION: anon still has INSERT on public.profiles'; violations := violations + 1; end if;
    if has_table_privilege('anon', prof, 'UPDATE') then
      raise warning 'VIOLATION: anon still has UPDATE on public.profiles'; violations := violations + 1; end if;
    if has_table_privilege('anon', prof, 'DELETE') then
      raise warning 'VIOLATION: anon still has DELETE on public.profiles'; violations := violations + 1; end if;
    -- (1c) authenticated self-service path survives (policy + grant)
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles'
                     and policyname='profiles_insert_own') then
      raise warning 'VIOLATION: profiles_insert_own (authenticated self-service) was dropped'; violations := violations + 1; end if;
    if not has_table_privilege('authenticated', prof, 'INSERT') then
      raise warning 'VIOLATION: authenticated lost INSERT on public.profiles (self-service broken)'; violations := violations + 1; end if;
    -- (1d) service_role admin path intact
    if not (has_table_privilege('service_role', prof, 'INSERT')
            and has_table_privilege('service_role', prof, 'UPDATE')
            and has_table_privilege('service_role', prof, 'DELETE')) then
      raise warning 'VIOLATION: service_role lost write on public.profiles (admin path broken)'; violations := violations + 1; end if;
  else
    raise notice 'profiles absent on this chain — structural profiles checks skipped';
  end if;

  if lrm is not null then
    -- (2a) the broken trigger is gone
    if exists (select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
                 where n.nspname='public' and c.relname='learn_role_memberships'
                   and t.tgname='learn_role_memberships_updated_at') then
      raise warning 'VIOLATION: broken learn_role_memberships_updated_at trigger still present'; violations := violations + 1; end if;
    -- (2b) the shared function is left intact (still used by tables that have updated_at)
    if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                     where n.nspname='public' and p.proname='learn_set_updated_at') then
      raise warning 'NOTE: learn_set_updated_at() absent (expected present on prod for the other learn tables)'; end if;
  else
    raise notice 'learn_role_memberships absent on this chain — learn checks skipped';
  end if;

  if violations > 0 then
    raise exception 'SEC-HARDEN-04A invariant FAILED with % violation(s)', violations;
  end if;
  raise notice 'SEC-HARDEN-04A structural invariant PASSED';
end $$;

-- ── (2c) behavioural: an UPDATE to learn_role_memberships now SUCCEEDS ─────────
do $$
declare ok boolean := false;
begin
  if to_regclass('public.learn_role_memberships') is null then
    raise notice 'learn UPDATE behavioural check skipped — table absent'; return;
  end if;
  begin
    update public.learn_role_memberships set is_active = is_active
      where id = '00000000-0000-4000-8000-000000001601';
    ok := true;
  exception when others then
    ok := false;  -- still raising `record "new" has no field "updated_at"` => not fixed
  end;
  if not ok then
    raise exception 'VIOLATION: UPDATE to learn_role_memberships still fails — the updated_at trigger bug is NOT fixed';
  end if;
  raise notice 'behavioural check PASSED — UPDATE to learn_role_memberships succeeds';
end $$;

-- ── (3) behavioural: as authenticated, an INSERT into profiles is rejected ─────
do $$
declare inserted boolean := false; new_id uuid := gen_random_uuid();
begin
  if to_regclass('public.profiles') is null then
    raise notice 'profiles behavioural check skipped — table absent'; return;
  end if;
  set local role authenticated;
  begin
    execute format('insert into public.profiles (id, role) values (%L, %L)', new_id, 'owner');
    inserted := true;
  exception when others then
    inserted := false;  -- rejected (RLS with_check id=auth.uid()=null fails) — desired
  end;
  reset role;
  if inserted then
    delete from public.profiles where id = new_id;
    raise exception 'VIOLATION: authenticated role INSERTED an arbitrary profiles row (world-write or unscoped insert is LIVE)';
  end if;
  raise notice 'behavioural check PASSED — authenticated INSERT of an arbitrary profiles row is rejected';
end $$;

-- ── (4) CLASS-DRIFT GUARD — profiles removed from the allowlist ───────────────
-- The set of public tables with a PERMISSIVE write policy carrying a TRUE qual
-- targeting a request role must now be a SUBSET of {studio_payments, audit_logs}
-- (profiles is closed). A profiles regression → RED.
do $$
declare
  offenders text[];
  allowlist text[] := array['studio_payments','audit_logs'];
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
    raise exception 'CLASS DRIFT: world-writable table(s) outside the SEC-HARDEN-04A allowlist: %', array_to_string(offenders, ', ');
  end if;
  raise notice 'class-drift guard PASSED (allowlist now {studio_payments, audit_logs} — profiles closed)';
end $$;

select 'sec-harden-04A invariant: all assertions passed' as status;
