-- V3-38 AVAILABILITY — table + function grant invariant (grant metadata).
--
-- Run AFTER _bootstrap_supabase_env.sql + availability_min.sql + the V3-38
-- migration on a fresh DB. Asserts the availability grant lock:
--   service_area_coverage     — public location-keyed config. anon/authenticated:
--       SELECT only (availability is public — PRIVACY-NDPR §1); NO writes.
--       service_role: full curation (staff writes ride service-role app code).
--   service_availability_gaps — aggregate coverage-gap counters. anon and
--       authenticated: NOTHING. service_role: SELECT only — table writes flow
--       exclusively through record_service_availability_gap() (SECURITY
--       DEFINER, pinned search_path, EXECUTE service_role-only).
-- If a re-grant, a table recreation, or a new migration widens any of these,
-- this RAISES and psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

do $$
declare
  violations int := 0;
  r record;
  actual boolean;
begin
  raise notice '--- V3-38 availability grant invariant ---';

  for r in
    select * from (values
      -- service_area_coverage: public read, service-role-only writes.
      ('anon',          'public.service_area_coverage', 'SELECT', true),
      ('anon',          'public.service_area_coverage', 'INSERT', false),
      ('anon',          'public.service_area_coverage', 'UPDATE', false),
      ('anon',          'public.service_area_coverage', 'DELETE', false),
      ('authenticated', 'public.service_area_coverage', 'SELECT', true),
      ('authenticated', 'public.service_area_coverage', 'INSERT', false),
      ('authenticated', 'public.service_area_coverage', 'UPDATE', false),
      ('authenticated', 'public.service_area_coverage', 'DELETE', false),
      ('service_role',  'public.service_area_coverage', 'SELECT', true),
      ('service_role',  'public.service_area_coverage', 'INSERT', true),
      ('service_role',  'public.service_area_coverage', 'UPDATE', true),
      ('service_role',  'public.service_area_coverage', 'DELETE', true),
      -- service_availability_gaps: request roles get NOTHING; service_role
      -- reads only (writes are fn-only).
      ('anon',          'public.service_availability_gaps', 'SELECT', false),
      ('anon',          'public.service_availability_gaps', 'INSERT', false),
      ('anon',          'public.service_availability_gaps', 'UPDATE', false),
      ('anon',          'public.service_availability_gaps', 'DELETE', false),
      ('authenticated', 'public.service_availability_gaps', 'SELECT', false),
      ('authenticated', 'public.service_availability_gaps', 'INSERT', false),
      ('authenticated', 'public.service_availability_gaps', 'UPDATE', false),
      ('authenticated', 'public.service_availability_gaps', 'DELETE', false),
      ('service_role',  'public.service_availability_gaps', 'SELECT', true),
      ('service_role',  'public.service_availability_gaps', 'INSERT', false),
      ('service_role',  'public.service_availability_gaps', 'UPDATE', false),
      ('service_role',  'public.service_availability_gaps', 'DELETE', false)
    ) as t(rolename, tbl, priv, expected)
  loop
    actual := has_table_privilege(r.rolename, r.tbl, r.priv);
    if actual <> r.expected then
      raise warning 'VIOLATION: has_table_privilege(%, %, %) = % (expected %)',
        r.rolename, r.tbl, r.priv, actual, r.expected;
      violations := violations + 1;
    else
      raise notice 'OK: % % % = %', rpad(r.rolename, 13), rpad(r.tbl, 40), rpad(r.priv, 6), actual;
    end if;
  end loop;

  -- The gap counter fn: EXECUTE is service_role-only (PUBLIC default stripped).
  for r in
    select * from (values
      ('anon',          false),
      ('authenticated', false),
      ('service_role',  true)
    ) as t(rolename, expected)
  loop
    actual := has_function_privilege(
      r.rolename,
      'public.record_service_availability_gap(text, text, text, text, text)',
      'EXECUTE'
    );
    if actual <> r.expected then
      raise warning 'VIOLATION: has_function_privilege(%, record_service_availability_gap, EXECUTE) = % (expected %)',
        r.rolename, actual, r.expected;
      violations := violations + 1;
    else
      raise notice 'OK: % EXECUTE record_service_availability_gap = %', rpad(r.rolename, 13), actual;
    end if;
  end loop;

  if violations > 0 then
    raise exception 'V3-38 availability grant invariant FAILED: % violation(s) — an availability grant is wider than public-read/service-curated/fn-only', violations;
  end if;
  raise notice 'V3-38 availability grant invariant: OK';
end $$;
