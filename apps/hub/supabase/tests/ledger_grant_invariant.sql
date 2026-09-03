-- V3-17 BACKSTOP — money-RPC grant invariant for the post-isolation END STATE.
--
-- Run AFTER: _bootstrap_supabase_env.sql → payment_intents.sql → the existing
-- payments_grant_invariant.sql (public stage) → payments_private_isolation.sql →
-- double_entry_ledger.sql. By this point every money writer + the ledger functions
-- live in the NON-PostgREST-exposed `payments_private` schema. This asserts, for
-- each function:
--     has_function_privilege('anon',          fn, 'EXECUTE') = false
--     has_function_privilege('authenticated', fn, 'EXECUTE') = false
-- and, for the writers the server route layer / reconciler call:
--     has_function_privilege('service_role',  fn, 'EXECUTE') = true
-- plus the structural guard that anon/authenticated have NO USAGE on payments_private.
--
-- If any money/ledger RPC ever becomes anon/authenticated-executable (a re-grant, a
-- `create or replace` that resets the ACL, the schema usage being re-granted, or a
-- NEW money function added without the revoke + added below), this RAISES and psql
-- (ON_ERROR_STOP=1) exits non-zero → CI goes RED.
--
-- MAINTENANCE: a NEW payments_private money/ledger function MUST be added to
-- `all_fns` (and to `writers` if it is called directly), or it is not covered.

do $$
declare
  all_fns text[] := array[
    -- payment writers (relocated by the isolation migration)
    'payments_private.apply_payment_webhook(text, text, uuid, text)',
    'payments_private.advance_payment_intent(uuid, text, text)',
    'payments_private.enforce_payment_intent_transition()',
    'payments_private.payments_set_updated_at()',
    -- V3-17 ledger functions
    'payments_private.post_ledger_entry(text, text, text, text, jsonb)',
    'payments_private.post_charge_settlement(uuid, text)',
    'payments_private.credit_wallet_topup(uuid, uuid, uuid, bigint, text)',
    'payments_private.ledger_reconciliation()',
    'payments_private.wallet_ledger_reconciliation()',
    'payments_private.assert_entry_balanced()',
    'payments_private.block_ledger_mutation()'
  ];
  writers text[] := array[
    'payments_private.apply_payment_webhook(text, text, uuid, text)',
    'payments_private.advance_payment_intent(uuid, text, text)',
    'payments_private.post_ledger_entry(text, text, text, text, jsonb)',
    'payments_private.post_charge_settlement(uuid, text)',
    'payments_private.credit_wallet_topup(uuid, uuid, uuid, bigint, text)',
    'payments_private.ledger_reconciliation()',
    'payments_private.wallet_ledger_reconciliation()'
  ];
  fn text;
  anon_can boolean; auth_can boolean; svc_can boolean;
  violations int := 0;
begin
  raise notice '--- ledger money-RPC grant invariant (payments_private end state) ---';

  -- Structural guard: the schema itself is unreachable by the PostgREST request roles.
  if has_schema_privilege('anon', 'payments_private', 'USAGE') then
    raise warning 'VIOLATION: anon has USAGE on payments_private'; violations := violations + 1;
  end if;
  if has_schema_privilege('authenticated', 'payments_private', 'USAGE') then
    raise warning 'VIOLATION: authenticated has USAGE on payments_private'; violations := violations + 1;
  end if;

  foreach fn in array all_fns loop
    anon_can := has_function_privilege('anon',          fn, 'EXECUTE');
    auth_can := has_function_privilege('authenticated', fn, 'EXECUTE');
    svc_can  := has_function_privilege('service_role',  fn, 'EXECUTE');
    raise notice '% | anon=% authenticated=% service_role=%', rpad(fn, 64), anon_can, auth_can, svc_can;
    if anon_can then raise warning 'VIOLATION: anon can EXECUTE %', fn;          violations := violations + 1; end if;
    if auth_can then raise warning 'VIOLATION: authenticated can EXECUTE %', fn; violations := violations + 1; end if;
  end loop;

  foreach fn in array writers loop
    if not has_function_privilege('service_role', fn, 'EXECUTE') then
      raise warning 'VIOLATION: service_role CANNOT EXECUTE writer % (server/reconciler path would break)', fn;
      violations := violations + 1;
    end if;
  end loop;

  if violations > 0 then
    raise exception 'ledger money-RPC grant invariant FAILED: % violation(s) — a money/ledger writer is reachable by anon/authenticated (self-confirm / forge-a-balanced-entry) or a writer lost service_role EXECUTE', violations;
  end if;
  raise notice 'ledger money-RPC grant invariant: OK (% functions clean)', array_length(all_fns, 1);
end $$;
