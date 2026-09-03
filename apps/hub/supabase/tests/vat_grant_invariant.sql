-- V3-VAT-01 BACKSTOP — money-RPC grant invariant for the VAT-aware END STATE.
--
-- Run AFTER the full chain incl. 20260607140000_v3_vat_01_settlement_vat.sql (which
-- DROPs the old post_charge_settlement(uuid,text) + apply_payment_webhook(...,text) and
-- recreates them with the fee params, and adds post_sale_revenue + vat_reconciliation).
-- This is the V3-VAT-01 end-state counterpart of ledger_grant_invariant.sql (which still
-- validates the V3-17 checkpoint earlier in the chain). For every money/ledger function:
--     has_function_privilege('anon',          fn, 'EXECUTE') = false
--     has_function_privilege('authenticated', fn, 'EXECUTE') = false
-- and, for the writers the server/reconciler call:
--     has_function_privilege('service_role',  fn, 'EXECUTE') = true
-- plus the structural guard that anon/authenticated have NO USAGE on payments_private.
--
-- If any money/ledger RPC ever becomes anon/authenticated-executable (a re-grant, a
-- create-or-replace that resets the ACL, schema usage re-granted, or a NEW money fn
-- added without the revoke + added below), this RAISES and psql (ON_ERROR_STOP=1) exits
-- non-zero → CI goes RED.
--
-- MAINTENANCE: a NEW payments_private money/ledger function MUST be added to `all_fns`
-- (and to `writers` if called directly), or it is not covered.

do $$
declare
  all_fns text[] := array[
    -- payment writers (fee-aware signatures after V3-VAT-01)
    'payments_private.apply_payment_webhook(text, text, uuid, text, bigint, bigint)',
    'payments_private.advance_payment_intent(uuid, text, text)',
    'payments_private.enforce_payment_intent_transition()',
    'payments_private.payments_set_updated_at()',
    -- ledger functions
    'payments_private.post_ledger_entry(text, text, text, text, jsonb)',
    'payments_private.post_charge_settlement(uuid, text, bigint, bigint)',
    'payments_private.credit_wallet_topup(uuid, uuid, uuid, bigint, text)',
    'payments_private.ledger_reconciliation()',
    'payments_private.wallet_ledger_reconciliation()',
    'payments_private.assert_entry_balanced()',
    'payments_private.block_ledger_mutation()',
    -- V3-VAT-01 additions
    'payments_private.post_sale_revenue(text, bigint, bigint)',
    'payments_private.vat_reconciliation(timestamptz, timestamptz)'
  ];
  writers text[] := array[
    'payments_private.apply_payment_webhook(text, text, uuid, text, bigint, bigint)',
    'payments_private.advance_payment_intent(uuid, text, text)',
    'payments_private.post_ledger_entry(text, text, text, text, jsonb)',
    'payments_private.post_charge_settlement(uuid, text, bigint, bigint)',
    'payments_private.credit_wallet_topup(uuid, uuid, uuid, bigint, text)',
    'payments_private.post_sale_revenue(text, bigint, bigint)',
    'payments_private.vat_reconciliation(timestamptz, timestamptz)',
    'payments_private.ledger_reconciliation()',
    'payments_private.wallet_ledger_reconciliation()'
  ];
  fn text;
  anon_can boolean; auth_can boolean; svc_can boolean;
  violations int := 0;
begin
  raise notice '--- V3-VAT-01 money-RPC grant invariant (VAT-aware end state) ---';

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
    raise notice '% | anon=% authenticated=% service_role=%', rpad(fn, 70), anon_can, auth_can, svc_can;
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
    raise exception 'V3-VAT-01 money-RPC grant invariant FAILED: % violation(s) — a money/ledger writer is reachable by anon/authenticated (self-confirm / forge an entry) or a writer lost service_role EXECUTE', violations;
  end if;
  raise notice 'V3-VAT-01 money-RPC grant invariant: OK (% functions clean)', array_length(all_fns, 1);
end $$;
