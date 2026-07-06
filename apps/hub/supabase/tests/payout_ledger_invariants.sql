-- V3-MONEY-PAYOUT — withdrawal (payout) rail invariant proofs (self-asserting).
--
-- Runs AFTER payout_rail_min.sql (wallet tables) + 20260706130000_v3_money_payout_rail.sql, on the
-- same fresh money-chain DB (ledger + post_ledger_entry present). Proves:
--   (p1) reserve reclassifies + holds the balance (single-winner, no cash moves);
--   (p2) reserve is idempotent — a replay never double-decrements;
--   (p3) settle on the confirmed transfer clears the payable + moves cash; the company absorbs the fee;
--   (p4) settle is idempotent;
--   (p5) an over-balance request is refused (no overdraw), status untouched;
--   (p6) release reverses a reserve exactly and restores the balance (failed transfer);
--   (p7) the ledger stays globally balanced AND the wallet reconciles to the ledger liability.
-- Any violation RAISEs → psql (ON_ERROR_STOP=1) exits non-zero → CI goes RED.

\set ON_ERROR_STOP on

-- Seed: a wallet with 100000 kobo, and the matching ledger liability (as if topped up), so the
-- wallet<->ledger reconciliation is meaningful. Then four withdrawal requests to exercise.
insert into public.customer_wallets (user_id, balance_kobo) values
  ('000000dd-0000-0000-0000-0000000000dd', 100000) on conflict (user_id) do nothing;
do $$ begin
  perform payments_private.post_ledger_entry(
    'payout_seed_topup', 'seed-dd', 'seed wallet liability', 'NGN',
    jsonb_build_array(
      jsonb_build_object('account_code','cash_settlement','debit_minor',100000,'credit_minor',0),
      jsonb_build_object('account_code','customer_wallet_liability','debit_minor',0,'credit_minor',100000)));
end $$;
insert into public.customer_wallet_withdrawal_requests (id, user_id, amount_kobo, currency, status) values
  ('d0000001-0000-0000-0000-000000000001', '000000dd-0000-0000-0000-0000000000dd', 30000,  'NGN', 'pending_review'),
  ('d0000002-0000-0000-0000-000000000002', '000000dd-0000-0000-0000-0000000000dd', 40000,  'NGN', 'pending_review'),
  ('d0000003-0000-0000-0000-000000000003', '000000dd-0000-0000-0000-0000000000dd', 200000, 'NGN', 'pending_review'),
  ('d0000004-0000-0000-0000-000000000004', '000000dd-0000-0000-0000-0000000000dd', 20000,  'NGN', 'pending_review')
on conflict (id) do nothing;

-- ============ (p1) reserve reclassifies + holds the balance ============
do $$
declare v jsonb; v_bal bigint; v_status text; d_liab bigint; c_pay bigint;
begin
  v := payments_private.reserve_withdrawal('d0000001-0000-0000-0000-000000000001');
  if (v->>'reserved')::boolean is not true then raise exception 'PROOF p1 FAILED: not reserved (%)', v; end if;
  if (v->>'balance_after_kobo')::bigint <> 70000 then raise exception 'PROOF p1 FAILED: balance % (expected 70000)', v->>'balance_after_kobo'; end if;
  select balance_kobo into v_bal from public.customer_wallets where user_id='000000dd-0000-0000-0000-0000000000dd';
  select status into v_status from public.customer_wallet_withdrawal_requests where id='d0000001-0000-0000-0000-000000000001';
  if v_bal <> 70000 then raise exception 'PROOF p1 FAILED: wallet balance % (expected 70000)', v_bal; end if;
  if v_status <> 'processing' then raise exception 'PROOF p1 FAILED: status % (expected processing)', v_status; end if;
  -- the reserve entry: DR customer_wallet_liability / CR withdrawals_payable
  select coalesce(sum(debit_minor) filter (where account_code='customer_wallet_liability'),0),
         coalesce(sum(credit_minor) filter (where account_code='withdrawals_payable'),0)
    into d_liab, c_pay from public.journal_lines l
    join public.journal_entries e on e.id=l.entry_id
    where e.source='withdrawal_reserve' and e.source_event_id='d0000001-0000-0000-0000-000000000001';
  if d_liab <> 30000 or c_pay <> 30000 then raise exception 'PROOF p1 FAILED: reserve entry DR liab %/CR payable % (expected 30000/30000)', d_liab, c_pay; end if;
  raise notice 'PROOF p1 OK: reserved 30000, balance 70000, reclassified to withdrawals_payable';
end $$;

