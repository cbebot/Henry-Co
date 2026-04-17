-- Shared pricing governance truth (cross-division).
-- This is intentionally service-role gated via RLS so customer sessions cannot read/write pricing governance.

create extension if not exists pgcrypto;

create table if not exists public.pricing_rule_books (
  id uuid primary key default gen_random_uuid(),
  rule_book_key text not null unique,
  label text not null,
  description text,
  division text not null default 'shared',
  currency text not null default 'NGN',
  status text not null default 'active',
  version text not null,
  rules jsonb not null default '{}'::jsonb,
  effective_from timestamptz not null default timezone('utc', now()),
  effective_to timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pricing_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_key text not null unique,
  division text not null,
  subject_type text not null,
  subject_id text,
  currency text not null default 'NGN',
  rule_book_key text,
  rule_version text,
  input jsonb not null default '{}'::jsonb,
  breakdown jsonb not null default '{}'::jsonb,
  total integer not null default 0,
  status text not null default 'quoted',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pricing_override_events (
  id uuid primary key default gen_random_uuid(),
  division text not null default 'shared',
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  quote_id uuid references public.pricing_quotes(id) on delete set null,
  subject_type text,
  subject_id text,
  reason text,
  before jsonb not null default '{}'::jsonb,
  after jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_pricing_rule_books_division_status
  on public.pricing_rule_books(division, status, effective_from desc);
create index if not exists idx_pricing_quotes_division_status
  on public.pricing_quotes(division, status, created_at desc);
create index if not exists idx_pricing_quotes_subject
  on public.pricing_quotes(subject_type, subject_id, created_at desc);
create index if not exists idx_pricing_override_events_quote
  on public.pricing_override_events(quote_id, created_at desc);

alter table public.pricing_rule_books enable row level security;
alter table public.pricing_quotes enable row level security;
alter table public.pricing_override_events enable row level security;

drop policy if exists pricing_rule_books_service_only on public.pricing_rule_books;
create policy pricing_rule_books_service_only on public.pricing_rule_books
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists pricing_quotes_service_only on public.pricing_quotes;
create policy pricing_quotes_service_only on public.pricing_quotes
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists pricing_override_events_service_only on public.pricing_override_events;
create policy pricing_override_events_service_only on public.pricing_override_events
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

