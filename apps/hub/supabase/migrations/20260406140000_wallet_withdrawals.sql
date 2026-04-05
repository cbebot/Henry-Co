-- User-initiated wallet withdrawals (reviewed by finance / admin tooling)

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

alter table public.customer_preferences
  add column if not exists withdrawal_pin_hash text;

alter table public.customer_wallet_withdrawal_requests enable row level security;

drop trigger if exists customer_wallet_withdrawal_requests_updated_at on public.customer_wallet_withdrawal_requests;
create trigger customer_wallet_withdrawal_requests_updated_at
before update on public.customer_wallet_withdrawal_requests
for each row execute function public.account_set_updated_at();
