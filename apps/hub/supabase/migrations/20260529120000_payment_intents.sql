-- V3-13/V3-15 Payments: Provider Router — payment_intents schema + money-correctness enforcement.
--
-- PRODUCTION MIRROR of packages/payment-router/src/state-machine.ts (A2) and
-- packages/payment-router/src/testing/in-memory-payment-store.ts (A1, A3).
-- The TypeScript reference is the EXECUTABLE SPEC tested in CI; this SQL is the
-- production transcription of the SAME rules. The transition `if` clauses below
-- list EXACTLY the pairs in LEGAL_TRANSITIONS — keep them in lockstep.
--
-- NOT APPLIED in this session — even though V3-15 activates Paystack, this
-- migration stays unapplied until owner review + the 48h money soak. Applying it
-- is a deliberate, separate step (conductor gate), never a side effect of CI.
--
-- V3-15 activation changes (mirror the updated state-machine.ts + the Q1/Q3 locks):
--   - status CHECK + transition trigger gain `refund_processing` (Q3 honest
--     intermediate). `succeeded → refund_processing → refunded` replaces the old
--     direct `succeeded → refunded`, so `refunded` ALWAYS means provider-confirmed.
--   - new guarded RPC advance_payment_intent(): the ONLY synchronous (non-webhook)
--     status writer, whitelisted to 3 non-money edges with a rows-affected mutex
--     (Q1 — routes never UPDATE status directly).
--   - apply_payment_webhook() no longer writes payment_attempts: attempts record
--     ROUTING attempts only (written at initiate, Q2), so "resolve provider from
--     the status='succeeded' attempt" stays unambiguous. Webhook auditing lives in
--     processed_webhooks.
--
-- Deviations from the V3-13 plan (both are plan-bug fixes caught during grounding):
--   1. Finance read policy uses public.is_platform_staff() (the established
--      sensitive-data reader from 20260502160000_user_addresses_canonical.sql),
--      NOT is_staff_in('finance', …): 'finance' is a ROLE, not a division, so
--      that call is silently always-false and would deny every finance read.
--      ►► V3-22 FORWARD-POINTER: is_platform_staff() is BROADER than finance
--      (hub/staff/account/security × owner/admin/superadmin) — a deliberate
--      interim because it was the only WORKING sensitive-data reader at V3-15
--      time. V3-22 (payments-finance-dashboard) OWNS narrowing both the
--      payment_intents AND payment_attempts SELECT policies to a real
--      finance-scoped predicate — and MUST NOT regress to is_staff_in('finance')
--      (still always-false until that predicate is fixed). Tracked in
--      docs/v3/prompts/v3-22-payments-finance-dashboard.md scope item 3.
--   2. apply_payment_webhook() declares v_affected INTEGER (not BOOLEAN): the
--      plan's `v_inserted boolean` + `if v_inserted = 0` is a plpgsql type error
--      (GET DIAGNOSTICS yields bigint; boolean = integer has no operator).

