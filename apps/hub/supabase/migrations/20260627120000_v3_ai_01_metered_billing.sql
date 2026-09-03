-- ============================================================================
-- V3-AI-01 — Henry Onyx Intelligence: metered wallet/ledger billing
--
-- The money core for the governed AI gateway. Adds, ALONGSIDE the existing money
-- spine (nothing existing is altered):
--   * 2 new tables  : customer_wallet_ai_holds (reservations), ai_usage_events (record)
--   * 3 new chart rows: ai_provider_cost, provider_payable, vat_output_payable (defensive)
--   * 3 new guarded RPCs in payments_private: reserve / settle / release
--   * 1 governed rate-card row in pricing_rule_books (division='ai')
--
-- DISCIPLINE (mirrors V3-17 double_entry_ledger.sql + V3-19 refunds):
--   * Amounts are kobo BIGINT. Never float. NGN settlement only (FX is display-only).
--   * The settle RPC is the ONLY wallet writer: SELECT … FOR UPDATE, never-negative
--     assert, debit, transaction row, BALANCED double-entry ledger post, hold settle —
--     all in ONE transaction. Idempotent on the hold (replay = one charge / one post).
--   * The two RPCs are SECURITY DEFINER, search_path pinned, executable ONLY by
--     service_role (revoke from public, anon, authenticated). They live in the
--     non-PostgREST-exposed payments_private schema — unreachable via /rest/v1/rpc/.
--   * New tables are RLS default-deny; direct DML is revoked; writes flow only through
--     the SECURITY DEFINER RPCs (owner path). NOT FORCE RLS (Supabase owner ≠ superuser).
--
-- COMMITTED-NOT-APPLIED. Applies at FL2, AFTER (in order):
--   payment_intents → payments_private_isolation → double_entry_ledger →
--   v3_vat_01_settlement_vat → fl2_wallet_rail_completion → v3_19_refunds → THIS.
-- Prove on a throwaway Postgres/PGlite, never on prod from a worktree.
-- ============================================================================

-- (gen_random_uuid() is core Postgres ≥13 — no extension required, matching the ledger.)

-- ---------------------------------------------------------------------------
-- 1. Chart additions. ai_provider_cost / provider_payable recognise provider COGS
--    separately when the provider invoices the company (DR ai_provider_cost /
--    CR provider_payable) — NOT carved at point of sale. vat_output_payable is
--    inserted defensively (it already exists from v3_vat_01); ON CONFLICT makes that
--    a no-op, and guarantees the account is present on a throwaway proof DB.
--    normal_balance MUST match type per the ledger's consistency CHECK.
-- ---------------------------------------------------------------------------
insert into public.ledger_accounts (code, type, normal_balance, label) values
  ('ai_provider_cost', 'expense',   'debit',  'AI provider cost (COGS)'),
  ('provider_payable', 'liability', 'credit', 'AI provider payable'),
  ('vat_output_payable','liability','credit', 'VAT output payable (collected on sales, owed to FIRS)')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 2. customer_wallet_ai_holds — pre-flight reservations (kobo). Available balance is
--    computed read-time as balance − Σ(holds where status='held' AND expires_at > now()),
--    so an abandoned/crashed call's hold stops counting automatically.
-- ---------------------------------------------------------------------------
create table if not exists public.customer_wallet_ai_holds (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.customer_wallets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  estimate_kobo bigint not null check (estimate_kobo > 0),
  status text not null default 'held' check (status in ('held','settled','released')),
  idempotency_key text not null,
  surface text not null,
  tier text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint customer_wallet_ai_holds_idempotency_key_unique unique (idempotency_key)
);
create index if not exists customer_wallet_ai_holds_user_active_idx
  on public.customer_wallet_ai_holds (user_id, status, expires_at);

