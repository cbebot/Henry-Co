-- V3-OWNER-CONTROL-01 backstop — owner-action rail grant invariant.
--
-- Run AFTER _bootstrap_supabase_env.sql + owner_control_min.sql +
-- 20260727120000_v3_owner_control_01.sql, against a freshly migrated DB. Same
-- revoke-discipline backstop the money and audit RPCs carry
-- (payments_grant_invariant.sql, audit_grant_invariant.sql), applied to the
-- surface that now decides who may sell on the platform.
--
-- WHAT THIS RAIL IS. One endpoint lets the owner approve sellers, suspend live
-- stores, decide listings and identity checks, and remove reported content. Its
-- authorization reduces to one question — "is there a live owner_profiles row
-- for auth.uid() whose role is owner or admin?" — so owner_profiles is the root
-- of trust, and the RPCs beneath it must be reachable by the server alone.
--
-- END-STATE ASSERTED:
--
--   owner_control_is_owner()              [the caller-JWT gate; must be callable
--     BY the signed-in user, which is the whole point]
--       anon=false  authenticated=TRUE  service_role=false
--
--   owner_control_assert_actor(uuid)      [service-side actor assertion]
--   owner_control_claim_action(...)       [idempotent claim + ledger row]
--   owner_control_settle_action(...)      [terminal outcome]
--   owner_set_vendor_active(uuid,uuid,boolean)  [store suspend/reinstate]
--       anon=false  authenticated=false  service_role=TRUE
--
--   owner_control_actions   [the ledger] → RLS on, ZERO policies, no request-role
--                                          grants of any kind
--
--   owner_profiles          [root of trust] → NO insert/update/delete for anon or
--                                             authenticated, at table OR column
--                                             level; SELECT preserved
--
-- The owner_profiles clause is the one that has actually been broken. It was
-- "fixed" twice with a column-level revoke that PostgreSQL discards whenever the
-- role holds the privilege at table level — which prod does. owner_control_min.sql
-- reproduces that grant so this assertion is exercised against the real condition
-- rather than against a vanilla Postgres where the broken form looks fine.
--
-- If a future migration re-grants a request role to any RPC, adds a policy to the
-- ledger, or re-opens owner_profiles writes, this RAISES and psql
-- (ON_ERROR_STOP=1) exits non-zero → CI goes RED.
--
-- MAINTENANCE: a NEW owner-control RPC MUST be added here with its intended
-- end-state, or it is not covered.

do $$
declare
  fn_is_owner   text := 'public.owner_control_is_owner()';
  fn_assert     text := 'public.owner_control_assert_actor(uuid)';
  fn_claim      text := 'public.owner_control_claim_action(uuid,text,text,text,text,text,text,text,text,text,boolean)';
  fn_settle     text := 'public.owner_control_settle_action(uuid,uuid,text,uuid,text)';
  fn_vendor     text := 'public.owner_set_vendor_active(uuid,uuid,boolean)';
  fn_spend      text := 'public.owner_control_spend_reauth(uuid,bigint,text)';
  service_only  text[] := array[]::text[];
  fn            text;
  policy_count  int;
  rls_on        boolean;
  offender      text;
  violations    int := 0;
