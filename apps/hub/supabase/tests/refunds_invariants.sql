-- V3-19 — Refunds & credit notes invariants (self-asserting).
--
-- Run AFTER the full chain: _bootstrap → payment_intents → payments_private_isolation →
-- double_entry_ledger → v3_18_payment_documents → v3_vat_01_settlement_vat → v3_19_refunds.
-- Proves, on a fresh DB:
--   (1) FULL refund cycle: charge + sale → initiate → refund.processed webhook →
--       intent `refunded`; settlement reversal + FULL revenue/VAT reversal posted.
--   (2) PARTIAL refunds reverse output VAT PROPORTIONALLY (40% → 30 of 75), the
--       final partial reverses the exact REMAINDER, intent only reaches `refunded`
--       when cumulative == captured.
--   (3) OVER-REFUND REJECTED BY THE DB ITSELF — a direct INSERT past the captured
--       amount raises even with every app-layer check bypassed; in-flight amounts
--       count toward the cap.
--   (4) DOUBLE WEBHOOK → ONE effect (dedup + row CAS): one settlement entry, one
--       transition.
--   (5) refund.failed reverts: row failed, intent back to `succeeded`, NO settlement
--       reversal, a fresh initiation may follow.
--   (6) CREDIT NOTE unfakeably bound (the #252 mirror, both directions) + idempotent
--       + VAT line must equal the POSTED reversal; refund posting cannot mint a
--       receipt; charge posting cannot mint a credit note.
--   (7) WALLET refund: hold at initiation (never-negative CAS), insufficient balance
--       REJECTED with the available amount, wallet_ledger_reconciliation() holds at
--       every step, the DB CHECK refuses a negative balance outright.
--   (8) WALLET release on refund.failed: exactly one re-credit.
--   (9) Legacy paths fail LOUDLY: apply_payment_webhook('refunded') and
--       post_charge_settlement(.., 'refunded') both raise.
--   (10) ledger_reconciliation() delta 0 after EVERYTHING.
-- Any violation RAISEs → psql (ON_ERROR_STOP=1) exits non-zero → CI goes RED.

\set ON_ERROR_STOP on

-- Users + intents. (INSERT does not fire the UPDATE-transition trigger, so seeding
-- terminal statuses directly is fine — exactly how the earlier proof files seed.)
-- The fixture users carry an email: on the PROD-SHAPE surface the auth.users INSERT
-- fires handle_new_customer() → customer_profiles.email is NOT NULL, so an email-less
-- seed would violate the constraint (FL2-REHEARSE-01, 2026-06-12 — same fix the
-- payment-documents/VAT suites already carry; harmless on the bare-PG CI stub).
insert into auth.users (id, email) values
  ('000000bb-0000-0000-0000-0000000000bb', 'v319-invariants-bb@fixtures.henryco.test'),
  ('000000cc-0000-0000-0000-0000000000cc', 'v319-invariants-cc@fixtures.henryco.test')
on conflict do nothing;

insert into public.payment_intents (id, user_id, amount_minor, currency, country, method, status, idempotency_key) values
  -- (1) full-cycle sale
  ('aaaa1111-0000-0000-0000-000000000001', '000000bb-0000-0000-0000-0000000000bb', 1075, 'NGN', 'NG', 'card', 'processing', 'rf-idem-1'),
  -- (2) partial-cycle sale
  ('aaaa2222-0000-0000-0000-000000000002', '000000bb-0000-0000-0000-0000000000bb', 1075, 'NGN', 'NG', 'card', 'processing', 'rf-idem-2'),
  -- (5) failed-refund cycle
  ('aaaa3333-0000-0000-0000-000000000003', '000000bb-0000-0000-0000-0000000000bb', 5000, 'NGN', 'NG', 'card', 'processing', 'rf-idem-3'),
  -- (7) wallet top-up + refund
  ('aaaa4444-0000-0000-0000-000000000004', '000000cc-0000-0000-0000-0000000000cc', 5000, 'NGN', 'NG', 'card', 'processing', 'rf-idem-4'),
  -- (8) wallet top-up + failed refund (release)
  ('aaaa5555-0000-0000-0000-000000000005', '000000cc-0000-0000-0000-0000000000cc', 3000, 'NGN', 'NG', 'card', 'processing', 'rf-idem-5'),
  -- (3b) succeeded with NO ledger settlement (legacy shape) — initiate must refuse
  ('aaaa6666-0000-0000-0000-000000000006', '000000bb-0000-0000-0000-0000000000bb', 9999, 'NGN', 'NG', 'card', 'succeeded',  'rf-idem-6')
on conflict (id) do nothing;

-- Confirm the charges through the REAL money path (dedup + status + settlement, one txn).
do $$
declare v jsonb;
begin
  v := payments_private.apply_payment_webhook('mock', 'rf-charge-1', 'aaaa1111-0000-0000-0000-000000000001', 'succeeded', 0, null);
  if (v->>'applied')::boolean is not true then raise exception 'SETUP FAILED: charge 1 (%)', v; end if;
  v := payments_private.apply_payment_webhook('mock', 'rf-charge-2', 'aaaa2222-0000-0000-0000-000000000002', 'succeeded', 0, null);
  if (v->>'applied')::boolean is not true then raise exception 'SETUP FAILED: charge 2 (%)', v; end if;
  v := payments_private.apply_payment_webhook('mock', 'rf-charge-3', 'aaaa3333-0000-0000-0000-000000000003', 'succeeded', 0, null);
  if (v->>'applied')::boolean is not true then raise exception 'SETUP FAILED: charge 3 (%)', v; end if;
  v := payments_private.apply_payment_webhook('mock', 'rf-charge-4', 'aaaa4444-0000-0000-0000-000000000004', 'succeeded', 0, null);
  if (v->>'applied')::boolean is not true then raise exception 'SETUP FAILED: charge 4 (%)', v; end if;
  v := payments_private.apply_payment_webhook('mock', 'rf-charge-5', 'aaaa5555-0000-0000-0000-000000000005', 'succeeded', 0, null);
  if (v->>'applied')::boolean is not true then raise exception 'SETUP FAILED: charge 5 (%)', v; end if;
end $$;

-- Recognise the two sales (Phase 2b): gross 1075 = revenue 1000 + output VAT 75.
do $$
declare v jsonb;
begin
  v := payments_private.post_sale_revenue('aaaa1111-0000-0000-0000-000000000001', 1075, 75);
  if (v->>'posted')::boolean is not true then raise exception 'SETUP FAILED: sale 1 (%)', v; end if;
  v := payments_private.post_sale_revenue('aaaa2222-0000-0000-0000-000000000002', 1075, 75);
  if (v->>'posted')::boolean is not true then raise exception 'SETUP FAILED: sale 2 (%)', v; end if;
end $$;

-- ============ (1) FULL refund cycle: initiate → processed → refunded + full reversals ============
do $$
declare v jsonb; v_refund uuid; v_settle uuid; v_reversal uuid;
        d_clear bigint; c_cash bigint; d_rev bigint; d_vat bigint; c_clear bigint; v_status text;
begin
  v := payments_private.initiate_payment_refund(
    'aaaa1111-0000-0000-0000-000000000001', '99990001-0000-0000-0000-000000000001', null, 'full refund test', null);
  if (v->>'initiated')::boolean is not true then raise exception 'PROOF 1 FAILED: initiate (%)', v; end if;
  if (v->>'amount_minor')::bigint <> 1075 then raise exception 'PROOF 1 FAILED: default amount % (expected full 1075)', v->>'amount_minor'; end if;
  v_refund := (v->>'refund_id')::uuid;

  select status into v_status from public.payment_intents where id = 'aaaa1111-0000-0000-0000-000000000001';
  if v_status <> 'refund_processing' then raise exception 'PROOF 1 FAILED: intent % (expected refund_processing)', v_status; end if;

  -- Idempotent replay of the same (intent, refund_key) returns the same attempt.
  v := payments_private.initiate_payment_refund(
    'aaaa1111-0000-0000-0000-000000000001', '99990001-0000-0000-0000-000000000001', null, null, null);
  if v->>'reason' <> 'duplicate' or (v->>'refund_id')::uuid <> v_refund then
    raise exception 'PROOF 1 FAILED: replayed initiate not idempotent (%)', v;
  end if;

  -- A second, DIFFERENT refund while one is in flight is refused (one in flight).
  v := payments_private.initiate_payment_refund(
    'aaaa1111-0000-0000-0000-000000000001', '99990001-0000-0000-0000-000000000002', 100, null, null);
  if v->>'reason' <> 'refund_in_flight' then raise exception 'PROOF 1 FAILED: second in-flight initiate (%)', v; end if;

  -- Provider truth arrives.
  v := payments_private.apply_refund_webhook('mock', 'aaaa1111-0000-0000-0000-000000000001', 'processed', 1075, 'RCPT-1');
  if (v->>'applied')::boolean is not true then raise exception 'PROOF 1 FAILED: apply (%)', v; end if;
  if v->>'intent_status' <> 'refunded' then raise exception 'PROOF 1 FAILED: intent status % (expected refunded)', v->>'intent_status'; end if;
  v_settle := (v->>'settlement_posting_id')::uuid;
  v_reversal := (v->>'revenue_reversal_posting_id')::uuid;
  if (v->>'vat_reversed_minor')::bigint <> 75 then raise exception 'PROOF 1 FAILED: vat reversed % (expected 75)', v->>'vat_reversed_minor'; end if;
  if (v->>'revenue_reversed_minor')::bigint <> 1000 then raise exception 'PROOF 1 FAILED: revenue reversed % (expected 1000)', v->>'revenue_reversed_minor'; end if;

  select coalesce(sum(debit_minor) filter (where account_code='payments_clearing'),0),
         coalesce(sum(credit_minor) filter (where account_code='cash_settlement'),0)
    into d_clear, c_cash from public.journal_lines where entry_id = v_settle;
  if d_clear <> 1075 or c_cash <> 1075 then raise exception 'PROOF 1 FAILED: settlement reversal (clear % cash %)', d_clear, c_cash; end if;

  select coalesce(sum(debit_minor) filter (where account_code='platform_revenue'),0),
         coalesce(sum(debit_minor) filter (where account_code='vat_output_payable'),0),
         coalesce(sum(credit_minor) filter (where account_code='payments_clearing'),0)
    into d_rev, d_vat, c_clear from public.journal_lines where entry_id = v_reversal;
  if d_rev <> 1000 or d_vat <> 75 or c_clear <> 1075 then
    raise exception 'PROOF 1 FAILED: revenue reversal (rev % vat % clearing %)', d_rev, d_vat, c_clear;
  end if;

  raise notice 'PROOF 1 OK: full cycle — initiate (claim+row, idempotent, one-in-flight) → processed → refunded; settlement 1075 reversed; revenue 1000 + VAT 75 reversed';
end $$;

-- ============ (2) PARTIAL refunds: proportional VAT, exact remainder, honest statuses ============
do $$
declare v jsonb; v_status text; v_vat1 bigint; v_vat2 bigint; v_rev1 bigint; v_rev2 bigint;
begin
  -- Partial 1: 430 of 1075 (40%) → VAT reversed must be round(75·430/1075) = 30.
  v := payments_private.initiate_payment_refund(
    'aaaa2222-0000-0000-0000-000000000002', '99990002-0000-0000-0000-000000000001', 430, 'partial 40%', null);
  if (v->>'initiated')::boolean is not true then raise exception 'PROOF 2 FAILED: initiate p1 (%)', v; end if;
  v := payments_private.apply_refund_webhook('mock', 'aaaa2222-0000-0000-0000-000000000002', 'processed', 430, null);
  if (v->>'applied')::boolean is not true then raise exception 'PROOF 2 FAILED: apply p1 (%)', v; end if;
  v_vat1 := (v->>'vat_reversed_minor')::bigint;
  v_rev1 := (v->>'revenue_reversed_minor')::bigint;
  if v_vat1 <> 30 then raise exception 'PROOF 2 FAILED: partial VAT reversal % (expected 30 = round(75·430/1075))', v_vat1; end if;
  if v_rev1 <> 400 then raise exception 'PROOF 2 FAILED: partial revenue reversal % (expected 400)', v_rev1; end if;
  -- A PARTIAL refund leaves the charge standing: the intent returns to `succeeded`.
  if v->>'intent_status' <> 'succeeded' then raise exception 'PROOF 2 FAILED: intent % after partial (expected succeeded)', v->>'intent_status'; end if;

  -- Partial 2 (the remainder, 645) → VAT reversed must be the exact remainder 45.
  v := payments_private.initiate_payment_refund(
    'aaaa2222-0000-0000-0000-000000000002', '99990002-0000-0000-0000-000000000002', 645, 'remainder', null);
  if (v->>'initiated')::boolean is not true then raise exception 'PROOF 2 FAILED: initiate p2 (%)', v; end if;
  v := payments_private.apply_refund_webhook('mock', 'aaaa2222-0000-0000-0000-000000000002', 'processed', 645, null);
  if (v->>'applied')::boolean is not true then raise exception 'PROOF 2 FAILED: apply p2 (%)', v; end if;
  v_vat2 := (v->>'vat_reversed_minor')::bigint;
  v_rev2 := (v->>'revenue_reversed_minor')::bigint;
  if v_vat2 <> 45 then raise exception 'PROOF 2 FAILED: final VAT remainder % (expected 45 = 75 − 30)', v_vat2; end if;
  if v_rev2 <> 600 then raise exception 'PROOF 2 FAILED: final revenue remainder % (expected 600)', v_rev2; end if;
  if v_vat1 + v_vat2 <> 75 or v_rev1 + v_rev2 <> 1000 then
    raise exception 'PROOF 2 FAILED: cumulative reversal vat %+% rev %+% (expected exactly 75 / 1000)', v_vat1, v_vat2, v_rev1, v_rev2;
  end if;
  -- Cumulative == captured → terminal `refunded`.
  if v->>'intent_status' <> 'refunded' then raise exception 'PROOF 2 FAILED: intent % after final partial (expected refunded)', v->>'intent_status'; end if;
  select status into v_status from public.payment_intents where id = 'aaaa2222-0000-0000-0000-000000000002';
  if v_status <> 'refunded' then raise exception 'PROOF 2 FAILED: persisted intent status %', v_status; end if;

  raise notice 'PROOF 2 OK: 40%% partial reversed VAT 30 of 75 (revenue 400 of 1000), final partial reversed the exact remainder (45/600); statuses honest (succeeded → refunded only at cumulative == captured)';
end $$;

-- ============ (3) OVER-REFUND REJECTED BY THE DB ITSELF ============
do $$
declare v jsonb;
begin
  -- RPC layer: more than the captured amount is refused with the remaining figure.
  v := payments_private.initiate_payment_refund(
    'aaaa3333-0000-0000-0000-000000000003', '99990003-0000-0000-0000-000000000001', 6000, null, null);
  if v->>'reason' <> 'exceeds_refundable' then raise exception 'PROOF 3 FAILED: RPC over-refund (%)', v; end if;

  -- DB layer: a DIRECT INSERT (every app-layer check bypassed; superuser, grants moot)
  -- past the captured amount is rejected by the trigger.
  begin
    insert into public.payment_refunds (intent_id, refund_key, amount_minor, status)
    values ('aaaa3333-0000-0000-0000-000000000003', gen_random_uuid(), 5001, 'succeeded');
    raise exception 'PROOF 3 FAILED: direct over-refund INSERT was accepted';
  exception when check_violation then null;
  end;

  -- DB layer, in-flight counts: claim 4000 in flight, then a direct 1500 (4000+1500 > 5000) must raise.
  v := payments_private.initiate_payment_refund(
    'aaaa3333-0000-0000-0000-000000000003', '99990003-0000-0000-0000-000000000002', 4000, null, null);
  if (v->>'initiated')::boolean is not true then raise exception 'PROOF 3 FAILED: initiate 4000 (%)', v; end if;
  begin
    insert into public.payment_refunds (intent_id, refund_key, amount_minor, status)
    values ('aaaa3333-0000-0000-0000-000000000003', gen_random_uuid(), 1500, 'succeeded');
    raise exception 'PROOF 3 FAILED: in-flight + 1500 over-refund INSERT was accepted';
  exception when check_violation then null;
  end;

  -- An intent that never posted a charge settlement cannot be refunded (legacy guard).
  v := payments_private.initiate_payment_refund(
    'aaaa6666-0000-0000-0000-000000000006', '99990006-0000-0000-0000-000000000001', null, null, null);
  if v->>'reason' <> 'no_charge_settlement' then raise exception 'PROOF 3 FAILED: legacy no-settlement guard (%)', v; end if;

  raise notice 'PROOF 3 OK: over-refund rejected at the RPC AND by the DB trigger (direct INSERT, in-flight counted); unsettled legacy intents refused';
end $$;

-- ============ (5) refund.failed reverts (proof 3 left a 4000 refund in flight) ============
do $$
declare v jsonb; v_status text; n int;
begin
  v := payments_private.apply_refund_webhook('mock', 'aaaa3333-0000-0000-0000-000000000003', 'failed', 4000, null);
  if (v->>'applied')::boolean is not true then raise exception 'PROOF 5 FAILED: apply failed (%)', v; end if;
  if v->>'intent_status' <> 'succeeded' then raise exception 'PROOF 5 FAILED: intent % (expected succeeded)', v->>'intent_status'; end if;
  select status into v_status from public.payment_intents where id = 'aaaa3333-0000-0000-0000-000000000003';
  if v_status <> 'succeeded' then raise exception 'PROOF 5 FAILED: persisted status %', v_status; end if;

  -- NO settlement reversal was posted for the failed refund.
  select count(*) into n
    from public.journal_entries e
   where e.source = 'payment_refund'
     and e.source_event_id in (select r.id::text from public.payment_refunds r
                                where r.intent_id = 'aaaa3333-0000-0000-0000-000000000003');
  if n <> 0 then raise exception 'PROOF 5 FAILED: % settlement entries for a failed refund (expected 0)', n; end if;

  -- A redelivered failure is a duplicate ack (no second effect).
  v := payments_private.apply_refund_webhook('mock', 'aaaa3333-0000-0000-0000-000000000003', 'failed', 4000, null);
  if v->>'reason' <> 'duplicate' then raise exception 'PROOF 5 FAILED: redelivered failure (%)', v; end if;

  -- The lane is free again: a fresh initiation succeeds.
  v := payments_private.initiate_payment_refund(
    'aaaa3333-0000-0000-0000-000000000003', '99990003-0000-0000-0000-000000000003', 1000, null, null);
  if (v->>'initiated')::boolean is not true then raise exception 'PROOF 5 FAILED: post-failure initiate (%)', v; end if;

  raise notice 'PROOF 5 OK: refund.failed → row failed, intent reverted to succeeded, no reversal posted, duplicate failure acked, lane released';
end $$;

-- ============ (4) DOUBLE WEBHOOK → ONE effect ============
do $$
declare v jsonb; n int;
begin
  -- Confirm the 1000 refund left in flight by proof 5.
  v := payments_private.apply_refund_webhook('mock', 'aaaa3333-0000-0000-0000-000000000003', 'processed', 1000, null);
  if (v->>'applied')::boolean is not true then raise exception 'PROOF 4 FAILED: first delivery (%)', v; end if;

  -- The EXACT redelivery applies nothing.
  v := payments_private.apply_refund_webhook('mock', 'aaaa3333-0000-0000-0000-000000000003', 'processed', 1000, null);
  if (v->>'applied')::boolean is not false or v->>'reason' <> 'duplicate' then
    raise exception 'PROOF 4 FAILED: redelivery applied (%)', v;
  end if;

  -- Exactly ONE settlement reversal exists for this intent's refunds.
  select count(*) into n
    from public.journal_entries e
   where e.source = 'payment_refund'
     and e.source_event_id in (select r.id::text from public.payment_refunds r
                                where r.intent_id = 'aaaa3333-0000-0000-0000-000000000003');
  if n <> 1 then raise exception 'PROOF 4 FAILED: % settlement reversals (expected exactly 1)', n; end if;

  raise notice 'PROOF 4 OK: double refund.processed delivery → one effect (one reversal entry, duplicate ack)';
end $$;

-- ============ (6) CREDIT NOTE — unfakeably bound, idempotent, VAT-true ============
do $$
declare v jsonb; v_refund uuid; v_posting uuid; v_charge_posting uuid; v_other_posting uuid;
        v_receipt jsonb; v_receipt_id uuid; v_no text;
begin
  select id, settlement_posting_id into v_refund, v_posting
    from public.payment_refunds
   where intent_id = 'aaaa1111-0000-0000-0000-000000000001' and status = 'succeeded';
  select id into v_charge_posting from public.journal_entries
   where source = 'payment_intent' and source_event_id = 'aaaa1111-0000-0000-0000-000000000001';

  -- The original receipt for the charge (issued through the V3-18 RPC).
  v_receipt := payments_private.record_customer_receipt(
    '000000bb-0000-0000-0000-0000000000bb', 'marketplace',
    'aaaa1111-0000-0000-0000-000000000001', v_charge_posting,
    'card', 'TXNREF_RF1', 1075, 0, 0, 1075, 'NGN', '[]'::jsonb, now(), null);
  if (v_receipt->>'created')::boolean is not true then raise exception 'PROOF 6 FAILED: receipt setup (%)', v_receipt; end if;
  v_receipt_id := (v_receipt->>'id')::uuid;

  -- REFUTER: a refund posting can still NEVER mint a receipt (#252 holds).
  begin
    v := payments_private.record_customer_receipt(
      '000000bb-0000-0000-0000-0000000000bb', 'marketplace',
      'aaaa1111-0000-0000-0000-000000000001', v_posting,
      'card', 'TXNREF_RF1', 1075, 0, 0, 1075, 'NGN', '[]'::jsonb, now(), null);
    raise exception 'PROOF 6 FAILED: a refund posting minted a RECEIPT';
  exception when check_violation then null;
  end;

  -- REFUTER: a CHARGE posting cannot mint a credit note.
  begin
    v := payments_private.record_customer_credit_note(
      '000000bb-0000-0000-0000-0000000000bb', 'marketplace',
      'aaaa1111-0000-0000-0000-000000000001', v_refund, v_charge_posting, v_receipt_id,
      'card', 'TXNREF_RF1', 1000, 75, 1075, 'NGN', '[]'::jsonb, now(), null);
    raise exception 'PROOF 6 FAILED: a charge posting minted a credit note';
  exception when check_violation then null;
  end;

  -- REFUTER: a FOREIGN refund's posting cannot mint this refund's credit note.
  select settlement_posting_id into v_other_posting
    from public.payment_refunds
   where intent_id = 'aaaa2222-0000-0000-0000-000000000002' and amount_minor = 430;
  begin
    v := payments_private.record_customer_credit_note(
      '000000bb-0000-0000-0000-0000000000bb', 'marketplace',
      'aaaa1111-0000-0000-0000-000000000001', v_refund, v_other_posting, v_receipt_id,
      'card', 'TXNREF_RF1', 1000, 75, 1075, 'NGN', '[]'::jsonb, now(), null);
    raise exception 'PROOF 6 FAILED: a foreign refund posting was accepted';
  exception when check_violation then null;
  end;

  -- REFUTER: a total that does not reconcile to the posting is rejected.
  begin
    v := payments_private.record_customer_credit_note(
      '000000bb-0000-0000-0000-0000000000bb', 'marketplace',
      'aaaa1111-0000-0000-0000-000000000001', v_refund, v_posting, v_receipt_id,
      'card', 'TXNREF_RF1', 925, 75, 1000, 'NGN', '[]'::jsonb, now(), null);
    raise exception 'PROOF 6 FAILED: a non-reconciling total was accepted';
  exception when check_violation then null;
  end;

  -- REFUTER: a VAT line that disagrees with the POSTED reversal is rejected.
  begin
    v := payments_private.record_customer_credit_note(
      '000000bb-0000-0000-0000-0000000000bb', 'marketplace',
      'aaaa1111-0000-0000-0000-000000000001', v_refund, v_posting, v_receipt_id,
      'card', 'TXNREF_RF1', 1075, 0, 1075, 'NGN', '[]'::jsonb, now(), null);
    raise exception 'PROOF 6 FAILED: a false VAT line (0 vs posted 75) was accepted';
  exception when check_violation then null;
  end;

  -- The TRUE credit note mints: HO-CRN-, bound to the refund posting + the receipt.
  v := payments_private.record_customer_credit_note(
    '000000bb-0000-0000-0000-0000000000bb', 'marketplace',
    'aaaa1111-0000-0000-0000-000000000001', v_refund, v_posting, v_receipt_id,
    'card', 'TXNREF_RF1', 1000, 75, 1075, 'NGN', '[]'::jsonb, now(), null);
  if (v->>'created')::boolean is not true then raise exception 'PROOF 6 FAILED: true credit note refused (%)', v; end if;
  v_no := v->>'credit_note_no';
  if v_no !~ '^HO-CRN-\d{4}-\d{6}$' then raise exception 'PROOF 6 FAILED: credit note number % (expected HO-CRN-YYYY-NNNNNN)', v_no; end if;

  -- Idempotent replay returns the SAME document.
  v := payments_private.record_customer_credit_note(
    '000000bb-0000-0000-0000-0000000000bb', 'marketplace',
    'aaaa1111-0000-0000-0000-000000000001', v_refund, v_posting, v_receipt_id,
    'card', 'TXNREF_RF1', 1000, 75, 1075, 'NGN', '[]'::jsonb, now(), null);
  if v->>'reason' <> 'duplicate' or v->>'credit_note_no' <> v_no then
    raise exception 'PROOF 6 FAILED: replay was not idempotent (%)', v;
  end if;

  raise notice 'PROOF 6 OK: credit note % unfakeably bound (charge/foreign/total/VAT refuters all rejected; refund posting cannot mint a receipt), idempotent', v_no;
end $$;

-- ============ (7) WALLET refund: hold, never-negative, reconciliation ============
do $$
declare v jsonb; v_bal bigint; r jsonb; v_refund uuid;
begin
  -- The Job B chain: a verified rail funding request whose payment_reference is the
  -- intent's idempotency_key, credited through the REAL atomic RPC.
  insert into public.customer_wallet_funding_requests (id, user_id, amount_kobo, currency, payment_reference, status)
  values ('eeee0001-0000-0000-0000-000000000001', '000000cc-0000-0000-0000-0000000000cc', 5000, 'NGN', 'rf-idem-4', 'verified')
  on conflict (id) do nothing;
  v := payments_private.credit_wallet_topup(
    '000000cc-0000-0000-0000-0000000000cc', 'eeee0001-0000-0000-0000-000000000001',
    'aaaa4444-0000-0000-0000-000000000004', 5000, 'NGN');
  if (v->>'credited')::boolean is not true then raise exception 'PROOF 7 FAILED: top-up credit (%)', v; end if;

  r := payments_private.wallet_ledger_reconciliation();
  if (r->>'reconciled')::boolean is not true then raise exception 'PROOF 7 FAILED: reconciliation after credit (%)', r; end if;

  -- Spend most of it; a full-reversal request must then be REJECTED, explicitly.
  update public.customer_wallets set balance_kobo = balance_kobo - 4000 where user_id = '000000cc-0000-0000-0000-0000000000cc';
  v := payments_private.initiate_payment_refund(
    'aaaa4444-0000-0000-0000-000000000004', '99990004-0000-0000-0000-000000000001', 5000, null, null);
  if v->>'reason' <> 'wallet_balance_insufficient' or (v->>'available_kobo')::bigint <> 1000 then
    raise exception 'PROOF 7 FAILED: insufficient-balance rejection (%)', v;
  end if;
  -- Restore the spend (it was a projection-only simulation, not a ledger event).
  update public.customer_wallets set balance_kobo = balance_kobo + 4000 where user_id = '000000cc-0000-0000-0000-0000000000cc';

  -- The DB CHECK is the unbypassable never-negative backstop.
  begin
    update public.customer_wallets set balance_kobo = -5 where user_id = '000000cc-0000-0000-0000-0000000000cc';
    raise exception 'PROOF 7 FAILED: negative wallet balance was accepted';
  exception when check_violation then null;
  end;

  -- Full reversal: HOLD debits the wallet to 0 at initiation; reconciliation holds.
  v := payments_private.initiate_payment_refund(
    'aaaa4444-0000-0000-0000-000000000004', '99990004-0000-0000-0000-000000000002', 5000, 'wallet refund', null);
  if (v->>'initiated')::boolean is not true or (v->>'wallet_hold')::boolean is not true then
    raise exception 'PROOF 7 FAILED: wallet initiate (%)', v;
  end if;
  v_refund := (v->>'refund_id')::uuid;
  select balance_kobo into v_bal from public.customer_wallets where user_id = '000000cc-0000-0000-0000-0000000000cc';
  if v_bal <> 0 then raise exception 'PROOF 7 FAILED: balance after hold % (expected 0)', v_bal; end if;
  r := payments_private.wallet_ledger_reconciliation();
  if (r->>'reconciled')::boolean is not true then raise exception 'PROOF 7 FAILED: reconciliation after hold (%)', r; end if;

  -- Provider confirms; the wallet stays 0, the books stay reconciled.
  v := payments_private.apply_refund_webhook('mock', 'aaaa4444-0000-0000-0000-000000000004', 'processed', 5000, null);
  if (v->>'applied')::boolean is not true or v->>'intent_status' <> 'refunded' then
    raise exception 'PROOF 7 FAILED: wallet refund apply (%)', v;
  end if;
  select balance_kobo into v_bal from public.customer_wallets where user_id = '000000cc-0000-0000-0000-0000000000cc';
  if v_bal <> 0 then raise exception 'PROOF 7 FAILED: balance after confirm % (expected 0)', v_bal; end if;
  r := payments_private.wallet_ledger_reconciliation();
  if (r->>'reconciled')::boolean is not true then raise exception 'PROOF 7 FAILED: reconciliation after confirm (%)', r; end if;

  raise notice 'PROOF 7 OK: wallet refund — insufficient balance rejected (available 1000 reported), DB CHECK refuses negatives, hold → 0 at initiation, reconciliation holds at every step';
end $$;

-- ============ (8) WALLET release on refund.failed: exactly one re-credit ============
do $$
declare v jsonb; v_bal bigint; n int; r jsonb;
begin
  insert into public.customer_wallet_funding_requests (id, user_id, amount_kobo, currency, payment_reference, status)
  values ('eeee0002-0000-0000-0000-000000000002', '000000cc-0000-0000-0000-0000000000cc', 3000, 'NGN', 'rf-idem-5', 'verified')
  on conflict (id) do nothing;
  v := payments_private.credit_wallet_topup(
    '000000cc-0000-0000-0000-0000000000cc', 'eeee0002-0000-0000-0000-000000000002',
    'aaaa5555-0000-0000-0000-000000000005', 3000, 'NGN');
  if (v->>'credited')::boolean is not true then raise exception 'PROOF 8 FAILED: top-up credit (%)', v; end if;

  v := payments_private.initiate_payment_refund(
    'aaaa5555-0000-0000-0000-000000000005', '99990005-0000-0000-0000-000000000001', 3000, null, null);
  if (v->>'initiated')::boolean is not true then raise exception 'PROOF 8 FAILED: initiate (%)', v; end if;
  select balance_kobo into v_bal from public.customer_wallets where user_id = '000000cc-0000-0000-0000-0000000000cc';
  if v_bal <> 0 then raise exception 'PROOF 8 FAILED: balance after hold % (expected 0)', v_bal; end if;

  -- The provider fails the refund: the hold is RELEASED, exactly once.
  v := payments_private.apply_refund_webhook('mock', 'aaaa5555-0000-0000-0000-000000000005', 'failed', 3000, null);
  if (v->>'applied')::boolean is not true then raise exception 'PROOF 8 FAILED: apply failed (%)', v; end if;
  select balance_kobo into v_bal from public.customer_wallets where user_id = '000000cc-0000-0000-0000-0000000000cc';
  if v_bal <> 3000 then raise exception 'PROOF 8 FAILED: balance after release % (expected 3000)', v_bal; end if;

  v := payments_private.apply_refund_webhook('mock', 'aaaa5555-0000-0000-0000-000000000005', 'failed', 3000, null);
  if v->>'reason' <> 'duplicate' then raise exception 'PROOF 8 FAILED: duplicate failure (%)', v; end if;
  select balance_kobo into v_bal from public.customer_wallets where user_id = '000000cc-0000-0000-0000-0000000000cc';
  if v_bal <> 3000 then raise exception 'PROOF 8 FAILED: balance after duplicate failure % (re-credited twice!)', v_bal; end if;
  select count(*) into n from public.customer_wallet_transactions
   where reference_type = 'wallet_refund_release'
     and reference_id in (select id::text from public.payment_refunds where intent_id = 'aaaa5555-0000-0000-0000-000000000005');
  if n <> 1 then raise exception 'PROOF 8 FAILED: % release log rows (expected exactly 1)', n; end if;

  r := payments_private.wallet_ledger_reconciliation();
  if (r->>'reconciled')::boolean is not true then raise exception 'PROOF 8 FAILED: reconciliation after release (%)', r; end if;

  raise notice 'PROOF 8 OK: refund.failed released the wallet hold exactly once (3000 back, one log row, reconciled)';
end $$;

-- ============ (9) legacy refund paths fail LOUDLY ============
do $$
declare v jsonb;
begin
  begin
    v := payments_private.apply_payment_webhook('mock', 'legacy-refund-evt', 'aaaa3333-0000-0000-0000-000000000003', 'refunded', 0, null);
    raise exception 'PROOF 9 FAILED: apply_payment_webhook accepted refunded';
  exception when check_violation then null;
  end;
  begin
    v := payments_private.post_charge_settlement('aaaa3333-0000-0000-0000-000000000003', 'refunded', 0, null);
    raise exception 'PROOF 9 FAILED: post_charge_settlement accepted refunded';
  exception when check_violation then null;
  end;
  raise notice 'PROOF 9 OK: legacy refunded paths raise (no silent books divergence possible)';
end $$;

-- ============ (10) the ledger is STILL globally balanced after everything ============
do $$
declare r jsonb;
begin
  r := payments_private.ledger_reconciliation();
  if (r->>'balanced')::boolean is not true or (r->>'delta_minor')::bigint <> 0 then
    raise exception 'PROOF 10 FAILED: ledger not globally balanced (%)', r;
  end if;
  raise notice 'PROOF 10 OK: ledger globally balanced after the full refund lifecycle — debits=% credits=% delta=0',
    r->>'total_debit_minor', r->>'total_credit_minor';
end $$;

select 'REFUND INVARIANTS (1)full (2)partial-VAT (3)over-refund-DB (4)dedup (5)failed-revert (6)credit-note-binding (7)wallet-hold (8)wallet-release (9)legacy-loud (10)balance === ALL PROVEN' as result;
