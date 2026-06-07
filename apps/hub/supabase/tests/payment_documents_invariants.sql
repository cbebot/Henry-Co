-- V3-18 — payment-document invariant proofs (self-asserting).
--
-- Run AFTER the full chain: _bootstrap_supabase_env.sql → payment_intents.sql →
-- payments_private_isolation.sql → double_entry_ledger.sql →
-- v3_18_payment_documents.sql. Proves, on a fresh DB:
--   (a) HO- numbering is well-formed and increments per kind/year;
--   (b) receipt generation is IDEMPOTENT on posting_id (replay → no new receipt);
--   (c) a receipt whose total does NOT reconcile to the posted ledger entry's debit
--       total is REJECTED (the money-truth tie); a not-found posting is REJECTED;
--   (d) invoice generation is IDEMPOTENT on (source_kind, source_ref);
--   (e) RLS is enabled on both document tables;
--   (f) GRANT invariant: anon/authenticated cannot EXECUTE the document RPCs and
--       cannot INSERT a document directly; service_role can EXECUTE the writers.
-- Any violation RAISEs → psql (ON_ERROR_STOP=1) exits non-zero → CI goes RED.

\set ON_ERROR_STOP on

-- ── Fixtures: two confirmed payments + their posted ledger entries ──────────────
do $$
declare v jsonb;
begin
  insert into auth.users (id) values
    ('11111111-1111-1111-1111-111111111111')
    on conflict do nothing;

  -- Intent A: ₦500.00, will carry a VAT split on its receipt.
  insert into public.payment_intents (id, user_id, amount_minor, currency, country, method, status, idempotency_key)
    values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
            50000, 'NGN', 'NG', 'card', 'succeeded', 'doc-idem-A')
    on conflict do nothing;
  -- Intent B: ₦300.00, no VAT.
  insert into public.payment_intents (id, user_id, amount_minor, currency, country, method, status, idempotency_key)
    values ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
            30000, 'NGN', 'NG', 'bank', 'succeeded', 'doc-idem-B')
    on conflict do nothing;
  -- Intent C: ₦700.00, used for the mismatch-rejection proof.
  insert into public.payment_intents (id, user_id, amount_minor, currency, country, method, status, idempotency_key)
    values ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
            70000, 'NGN', 'NG', 'card', 'succeeded', 'doc-idem-C')
    on conflict do nothing;

  -- Post the balanced charge-settlement entry for each (DR cash / CR clearing).
  v := payments_private.post_charge_settlement('aaaaaaaa-0000-0000-0000-000000000001', 'succeeded');
  v := payments_private.post_charge_settlement('aaaaaaaa-0000-0000-0000-000000000002', 'succeeded');
  v := payments_private.post_charge_settlement('aaaaaaaa-0000-0000-0000-000000000003', 'succeeded');
  raise notice 'fixtures ready: 3 succeeded intents + posted settlements';
end $$;

-- ── (a) + (b) + (c-reconcile-OK) : record receipt A, well-formed number, VAT split reconciles ──
do $$
declare
  v_posting uuid;
  v jsonb;
begin
  select id into v_posting from public.journal_entries
    where source = 'payment_intent' and source_event_id = 'aaaaaaaa-0000-0000-0000-000000000001';

  -- subtotal 46512 + tax 3488 = total 50000 = ledger debit (the gross the ledger recorded).
  v := payments_private.record_customer_receipt(
    '11111111-1111-1111-1111-111111111111', 'marketplace',
    'aaaaaaaa-0000-0000-0000-000000000001', v_posting,
    'card', 'PSREF_A', 46512, 0, 3488, 50000, 'NGN',
    '[{"id":"l1","title":"Order","amountKobo":50000}]'::jsonb, now(), null);

  if (v->>'created')::boolean is not true then
    raise exception 'PROOF a/b FAILED: receipt A was not created (%)', v;
  end if;
  if (v->>'receipt_no') !~ '^HO-RCT-\d{4}-000001$' then
    raise exception 'PROOF a FAILED: receipt_no % is not HO-RCT-<year>-000001', v->>'receipt_no';
  end if;
  raise notice 'PROOF a/c OK: receipt A created, number % reconciles to ledger', v->>'receipt_no';
