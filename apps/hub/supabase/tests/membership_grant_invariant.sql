-- SEC-HARDEN-02 backstop — role-membership write-lockdown invariant.
--
-- Run AFTER _bootstrap_supabase_env.sql + membership_min.sql +
-- 20260612140000_sec_harden_02_role_membership_lockdown.sql, against a freshly
-- migrated DB. This is the membership analogue of the money-RPC grant invariant
-- (apps/hub/supabase/tests/payments_grant_invariant.sql): it asserts that staff
-- membership can NEVER be self-granted by a signed-in user again.
--
-- For every public.*_role_memberships table it asserts:
--   1. GRANT lockdown — anon + authenticated + PUBLIC hold NO INSERT/UPDATE/
--      DELETE/TRUNCATE (the prompt's core invariant: CI goes RED if a future
--      migration re-grants membership writes to a request role).
--   2. service_role retains writes (the admin provisioning path; it also bypasses
--      RLS, so this is belt-and-suspenders).
--   3. No permissive WRITE policy targets anon/authenticated/PUBLIC — writes are
--      service-role-only; in particular the world-writable "Service role full
--      access" policy is gone.
--   4. A SELECT policy survives (the SECURITY INVOKER staff gates resolve the
--      caller's own membership).
--   5. Behavioural proof — as the authenticated role, an INSERT is rejected.
--
-- psql runs with ON_ERROR_STOP=1, so any RAISE EXCEPTION here exits non-zero → CI
-- RED. MAINTENANCE: a NEW *_role_memberships table is covered automatically (the
-- check discovers them by name); a NEW non-membership table that must be
-- service-role-write-only should get its own invariant.

do $$
declare
  t record;
  violations int := 0;
  writes text[] := array['INSERT','UPDATE','DELETE'];
  p text;
  bad_write_policies int;
  select_policies int;
begin
  raise notice '--- role-membership write-lockdown invariant ---';

  for t in
    select c.oid, c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like '%\_role\_memberships'
    order by c.relname
  loop
    raise notice 'table public.% | anon W=% / authenticated W=% / service_role W=%',
      rpad(t.relname, 30),
      (has_table_privilege('anon', t.oid, 'INSERT') or has_table_privilege('anon', t.oid, 'UPDATE') or has_table_privilege('anon', t.oid, 'DELETE')),
      (has_table_privilege('authenticated', t.oid, 'INSERT') or has_table_privilege('authenticated', t.oid, 'UPDATE') or has_table_privilege('authenticated', t.oid, 'DELETE')),
      (has_table_privilege('service_role', t.oid, 'INSERT') and has_table_privilege('service_role', t.oid, 'UPDATE') and has_table_privilege('service_role', t.oid, 'DELETE'));

    -- (1) anon/authenticated/PUBLIC must hold NO write privilege of any kind.
    foreach p in array writes loop
      if has_table_privilege('anon', t.oid, p) then
        raise warning 'VIOLATION: anon has % on public.% (membership self-grant re-opened)', p, t.relname; violations := violations + 1; end if;
      if has_table_privilege('authenticated', t.oid, p) then
        raise warning 'VIOLATION: authenticated has % on public.% (membership self-grant re-opened)', p, t.relname; violations := violations + 1; end if;
    end loop;
    -- TRUNCATE is owner/grant-only; assert it too for the request roles.
    if has_table_privilege('anon', t.oid, 'TRUNCATE') then
      raise warning 'VIOLATION: anon has TRUNCATE on public.%', t.relname; violations := violations + 1; end if;
    if has_table_privilege('authenticated', t.oid, 'TRUNCATE') then
      raise warning 'VIOLATION: authenticated has TRUNCATE on public.%', t.relname; violations := violations + 1; end if;

    -- (2) service_role keeps the admin write path.
    if not (has_table_privilege('service_role', t.oid, 'INSERT')
            and has_table_privilege('service_role', t.oid, 'UPDATE')
            and has_table_privilege('service_role', t.oid, 'DELETE')) then
      raise warning 'VIOLATION: service_role lost write on public.% (admin provisioning would break)', t.relname; violations := violations + 1; end if;

    -- (3) no permissive WRITE policy may target a request role; the world-writable
    -- "Service role full access" policy in particular must be gone.
    select count(*) into bad_write_policies
    from pg_policies
    where schemaname = 'public' and tablename = t.relname
      and cmd in ('ALL','INSERT','UPDATE','DELETE')
      and (roles @> array['authenticated']::name[]
        or roles @> array['anon']::name[]
        or roles @> array['public']::name[]);
    if bad_write_policies > 0 then
      raise warning 'VIOLATION: public.% has % permissive WRITE policy(ies) targeting a request role', t.relname, bad_write_policies; violations := violations + 1; end if;
    if exists (select 1 from pg_policies where schemaname='public' and tablename=t.relname and policyname='Service role full access') then
      raise warning 'VIOLATION: world-writable "Service role full access" policy still present on public.%', t.relname; violations := violations + 1; end if;

    -- (4) a SELECT policy must survive so the INVOKER staff gates resolve self.
    select count(*) into select_policies
    from pg_policies where schemaname='public' and tablename=t.relname and cmd in ('SELECT','ALL');
    if select_policies = 0 then
      raise warning 'VIOLATION: public.% has no SELECT policy — staff self-read gate would return false for everyone', t.relname; violations := violations + 1; end if;
  end loop;

  if violations > 0 then
    raise exception 'role-membership write-lockdown invariant FAILED with % violation(s)', violations;
  end if;
  raise notice 'role-membership write-lockdown invariant PASSED (writes service-role-only on every *_role_memberships table)';
end $$;

-- (5) Behavioural teeth — as the authenticated request role, a membership INSERT
-- must be rejected (RLS has no permissive write policy AND the table grant is
-- revoked). Proven against studio_role_memberships (representative). Any success
-- here is the live exploit and must fail the suite.
do $$
declare
  inserted boolean := false;
begin
  set local role authenticated;
  begin
    execute $ins$ insert into public.studio_role_memberships (user_id, role, is_active)
                  values ('00000000-0000-0000-0000-0000000000aa', 'owner', true) $ins$;
    inserted := true;
  exception when others then
    inserted := false;  -- denied (permission denied for table / RLS) — the desired outcome
  end;
  reset role;
  if inserted then
    -- clean up the proof row defensively (only reached on FAILURE) then raise.
    delete from public.studio_role_memberships where user_id = '00000000-0000-0000-0000-0000000000aa';
    raise exception 'VIOLATION: authenticated role INSERTED a studio_role_memberships row — the self-escalation exploit is LIVE';
  end if;
  raise notice 'behavioural check PASSED — authenticated INSERT into studio_role_memberships is rejected';
end $$;

select 'membership write-lockdown invariant: all assertions passed' as status;
