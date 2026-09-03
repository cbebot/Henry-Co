-- V3-35 DEALS — table grant invariant (grant metadata, not runtime).
--
-- Run AFTER deals_min.sql + the V3-35 migration on a fresh DB. Asserts the
-- grant lock behind the deal model:
--   deals            — read-only for request roles. anon/authenticated: SELECT
--       only (RLS narrows to live/own/staff). NO request-role writes: every
--       write flows through audited service-role server actions. service_role:
--       full (the authoring/approval writer).
--   deal_impressions — append-only fairness ledger. anon: nothing.
--       authenticated: SELECT only (staff policy narrows; non-staff read 0
--       rows). service_role: SELECT+INSERT (NO UPDATE/DELETE — append-only
--       even for the admin client).
-- If a re-grant, a table recreation, or a new migration widens any of these,
-- this RAISES and psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

do $$
declare
  violations int := 0;
  r record;
  actual boolean;
begin
  raise notice '--- V3-35 deals grant invariant ---';

  for r in
    select * from (values
      -- deals: request roles read-only; service_role writes.
      ('anon',          'public.deals', 'SELECT', true),
      ('anon',          'public.deals', 'INSERT', false),
      ('anon',          'public.deals', 'UPDATE', false),
      ('anon',          'public.deals', 'DELETE', false),
      ('authenticated', 'public.deals', 'SELECT', true),
      ('authenticated', 'public.deals', 'INSERT', false),
      ('authenticated', 'public.deals', 'UPDATE', false),
      ('authenticated', 'public.deals', 'DELETE', false),
      ('service_role',  'public.deals', 'SELECT', true),
      ('service_role',  'public.deals', 'INSERT', true),
      ('service_role',  'public.deals', 'UPDATE', true),
      ('service_role',  'public.deals', 'DELETE', true),
      -- deal_impressions: append-only ledger; users never read impressions.
      ('anon',          'public.deal_impressions', 'SELECT', false),
      ('anon',          'public.deal_impressions', 'INSERT', false),
      ('authenticated', 'public.deal_impressions', 'SELECT', true),
      ('authenticated', 'public.deal_impressions', 'INSERT', false),
      ('authenticated', 'public.deal_impressions', 'UPDATE', false),
      ('authenticated', 'public.deal_impressions', 'DELETE', false),
      ('service_role',  'public.deal_impressions', 'SELECT', true),
      ('service_role',  'public.deal_impressions', 'INSERT', true),
      ('service_role',  'public.deal_impressions', 'UPDATE', false),
      ('service_role',  'public.deal_impressions', 'DELETE', false)
    ) as t(rolename, tbl, priv, expected)
  loop
    actual := has_table_privilege(r.rolename, r.tbl, r.priv);
    if actual <> r.expected then
      raise warning 'VIOLATION: has_table_privilege(%, %, %) = % (expected %)',
        r.rolename, r.tbl, r.priv, actual, r.expected;
      violations := violations + 1;
    else
      raise notice 'OK: % % % = %', rpad(r.rolename, 13), rpad(r.tbl, 24), rpad(r.priv, 6), actual;
    end if;
  end loop;

  if violations > 0 then
    raise exception 'V3-35 deals grant invariant FAILED: % violation(s) — a deal table grant is wider than read-only/append-only', violations;
  end if;
  raise notice 'V3-35 deals grant invariant: OK';
end $$;