end $$;

-- ── (b) idempotency: replay the same posting → no new receipt ────────────────────
do $$
declare
  v_posting uuid;
  v jsonb;
  n int;
begin
  select id into v_posting from public.journal_entries
    where source = 'payment_intent' and source_event_id = 'aaaaaaaa-0000-0000-0000-000000000001';
  v := payments_private.record_customer_receipt(
    '11111111-1111-1111-1111-111111111111', 'marketplace',
    'aaaaaaaa-0000-0000-0000-000000000001', v_posting,
    'card', 'PSREF_A', 46512, 0, 3488, 50000, 'NGN', '[]'::jsonb, now(), null);
  if (v->>'created')::boolean is not false or v->>'reason' <> 'duplicate' then
    raise exception 'PROOF b FAILED: replay was not a no-op (%)', v;
  end if;
  select count(*) into n from public.customer_receipts where posting_id = v_posting;
  if n <> 1 then raise exception 'PROOF b FAILED: % receipts for the replayed posting (expected 1)', n; end if;
  raise notice 'PROOF b OK: receipt generation idempotent on posting_id';
end $$;

-- ── (a) sequence increments: receipt B → 000002 (no VAT) ────────────────────────
do $$
declare
  v_posting uuid;
  v jsonb;
begin
  select id into v_posting from public.journal_entries
    where source = 'payment_intent' and source_event_id = 'aaaaaaaa-0000-0000-0000-000000000002';
  v := payments_private.record_customer_receipt(
    '11111111-1111-1111-1111-111111111111', 'logistics',
    'aaaaaaaa-0000-0000-0000-000000000002', v_posting,
    'bank', 'PSREF_B', 30000, 0, 0, 30000, 'NGN', '[]'::jsonb, now(), null);
  if (v->>'receipt_no') !~ '^HO-RCT-\d{4}-000002$' then
    raise exception 'PROOF a FAILED: second receipt_no % is not …-000002', v->>'receipt_no';
  end if;
  raise notice 'PROOF a OK: numbering increments (%).', v->>'receipt_no';
end $$;

-- ── (c) reconciliation: a total that does NOT match the ledger debit is REJECTED ──
do $$
declare
  v_posting uuid;
  v jsonb;
begin
  select id into v_posting from public.journal_entries
    where source = 'payment_intent' and source_event_id = 'aaaaaaaa-0000-0000-0000-000000000003';
  begin
    v := payments_private.record_customer_receipt(
      '11111111-1111-1111-1111-111111111111', 'studio',
      'aaaaaaaa-0000-0000-0000-000000000003', v_posting,
      'card', 'PSREF_C', 69999, 0, 0, 69999, 'NGN', '[]'::jsonb, now(), null); -- 69999 ≠ ledger 70000
    raise exception 'PROOF c FAILED: a non-reconciling receipt total was accepted (%)', v;
  exception when check_violation then
    raise notice 'PROOF c OK: non-reconciling receipt total rejected';
  end;
  if exists (select 1 from public.customer_receipts where posting_id = v_posting) then
    raise exception 'PROOF c FAILED: a non-reconciling receipt was persisted';
  end if;
end $$;

-- ── (c) a receipt for a non-existent posting is REJECTED ─────────────────────────
do $$
declare v jsonb;
begin
  begin
    v := payments_private.record_customer_receipt(
      '11111111-1111-1111-1111-111111111111', 'studio',
      'aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000ff',
      'card', 'PSREF_X', 100, 0, 0, 100, 'NGN', '[]'::jsonb, now(), null);
    raise exception 'PROOF c FAILED: a receipt for a missing posting was accepted (%)', v;
  exception when check_violation then
    raise notice 'PROOF c OK: receipt for a missing ledger posting rejected';
  end;
end $$;

