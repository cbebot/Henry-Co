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
