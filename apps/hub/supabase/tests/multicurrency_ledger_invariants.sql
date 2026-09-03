-- V3-MONEY-MC — multi-currency, in-currency ledger invariant proofs (self-asserting).
--
-- Runs AFTER 20260706120000_v3_money_mc_multicurrency_ledger.sql, on the SAME fresh DB as the
-- rest of the money chain (so NGN entries from the earlier proofs already exist). Proves the
-- WIDENED behavior the migration introduces:
--   (mc1) a valid ISO-4217 currency (USD) posts in-currency and balances;
--   (mc2) a MALFORMED currency is still rejected (no silent garbage currency);
--   (mc3) a USD charge SETTLES in USD (the old non_base_currency skip is gone);
--   (mc4) a foreign fee is a plain processor_fees expense — NO fabricated Nigerian VAT split;
--   (mc5) an NGN fee KEEPS its statutory 7.5% split (base-currency behavior unchanged);
--   (mc6) ledger_reconciliation returns a PER-CURRENCY view — each currency balances to zero
--         INDEPENDENTLY, and the global flag still holds — never a cross-currency sum.
-- Any violation RAISEs → psql (ON_ERROR_STOP=1) exits non-zero → CI goes RED.

\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('000000cc-0000-0000-0000-0000000000cc', 'mc-ledger-invariants@fixtures.henryco.test') on conflict do nothing;
insert into public.payment_intents (id, user_id, amount_minor, currency, country, method, status, idempotency_key) values
  ('c0000001-0000-0000-0000-000000000001', '000000cc-0000-0000-0000-0000000000cc', 4999,  'USD', 'US', 'card', 'pending', 'mc-idem-1'),
  ('c0000002-0000-0000-0000-000000000002', '000000cc-0000-0000-0000-0000000000cc', 10000, 'USD', 'US', 'card', 'pending', 'mc-idem-2'),
  ('c0000003-0000-0000-0000-000000000003', '000000cc-0000-0000-0000-0000000000cc', 40333, 'NGN', 'NG', 'card', 'pending', 'mc-idem-3')
on conflict (id) do nothing;

-- ============ (mc1) a valid ISO-4217 (USD) entry posts and is tagged with its currency ============
do $$
declare v jsonb; v_cur text;
begin
  v := payments_private.post_ledger_entry(
    'proof_mc_usd', 'mc-evt-1', 'usd raw', 'USD',
    jsonb_build_array(
      jsonb_build_object('account_code','cash_settlement','debit_minor',100,'credit_minor',0),
      jsonb_build_object('account_code','payments_clearing','debit_minor',0,'credit_minor',100)));
  if (v->>'posted')::boolean is not true then raise exception 'PROOF mc1 FAILED: USD entry not posted (%)', v; end if;
  select currency into v_cur from public.journal_entries where id = (v->>'entry_id')::uuid;
  if v_cur <> 'USD' then raise exception 'PROOF mc1 FAILED: entry tagged % (expected USD)', v_cur; end if;
  raise notice 'PROOF mc1 OK: USD entry posted, tagged USD';
end $$;

-- ============ (mc2) a MALFORMED currency is rejected (lowercase / wrong length) ============
do $$
declare bad text; v jsonb;
begin
  foreach bad in array array['usd','US','USDD','U1D','']
  loop
    begin
      v := payments_private.post_ledger_entry(
        'proof_mc_bad_'||coalesce(nullif(bad,''),'empty'), 'mc-evt-bad-'||coalesce(nullif(bad,''),'empty'), 'bad', bad,
        jsonb_build_array(
          jsonb_build_object('account_code','cash_settlement','debit_minor',100,'credit_minor',0),
          jsonb_build_object('account_code','payments_clearing','debit_minor',0,'credit_minor',100)));
      raise exception 'PROOF mc2 FAILED: malformed currency % was accepted', bad;
    exception when check_violation then
      null; -- expected
    end;
  end loop;
  raise notice 'PROOF mc2 OK: malformed currencies rejected';
end $$;

-- ============ (mc3) a USD charge SETTLES in USD (no non_base_currency skip) ============
do $$
declare v jsonb; v_entry uuid; v_cur text; d_cash bigint; c_clear bigint;
begin
  v := payments_private.post_charge_settlement('c0000001-0000-0000-0000-000000000001', 'succeeded', 0, null);
  if (v->>'posted')::boolean is not true then raise exception 'PROOF mc3 FAILED: USD settlement not posted (%)', v; end if;
  v_entry := (v->>'entry_id')::uuid;
  select currency into v_cur from public.journal_entries where id = v_entry;
  select coalesce(sum(debit_minor) filter (where account_code='cash_settlement'),0),
         coalesce(sum(credit_minor) filter (where account_code='payments_clearing'),0)
    into d_cash, c_clear from public.journal_lines where entry_id = v_entry;
  if v_cur <> 'USD' then raise exception 'PROOF mc3 FAILED: settlement tagged % (expected USD)', v_cur; end if;
  if d_cash <> 4999 or c_clear <> 4999 then
    raise exception 'PROOF mc3 FAILED: USD cash/clearing %/% (expected 4999/4999)', d_cash, c_clear;
  end if;
  raise notice 'PROOF mc3 OK: USD charge settled in USD (cash=clearing=4999)';
end $$;

