-- V3-13 Payments: Provider Router — payment_intents schema + money-correctness enforcement.
--
-- PRODUCTION MIRROR of packages/payment-router/src/state-machine.ts (A2) and
-- packages/payment-router/src/testing/in-memory-payment-store.ts (A1, A3).
-- The TypeScript reference is the EXECUTABLE SPEC tested in CI; this SQL is the
-- production transcription of the SAME rules. The transition `if` clauses below
-- list EXACTLY the pairs in LEGAL_TRANSITIONS — keep them in lockstep.
--
-- NOT APPLIED in this session — conductor + owner review first, then it lands
-- with the first real-provider pass (V3-14/15/16) and its 48h money soak.
--
-- Deviations from the V3-13 plan (both are plan-bug fixes caught during grounding):
--   1. Finance read policy uses public.is_platform_staff() (the established
--      sensitive-data reader from 20260502160000_user_addresses_canonical.sql),
--      NOT is_staff_in('finance', …): 'finance' is a ROLE, not a division, so
--      that call is silently always-false and would deny every finance read.
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
      check (status in ('pending','processing','succeeded','failed','refunded','cancelled'));
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
revoke all on function public.payments_set_updated_at() from public;

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
  if (old.status = 'pending' and new.status in ('processing','cancelled'))
     or (old.status = 'processing' and new.status in ('succeeded','failed'))
     or (old.status = 'succeeded' and new.status = 'refunded') then
    return new;
  end if;
  -- failed / refunded / cancelled are terminal: any move out raises.
  raise exception 'illegal payment_intent transition: % -> %', old.status, new.status
    using errcode = 'check_violation';
end $$;
revoke all on function public.enforce_payment_intent_transition() from public;

drop trigger if exists payment_intents_enforce_transition on public.payment_intents;
create trigger payment_intents_enforce_transition
  before update on public.payment_intents
  for each row execute function public.enforce_payment_intent_transition();

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
  update public.payment_intents set status = p_new_status where id = p_intent_id;

  insert into public.payment_attempts (intent_id, provider, status)
  values (p_intent_id, p_provider, p_new_status);

  return jsonb_build_object('applied', true);
end $$;
revoke all on function public.apply_payment_webhook(text, text, uuid, text) from public;
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

-- NO user UPDATE policy — status changes only via service_role + apply_payment_webhook().

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
