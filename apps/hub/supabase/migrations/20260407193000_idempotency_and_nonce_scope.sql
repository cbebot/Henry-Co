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

drop index if exists public.hq_internal_comm_messages_client_nonce_uidx;
create unique index if not exists hq_internal_comm_messages_author_thread_nonce_uidx
  on public.hq_internal_comm_messages (author_id, thread_id, client_nonce)
  where client_nonce is not null;
