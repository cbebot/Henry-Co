-- V3-17 — double-entry ledger invariant proofs (self-asserting).
--
-- Run AFTER the full chain: _bootstrap_supabase_env.sql → payment_intents.sql →
-- payments_private_isolation.sql → double_entry_ledger.sql. Proves, on a fresh DB:
--   (a) a balanced entry posts; an unbalanced entry is REJECTED — both via the RPC
--       AND via a raw INSERT that bypasses the RPC (the deferred constraint trigger);
--   (b) posted rows are IMMUTABLE (UPDATE/DELETE rejected);
--   (c) posting is IDEMPOTENT (a replayed source event posts exactly one entry);
--   (d) the ledger reconciles GLOBALLY (total debits === total credits, delta 0).
-- Any violation RAISEs → psql (ON_ERROR_STOP=1) exits non-zero → CI goes RED.
--
-- Uses the chart-of-accounts + post_ledger_entry only (no wallet tables), so it runs
-- in the same vanilla-PG CI as the grant invariant. The wallet-projection proof
-- (needs the customer_wallet* tables) runs in the local docker harness.

\set ON_ERROR_STOP on

-- ============ (a1) a balanced entry posts ============
do $$
declare v jsonb;
begin
  v := payments_private.post_ledger_entry(
    'proof_balanced', 'evt-1', 'balanced', 'NGN',
    jsonb_build_array(
      jsonb_build_object('account_code','cash_settlement','debit_minor',5000,'credit_minor',0),
      jsonb_build_object('account_code','payments_clearing','debit_minor',0,'credit_minor',5000)
    ));
  if (v->>'posted')::boolean is not true then
    raise exception 'PROOF a1 FAILED: balanced entry was not posted (%)', v;
  end if;
  raise notice 'PROOF a1 OK: balanced entry posted (entry %)', v->>'entry_id';
end $$;

-- ============ (a2) post_ledger_entry REJECTS an unbalanced entry ============
do $$
declare v jsonb;
begin
  begin
    v := payments_private.post_ledger_entry(
      'proof_unbalanced', 'evt-2', 'unbalanced', 'NGN',
      jsonb_build_array(
        jsonb_build_object('account_code','cash_settlement','debit_minor',5000,'credit_minor',0),
        jsonb_build_object('account_code','payments_clearing','debit_minor',0,'credit_minor',4999)
      ));
    raise exception 'PROOF a2 FAILED: RPC accepted an unbalanced entry (%)', v;
  exception
    when check_violation then
      raise notice 'PROOF a2 OK: RPC rejected unbalanced entry';
  end;
  -- and it left NO partial entry behind
  if exists (select 1 from public.journal_entries where source = 'proof_unbalanced') then
    raise exception 'PROOF a2 FAILED: an unbalanced entry head was persisted';
  end if;
end $$;

-- ============ (a3) the DEFERRED TRIGGER rejects a RAW unbalanced insert (bypassing the RPC) ============
do $$
declare v_entry uuid;
begin
  begin
    insert into public.journal_entries (source, source_event_id, description, currency)
      values ('proof_raw', 'evt-3', 'raw bypass', 'NGN') returning id into v_entry;
    insert into public.journal_lines (entry_id, account_code, debit_minor, credit_minor)
      values (v_entry, 'cash_settlement', 5000, 0);
    insert into public.journal_lines (entry_id, account_code, debit_minor, credit_minor)
      values (v_entry, 'payments_clearing', 0, 4000); -- DELIBERATELY unbalanced
    -- Force the deferred constraint to check NOW (it otherwise fires at COMMIT).
    set constraints all immediate;
    raise exception 'PROOF a3 FAILED: raw unbalanced insert was accepted';
  exception
    when check_violation then
      raise notice 'PROOF a3 OK: deferred trigger rejected raw unbalanced insert';
  end;
end $$;

-- ============ (a4) the deferred trigger rejects a single-line entry ============
do $$
declare v_entry uuid;
begin
  begin
    insert into public.journal_entries (source, source_event_id, description, currency)
      values ('proof_oneline', 'evt-4', 'one line', 'NGN') returning id into v_entry;
    insert into public.journal_lines (entry_id, account_code, debit_minor, credit_minor)
      values (v_entry, 'cash_settlement', 5000, 0);
    set constraints all immediate;
    raise exception 'PROOF a4 FAILED: single-line entry was accepted';
  exception
    when check_violation then
      raise notice 'PROOF a4 OK: deferred trigger rejected single-line entry';
  end;
