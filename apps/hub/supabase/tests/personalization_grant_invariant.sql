-- V3-34 PERSONALIZATION — table grant invariant (grant metadata, not runtime).
--
-- Run AFTER _bootstrap_supabase_env.sql + the V3-34 migration on a fresh DB.
-- Asserts the grant lock behind the no-cross-leak invariant:
--   user_home_layouts            — owner-only. anon: nothing. authenticated:
--       SELECT+INSERT+UPDATE (NO DELETE). service_role: NOTHING (no admin reads).
--   personalization_consent_events — append-only ledger. anon: nothing.
--       authenticated: SELECT only. service_role: SELECT+INSERT (NO UPDATE/DELETE).
-- If a re-grant, a table recreation, or a new migration widens any of these, this
-- RAISES and psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

do $$
declare
  violations int := 0;
  -- rows of (role, table, priv, expected)
  r record;
  actual boolean;
begin
  raise notice '--- V3-34 personalization grant invariant ---';

  for r in
    select * from (values
      -- user_home_layouts: owner-only via authenticated client; NO admin reads.
      ('anon',          'public.user_home_layouts', 'SELECT', false),
      ('anon',          'public.user_home_layouts', 'INSERT', false),
      ('anon',          'public.user_home_layouts', 'UPDATE', false),
      ('anon',          'public.user_home_layouts', 'DELETE', false),
      ('authenticated', 'public.user_home_layouts', 'SELECT', true),
      ('authenticated', 'public.user_home_layouts', 'INSERT', true),
      ('authenticated', 'public.user_home_layouts', 'UPDATE', true),
      ('authenticated', 'public.user_home_layouts', 'DELETE', false),
      ('service_role',  'public.user_home_layouts', 'SELECT', false),
      ('service_role',  'public.user_home_layouts', 'INSERT', false),
      ('service_role',  'public.user_home_layouts', 'UPDATE', false),
      ('service_role',  'public.user_home_layouts', 'DELETE', false),
      -- personalization_consent_events: append-only ledger.
      ('anon',          'public.personalization_consent_events', 'SELECT', false),
      ('anon',          'public.personalization_consent_events', 'INSERT', false),
      ('authenticated', 'public.personalization_consent_events', 'SELECT', true),
      ('authenticated', 'public.personalization_consent_events', 'INSERT', false),
      ('authenticated', 'public.personalization_consent_events', 'UPDATE', false),
      ('authenticated', 'public.personalization_consent_events', 'DELETE', false),
      ('service_role',  'public.personalization_consent_events', 'SELECT', true),
      ('service_role',  'public.personalization_consent_events', 'INSERT', true),
      ('service_role',  'public.personalization_consent_events', 'UPDATE', false),
      ('service_role',  'public.personalization_consent_events', 'DELETE', false)
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

  if violations > 0 then
    raise exception 'V3-34 personalization grant invariant FAILED: % violation(s) — a personalization table grant is wider than owner-only/append-only', violations;
  end if;
  raise notice 'V3-34 personalization grant invariant: OK';
end $$;
