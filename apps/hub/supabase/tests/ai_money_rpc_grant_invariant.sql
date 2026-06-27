-- V3-AI-01 — AI money-RPC grant invariant (mirrors payments_grant_invariant.sql).
--
-- Run AFTER _bootstrap_supabase_env.sql + payments_private_isolation + double_entry_ledger
-- + ai_billing_min.sql + 20260627120000_v3_ai_01_metered_billing.sql, against a freshly
-- migrated DB. Asserts the post-lockdown end state of the three V3-AI-01 money RPCs and the
-- two new money tables. If a future migration re-grants anon/authenticated, or a
-- `create or replace` resets the ACL, this RAISES and psql (ON_ERROR_STOP=1) exits non-zero
-- → CI goes RED.
--
--   reserve_wallet_for_ai_usage / post_ai_usage_charge / release_wallet_ai_hold → SERVICE-ROLE-ONLY:
--       has_function_privilege('anon',          fn, 'EXECUTE') = false
--       has_function_privilege('authenticated', fn, 'EXECUTE') = false
--       has_function_privilege('service_role',  fn, 'EXECUTE') = true
--       AND no additive PUBLIC (`=X/`) grant in proacl (the SEC-HARDEN-06 trap)
--   ai_usage_events / customer_wallet_ai_holds → no anon/authenticated table DML (writes
--       flow only through the SECURITY DEFINER RPCs); RLS enabled.

do $$
declare
  fns text[] := array[
    'payments_private.reserve_wallet_for_ai_usage(uuid,bigint,text,text,text,timestamptz)',
    'payments_private.post_ai_usage_charge(uuid,uuid,text,text,bigint,bigint,bigint,jsonb,text,text,jsonb)',
    'payments_private.release_wallet_ai_hold(uuid)'
  ];
  fn text;
  acl text;
  violations int := 0;
begin
  raise notice '--- V3-AI-01 money-RPC grant invariant ---';
  foreach fn in array fns loop
    raise notice '% | anon=% authenticated=% service_role=%', rpad(fn, 70),
      has_function_privilege('anon', fn, 'EXECUTE'),
      has_function_privilege('authenticated', fn, 'EXECUTE'),
      has_function_privilege('service_role', fn, 'EXECUTE');

    if has_function_privilege('anon', fn, 'EXECUTE') then
      raise warning 'VIOLATION: anon can EXECUTE %', fn; violations := violations + 1; end if;
    if has_function_privilege('authenticated', fn, 'EXECUTE') then
      raise warning 'VIOLATION: authenticated can EXECUTE %', fn; violations := violations + 1; end if;
    if not has_function_privilege('service_role', fn, 'EXECUTE') then
      raise warning 'VIOLATION: service_role CANNOT EXECUTE % (server billing path would break)', fn; violations := violations + 1; end if;

    -- SEC-HARDEN-06: a `=X/owner` empty-grantee entry means PUBLIC still holds EXECUTE
    -- (additive), so revoking anon/authenticated alone would be a no-op.
    select coalesce(array_to_string(proacl, ','), '') into acl from pg_proc p where p.oid = fn::regprocedure;
    if exists (select 1 from unnest(string_to_array(acl, ',')) e where e like '=X%') then
      raise warning 'VIOLATION: % carries an additive PUBLIC execute grant (proacl=%)', fn, acl; violations := violations + 1; end if;
  end loop;

  -- New money tables: no anon/authenticated DML; writes only via the guarded RPCs.
  foreach fn in array array['public.ai_usage_events', 'public.customer_wallet_ai_holds'] loop
    if has_table_privilege('anon', fn, 'INSERT') or has_table_privilege('anon', fn, 'UPDATE') or has_table_privilege('anon', fn, 'DELETE') then
      raise warning 'VIOLATION: anon holds DML on %', fn; violations := violations + 1; end if;
    if has_table_privilege('authenticated', fn, 'INSERT') or has_table_privilege('authenticated', fn, 'UPDATE') or has_table_privilege('authenticated', fn, 'DELETE') then
      raise warning 'VIOLATION: authenticated holds DML on %', fn; violations := violations + 1; end if;
    if not (select relrowsecurity from pg_class where oid = fn::regclass) then
      raise warning 'VIOLATION: RLS is not enabled on %', fn; violations := violations + 1; end if;
  end loop;

  if violations > 0 then
    raise exception 'V3-AI-01 money-RPC grant invariant FAILED: % violation(s) — an AI money RPC/table is reachable by an untrusted role, or a writer lost its grant', violations;
  end if;
  raise notice 'V3-AI-01 money-RPC grant invariant: OK (3 RPCs service-role-only, no PUBLIC; 2 tables RLS-on, no anon/authenticated DML)';
end $$;
