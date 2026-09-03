-- V3-VAT-01 — VAT settlement + reconciliation proofs (self-asserting).
--
-- Run AFTER the full chain: _bootstrap → payment_intents → payments_private_isolation →
-- double_entry_ledger → v3_18_payment_documents → v3_vat_01_settlement_vat. Proves, on a
-- fresh DB, with REAL provider-fee numbers (a real Paystack /transaction/verify shape:
-- amount 40333, fees 10283):
--   (a) a succeeded charge with a real fee posts the SPLIT — cash_net + processor_fees +
--       fee_vat_recoverable / CR clearing — balanced, and the DEBIT TOTAL stays the gross
--       (so the V3-18 receipt tie + wallet reconciliation are intact);
--   (a2) a provider-REPORTED fee VAT is used verbatim (real data preferred over the split);
--   (a3) an unknown fee (0) degrades to gross-to-cash — never a fabricated fee;
--   (a4) a fee >= gross is REJECTED;
--   (b) a VATable sale recognises revenue ex-VAT + output VAT (Phase 2b), balanced;
--   (c) vat_reconciliation returns the EXACT net position (output collected − recoverable);
--   (d) the ledger is still GLOBALLY balanced after everything;
--   (e) a refund posts its reversing entry (refund-ready), ledger still balanced;
--   refuters: fee >= gross, fee VAT > fee, output VAT >= gross, non-NGN, bad period.
-- Any violation RAISEs → psql (ON_ERROR_STOP=1) exits non-zero → CI goes RED.

\set ON_ERROR_STOP on

-- A user + a set of intents to settle (post_charge_settlement reads amount + currency).
-- email is required: on a prod-shaped DB the real signup trigger mirrors it into
-- customer_profiles.email (NOT NULL).
insert into auth.users (id, email) values ('000000aa-0000-0000-0000-0000000000aa', 'vat01-invariants@fixtures.henryco.test') on conflict do nothing;
insert into public.payment_intents (id, user_id, amount_minor, currency, country, method, status, idempotency_key) values
  ('11111111-1111-1111-1111-111111111111', '000000aa-0000-0000-0000-0000000000aa', 40333, 'NGN', 'NG', 'card', 'pending', 'vat-idem-1'),
  ('22222222-2222-2222-2222-222222222222', '000000aa-0000-0000-0000-0000000000aa', 40333, 'NGN', 'NG', 'card', 'pending', 'vat-idem-2'),
  ('33333333-3333-3333-3333-333333333333', '000000aa-0000-0000-0000-0000000000aa', 50000, 'NGN', 'NG', 'card', 'pending', 'vat-idem-3'),
  ('44444444-4444-4444-4444-444444444444', '000000aa-0000-0000-0000-0000000000aa',  1000, 'NGN', 'NG', 'card', 'pending', 'vat-idem-4'),
  ('55555555-5555-5555-5555-555555555555', '000000aa-0000-0000-0000-0000000000aa',  1000, 'USD', 'US', 'card', 'pending', 'vat-idem-5')
on conflict (id) do nothing;

