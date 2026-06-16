-- SEC-HARDEN-05 backstop — Care guarded-payment grant + structural invariant.
--
-- Run AFTER _bootstrap_supabase_env.sql + care_payment_min.sql +
-- 20260615120000_sec_harden_05_care_payment_guard.sql, against a freshly migrated DB.
-- The care-money analogue of the V3-17 ledger grant invariant. Every check is
-- to_regclass/to_regprocedure-guarded, so the SAME file asserts the CI fixture surface
-- AND doubles as the prod post-apply verification.
--
-- It asserts the END STATE that closes the free-mark-paid hole:
--   1. care_private schema: NO USAGE for anon/authenticated; service_role yes.
--   2. care_private functions (the guard machinery) + the public wrappers: NOT
--      EXECUTE-able by anon/authenticated. The public entry wrappers ARE service_role-
--      executable (the app's only reach); the private writers are service_role-executable.
--   3. care_payments + the care ledger tables: NO INSERT/UPDATE/DELETE/TRUNCATE for
--      anon/authenticated/service_role (writes flow only through the SECURITY DEFINER
--      RPCs, which act as the table owner). care_payments SELECT is retained (readers).
--   4. Structural teeth: the status-guard trigger on care_payment_requests, the balance
--      constraint trigger + immutability triggers on the care journal, and the
--      append-only immutability triggers on care_finance_ledger are all present.
--
-- psql runs with ON_ERROR_STOP=1, so any RAISE EXCEPTION exits non-zero → CI RED.

do $$
declare
  fn text;
  reg regprocedure;
  violations int := 0;
  -- functions that NO request role may execute (the whole guard machinery + wrappers).
  no_request_fns text[] := array[
    'care_private.record_manual_payment(text, uuid, numeric, text, text, text, uuid, uuid, jsonb)',
    'care_private.post_ledger_entry(text, text, text, text, uuid, jsonb)',
    'care_private.care_ledger_reconciliation()',
    'care_private.assert_entry_balanced()',
    'care_private.block_ledger_mutation()',
    'care_private.block_finance_ledger_mutation()',
    'care_private.guard_payment_request_paid()',
    'public.care_record_manual_payment(text, uuid, numeric, text, text, text, uuid, uuid, jsonb)',
    'public.care_ledger_reconciliation()'
  ];
  -- functions service_role MUST execute (the app path + the writers).
  svc_fns text[] := array[
    'public.care_record_manual_payment(text, uuid, numeric, text, text, text, uuid, uuid, jsonb)',
    'public.care_ledger_reconciliation()',
    'care_private.record_manual_payment(text, uuid, numeric, text, text, text, uuid, uuid, jsonb)',
    'care_private.post_ledger_entry(text, text, text, text, uuid, jsonb)',
    'care_private.care_ledger_reconciliation()'
  ];
  checked int := 0;
begin
  raise notice '--- SEC-HARDEN-05 care guarded-payment grant invariant ---';

  -- (1) the private schema is unreachable by the PostgREST request roles.
  if has_schema_privilege('anon', 'care_private', 'USAGE') then
    raise warning 'VIOLATION: anon has USAGE on care_private'; violations := violations + 1; end if;
  if has_schema_privilege('authenticated', 'care_private', 'USAGE') then
    raise warning 'VIOLATION: authenticated has USAGE on care_private'; violations := violations + 1; end if;
  if not has_schema_privilege('service_role', 'care_private', 'USAGE') then
    raise warning 'VIOLATION: service_role lost USAGE on care_private (app path would break)'; violations := violations + 1; end if;

  -- (2a) no request role may EXECUTE any guard function / wrapper.
  foreach fn in array no_request_fns loop
    reg := to_regprocedure(fn);
    if reg is null then continue; end if;   -- absent on this chain → skip (prod-verifier safe)
    checked := checked + 1;
    if has_function_privilege('anon', reg, 'EXECUTE') then
      raise warning 'VIOLATION: anon can EXECUTE %', fn; violations := violations + 1; end if;
    if has_function_privilege('authenticated', reg, 'EXECUTE') then
      raise warning 'VIOLATION: authenticated can EXECUTE %', fn; violations := violations + 1; end if;
  end loop;

  -- (2b) service_role MUST execute the app path + writers.
  foreach fn in array svc_fns loop
    reg := to_regprocedure(fn);
    if reg is null then continue; end if;
    if not has_function_privilege('service_role', reg, 'EXECUTE') then
      raise warning 'VIOLATION: service_role CANNOT EXECUTE % (app/writer path would break)', fn; violations := violations + 1; end if;
  end loop;

  if checked = 0 then
    raise exception 'care grant invariant ran against ZERO functions — migration not applied?';
  end if;
  if violations > 0 then
    raise exception 'care guarded-payment grant invariant FAILED: % violation(s)', violations;
  end if;
  raise notice 'care grant invariant: function ACLs OK (% functions checked)', checked;
end $$;

-- (3) table write lockdown: no request role nor service_role may write care_payments
-- or the care ledger tables directly; care_payments SELECT is retained for readers.
do $$
declare
  t text; r text; oid_t oid; violations int := 0;
  write_locked text[] := array['care_payments','care_ledger_accounts','care_journal_entries','care_journal_lines'];
  roles text[] := array['anon','authenticated','service_role'];
  writes text[] := array['INSERT','UPDATE','DELETE','TRUNCATE'];
  w text;
begin
  foreach t in array write_locked loop
    oid_t := to_regclass('public.' || t);
    if oid_t is null then continue; end if;
    foreach r in array roles loop
      foreach w in array writes loop
        if has_table_privilege(r, oid_t, w) then
          raise warning 'VIOLATION: % has % on public.% (raw care money write re-opened)', r, w, t;
          violations := violations + 1;
        end if;
      end loop;
    end loop;
  end loop;

  -- care_payments SELECT must survive for the cross-app readers (hub HQ, account, care-admin).
  if to_regclass('public.care_payments') is not null
     and not has_table_privilege('service_role', 'public.care_payments'::regclass, 'SELECT') then
    raise warning 'VIOLATION: service_role lost SELECT on care_payments (finance/HQ readers would break)';
    violations := violations + 1;
  end if;

  if violations > 0 then
    raise exception 'care money-table write-lockdown invariant FAILED: % violation(s)', violations;
  end if;
  raise notice 'care money-table write lockdown: OK (writes revoked for all roles; care_payments SELECT kept)';
end $$;

-- (4) structural teeth: the guard + ledger triggers exist.
do $$
declare missing text[] := array[]::text[];
begin
  if to_regclass('public.care_payment_requests') is not null
     and not exists (select 1 from pg_trigger where tgrelid='public.care_payment_requests'::regclass
                       and tgname='care_payment_requests_guard_paid' and not tgisinternal) then
    missing := missing || 'care_payment_requests_guard_paid'; end if;
  if to_regclass('public.care_journal_lines') is not null
     and not exists (select 1 from pg_trigger where tgrelid='public.care_journal_lines'::regclass
                       and tgname='care_journal_lines_balanced' and not tgisinternal) then
    missing := missing || 'care_journal_lines_balanced'; end if;
  if to_regclass('public.care_journal_entries') is not null
     and not exists (select 1 from pg_trigger where tgrelid='public.care_journal_entries'::regclass
                       and tgname='care_journal_entries_immutable' and not tgisinternal) then
    missing := missing || 'care_journal_entries_immutable'; end if;
  if to_regclass('public.care_finance_ledger') is not null
     and not exists (select 1 from pg_trigger where tgrelid='public.care_finance_ledger'::regclass
                       and tgname='care_finance_ledger_immutable' and not tgisinternal) then
    missing := missing || 'care_finance_ledger_immutable'; end if;
  if array_length(missing, 1) > 0 then
    raise exception 'care structural invariant FAILED: missing trigger(s): %', array_to_string(missing, ', ');
  end if;
  raise notice 'care structural teeth: OK (status guard + ledger balance/immutability triggers present)';
end $$;

select 'sec-harden-05 care guarded-payment grant + structural invariant: all assertions passed' as status;
