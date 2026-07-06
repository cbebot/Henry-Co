-- V3-MONEY-PAYOUT — the automatic withdrawal (payout) rail: ledger spine (W2).
--
-- Design: docs/v3/money/2026-07-06-automatic-withdrawal-payout-rail-design.md (owner-approved).
-- The wallet top-up in reverse, in three provider-confirmed, idempotent steps that keep the wallet
-- a projection of the ledger AND only move cash on a CONFIRMED transfer:
--   reserve → DR customer_wallet_liability / CR withdrawals_payable   (reclassify; balance -= amount; no cash)
--   settle  → DR withdrawals_payable (+ DR processor_fees fee) / CR cash_settlement (amount+fee)   (cash leaves)
--   release → DR withdrawals_payable / CR customer_wallet_liability   (reverse the reserve; balance += amount)
--
-- PRODUCTION MIRROR of the buildWithdrawal*Lines functions in packages/payment-router/src/ledger.ts
-- (proven in ledger.test.ts). Money-safety: single-winner reserve (FOR UPDATE + atomic
-- balance-sufficiency decrement) so a double-submit can never double-spend; every posting flows
-- through the guarded post_ledger_entry (balanced, idempotent); cash never moves until the transfer
-- confirms. ADDITIVE + INERT: nothing calls these until the request route + transfer webhook are
-- wired (W3, behind WALLET_AUTO_PAYOUT). NGN-only (wallets are NGN-only).
--
-- Apply to prod dry-run-first (the "I prove, you settle" discipline).

-- ============ 1. CHART: the in-flight withdrawal liability ============
insert into public.ledger_accounts (code, type, normal_balance, label) values
  ('withdrawals_payable', 'liability', 'credit', 'Withdrawals payable (requested, transfer in flight)')
on conflict (code) do nothing;

