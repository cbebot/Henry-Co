-- SEC-HARDEN-05 — Route Care's manual payment completion through a guarded RPC +
-- a balanced double-entry ledger; close the raw-status-write (free-mark-paid) hole.
--
-- THE HOLE (flagged by V3-RETIRE-BANKTRANSFER-01 §8): care's manual completion lanes
--   - apps/care/lib/payments/verification.ts  (support approves a submitted proof)
--   - apps/care/app/(staff)/owner/actions.ts   (owner/manager records a payment)
-- both, with the SERVICE-ROLE key, raw-INSERT public.care_payments with a
-- caller-supplied amount, append a single-entry public.care_finance_ledger row, and
-- raw-flip public.care_payment_requests.status='paid' — no guarded RPC, no validation,
-- no balanced posting. Any code holding the service key can mint a payment of any
-- amount and mark a booking paid (status is app-enforced TEXT; service_role bypasses
-- RLS and held full DML). This is care's free-mark-paid surface.
--
-- THE FIX (mirrors the V3-17 spine discipline — apply_payment_webhook / post_ledger_entry;
-- ZERO contact with the FL2 payments_private spine, which is a different schema/units):
--   1. care_private schema (service-role-only, NOT PostgREST-exposed) holds the guard.
--   2. care_record_manual_payment (ONE public, grant-locked, SECURITY DEFINER entry)
--      validates + is idempotent + inserts the payment + posts a BALANCED double-entry
--      + flips the request to paid — all in ONE transaction. The app calls only this.
--   3. A balanced double-entry care ledger (care_ledger_accounts / care_journal_entries
--      / care_journal_lines) with a deferred balance constraint, append-only
--      immutability, an idempotent guarded post RPC, and a reconciliation function —
--      the same construction the V3-17 ledger uses, in NAIRA numeric(14,2) (care's
--      money unit), independent of the kobo FL2 ledger.
--   4. care_payments DML revoked from anon/authenticated/service_role — writes flow
--      ONLY through the guarded RPC (which inserts as the table owner, so the existing
--      care_append_payment_ledger + care_recalc_booking_totals_from_payments triggers
--      still fire and keep the single-entry cash journal + booking rollups honest).
--   5. care_payment_requests.status='paid' guarded by a trigger: the transition INTO
--      'paid' is rejected unless it comes through the guarded RPC (a txn-local marker).
--      Delivery-state writes (sent/queued/failed) and payload-only updates are untouched.
--   6. The 12 historical care_payments (forensics 2026-06-15: total ₦2,625,169.30, each
--      with exactly one matching care_finance_ledger inflow, every booking rollup tied,
--      zero dupes, zero orphans) get their balanced double-entry posted by an idempotent
--      backfill — history is RECONCILED, never corrupted (no existing row is altered).
--
-- Amounts are NGN numeric(14,2) — care's money unit (care_finance_ledger / care_payments
-- are numeric(12,2); the journal uses (14,2) headroom). NGN base only.
--
-- IDEMPOTENT + SELF-STANDING: every object uses create-if-not-exists / do$$ guards /
-- on-conflict, so this applies cleanly on a fresh CI DB, the prod-actual shadow, and
-- (owner-gated) prod, and re-applies as a no-op.
--
-- OWNER-GATED APPLY: rehearse on the prod-actual shadow; apply to prod via
-- `supabase db query --linked` (never `db push`); deploy the routed app code alongside
-- (the raw paths fail CLOSED once this lands — money-safe — until the code calls the RPC).

-- ============================================================================
-- 0. care_private schema (mirror of payments_private — NOT PostgREST-exposed)
-- ============================================================================
create schema if not exists care_private;
revoke all on schema care_private from public;
revoke usage on schema care_private from anon, authenticated;
grant usage on schema care_private to service_role;

