-- Marketplace checkout payment completion: proof capture + wallet debit trace.
-- This extends the existing manual verification queue without changing RLS policies.

alter table if exists public.marketplace_payment_records
  add column if not exists bank_reference text,
  add column if not exists proof_url text,
  add column if not exists proof_public_id text,
  add column if not exists proof_name text,
  add column if not exists proof_uploaded_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists wallet_transaction_id uuid,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists marketplace_payment_records_status_created_idx
  on public.marketplace_payment_records(status, created_at desc);

create index if not exists marketplace_payment_records_wallet_tx_idx
  on public.marketplace_payment_records(wallet_transaction_id)
  where wallet_transaction_id is not null;

