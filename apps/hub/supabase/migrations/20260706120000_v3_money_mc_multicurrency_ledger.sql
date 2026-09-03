-- V3-MONEY-MC — Multi-currency, in-currency ledger (M1a: schema + RPCs + reconciliation).
--
-- Design: docs/v3/money/2026-07-05-multi-currency-in-currency-ledger-design.md
-- (owner-approved, "full in-currency ledger"; USD first, provider settles in-currency).
--
-- The principle: every journal entry stays in ONE currency and its lines balance in that
-- currency. The books become a set of per-currency ledgers that never touch each other. NGN is
-- unchanged; USD (or any enabled currency) lives in its own balanced column. `DR = CR` is never
-- asked to police an exchange rate. The whole corruption surface collapses to a single rule —
-- NEVER sum minor units across currencies — which lives in exactly one place (ledger_reconciliation).
--
-- ADDITIVE + INERT. This migration only WIDENS what may post: it removes the NGN-only check and
-- makes the posting RPCs currency-aware. No non-NGN entry can actually be posted until the rail
-- is wired (M1b, behind the empty CHARGE_CURRENCIES allowlist) AND the owner enables a currency.
-- An NGN-only database behaves byte-for-byte as today. Money-safety unchanged: the deferred
-- balance trigger, immutability, append-only, idempotency and GRANT lockdown are all untouched.
--
-- PRODUCTION MIRROR of packages/payment-router/src/ledger.ts (currency-neutral line math + the
-- ISO-4217 currency guard). Apply to prod dry-run-first (the "I prove, you settle" discipline).

-- ============ 1. WIDEN THE CURRENCY CHECK: NGN-only → any valid ISO-4217 code ============
-- Existing NGN rows pass; nothing is rewritten. Uppercase 3-letter is the ISO-4217 shape; the
-- CHARGE_CURRENCIES allowlist (app layer) is what actually gates which currencies may be charged.
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'journal_entries_currency_base') then
    alter table public.journal_entries drop constraint journal_entries_currency_base;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'journal_entries_currency_iso') then
    alter table public.journal_entries add constraint journal_entries_currency_iso
      check (currency ~ '^[A-Z]{3}$');
  end if;
end $$;

-- ============ 2. post_ledger_entry — accept any valid ISO-4217; tag the entry with it ============
-- Every other guard is unchanged (>= 2 one-sided non-negative lines against known accounts,
-- balanced > 0, idempotent on the source-event UNIQUE). The only change: the currency is no
-- longer hard-coded to NGN — it is validated as ISO-4217 and stored on the entry, so the entry's
-- own currency scopes its lines.
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
  -- Validate the RAW currency (never upper()-coerce first): a lowercase 'usd' must be REJECTED,
  -- not silently normalized, so the RPC agrees with the table CHECK, the TS mirror
  -- (isValidLedgerCurrency), and the design's "valid UPPERCASE ISO-4217" rule. Every NGN caller
  -- passes the literal 'NGN' or an already-validated code, so no NGN path regresses.
  v_currency text := coalesce(p_currency, '');
  v_total_debit bigint := 0;
  v_total_credit bigint := 0;
  v_count int := 0;
  v_line jsonb;
  v_account text;
  v_debit bigint;
  v_credit bigint;
begin
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'ledger currency must be a valid ISO-4217 code, got %', p_currency using errcode = 'check_violation';
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
  values (p_source, p_source_event_id, coalesce(p_description, ''), v_currency)
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

-- ============ 3. post_charge_settlement — post in the intent's OWN currency ============
-- Faithful copy of the V3-19 version, with the multi-currency change from §3.4 of the design:
--   * remove the non-NGN SKIP — post the settlement in the intent's own (ISO-4217) currency;
--   * the statutory Nigerian 7.5% fee-VAT decomposition applies ONLY when currency = NGN. A
--     provider-REPORTED fee VAT is honoured for any currency; a foreign fee with no reported
--     VAT breakdown posts the whole fee to processor_fees (NEVER a fabricated Nigerian split).
-- `v_cash = v_amount - v_fee`, all in the entry currency. Refunds still route to
-- apply_refund_webhook. Every other guard is unchanged.
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
  -- Statutory Nigeria VAT rate. MIRRORS @henryco/config TAX.vat.standardRate. Used ONLY to split
  -- a VAT-inclusive fee for the NGN base currency when the provider did not itemise the VAT.
  v_vat_rate constant numeric := 0.075;
  v_lines jsonb;
