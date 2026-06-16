-- SEC-HARDEN-05 CI fixture — minimal Care money surface (the pre-fix state).
--
-- The care money tables + their triggers live on prod out-of-band (early care_init,
-- applied with no history row), NOT in any migration the vanilla CI chain applies — so
-- the bare-PG job has nothing for 20260615120000_sec_harden_05_care_payment_guard.sql
-- to act on. This fixture reproduces a FAITHFUL slice of the prod pre-fix state — the
-- four money tables, the two payment triggers (single-entry inflow + booking recalc),
-- the request-number trigger, and the standing WIDE write grants to the request roles
-- (the hole) — so the migration has real objects to guard/lock and the invariants can
-- assert the end state AND seed the historical-backfill reconciliation proof.
--
-- Run AFTER _bootstrap_supabase_env.sql (request roles + Supabase default privileges).
-- Idempotent. Mirrors supabase/prod-actual/schema.sql for the care money objects.

set check_function_bodies = off;

-- ── tables (prod-faithful subset) ────────────────────────────────────────────
create table if not exists public.care_bookings (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null,
  customer_name text not null default 'Fixture Customer',
  email text,
  phone text,
  service_type text not null default 'garment',
  status text not null default 'booked',
  quoted_subtotal numeric(12,2) not null default 0,
  quoted_urgent_fee numeric(12,2) not null default 0,
  quoted_total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_order_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  quantity integer not null default 1,
  unit_price_snapshot numeric(12,2) not null default 0,
  urgent_fee_snapshot numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.care_payment_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text,
  booking_id uuid not null,
  request_kind text not null default 'picked_up_payment_request',
  currency text not null default 'NGN',
  amount_due numeric(12,2) not null default 0,
  status text not null default 'queued',
  requested_at timestamptz not null default now(),
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'care_payment_requests_status_check') then
    alter table public.care_payment_requests add constraint care_payment_requests_status_check
      check (status = any (array['queued','sent','paid','cancelled','failed']));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'care_payment_requests_request_no_key') then
    alter table public.care_payment_requests add constraint care_payment_requests_request_no_key unique (request_no);
  end if;
end $$;

create table if not exists public.care_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.care_bookings(id) on delete set null,
  payment_no text not null default ('PAY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  amount numeric(12,2) not null,
  payment_method text not null,
  reference text,
  notes text,
  received_by uuid,
  created_at timestamptz not null default now(),
  division text not null default 'care'
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'care_payments_amount_check') then
    alter table public.care_payments add constraint care_payments_amount_check check (amount > (0)::numeric);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'care_payments_payment_no_key') then
    alter table public.care_payments add constraint care_payments_payment_no_key unique (payment_no);
  end if;
end $$;

create table if not exists public.care_finance_ledger (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null,
  source_table text not null,
  source_id uuid not null,
  booking_id uuid,
  direction text not null,
  amount numeric(12,2) not null,
  narration text,
  created_at timestamptz not null default now(),
  division text not null default 'care'
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'care_finance_ledger_direction_check') then
    alter table public.care_finance_ledger add constraint care_finance_ledger_direction_check
      check (direction = any (array['inflow','outflow']));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'care_finance_ledger_entry_type_check') then
    alter table public.care_finance_ledger add constraint care_finance_ledger_entry_type_check
      check (entry_type = any (array['income','expense','adjustment']));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'care_finance_ledger_source_table_source_id_direction_key') then
    alter table public.care_finance_ledger add constraint care_finance_ledger_source_table_source_id_direction_key
      unique (source_table, source_id, direction);
  end if;
end $$;

-- ── functions + triggers (faithful copies of prod-actual) ────────────────────
create or replace function public.care_recalculate_booking_totals(p_booking_id uuid)
returns void language plpgsql set search_path to 'public', 'pg_catalog' as $function$
declare
  v_subtotal numeric(12,2) := 0; v_urgent_fee numeric(12,2) := 0; v_total numeric(12,2) := 0;
  v_paid numeric(12,2) := 0; v_balance numeric(12,2) := 0; v_status text := 'unpaid';
begin
  select coalesce(sum(coalesce(quantity,1) * coalesce(unit_price_snapshot,0)),0),
         coalesce(sum(coalesce(urgent_fee_snapshot,0)),0),
         coalesce(sum(coalesce(line_total,0)),0)
    into v_subtotal, v_urgent_fee, v_total
    from public.care_order_items where booking_id = p_booking_id;
  select coalesce(sum(coalesce(amount,0)),0) into v_paid
    from public.care_payments where booking_id = p_booking_id;
  v_balance := greatest(v_total - v_paid, 0);
  if v_total <= 0 and v_paid <= 0 then v_status := 'unpaid';
  elsif v_paid <= 0 then v_status := 'unpaid';
  elsif v_paid < v_total then v_status := 'part_paid';
  elsif v_paid = v_total then v_status := 'paid';
  elsif v_paid > v_total then v_status := 'overpaid';
  end if;
  update public.care_bookings set
    quoted_subtotal = coalesce(v_subtotal,0), quoted_urgent_fee = coalesce(v_urgent_fee,0),
    quoted_total = coalesce(v_total,0), amount_paid = coalesce(v_paid,0),
    balance_due = coalesce(v_balance,0), payment_status = v_status
  where id = p_booking_id;