-- ============ (p2) reserve is idempotent — no double-decrement ============
do $$
declare v jsonb; v_bal bigint;
begin
  v := payments_private.reserve_withdrawal('d0000001-0000-0000-0000-000000000001');
  select balance_kobo into v_bal from public.customer_wallets where user_id='000000dd-0000-0000-0000-0000000000dd';
  if (v->>'reason') <> 'duplicate' then raise exception 'PROOF p2 FAILED: replay not a duplicate (%)', v; end if;
  if v_bal <> 70000 then raise exception 'PROOF p2 FAILED: balance moved on replay % (expected 70000)', v_bal; end if;
  raise notice 'PROOF p2 OK: reserve replay is a no-op (balance unchanged at 70000)';
end $$;

-- ============ (p3) settle on the confirmed transfer: cash leaves, fee absorbed ============
do $$
declare v jsonb; v_status text; d_pay bigint; d_fee bigint; c_cash bigint; v_bal bigint;
begin
  v := payments_private.post_withdrawal_settlement('d0000001-0000-0000-0000-000000000001', 'FLW-TRX-1', 0);
  if (v->>'posted')::boolean is not true then raise exception 'PROOF p3 FAILED: not posted (%)', v; end if;
  select status into v_status from public.customer_wallet_withdrawal_requests where id='d0000001-0000-0000-0000-000000000001';
  if v_status <> 'paid' then raise exception 'PROOF p3 FAILED: status % (expected paid)', v_status; end if;
  select coalesce(sum(debit_minor) filter (where account_code='withdrawals_payable'),0),
         coalesce(sum(debit_minor) filter (where account_code='processor_fees'),0),
         coalesce(sum(credit_minor) filter (where account_code='cash_settlement'),0)
    into d_pay, d_fee, c_cash from public.journal_lines l
    join public.journal_entries e on e.id=l.entry_id
    where e.source='withdrawal_settle' and e.source_event_id='d0000001-0000-0000-0000-000000000001';
  if d_pay <> 30000 or d_fee <> 0 or c_cash <> 30000 then
    raise exception 'PROOF p3 FAILED: settle DR payable %/DR fee %/CR cash % (expected 30000/0/30000)', d_pay, d_fee, c_cash;
  end if;
  -- balance stays reduced (money left to the user's bank), not touched again by settle
  select balance_kobo into v_bal from public.customer_wallets where user_id='000000dd-0000-0000-0000-0000000000dd';
  if v_bal <> 70000 then raise exception 'PROOF p3 FAILED: settle changed the wallet balance % (expected 70000)', v_bal; end if;
  raise notice 'PROOF p3 OK: settled — payable cleared, cash out 30000, balance unchanged';
end $$;

-- ============ (p4) settle is idempotent ============
do $$
declare v jsonb;
begin
  v := payments_private.post_withdrawal_settlement('d0000001-0000-0000-0000-000000000001', 'FLW-TRX-1', 0);
  if (v->>'posted')::boolean is not false or (v->>'reason') not in ('duplicate','already_paid') then
    raise exception 'PROOF p4 FAILED: settle replay not idempotent (%)', v;
  end if;
  raise notice 'PROOF p4 OK: settle replay is a no-op';
end $$;

-- ============ (p3b) a fee-bearing settle: company absorbs the fee (cash = amount + fee) ============
do $$
declare v jsonb; d_pay bigint; d_fee bigint; c_cash bigint;
begin
  perform payments_private.reserve_withdrawal('d0000002-0000-0000-0000-000000000002'); -- balance 70000 → 30000
  v := payments_private.post_withdrawal_settlement('d0000002-0000-0000-0000-000000000002', 'FLW-TRX-2', 500);
  if (v->>'posted')::boolean is not true then raise exception 'PROOF p3b FAILED: not posted (%)', v; end if;
  select coalesce(sum(debit_minor) filter (where account_code='withdrawals_payable'),0),
         coalesce(sum(debit_minor) filter (where account_code='processor_fees'),0),
         coalesce(sum(credit_minor) filter (where account_code='cash_settlement'),0)
    into d_pay, d_fee, c_cash from public.journal_lines l
    join public.journal_entries e on e.id=l.entry_id
    where e.source='withdrawal_settle' and e.source_event_id='d0000002-0000-0000-0000-000000000002';
  if d_pay <> 40000 or d_fee <> 500 or c_cash <> 40500 then
    raise exception 'PROOF p3b FAILED: fee settle DR payable %/DR fee %/CR cash % (expected 40000/500/40500)', d_pay, d_fee, c_cash;
  end if;
  raise notice 'PROOF p3b OK: fee absorbed — user gets 40000, cash out 40500, fee expense 500';
end $$;

-- ============ (p5) an over-balance request is refused (no overdraw) ============
do $$
declare v jsonb; v_status text; v_bal bigint;
begin
  -- balance is now 30000; request d3 is for 200000.
  v := payments_private.reserve_withdrawal('d0000003-0000-0000-0000-000000000003');
  if (v->>'reserved')::boolean is not false or (v->>'reason') <> 'insufficient_funds' then
    raise exception 'PROOF p5 FAILED: over-balance reserve not refused (%)', v;
  end if;
  select status into v_status from public.customer_wallet_withdrawal_requests where id='d0000003-0000-0000-0000-000000000003';
  select balance_kobo into v_bal from public.customer_wallets where user_id='000000dd-0000-0000-0000-0000000000dd';
  if v_status <> 'pending_review' then raise exception 'PROOF p5 FAILED: refused request status % (expected pending_review)', v_status; end if;
  if v_bal <> 30000 then raise exception 'PROOF p5 FAILED: balance moved on a refused reserve % (expected 30000)', v_bal; end if;
  raise notice 'PROOF p5 OK: over-balance withdrawal refused, nothing moved';
end $$;

-- ============ (p6) release reverses a reserve exactly and restores the balance ============
do $$
declare v jsonb; v_status text; v_bal bigint; d_pay bigint; c_liab bigint;
begin
  perform payments_private.reserve_withdrawal('d0000004-0000-0000-0000-000000000004'); -- balance 30000 → 10000
  v := payments_private.release_withdrawal('d0000004-0000-0000-0000-000000000004', 'provider_declined');
  if (v->>'released')::boolean is not true then raise exception 'PROOF p6 FAILED: not released (%)', v; end if;
  if (v->>'balance_after_kobo')::bigint <> 30000 then raise exception 'PROOF p6 FAILED: balance not restored % (expected 30000)', v->>'balance_after_kobo'; end if;
  select status into v_status from public.customer_wallet_withdrawal_requests where id='d0000004-0000-0000-0000-000000000004';
  select balance_kobo into v_bal from public.customer_wallets where user_id='000000dd-0000-0000-0000-0000000000dd';
  if v_status <> 'failed' then raise exception 'PROOF p6 FAILED: status % (expected failed)', v_status; end if;
  if v_bal <> 30000 then raise exception 'PROOF p6 FAILED: wallet balance % (expected 30000)', v_bal; end if;
  -- release entry reverses reserve: DR withdrawals_payable / CR customer_wallet_liability
  select coalesce(sum(debit_minor) filter (where account_code='withdrawals_payable'),0),
         coalesce(sum(credit_minor) filter (where account_code='customer_wallet_liability'),0)
    into d_pay, c_liab from public.journal_lines l
    join public.journal_entries e on e.id=l.entry_id
    where e.source='withdrawal_release' and e.source_event_id='d0000004-0000-0000-0000-000000000004';
  if d_pay <> 20000 or c_liab <> 20000 then raise exception 'PROOF p6 FAILED: release entry DR payable %/CR liab % (expected 20000/20000)', d_pay, c_liab; end if;
  raise notice 'PROOF p6 OK: failed withdrawal released — balance restored to 30000, reserve reversed';
end $$;

-- ============ (p7) global ledger balanced + wallet reconciles to the ledger liability ============
do $$
declare r jsonb; w jsonb;
begin
  r := payments_private.ledger_reconciliation();
  if (r->>'balanced')::boolean is not true or (r->>'delta_minor')::bigint <> 0 then
    raise exception 'PROOF p7 FAILED: ledger not globally balanced (%)', r->'delta_minor';
  end if;
  -- withdrawals_payable must net to ZERO (every reserve was either settled or released)
  if exists (
    select 1 from jsonb_array_elements(r->'accounts') a
    where a->>'code'='withdrawals_payable' and (a->>'balance_minor')::bigint <> 0
  ) then raise exception 'PROOF p7 FAILED: withdrawals_payable did not net to zero'; end if;
  w := payments_private.wallet_ledger_reconciliation();
  if (w->>'reconciled')::boolean is not true or (w->>'delta_kobo')::bigint <> 0 then
    raise exception 'PROOF p7 FAILED: wallet not reconciled to ledger liability (%)', w;
  end if;
  raise notice 'PROOF p7 OK: ledger balanced, withdrawals_payable nets to 0, wallet reconciled (balance=liability)';
end $$;

select 'PAYOUT LEDGER INVARIANTS (p1)reserve (p2)idempotent (p3/3b)settle+fee (p4)idempotent (p5)no-overdraw (p6)release (p7)reconcile === ALL PROVEN' as result;
