-- V3-39 NEXT ACTION — table grant invariant (grant metadata, not runtime).
--
-- Run AFTER _bootstrap_supabase_env.sql + next_action_min.sql + the V3-39
-- migration on a fresh DB. Asserts the grant lock behind the no-cross-leak
-- invariant:
--   next_action_dismissals — owner-only. anon: nothing. authenticated:
--       SELECT+INSERT+UPDATE (NO DELETE — a dismissal is not client-clearable).
--       service_role: NOTHING (no admin reads/writes; the authenticated RLS
--       path is the only path).
-- If a re-grant, a table recreation, or a later migration widens any of these,
-- this RAISES and psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

do $$
declare
  violations int := 0;
  r record;
  actual boolean;
begin
  raise notice '--- V3-39 next-action grant invariant ---';

  for r in
    select * from (values
      ('anon',          'public.next_action_dismissals', 'SELECT', false),
      ('anon',          'public.next_action_dismissals', 'INSERT', false),
      ('anon',          'public.next_action_dismissals', 'UPDATE', false),
      ('anon',          'public.next_action_dismissals', 'DELETE', false),
      ('authenticated', 'public.next_action_dismissals', 'SELECT', true),
      ('authenticated', 'public.next_action_dismissals', 'INSERT', true),
      ('authenticated', 'public.next_action_dismissals', 'UPDATE', true),
      ('authenticated', 'public.next_action_dismissals', 'DELETE', false),
      ('service_role',  'public.next_action_dismissals', 'SELECT', false),
      ('service_role',  'public.next_action_dismissals', 'INSERT', false),
      ('service_role',  'public.next_action_dismissals', 'UPDATE', false),
      ('service_role',  'public.next_action_dismissals', 'DELETE', false)
    ) as t(rolename, tbl, priv, expected)
  loop
    actual := has_table_privilege(r.rolename, r.tbl, r.priv);
    if actual <> r.expected then
      raise warning 'VIOLATION: has_table_privilege(%, %, %) = % (expected %)',
        r.rolename, r.tbl, r.priv, actual, r.expected;
      violations := violations + 1;
    else
      raise notice 'OK: % % % = %', rpad(r.rolename, 13), rpad(r.tbl, 34), rpad(r.priv, 6), actual;
    end if;
  end loop;

  -- RLS must be enabled — grants alone are not the tenant boundary.
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'next_action_dismissals'
      and c.relrowsecurity
  ) then
    raise warning 'VIOLATION: RLS is not enabled on public.next_action_dismissals';
    violations := violations + 1;
  else
    raise notice 'OK: RLS enabled on public.next_action_dismissals';
  end if;

  if violations > 0 then
    raise exception 'V3-39 next-action grant invariant FAILED: % violation(s) — the dismissals grant is wider than owner-only', violations;
  end if;
  raise notice 'V3-39 next-action grant invariant: OK';
end $$;
