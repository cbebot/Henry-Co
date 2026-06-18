-- V3-25 backstop — moderation write-lockdown + end-user-no-read invariant.
--
-- Run AFTER _bootstrap_supabase_env.sql + the staff/audit prerequisites +
-- 20260616120000_v3_25_moderation.sql against a freshly migrated DB. The
-- moderation analogue of payments_grant_invariant.sql / membership_grant_invariant.sql.
--
-- For public.moderation_decisions and public.moderation_reports it asserts:
--   1. GRANT lockdown — anon + authenticated + PUBLIC hold NO INSERT/UPDATE/
--      DELETE/TRUNCATE (a future migration re-granting writes turns CI RED).
--   2. service_role retains writes (pipeline + staff server actions).
--   3. No permissive WRITE policy targets anon/authenticated/PUBLIC.
--   4. RLS is enabled on both tables.
--   5. moderation_decisions has NO end-user read path: every SELECT/ALL policy
--      is gated by is_staff_in_any() or service_role (customers never read it).
--   6. Behavioural — as the authenticated role, an INSERT is rejected.
--
-- psql runs with ON_ERROR_STOP=1, so any RAISE EXCEPTION exits non-zero → CI RED.

do $$
declare
  t text;
  tables text[] := array['moderation_decisions','moderation_reports'];
  oid_ oid;
  violations int := 0;
  writes text[] := array['INSERT','UPDATE','DELETE','TRUNCATE'];
  p text;
  bad_write_policies int;
  select_policies int;
  enduser_read_paths int;
begin
  raise notice '--- moderation write-lockdown + no-read invariant ---';

  foreach t in array tables loop
    select c.oid into oid_
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = t and c.relkind = 'r';
    if oid_ is null then
      raise exception 'VIOLATION: table public.% does not exist (migration not applied)', t;
    end if;

    -- (1) request roles hold NO write privilege of any kind.
    foreach p in array writes loop
      if has_table_privilege('anon', oid_, p) then
        raise warning 'VIOLATION: anon has % on public.%', p, t; violations := violations + 1; end if;
      if has_table_privilege('authenticated', oid_, p) then
        raise warning 'VIOLATION: authenticated has % on public.%', p, t; violations := violations + 1; end if;
    end loop;

    -- (2) service_role keeps the write path.
    if not (has_table_privilege('service_role', oid_, 'INSERT')
            and has_table_privilege('service_role', oid_, 'UPDATE')
            and has_table_privilege('service_role', oid_, 'DELETE')) then
      raise warning 'VIOLATION: service_role lost write on public.%', t; violations := violations + 1; end if;

    -- (3) no permissive WRITE policy may target a request role.
    select count(*) into bad_write_policies
    from pg_policies
    where schemaname = 'public' and tablename = t
      and cmd in ('ALL','INSERT','UPDATE','DELETE')
      and (roles @> array['authenticated']::name[]
        or roles @> array['anon']::name[]
        or roles @> array['public']::name[]);
    if bad_write_policies > 0 then
      raise warning 'VIOLATION: public.% has % permissive WRITE policy(ies) targeting a request role', t, bad_write_policies; violations := violations + 1; end if;

    -- (4) RLS enabled.
    if not exists (select 1 from pg_class where oid = oid_ and relrowsecurity) then
      raise warning 'VIOLATION: RLS not enabled on public.%', t; violations := violations + 1; end if;
  end loop;

  -- (5) moderation_decisions: every read policy is staff/service gated (no end-user read).
  select count(*) into enduser_read_paths
  from pg_policies
  where schemaname = 'public' and tablename = 'moderation_decisions'
    and cmd in ('SELECT','ALL')
    and coalesce(qual, '') !~ 'is_staff_in_any'
    and coalesce(qual, '') !~ 'service_role';
  if enduser_read_paths > 0 then
    raise warning 'VIOLATION: moderation_decisions has % SELECT policy(ies) not gated by staff/service — end users could read the operator ledger', enduser_read_paths;
    violations := violations + 1;
  end if;

  select count(*) into select_policies
  from pg_policies where schemaname='public' and tablename='moderation_decisions' and cmd in ('SELECT','ALL');
  if select_policies = 0 then
    raise warning 'VIOLATION: moderation_decisions has no SELECT policy — staff queue would be empty for everyone'; violations := violations + 1; end if;

  if violations > 0 then
    raise exception 'moderation write-lockdown invariant FAILED with % violation(s)', violations;
  end if;
  raise notice 'moderation write-lockdown invariant PASSED';
end $$;

-- (6) Behavioural teeth — as the authenticated request role, a decision INSERT
-- must be rejected (no write grant + no permissive write policy).
do $$
declare
  inserted boolean := false;
begin
  set local role authenticated;
  begin
    execute $ins$ insert into public.moderation_decisions
                    (content_type, content_id, content_hash, content_snapshot, decision, scanner)
                  values ('marketplace_listing','probe','probehash','{}'::jsonb,'approve','manual') $ins$;
    inserted := true;
  exception when others then
    inserted := false;  -- denied — the desired outcome
  end;
  reset role;
  if inserted then
    delete from public.moderation_decisions where content_id = 'probe' and content_hash = 'probehash';
    raise exception 'VIOLATION: authenticated role INSERTED a moderation_decisions row — the write lockdown is broken';
  end if;
  raise notice 'behavioural check PASSED — authenticated INSERT into moderation_decisions is rejected';
end $$;

select 'moderation write-lockdown invariant: all assertions passed' as status;