-- ============ (mc4) a foreign fee is a plain expense — NO fabricated Nigerian VAT split ============
do $$
declare v jsonb; v_entry uuid; d_cash bigint; d_fee bigint; d_feevat bigint; c_clear bigint;
begin
  -- USD gross 10000, fee 300, no provider-reported VAT → whole fee is processor_fees, NO VAT line.
  v := payments_private.post_charge_settlement('c0000002-0000-0000-0000-000000000002', 'succeeded', 300, null);
  v_entry := (v->>'entry_id')::uuid;
  select coalesce(sum(debit_minor) filter (where account_code='cash_settlement'),0),
         coalesce(sum(debit_minor) filter (where account_code='processor_fees'),0),
         coalesce(sum(debit_minor) filter (where account_code='fee_vat_recoverable'),0),
         coalesce(sum(credit_minor) filter (where account_code='payments_clearing'),0)
    into d_cash, d_fee, d_feevat, c_clear from public.journal_lines where entry_id = v_entry;
  if d_cash   <> 9700  then raise exception 'PROOF mc4 FAILED: USD cash_net % (expected 9700)', d_cash; end if;
  if d_fee    <> 300   then raise exception 'PROOF mc4 FAILED: USD processor_fees % (expected 300, the WHOLE fee)', d_fee; end if;
  if d_feevat <> 0     then raise exception 'PROOF mc4 FAILED: USD fabricated a fee_vat_recoverable % (expected 0)', d_feevat; end if;
  if c_clear  <> 10000 then raise exception 'PROOF mc4 FAILED: USD clearing % (expected 10000)', c_clear; end if;
  raise notice 'PROOF mc4 OK: foreign fee = whole processor_fees, no fabricated NG VAT';
end $$;

-- ============ (mc5) an NGN fee KEEPS its statutory 7.5% split (base unchanged) ============
do $$
declare v jsonb; v_entry uuid; d_fee bigint; d_feevat bigint;
begin
  -- NGN gross 40333, fee 10283 (VAT-inclusive) → statutory split fee_ex 9566 / fee_vat 717.
  v := payments_private.post_charge_settlement('c0000003-0000-0000-0000-000000000003', 'succeeded', 10283, null);
  v_entry := (v->>'entry_id')::uuid;
  select coalesce(sum(debit_minor) filter (where account_code='processor_fees'),0),
         coalesce(sum(debit_minor) filter (where account_code='fee_vat_recoverable'),0)
    into d_fee, d_feevat from public.journal_lines where entry_id = v_entry;
  if d_fee <> 9566 or d_feevat <> 717 then
    raise exception 'PROOF mc5 FAILED: NGN split fee_ex=%/fee_vat=% (expected 9566/717)', d_fee, d_feevat;
  end if;
  raise notice 'PROOF mc5 OK: NGN fee keeps statutory split (fee_ex=9566, fee_vat=717)';
end $$;

-- ============ (mc6) reconciliation is PER-CURRENCY; each balances independently ============
do $$
declare r jsonb; usd jsonb; ngn jsonb; n int;
begin
  r := payments_private.ledger_reconciliation();
  -- global still balanced (every entry balances, so global debit=credit holds across currencies)
  if (r->>'balanced')::boolean is not true or (r->>'delta_minor')::bigint <> 0 then
    raise exception 'PROOF mc6 FAILED: global not balanced (%)', r->'delta_minor';
  end if;
  -- at least NGN + USD present
  select jsonb_array_length(r->'currencies') into n;
  if n < 2 then raise exception 'PROOF mc6 FAILED: expected >= 2 currencies, got %', n; end if;

  select elem into usd from jsonb_array_elements(r->'currencies') elem where elem->>'currency' = 'USD';
  select elem into ngn from jsonb_array_elements(r->'currencies') elem where elem->>'currency' = 'NGN';
  if usd is null then raise exception 'PROOF mc6 FAILED: no USD currency row'; end if;
  if ngn is null then raise exception 'PROOF mc6 FAILED: no NGN currency row'; end if;
  -- each currency balances to zero INDEPENDENTLY
  if (usd->>'balanced')::boolean is not true or (usd->>'delta_minor')::bigint <> 0 then
    raise exception 'PROOF mc6 FAILED: USD not independently balanced (%)', usd->'delta_minor';
  end if;
  if (ngn->>'balanced')::boolean is not true or (ngn->>'delta_minor')::bigint <> 0 then
    raise exception 'PROOF mc6 FAILED: NGN not independently balanced (%)', ngn->'delta_minor';
  end if;
  -- the USD column is USD-only: its total_debit is the sum of the USD entries above
  -- (100 + 4999 + 10000 = 15099), NOT contaminated by any NGN kobo.
  if (usd->>'total_debit_minor')::bigint <> 15099 then
    raise exception 'PROOF mc6 FAILED: USD total_debit % (expected 15099, USD-only)', usd->>'total_debit_minor';
  end if;
  raise notice 'PROOF mc6 OK: per-currency reconciliation — NGN and USD each balance independently';
end $$;

select 'MULTI-CURRENCY LEDGER INVARIANTS (mc1)post (mc2)reject-bad (mc3)settle-usd (mc4)no-NG-VAT (mc5)NGN-split (mc6)per-currency === ALL PROVEN' as result;