-- ============ (a) real-fee settlement posts the split; debit total === gross ============
do $$
declare v jsonb; v_entry uuid; d_cash bigint; d_fee bigint; d_feevat bigint; c_clear bigint; d_total bigint;
begin
  -- gross 40333, fee 10283 (VAT-inclusive). 10283/1.075 = 9565.58 → 9566 ex, VAT 717. net = 30050.
  v := payments_private.post_charge_settlement('11111111-1111-1111-1111-111111111111', 'succeeded', 10283, null);
  if (v->>'posted')::boolean is not true then raise exception 'PROOF a FAILED: settlement not posted (%)', v; end if;
  v_entry := (v->>'entry_id')::uuid;

  select coalesce(sum(debit_minor) filter (where account_code='cash_settlement'),0),
         coalesce(sum(debit_minor) filter (where account_code='processor_fees'),0),
         coalesce(sum(debit_minor) filter (where account_code='fee_vat_recoverable'),0),
         coalesce(sum(credit_minor) filter (where account_code='payments_clearing'),0),
         coalesce(sum(debit_minor),0)
    into d_cash, d_fee, d_feevat, c_clear, d_total
    from public.journal_lines where entry_id = v_entry;

  if d_cash   <> 30050 then raise exception 'PROOF a FAILED: cash_net % (expected 30050)', d_cash; end if;
  if d_fee    <> 9566  then raise exception 'PROOF a FAILED: processor_fees % (expected 9566)', d_fee; end if;
  if d_feevat <> 717   then raise exception 'PROOF a FAILED: fee_vat_recoverable % (expected 717)', d_feevat; end if;
  if c_clear  <> 40333 then raise exception 'PROOF a FAILED: clearing credit % (expected 40333)', c_clear; end if;
  if d_total  <> 40333 then raise exception 'PROOF a FAILED: debit total % must equal gross 40333 (receipt tie!)', d_total; end if;
  raise notice 'PROOF a OK: real-fee split cash=30050 fee_ex=9566 fee_vat=717 / clearing=40333; debit total = gross';
end $$;

-- ============ (a2) a provider-reported fee VAT is used verbatim (real data preferred) ============
do $$
declare v jsonb; v_entry uuid; d_fee bigint; d_feevat bigint;
begin
  v := payments_private.post_charge_settlement('22222222-2222-2222-2222-222222222222', 'succeeded', 10283, 700);
  v_entry := (v->>'entry_id')::uuid;
  select coalesce(sum(debit_minor) filter (where account_code='processor_fees'),0),
         coalesce(sum(debit_minor) filter (where account_code='fee_vat_recoverable'),0)
    into d_fee, d_feevat from public.journal_lines where entry_id = v_entry;
  if d_feevat <> 700 then raise exception 'PROOF a2 FAILED: provider VAT not used verbatim (% , expected 700)', d_feevat; end if;
  if d_fee <> 9583 then raise exception 'PROOF a2 FAILED: fee_ex % (expected 10283-700=9583)', d_fee; end if;
  raise notice 'PROOF a2 OK: provider-reported fee VAT 700 used verbatim (fee_ex 9583)';
end $$;

-- ============ (a3) unknown fee (0) degrades to gross-to-cash (no fabricated fee) ============
do $$
declare v jsonb; v_entry uuid; n int; d_cash bigint;
begin
  v := payments_private.post_charge_settlement('33333333-3333-3333-3333-333333333333', 'succeeded', 0, null);
  v_entry := (v->>'entry_id')::uuid;
  select count(*), coalesce(sum(debit_minor) filter (where account_code='cash_settlement'),0)
    into n, d_cash from public.journal_lines where entry_id = v_entry;
  if n <> 2 then raise exception 'PROOF a3 FAILED: expected 2 lines (gross-to-cash), got %', n; end if;
  if d_cash <> 50000 then raise exception 'PROOF a3 FAILED: cash % (expected full gross 50000)', d_cash; end if;
  raise notice 'PROOF a3 OK: unknown fee → plain gross-to-cash (50000), no fabricated fee';
end $$;

-- ============ (a4) a fee >= gross is REJECTED ============
do $$
declare v jsonb;
begin
  begin
    v := payments_private.post_charge_settlement('44444444-4444-4444-4444-444444444444', 'succeeded', 1000, null);
    raise exception 'PROOF a4 FAILED: fee == gross was accepted (%)', v;
  exception when check_violation then raise notice 'PROOF a4 OK: fee >= gross rejected';
  end;
end $$;

