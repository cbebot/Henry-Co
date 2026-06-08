-- V3-VAT-01 — VAT made strong on the V3-17 double-entry ledger.
--
-- Two VATs, modelled exactly and ledger-grounded:
--   - OUTPUT VAT we collect on a VATable sale → a liability owed to FIRS
--     (vat_output_payable), recognised when revenue is (Phase 2b: post_sale_revenue).
--   - INPUT/FEE VAT on the processor fee the owner ABSORBS → a recoverable asset
--     (fee_vat_recoverable), recognised at settlement (Phase 1: post_charge_settlement,
--     now fee-aware). Net settlement = gross − fee; the fee is the REAL number the
--     provider deducted (threaded in by the routes), never assumed.
-- Plus an exact, ledger-sourced net-VAT reconciliation and a refund-ready structure.
--
-- PRODUCTION MIRROR of packages/payment-router/src/ledger.ts (the chart + the line
-- builders) and @henryco/pricing (the VAT math). Every entry stays BALANCED (the
-- V3-17 deferred trigger + the in-process assertBalanced both still hold), APPEND-ONLY,
-- and IDEMPOTENT. Splitting the settlement DEBIT keeps the debit TOTAL = gross, so the
-- V3-18 receipt tie (receipt total = charge posting debit total) and the wallet
-- projection reconciliation are untouched.
--
-- COMMITTED-NOT-APPLIED. Lands at FL2 after the ledger + documents migrations, owner-
-- driven. Apply order at FL2:
--   20260529120000_payment_intents.sql
--   20260605123000_payments_private_isolation.sql
--   20260607120000_double_entry_ledger.sql
--   20260607130000_v3_18_payment_documents.sql
--   20260607140000_v3_vat_01_settlement_vat.sql            (THIS — depends on all above)
-- Do NOT apply to prod here. Proven on a fresh Postgres 17 (the payments-grant-invariant
-- CI job → vat_invariants.sql + vat_grant_invariant.sql, and the docker harness).
--
-- Amounts are kobo BIGINT — never float. A VAT split is always (ex-VAT, remainder), so
-- the parts reconcile to the whole exactly (no independent rounding posted as real).

-- payments_private already exists after the prior migrations; create idempotently so
-- this migration is also self-standing on a fresh DB.
create schema if not exists payments_private;
revoke all on schema payments_private from public;
revoke usage on schema payments_private from anon, authenticated;
grant usage on schema payments_private to service_role;

-- ============ CHART: the two VATs, explicit (replaces the V3-17 vat_payable placeholder) ============
insert into public.ledger_accounts (code, type, normal_balance, label) values
  ('vat_output_payable',  'liability', 'credit', 'VAT output payable (collected on sales, owed to FIRS)'),
  ('fee_vat_recoverable', 'asset',     'debit',  'Input VAT recoverable (on processor fees)')
on conflict (code) do nothing;

-- Retire the never-posted V3-17 placeholder — only when nothing references it (always
-- true on a fresh DB; a no-op if it has somehow been used, keeping the ledger intact).
delete from public.ledger_accounts a
 where a.code = 'vat_payable'
   and not exists (select 1 from public.journal_lines l where l.account_code = 'vat_payable');