-- ── (d) invoice idempotency on (source_kind, source_ref) ────────────────────────
do $$
declare v1 jsonb; v2 jsonb; n int;
begin
  v1 := payments_private.record_customer_invoice(
    '11111111-1111-1111-1111-111111111111', 'marketplace', 'order_capture', 'order-777',
    'aaaaaaaa-0000-0000-0000-000000000001', 'issued', 50000, 0, 0, 50000, 'NGN', '[]'::jsonb, null, now());
  v2 := payments_private.record_customer_invoice(
    '11111111-1111-1111-1111-111111111111', 'marketplace', 'order_capture', 'order-777',
    'aaaaaaaa-0000-0000-0000-000000000001', 'issued', 50000, 0, 0, 50000, 'NGN', '[]'::jsonb, null, now());
  if (v1->>'created')::boolean is not true then raise exception 'PROOF d FAILED: first invoice not created (%)', v1; end if;
  if (v2->>'created')::boolean is not false or v2->>'reason' <> 'duplicate' then
    raise exception 'PROOF d FAILED: invoice replay was not a no-op (%)', v2;
  end if;
  if (v1->>'invoice_no') !~ '^HO-INV-\d{4}-000001$' then
    raise exception 'PROOF d FAILED: invoice_no % is not HO-INV-<year>-000001', v1->>'invoice_no';
  end if;
  select count(*) into n from public.customer_invoices where source_kind = 'order_capture' and source_ref = 'order-777';
  if n <> 1 then raise exception 'PROOF d FAILED: % invoices for the replayed source (expected 1)', n; end if;
  raise notice 'PROOF d OK: invoice generation idempotent on (source_kind, source_ref)';
end $$;

-- ── (e) RLS enabled on both document tables ─────────────────────────────────────
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.customer_receipts'::regclass) then
    raise exception 'PROOF e FAILED: RLS not enabled on customer_receipts';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.customer_invoices'::regclass) then
    raise exception 'PROOF e FAILED: RLS not enabled on customer_invoices';
  end if;
  raise notice 'PROOF e OK: RLS enabled on customer_receipts + customer_invoices';
end $$;

-- ── (f) GRANT invariant: document writers unreachable by anon/authenticated ──────
do $$
declare
  fns text[] := array[
    'payments_private.allocate_document_number(text, int)',
    'payments_private.record_customer_receipt(uuid, text, uuid, uuid, text, text, bigint, bigint, bigint, bigint, text, jsonb, timestamptz, text)',
    'payments_private.record_customer_invoice(uuid, text, text, text, uuid, text, bigint, bigint, bigint, bigint, text, jsonb, text, timestamptz)'
  ];
  fn text;
  violations int := 0;
begin
  foreach fn in array fns loop
    if has_function_privilege('anon', fn, 'EXECUTE') then
      raise warning 'VIOLATION: anon can EXECUTE %', fn; violations := violations + 1;
    end if;
    if has_function_privilege('authenticated', fn, 'EXECUTE') then
      raise warning 'VIOLATION: authenticated can EXECUTE %', fn; violations := violations + 1;
    end if;
    if not has_function_privilege('service_role', fn, 'EXECUTE') then
      raise warning 'VIOLATION: service_role CANNOT EXECUTE writer %', fn; violations := violations + 1;
    end if;
  end loop;

  -- No role may INSERT a legal document directly (writes flow only through the RPCs).
  if has_table_privilege('anon', 'public.customer_receipts', 'INSERT')
     or has_table_privilege('authenticated', 'public.customer_receipts', 'INSERT')
     or has_table_privilege('service_role', 'public.customer_receipts', 'INSERT') then
    raise warning 'VIOLATION: a role can INSERT customer_receipts directly'; violations := violations + 1;
  end if;
  if has_table_privilege('anon', 'public.customer_invoices', 'INSERT')
     or has_table_privilege('authenticated', 'public.customer_invoices', 'INSERT')
     or has_table_privilege('service_role', 'public.customer_invoices', 'INSERT') then
    raise warning 'VIOLATION: a role can INSERT customer_invoices directly'; violations := violations + 1;
  end if;

  if violations > 0 then
    raise exception 'payment-document grant invariant FAILED: % violation(s)', violations;
  end if;
  raise notice 'PROOF f OK: document RPCs anon/authenticated-unreachable; direct INSERT denied; service_role can write';
end $$;

select 'PAYMENT-DOCUMENT INVARIANTS (a)number (b)idempotent (c)ledger-reconcile (d)invoice-idempotent (e)RLS (f)grants === ALL PROVEN' as result;