end $$;

-- ============ (b) immutability: UPDATE and DELETE of a posted row are rejected ============
do $$
declare v_entry uuid; v_line uuid;
begin
  select id into v_entry from public.journal_entries where source = 'proof_balanced' limit 1;
  select id into v_line from public.journal_lines where entry_id = v_entry limit 1;

  begin
    update public.journal_entries set description = 'tamper' where id = v_entry;
    raise exception 'PROOF b FAILED: UPDATE of a posted entry was accepted';
  exception when check_violation then raise notice 'PROOF b OK: entry UPDATE rejected';
  end;

  begin
    update public.journal_lines set debit_minor = 999999 where id = v_line;
    raise exception 'PROOF b FAILED: UPDATE of a posted line was accepted';
  exception when check_violation then raise notice 'PROOF b OK: line UPDATE rejected';
  end;

  begin
    delete from public.journal_lines where id = v_line;
    raise exception 'PROOF b FAILED: DELETE of a posted line was accepted';
  exception when check_violation then raise notice 'PROOF b OK: line DELETE rejected';
  end;

  begin
    delete from public.journal_entries where id = v_entry;
    raise exception 'PROOF b FAILED: DELETE of a posted entry was accepted';
  exception when check_violation then raise notice 'PROOF b OK: entry DELETE rejected';
  end;
end $$;

-- ============ (c) idempotency: a replayed source event posts exactly one entry ============
do $$
declare v1 jsonb; v2 jsonb; n int;
begin
  v1 := payments_private.post_ledger_entry('proof_idem', 'evt-5', 'first', 'NGN',
    jsonb_build_array(
      jsonb_build_object('account_code','cash_settlement','debit_minor',7000,'credit_minor',0),
      jsonb_build_object('account_code','payments_clearing','debit_minor',0,'credit_minor',7000)));
  v2 := payments_private.post_ledger_entry('proof_idem', 'evt-5', 'replay', 'NGN',
    jsonb_build_array(
      jsonb_build_object('account_code','cash_settlement','debit_minor',7000,'credit_minor',0),
      jsonb_build_object('account_code','payments_clearing','debit_minor',0,'credit_minor',7000)));
  if (v1->>'posted')::boolean is not true then raise exception 'PROOF c FAILED: first post not posted'; end if;
  if (v2->>'posted')::boolean is not false or v2->>'reason' <> 'duplicate' then
    raise exception 'PROOF c FAILED: replay was not a no-op (%)', v2;
  end if;
  select count(*) into n from public.journal_entries where source = 'proof_idem' and source_event_id = 'evt-5';
  if n <> 1 then raise exception 'PROOF c FAILED: % entries for the replayed event (expected 1)', n; end if;
  -- and exactly 2 lines (not 4)
  select count(*) into n from public.journal_lines l join public.journal_entries e on e.id = l.entry_id
    where e.source = 'proof_idem' and e.source_event_id = 'evt-5';
  if n <> 2 then raise exception 'PROOF c FAILED: % lines for the replayed event (expected 2)', n; end if;
  raise notice 'PROOF c OK: replayed source event posted exactly once';
end $$;

-- ============ (c2) non-NGN currency is rejected (no approximate amount posted as real) ============
do $$
declare v jsonb;
begin
  begin
    v := payments_private.post_ledger_entry('proof_fx', 'evt-6', 'usd', 'USD',
      jsonb_build_array(
        jsonb_build_object('account_code','cash_settlement','debit_minor',100,'credit_minor',0),
        jsonb_build_object('account_code','payments_clearing','debit_minor',0,'credit_minor',100)));
    raise exception 'PROOF c2 FAILED: non-NGN currency accepted (%)', v;
  exception when check_violation then raise notice 'PROOF c2 OK: non-NGN currency rejected';
  end;
end $$;

-- ============ (d) global reconciliation: total debits === total credits, delta 0 ============
do $$
declare r jsonb;
begin
  r := payments_private.ledger_reconciliation();
  if (r->>'balanced')::boolean is not true or (r->>'delta_minor')::bigint <> 0 then
    raise exception 'PROOF d FAILED: ledger not globally balanced (%)', r;
  end if;
  raise notice 'PROOF d OK: ledger globally balanced — debits=% credits=% delta=0',
    r->>'total_debit_minor', r->>'total_credit_minor';
end $$;

select 'LEDGER INVARIANTS (a)balance (b)immutable (c)idempotent (d)reconcile === ALL PROVEN' as result;
