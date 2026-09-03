-- V3-19 — Refunds & credit notes: the money lifecycle's third leg.
--
-- The full provider-confirmed refund lifecycle on the existing money spine:
--   - payment_refunds: one row per refund attempt (FULL or PARTIAL), idempotent on
--     (intent_id, refund_key), ONE in-flight per intent (the state machine's
--     succeeded → refund_processing mutex, plus a partial-unique DB backstop — this
--     is what makes the provider's id-less refund webhooks unambiguous).
--   - OVER-REFUND IMPOSSIBLE BY CONSTRUCTION: a BEFORE trigger locks the intent and
--     rejects any insert/update that would push cumulative (processing + succeeded)
--     refunds past the captured amount — even if every app-layer check is bypassed.
--   - PROVIDER TRUTH (Q3): initiate_payment_refund only CLAIMS (succeeded →
--     refund_processing) and records the attempt; apply_refund_webhook is the ONLY
--     path to `refunded`/the reversing ledger entries, driven by the provider's
--     refund.processed/refund.failed webhooks (deduped, insert-first/effect-second).
--     A failed refund reverts to succeeded — money never left.
--   - PARTIAL-REFUND SEMANTICS: a confirmed partial refund returns the intent to
--     `succeeded` (the charge still stands); only cumulative-succeeded == captured
--     reaches terminal `refunded`. Both edges are already legal in the A2 table.
--   - LEDGER: each confirmed refund posts its balanced reversing entries in the SAME
--     transaction — settlement reversal (DR clearing / CR cash) always, plus a
--     PROPORTIONAL revenue + output-VAT reversal when (and only when) a
--     ('sale_revenue', intent) entry was actually posted (V3-VAT-01's refund hook).
--     The FINAL partial reverses the exact REMAINDER, so rounding can never drift.
--     The absorbed processor fee is NOT reversed: the provider's refund payloads
--     (create response + webhooks) report no fee return — never assumed otherwise.
--   - WALLET TOP-UP REVERSAL: holds (debits) the wallet at initiation under a
--     never-negative CAS — insufficient spendable balance REJECTS with an explicit
--     error (capping would silently change the requested amount; Job B's rule is
--     flag-don't-adjust). refund.failed releases the hold; the wallet projection
--     reconciles to customer_wallet_liability at every step.
--   - CREDIT NOTE (HO-CRN-): record_customer_credit_note mirrors the #252 lesson —
--     the document binds ONLY to a ('payment_refund', refund_id) posting for a
--     succeeded refund of the claimed intent, total = the posting's debit total,
--     VAT line must equal the POSTED VAT reversal. A charge posting cannot mint a
--     credit note; a refund posting still cannot mint a receipt (#252 check).
--
-- Amounts are kobo BIGINT — never float. NGN system base only (FX is display-only).
--
-- COMMITTED-NOT-APPLIED. Lands at FL2 with/just after the payment migrations,
-- owner-driven. Apply order at FL2:
--   20260529120000_payment_intents.sql
--   20260605123000_payments_private_isolation.sql
--   20260607120000_double_entry_ledger.sql
--   20260607130000_v3_18_payment_documents.sql
--   20260607140000_v3_vat_01_settlement_vat.sql
--   20260611120000_fl2_wallet_rail_completion.sql          (SCHEMA-TRUTH-01, when it lands)
--   20260611130000_v3_19_refunds.sql                       (THIS — depends on all above)
-- The authoritative FL2 list is docs/v3/fl2-apply-manifest.md (SCHEMA-TRUTH-01) —
-- add THIS file to it when both passes are on main.
-- Do NOT apply to prod here. Proven on a fresh Postgres 17 in CI
-- (payments-grant-invariant job → refunds_invariants.sql + refunds_grant_invariant.sql).

-- payments_private already exists after the prior migrations; create idempotently so
-- this migration is also self-standing on a fresh DB.
create schema if not exists payments_private;
revoke all on schema payments_private from public;
revoke usage on schema payments_private from anon, authenticated;
grant usage on schema payments_private to service_role;

-- ============ payment_refunds ============
create table if not exists public.payment_refunds (
  id                          uuid primary key default gen_random_uuid(),
  intent_id                   uuid not null references public.payment_intents(id) on delete restrict,
  refund_key                  uuid not null,                  -- caller idempotency key
  amount_minor                bigint not null,
  currency                    text not null default 'NGN',
  reason                      text,
  status                      text not null default 'processing',
  -- Set when the intent is a verified rail wallet top-up: the hold/release pair
  -- moves the wallet projection + customer_wallet_liability with this refund.
  wallet_funding_request_id   uuid,
  -- The provider's refund id from the create-refund response (adopt-don't-redrive key).
  provider_refund_reference   text,
  -- The provider's settlement-side reference from the refund.processed webhook.
  provider_refund_receipt     text,
  initiated_by                uuid references auth.users(id) on delete set null,
  settlement_posting_id       uuid references public.journal_entries(id) on delete restrict,
  revenue_reversal_posting_id uuid references public.journal_entries(id) on delete restrict,
  created_at                  timestamptz not null default timezone('utc', now()),
  resolved_at                 timestamptz
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'payment_refunds_amount_positive') then
    alter table public.payment_refunds add constraint payment_refunds_amount_positive check (amount_minor > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payment_refunds_status_valid') then
    alter table public.payment_refunds add constraint payment_refunds_status_valid
      check (status in ('processing','succeeded','failed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payment_refunds_currency_base') then
    alter table public.payment_refunds add constraint payment_refunds_currency_base check (currency = 'NGN');
  end if;
  -- Idempotency: one refund attempt per (intent, refund_key); a replay returns the row.
  if not exists (select 1 from pg_constraint where conname = 'payment_refunds_intent_key_unique') then
    alter table public.payment_refunds add constraint payment_refunds_intent_key_unique unique (intent_id, refund_key);
  end if;
end $$;
-- ONE in-flight refund per intent. The provider's refund webhooks carry no refund id
-- (only transaction_reference + a string amount), so serialization is what makes a
-- webhook → refund-row resolution unambiguous. The state machine already enforces
-- this (succeeded → refund_processing is a mutex); this index is the DB backstop.
create unique index if not exists payment_refunds_one_inflight
  on public.payment_refunds (intent_id) where status = 'processing';
create index if not exists payment_refunds_intent_idx on public.payment_refunds (intent_id);

-- ============ OVER-REFUND IMPOSSIBLE BY CONSTRUCTION ============
-- BEFORE INSERT/UPDATE: lock the intent row, then reject any state in which the
-- cumulative refunded-or-in-flight amount would exceed the captured amount. This
-- holds even against a direct INSERT by the table owner — the trigger is the
-- unbypassable guard; the TS/RPC checks are the early, precise failures.
create or replace function payments_private.enforce_refund_cap()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_captured bigint;
  v_intent_status text;
  v_cumulative bigint;
begin
  -- Only a row that COUNTS toward the cap (processing|succeeded) needs the guard;
  -- a transition to `failed` (a release) bumps nothing and takes no intent lock,
  -- which keeps the failed-path lock topology identical to the original.
  if new.status not in ('processing', 'succeeded') then
    return new;
  end if;

  -- SERIALIZE all cap-relevant refund writes for this intent via a WRITE-WRITE
  -- conflict on the intent row — NOT a `select … for update`. This is the fix for
  -- the adversarial finding: a refund INSERT only *locks* the intent (it never
  -- modifies it), so under REPEATABLE READ two concurrent direct INSERTs each take
  -- the FOR UPDATE lock without tripping a serialization error, and each reads the
  -- cumulative on its own pre-commit snapshot → both pass → over-refund. A real
  -- `update … set updated_at = now()` makes the second writer LOSE: 40001 under
  -- RR/SERIALIZABLE, or re-read the committed cumulative under READ COMMITTED. This
  -- is exactly why the RPC path (which updates the intent's status) was already
  -- safe; the trigger now carries the same guarantee for raw INSERTs too. The
  -- updated_at bump fires payments_set_updated_at (idempotent) and
  -- enforce_payment_intent_transition (new.status = old.status → no-op).
  update public.payment_intents
     set updated_at = now()
   where id = new.intent_id
   returning amount_minor, status into v_captured, v_intent_status;
  if not found then
    raise exception 'payment_refunds: intent % not found', new.intent_id using errcode = 'check_violation';
  end if;
  -- A refund can only exist against money that was actually captured. The intent is
  -- refund_processing while a refund is in flight; succeeded/refunded for terminal
  -- rows. pending/processing/failed/cancelled never captured money.
  if v_intent_status not in ('succeeded', 'refund_processing', 'refunded') then
    raise exception 'payment_refunds: intent % has never captured (status %)', new.intent_id, v_intent_status
      using errcode = 'check_violation';
  end if;
  select coalesce(sum(amount_minor), 0) into v_cumulative
    from public.payment_refunds
   where intent_id = new.intent_id and status in ('processing', 'succeeded') and id <> new.id;
  if v_cumulative + new.amount_minor > v_captured then
    raise exception 'payment_refunds: cumulative refunds % + % would exceed captured % (intent %)',
      v_cumulative, new.amount_minor, v_captured, new.intent_id using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function payments_private.enforce_refund_cap() from public, anon, authenticated;

drop trigger if exists payment_refunds_enforce_cap on public.payment_refunds;
create trigger payment_refunds_enforce_cap
  before insert or update on public.payment_refunds
  for each row execute function payments_private.enforce_refund_cap();

-- ============ The cap's DENOMINATOR is immutable (defense in depth) ============
-- The over-refund cap pins to payment_intents.amount_minor. The app never mutates
-- it (only provider_reference + status change after creation), but nothing in the
-- V3-15 migration FROZE it — so a buggy/ops UPDATE that inflates amount_minor would
-- silently raise the cap base. Freeze the money-defining columns once set, mirroring
-- the V3-17 ledger's append-only immutability. provider_reference + status stay
-- mutable (the guarded RPCs move them); only the captured amount/currency are locked.
create or replace function payments_private.freeze_intent_money_columns()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.amount_minor <> old.amount_minor or new.currency <> old.currency then
    raise exception 'payment_intents: amount_minor/currency are immutable once set (the refund cap pins to them)'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function payments_private.freeze_intent_money_columns() from public, anon, authenticated;

drop trigger if exists payment_intents_freeze_money on public.payment_intents;
create trigger payment_intents_freeze_money
  before update on public.payment_intents
  for each row execute function payments_private.freeze_intent_money_columns();

-- ============ wallet guards (tables exist in prod; guarded for the minimal CI DB) ============
-- The wallet projection can never go negative — the refund hold's CAS respects this,
-- and the CHECK is the unbypassable backstop. Validated at FL2 apply; a violation
-- there would surface a real pre-existing money bug, which is exactly the point.
do $$ begin
  if to_regclass('public.customer_wallets') is not null
     and not exists (select 1 from pg_constraint where conname = 'customer_wallets_balance_nonneg') then
    alter table public.customer_wallets add constraint customer_wallets_balance_nonneg check (balance_kobo >= 0);
  end if;
end $$;
-- One hold / one release log row per refund (the row-status CAS is the primary
-- exactly-once guard; this is the same defense V3-17 gave the top-up credit).
do $$ begin
  if to_regclass('public.customer_wallet_transactions') is not null then
    create unique index if not exists customer_wallet_transactions_refund_ref_unique
      on public.customer_wallet_transactions (reference_type, reference_id)
      where reference_type in ('wallet_refund_hold', 'wallet_refund_release');
  end if;
end $$;

-- ============ A: INITIATE (claim + record + wallet hold — ONE transaction) ============
-- Records the refund attempt and claims the intent (succeeded → refund_processing)
-- atomically, so there is no crash window in which the intent is claimed with no
-- refund row (or vice versa). Does NOT touch the provider and does NOT post any
-- settlement ledger entry — money truth stays with the webhook (Q3). The wallet
-- HOLD is the one ledger effect here: it converts wallet balance into a pending
-- refund obligation the moment the refund is requested, so the user cannot spend
-- the money the provider is about to return to their source.
create or replace function payments_private.initiate_payment_refund(
  p_intent_id uuid,
  p_refund_key uuid,
  p_amount_minor bigint default null,
  p_reason text default null,
  p_initiated_by uuid default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_intent record;
  v_existing record;
  v_cumulative bigint;
  v_remaining bigint;
  v_amount bigint;
  v_refund_id uuid := gen_random_uuid();
  v_funding_request_id uuid := null;
  v_wallet_id uuid;
  v_balance bigint;
  v_claimed int := 0;
begin
  if p_refund_key is null then
    raise exception 'initiate_payment_refund: refund_key is required' using errcode = 'check_violation';
  end if;

  select id, user_id, status, amount_minor, currency, idempotency_key
    into v_intent from public.payment_intents where id = p_intent_id for update;
  if v_intent.id is null then
    return jsonb_build_object('initiated', false, 'reason', 'intent_not_found');
  end if;

  -- Idempotent replay: the same (intent, refund_key) returns the existing attempt —
  -- the route uses this (plus provider_refund_reference) for adopt-don't-redrive.
  select id, status, amount_minor, provider_refund_reference into v_existing
    from public.payment_refunds where intent_id = p_intent_id and refund_key = p_refund_key;
  if v_existing.id is not null then
    return jsonb_build_object(
      'initiated', false, 'reason', 'duplicate', 'refund_id', v_existing.id,
      'status', v_existing.status, 'amount_minor', v_existing.amount_minor,
      'provider_refund_reference', v_existing.provider_refund_reference);
  end if;

  if upper(coalesce(v_intent.currency, '')) <> 'NGN' then
    return jsonb_build_object('initiated', false, 'reason', 'non_base_currency');
  end if;
  if v_intent.status = 'refund_processing' then
    return jsonb_build_object('initiated', false, 'reason', 'refund_in_flight');
  end if;
  if v_intent.status <> 'succeeded' then
    return jsonb_build_object('initiated', false, 'reason', 'not_refundable', 'status', v_intent.status);
  end if;

  -- The charge's settlement entry must exist — a refund reverses POSTED money truth.
  -- (Protects pre-ledger legacy intents at FL2 from an unbacked reversal; those are
  -- deliberate owner-ops, not this path.)
  if not exists (
    select 1 from public.journal_entries
     where source = 'payment_intent' and source_event_id = p_intent_id::text
  ) then
    return jsonb_build_object('initiated', false, 'reason', 'no_charge_settlement');
  end if;

  select coalesce(sum(amount_minor), 0) into v_cumulative
    from public.payment_refunds
   where intent_id = p_intent_id and status in ('processing', 'succeeded');
  v_remaining := v_intent.amount_minor - v_cumulative;
  v_amount := coalesce(p_amount_minor, v_remaining);
  if v_amount <= 0 or v_amount > v_remaining then
    return jsonb_build_object('initiated', false, 'reason', 'exceeds_refundable',
      'remaining_minor', v_remaining, 'requested_minor', v_amount);
  end if;

  -- Wallet top-up detection: the Job B chain is payment_intents.idempotency_key =
  -- customer_wallet_funding_requests.payment_reference, credited once 'verified'.
  select fr.id into v_funding_request_id
    from public.customer_wallet_funding_requests fr
   where fr.payment_reference = v_intent.idempotency_key
     and fr.status = 'verified'
   limit 1;

  if v_funding_request_id is not null then
    -- HOLD: never-negative CAS on the projection + the matching liability move,
    -- both in THIS transaction. Insufficient spendable balance → REJECT with the
    -- available amount (explicit and honest — capping would silently change the
    -- requested refund; the initiator re-requests a partial deliberately).
    select id, balance_kobo into v_wallet_id, v_balance
      from public.customer_wallets where user_id = v_intent.user_id for update;
    if v_wallet_id is null or v_balance < v_amount then
      return jsonb_build_object('initiated', false, 'reason', 'wallet_balance_insufficient',
        'available_kobo', coalesce(v_balance, 0), 'requested_minor', v_amount);
    end if;

    update public.customer_wallets
       set balance_kobo = balance_kobo - v_amount, updated_at = now()
     where id = v_wallet_id
     returning balance_kobo into v_balance;

    insert into public.customer_wallet_transactions
      (wallet_id, user_id, type, amount_kobo, balance_after_kobo, description, status, reference_type, reference_id, metadata)
    values
      (v_wallet_id, v_intent.user_id, 'debit', v_amount, v_balance, 'Wallet refund hold', 'completed',
       'wallet_refund_hold', v_refund_id::text,
       jsonb_build_object('payment_intent_id', p_intent_id, 'funding_request_id', v_funding_request_id));

    perform payments_private.post_ledger_entry(
      'wallet_refund_hold', v_refund_id::text, 'Wallet refund hold', 'NGN',
      jsonb_build_array(
        jsonb_build_object('account_code', 'customer_wallet_liability', 'debit_minor', v_amount, 'credit_minor', 0),
        jsonb_build_object('account_code', 'payments_clearing',         'debit_minor', 0,        'credit_minor', v_amount)
      ));
  end if;

  -- Claim: succeeded → refund_processing (the A2 trigger re-validates). We hold the
  -- intent's row lock, so exactly this caller claims.
  update public.payment_intents set status = 'refund_processing'
   where id = p_intent_id and status = 'succeeded';
  get diagnostics v_claimed = row_count;
  if v_claimed = 0 then
    raise exception 'initiate_payment_refund: claim lost for intent % (status changed mid-transaction)', p_intent_id
      using errcode = 'check_violation';
  end if;

  insert into public.payment_refunds
    (id, intent_id, refund_key, amount_minor, currency, reason, status, wallet_funding_request_id, initiated_by)
  values
    (v_refund_id, p_intent_id, p_refund_key, v_amount, 'NGN', p_reason, 'processing', v_funding_request_id, p_initiated_by);

  return jsonb_build_object(
    'initiated', true, 'refund_id', v_refund_id, 'amount_minor', v_amount,
    'wallet_hold', v_funding_request_id is not null,
    'remaining_after_minor', v_remaining - v_amount);
end $$;
revoke all on function payments_private.initiate_payment_refund(uuid, uuid, bigint, text, uuid) from public, anon, authenticated;
grant execute on function payments_private.initiate_payment_refund(uuid, uuid, bigint, text, uuid) to service_role;

-- ============ B: RECORD THE PROVIDER'S REFUND ID (adopt-don't-redrive anchor) ============
create or replace function payments_private.set_refund_provider_reference(
  p_refund_id uuid,
  p_reference text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_current text;
begin
  select provider_refund_reference into v_current
    from public.payment_refunds where id = p_refund_id for update;
  if not found then
    return jsonb_build_object('updated', false, 'reason', 'refund_not_found');
  end if;
  if v_current is not null then
    return jsonb_build_object('updated', v_current = p_reference,
      'reason', case when v_current = p_reference then 'already_set' else 'reference_conflict' end);
  end if;
  update public.payment_refunds set provider_refund_reference = p_reference where id = p_refund_id;
  return jsonb_build_object('updated', true);
end $$;
revoke all on function payments_private.set_refund_provider_reference(uuid, text) from public, anon, authenticated;
grant execute on function payments_private.set_refund_provider_reference(uuid, text) to service_role;

-- ============ C: FAIL (synchronous reject OR refund.failed — release + revert, ONE txn) ============
-- The money never left: fail the row, release any wallet hold (re-credit + reverse
-- posting), and revert the intent to `succeeded` — atomically. Idempotent: a second
-- failure delivery is a duplicate ack. A succeeded refund can never be demoted.
create or replace function payments_private.fail_payment_refund(
  p_refund_id uuid
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_row record;
  v_balance bigint;
  v_reverted int := 0;
begin
  select id, intent_id, amount_minor, status, wallet_funding_request_id
    into v_row from public.payment_refunds where id = p_refund_id for update;
  if v_row.id is null then
    return jsonb_build_object('failed', false, 'reason', 'refund_not_found');
  end if;
  if v_row.status = 'failed' then
    return jsonb_build_object('failed', false, 'reason', 'duplicate');
  end if;
  if v_row.status = 'succeeded' then
    raise exception 'fail_payment_refund: refund % is already provider-confirmed succeeded (money truth is never demoted)',
      p_refund_id using errcode = 'check_violation';
  end if;

  if v_row.wallet_funding_request_id is not null then
    -- Release the hold: re-credit the projection + reverse the liability move.
    update public.customer_wallets w
       set balance_kobo = balance_kobo + v_row.amount_minor, updated_at = now()
      from public.payment_intents i
     where i.id = v_row.intent_id and w.user_id = i.user_id
     returning w.balance_kobo into v_balance;

    insert into public.customer_wallet_transactions
      (wallet_id, user_id, type, amount_kobo, balance_after_kobo, description, status, reference_type, reference_id, metadata)
    select w.id, i.user_id, 'credit', v_row.amount_minor, v_balance, 'Wallet refund released', 'completed',
           'wallet_refund_release', v_row.id::text,
           jsonb_build_object('payment_intent_id', v_row.intent_id)
      from public.payment_intents i join public.customer_wallets w on w.user_id = i.user_id
     where i.id = v_row.intent_id;

    perform payments_private.post_ledger_entry(
      'wallet_refund_release', v_row.id::text, 'Wallet refund hold released', 'NGN',
      jsonb_build_array(
        jsonb_build_object('account_code', 'payments_clearing',         'debit_minor', v_row.amount_minor, 'credit_minor', 0),
        jsonb_build_object('account_code', 'customer_wallet_liability', 'debit_minor', 0,                  'credit_minor', v_row.amount_minor)
      ));
  end if;

  update public.payment_refunds
     set status = 'failed', resolved_at = timezone('utc', now())
   where id = p_refund_id;

  -- Revert the claim: money is still with us, so `succeeded` is the truthful state.
  update public.payment_intents set status = 'succeeded'
   where id = v_row.intent_id and status = 'refund_processing';
  get diagnostics v_reverted = row_count;
  if v_reverted = 0 then
    raise exception 'fail_payment_refund: intent % was not refund_processing while its refund % was in flight',
      v_row.intent_id, p_refund_id using errcode = 'check_violation';
  end if;

  return jsonb_build_object('failed', true, 'refund_id', p_refund_id,
    'wallet_released', v_row.wallet_funding_request_id is not null);
end $$;
revoke all on function payments_private.fail_payment_refund(uuid) from public, anon, authenticated;
grant execute on function payments_private.fail_payment_refund(uuid) to service_role;

-- ============ D: APPLY THE PROVIDER'S REFUND WEBHOOK (the ONLY path to `refunded`) ============
-- Resolves the intent's single in-flight refund row (the one-in-flight rule makes
-- this unambiguous), dedups insert-first in a per-refund namespace constructed from
-- the RESOLVED row (never from the payload — the provider's refund webhooks carry
-- no refund id, so a payload-keyed dedup would collide across attempts/partials),
-- then applies the effect in the SAME transaction:
--   processed → settlement reversal (DR clearing / CR cash, the refund amount) +
--               PROPORTIONAL revenue/output-VAT reversal iff a ('sale_revenue',
--               intent) entry was posted (final partial reverses the remainder) +
--               intent → `refunded` (cumulative == captured) or `succeeded`.
--   failed    → fail_payment_refund (release hold, revert intent).
-- A payload amount that disagrees with the resolved row applies NOTHING and reports
-- loudly — that mismatch should be impossible and is treated as an alarm, never
-- guessed around.
create or replace function payments_private.apply_refund_webhook(
  p_provider text,
  p_intent_id uuid,
  p_outcome text,
  p_amount_minor bigint default null,
  p_refund_receipt text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_row record;
  v_terminal record;
  v_intent record;
  v_inserted int := 0;
  v_settlement jsonb;
  v_settlement_id uuid;
  v_reversal_id uuid := null;
  v_sale_entry uuid;
  v_orig_vat bigint := 0;
  v_orig_rev bigint := 0;
  v_reversed_vat bigint := 0;
  v_reversed_rev bigint := 0;
  v_remaining_vat bigint := 0;
  v_remaining_rev bigint := 0;
  v_vat_r bigint := 0;
  v_rev_r bigint := 0;
  v_reversal_lines jsonb;
  v_cumulative_after bigint;
  v_next_status text;
  v_moved int := 0;
  v_fail jsonb;
begin
  if p_outcome not in ('processed', 'failed') then
    raise exception 'apply_refund_webhook: unknown outcome %', p_outcome using errcode = 'check_violation';
  end if;

  select id, user_id, amount_minor into v_intent
    from public.payment_intents where id = p_intent_id for update;
  if v_intent.id is null then
    return jsonb_build_object('applied', false, 'reason', 'intent_not_found');
  end if;

  select id, intent_id, amount_minor, status, wallet_funding_request_id
    into v_row from public.payment_refunds
   where intent_id = p_intent_id and status = 'processing' for update;

  if v_row.id is null then
    -- No refund in flight: a redelivery of an already-terminal outcome is a
    -- duplicate ack; anything else is an anomaly the route reports.
    select id, status into v_terminal from public.payment_refunds
     where intent_id = p_intent_id
       and status = case when p_outcome = 'processed' then 'succeeded' else 'failed' end
     order by resolved_at desc nulls last limit 1;
    if v_terminal.id is not null then
      return jsonb_build_object('applied', false, 'reason', 'duplicate', 'refund_id', v_terminal.id);
    end if;
    return jsonb_build_object('applied', false, 'reason', 'no_refund_in_flight');
  end if;

  if p_amount_minor is not null and p_amount_minor <> v_row.amount_minor then
    return jsonb_build_object('applied', false, 'reason', 'amount_mismatch',
      'expected_minor', v_row.amount_minor, 'reported_minor', p_amount_minor, 'refund_id', v_row.id);
  end if;

  -- A3 discipline: dedup-insert FIRST, in a namespace keyed by the RESOLVED row.
  insert into public.processed_webhooks (provider, provider_event_id, intent_id)
  values (p_provider, 'refund:' || v_row.id::text || ':' || p_outcome, p_intent_id)
  on conflict (provider, provider_event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('applied', false, 'reason', 'duplicate', 'refund_id', v_row.id);
  end if;

  if p_outcome = 'failed' then
    v_fail := payments_private.fail_payment_refund(v_row.id);
    return jsonb_build_object('applied', true, 'refund_id', v_row.id,
      'intent_status', 'succeeded', 'wallet_released', v_fail->>'wallet_released');
  end if;

  -- ===== processed: money moved (provider-confirmed) =====
  -- Settlement reversal — always, for the refunded amount.
  v_settlement := payments_private.post_ledger_entry(
    'payment_refund', v_row.id::text, 'Refund settled (provider-confirmed)', 'NGN',
    jsonb_build_array(
      jsonb_build_object('account_code', 'payments_clearing', 'debit_minor', v_row.amount_minor, 'credit_minor', 0),
      jsonb_build_object('account_code', 'cash_settlement',   'debit_minor', 0,                  'credit_minor', v_row.amount_minor)
    ));
  v_settlement_id := (v_settlement->>'entry_id')::uuid;

  -- Cumulative AFTER this refund confirms (this row still counts itself).
  select coalesce(sum(amount_minor), 0) into v_cumulative_after
    from public.payment_refunds
   where intent_id = p_intent_id and status in ('processing', 'succeeded');

  -- Proportional revenue + output-VAT reversal — ONLY against what was actually
  -- posted (V3-VAT-01's hook). No sale entry → nothing to reverse (e.g. wallet
  -- top-ups, or sales recognised before the Phase-2 path goes live).
  select id into v_sale_entry from public.journal_entries
   where source = 'sale_revenue' and source_event_id = p_intent_id::text;
  if v_sale_entry is not null then
    select coalesce(sum(credit_minor) filter (where account_code = 'vat_output_payable'), 0),
           coalesce(sum(credit_minor) filter (where account_code = 'platform_revenue'), 0)
      into v_orig_vat, v_orig_rev
      from public.journal_lines where entry_id = v_sale_entry;
    select coalesce(sum(l.debit_minor) filter (where l.account_code = 'vat_output_payable'), 0),
           coalesce(sum(l.debit_minor) filter (where l.account_code = 'platform_revenue'), 0)
      into v_reversed_vat, v_reversed_rev
      from public.journal_lines l
      join public.journal_entries e on e.id = l.entry_id
     where e.source = 'sale_revenue_refund'
       and e.source_event_id in (select r.id::text from public.payment_refunds r where r.intent_id = p_intent_id);
    v_remaining_vat := v_orig_vat - v_reversed_vat;
    v_remaining_rev := v_orig_rev - v_reversed_rev;

    -- The sale entry must still cover this refund (caller contract: the sale gross
    -- equals the intent gross; the refund cap bounds cumulative refunds to it).
    -- A shortfall means a mis-posted sale — fail LOUDLY, never half-reverse.
    if v_remaining_vat + v_remaining_rev < v_row.amount_minor then
      raise exception 'apply_refund_webhook: sale_revenue remainder % + % does not cover refund % (intent %)',
        v_remaining_rev, v_remaining_vat, v_row.amount_minor, p_intent_id using errcode = 'check_violation';
    end if;

    -- PROPORTIONAL VAT reversal with remainder clamps: round(orig_vat·R/gross),
    -- floored at R − remaining_revenue and capped at remaining VAT (and R). Under
    -- these clamps every leg stays >= 0, cumulative reversals can never exceed what
    -- was posted, and the FINAL partial reverses the exact remainders — per-partial
    -- rounding can never drift the books.
    v_vat_r := least(
      greatest(round(v_orig_vat::numeric * v_row.amount_minor / v_intent.amount_minor)::bigint,
               v_row.amount_minor - v_remaining_rev,
               0),
      v_remaining_vat,
      v_row.amount_minor);
    v_rev_r := v_row.amount_minor - v_vat_r;

    -- Build the legs CONDITIONALLY (mirrors the fee-split style): under
    -- adversarial rounding a final partial can be ALL VAT (rev_r = 0) or all
    -- revenue (vat_r = 0) — a zero "line" would be rejected by post_ledger_entry.
    -- rev_r + vat_r = R > 0, so at least one effect leg always exists (>= 2 lines).
    v_reversal_lines := '[]'::jsonb;
    if v_rev_r > 0 then
      v_reversal_lines := v_reversal_lines || jsonb_build_array(
        jsonb_build_object('account_code', 'platform_revenue', 'debit_minor', v_rev_r, 'credit_minor', 0));
    end if;
    if v_vat_r > 0 then
      v_reversal_lines := v_reversal_lines || jsonb_build_array(
        jsonb_build_object('account_code', 'vat_output_payable', 'debit_minor', v_vat_r, 'credit_minor', 0));
    end if;
    v_reversal_lines := v_reversal_lines || jsonb_build_array(
      jsonb_build_object('account_code', 'payments_clearing', 'debit_minor', 0, 'credit_minor', v_row.amount_minor));

    v_reversal_id := (payments_private.post_ledger_entry(
      'sale_revenue_refund', v_row.id::text, 'Sale revenue + output VAT reversed (refund)', 'NGN', v_reversal_lines
    )->>'entry_id')::uuid;
  end if;

  update public.payment_refunds
     set status = 'succeeded',
         resolved_at = timezone('utc', now()),
         provider_refund_receipt = coalesce(p_refund_receipt, provider_refund_receipt),
         settlement_posting_id = v_settlement_id,
         revenue_reversal_posting_id = v_reversal_id
   where id = v_row.id;

  -- Partial → back to `succeeded` (charge still stands); cumulative == captured →
  -- terminal `refunded`. Both edges legal from refund_processing (A2).
  v_next_status := case when v_cumulative_after >= v_intent.amount_minor then 'refunded' else 'succeeded' end;
  update public.payment_intents set status = v_next_status
   where id = p_intent_id and status = 'refund_processing';
  get diagnostics v_moved = row_count;
  if v_moved = 0 then
    raise exception 'apply_refund_webhook: intent % was not refund_processing while refund % was in flight',
      p_intent_id, v_row.id using errcode = 'check_violation';
  end if;

  return jsonb_build_object(
    'applied', true, 'refund_id', v_row.id, 'intent_status', v_next_status,
    'settlement_posting_id', v_settlement_id, 'revenue_reversal_posting_id', v_reversal_id,
    'vat_reversed_minor', v_vat_r, 'revenue_reversed_minor', v_rev_r);
end $$;
revoke all on function payments_private.apply_refund_webhook(text, uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function payments_private.apply_refund_webhook(text, uuid, text, bigint, text) to service_role;

-- ============ E: customer_credit_notes (the legal face of a confirmed refund) ============
create table if not exists public.customer_credit_notes (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  credit_note_no     text not null unique,                       -- HO-CRN-2026-000123
  receipt_id         uuid references public.customer_receipts(id) on delete set null,
  division           text not null,
  payment_method     text not null,
  payment_reference  text,                                       -- gateway transaction ref (processor UNNAMED)
  payment_intent_id  uuid not null references public.payment_intents(id) on delete restrict,
  refund_id          uuid not null references public.payment_refunds(id) on delete restrict,
  posting_id         uuid not null references public.journal_entries(id) on delete restrict,
  subtotal_minor     bigint not null,
  tax_minor          bigint not null default 0,
  total_minor        bigint not null,
  currency           text not null,
  line_items         jsonb not null default '[]'::jsonb,
  storage_path       text,
  issued_at          timestamptz not null default timezone('utc', now()),
  created_at         timestamptz not null default timezone('utc', now())
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'customer_credit_notes_refund_unique') then
    alter table public.customer_credit_notes add constraint customer_credit_notes_refund_unique unique (refund_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customer_credit_notes_posting_unique') then
    alter table public.customer_credit_notes add constraint customer_credit_notes_posting_unique unique (posting_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customer_credit_notes_amounts_nonneg') then
    alter table public.customer_credit_notes add constraint customer_credit_notes_amounts_nonneg
      check (subtotal_minor >= 0 and tax_minor >= 0 and total_minor > 0);
  end if;
  -- Presentation reconciles BY CONSTRUCTION: subtotal + tax = total (amount credited).
  if not exists (select 1 from pg_constraint where conname = 'customer_credit_notes_total_reconciles') then
    alter table public.customer_credit_notes add constraint customer_credit_notes_total_reconciles
      check (total_minor = subtotal_minor + tax_minor);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customer_credit_notes_currency_base') then
    alter table public.customer_credit_notes add constraint customer_credit_notes_currency_base check (currency = 'NGN');
  end if;
end $$;
create index if not exists customer_credit_notes_user_id_idx on public.customer_credit_notes (user_id);
create index if not exists customer_credit_notes_intent_idx on public.customer_credit_notes (payment_intent_id);

-- ============ F: RECORD CREDIT NOTE (guarded, idempotent, UNFAKEABLY bound — the #252 mirror) ============
-- The ONLY sanctioned writer for customer_credit_notes. The binding is unfakeable in
-- BOTH directions:
--   - the posting MUST be the refund-settlement entry ('payment_refund', refund_id)
--     of a provider-confirmed (succeeded) refund of THIS intent — a charge posting
--     (source='payment_intent') can never mint a credit note;
--   - record_customer_receipt already rejects refund postings (#252), so a refund
--     posting can never mint a receipt.
-- The total MUST equal the posting's debit total (= the refunded amount), and the
-- VAT line MUST equal the POSTED output-VAT reversal for this refund (0 when none
-- was posted) — the document can never claim a tax effect the ledger didn't record.
create or replace function payments_private.record_customer_credit_note(
  p_user_id uuid,
  p_division text,
  p_payment_intent_id uuid,
  p_refund_id uuid,
  p_posting_id uuid,
  p_receipt_id uuid,
  p_payment_method text,
  p_payment_reference text,
  p_subtotal_minor bigint,
  p_tax_minor bigint,
  p_total_minor bigint,
  p_currency text,
  p_line_items jsonb,
  p_issued_at timestamptz,
  p_storage_path text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing_id uuid;
  v_existing_no text;
  v_refund record;
  v_ledger_debit bigint;
  v_posted_vat bigint;
  v_year int := extract(year from coalesce(p_issued_at, now()))::int;
  v_no text;
  v_id uuid;
begin
  if upper(coalesce(p_currency, '')) <> 'NGN' then
    raise exception 'record_customer_credit_note: currency must be NGN, got %', p_currency using errcode = 'check_violation';
  end if;

  -- Idempotent: one credit note per refund.
  select id, credit_note_no into v_existing_id, v_existing_no
    from public.customer_credit_notes where refund_id = p_refund_id;
  if v_existing_id is not null then
    return jsonb_build_object('created', false, 'reason', 'duplicate', 'id', v_existing_id, 'credit_note_no', v_existing_no);
  end if;

  -- The refund must be provider-confirmed and belong to the claimed intent.
  select id, intent_id, amount_minor, status, settlement_posting_id into v_refund
    from public.payment_refunds where id = p_refund_id;
  if v_refund.id is null or v_refund.intent_id <> p_payment_intent_id then
    raise exception 'record_customer_credit_note: refund % does not belong to intent %', p_refund_id, p_payment_intent_id
      using errcode = 'check_violation';
  end if;
  if v_refund.status <> 'succeeded' then
    raise exception 'record_customer_credit_note: refund % is not provider-confirmed (status %)', p_refund_id, v_refund.status
      using errcode = 'check_violation';
  end if;

  -- The posting MUST be THIS refund's settlement entry — never a charge posting,
  -- never another refund's posting.
  if not exists (
    select 1 from public.journal_entries
     where id = p_posting_id and source = 'payment_refund' and source_event_id = p_refund_id::text
  ) then
    raise exception 'record_customer_credit_note: posting % is not the refund settlement for refund % (charge or foreign posting)',
      p_posting_id, p_refund_id using errcode = 'check_violation';
  end if;

  -- Reconcile: total = the posting's debit total = the refunded amount.
  select coalesce(sum(debit_minor), 0) into v_ledger_debit
    from public.journal_lines where entry_id = p_posting_id;
  if v_ledger_debit <> p_total_minor or v_ledger_debit <> v_refund.amount_minor then
    raise exception 'record_customer_credit_note: total % does not reconcile to ledger posting debit % / refund amount % (posting %)',
      p_total_minor, v_ledger_debit, v_refund.amount_minor, p_posting_id using errcode = 'check_violation';
  end if;

  -- The VAT line must equal the POSTED output-VAT reversal for this refund (0 if none).
  select coalesce(sum(l.debit_minor), 0) into v_posted_vat
    from public.journal_lines l
    join public.journal_entries e on e.id = l.entry_id
   where e.source = 'sale_revenue_refund' and e.source_event_id = p_refund_id::text
     and l.account_code = 'vat_output_payable';
  if coalesce(p_tax_minor, 0) <> v_posted_vat then
    raise exception 'record_customer_credit_note: VAT % does not match the posted reversal % (refund %)',
      coalesce(p_tax_minor, 0), v_posted_vat, p_refund_id using errcode = 'check_violation';
  end if;

  -- The referenced receipt (when given) must evidence the SAME intent.
  if p_receipt_id is not null and not exists (
    select 1 from public.customer_receipts where id = p_receipt_id and payment_intent_id = p_payment_intent_id
  ) then
    raise exception 'record_customer_credit_note: receipt % does not belong to intent %', p_receipt_id, p_payment_intent_id
      using errcode = 'check_violation';
  end if;

  v_no := payments_private.allocate_document_number('CRN', v_year);
  insert into public.customer_credit_notes (
    user_id, credit_note_no, receipt_id, division, payment_method, payment_reference,
    payment_intent_id, refund_id, posting_id, subtotal_minor, tax_minor,
    total_minor, currency, line_items, storage_path, issued_at
  ) values (
    p_user_id, v_no, p_receipt_id, p_division, p_payment_method, p_payment_reference,
    p_payment_intent_id, p_refund_id, p_posting_id, p_subtotal_minor, coalesce(p_tax_minor, 0),
    p_total_minor, 'NGN', coalesce(p_line_items, '[]'::jsonb), p_storage_path, coalesce(p_issued_at, timezone('utc', now()))
  )
  on conflict (refund_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id, credit_note_no into v_id, v_no from public.customer_credit_notes where refund_id = p_refund_id;
    return jsonb_build_object('created', false, 'reason', 'duplicate', 'id', v_id, 'credit_note_no', v_no);
  end if;

  return jsonb_build_object('created', true, 'id', v_id, 'credit_note_no', v_no);
end $$;
revoke all on function payments_private.record_customer_credit_note(uuid, text, uuid, uuid, uuid, uuid, text, text, bigint, bigint, bigint, text, jsonb, timestamptz, text) from public, anon, authenticated;
grant execute on function payments_private.record_customer_credit_note(uuid, text, uuid, uuid, uuid, uuid, text, text, bigint, bigint, bigint, text, jsonb, timestamptz, text) to service_role;

-- ============ G: RETIRE THE LEGACY FULL-GROSS REFUND PATH (defense in depth) ============
-- Refund money truth now flows ONLY through apply_refund_webhook (per-refund
-- postings, partial-aware, VAT-aware). The old whole-intent reversal inside
-- post_charge_settlement and the `refunded` status via apply_payment_webhook would
-- silently diverge the books (status flip with no per-refund posting) — so both now
-- fail LOUDLY instead. Signatures unchanged; every existing charge-path caller is
-- untouched.
create or replace function payments_private.post_charge_settlement(
  p_intent_id uuid,
  p_new_status text,
  p_fee_minor bigint default 0,
  p_fee_vat_minor bigint default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_amount bigint;
  v_currency text;
  v_fee bigint := greatest(coalesce(p_fee_minor, 0), 0);
  v_fee_vat bigint;
  v_fee_ex bigint;
  v_cash bigint;
  -- Statutory Nigeria VAT rate. MIRRORS @henryco/config TAX.vat.standardRate — kept in
  -- lockstep, like the SQL chart of accounts mirrors the TS chart. Used ONLY to split a
  -- VAT-inclusive fee when the provider did not break the VAT out itself.
  v_vat_rate constant numeric := 0.075;
  v_lines jsonb;
begin
  if p_new_status = 'refunded' then
    -- V3-19: refunds post per-refund reversing entries via apply_refund_webhook —
    -- the legacy whole-gross reversal here would double-count against them.
    raise exception 'post_charge_settlement: refunds flow through apply_refund_webhook (V3-19)'
      using errcode = 'check_violation';
  end if;
  if p_new_status <> 'succeeded' then
    return jsonb_build_object('posted', false, 'reason', 'non_money_status');
  end if;
  select amount_minor, currency into v_amount, v_currency from public.payment_intents where id = p_intent_id;
  if v_amount is null then
    raise exception 'post_charge_settlement: intent % not found', p_intent_id using errcode = 'check_violation';
  end if;
  if upper(coalesce(v_currency, '')) <> 'NGN' then
    -- Settlement runs in NGN; a non-NGN intent has no known NGN amount here (FX is a
    -- later pass). Skip rather than post an approximation.
    return jsonb_build_object('posted', false, 'reason', 'non_base_currency');
  end if;

  -- succeeded with no known fee → the plain V3-17 gross-to-cash entry (never fabricate).
  if v_fee = 0 then
    return payments_private.post_ledger_entry(
      'payment_intent', p_intent_id::text, 'Charge settled', 'NGN',
      jsonb_build_array(
        jsonb_build_object('account_code', 'cash_settlement',   'debit_minor', v_amount, 'credit_minor', 0),
        jsonb_build_object('account_code', 'payments_clearing', 'debit_minor', 0,        'credit_minor', v_amount)
      )
    );
  end if;

  if v_fee >= v_amount then
    raise exception 'post_charge_settlement: fee % must be < gross % (intent %)', v_fee, v_amount, p_intent_id
      using errcode = 'check_violation';
  end if;

  -- Prefer a provider-reported fee VAT; else statutory decomposition of the VAT-
  -- inclusive fee. The VAT part is the REMAINDER, so fee_ex + fee_vat = fee exactly.
  if p_fee_vat_minor is not null then
    if p_fee_vat_minor < 0 or p_fee_vat_minor > v_fee then
      raise exception 'post_charge_settlement: fee VAT % out of range for fee % (intent %)', p_fee_vat_minor, v_fee, p_intent_id
        using errcode = 'check_violation';
    end if;
    v_fee_vat := p_fee_vat_minor;
  else
    v_fee_vat := (v_fee - round(v_fee / (1 + v_vat_rate)))::bigint;
  end if;
  v_fee_ex := v_fee - v_fee_vat;
  v_cash := v_amount - v_fee;

  v_lines := jsonb_build_array(
    jsonb_build_object('account_code', 'cash_settlement', 'debit_minor', v_cash, 'credit_minor', 0)
  );
  if v_fee_ex > 0 then
    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account_code', 'processor_fees', 'debit_minor', v_fee_ex, 'credit_minor', 0));
  end if;
  if v_fee_vat > 0 then
    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account_code', 'fee_vat_recoverable', 'debit_minor', v_fee_vat, 'credit_minor', 0));
  end if;
  v_lines := v_lines || jsonb_build_array(
    jsonb_build_object('account_code', 'payments_clearing', 'debit_minor', 0, 'credit_minor', v_amount));

  return payments_private.post_ledger_entry('payment_intent', p_intent_id::text, 'Charge settled (fee absorbed)', 'NGN', v_lines);
end $$;
revoke all on function payments_private.post_charge_settlement(uuid, text, bigint, bigint) from public, anon, authenticated;
grant execute on function payments_private.post_charge_settlement(uuid, text, bigint, bigint) to service_role;

-- apply_payment_webhook: identical to the V3-VAT-01 version EXCEPT it now rejects
-- `refunded` outright — that edge belongs to apply_refund_webhook. A stale caller
-- fails loudly instead of flipping status with no per-refund posting.
create or replace function payments_private.apply_payment_webhook(
  p_provider text,
  p_provider_event_id text,
  p_intent_id uuid,
  p_new_status text,
  p_fee_minor bigint default 0,
  p_fee_vat_minor bigint default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_affected integer := 0;
begin
  if p_new_status = 'refunded' then
    raise exception 'apply_payment_webhook: refund confirmations flow through apply_refund_webhook (V3-19)'
      using errcode = 'check_violation';
  end if;
  insert into public.processed_webhooks (provider, provider_event_id, intent_id)
  values (p_provider, p_provider_event_id, p_intent_id)
  on conflict (provider, provider_event_id) do nothing;
  get diagnostics v_affected = row_count;
  if v_affected = 0 then
    return jsonb_build_object('applied', false, 'reason', 'duplicate');
  end if;
  update public.payment_intents set status = p_new_status where id = p_intent_id;
  -- V3-VAT-01: fee-aware settlement post, SAME txn (a failure rolls back the status +
  -- the dedup row, so a redelivery retries safely and ledger-truth never diverges).
  perform payments_private.post_charge_settlement(p_intent_id, p_new_status, coalesce(p_fee_minor, 0), p_fee_vat_minor);
  return jsonb_build_object('applied', true);
end $$;
revoke all on function payments_private.apply_payment_webhook(text, text, uuid, text, bigint, bigint) from public, anon, authenticated;
grant execute on function payments_private.apply_payment_webhook(text, text, uuid, text, bigint, bigint) to service_role;

-- ============ RLS — owner reads own; platform staff read all; NO client write ============
alter table public.payment_refunds enable row level security;
alter table public.customer_credit_notes enable row level security;

drop policy if exists payment_refunds_select_own on public.payment_refunds;
create policy payment_refunds_select_own on public.payment_refunds
  for select to authenticated using (
    exists (select 1 from public.payment_intents i
             where i.id = payment_refunds.intent_id and i.user_id = (select auth.uid()))
  );

drop policy if exists payment_refunds_select_staff on public.payment_refunds;
create policy payment_refunds_select_staff on public.payment_refunds
  for select to authenticated using (public.is_platform_staff());

drop policy if exists customer_credit_notes_select_own on public.customer_credit_notes;
create policy customer_credit_notes_select_own on public.customer_credit_notes
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists customer_credit_notes_select_staff on public.customer_credit_notes;
create policy customer_credit_notes_select_staff on public.customer_credit_notes
  for select to authenticated using (public.is_platform_staff());

-- Defense in depth (mirrors V3-17/V3-18): strip the blanket table-level DML grants so
-- writes flow ONLY through the SECURITY DEFINER RPCs (which insert as the table owner,
-- unaffected by these grants). A refund row / credit note is money truth / a legal
-- artifact — no role may write one directly. SELECT stays (RLS gates it).
revoke insert, update, delete, truncate on public.payment_refunds       from anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.customer_credit_notes from anon, authenticated, service_role;