-- ---------------------------------------------------------------------------
-- 3. ai_usage_events — the immutable per-call money record (BIGINT kobo). One row per
--    settled charge; id is also the ledger source_event_id. unique(hold_id) is the
--    idempotency anchor: one settlement per hold. total = cost + margin + vat (enforced).
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hold_id uuid not null references public.customer_wallet_ai_holds(id) on delete restrict,
  surface text not null,
  tier text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cache_read_tokens integer not null default 0 check (cache_read_tokens >= 0),
  cache_write_tokens integer not null default 0 check (cache_write_tokens >= 0),
  calls integer not null default 1 check (calls >= 1),
  cost_kobo bigint not null check (cost_kobo >= 0),
  margin_kobo bigint not null check (margin_kobo >= 0),
  vat_kobo bigint not null check (vat_kobo >= 0),
  total_kobo bigint not null check (total_kobo > 0),
  rule_book_key text not null,
  rule_version text not null,
  status text not null default 'settled' check (status in ('settled','refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_usage_events_hold_unique unique (hold_id),
  constraint ai_usage_events_total_balanced check (total_kobo = cost_kobo + margin_kobo + vat_kobo)
);
create index if not exists ai_usage_events_user_idx on public.ai_usage_events (user_id, created_at);

-- Exactly-once wallet debit per usage event (defense in depth alongside the hold unique).
create unique index if not exists customer_wallet_transactions_ai_usage_ref_unique
  on public.customer_wallet_transactions (reference_type, reference_id)
  where reference_type = 'ai_usage';

-- ---------------------------------------------------------------------------
-- 4. RLS default-deny. RLS ON; Supabase auto-granted DML stripped; writes only via the
--    SECURITY DEFINER RPCs (owner path). NOT FORCE RLS (owner must keep the write path).
-- ---------------------------------------------------------------------------
alter table public.ai_usage_events enable row level security;
alter table public.customer_wallet_ai_holds enable row level security;

-- ai_usage_events: a user may read their OWN usage (the Pass-3 dashboard); no writes.
-- The SELECT grant is EXPLICIT (not relying on Supabase's implicit default privileges —
-- the SEC-HARDEN-06 footgun); RLS then gates it to the owner's own rows.
revoke all on public.ai_usage_events from anon;
revoke insert, update, delete, truncate on public.ai_usage_events from authenticated, service_role;
grant select on public.ai_usage_events to authenticated;
drop policy if exists ai_usage_events_select_own on public.ai_usage_events;
create policy ai_usage_events_select_own on public.ai_usage_events
  for select to authenticated
  using (user_id = (select auth.uid()));

-- customer_wallet_ai_holds: transient internal state — no user-facing read, no direct DML.
revoke all on public.customer_wallet_ai_holds from anon, authenticated;
revoke insert, update, delete, truncate on public.customer_wallet_ai_holds from service_role;

-- ---------------------------------------------------------------------------
-- 5a. reserve_wallet_for_ai_usage — atomic, guarded, pre-paid reservation.
--     Refuses (insufficient_funds) when available < estimate, so the provider is never
--     called. Idempotent on idempotency_key. The wallet row is locked AND touched to
--     serialize concurrent reserves correctly under any isolation level (the V3-19
--     write-write-conflict lesson).
-- ---------------------------------------------------------------------------
create or replace function payments_private.reserve_wallet_for_ai_usage(
  p_user_id uuid,
  p_estimate_kobo bigint,
  p_idempotency_key text,
  p_surface text,
  p_tier text,
  p_expires_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_wallet_id uuid;
  v_balance bigint;
  v_held bigint;
  v_available bigint;
  v_existing uuid;
  v_hold_id uuid;
begin
  if p_estimate_kobo is null or p_estimate_kobo <= 0 then
    return jsonb_build_object('reserved', false, 'reason', 'invalid_estimate');
  end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
    return jsonb_build_object('reserved', false, 'reason', 'missing_idempotency_key');
  end if;

  -- Idempotency: an existing hold for this key is returned unchanged.
  select id into v_existing
    from public.customer_wallet_ai_holds
   where idempotency_key = p_idempotency_key;
  if v_existing is not null then
    return jsonb_build_object('reserved', true, 'hold_id', v_existing);
  end if;

  -- Lock the wallet row (serialization point), then force a write-write conflict so two
  -- concurrent reserves can never both pass the available check on a stale snapshot.
  select id, balance_kobo into v_wallet_id, v_balance
    from public.customer_wallets
   where user_id = p_user_id
   for update;
  if v_wallet_id is null then
    return jsonb_build_object('reserved', false, 'reason', 'insufficient_funds', 'available_kobo', 0);
  end if;
  update public.customer_wallets set updated_at = now() where id = v_wallet_id;

  select coalesce(sum(estimate_kobo), 0) into v_held
    from public.customer_wallet_ai_holds
   where user_id = p_user_id and status = 'held' and expires_at > now();
  v_available := v_balance - v_held;

  if v_available < p_estimate_kobo then
    return jsonb_build_object('reserved', false, 'reason', 'insufficient_funds', 'available_kobo', v_available);
  end if;

  insert into public.customer_wallet_ai_holds
    (wallet_id, user_id, estimate_kobo, status, idempotency_key, surface, tier, expires_at)
  values
    (v_wallet_id, p_user_id, p_estimate_kobo, 'held', p_idempotency_key, p_surface, p_tier,
     coalesce(p_expires_at, now() + interval '5 minutes'))
  on conflict (idempotency_key) do nothing
  returning id into v_hold_id;

  if v_hold_id is null then
    select id into v_hold_id from public.customer_wallet_ai_holds where idempotency_key = p_idempotency_key;
  end if;

  return jsonb_build_object('reserved', true, 'hold_id', v_hold_id);
end;
$$;

revoke all     on function payments_private.reserve_wallet_for_ai_usage(uuid, bigint, text, text, text, timestamptz) from public, anon, authenticated;
grant  execute on function payments_private.reserve_wallet_for_ai_usage(uuid, bigint, text, text, text, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- 5b. post_ai_usage_charge — atomic, guarded, idempotent settlement. Debits the wallet
--     AND posts the balanced double-entry ledger entry, in ONE transaction. Charge is
--     hard-capped at the reservation (the user is never billed above the quote). Replay
--     on a settled hold returns the prior result with no second debit/post.
--       DR customer_wallet_liability(total)
--       CR platform_revenue(cost+margin)
--       CR vat_output_payable(vat)            -- omitted when vat = 0 (else a zero line
--                                                 violates the journal one-sided CHECK)
-- ---------------------------------------------------------------------------
create or replace function payments_private.post_ai_usage_charge(
  p_hold_id uuid,
  p_user_id uuid,
  p_surface text,
  p_tier text,
  p_cost_kobo bigint,
  p_margin_kobo bigint,
  p_vat_kobo bigint,
  p_usage jsonb,
  p_rule_book_key text,
  p_rule_version text,
  p_breakdown jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total   bigint := coalesce(p_cost_kobo, 0) + coalesce(p_margin_kobo, 0) + coalesce(p_vat_kobo, 0);
  v_revenue bigint := coalesce(p_cost_kobo, 0) + coalesce(p_margin_kobo, 0);
  v_hold    public.customer_wallet_ai_holds%rowtype;
  v_existing public.ai_usage_events%rowtype;
  v_wallet_id uuid;
  v_balance bigint;
  v_event_id uuid;
  v_lines jsonb;
begin
  if coalesce(p_cost_kobo, 0) < 0 or coalesce(p_margin_kobo, 0) < 0 or coalesce(p_vat_kobo, 0) < 0 then
    raise exception 'post_ai_usage_charge: negative amount' using errcode = 'check_violation';
  end if;
  if v_total <= 0 then
    return jsonb_build_object('settled', false, 'reason', 'zero_total');
  end if;

  -- Lock the hold (serialises concurrent settles for the same hold).
  select * into v_hold from public.customer_wallet_ai_holds where id = p_hold_id for update;
  if v_hold.id is null then
    return jsonb_build_object('settled', false, 'reason', 'unknown_hold');
  end if;
  if v_hold.user_id is distinct from p_user_id then
    return jsonb_build_object('settled', false, 'reason', 'hold_user_mismatch');
  end if;

  -- Idempotency: a settled hold returns its prior result, no second debit/post.
  select * into v_existing from public.ai_usage_events where hold_id = p_hold_id;
  if v_existing.id is not null then
    return jsonb_build_object(
      'settled', true, 'duplicate', true,
      'usage_event_id', v_existing.id,
      'total_kobo', v_existing.total_kobo,
      'balance_after_kobo', (select balance_kobo from public.customer_wallets where id = v_hold.wallet_id)
    );
  end if;

  -- Structural prepaid guarantee: never charge above the reservation.
  if v_total > v_hold.estimate_kobo then
    return jsonb_build_object('settled', false, 'reason', 'exceeds_reservation',
      'reserved_kobo', v_hold.estimate_kobo, 'requested_kobo', v_total);
  end if;

  -- Lock the wallet, never-negative assert, debit.
  select id, balance_kobo into v_wallet_id, v_balance
    from public.customer_wallets where id = v_hold.wallet_id for update;
  if v_wallet_id is null then
    return jsonb_build_object('settled', false, 'reason', 'wallet_missing');
  end if;
  if v_balance < v_total then
    return jsonb_build_object('settled', false, 'reason', 'insufficient_funds', 'available_kobo', v_balance);
  end if;

  v_event_id := gen_random_uuid();

  update public.customer_wallets
     set balance_kobo = balance_kobo - v_total, updated_at = now()
   where id = v_wallet_id
   returning balance_kobo into v_balance;

  insert into public.customer_wallet_transactions
    (wallet_id, user_id, type, amount_kobo, balance_after_kobo, description, status,
     reference_type, reference_id, division, metadata)
  values
    (v_wallet_id, p_user_id, 'debit', v_total, v_balance, 'Henry Onyx Intelligence usage', 'completed',
     'ai_usage', v_event_id::text, 'ai', coalesce(p_breakdown, '{}'::jsonb));

  insert into public.ai_usage_events
    (id, user_id, hold_id, surface, tier,
     input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, calls,
     cost_kobo, margin_kobo, vat_kobo, total_kobo, rule_book_key, rule_version, status, metadata)
  values
    (v_event_id, p_user_id, p_hold_id, p_surface, p_tier,
     coalesce((p_usage->>'inputTokens')::int, 0),
     coalesce((p_usage->>'outputTokens')::int, 0),
     coalesce((p_usage->>'cacheReadTokens')::int, 0),
     coalesce((p_usage->>'cacheWriteTokens')::int, 0),
     coalesce((p_usage->>'calls')::int, 1),
     p_cost_kobo, p_margin_kobo, p_vat_kobo, v_total, p_rule_book_key, p_rule_version, 'settled',
     coalesce(p_breakdown, '{}'::jsonb));

  -- Balanced double-entry (DR == CR). VAT leg omitted when 0.
  v_lines := jsonb_build_array(
    jsonb_build_object('account_code', 'customer_wallet_liability', 'debit_minor', v_total,   'credit_minor', 0),
    jsonb_build_object('account_code', 'platform_revenue',         'debit_minor', 0,         'credit_minor', v_revenue)
  );
  if p_vat_kobo > 0 then
    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account_code', 'vat_output_payable', 'debit_minor', 0, 'credit_minor', p_vat_kobo));
  end if;

  perform payments_private.post_ledger_entry('ai_usage', v_event_id::text, 'AI usage', 'NGN', v_lines);

  update public.customer_wallet_ai_holds set status = 'settled' where id = p_hold_id;

  return jsonb_build_object(
    'settled', true, 'duplicate', false,
    'usage_event_id', v_event_id,
    'total_kobo', v_total,
    'balance_after_kobo', v_balance
  );
end;
$$;

revoke all     on function payments_private.post_ai_usage_charge(uuid, uuid, text, text, bigint, bigint, bigint, jsonb, text, text, jsonb) from public, anon, authenticated;
grant  execute on function payments_private.post_ai_usage_charge(uuid, uuid, text, text, bigint, bigint, bigint, jsonb, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 5c. release_wallet_ai_hold — free a hold's reserved remainder without charging (a
--     provider failure / refusal). Idempotent; never touches the balance.
-- ---------------------------------------------------------------------------
create or replace function payments_private.release_wallet_ai_hold(p_hold_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  update public.customer_wallet_ai_holds
     set status = 'released'
   where id = p_hold_id and status = 'held'
   returning status into v_status;
  return jsonb_build_object('released', v_status is not null);
end;
$$;

revoke all     on function payments_private.release_wallet_ai_hold(uuid) from public, anon, authenticated;
grant  execute on function payments_private.release_wallet_ai_hold(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Seed the governed AI rate card (division='ai'). Tunable live. RECONCILED (owner
--    decision, 2026-07-03): per-token rates equal the live provider list price for the
--    model routed to each tier at ~₦1,600/USD, so the ai_compute ledger line is TRUE
--    provider cost (COGS). Margins carry the pricing posture: fast/standard 10%, deep
--    35% (the deliberate premium). Keep in lockstep with defaultAiUsageRules().
--    rule_book_key is the sole unique key.
-- ---------------------------------------------------------------------------
insert into public.pricing_rule_books (rule_book_key, label, description, division, currency, status, version, rules)
values (
  'ai-usage-rate-card-v1',
  'Henry Onyx Intelligence usage rate card',
  'Per-tier AI usage rates, margins, per-call floor + cost caps. Rates equal the live provider list price per tier (true COGS); margins are the pricing posture. Tunable live.',
  'ai', 'NGN', 'active', '2026-07-03',
  jsonb_build_object(
    'key', 'ai-usage-rate-card-v1',
    'version', '2026-07-03',
    'currency', 'NGN',
    'tiers', jsonb_build_object(
      'fast', jsonb_build_object(
        'rate', jsonb_build_object('in', 0.16, 'out', 0.8, 'cacheRead', 0.016, 'cacheWrite', 0.2),
        'marginRate', 0.1, 'minChargeableKobo', 500, 'maxCostKoboPerCall', 50000),
      'standard', jsonb_build_object(
        'rate', jsonb_build_object('in', 0.48, 'out', 2.4, 'cacheRead', 0.048, 'cacheWrite', 0.6),
        'marginRate', 0.1, 'minChargeableKobo', 500, 'maxCostKoboPerCall', 100000),
      'deep', jsonb_build_object(
        'rate', jsonb_build_object('in', 0.8, 'out', 4, 'cacheRead', 0.08, 'cacheWrite', 1),
        'marginRate', 0.35, 'minChargeableKobo', 500, 'maxCostKoboPerCall', 200000)
    )
  )
)
on conflict (rule_book_key) do update
  set rules = excluded.rules,
      version = excluded.version,
      label = excluded.label,
      description = excluded.description,
      division = excluded.division,
      currency = excluded.currency,
      status = excluded.status,
      updated_at = timezone('utc', now());