-- ============ (b) VATable sale: revenue ex-VAT + output VAT (Phase 2b) ============
do $$
declare v jsonb; v_entry uuid; c_rev bigint; c_vat bigint; d_clear bigint;
begin
  -- gross 1075 incl 7.5% → revenue 1000 + output VAT 75.
  v := payments_private.post_sale_revenue('sale-evt-1', 1075, 75);
  if (v->>'posted')::boolean is not true then raise exception 'PROOF b FAILED: sale not posted (%)', v; end if;
  v_entry := (v->>'entry_id')::uuid;
  select coalesce(sum(credit_minor) filter (where account_code='platform_revenue'),0),
         coalesce(sum(credit_minor) filter (where account_code='vat_output_payable'),0),
         coalesce(sum(debit_minor) filter (where account_code='payments_clearing'),0)
    into c_rev, c_vat, d_clear from public.journal_lines where entry_id = v_entry;
  if c_rev <> 1000 then raise exception 'PROOF b FAILED: revenue % (expected 1000)', c_rev; end if;
  if c_vat <> 75   then raise exception 'PROOF b FAILED: output VAT % (expected 75)', c_vat; end if;
  if d_clear <> 1075 then raise exception 'PROOF b FAILED: clearing debit % (expected 1075)', d_clear; end if;
  raise notice 'PROOF b OK: sale revenue 1000 + output VAT 75 / clearing 1075';
end $$;

-- ============ (b2) output VAT >= gross is REJECTED ============
do $$
declare v jsonb;
begin
  begin
    v := payments_private.post_sale_revenue('sale-evt-bad', 1000, 1000);
    raise exception 'PROOF b2 FAILED: output VAT == gross accepted (%)', v;
  exception when check_violation then raise notice 'PROOF b2 OK: output VAT >= gross rejected';
  end;
end $$;

-- ============ (c) vat_reconciliation returns the EXACT net position ============
do $$
declare r jsonb; v_out bigint; v_in bigint; v_net bigint;
begin
  -- input recoverable = 717 (a) + 700 (a2) = 1417; output collected = 75 (b). net = 75 - 1417 = -1342.
  r := payments_private.vat_reconciliation('2000-01-01T00:00:00Z', '2999-01-01T00:00:00Z');
  v_out := (r->>'output_vat_collected_minor')::bigint;
  v_in  := (r->>'input_vat_recoverable_minor')::bigint;
  v_net := (r->>'net_vat_payable_minor')::bigint;
  if v_out <> 75   then raise exception 'PROOF c FAILED: output VAT collected % (expected 75)', v_out; end if;
  if v_in  <> 1417 then raise exception 'PROOF c FAILED: input VAT recoverable % (expected 1417)', v_in; end if;
  if v_net <> -1342 then raise exception 'PROOF c FAILED: net VAT payable % (expected -1342)', v_net; end if;
  raise notice 'PROOF c OK: vat_reconciliation output=75 input=1417 net=-1342 (exact, ledger-sourced)';
end $$;

-- ============ (c2) bad period is REJECTED ============
do $$
declare r jsonb;
begin
  begin
    r := payments_private.vat_reconciliation('2999-01-01T00:00:00Z', '2000-01-01T00:00:00Z');
    raise exception 'PROOF c2 FAILED: inverted period accepted (%)', r;
  exception when check_violation then raise notice 'PROOF c2 OK: inverted period rejected';
  end;
end $$;

-- ============ (a5) fee VAT > fee is REJECTED ============
do $$
declare v jsonb;
begin
  begin
    -- reuse intent 3 amount 50000, fee 150 but claim VAT 200 (> fee)
    v := payments_private.post_charge_settlement('44444444-4444-4444-4444-444444444444', 'succeeded', 500, 600);
    raise exception 'PROOF a5 FAILED: fee VAT > fee accepted (%)', v;
  exception when check_violation then raise notice 'PROOF a5 OK: fee VAT > fee rejected';
  end;
end $$;

