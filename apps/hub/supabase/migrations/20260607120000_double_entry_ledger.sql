-- V3-17 — The double-entry ledger: the auditable money spine.
--
-- A general ledger where money truth is auditable BY CONSTRUCTION. Every financial
-- event posts ONE journal entry of >= 2 balanced lines; the DB itself rejects an
-- unbalanced entry, rejects any mutation of a posted row, and posts each source
-- event exactly once. The wired money edges (charge succeeded, refund, wallet
-- top-up) post their balanced entry in the SAME transaction as the money edge, so
-- ledger-truth and money-truth can never diverge.
--
-- PRODUCTION MIRROR of packages/payment-router/src/ledger.ts (the TS balance guard
-- + chart of accounts). The TS reference is the executable spec tested in CI; this
-- SQL is the unbypassable transcription of the SAME rules — keep them in lockstep.
--
-- COMMITTED-NOT-APPLIED. Lands at FL2 with/just after the payment migrations,
-- owner-driven. Apply order at FL2:
--   20260529120000_payment_intents.sql
--   20260605123000_payments_private_isolation.sql   (moves money writers to payments_private)
--   20260607120000_double_entry_ledger.sql          (THIS — depends on both above)
-- Do NOT apply to prod here. Prove on a fresh throwaway Supabase (PG 17.6).
--
-- Amounts are kobo BIGINT (NGN minor units) — never float, never ×100. The ledger
-- currency is the NGN system base (@henryco/pricing SYSTEM_BASE_CURRENCY); FX is
-- display-only, so no approximate amount is ever posted as real.

-- payments_private already exists after the isolation migration; create idempotently
-- so this migration is also self-standing on a fresh DB.
create schema if not exists payments_private;
revoke all on schema payments_private from public;
revoke usage on schema payments_private from anon, authenticated;
grant usage on schema payments_private to service_role;

