-- V3-19 BACKSTOP — money-RPC grant invariant for the REFUNDS end state.
--
-- Run AFTER the full chain incl. 20260611120000_v3_19_refunds.sql (which adds the
-- refund money writers + the credit-note document writer and recreates the two
-- settlement functions with the refunded-edge guard). This is the V3-19 end-state
-- counterpart of vat_grant_invariant.sql (which still validates the V3-VAT-01
-- checkpoint earlier in the chain). For every money/ledger/refund function:
--     has_function_privilege('anon',          fn, 'EXECUTE') = false
--     has_function_privilege('authenticated', fn, 'EXECUTE') = false
-- and, for the writers the server calls:
--     has_function_privilege('service_role',  fn, 'EXECUTE') = true
-- plus the structural guard that anon/authenticated have NO USAGE on payments_private.
--
-- A refund writer reachable by anon/authenticated would let a signed-in user forge a
-- refund record / mint a credit note / drain a wallet hold — RAISES → CI RED.
--
-- MAINTENANCE: a NEW payments_private money function MUST be added to `all_fns`
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
    -- V3-VAT-01
    'payments_private.post_sale_revenue(text, bigint, bigint)',
    'payments_private.vat_reconciliation(timestamptz, timestamptz)',
    -- V3-19 refunds & credit notes
    'payments_private.initiate_payment_refund(uuid, uuid, bigint, text, uuid)',
    'payments_private.set_refund_provider_reference(uuid, text)',
    'payments_private.fail_payment_refund(uuid)',
    'payments_private.apply_refund_webhook(text, uuid, text, bigint, text)',
    'payments_private.record_customer_credit_note(uuid, text, uuid, uuid, uuid, uuid, text, text, bigint, bigint, bigint, text, jsonb, timestamptz, text)',
    'payments_private.enforce_refund_cap()'
  ];
  writers text[] := array[
    'payments_private.initiate_payment_refund(uuid, uuid, bigint, text, uuid)',
    'payments_private.set_refund_provider_reference(uuid, text)',
    'payments_private.fail_payment_refund(uuid)',
    'payments_private.apply_refund_webhook(text, uuid, text, bigint, text)',
    'payments_private.record_customer_credit_note(uuid, text, uuid, uuid, uuid, uuid, text, text, bigint, bigint, bigint, text, jsonb, timestamptz, text)'
  ];
  fn text;
  anon_can boolean; auth_can boolean; svc_can boolean;
  violations int := 0;
begin
  raise notice '--- V3-19 money-RPC grant invariant (refunds end state) ---';

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
      raise warning 'VIOLATION: service_role CANNOT EXECUTE writer % (server path would break)', fn;
      violations := violations + 1;
    end if;
  end loop;

  -- Structural: NO direct DML reaches the refund/credit-note tables — writes flow
  -- only through the SECURITY DEFINER RPCs.
  if has_table_privilege('anon', 'public.payment_refunds', 'INSERT')
     or has_table_privilege('authenticated', 'public.payment_refunds', 'INSERT')
     or has_table_privilege('service_role', 'public.payment_refunds', 'INSERT') then
    raise warning 'VIOLATION: direct INSERT on payment_refunds is granted'; violations := violations + 1;
  end if;
  if has_table_privilege('anon', 'public.customer_credit_notes', 'INSERT')
     or has_table_privilege('authenticated', 'public.customer_credit_notes', 'INSERT')
     or has_table_privilege('service_role', 'public.customer_credit_notes', 'INSERT') then
    raise warning 'VIOLATION: direct INSERT on customer_credit_notes is granted'; violations := violations + 1;
  end if;

  if violations > 0 then
    raise exception 'V3-19 money-RPC grant invariant FAILED: % violation(s) — a refund/credit-note writer is reachable by anon/authenticated or a writer lost service_role EXECUTE', violations;
  end if;
  raise notice 'V3-19 money-RPC grant invariant: OK (% functions clean)', array_length(all_fns, 1);
end $$;