begin
  if p_new_status = 'refunded' then
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
  -- Validate the intent's currency RAW (fail loud on a malformed code rather than normalize it):
  -- a real intent always carries a valid uppercase ISO-4217 code from the rail.
  v_currency := coalesce(v_currency, '');
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'post_charge_settlement: intent % has an invalid currency %', p_intent_id, v_currency
      using errcode = 'check_violation';
  end if;

  -- succeeded with no known fee → the plain gross-to-cash entry (never fabricate), in-currency.
  if v_fee = 0 then
    return payments_private.post_ledger_entry(
      'payment_intent', p_intent_id::text, 'Charge settled', v_currency,
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

  -- Resolve the fee-VAT portion. Priority: provider-reported (any currency) → statutory NGN
  -- decomposition (base currency only) → none (a foreign fee never gets a fabricated NG split).
  if p_fee_vat_minor is not null then
    if p_fee_vat_minor < 0 or p_fee_vat_minor > v_fee then
      raise exception 'post_charge_settlement: fee VAT % out of range for fee % (intent %)', p_fee_vat_minor, v_fee, p_intent_id
        using errcode = 'check_violation';
    end if;
    v_fee_vat := p_fee_vat_minor;
  elsif v_currency = 'NGN' then
    v_fee_vat := (v_fee - round(v_fee / (1 + v_vat_rate)))::bigint;
  else
    v_fee_vat := 0;
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

  return payments_private.post_ledger_entry('payment_intent', p_intent_id::text, 'Charge settled (fee absorbed)', v_currency, v_lines);
end $$;
revoke all on function payments_private.post_charge_settlement(uuid, text, bigint, bigint) from public, anon, authenticated;
grant execute on function payments_private.post_charge_settlement(uuid, text, bigint, bigint) to service_role;

-- ============ 4. ledger_reconciliation — per-currency (the one corruption surface) ============
-- The GLOBAL scalar totals stay (every entry balances, so global debits = credits holds across
-- currencies — the global `balanced` flag survives). The global per-account `accounts` list is
-- kept for backward-compat and is CORRECT for a single-currency (today's NGN-only) database, but
-- it is the ONE place that would add USD cents to NGN kobo once a second currency is live —
-- consumers MUST read the new per-currency `currencies[]` view before any currency is enabled.
--
-- `currencies[]` is the money-correct view: one row per currency, each balancing independently,
-- each with its own per-account balances. NEVER sum minor units across these rows.
create or replace function payments_private.ledger_reconciliation()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_debit bigint;
  v_credit bigint;
  v_accounts jsonb;
  v_currencies jsonb;
begin
  -- Global scalar totals (valid across currencies: each entry is internally balanced).
  select coalesce(sum(debit_minor), 0), coalesce(sum(credit_minor), 0)
    into v_debit, v_credit from public.journal_lines;

  -- Global per-account (single-currency-correct; deprecated for multi-currency — see header).
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

  -- Per-currency: one balanced ledger per currency, with its own per-account balances. The
  -- per-account sums are scoped to the currency via the entry join, so no cross-currency mixing.
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'currency', t.currency,
             'total_debit_minor', t.d,
             'total_credit_minor', t.c,
             'delta_minor', t.d - t.c,
             'balanced', t.d = t.c,
             'accounts', (
               select coalesce(jsonb_agg(jsonb_build_object(
                        'code', a.code, 'type', a.type, 'normal_balance', a.normal_balance,
                        'debit_minor', coalesce(s2.d, 0), 'credit_minor', coalesce(s2.c, 0),
                        'balance_minor', case when a.normal_balance = 'debit'
                                              then coalesce(s2.d, 0) - coalesce(s2.c, 0)
                                              else coalesce(s2.c, 0) - coalesce(s2.d, 0) end
                      ) order by a.code), '[]'::jsonb)
               from public.ledger_accounts a
               left join (
                 select jl.account_code, sum(jl.debit_minor) d, sum(jl.credit_minor) c
                 from public.journal_lines jl
                 join public.journal_entries je2 on je2.id = jl.entry_id
                 where je2.currency = t.currency
                 group by jl.account_code
               ) s2 on s2.account_code = a.code
             )
           ) order by t.currency), '[]'::jsonb)
    into v_currencies
    from (
      select je.currency, coalesce(sum(jl.debit_minor), 0) d, coalesce(sum(jl.credit_minor), 0) c
      from public.journal_entries je
      join public.journal_lines jl on jl.entry_id = je.id
      group by je.currency
    ) t;

  return jsonb_build_object(
    'total_debit_minor', v_debit,
    'total_credit_minor', v_credit,
    'delta_minor', v_debit - v_credit,
    'balanced', v_debit = v_credit,
    'accounts', v_accounts,
    'currencies', v_currencies
  );
end $$;
revoke all on function payments_private.ledger_reconciliation() from public, anon, authenticated;
grant execute on function payments_private.ledger_reconciliation() to service_role;
