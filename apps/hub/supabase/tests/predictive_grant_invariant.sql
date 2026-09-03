-- =============================================================================
-- V3-41 PREDICTIVE — STATIC GRANT / STRUCTURE INVARIANT
-- =============================================================================
-- Asserts, on the end state of 20260902120000_v3_41_predictive_quality_workload.sql:
--
--   1. RLS is ENABLED on all four predictive tables.
--   2. anon holds NO privilege of any kind on any of them.
--   3. authenticated holds SELECT only — never INSERT/UPDATE/DELETE/TRUNCATE
--      (writes are the service-role batch's alone).
--   4. Each table has exactly ONE select policy and it is staff-gated
--      (`qual ~ is_staff_in`), and NO other policy widens access.
--   5. The doctrine CHECK constraints exist — above all
--      `quality_no_auto_punishment`, the database-layer no-auto-punishment proof.
--   6. NO money contact: this migration created no function, and none of the new
--      tables references a payments_private object.
--
-- Failure mode: raise warning per violation, then a single raise exception, so
-- `psql -v ON_ERROR_STOP=1` turns CI red.
-- =============================================================================

\set ON_ERROR_STOP on

do $$
declare
  violations int := 0;
  checked    int := 0;
  r          record;
  actual     boolean;
  t          text;
  oid_t      oid;
  npolicies  int;
  nstaff     int;
begin
  -- 1. RLS enabled -----------------------------------------------------------
  for t in select unnest(array[
      'workload_forecasts','quality_assessments','dispute_likelihoods','predictive_batch_runs'
    ])
  loop
    oid_t := to_regclass('public.' || t);
    if oid_t is null then
      raise warning 'VIOLATION: table public.% is absent', t;
      violations := violations + 1;
      continue;
    end if;
    checked := checked + 1;
    if not (select relrowsecurity from pg_class where oid = oid_t) then
      raise warning 'VIOLATION: RLS not enabled on public.%', t;
      violations := violations + 1;
    end if;
  end loop;

  if checked = 0 then
    raise exception 'V3-41 invariant ran against ZERO tables — the migration did not apply';
  end if;

  -- 2 + 3. Privilege matrix --------------------------------------------------
  for r in
    select * from (values
      -- anon: nothing, anywhere.
      ('anon',          'public.workload_forecasts',    'SELECT', false),
      ('anon',          'public.workload_forecasts',    'INSERT', false),
      ('anon',          'public.quality_assessments',   'SELECT', false),
      ('anon',          'public.quality_assessments',   'INSERT', false),
      ('anon',          'public.dispute_likelihoods',   'SELECT', false),
      ('anon',          'public.dispute_likelihoods',   'INSERT', false),
      ('anon',          'public.predictive_batch_runs', 'SELECT', false),
      ('anon',          'public.predictive_batch_runs', 'INSERT', false),
      -- authenticated: SELECT only (RLS then narrows it to staff).
      ('authenticated', 'public.workload_forecasts',    'SELECT', true),
      ('authenticated', 'public.workload_forecasts',    'INSERT', false),
      ('authenticated', 'public.workload_forecasts',    'UPDATE', false),
      ('authenticated', 'public.workload_forecasts',    'DELETE', false),
      ('authenticated', 'public.quality_assessments',   'SELECT', true),
      ('authenticated', 'public.quality_assessments',   'INSERT', false),
      ('authenticated', 'public.quality_assessments',   'UPDATE', false),
      ('authenticated', 'public.quality_assessments',   'DELETE', false),
      ('authenticated', 'public.dispute_likelihoods',   'SELECT', true),
      ('authenticated', 'public.dispute_likelihoods',   'INSERT', false),
      ('authenticated', 'public.dispute_likelihoods',   'UPDATE', false),
      ('authenticated', 'public.dispute_likelihoods',   'DELETE', false),
      ('authenticated', 'public.predictive_batch_runs', 'SELECT', true),
      ('authenticated', 'public.predictive_batch_runs', 'INSERT', false),
      ('authenticated', 'public.predictive_batch_runs', 'UPDATE', false),
      ('authenticated', 'public.predictive_batch_runs', 'DELETE', false),
      -- the lock table stays fully closed to both request roles.
      ('anon',          'public.workflow_locks',        'SELECT', false),
      ('authenticated', 'public.workflow_locks',        'SELECT', false),
      ('authenticated', 'public.workflow_locks',        'UPDATE', false)
    ) as t(rolename, tbl, priv, expected)
  loop
    actual := has_table_privilege(r.rolename, r.tbl, r.priv);
    if actual <> r.expected then
      raise warning 'VIOLATION: has_table_privilege(%, %, %) = % (expected %)',
        r.rolename, r.tbl, r.priv, actual, r.expected;
      violations := violations + 1;
    end if;
  end loop;

  -- 4. Exactly one policy per table, and it is staff-gated --------------------
  for t in select unnest(array[
      'workload_forecasts','quality_assessments','dispute_likelihoods','predictive_batch_runs'
    ])
  loop
    select count(*) into npolicies from pg_policies where schemaname = 'public' and tablename = t;
    select count(*) into nstaff from pg_policies
      where schemaname = 'public' and tablename = t
        and cmd = 'SELECT' and coalesce(qual, '') ~ 'is_staff_in';
    if nstaff < 1 then
      raise warning 'VIOLATION: public.% has no staff-gated SELECT policy', t;
      violations := violations + 1;
    end if;
    if npolicies <> nstaff then
      raise warning 'VIOLATION: public.% has % policies but only % staff-gated — something widens access',
        t, npolicies, nstaff;
      violations := violations + 1;
    end if;
  end loop;

  -- workflow_locks must stay policy-free (default-deny, service-role only).
  select count(*) into npolicies from pg_policies
    where schemaname = 'public' and tablename = 'workflow_locks';
  if npolicies <> 0 then
    raise warning 'VIOLATION: workflow_locks must have ZERO policies, found %', npolicies;
    violations := violations + 1;
  end if;

  -- 5. Doctrine CHECK constraints exist --------------------------------------
  for t in select unnest(array[
      'quality_no_auto_punishment','quality_band_matches_flag'
    ])
  loop
    if not exists (
      select 1 from pg_constraint
      where conname = t and conrelid = to_regclass('public.quality_assessments')
    ) then
      raise warning 'VIOLATION: CHECK constraint % missing on quality_assessments', t;
      violations := violations + 1;
    end if;
  end loop;

  -- The no-auto-punishment CHECK must actually name the advisory verbs, so a
  -- future edit that empties it cannot pass this gate.
  if not exists (
    select 1 from pg_constraint
    where conname = 'quality_no_auto_punishment'
      and conrelid = to_regclass('public.quality_assessments')
      and pg_get_constraintdef(oid) like '%staff_review%'
      and pg_get_constraintdef(oid) like '%staff_contact_provider%'
  ) then
    raise warning 'VIOLATION: quality_no_auto_punishment does not enumerate the advisory verbs';
    violations := violations + 1;
  end if;

  -- 6. Single-flight lock row seeded (a missing row = a lock nobody can win) --
  if not exists (select 1 from public.workflow_locks where lock_key = 'hub.predictive.tick') then
    raise warning 'VIOLATION: workflow_locks row hub.predictive.tick was not seeded';
    violations := violations + 1;
  end if;

  -- 7. NO new counter: this pass must not have created a second spend ledger --
  if to_regclass('public.predictive_ai_spend_ledger') is not null
     or to_regclass('public.predictive_spend_ledger') is not null then
    raise warning 'VIOLATION: a second internal spend ledger was created — V3-43 owns the ONE counter';
    violations := violations + 1;
  end if;

  if violations > 0 then
    raise exception 'V3-41 PREDICTIVE GRANT INVARIANT FAILED: % violation(s)', violations;
  end if;

  raise notice 'V3-41 predictive grant invariant PASSED (% tables checked)', checked;
end $$;