-- ============ payment_intents ============
create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_minor bigint not null,
  currency text not null,
  country text not null,
  method text not null,
  status text not null default 'pending',
  idempotency_key text not null,
  division text,
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'payment_intents_amount_minor_positive') then
    alter table public.payment_intents add constraint payment_intents_amount_minor_positive check (amount_minor > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payment_intents_status_valid') then
    alter table public.payment_intents add constraint payment_intents_status_valid
      check (status in ('pending','processing','succeeded','failed','refund_processing','refunded','cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payment_intents_user_idem_unique') then
    alter table public.payment_intents add constraint payment_intents_user_idem_unique unique (user_id, idempotency_key); -- A1
  end if;
end $$;

create index if not exists payment_intents_user_id_idx on public.payment_intents (user_id);
create index if not exists payment_intents_division_idx on public.payment_intents (division); -- R2: division indexed
create index if not exists payment_intents_status_idx on public.payment_intents (status);

-- ============ payment_attempts ============
create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references public.payment_intents(id) on delete cascade,
  provider text not null,
  provider_reference text,
  status text not null,
  error_code text,
  created_at timestamptz not null default now()
);
create index if not exists payment_attempts_intent_id_idx on public.payment_attempts (intent_id);

-- ============ processed_webhooks ============
create table if not exists public.processed_webhooks (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  intent_id uuid references public.payment_intents(id) on delete set null,
  created_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'processed_webhooks_provider_event_unique') then
    alter table public.processed_webhooks add constraint processed_webhooks_provider_event_unique unique (provider, provider_event_id); -- A3
  end if;
end $$;

-- ============ updated_at trigger ============
create or replace function public.payments_set_updated_at()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end $$;
revoke all on function public.payments_set_updated_at() from public, anon, authenticated;

drop trigger if exists payment_intents_set_updated_at on public.payment_intents;
create trigger payment_intents_set_updated_at
  before update on public.payment_intents
  for each row execute function public.payments_set_updated_at();

-- ============ A2 transition enforcement (mirrors state-machine.ts LEGAL_TRANSITIONS) ============
create or replace function public.enforce_payment_intent_transition()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = old.status then
    return new; -- idempotent no-op (mirrors isLegalTransition: from === to → true)
  end if;
  -- EXACTLY the pairs in LEGAL_TRANSITIONS (state-machine.ts). Keep in lockstep.
  if (old.status = 'pending' and new.status in ('processing','cancelled'))
     or (old.status = 'processing' and new.status in ('succeeded','failed'))
     or (old.status = 'succeeded' and new.status = 'refund_processing')
     or (old.status = 'refund_processing' and new.status in ('refunded','succeeded')) then
    return new;
  end if;
  -- failed / refunded / cancelled are terminal: any move out raises.
  raise exception 'illegal payment_intent transition: % -> %', old.status, new.status
    using errcode = 'check_violation';
end $$;
revoke all on function public.enforce_payment_intent_transition() from public, anon, authenticated;

drop trigger if exists payment_intents_enforce_transition on public.payment_intents;
create trigger payment_intents_enforce_transition
  before update on public.payment_intents
  for each row execute function public.enforce_payment_intent_transition();

-- ============ Q1 guarded synchronous advance (non-money, route-driven, mutex) ============
-- The ONLY way a route may move `status` without a provider event. It exists so
-- that routes NEVER issue a raw `update … set status` (D3: the grep stays zero).
--
-- Whitelisted to the THREE non-money edges only — a subset of LEGAL_TRANSITIONS:
--   pending           → processing          (finalize: buyer returned, begin verify)
--   succeeded         → refund_processing    (refund request accepted; money NOT yet moved)
--   refund_processing → succeeded            (synchronous refund reject — revert, money stayed)
-- Money-confirming edges (→succeeded via charge, →failed, →refunded) are deliberately
-- NOT here: those flow ONLY through apply_payment_webhook (provider-confirmed, deduped).
-- A non-whitelisted (p_from,p_to) is a programming error and RAISES — this function
-- must never degrade into a general-purpose status setter.
--
-- `where … and status = p_from` is an optimistic mutex: concurrent callers race and
-- exactly ONE observes advanced=true (row_count 1); the loser sees advanced=false and
-- must not run the side effect (e.g. only the first finalize calls the provider). The
-- BEFORE UPDATE trigger re-checks legality regardless (defence in depth) — but every
-- whitelisted edge is legal, so it never fires for them.
create or replace function public.advance_payment_intent(
  p_intent_id uuid,
  p_from text,
  p_to text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_affected integer := 0;
begin
  if not (
       (p_from = 'pending'           and p_to = 'processing')
    or (p_from = 'succeeded'         and p_to = 'refund_processing')
    or (p_from = 'refund_processing' and p_to = 'succeeded')
  ) then
    raise exception 'advance_payment_intent: non-whitelisted edge % -> %', p_from, p_to
      using errcode = 'check_violation';
  end if;

  update public.payment_intents
     set status = p_to
   where id = p_intent_id and status = p_from;
  get diagnostics v_affected = row_count;

  return jsonb_build_object('advanced', v_affected > 0);
end $$;
-- FL1 (2026-06-05): `from public` alone is INSUFFICIENT on Supabase — project
-- bootstrap `alter default privileges … grant execute on functions to anon,
-- authenticated` adds DIRECT grants that survive a public-only revoke, leaving this
-- SECURITY DEFINER money-writer callable by any signed-in user via /rest/v1/rpc/.
-- Revoke the direct grants too (service_role re-granted on the next line).
revoke all on function public.advance_payment_intent(uuid, text, text) from public, anon, authenticated;
grant execute on function public.advance_payment_intent(uuid, text, text) to service_role;

-- ============ A3 webhook apply RPC (dedup-insert FIRST, effect SECOND, one txn) ============
create or replace function public.apply_payment_webhook(
  p_provider text,
  p_provider_event_id text,
  p_intent_id uuid,
  p_new_status text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_affected integer := 0;
begin
  -- STEP 1: dedup-insert FIRST. ON CONFLICT DO NOTHING → duplicate deliveries no-op.
  insert into public.processed_webhooks (provider, provider_event_id, intent_id)
  values (p_provider, p_provider_event_id, p_intent_id)
  on conflict (provider, provider_event_id) do nothing;
  get diagnostics v_affected = row_count;

  if v_affected = 0 then
    return jsonb_build_object('applied', false, 'reason', 'duplicate'); -- idempotent ack
  end if;

  -- STEP 2: effect SECOND, SAME transaction. The BEFORE UPDATE trigger enforces A2;
  -- an illegal implied transition raises here and rolls back the dedup row too,
  -- so the delivery can be safely retried (mirrors the store's crash-between-steps test).
  -- NOTE: no payment_attempts write here. attempts record ROUTING attempts only
  -- (written at initiate, Q2); a webhook is not a routing attempt and writing one
  -- would create a second status='succeeded' row, breaking provider resolution.
  update public.payment_intents set status = p_new_status where id = p_intent_id;

  return jsonb_build_object('applied', true);
end $$;
-- FL1: revoke the DIRECT anon/authenticated grants too (see advance_payment_intent
-- above) — else a signed-in user could call this and forge a 'succeeded' with no money moved.
revoke all on function public.apply_payment_webhook(text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.apply_payment_webhook(text, text, uuid, text) to service_role;

-- ============ RLS ============
alter table public.payment_intents enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.processed_webhooks enable row level security;

drop policy if exists payment_intents_select_own on public.payment_intents;
create policy payment_intents_select_own on public.payment_intents
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists payment_intents_insert_own on public.payment_intents;
create policy payment_intents_insert_own on public.payment_intents
  for insert to authenticated with check (user_id = (select auth.uid()));

-- NO user UPDATE policy — status changes only via service_role through the two
-- guarded RPCs: advance_payment_intent() (synchronous non-money edges) and
-- apply_payment_webhook() (provider-confirmed, deduped). Never a raw UPDATE.

-- Platform-staff read-all (finance/reconciliation). Reuses the canonical
-- sensitive-data reader predicate (hub/staff/account/security × owner/admin/superadmin).
drop policy if exists payment_intents_select_platform_staff on public.payment_intents;
create policy payment_intents_select_platform_staff on public.payment_intents
  for select to authenticated using (public.is_platform_staff());

drop policy if exists payment_attempts_select_platform_staff on public.payment_attempts;
create policy payment_attempts_select_platform_staff on public.payment_attempts
  for select to authenticated using (public.is_platform_staff());

-- processed_webhooks has RLS enabled with NO policy: deny-all to authenticated;
-- only service_role (RLS-exempt) writes/reads it via apply_payment_webhook().