-- ============ CHART OF ACCOUNTS ============
create table if not exists public.ledger_accounts (
  code text primary key,
  type text not null,
  normal_balance text not null,
  label text not null,
  created_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ledger_accounts_type_valid') then
    alter table public.ledger_accounts add constraint ledger_accounts_type_valid
      check (type in ('asset','liability','revenue','expense','equity'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ledger_accounts_normal_balance_valid') then
    alter table public.ledger_accounts add constraint ledger_accounts_normal_balance_valid
      check (normal_balance in ('debit','credit'));
  end if;
  -- Normal balance MUST follow the account class (asset/expense → debit; the rest →
  -- credit). A mismatch here would be a money bug; the DB refuses it.
  if not exists (select 1 from pg_constraint where conname = 'ledger_accounts_normal_balance_consistent') then
    alter table public.ledger_accounts add constraint ledger_accounts_normal_balance_consistent
      check (normal_balance = (case when type in ('asset','expense') then 'debit' else 'credit' end));
  end if;
end $$;

-- Seed (mirrors LEDGER_ACCOUNTS in packages/payment-router/src/ledger.ts).
insert into public.ledger_accounts (code, type, normal_balance, label) values
  ('cash_settlement',           'asset',     'debit',  'Cash / settlement'),
  ('payments_clearing',         'liability', 'credit', 'Payments clearing (received, unallocated)'),
  ('customer_wallet_liability', 'liability', 'credit', 'Customer wallet balances'),
  ('platform_revenue',          'revenue',   'credit', 'Platform revenue'),
  ('processor_fees',            'expense',   'debit',  'Payment processor fees'),
  ('refunds',                   'expense',   'debit',  'Refunds issued'),
  ('vat_payable',               'liability', 'credit', 'VAT payable (placeholder)')
on conflict (code) do nothing;

-- ============ JOURNAL ENTRIES (one per financial event; append-only) ============
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_event_id text not null,
  description text not null default '',
  currency text not null default 'NGN',
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
do $$ begin
  -- Idempotency: a given source event posts EXACTLY one entry (the apply_payment_webhook discipline).
  if not exists (select 1 from pg_constraint where conname = 'journal_entries_source_event_unique') then
    alter table public.journal_entries add constraint journal_entries_source_event_unique unique (source, source_event_id);
  end if;
  -- The ledger settles only in the NGN system base. No approximate FX amount is ever real.
  if not exists (select 1 from pg_constraint where conname = 'journal_entries_currency_base') then
    alter table public.journal_entries add constraint journal_entries_currency_base check (currency = 'NGN');
  end if;
end $$;
create index if not exists journal_entries_source_idx on public.journal_entries (source, source_event_id);

-- ============ JOURNAL LINES (>= 2 per entry; debits/credits; append-only) ============
create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete restrict,
  account_code text not null references public.ledger_accounts(code) on delete restrict,
  debit_minor bigint not null default 0,
  credit_minor bigint not null default 0,
  created_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'journal_lines_amounts_nonneg') then
    alter table public.journal_lines add constraint journal_lines_amounts_nonneg
      check (debit_minor >= 0 and credit_minor >= 0);
  end if;
  -- Exactly one side per line (mirrors the TS `(debit===0) <> (credit===0)` rule).
  if not exists (select 1 from pg_constraint where conname = 'journal_lines_one_sided') then
    alter table public.journal_lines add constraint journal_lines_one_sided
      check ((debit_minor = 0) <> (credit_minor = 0));
  end if;
end $$;
create index if not exists journal_lines_entry_id_idx on public.journal_lines (entry_id);
create index if not exists journal_lines_account_code_idx on public.journal_lines (account_code);

-- ============ A: BALANCE INVARIANT (deferred constraint trigger — unbypassable) ============
-- Fires at COMMIT, so it sees the full set of lines for an entry no matter how they
-- were inserted (the guarded RPC, or a hypothetical raw INSERT). For each touched
-- entry: >= 2 lines AND sum(debits) = sum(credits) > 0, else RAISE → the whole
-- transaction rolls back. This is the DB half of the defense-in-depth balance rule
-- (the TS half is assertBalanced in ledger.ts).
create or replace function payments_private.assert_entry_balanced()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_entry uuid := coalesce(new.entry_id, old.entry_id);
  v_debit bigint;
  v_credit bigint;
  v_count int;
begin
  select coalesce(sum(debit_minor), 0), coalesce(sum(credit_minor), 0), count(*)
    into v_debit, v_credit, v_count
    from public.journal_lines where entry_id = v_entry;
  if v_count = 0 then
    return null; -- entry has no lines (e.g. fully rolled back) — nothing to assert
  end if;
  if v_count < 2 then
    raise exception 'ledger entry % has % line(s); a balanced entry needs >= 2', v_entry, v_count
      using errcode = 'check_violation';
  end if;
  if v_debit <> v_credit then
    raise exception 'ledger entry % is unbalanced: debits=% credits=%', v_entry, v_debit, v_credit
      using errcode = 'check_violation';
  end if;
  if v_debit <= 0 then
    raise exception 'ledger entry % has a zero total', v_entry using errcode = 'check_violation';
  end if;
  return null;
end $$;
revoke all on function payments_private.assert_entry_balanced() from public, anon, authenticated;

drop trigger if exists journal_lines_balanced on public.journal_lines;
create constraint trigger journal_lines_balanced
  after insert or update or delete on public.journal_lines
  deferrable initially deferred
  for each row execute function payments_private.assert_entry_balanced();

-- ============ B: IMMUTABILITY (append-only — posted rows never change) ============
-- Corrections are NEW reversing entries, never edits. UPDATE/DELETE on a posted
-- journal row raises. (The wallet log + funding requests live in other tables and
-- are unaffected.)
create or replace function payments_private.block_ledger_mutation()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception 'ledger is append-only: % on % is not allowed (post a reversing entry instead)',
    tg_op, tg_table_name using errcode = 'check_violation';
end $$;
revoke all on function payments_private.block_ledger_mutation() from public, anon, authenticated;

drop trigger if exists journal_entries_immutable on public.journal_entries;
create trigger journal_entries_immutable
  before update or delete on public.journal_entries
  for each row execute function payments_private.block_ledger_mutation();

drop trigger if exists journal_lines_immutable on public.journal_lines;
create trigger journal_lines_immutable
  before update or delete on public.journal_lines
  for each row execute function payments_private.block_ledger_mutation();

-- Append-only also means non-truncatable — an auditable ledger is never wiped.
-- (TRUNCATE bypasses row-level DELETE triggers; these statement-level guards close it.)
drop trigger if exists journal_entries_no_truncate on public.journal_entries;
create trigger journal_entries_no_truncate
  before truncate on public.journal_entries
  for each statement execute function payments_private.block_ledger_mutation();

drop trigger if exists journal_lines_no_truncate on public.journal_lines;
create trigger journal_lines_no_truncate
  before truncate on public.journal_lines
  for each statement execute function payments_private.block_ledger_mutation();

-- ============ C: THE GUARDED, IDEMPOTENT POSTING RPC ============
-- The ONLY sanctioned way to write the ledger (no raw INSERT anywhere). Validates
-- the entry (currency=NGN, >= 2 one-sided non-negative lines against known accounts,
-- balanced > 0), then idempotently inserts the head (ON CONFLICT on the source-event
-- UNIQUE → a replay posts no second entry) and its lines. The deferred trigger above
-- is the backstop; this gives an early, precise failure and the idempotency.
--
-- IDEMPOTENCY KEY CONTRACT: dedup on (source, source_event_id) is TEXT-EXACT. Every
-- caller MUST pass a CANONICAL machine id as p_source_event_id (post_charge_settlement
-- → p_intent_id::text; credit_wallet_topup → p_request_id::text — uuid::text is always
-- lowercase, no whitespace). NEVER pass a human/free-form value: 'EVT-1' vs ' evt-1 '
-- would post distinct entries (a double-post). Keep source_event_id a canonical UUID/id.
create or replace function payments_private.post_ledger_entry(
  p_source text,
  p_source_event_id text,
  p_description text,
  p_currency text,
  p_lines jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_entry_id uuid;
  v_existing uuid;
  v_total_debit bigint := 0;
  v_total_credit bigint := 0;
  v_count int := 0;
  v_line jsonb;
  v_account text;
  v_debit bigint;
  v_credit bigint;
begin
  if upper(coalesce(p_currency, '')) <> 'NGN' then
    raise exception 'ledger currency must be NGN, got %', p_currency using errcode = 'check_violation';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'ledger entry needs >= 2 lines' using errcode = 'check_violation';
  end if;

  for v_line in select value from jsonb_array_elements(p_lines) loop
    v_account := v_line->>'account_code';
    v_debit := coalesce((v_line->>'debit_minor')::bigint, 0);
    v_credit := coalesce((v_line->>'credit_minor')::bigint, 0);
    if not exists (select 1 from public.ledger_accounts where code = v_account) then
      raise exception 'unknown ledger account %', coalesce(v_account, '(null)') using errcode = 'check_violation';
    end if;
    if v_debit < 0 or v_credit < 0 then
      raise exception 'ledger amounts must be non-negative (account %)', v_account using errcode = 'check_violation';
    end if;
    if (v_debit = 0) = (v_credit = 0) then
      raise exception 'a ledger line must be exactly one of debit/credit (account %)', v_account
        using errcode = 'check_violation';
    end if;
    v_total_debit := v_total_debit + v_debit;
    v_total_credit := v_total_credit + v_credit;
    v_count := v_count + 1;
  end loop;

  if v_total_debit <> v_total_credit then
    raise exception 'unbalanced entry: debits=% credits=%', v_total_debit, v_total_credit
      using errcode = 'check_violation';
  end if;
  if v_total_debit <= 0 then
    raise exception 'entry total must be positive' using errcode = 'check_violation';
  end if;

  -- Idempotent head insert. A replayed source event no-ops (returns the existing id).
  insert into public.journal_entries (source, source_event_id, description, currency)
  values (p_source, p_source_event_id, coalesce(p_description, ''), 'NGN')
  on conflict (source, source_event_id) do nothing
  returning id into v_entry_id;

  if v_entry_id is null then
    select id into v_existing from public.journal_entries
      where source = p_source and source_event_id = p_source_event_id;
    return jsonb_build_object('posted', false, 'reason', 'duplicate', 'entry_id', v_existing);
  end if;

  insert into public.journal_lines (entry_id, account_code, debit_minor, credit_minor)
  select v_entry_id, e->>'account_code',
         coalesce((e->>'debit_minor')::bigint, 0), coalesce((e->>'credit_minor')::bigint, 0)
  from jsonb_array_elements(p_lines) e;

  return jsonb_build_object('posted', true, 'entry_id', v_entry_id);
end $$;
revoke all on function payments_private.post_ledger_entry(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function payments_private.post_ledger_entry(text, text, text, text, jsonb) to service_role;

-- ============ D: CHARGE / REFUND SETTLEMENT (wired into apply_payment_webhook) ============
-- Posts the balanced entry for a money-confirming payment edge, in the SAME txn as
-- the status write. The clearing account decouples "money received" (this) from
-- "money allocated" (the wallet top-up edge below), so no edge double-counts cash
-- and apply_payment_webhook needs ZERO knowledge of wallets. Non-money statuses and
-- non-NGN intents no-op (we never post an approximate amount as real).
create or replace function payments_private.post_charge_settlement(p_intent_id uuid, p_new_status text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_amount bigint;
  v_currency text;
begin
  if p_new_status not in ('succeeded', 'refunded') then
    return jsonb_build_object('posted', false, 'reason', 'non_money_status');
  end if;
  select amount_minor, currency into v_amount, v_currency from public.payment_intents where id = p_intent_id;
  if v_amount is null then
    raise exception 'post_charge_settlement: intent % not found', p_intent_id using errcode = 'check_violation';
  end if;
  if upper(coalesce(v_currency, '')) <> 'NGN' then
    -- Settlement runs in NGN; a non-NGN intent has no known NGN amount here. Skip
    -- rather than post an approximation (FX settlement is a later pass).
    return jsonb_build_object('posted', false, 'reason', 'non_base_currency');
  end if;

  if p_new_status = 'succeeded' then
    return payments_private.post_ledger_entry(
      'payment_intent', p_intent_id::text, 'Charge settled', 'NGN',
      jsonb_build_array(
        jsonb_build_object('account_code', 'cash_settlement',   'debit_minor', v_amount, 'credit_minor', 0),
        jsonb_build_object('account_code', 'payments_clearing', 'debit_minor', 0,        'credit_minor', v_amount)
      )
    );
  else -- refunded (reverses the charge: release the clearing hold, money leaves cash)
    return payments_private.post_ledger_entry(
      'payment_intent_refund', p_intent_id::text, 'Refund processed', 'NGN',
      jsonb_build_array(
        jsonb_build_object('account_code', 'payments_clearing', 'debit_minor', v_amount, 'credit_minor', 0),
        jsonb_build_object('account_code', 'cash_settlement',   'debit_minor', 0,        'credit_minor', v_amount)
      )
    );
  end if;
end $$;
revoke all on function payments_private.post_charge_settlement(uuid, text) from public, anon, authenticated;
grant execute on function payments_private.post_charge_settlement(uuid, text) to service_role;

-- Re-create apply_payment_webhook (faithful copy of 20260605123000_payments_private_isolation.sql)
-- with ONE added line: post the balanced settlement entry in the SAME transaction as
-- the status write. Dedup-first / transition-guard / no-attempts-write behavior is
-- unchanged; an illegal transition or a failed ledger post rolls the whole txn back,
-- so a redelivery retries safely and ledger-truth never diverges from money-truth.
create or replace function payments_private.apply_payment_webhook(p_provider text, p_provider_event_id text, p_intent_id uuid, p_new_status text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_affected integer := 0;
begin
  insert into public.processed_webhooks (provider, provider_event_id, intent_id)
  values (p_provider, p_provider_event_id, p_intent_id)
  on conflict (provider, provider_event_id) do nothing;
  get diagnostics v_affected = row_count;
  if v_affected = 0 then
    return jsonb_build_object('applied', false, 'reason', 'duplicate');
  end if;
  update public.payment_intents set status = p_new_status where id = p_intent_id;
  perform payments_private.post_charge_settlement(p_intent_id, p_new_status); -- V3-17: ledger post, same txn
  return jsonb_build_object('applied', true);
end $$;
revoke all on function payments_private.apply_payment_webhook(text, text, uuid, text) from public, anon, authenticated;
grant execute on function payments_private.apply_payment_webhook(text, text, uuid, text) to service_role;

-- ============ E: ATOMIC WALLET TOP-UP CREDIT (Job B money edge → ledger) ============
-- Collapses Job B's balance move + wallet-log write + double-entry post into ONE
-- transaction, so the wallet balance reconciles to the ledger liability BY
-- CONSTRUCTION. Idempotent by construction: one customer_wallet_transactions row per
-- funding request (partial UNIQUE below); a replay no-ops with the current balance.
-- Job B's reconciler keeps its single-winner claim / self-healing recovery / finalize
-- scaffolding and calls this at the credit seam.
--
-- The partial UNIQUE index requires customer_wallet_transactions, which exists in
-- prod but not in the minimal CI grant-invariant DB — create it only when the table
-- is present (the function itself creates fine regardless; plpgsql defers table refs).
do $$ begin
  if to_regclass('public.customer_wallet_transactions') is not null then
    create unique index if not exists customer_wallet_transactions_topup_ref_unique
      on public.customer_wallet_transactions (reference_type, reference_id)
      where reference_type = 'wallet_topup';
  end if;
end $$;

create or replace function payments_private.credit_wallet_topup(
  p_user_id uuid,
  p_request_id uuid,
  p_intent_id uuid,
  p_amount_kobo bigint,
  p_currency text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_inserted int := 0;
  v_balance bigint;
  v_wallet_id uuid;
begin
  if upper(coalesce(p_currency, '')) <> 'NGN' then
    raise exception 'wallet credit currency must be NGN, got %', p_currency using errcode = 'check_violation';
  end if;
  if p_amount_kobo is null or p_amount_kobo <= 0 then
    raise exception 'wallet credit amount must be positive' using errcode = 'check_violation';
  end if;

  insert into public.customer_wallets (user_id) values (p_user_id) on conflict (user_id) do nothing;
  select id into v_wallet_id from public.customer_wallets where user_id = p_user_id;

  -- Idempotency by construction: one credit row per funding request. reference_id is
  -- the table's polymorphic TEXT key — cast the uuid to text explicitly (PG has no
  -- implicit text = uuid operator for the later comparison).
  insert into public.customer_wallet_transactions
    (wallet_id, user_id, type, amount_kobo, balance_after_kobo, description, status, reference_type, reference_id, metadata)
  values
    (v_wallet_id, p_user_id, 'credit', p_amount_kobo, 0, 'Wallet top-up', 'completed', 'wallet_topup', p_request_id::text,
     jsonb_build_object('source', 'wallet_topup_rail', 'payment_intent_id', p_intent_id))
  on conflict (reference_type, reference_id) where reference_type = 'wallet_topup' do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    select balance_kobo into v_balance from public.customer_wallets where user_id = p_user_id;
    return jsonb_build_object('credited', false, 'reason', 'duplicate', 'balance_after_kobo', coalesce(v_balance, 0));
  end if;

  -- The single winner moves the balance (atomic increment) ...
  update public.customer_wallets
     set balance_kobo = balance_kobo + p_amount_kobo, updated_at = now()
   where user_id = p_user_id
   returning balance_kobo into v_balance;

  -- ... backfills the running balance on the wallet log ...
  update public.customer_wallet_transactions
     set balance_after_kobo = v_balance
   where reference_type = 'wallet_topup' and reference_id = p_request_id::text;

  -- ... and posts the balanced double-entry, SAME txn (DR clearing / CR wallet-liability).
  perform payments_private.post_ledger_entry(
    'wallet_topup', p_request_id::text, 'Wallet top-up credit', 'NGN',
    jsonb_build_array(
      jsonb_build_object('account_code', 'payments_clearing',         'debit_minor', p_amount_kobo, 'credit_minor', 0),
      jsonb_build_object('account_code', 'customer_wallet_liability', 'debit_minor', 0,             'credit_minor', p_amount_kobo)
    )
  );

  return jsonb_build_object('credited', true, 'balance_after_kobo', v_balance);
end $$;
revoke all on function payments_private.credit_wallet_topup(uuid, uuid, uuid, bigint, text) from public, anon, authenticated;
grant execute on function payments_private.credit_wallet_topup(uuid, uuid, uuid, bigint, text) to service_role;

-- ============ F: RECONCILIATION (the bedrock check + the FL2 A9 soak gate) ============
-- Global ledger balance: total debits === total credits (delta 0). Per-account
-- balances derive from the lines. The A9 FL2 soak gate halts go-live on delta <> 0.
create or replace function payments_private.ledger_reconciliation()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_debit bigint;
  v_credit bigint;
  v_accounts jsonb;
begin
  select coalesce(sum(debit_minor), 0), coalesce(sum(credit_minor), 0)
    into v_debit, v_credit from public.journal_lines;
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', a.code, 'type', a.type, 'normal_balance', a.normal_balance,
           'debit_minor', coalesce(s.d, 0), 'credit_minor', coalesce(s.c, 0),
           'balance_minor', case when a.normal_balance = 'debit'
                                 then coalesce(s.d, 0) - coalesce(s.c, 0)
                                 else coalesce(s.c, 0) - coalesce(s.d, 0) end
         ) order by a.code), '[]'::jsonb)
    into v_accounts
    from public.ledger_accounts a
    left join (
      select account_code, sum(debit_minor) d, sum(credit_minor) c
      from public.journal_lines group by account_code
    ) s on s.account_code = a.code;
  return jsonb_build_object(
    'total_debit_minor', v_debit,
    'total_credit_minor', v_credit,
    'delta_minor', v_debit - v_credit,
    'balanced', v_debit = v_credit,
    'accounts', v_accounts
  );
end $$;
revoke all on function payments_private.ledger_reconciliation() from public, anon, authenticated;
grant execute on function payments_private.ledger_reconciliation() to service_role;

-- Wallet projection reconciliation: the wallet balance total must equal the ledger's
-- customer_wallet_liability balance (the wallet is a PROJECTION of the ledger).
create or replace function payments_private.wallet_ledger_reconciliation()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_wallet_total bigint;
  v_ledger_liability bigint;
begin
  select coalesce(sum(balance_kobo), 0) into v_wallet_total from public.customer_wallets;
  -- customer_wallet_liability is credit-normal: balance = credits - debits.
  select coalesce(sum(credit_minor), 0) - coalesce(sum(debit_minor), 0)
    into v_ledger_liability
    from public.journal_lines where account_code = 'customer_wallet_liability';
  return jsonb_build_object(
    'wallet_balance_total_kobo', v_wallet_total,
    'ledger_wallet_liability_kobo', v_ledger_liability,
    'delta_kobo', v_wallet_total - v_ledger_liability,
    'reconciled', v_wallet_total = v_ledger_liability
  );
end $$;
revoke all on function payments_private.wallet_ledger_reconciliation() from public, anon, authenticated;
grant execute on function payments_private.wallet_ledger_reconciliation() to service_role;

-- ============ RLS — staff read-only; writes ONLY via the SECURITY DEFINER RPCs ============
alter table public.ledger_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines  enable row level security;

drop policy if exists ledger_accounts_select_staff on public.ledger_accounts;
create policy ledger_accounts_select_staff on public.ledger_accounts
  for select to authenticated using (public.is_platform_staff());

drop policy if exists journal_entries_select_staff on public.journal_entries;
create policy journal_entries_select_staff on public.journal_entries
  for select to authenticated using (public.is_platform_staff());

drop policy if exists journal_lines_select_staff on public.journal_lines;
create policy journal_lines_select_staff on public.journal_lines
  for select to authenticated using (public.is_platform_staff());

-- NO insert/update/delete policy on any ledger table: posting is only through the
-- guarded payments_private RPCs (SECURITY DEFINER, RLS-exempt as owner). Immutability
-- triggers reject UPDATE/DELETE even from the owner.

-- Defense in depth (adversarial-review finding, V3-17): strip Supabase's default
-- blanket table-level DML grants so writes flow ONLY through the SECURITY DEFINER
-- RPCs (which insert as the table owner, unaffected by these grants). Without this,
-- the immutability/balance triggers would be the SOLE guard against a direct write by
-- service_role, and a future stray INSERT policy would expose the wide default grants
-- to anon/authenticated. SELECT is left intact (RLS still gates anon/authenticated to
-- is_platform_staff; service_role reads for finance/V3-22). Not FORCE RLS: on Supabase
-- postgres is not a true superuser, so forcing RLS would block the definer post path.
revoke insert, update, delete, truncate on public.ledger_accounts from anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.journal_entries from anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.journal_lines  from anon, authenticated, service_role;