-- ============ 2. reserve_withdrawal — reclassify + hold the balance (single winner) ============
-- Claims a fresh withdrawal request, atomically decrements the wallet balance (the real
-- double-spend guard: the decrement only succeeds when the balance covers it), and posts the
-- reclassifying entry. Idempotent: a replay after commit returns the existing reservation; a
-- concurrent call blocks on the FOR UPDATE lock and then sees the non-reservable status.
create or replace function payments_private.reserve_withdrawal(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid;
  v_amount bigint;
  v_currency text;
  v_status text;
  v_balance bigint;
  v_post jsonb;
begin
  -- Idempotency: this request was already reserved (the reserve entry is the durable marker).
  if exists (select 1 from public.journal_entries
             where source = 'withdrawal_reserve' and source_event_id = p_request_id::text) then
    select balance_kobo into v_balance from public.customer_wallets w
      join public.customer_wallet_withdrawal_requests r on r.user_id = w.user_id
      where r.id = p_request_id;
    return jsonb_build_object('reserved', true, 'reason', 'duplicate', 'balance_after_kobo', coalesce(v_balance, 0));
  end if;

  select user_id, amount_kobo, currency, status
    into v_user, v_amount, v_currency, v_status
    from public.customer_wallet_withdrawal_requests where id = p_request_id for update;
  if v_user is null then
    raise exception 'reserve_withdrawal: request % not found', p_request_id using errcode = 'check_violation';
  end if;
  if v_status <> 'pending_review' then
    -- Already processing / paid / failed — not a fresh request. No-op (not an error).
    return jsonb_build_object('reserved', false, 'reason', 'not_reservable', 'status', v_status);
  end if;
  if upper(coalesce(v_currency, '')) <> 'NGN' then
    raise exception 'reserve_withdrawal: only NGN wallets can withdraw, got %', v_currency using errcode = 'check_violation';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'reserve_withdrawal: amount must be positive' using errcode = 'check_violation';
  end if;

  -- The atomic double-spend guard: decrement ONLY if the balance covers it. A concurrent charge
  -- or a duplicate submit that would overdraw simply does not match and leaves the balance alone.
  update public.customer_wallets
     set balance_kobo = balance_kobo - v_amount, updated_at = now()
   where user_id = v_user and balance_kobo >= v_amount
   returning balance_kobo into v_balance;
  if v_balance is null then
    -- Insufficient available balance. Status stays 'pending_review'; nothing moved.
    return jsonb_build_object('reserved', false, 'reason', 'insufficient_funds');
  end if;

  -- Reclassify the held amount out of the wallet liability into "withdrawals payable" (in flight).
  -- Assert the post actually happened: a no-op here (duplicate) after we have already moved the
  -- balance would mean a decrement with no matching liability line — fail loudly, never drift.
  v_post := payments_private.post_ledger_entry(
    'withdrawal_reserve', p_request_id::text, 'Withdrawal reserved', 'NGN',
    jsonb_build_array(
      jsonb_build_object('account_code', 'customer_wallet_liability', 'debit_minor', v_amount, 'credit_minor', 0),
      jsonb_build_object('account_code', 'withdrawals_payable',       'debit_minor', 0,        'credit_minor', v_amount)
    )
  );
  if (v_post->>'posted')::boolean is not true then
    raise exception 'reserve_withdrawal: reserve ledger post was a no-op for % (%)', p_request_id, v_post
      using errcode = 'check_violation';
  end if;

  update public.customer_wallet_withdrawal_requests set status = 'processing' where id = p_request_id;
  return jsonb_build_object('reserved', true, 'balance_after_kobo', v_balance, 'amount_kobo', v_amount);
end $$;
revoke all on function payments_private.reserve_withdrawal(uuid) from public, anon, authenticated;
grant execute on function payments_private.reserve_withdrawal(uuid) to service_role;

-- ============ 3. post_withdrawal_settlement — the CONFIRMED transfer: cash leaves ============
-- Called from the transfer webhook on transfer.completed. Clears the in-flight payable and posts
-- the cash out; the company absorbs the transfer fee (the user receives the full amount).
-- Idempotent on the request id; only a reserved ('processing') request can settle.
create or replace function payments_private.post_withdrawal_settlement(
  p_request_id uuid,
  p_transfer_ref text,
  p_fee_kobo bigint default 0
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_amount bigint;
  v_status text;
  v_fee bigint := greatest(coalesce(p_fee_kobo, 0), 0);
  v_lines jsonb;
  v_post jsonb;
begin
  if exists (select 1 from public.journal_entries
             where source = 'withdrawal_settle' and source_event_id = p_request_id::text) then
    return jsonb_build_object('posted', false, 'reason', 'duplicate');
  end if;

  select amount_kobo, status into v_amount, v_status
    from public.customer_wallet_withdrawal_requests where id = p_request_id for update;
  if v_amount is null then
    raise exception 'post_withdrawal_settlement: request % not found', p_request_id using errcode = 'check_violation';
  end if;
  if v_status = 'paid' then
    return jsonb_build_object('posted', false, 'reason', 'already_paid');
  end if;
  if v_status <> 'processing' then
    raise exception 'post_withdrawal_settlement: request % is % (must be reserved/processing)', p_request_id, v_status
      using errcode = 'check_violation';
  end if;
  -- Sanity: a real transfer fee is always well below the withdrawal (the request route enforces a
  -- minimum withdrawal comfortably above any provider transfer fee), so a fee >= the amount signals
  -- a corrupt/misparsed webhook value. Reject it rather than book a nonsensical expense.
  if v_fee >= v_amount then
    raise exception 'post_withdrawal_settlement: fee % must be < amount % (intent %)', v_fee, v_amount, p_request_id
      using errcode = 'check_violation';
  end if;

  -- DR withdrawals_payable (clear the in-flight) [+ DR processor_fees fee] / CR cash (amount + fee).
  v_lines := jsonb_build_array(
    jsonb_build_object('account_code', 'withdrawals_payable', 'debit_minor', v_amount, 'credit_minor', 0)
  );
  if v_fee > 0 then
    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account_code', 'processor_fees', 'debit_minor', v_fee, 'credit_minor', 0));
  end if;
  v_lines := v_lines || jsonb_build_array(
    jsonb_build_object('account_code', 'cash_settlement', 'debit_minor', 0, 'credit_minor', v_amount + v_fee));

  v_post := payments_private.post_ledger_entry('withdrawal_settle', p_request_id::text, 'Withdrawal paid', 'NGN', v_lines);
  if (v_post->>'posted')::boolean is not true then
    raise exception 'post_withdrawal_settlement: settle ledger post was a no-op for % (%)', p_request_id, v_post
      using errcode = 'check_violation';
  end if;

  update public.customer_wallet_withdrawal_requests
     set status = 'paid',
         metadata = coalesce(metadata, '{}'::jsonb)
                    || jsonb_build_object('transfer_ref', p_transfer_ref, 'fee_kobo', v_fee, 'paid_at', now())
   where id = p_request_id;
  return jsonb_build_object('posted', true, 'amount_kobo', v_amount, 'fee_kobo', v_fee);
end $$;
revoke all on function payments_private.post_withdrawal_settlement(uuid, text, bigint) from public, anon, authenticated;
grant execute on function payments_private.post_withdrawal_settlement(uuid, text, bigint) to service_role;

-- ============ 4. release_withdrawal — a FAILED transfer: reverse the reserve, restore balance ============
-- Called from the transfer webhook on transfer.failed. Reverses the reserve exactly (no cash ever
-- moved) and restores the user's balance. Idempotent on the request id; only a 'processing'
-- request can be released.
create or replace function payments_private.release_withdrawal(p_request_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid;
  v_amount bigint;
  v_status text;
  v_balance bigint;
  v_post jsonb;
begin
  if exists (select 1 from public.journal_entries
             where source = 'withdrawal_release' and source_event_id = p_request_id::text) then
    return jsonb_build_object('released', false, 'reason', 'duplicate');
  end if;

  select user_id, amount_kobo, status into v_user, v_amount, v_status
    from public.customer_wallet_withdrawal_requests where id = p_request_id for update;
  if v_user is null then
    raise exception 'release_withdrawal: request % not found', p_request_id using errcode = 'check_violation';
  end if;
  if v_status = 'failed' then
    return jsonb_build_object('released', false, 'reason', 'already_failed');
  end if;
  if v_status <> 'processing' then
    raise exception 'release_withdrawal: request % is % (must be reserved/processing)', p_request_id, v_status
      using errcode = 'check_violation';
  end if;

  -- Restore the held amount to the wallet, and reverse the reclassification (no cash side). Assert
  -- the wallet row was actually credited — a missing row (v_balance null) must never let the ledger
  -- credit the liability with no matching balance move.
  update public.customer_wallets
     set balance_kobo = balance_kobo + v_amount, updated_at = now()
   where user_id = v_user
   returning balance_kobo into v_balance;
  if v_balance is null then
    raise exception 'release_withdrawal: wallet for user % not found — cannot restore %', v_user, p_request_id
      using errcode = 'check_violation';
  end if;

  v_post := payments_private.post_ledger_entry(
    'withdrawal_release', p_request_id::text, 'Withdrawal released (failed)', 'NGN',
    jsonb_build_array(
      jsonb_build_object('account_code', 'withdrawals_payable',       'debit_minor', v_amount, 'credit_minor', 0),
      jsonb_build_object('account_code', 'customer_wallet_liability', 'debit_minor', 0,        'credit_minor', v_amount)
    )
  );
  if (v_post->>'posted')::boolean is not true then
    raise exception 'release_withdrawal: release ledger post was a no-op for % (%)', p_request_id, v_post
      using errcode = 'check_violation';
  end if;

  update public.customer_wallet_withdrawal_requests
     set status = 'failed',
         metadata = coalesce(metadata, '{}'::jsonb)
                    || jsonb_build_object('failed_reason', coalesce(p_reason, 'transfer_failed'), 'failed_at', now())
   where id = p_request_id;
  return jsonb_build_object('released', true, 'balance_after_kobo', coalesce(v_balance, 0), 'amount_kobo', v_amount);
end $$;
revoke all on function payments_private.release_withdrawal(uuid, text) from public, anon, authenticated;
grant execute on function payments_private.release_withdrawal(uuid, text) to service_role;
