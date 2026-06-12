-- SEC-HARDEN-01 backstop — audit-writer grant invariant.
--
-- Run AFTER _bootstrap_supabase_env.sql + audit_fns_min.sql +
-- 20260612120000_sec_harden_01_audit_grants_and_bucket.sql, against a freshly
-- migrated DB. Asserts the post-lockdown ACL of the two SECURITY DEFINER audit
-- writers — the same revoke-discipline backstop the money RPCs carry
-- (apps/hub/supabase/tests/payments_grant_invariant.sql), applied to the audit
-- forensic path:
--
--   add_audit_log(text,text,text,uuid,jsonb)                    [unguarded forge
--     hole, zero app callers] → SERVICE-ROLE-ONLY:
--       has_function_privilege('anon',          fn, 'EXECUTE') = false
--       has_function_privilege('authenticated', fn, 'EXECUTE') = false
--       has_function_privilege('service_role',  fn, 'EXECUTE') = true
--
--   add_audit_log_v2(text,text,text,jsonb,jsonb,text,text,uuid) [staff-gated,
--     actor = auth.uid(), real authenticated-staff callers] → SCOPED TIGHTLY:
--       has_function_privilege('anon',          fn, 'EXECUTE') = false
--       has_function_privilege('authenticated', fn, 'EXECUTE') = true   (staff path)
--       has_function_privilege('service_role',  fn, 'EXECUTE') = true
--
-- If a future migration re-grants anon to either writer, re-grants authenticated
-- to v1 (re-opening the forge hole), or a `create or replace` resets the ACL,
-- this RAISES and psql (ON_ERROR_STOP=1) exits non-zero → CI goes RED.
--
-- MAINTENANCE: a NEW audit/forensic writer in `public` MUST be added here with
-- its intended end-state, or it is not covered.

do $$
declare
  fn_v1 text := 'public.add_audit_log(text,text,text,uuid,jsonb)';
  fn_v2 text := 'public.add_audit_log_v2(text,text,text,jsonb,jsonb,text,text,uuid)';
  violations int := 0;
begin
  raise notice '--- audit-writer grant invariant ---';
  raise notice '% | anon=% authenticated=% service_role=%', rpad(fn_v1, 56),
    has_function_privilege('anon', fn_v1, 'EXECUTE'),
    has_function_privilege('authenticated', fn_v1, 'EXECUTE'),
    has_function_privilege('service_role', fn_v1, 'EXECUTE');
  raise notice '% | anon=% authenticated=% service_role=%', rpad(fn_v2, 56),
    has_function_privilege('anon', fn_v2, 'EXECUTE'),
    has_function_privilege('authenticated', fn_v2, 'EXECUTE'),
    has_function_privilege('service_role', fn_v2, 'EXECUTE');

  -- v1: service-role-only. anon + authenticated reach must be DEAD.
  if has_function_privilege('anon', fn_v1, 'EXECUTE') then
    raise warning 'VIOLATION: anon can EXECUTE % (forge hole re-opened)', fn_v1; violations := violations + 1; end if;
  if has_function_privilege('authenticated', fn_v1, 'EXECUTE') then
    raise warning 'VIOLATION: authenticated can EXECUTE % (forge hole re-opened)', fn_v1; violations := violations + 1; end if;
  if not has_function_privilege('service_role', fn_v1, 'EXECUTE') then
    raise warning 'VIOLATION: service_role CANNOT EXECUTE % (server audit path would break)', fn_v1; violations := violations + 1; end if;

  -- v2: scoped tightly. anon reach must be DEAD; authenticated (staff path) +
  -- service_role retained.
  if has_function_privilege('anon', fn_v2, 'EXECUTE') then
    raise warning 'VIOLATION: anon can EXECUTE %', fn_v2; violations := violations + 1; end if;
  if not has_function_privilege('authenticated', fn_v2, 'EXECUTE') then
    raise warning 'VIOLATION: authenticated CANNOT EXECUTE % (staff audit path would break)', fn_v2; violations := violations + 1; end if;
  if not has_function_privilege('service_role', fn_v2, 'EXECUTE') then
    raise warning 'VIOLATION: service_role CANNOT EXECUTE %', fn_v2; violations := violations + 1; end if;

  -- FINDING 1b — the DIRECT TABLE forge path must also be dead: anon +
  -- authenticated cannot INSERT into public.audit_logs, the always-true forge
  -- policy is gone, and service_role retains INSERT (the only legitimate writer).
  raise notice 'audit_logs table INSERT | anon=% authenticated=% service_role=%',
    has_table_privilege('anon', 'public.audit_logs', 'INSERT'),
    has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
    has_table_privilege('service_role', 'public.audit_logs', 'INSERT');
  if has_table_privilege('anon', 'public.audit_logs', 'INSERT') then
    raise warning 'VIOLATION: anon can INSERT into public.audit_logs (direct-table forge)'; violations := violations + 1; end if;
  if has_table_privilege('authenticated', 'public.audit_logs', 'INSERT') then
    raise warning 'VIOLATION: authenticated can INSERT into public.audit_logs (direct-table forge)'; violations := violations + 1; end if;
  if not has_table_privilege('service_role', 'public.audit_logs', 'INSERT') then
    raise warning 'VIOLATION: service_role lost INSERT on public.audit_logs (server audit path would break)'; violations := violations + 1; end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'audit_logs'
      and policyname = 'insert audit logs (auth)'
  ) then
    raise warning 'VIOLATION: always-true forge policy "insert audit logs (auth)" still present on public.audit_logs'; violations := violations + 1; end if;

  if violations > 0 then
    raise exception 'audit-writer grant invariant FAILED: % violation(s) — a forensic audit writer is reachable by an untrusted role, or a legitimate writer lost its grant', violations;
  end if;
  raise notice 'audit-writer grant invariant: OK (v1 service-role-only; v2 staff-scoped; anon dead; audit_logs table write service-role-only)';
end $$;
