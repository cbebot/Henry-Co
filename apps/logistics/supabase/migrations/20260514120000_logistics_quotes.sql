-- V3 PASS 21 — Logistics: persistent quote ledger.
--
-- WHY:
--   The audit captured at SHA e5e277a noted that /quote and /book are
--   independent surfaces. The customer re-enters address + service info
--   on /book even after generating a quote on /quote. To make
--   quote-to-booking conversion frictionless and to give finance a
--   24-hour quote pipeline, persist every quote calculation with a
--   `quote_id` and an `expires_at` so /book can hydrate from the quote.
--
-- TABLE:
--   public.logistics_quotes (id, payload jsonb, total_minor int,
--   currency, expires_at, user_id nullable, normalized_email,
--   source text, created_at).
--
-- RLS:
--   - Service role: full access (server-side write from API route).
--   - Authenticated owner: SELECT own quotes (by user_id OR
--     normalized_email).
--   - Staff (logistics): SELECT all via public.is_staff_in('logistics').
--
-- DOWN:
--   drop policy "logistics quotes: service role" on public.logistics_quotes;
--   drop policy "logistics quotes: owner read" on public.logistics_quotes;
--   drop policy "logistics quotes: staff read" on public.logistics_quotes;
--   drop table if exists public.logistics_quotes;
--
-- IDEMPOTENT: yes (uses if not exists + drop policy if exists/create).

create table if not exists public.logistics_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  source text not null default 'web',
  payload jsonb not null default '{}'::jsonb,
  total_minor bigint not null default 0,
  currency text not null default 'NGN',
  expires_at timestamptz not null default (timezone('utc', now()) + interval '24 hours'),
  converted_shipment_id uuid references public.logistics_shipments(id) on delete set null,
  converted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_quotes_user_idx
  on public.logistics_quotes (user_id, created_at desc)
  where user_id is not null;

create index if not exists logistics_quotes_email_idx
  on public.logistics_quotes (normalized_email, created_at desc)
  where normalized_email is not null;

create index if not exists logistics_quotes_active_idx
  on public.logistics_quotes (expires_at)
  where converted_shipment_id is null;

alter table public.logistics_quotes enable row level security;

drop policy if exists "logistics quotes: service role" on public.logistics_quotes;
create policy "logistics quotes: service role"
  on public.logistics_quotes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "logistics quotes: owner read" on public.logistics_quotes;
create policy "logistics quotes: owner read"
  on public.logistics_quotes
  for select
  using (
    (user_id is not null and user_id = auth.uid())
    or (
      normalized_email is not null
      and lower(coalesce((auth.jwt() ->> 'email'), '')) = normalized_email
    )
  );

drop policy if exists "logistics quotes: staff read" on public.logistics_quotes;
create policy "logistics quotes: staff read"
  on public.logistics_quotes
  for select
  using (public.is_staff_in('logistics'));

comment on table public.logistics_quotes is
  'V3 PASS 21 — persistent quote ledger. Every /quote calculation writes one row '
  'so /book can hydrate from quote_id without re-entry, and finance can audit the '
  '24-hour pipeline. RLS: owner reads own (by user_id or normalized_email); staff '
  'reads all via is_staff_in(logistics); service role full access.';

-- end of migration --
