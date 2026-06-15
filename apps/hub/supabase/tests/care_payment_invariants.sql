-- SEC-HARDEN-05 — Care guarded-payment behavioural invariants (self-asserting).
--
-- Run AFTER _bootstrap_supabase_env.sql + care_payment_min.sql +
-- 20260615120000_sec_harden_05_care_payment_guard.sql, on a freshly migrated DB.
-- Proves, end to end:
--   (a) the HISTORICAL BACKFILL reconciles — the fixture payments (the prod-12 in
--       miniature) each got a balanced double-entry; the care ledger is balanced and
--       care_cash ties to SUM(care_payments) and to the single-entry cash journal;
--   (b) the guarded RPC records a payment + posts a balanced entry + flips the request
--       to 'paid' + recalcs the booking — atomically;
--   (c) the RPC is IDEMPOTENT on idempotency_key (a replay is a no-op);
--   (d) a RAW care_payments INSERT by service_role is REJECTED (grant revoked);
--   (e) a RAW care_payment_requests.status='paid' flip is REJECTED (the guard trigger);
--   (f) an unbalanced care entry is rejected via the RPC AND via a raw deferred-trigger
--       bypass; (g) posted care-ledger rows are immutable;
--   (h) the care ledger still reconciles globally after all of the above.
--
-- Any violation RAISEs → psql (ON_ERROR_STOP=1) exits non-zero → CI RED.

\set ON_ERROR_STOP on

-- ============ (a) historical backfill reconciled (the "12 reconcile" proof) ============
do $$
declare r jsonb; n_entries int; n_payments int;
begin
  select count(*) into n_payments from public.care_payments;
  select count(*) into n_entries from public.care_journal_entries where source = 'care_payment';
  if n_entries <> n_payments then
    raise exception 'PROOF a FAILED: % journal entries for % payments (backfill incomplete)', n_entries, n_payments;
  end if;
  r := care_private.care_ledger_reconciliation();
  if (r->>'balanced')::boolean is not true or (r->>'delta')::numeric <> 0 then
    raise exception 'PROOF a FAILED: care ledger not balanced after backfill (%)', r;
  end if;
  if (r->>'cash_ties_to_payments')::boolean is not true then
    raise exception 'PROOF a FAILED: care_cash balance % does not tie to payments total % (%)',
      r->>'ledger_cash_balance', r->>'payments_total', r;
  end if;
  if (r->>'cash_ties_to_cash_journal')::boolean is not true then
    raise exception 'PROOF a FAILED: care_cash balance does not tie to the single-entry cash journal (%)', r;
  end if;
  raise notice 'PROOF a OK: backfill reconciled — % payments, balanced, cash=payments=cash-journal=%',
    n_payments, r->>'ledger_cash_balance';
end $$;