begin
  -- fn_spend was MISSING from this array when it was first added, which is
  -- exactly the failure this file's header warns about: the migration's revoke
  -- was correct, so nothing was exposed, but a future regression on that one
  -- function's grants would have sailed past CI while its four siblings were
  -- watched. An invariant that silently covers less than it claims is worse than
  -- no invariant, because it is read as coverage.
  service_only := array[fn_assert, fn_claim, fn_settle, fn_vendor, fn_spend];

  raise notice '--- owner-control rail grant invariant ---';

  -- ── 1. the caller-JWT gate ────────────────────────────────────────────────
  -- authenticated MUST keep EXECUTE: this is the predicate the route runs under
  -- the owner's own JWT, and without it every owner action fails closed.
  raise notice '% | anon=% authenticated=% service_role=%', rpad(fn_is_owner, 62),
    has_function_privilege('anon', fn_is_owner, 'EXECUTE'),
    has_function_privilege('authenticated', fn_is_owner, 'EXECUTE'),
    has_function_privilege('service_role', fn_is_owner, 'EXECUTE');

  if has_function_privilege('anon', fn_is_owner, 'EXECUTE') then
    raise warning 'VIOLATION: anon can EXECUTE % (unauthenticated owner probe)', fn_is_owner;
    violations := violations + 1;
  end if;
  if not has_function_privilege('authenticated', fn_is_owner, 'EXECUTE') then
    raise warning 'VIOLATION: authenticated CANNOT EXECUTE % (every owner action would fail closed)', fn_is_owner;
    violations := violations + 1;
  end if;

  -- ── 2. the service-role-only RPCs ─────────────────────────────────────────
  -- Supabase's default privileges grant EXECUTE to all three roles on creation,
  -- so each of these depends on its migration's explicit revoke landing with an
  -- EXACTLY matching signature. A typo'd signature raises at apply time; a
  -- missing revoke shows up right here.
  foreach fn in array service_only loop
    raise notice '% | anon=% authenticated=% service_role=%', rpad(fn, 62),
      has_function_privilege('anon', fn, 'EXECUTE'),
      has_function_privilege('authenticated', fn, 'EXECUTE'),
      has_function_privilege('service_role', fn, 'EXECUTE');

    if has_function_privilege('anon', fn, 'EXECUTE') then
      raise warning 'VIOLATION: anon can EXECUTE %', fn; violations := violations + 1;
    end if;
    if has_function_privilege('authenticated', fn, 'EXECUTE') then
      raise warning 'VIOLATION: authenticated can EXECUTE % (owner actions forgeable from a browser session)', fn;
      violations := violations + 1;
    end if;
    if not has_function_privilege('service_role', fn, 'EXECUTE') then
      raise warning 'VIOLATION: service_role CANNOT EXECUTE % (the rail would not work)', fn;
      violations := violations + 1;
    end if;
  end loop;

  -- ── 3. the ledger is a lockbox ────────────────────────────────────────────
  select relrowsecurity into rls_on
    from pg_class where oid = 'public.owner_control_actions'::regclass;
  select count(*) into policy_count
    from pg_policies where schemaname = 'public' and tablename = 'owner_control_actions';

  raise notice 'owner_control_actions | rls=% policies=%', rls_on, policy_count;

  if not rls_on then
    raise warning 'VIOLATION: owner_control_actions has RLS DISABLED';
    violations := violations + 1;
  end if;
  if policy_count <> 0 then
    raise warning 'VIOLATION: owner_control_actions has % policy/policies (must be deny-all; the console reads it server-side)', policy_count;
    violations := violations + 1;
  end if;

  select string_agg(format('%s:%s', r.rolname, p.priv), ', ' order by r.rolname, p.priv)
    into offender
  from (values ('anon'), ('authenticated')) as r(rolname)
  cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)
  where has_table_privilege(r.rolname, 'public.owner_control_actions', p.priv);

  if offender is not null then
    raise warning 'VIOLATION: owner_control_actions reachable by request roles [%]', offender;
    violations := violations + 1;
  end if;

  -- The reauth-spend ledger is the same class of lockbox. If a request role
  -- could DELETE from it, "one password, one action" would be undone by simply
  -- removing the row that records the password was spent.
  select relrowsecurity into rls_on
    from pg_class where oid = 'public.owner_control_reauth_spends'::regclass;
  if not rls_on then
    raise warning 'VIOLATION: owner_control_reauth_spends has RLS DISABLED';
    violations := violations + 1;
  end if;

  select string_agg(format('%s:%s', r.rolname, p.priv), ', ' order by r.rolname, p.priv)
    into offender
  from (values ('anon'), ('authenticated')) as r(rolname)
  cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)
  where has_table_privilege(r.rolname, 'public.owner_control_reauth_spends', p.priv);

  if offender is not null then
    raise warning
      'VIOLATION: owner_control_reauth_spends reachable by request roles [%] — a '
      'deletable spend ledger is not a spend ledger', offender;
    violations := violations + 1;
  end if;

  -- ── 4. owner_profiles cannot be self-promoted ─────────────────────────────
  -- Table-level AND column-level, because the bug being closed here passed one
  -- check and failed the other. DELETE is table-only: PostgreSQL has no
  -- column-level DELETE and has_any_column_privilege() raises on it.
  select string_agg(format('%s:%s', grantee, priv), ', ' order by grantee, priv)
    into offender
  from (
    select r.rolname as grantee, p.priv as priv
    from (values ('anon'), ('authenticated')) as r(rolname)
    cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)
    where has_table_privilege(r.rolname, 'public.owner_profiles', p.priv)
    union
    select r.rolname, p.priv || ' (column)'
    from (values ('anon'), ('authenticated')) as r(rolname)
    cross join (values ('INSERT'), ('UPDATE')) as p(priv)
    where has_any_column_privilege(r.rolname, 'public.owner_profiles', p.priv)
  ) g;

  raise notice 'owner_profiles writes reachable by request roles: %',
    coalesce(offender, '(none)');

  if offender is not null then
    raise warning
      'VIOLATION: owner_profiles still writable by [%] — HUB-2 self-escalation is OPEN. '
      'A column-level revoke cannot remove a table-level grant.', offender;
    violations := violations + 1;
  end if;

  -- SELECT must survive, or every owner read path breaks.
  if not has_table_privilege('authenticated', 'public.owner_profiles', 'SELECT') then
    raise warning 'VIOLATION: authenticated lost SELECT on owner_profiles (owner reads would break)';
    violations := violations + 1;
  end if;

  -- ── 5. the moderation queue is not world-writable ─────────────────────────
  -- The one table the rail both reads and writes. Live carries a policy named
  -- "Service role full access" whose body is `to public using (true)`, plus the
  -- write triad to both request roles. An attacker able to INSERT here puts
  -- fabricated evidence in front of the owner, who can then destroy real content
  -- through a rail that audits the whole thing faithfully.
  select string_agg(format('%s:%s', r.rolname, p.priv), ', ' order by r.rolname, p.priv)
    into offender
  from (values ('anon'), ('authenticated')) as r(rolname)
  cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)
  where has_table_privilege(r.rolname, 'public.platform_moderation_queue', p.priv);

  raise notice 'platform_moderation_queue writes reachable by request roles: %',
    coalesce(offender, '(none)');

  if offender is not null then
    raise warning 'VIOLATION: platform_moderation_queue writable by [%] — forged reports reach the owner console', offender;
    violations := violations + 1;
  end if;

  -- Mirrors the migration's own section-8 assertion: any request role, and
  -- EITHER clause trivially true (qual gates visibility, with_check gates
  -- writes; a policy can leak every row while constraining writes).
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'platform_moderation_queue'
    and (roles && array['public', 'anon', 'authenticated']::name[])
    and (
         coalesce(btrim(qual), '') in ('true', '(true)')
      or coalesce(btrim(with_check), '') in ('true', '(true)')
    );

  if policy_count > 0 then
    raise warning 'VIOLATION: platform_moderation_queue keeps % unrestricted public policy/policies', policy_count;
    violations := violations + 1;
  end if;

  if violations > 0 then
    raise exception 'owner-control grant invariant FAILED with % violation(s)', violations;
  end if;

  raise notice '--- owner-control grant invariant OK ---';
end $$;

select 'owner-control grant invariant passed' as status;