-- ============ (a6) non-NGN intent does NOT post an approximate amount ============
do $$
declare v jsonb;
begin
  v := payments_private.post_charge_settlement('55555555-5555-5555-5555-555555555555', 'succeeded', 100, null);
  if (v->>'posted')::boolean is not false or v->>'reason' <> 'non_base_currency' then
    raise exception 'PROOF a6 FAILED: non-NGN intent should skip, got %', v;
  end if;
  raise notice 'PROOF a6 OK: non-NGN intent skipped (no approximate posting)';
end $$;

-- ============ (e) refund-ready: a refund posts its reversing entry ============
do $$
declare v jsonb; v_entry uuid; d_clear bigint; c_cash bigint;
begin
  v := payments_private.post_charge_settlement('11111111-1111-1111-1111-111111111111', 'refunded', 0, null);
  if (v->>'posted')::boolean is not true then raise exception 'PROOF e FAILED: refund not posted (%)', v; end if;
  v_entry := (v->>'entry_id')::uuid;
  select coalesce(sum(debit_minor) filter (where account_code='payments_clearing'),0),
         coalesce(sum(credit_minor) filter (where account_code='cash_settlement'),0)
    into d_clear, c_cash from public.journal_lines where entry_id = v_entry;
  if d_clear <> 40333 or c_cash <> 40333 then raise exception 'PROOF e FAILED: refund reversal not gross (clear % cash %)', d_clear, c_cash; end if;
  raise notice 'PROOF e OK: refund posts the reversing entry (V3-19 owns full fee/VAT refund)';
end $$;

-- ============ (f) the V3-18 receipt RECONCILES to the FEE-SPLIT settlement (tie holds) ============
-- The whole point of splitting the DEBIT (not the credit): the charge-settlement entry's
-- debit TOTAL is still the gross, so record_customer_receipt (which rejects a total that
-- doesn't equal the posting's debit total) still mints a receipt. The processor fee is
-- internal — the customer's receipt shows the gross they paid.
do $$
declare v_posting uuid; v jsonb;
begin
  select id into v_posting from public.journal_entries
   where source = 'payment_intent' and source_event_id = '11111111-1111-1111-1111-111111111111';
  v := payments_private.record_customer_receipt(
    '000000aa-0000-0000-0000-0000000000aa', 'marketplace',
    '11111111-1111-1111-1111-111111111111', v_posting,
    'card', 'TXNREF_A', 40333, 0, 0, 40333, 'NGN', '[]'::jsonb, now(), null);
  if (v->>'created')::boolean is not true then
    raise exception 'PROOF f FAILED: receipt did NOT reconcile to the fee-split settlement (%)', v;
  end if;
  raise notice 'PROOF f OK: V3-18 receipt reconciles to the FEE-SPLIT settlement (debit total = gross tie intact)';
end $$;

-- ============ (c3) idempotency: a replayed settlement posts no second entry ============
do $$
declare v jsonb;
begin
  v := payments_private.post_charge_settlement('11111111-1111-1111-1111-111111111111', 'succeeded', 10283, null);
  if (v->>'posted')::boolean is not false or v->>'reason' <> 'duplicate' then
    raise exception 'PROOF c3 FAILED: replayed settlement was not a no-op (%)', v;
  end if;
  raise notice 'PROOF c3 OK: replayed settlement is idempotent (no second entry)';
end $$;

-- ============ (d) the ledger is STILL globally balanced after everything ============
do $$
declare r jsonb;
begin
  r := payments_private.ledger_reconciliation();
  if (r->>'balanced')::boolean is not true or (r->>'delta_minor')::bigint <> 0 then
    raise exception 'PROOF d FAILED: ledger not globally balanced (%)', r;
  end if;
  raise notice 'PROOF d OK: ledger globally balanced after all VAT postings — debits=% credits=% delta=0',
    r->>'total_debit_minor', r->>'total_credit_minor';
end $$;

select 'VAT INVARIANTS (a)fee-split (b)output-VAT (c)reconciliation (d)balance (e)refund-ready (f)receipt-tie === ALL PROVEN' as result;