-- ============ (b) the guarded RPC: record + balanced post + request flip + recalc ============
do $$
declare v jsonb; v_paid numeric; v_status text; v_req_status text; n_lines int;
begin
  v := public.care_record_manual_payment(
    'sec-harden-05-test-key-1',                       -- idempotency key
    '00000000-0000-4000-8000-00000000ca01',           -- booking ca01 (fixture, 50000 quoted, 30000 paid)
    20000.00, 'POS', 'TEST-REF-1', 'guarded test payment',
    null,
    '00000000-0000-4000-8000-00000000cd01',           -- request cr01
    jsonb_build_object('verification_status','approved','reviewed_by_name','invariant')
  );
  if (v->>'recorded')::boolean is not true then
    raise exception 'PROOF b FAILED: RPC did not record the payment (%)', v;
  end if;
  -- the payment fact exists with the idempotency key + normalized method
  if not exists (select 1 from public.care_payments
                 where idempotency_key = 'sec-harden-05-test-key-1' and payment_method = 'pos' and amount = 20000.00) then
    raise exception 'PROOF b FAILED: payment row missing/not normalized';
  end if;
  -- balanced double-entry posted (>= 2 lines for this payment's entry)
  select count(*) into n_lines from public.care_journal_lines l
    join public.care_journal_entries e on e.id = l.entry_id
   where e.source = 'care_payment' and e.source_event_id = (v->>'payment_id');
  if n_lines <> 2 then raise exception 'PROOF b FAILED: % ledger lines for the new payment (expected 2)', n_lines; end if;
  -- the request was flipped to paid (through the guard) + payload merged
  select status into v_req_status from public.care_payment_requests where id = '00000000-0000-4000-8000-00000000cd01';
  if v_req_status <> 'paid' then raise exception 'PROOF b FAILED: request not flipped to paid (%)', v_req_status; end if;
  if not exists (select 1 from public.care_payment_requests
                 where id = '00000000-0000-4000-8000-00000000cd01' and payload->>'verification_status' = 'approved') then
    raise exception 'PROOF b FAILED: request payload patch not merged';
  end if;
  -- booking recalc'd by the trigger: 30000 + 20000 = 50000 → paid, balance 0
  select amount_paid, payment_status into v_paid, v_status from public.care_bookings
   where id = '00000000-0000-4000-8000-00000000ca01';
  if v_paid <> 50000.00 or v_status <> 'paid' then
    raise exception 'PROOF b FAILED: booking not recalc''d (amount_paid=% status=%)', v_paid, v_status;
  end if;
  raise notice 'PROOF b OK: guarded RPC recorded payment, posted balanced entry, flipped request, recalc''d booking';
end $$;

-- ============ (c) idempotent replay — same key is a no-op ============
do $$
declare v jsonb; n_before int; n_after int;
begin
  select count(*) into n_before from public.care_payments;
  v := public.care_record_manual_payment(
    'sec-harden-05-test-key-1', '00000000-0000-4000-8000-00000000ca01',
    20000.00, 'POS', 'TEST-REF-1', 'guarded test payment', null,
    '00000000-0000-4000-8000-00000000cd01', null);
  select count(*) into n_after from public.care_payments;
  if (v->>'recorded')::boolean is not false or v->>'reason' <> 'duplicate' then
    raise exception 'PROOF c FAILED: replay was not a duplicate no-op (%)', v;
  end if;
  if n_after <> n_before then
    raise exception 'PROOF c FAILED: replay created a second payment (% -> %)', n_before, n_after;
  end if;
  raise notice 'PROOF c OK: replay on the same idempotency_key is a no-op';
end $$;

-- ============ (d) a RAW care_payments INSERT by service_role is REJECTED ============
do $$
declare ok boolean := false;
begin
  set local role service_role;
  begin
    insert into public.care_payments (booking_id, amount, payment_method)
    values ('00000000-0000-4000-8000-00000000ca02', 999999.00, 'cash');
    ok := true;   -- should NOT reach here
  exception when others then ok := false;  -- permission denied / RLS → desired
  end;
  reset role;
  if ok then
    delete from public.care_payments where amount = 999999.00;
    raise exception 'PROOF d FAILED: service_role raw-INSERTED a care_payments row (the hole is LIVE)';
  end if;
  raise notice 'PROOF d OK: raw care_payments INSERT by service_role is rejected';
end $$;

-- ============ (e) a RAW status='paid' flip is REJECTED (the guard trigger) ============
do $$
declare ok boolean := false;
begin
  -- create an open request to attempt a raw completion against
  insert into public.care_payment_requests (id, booking_id, amount_due, status)
  values ('00000000-0000-4000-8000-00000000cd99', '00000000-0000-4000-8000-00000000ca02', 5000.00, 'sent')
  on conflict (id) do update set status = 'sent', paid_at = null;
  begin
    update public.care_payment_requests set status = 'paid', paid_at = now()
     where id = '00000000-0000-4000-8000-00000000cd99';
    ok := true;  -- should NOT reach here (guard trigger blocks it outside the RPC)
  exception when others then ok := false;  -- check_violation → desired
  end;
  if ok then
    raise exception 'PROOF e FAILED: a raw status=paid flip succeeded outside the guarded RPC (free-mark-paid LIVE)';
  end if;
  -- and a NON-paid status write still works (delivery state untouched)
  update public.care_payment_requests set status = 'failed' where id = '00000000-0000-4000-8000-00000000cd99';
  raise notice 'PROOF e OK: raw status=paid rejected; non-paid status writes still allowed';
end $$;

-- ============ (f) unbalanced care entry rejected (RPC + raw deferred-trigger bypass) ============
do $$
declare v jsonb; v_entry uuid;
begin
  begin
    v := care_private.post_ledger_entry('care_proof_unbalanced','evt-x','bad','NGN', null,
      jsonb_build_array(
        jsonb_build_object('account_code','care_cash','debit',500,'credit',0),
        jsonb_build_object('account_code','care_service_revenue','debit',0,'credit',499)));
    raise exception 'PROOF f FAILED: RPC accepted an unbalanced care entry (%)', v;
  exception when check_violation then raise notice 'PROOF f1 OK: RPC rejected unbalanced entry';
  end;
  if exists (select 1 from public.care_journal_entries where source = 'care_proof_unbalanced') then
    raise exception 'PROOF f FAILED: an unbalanced entry head was persisted';
  end if;
  -- raw bypass: the deferred constraint trigger must reject it at the immediate check
  begin
    insert into public.care_journal_entries (source, source_event_id, description, currency)
      values ('care_proof_raw','evt-y','raw','NGN') returning id into v_entry;
    insert into public.care_journal_lines (entry_id, account_code, debit, credit) values (v_entry,'care_cash',500,0);
    insert into public.care_journal_lines (entry_id, account_code, debit, credit) values (v_entry,'care_service_revenue',0,400);
    set constraints all immediate;
    raise exception 'PROOF f FAILED: raw unbalanced insert was accepted';
  exception when check_violation then raise notice 'PROOF f2 OK: deferred trigger rejected raw unbalanced insert';
  end;
end $$;

-- ============ (g) immutability: UPDATE/DELETE of a posted care-ledger row rejected ============
do $$
declare v_entry uuid; v_line uuid;
begin
  select id into v_entry from public.care_journal_entries where source = 'care_payment' limit 1;
  select id into v_line from public.care_journal_lines where entry_id = v_entry limit 1;
  begin
    update public.care_journal_lines set debit = 1 where id = v_line;
    raise exception 'PROOF g FAILED: UPDATE of a posted care line was accepted';
  exception when check_violation then raise notice 'PROOF g1 OK: care line UPDATE rejected';
  end;
  begin
    delete from public.care_journal_entries where id = v_entry;
    raise exception 'PROOF g FAILED: DELETE of a posted care entry was accepted';
  exception when check_violation then raise notice 'PROOF g2 OK: care entry DELETE rejected';
  end;
end $$;

-- ============ (h) global reconciliation still holds ============
do $$
declare r jsonb;
begin
  r := care_private.care_ledger_reconciliation();
  if (r->>'balanced')::boolean is not true or (r->>'delta')::numeric <> 0
     or (r->>'cash_ties_to_payments')::boolean is not true then
    raise exception 'PROOF h FAILED: care ledger not reconciled at the end (%)', r;
  end if;
  raise notice 'PROOF h OK: care ledger balanced & cash ties to payments — debit=% credit=%',
    r->>'total_debit', r->>'total_credit';
end $$;

select 'CARE PAYMENT INVARIANTS (a)backfill (b)guarded (c)idempotent (d)no-raw-insert (e)no-raw-paid (f)balance (g)immutable (h)reconcile === ALL PROVEN' as result;
