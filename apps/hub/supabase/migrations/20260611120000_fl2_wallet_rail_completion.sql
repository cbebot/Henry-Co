-- SCHEMA-TRUTH-01 — FL2 wallet-rail completion: the missing dependency closure
-- for the MERGED account money surfaces.
--
-- WHY THIS EXISTS: prod was reconciled against the committed migrations by
-- read-only introspection (supabase/prod-actual/schema.sql) and two April files
-- turned out to be only PARTIALLY applied out-of-band —
--   20260403183000_account_integration_hardening.sql  (columns applied; most tables not)
--   20260406140000_wallet_withdrawals.sql             (pin-hash column applied; table not)
--   20260407190000_account_webhook_receipts.sql       (not applied)
--   20260407193000_idempotency_and_nonce_scope.sql    (table half not applied)
-- Meanwhile V3-15-JOB-B (#242, MERGED) built the wallet top-up rail ON these
-- tables: /api/wallet/fund, /api/wallet/topup/init and the funding-proof flow
-- write customer_wallet_funding_requests; /api/wallet/withdrawal/request needs
-- customer_wallet_withdrawal_requests + customer_payout_methods; the account
-- idempotency + webhook-receipt infrastructure backs the same money paths.
-- Without this file, FL2 would light the card rail while its sibling tables are
-- still missing — the flagship flow would strand at the first INSERT.
--
-- WHAT IT IS: a VERBATIM, idempotent extraction of exactly the missing objects
-- from the four files above — nothing else. The parts of those files already
-- live in prod (customer_preferences columns, the hq nonce index's OLD form,
-- referral/trust/interview tables' siblings) are NOT touched here; re-running
-- the old files wholesale could regress newer prod state, so they remain
-- archived as partially-superseded in docs/v3/fl2-apply-manifest.md.
--
-- COMMITTED-NOT-APPLIED. Lands at FL2 (apply order: after the money set —
-- independent of it; see docs/v3/fl2-apply-manifest.md). Proven forward-safe +
-- idempotent on the prod-actual shadow (scripts/db/build-shadow-db.mjs).
--
-- These tables are RLS-enabled with NO policies BY DESIGN: deny-all to
-- anon/authenticated; only service-role server routes touch them (mirrors the
-- original files — reviewed, not an accident).

-- ============ shared updated_at trigger fn (absent from prod) ============
create or replace function public.account_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============ wallet funding requests (the Job B top-up rail) ============
create table if not exists public.customer_wallet_funding_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'bank_transfer',
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'pending_verification',
  payment_reference text not null unique,
  source_division text not null default 'account',
  proof_url text,
  proof_public_id text,
  proof_name text,
  note text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_wallet_funding_requests_user_idx
  on public.customer_wallet_funding_requests(user_id, status, created_at desc);

alter table public.customer_wallet_funding_requests enable row level security;

drop trigger if exists customer_wallet_funding_requests_updated_at on public.customer_wallet_funding_requests;
create trigger customer_wallet_funding_requests_updated_at
before update on public.customer_wallet_funding_requests
for each row execute function public.account_set_updated_at();

-- ============ payout methods (withdrawal destinations) ============
create table if not exists public.customer_payout_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method_type text not null default 'bank_transfer',
  account_name text,
  bank_name text,
  account_number text,
  routing_label text,
  currency text not null default 'NGN',
  country text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_payout_methods_user_idx
  on public.customer_payout_methods(user_id, is_active, is_default desc);

alter table public.customer_payout_methods enable row level security;

drop trigger if exists customer_payout_methods_updated_at on public.customer_payout_methods;
create trigger customer_payout_methods_updated_at
before update on public.customer_payout_methods
for each row execute function public.account_set_updated_at();

-- ============ wallet withdrawal requests ============
create table if not exists public.customer_wallet_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payout_method_id uuid references public.customer_payout_methods(id) on delete set null,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'pending_review',
  admin_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_wallet_withdrawal_requests_user_idx
  on public.customer_wallet_withdrawal_requests(user_id, status, created_at desc);

alter table public.customer_wallet_withdrawal_requests enable row level security;

drop trigger if exists customer_wallet_withdrawal_requests_updated_at on public.customer_wallet_withdrawal_requests;
create trigger customer_wallet_withdrawal_requests_updated_at
before update on public.customer_wallet_withdrawal_requests
for each row execute function public.account_set_updated_at();

-- ============ account idempotency keys (money-route replay protection) ============
create table if not exists public.account_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route_key text not null,
  idempotency_key text not null,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, route_key, idempotency_key)
);

create index if not exists account_idempotency_keys_created_idx
  on public.account_idempotency_keys(created_at desc);

alter table public.account_idempotency_keys enable row level security;

-- ============ account webhook receipts (delivery audit for account webhooks) ============
create table if not exists public.account_webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  signature_valid boolean not null default true,
  payload_hash text not null,
  processed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists account_webhook_receipts_processed_idx
  on public.account_webhook_receipts(processed_at desc);

alter table public.account_webhook_receipts enable row level security;