end $function$;

create or replace function public.care_recalc_booking_totals_from_payments()
returns trigger language plpgsql set search_path to 'public', 'pg_catalog' as $function$
begin
  perform public.care_recalculate_booking_totals(coalesce(new.booking_id, old.booking_id));
  return null;
end $function$;

create or replace function public.care_append_payment_ledger()
returns trigger language plpgsql set search_path to 'public', 'pg_catalog' as $function$
begin
  insert into public.care_finance_ledger (entry_type, source_table, source_id, booking_id, direction, amount, narration)
  values ('income', 'care_payments', new.id, new.booking_id, 'inflow', new.amount, coalesce(new.notes, 'Customer payment'))
  on conflict (source_table, source_id, direction) do nothing;
  return new;
end $function$;

create or replace function public.care_set_payment_request_no()
returns trigger language plpgsql set search_path to 'public', 'pg_catalog' as $function$
begin
  if new.request_no is null or btrim(new.request_no) = '' then
    new.request_no := 'CPR-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  end if;
  return new;
end $function$;

drop trigger if exists trg_care_append_payment_ledger on public.care_payments;
create trigger trg_care_append_payment_ledger after insert on public.care_payments
  for each row execute function public.care_append_payment_ledger();

drop trigger if exists trg_care_recalc_booking_totals_from_payments on public.care_payments;
create trigger trg_care_recalc_booking_totals_from_payments after insert or delete or update on public.care_payments
  for each row execute function public.care_recalc_booking_totals_from_payments();

drop trigger if exists trg_care_set_payment_request_no on public.care_payment_requests;
create trigger trg_care_set_payment_request_no before insert on public.care_payment_requests
  for each row execute function public.care_set_payment_request_no();

-- ── RLS enabled (matches prod: enabled, no anon/authenticated policy) ─────────
alter table public.care_bookings         enable row level security;
alter table public.care_order_items       enable row level security;
alter table public.care_payment_requests  enable row level security;
alter table public.care_payments          enable row level security;
alter table public.care_finance_ledger    enable row level security;

-- ── the standing WIDE write grants (the latent half of the hole) ─────────────
grant select, insert, update, delete, truncate on table
  public.care_bookings, public.care_order_items, public.care_payment_requests,
  public.care_payments, public.care_finance_ledger
  to anon, authenticated, service_role;

-- ── HISTORICAL fixtures (stand in for the prod 12) — inserted PRE-migration via the
-- raw path, so the trigger posts their single-entry inflow and the migration's
-- historical backfill has real rows to post balanced double-entries for. The
-- care_payment_guard_invariant then proves they reconcile (the "12 reconcile" proof
-- in miniature). Idempotent.
insert into public.care_bookings (id, tracking_code) values
  ('00000000-0000-4000-8000-00000000ca01', 'TRK-FIX-CA01'),
  ('00000000-0000-4000-8000-00000000ca02', 'TRK-FIX-CA02')
on conflict (id) do nothing;

insert into public.care_order_items (id, booking_id, quantity, unit_price_snapshot, line_total) values
  ('00000000-0000-4000-8000-00000000ce01', '00000000-0000-4000-8000-00000000ca01', 1, 50000.00, 50000.00)
on conflict (id) do nothing;

insert into public.care_payment_requests (id, booking_id, amount_due, status) values
  ('00000000-0000-4000-8000-00000000cd01', '00000000-0000-4000-8000-00000000ca01', 50000.00, 'sent')
on conflict (id) do nothing;

insert into public.care_payments (id, booking_id, amount, payment_method, notes) values
  ('00000000-0000-4000-8000-00000000cb01', '00000000-0000-4000-8000-00000000ca01', 30000.00, 'cash', 'fixture partial'),
  ('00000000-0000-4000-8000-00000000cb02', '00000000-0000-4000-8000-00000000ca02', 5000.10, 'bank_transfer', 'fixture kobo-precision')
on conflict (id) do nothing;

select 'care money surface ready (4 money tables + payment ledger/recalc triggers + wide request-role write grants + 2 historical fixture payments = ₦35,000.10 reproduce the prod pre-fix hole)' as status;