-- ============================================================================
-- 1. care_payments idempotency key (the guarded RPC's replay dedup)
-- ============================================================================
alter table public.care_payments add column if not exists idempotency_key text;
-- One payment per key; NULL keys (the 12 historical rows) are unconstrained.
create unique index if not exists care_payments_idempotency_key_unique
  on public.care_payments (idempotency_key) where idempotency_key is not null;

-- ============================================================================
-- 2. CHART OF ACCOUNTS (care double-entry; NGN)
-- ============================================================================
create table if not exists public.care_ledger_accounts (
  code           text primary key,
  type           text not null,
  normal_balance text not null,
  label          text not null,
  created_at     timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'care_ledger_accounts_type_valid') then
    alter table public.care_ledger_accounts add constraint care_ledger_accounts_type_valid
      check (type in ('asset','liability','revenue','expense','equity'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'care_ledger_accounts_normal_balance_valid') then
    alter table public.care_ledger_accounts add constraint care_ledger_accounts_normal_balance_valid
      check (normal_balance in ('debit','credit'));
  end if;
  -- normal balance MUST follow the account class (asset/expense → debit; rest → credit).
  if not exists (select 1 from pg_constraint where conname = 'care_ledger_accounts_normal_balance_consistent') then
    alter table public.care_ledger_accounts add constraint care_ledger_accounts_normal_balance_consistent
      check (normal_balance = (case when type in ('asset','expense') then 'debit' else 'credit' end));
  end if;
end $$;

-- A customer cash payment for a care booking: DR care_cash / CR care_service_revenue.
insert into public.care_ledger_accounts (code, type, normal_balance, label) values
  ('care_cash',            'asset',   'debit',  'Care cash / settlement received'),
  ('care_service_revenue', 'revenue', 'credit', 'Care service revenue'),
  ('care_refunds',         'expense', 'debit',  'Care refunds issued (placeholder)')
on conflict (code) do nothing;

-- ============================================================================
-- 3. JOURNAL ENTRIES (one per money event; append-only) + LINES (>= 2, one-sided)
-- ============================================================================
create table if not exists public.care_journal_entries (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,
  source_event_id text not null,
  description     text not null default '',
  currency        text not null default 'NGN',
  booking_id      uuid,
  posted_at       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
do $$ begin
  -- Idempotency: a given source event posts EXACTLY one entry.
  if not exists (select 1 from pg_constraint where conname = 'care_journal_entries_source_event_unique') then
    alter table public.care_journal_entries add constraint care_journal_entries_source_event_unique
      unique (source, source_event_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'care_journal_entries_currency_base') then
    alter table public.care_journal_entries add constraint care_journal_entries_currency_base
      check (currency = 'NGN');
  end if;
end $$;
create index if not exists care_journal_entries_source_idx on public.care_journal_entries (source, source_event_id);
create index if not exists care_journal_entries_booking_idx on public.care_journal_entries (booking_id);

create table if not exists public.care_journal_lines (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null references public.care_journal_entries(id) on delete restrict,
  account_code text not null references public.care_ledger_accounts(code) on delete restrict,
  debit        numeric(14,2) not null default 0,
  credit       numeric(14,2) not null default 0,
  created_at   timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'care_journal_lines_amounts_nonneg') then
    alter table public.care_journal_lines add constraint care_journal_lines_amounts_nonneg
      check (debit >= 0 and credit >= 0);
  end if;
  -- exactly one side per line.
  if not exists (select 1 from pg_constraint where conname = 'care_journal_lines_one_sided') then
    alter table public.care_journal_lines add constraint care_journal_lines_one_sided
      check ((debit = 0) <> (credit = 0));
  end if;
end $$;
create index if not exists care_journal_lines_entry_idx on public.care_journal_lines (entry_id);
create index if not exists care_journal_lines_account_idx on public.care_journal_lines (account_code);

-- ============================================================================
-- 3b. RLS + grant lockdown on the new ledger tables (MUST be before the §11 backfill)
-- ============================================================================
-- Enable RLS + revoke writes on the new ledger tables HERE, right after they are created
-- and BEFORE the §11 backfill inserts rows. The backfill leaves the deferred
-- care_journal_lines_balanced constraint pending until COMMIT, and Postgres refuses to
-- ALTER a table that has pending trigger events (55006). CI/shadow had an empty
-- care_payments (backfill = no-op → no pending events) so this only bit on prod.
-- Mirror the existing care money tables: RLS enabled, no anon/authenticated policy → the
-- request roles are denied; service_role bypasses RLS; writes flow ONLY through the RPCs.
alter table public.care_ledger_accounts enable row level security;
alter table public.care_journal_entries enable row level security;
alter table public.care_journal_lines   enable row level security;

revoke insert, update, delete, truncate on public.care_ledger_accounts from anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.care_journal_entries from anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.care_journal_lines   from anon, authenticated, service_role;

-- ============================================================================
-- 4. BALANCE INVARIANT (deferred constraint trigger — unbypassable, fires at COMMIT)
-- ============================================================================
create or replace function care_private.assert_entry_balanced()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_entry  uuid := coalesce(new.entry_id, old.entry_id);
  v_debit  numeric(14,2);
  v_credit numeric(14,2);
  v_count  int;
begin
  select coalesce(sum(debit), 0), coalesce(sum(credit), 0), count(*)
    into v_debit, v_credit, v_count
    from public.care_journal_lines where entry_id = v_entry;
  if v_count = 0 then
    return null; -- fully rolled back — nothing to assert
  end if;
  if v_count < 2 then
    raise exception 'care ledger entry % has % line(s); a balanced entry needs >= 2', v_entry, v_count
      using errcode = 'check_violation';
  end if;
  if v_debit <> v_credit then
    raise exception 'care ledger entry % is unbalanced: debits=% credits=%', v_entry, v_debit, v_credit
      using errcode = 'check_violation';
  end if;
  if v_debit <= 0 then
    raise exception 'care ledger entry % has a zero total', v_entry using errcode = 'check_violation';
  end if;
  return null;
end $$;
revoke all on function care_private.assert_entry_balanced() from public, anon, authenticated;

drop trigger if exists care_journal_lines_balanced on public.care_journal_lines;
create constraint trigger care_journal_lines_balanced
  after insert or update or delete on public.care_journal_lines
  deferrable initially deferred
  for each row execute function care_private.assert_entry_balanced();

-- ============================================================================
-- 5. IMMUTABILITY (append-only — posted rows never change; corrections are new entries)
-- ============================================================================
create or replace function care_private.block_ledger_mutation()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception 'care ledger is append-only: % on % is not allowed (post a reversing entry instead)',
    tg_op, tg_table_name using errcode = 'check_violation';
end $$;
revoke all on function care_private.block_ledger_mutation() from public, anon, authenticated;

drop trigger if exists care_journal_entries_immutable on public.care_journal_entries;
create trigger care_journal_entries_immutable
  before update or delete on public.care_journal_entries
  for each row execute function care_private.block_ledger_mutation();

drop trigger if exists care_journal_lines_immutable on public.care_journal_lines;
create trigger care_journal_lines_immutable
  before update or delete on public.care_journal_lines
  for each row execute function care_private.block_ledger_mutation();

drop trigger if exists care_journal_entries_no_truncate on public.care_journal_entries;
create trigger care_journal_entries_no_truncate
  before truncate on public.care_journal_entries
  for each statement execute function care_private.block_ledger_mutation();

drop trigger if exists care_journal_lines_no_truncate on public.care_journal_lines;
create trigger care_journal_lines_no_truncate
  before truncate on public.care_journal_lines
  for each statement execute function care_private.block_ledger_mutation();

-- ============================================================================
-- 6. GUARDED, IDEMPOTENT POSTING RPC (the only sanctioned care-ledger writer)
-- ============================================================================
create or replace function care_private.post_ledger_entry(
  p_source          text,
  p_source_event_id text,
  p_description     text,
  p_currency        text,
  p_booking_id      uuid,
  p_lines           jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_entry_id     uuid;
  v_existing     uuid;
  v_total_debit  numeric(14,2) := 0;
  v_total_credit numeric(14,2) := 0;
  v_line         jsonb;
  v_account      text;
  v_debit        numeric(14,2);
  v_credit       numeric(14,2);
begin
  if upper(coalesce(p_currency, '')) <> 'NGN' then
    raise exception 'care ledger currency must be NGN, got %', p_currency using errcode = 'check_violation';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'care ledger entry needs >= 2 lines' using errcode = 'check_violation';
  end if;

  for v_line in select value from jsonb_array_elements(p_lines) loop
    v_account := v_line->>'account_code';
    v_debit   := coalesce((v_line->>'debit')::numeric, 0);
    v_credit  := coalesce((v_line->>'credit')::numeric, 0);
    if not exists (select 1 from public.care_ledger_accounts where code = v_account) then
      raise exception 'unknown care ledger account %', coalesce(v_account, '(null)') using errcode = 'check_violation';
    end if;
    if v_debit < 0 or v_credit < 0 then
      raise exception 'care ledger amounts must be non-negative (account %)', v_account using errcode = 'check_violation';
    end if;
    if (v_debit = 0) = (v_credit = 0) then
      raise exception 'a care ledger line must be exactly one of debit/credit (account %)', v_account
        using errcode = 'check_violation';
    end if;
    v_total_debit  := v_total_debit + v_debit;
    v_total_credit := v_total_credit + v_credit;
  end loop;

  if v_total_debit <> v_total_credit then
    raise exception 'unbalanced care entry: debits=% credits=%', v_total_debit, v_total_credit
      using errcode = 'check_violation';
  end if;
  if v_total_debit <= 0 then
    raise exception 'care entry total must be positive' using errcode = 'check_violation';
  end if;

  insert into public.care_journal_entries (source, source_event_id, description, currency, booking_id)
  values (p_source, p_source_event_id, coalesce(p_description, ''), 'NGN', p_booking_id)
  on conflict (source, source_event_id) do nothing
  returning id into v_entry_id;

  if v_entry_id is null then
    select id into v_existing from public.care_journal_entries
      where source = p_source and source_event_id = p_source_event_id;
    return jsonb_build_object('posted', false, 'reason', 'duplicate', 'entry_id', v_existing);
  end if;

  insert into public.care_journal_lines (entry_id, account_code, debit, credit)
  select v_entry_id, e->>'account_code',
         coalesce((e->>'debit')::numeric, 0), coalesce((e->>'credit')::numeric, 0)
  from jsonb_array_elements(p_lines) e;

  return jsonb_build_object('posted', true, 'entry_id', v_entry_id);
end $$;
revoke all on function care_private.post_ledger_entry(text, text, text, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function care_private.post_ledger_entry(text, text, text, text, uuid, jsonb) to service_role;

-- ============================================================================
-- 7. GUARD: care_payment_requests.status -> 'paid' only through the guarded RPC
-- ============================================================================
-- The RPC sets a txn-local marker (care.guarded_completion='on') around the status
-- flip; any other path that tries to transition a request INTO 'paid' is rejected.
-- Non-'paid' status writes (sent/queued/failed delivery state) and payload-only
-- updates (status unchanged) are untouched — those are not the money edge.
create or replace function care_private.guard_payment_request_paid()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if lower(coalesce(new.status, '')) = 'paid'
     and (tg_op = 'INSERT' or lower(coalesce(old.status, '')) <> 'paid') then
    if coalesce(current_setting('care.guarded_completion', true), 'off') <> 'on' then
      raise exception
        'care_payment_requests.status=paid only via care_record_manual_payment (SEC-HARDEN-05)'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
revoke all on function care_private.guard_payment_request_paid() from public, anon, authenticated;

drop trigger if exists care_payment_requests_guard_paid on public.care_payment_requests;
create trigger care_payment_requests_guard_paid
  before insert or update on public.care_payment_requests
  for each row execute function care_private.guard_payment_request_paid();

-- ============================================================================
-- 8. THE GUARDED MANUAL-PAYMENT RPC (validated · idempotent · balanced · atomic)
-- ============================================================================
-- The ONLY sanctioned care_payments writer. In ONE transaction it:
--   (a) validates: booking exists; amount > 0 and <= a sanity ceiling; method present;
--       if a request is named, it belongs to the booking;
--   (b) is idempotent on p_idempotency_key (a replay returns the existing payment);
--   (c) inserts care_payments AS THE TABLE OWNER → the existing
--       care_append_payment_ledger + recalc triggers fire (single-entry cash journal +
--       booking rollups stay honest), regardless of the revoked role grants;
--   (d) posts the BALANCED double-entry (DR care_cash / CR care_service_revenue);
--   (e) flips the request(s) to 'paid' under the txn-local guard marker and merges any
--       app-supplied payload patch (review metadata) — atomically with the money.
-- Care genuinely allows over/under payment (a booking may be priced after pickup, so a
-- tight cap vs quoted_total would be wrong); the integrity guarantee is "writes only
-- through here, replay-safe, balanced, sane-bounded", not a per-booking amount cap.
create or replace function care_private.record_manual_payment(
  p_idempotency_key      text,
  p_booking_id           uuid,
  p_amount               numeric,
  p_payment_method       text,
  p_reference            text default null,
  p_notes                text default null,
  p_received_by          uuid default null,
  p_request_id           uuid default null,
  p_request_payload_patch jsonb default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_amount   numeric(14,2);
  v_method   text;
  v_existing record;
  v_booking  record;
  v_request_status  text;
  v_request_booking uuid;
  v_request_found   boolean := false;
  v_payment_id uuid;
  v_payment_no text;
  -- Sanity ceiling (NGN). The largest real care payment to date is ~₦2.15M; ₦1B
  -- rejects garbage/overflow without constraining legitimate amounts.
  v_max constant numeric := 1000000000.00;
begin
  if coalesce(btrim(p_idempotency_key), '') = '' then
    raise exception 'record_manual_payment: idempotency_key is required' using errcode = 'check_violation';
  end if;

  -- (b) idempotent replay — return the existing payment, post/flip nothing again.
  select id, booking_id, amount, payment_no into v_existing
    from public.care_payments where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    return jsonb_build_object('recorded', false, 'reason', 'duplicate',
      'payment_id', v_existing.id, 'payment_no', v_existing.payment_no,
      'booking_id', v_existing.booking_id, 'amount', v_existing.amount);
  end if;

  -- (a) validation
  if p_booking_id is null then
    raise exception 'record_manual_payment: booking_id is required' using errcode = 'check_violation';
  end if;
  v_amount := round(coalesce(p_amount, 0)::numeric, 2);
  if v_amount <= 0 then
    raise exception 'record_manual_payment: amount must be positive (got %)', p_amount using errcode = 'check_violation';
  end if;
  if v_amount > v_max then
    raise exception 'record_manual_payment: amount % exceeds the sanity ceiling %', v_amount, v_max using errcode = 'check_violation';
  end if;
  v_method := nullif(lower(btrim(coalesce(p_payment_method, ''))), '');
  if v_method is null then
    raise exception 'record_manual_payment: payment_method is required' using errcode = 'check_violation';
  end if;

  select id, tracking_code, balance_due into v_booking
    from public.care_bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'record_manual_payment: booking % not found', p_booking_id using errcode = 'check_violation';
  end if;

  if p_request_id is not null then
    select status, booking_id into v_request_status, v_request_booking
      from public.care_payment_requests where id = p_request_id for update;
    if not found then
      raise exception 'record_manual_payment: payment request % not found', p_request_id using errcode = 'check_violation';
    end if;
    v_request_found := true;
    if v_request_booking <> p_booking_id then
      raise exception 'record_manual_payment: request % does not belong to booking %', p_request_id, p_booking_id
        using errcode = 'check_violation';
    end if;
  end if;

  -- (c) record the payment fact (as owner → care_append_payment_ledger +
  -- care_recalc_booking_totals_from_payments triggers fire and keep the single-entry
  -- cash journal + the booking rollup tied automatically).
  insert into public.care_payments (booking_id, amount, payment_method, reference, notes, received_by, idempotency_key)
  values (p_booking_id, v_amount, v_method, nullif(btrim(coalesce(p_reference,'')),''), p_notes, p_received_by, p_idempotency_key)
  returning id, payment_no into v_payment_id, v_payment_no;

  -- (d) the BALANCED double-entry, same txn.
  perform care_private.post_ledger_entry(
    'care_payment', v_payment_id::text,
    'Care payment received' || case when p_request_id is not null then ' (request ' || p_request_id::text || ')' else '' end,
    'NGN', p_booking_id,
    jsonb_build_array(
      jsonb_build_object('account_code', 'care_cash',            'debit', v_amount, 'credit', 0),
      jsonb_build_object('account_code', 'care_service_revenue', 'debit', 0,        'credit', v_amount)
    )
  );

  -- (e) flip the request(s) to paid under the guard marker, + merge the payload patch.
  perform set_config('care.guarded_completion', 'on', true);
  if v_request_found then
    if lower(coalesce(v_request_status, '')) <> 'paid' then
      update public.care_payment_requests
         set status = 'paid',
             paid_at = now(),
             payload = coalesce(payload, '{}'::jsonb) || coalesce(p_request_payload_patch, '{}'::jsonb)
       where id = p_request_id;
    elsif p_request_payload_patch is not null then
      update public.care_payment_requests
         set payload = coalesce(payload, '{}'::jsonb) || p_request_payload_patch
       where id = p_request_id;
    end if;
  else
    -- owner/manager path: complete the booking's open request(s) (mirrors the prior
    -- raw `where booking_id = X and status <> 'paid'` flip).
    update public.care_payment_requests
       set status = 'paid', paid_at = now()
     where booking_id = p_booking_id and lower(coalesce(status, '')) <> 'paid';
  end if;
  perform set_config('care.guarded_completion', 'off', true);

  return jsonb_build_object(
    'recorded', true, 'payment_id', v_payment_id, 'payment_no', v_payment_no,
    'booking_id', p_booking_id, 'amount', v_amount, 'payment_method', v_method,
    'tracking_code', v_booking.tracking_code);
end $$;
revoke all on function care_private.record_manual_payment(text, uuid, numeric, text, text, text, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function care_private.record_manual_payment(text, uuid, numeric, text, text, text, uuid, uuid, jsonb) to service_role;

-- ============================================================================
-- 9. RECONCILIATION (the care-money bedrock check)
-- ============================================================================
-- Global care-ledger balance + the tie to the cash facts: the double-entry
-- care_cash debit balance must equal SUM(care_payments.amount) must equal the
-- single-entry care_finance_ledger payment inflow total. delta 0 on all three.
create or replace function care_private.care_ledger_reconciliation()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_debit            numeric(14,2);
  v_credit           numeric(14,2);
  v_cash_balance     numeric(14,2);
  v_payments_total   numeric(14,2);
  v_cashjournal_total numeric(14,2);
  v_accounts         jsonb;
begin
  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into v_debit, v_credit from public.care_journal_lines;

  -- care_cash is debit-normal: balance = debits - credits.
  select coalesce(sum(debit), 0) - coalesce(sum(credit), 0)
    into v_cash_balance
    from public.care_journal_lines where account_code = 'care_cash';

  select coalesce(sum(amount), 0) into v_payments_total from public.care_payments;

  select coalesce(sum(amount), 0) into v_cashjournal_total
    from public.care_finance_ledger
    where source_table = 'care_payments' and direction = 'inflow';

  select coalesce(jsonb_agg(jsonb_build_object(
           'code', a.code, 'type', a.type, 'normal_balance', a.normal_balance,
           'debit', coalesce(s.d, 0), 'credit', coalesce(s.c, 0),
           'balance', case when a.normal_balance = 'debit'
                           then coalesce(s.d, 0) - coalesce(s.c, 0)
                           else coalesce(s.c, 0) - coalesce(s.d, 0) end
         ) order by a.code), '[]'::jsonb)
    into v_accounts
    from public.care_ledger_accounts a
    left join (
      select account_code, sum(debit) d, sum(credit) c
      from public.care_journal_lines group by account_code
    ) s on s.account_code = a.code;

  return jsonb_build_object(
    'total_debit', v_debit,
    'total_credit', v_credit,
    'delta', v_debit - v_credit,
    'balanced', v_debit = v_credit,
    'ledger_cash_balance', v_cash_balance,
    'payments_total', v_payments_total,
    'cash_journal_inflow_total', v_cashjournal_total,
    'cash_ties_to_payments', v_cash_balance = v_payments_total,
    'cash_ties_to_cash_journal', v_cash_balance = v_cashjournal_total,
    'accounts', v_accounts
  );
end $$;
revoke all on function care_private.care_ledger_reconciliation() from public, anon, authenticated;
grant execute on function care_private.care_ledger_reconciliation() to service_role;

-- ============================================================================
-- 10. PUBLIC, GRANT-LOCKED WRAPPERS (the app's only reach into the guard)
-- ============================================================================
-- care_private is not PostgREST-exposed; the care app calls supabase.rpc on the public
-- schema. These thin SECURITY DEFINER wrappers forward to the private guard and are
-- executable ONLY by service_role (anon/authenticated revoked) — the SEC-HARDEN-01
-- audit-writer pattern. The grant invariant proves anon/authenticated cannot reach them.
create or replace function public.care_record_manual_payment(
  p_idempotency_key      text,
  p_booking_id           uuid,
  p_amount               numeric,
  p_payment_method       text,
  p_reference            text default null,
  p_notes                text default null,
  p_received_by          uuid default null,
  p_request_id           uuid default null,
  p_request_payload_patch jsonb default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return care_private.record_manual_payment(
    p_idempotency_key, p_booking_id, p_amount, p_payment_method, p_reference,
    p_notes, p_received_by, p_request_id, p_request_payload_patch);
end $$;
revoke all on function public.care_record_manual_payment(text, uuid, numeric, text, text, text, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.care_record_manual_payment(text, uuid, numeric, text, text, text, uuid, uuid, jsonb) to service_role;

create or replace function public.care_ledger_reconciliation()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return care_private.care_ledger_reconciliation();
end $$;
revoke all on function public.care_ledger_reconciliation() from public, anon, authenticated;
grant execute on function public.care_ledger_reconciliation() to service_role;

-- ============================================================================
-- 11. HISTORICAL BACKFILL (the 12 existing care_payments → balanced entries)
-- ============================================================================
-- Idempotent: post one balanced double-entry per existing payment, keyed by payment id.
-- A re-apply (or a payment already posted via the RPC) no-ops on the source-event
-- UNIQUE. No existing row is altered — history is reconciled, never corrupted.
do $$
declare r record;
begin
  for r in select id, booking_id, amount from public.care_payments order by created_at loop
    perform care_private.post_ledger_entry(
      'care_payment', r.id::text, 'Care payment (SEC-HARDEN-05 historical backfill)', 'NGN', r.booking_id,
      jsonb_build_array(
        jsonb_build_object('account_code', 'care_cash',            'debit', round(r.amount::numeric, 2), 'credit', 0),
        jsonb_build_object('account_code', 'care_service_revenue', 'debit', 0, 'credit', round(r.amount::numeric, 2))
      )
    );
  end loop;
end $$;

-- ============================================================================
-- 11b. VALIDATE THE DEFERRED BACKFILL EVENTS NOW (belt-and-suspenders)
-- ============================================================================
-- The backfill queued deferred care_journal_lines_balanced events. Force them to validate
-- immediately: this fails fast if any backfilled entry were unbalanced, and guarantees no
-- pending trigger events linger for any ALTER later in this transaction (with §3b already
-- ahead of the backfill this is defensive, but it keeps the migration robust to reorders).
set constraints all immediate;

-- ============================================================================
-- 12. LOCK DOWN THE RAW WRITE PATHS (defense in depth)
-- ============================================================================
-- care_payments: NO role may write directly — every payment flows through the guarded
-- RPC (which inserts as the table owner, unaffected by these revokes; its triggers also
-- run as owner). SELECT stays intact (hub owner HQ, account "my payments", care-admin,
-- automation all read via service_role).
revoke insert, update, delete, truncate on public.care_payments from anon, authenticated, service_role;

-- care_finance_ledger: append-only immutability (no UPDATE/DELETE/TRUNCATE anywhere in
-- the app; the inflow/outflow rows are written by triggers + the out-of-scope expense
-- path). INSERT grants are LEFT INTACT: the expense trigger fires as service_role and
-- the void-expense adjustment is an out-of-scope INSERT. This hardens the journal
-- against tampering without touching the expense flow.
create or replace function care_private.block_finance_ledger_mutation()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception 'care_finance_ledger is append-only: % is not allowed (post a new row instead)', tg_op
    using errcode = 'check_violation';
end $$;
revoke all on function care_private.block_finance_ledger_mutation() from public, anon, authenticated;

drop trigger if exists care_finance_ledger_immutable on public.care_finance_ledger;
create trigger care_finance_ledger_immutable
  before update or delete on public.care_finance_ledger
  for each row execute function care_private.block_finance_ledger_mutation();

drop trigger if exists care_finance_ledger_no_truncate on public.care_finance_ledger;
create trigger care_finance_ledger_no_truncate
  before truncate on public.care_finance_ledger
  for each statement execute function care_private.block_finance_ledger_mutation();

-- ============================================================================
-- 13. (moved to §3b) RLS + grant lockdown on the new care ledger tables
-- ============================================================================
-- The ENABLE ROW LEVEL SECURITY + REVOKE statements that used to live here were moved to
-- §3b (immediately after the tables are created, BEFORE the §11 backfill). Running them
-- AFTER the backfill failed on a non-empty prod with:
--   55006: cannot ALTER TABLE "care_journal_lines" because it has pending trigger events
-- (the backfill leaves the deferred balance constraint pending until COMMIT). CI/shadow had
-- an empty care_payments so the backfill was a no-op and never surfaced this. The lockdown
-- is unchanged — only its position moved. Applied to prod 2026-06-19 with this ordering.