-- ============ A: CHARGE / REFUND SETTLEMENT — now fee + fee-VAT aware ============
-- Succeeded: split the DEBIT side by the REAL processor fee the owner absorbs —
--   DR cash_settlement      net   (= gross − fee)        the amount that actually settles
--   DR processor_fees       fee − feeVat                 the fee expense (ex-VAT)
--   DR fee_vat_recoverable  feeVat                       input VAT we can reclaim
--   CR payments_clearing    gross                        the obligation the customer paid
-- The CREDIT (and so the debit TOTAL) stays the gross → the V3-18 receipt tie + wallet
-- reconciliation are unchanged. Fee unknown (0/null) → plain gross-to-cash (the V3-17
-- behaviour); we never fabricate a fee. Refunded reverses the gross (fee/VAT reversal on
-- a refund is V3-19's job — the absorbed fee is usually not refunded by the provider).
--
-- Signature gains the fee params with DEFAULTS, so every existing 2-arg caller still
-- resolves here (PG fills the defaults). The old (uuid, text) form is dropped first.
drop function if exists payments_private.post_charge_settlement(uuid, text);
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
  if p_new_status not in ('succeeded', 'refunded') then
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

  if p_new_status = 'refunded' then
    return payments_private.post_ledger_entry(
      'payment_intent_refund', p_intent_id::text, 'Refund processed', 'NGN',
      jsonb_build_array(
        jsonb_build_object('account_code', 'payments_clearing', 'debit_minor', v_amount, 'credit_minor', 0),
        jsonb_build_object('account_code', 'cash_settlement',   'debit_minor', 0,        'credit_minor', v_amount)
      )
    );
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

-- Re-create apply_payment_webhook with the fee params threaded through to the settlement
-- post (SAME txn). DEFAULTS keep every existing 4-arg caller resolving here. Dedup-first
-- / transition-guard behaviour is otherwise unchanged from the ledger migration.
drop function if exists payments_private.apply_payment_webhook(text, text, uuid, text);
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

-- ============ B: SALE REVENUE RECOGNITION (Phase 2b — output VAT on a VATable sale) ============
-- The Phase-2 allocation for a DIRECT sale: move clearing into revenue, splitting out
-- the output VAT collected for FIRS:
--   DR payments_clearing  gross
--   CR platform_revenue   gross − outputVat   (revenue, ex-VAT)
--   CR vat_output_payable outputVat           (liability owed to FIRS; omitted when 0)
-- Idempotent on (source='sale_revenue', source_event_id). This is the primitive the
-- shared settlement-posting path (V3-16) calls for a sale; a wallet top-up is NOT a sale
-- and continues to use credit_wallet_topup (no output VAT). REFUND-READY: a sale refund
-- (V3-19) reverses this entry, which cleanly reverses the output VAT too.
create or replace function payments_private.post_sale_revenue(
  p_source_event_id text,
  p_gross_minor bigint,
  p_output_vat_minor bigint
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_vat bigint := greatest(coalesce(p_output_vat_minor, 0), 0);
  v_revenue bigint;
  v_lines jsonb;
begin
  if p_gross_minor is null or p_gross_minor <= 0 then
    raise exception 'post_sale_revenue: gross must be positive, got %', p_gross_minor using errcode = 'check_violation';
  end if;
  if v_vat >= p_gross_minor then
    raise exception 'post_sale_revenue: output VAT % must be < gross %', v_vat, p_gross_minor using errcode = 'check_violation';
  end if;
  v_revenue := p_gross_minor - v_vat;
  v_lines := jsonb_build_array(
    jsonb_build_object('account_code', 'payments_clearing', 'debit_minor', p_gross_minor, 'credit_minor', 0),
    jsonb_build_object('account_code', 'platform_revenue',  'debit_minor', 0,             'credit_minor', v_revenue)
  );
  if v_vat > 0 then
    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account_code', 'vat_output_payable', 'debit_minor', 0, 'credit_minor', v_vat));
  end if;
  return payments_private.post_ledger_entry('sale_revenue', p_source_event_id, 'Sale revenue recognised', 'NGN', v_lines);
end $$;
revoke all on function payments_private.post_sale_revenue(text, bigint, bigint) from public, anon, authenticated;
grant execute on function payments_private.post_sale_revenue(text, bigint, bigint) to service_role;

-- ============ C: VAT RECONCILIATION (net VAT payable to FIRS over a period) ============
-- Ledger-sourced, exact. Output VAT collected (net of any refund reversal) minus the
-- recoverable input/fee VAT = the net VAT payable. The seed of FIRS filing (the form +
-- finance UI are V3-21/V3-22). Period filter on the entry posted_at, half-open [from, to).
create or replace function payments_private.vat_reconciliation(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_output bigint;  -- net CREDIT to vat_output_payable (collected − reversed)
  v_input bigint;   -- net DEBIT to fee_vat_recoverable (recoverable − reversed)
begin
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'vat_reconciliation: invalid period [%, %)', p_from, p_to using errcode = 'check_violation';
  end if;
  select coalesce(sum(l.credit_minor), 0) - coalesce(sum(l.debit_minor), 0)
    into v_output
    from public.journal_lines l
    join public.journal_entries e on e.id = l.entry_id
   where l.account_code = 'vat_output_payable'
     and e.posted_at >= p_from and e.posted_at < p_to;
  select coalesce(sum(l.debit_minor), 0) - coalesce(sum(l.credit_minor), 0)
    into v_input
    from public.journal_lines l
    join public.journal_entries e on e.id = l.entry_id
   where l.account_code = 'fee_vat_recoverable'
     and e.posted_at >= p_from and e.posted_at < p_to;
  return jsonb_build_object(
    'period_start', p_from,
    'period_end', p_to,
    'output_vat_collected_minor', v_output,
    'input_vat_recoverable_minor', v_input,
    'net_vat_payable_minor', v_output - v_input,
    'currency', 'NGN'
  );
end $$;
revoke all on function payments_private.vat_reconciliation(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function payments_private.vat_reconciliation(timestamptz, timestamptz) to service_role;
