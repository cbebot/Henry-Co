-- V3 PASS 21 — marketplace refunds ledger
--
-- Distinct from marketplace_returns. A return is the buyer-facing
-- request to send goods back; a refund is the money movement.
-- A single return can spawn 0..N refunds (partial, instalment, or
-- adjusted after restocking inspection). Refund truth is anchored
-- here so finance reconciliation never reads from order_items alone.
--
-- Refund status flow:
--   pending → approved → captured → reconciled
--                     ↘ rejected
--                     ↘ failed

create table if not exists public.marketplace_refunds (
  id uuid primary key default gen_random_uuid(),
  refund_no text not null unique,
  order_id uuid references public.marketplace_orders(id) on delete set null,
  order_item_id uuid references public.marketplace_order_items(id) on delete set null,
  return_id uuid references public.marketplace_returns(id) on delete set null,
  dispute_id uuid references public.marketplace_disputes(id) on delete set null,
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  initiated_by_user_id uuid references auth.users(id) on delete set null,
  amount_minor integer not null default 0,
  currency text not null default 'NGN',
  reason text,
  status text not null default 'pending',
  payment_method text,
  payment_reference text,
  approved_at timestamptz,
  captured_at timestamptz,
  reconciled_at timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_refunds
  drop constraint if exists marketplace_refunds_status_check;
alter table public.marketplace_refunds
  add constraint marketplace_refunds_status_check
  check (status in ('pending','approved','captured','reconciled','rejected','failed'));

create index if not exists marketplace_refunds_order_idx
  on public.marketplace_refunds (order_id, created_at desc);
create index if not exists marketplace_refunds_return_idx
  on public.marketplace_refunds (return_id);
create index if not exists marketplace_refunds_status_idx
  on public.marketplace_refunds (status, created_at desc);
create index if not exists marketplace_refunds_vendor_idx
  on public.marketplace_refunds (vendor_id, created_at desc);

drop trigger if exists marketplace_refunds_updated_at on public.marketplace_refunds;
create trigger marketplace_refunds_updated_at before update on public.marketplace_refunds
  for each row execute function public.marketplace_set_updated_at();

alter table public.marketplace_refunds enable row level security;

drop policy if exists marketplace_refunds_buyer_read on public.marketplace_refunds;
create policy marketplace_refunds_buyer_read
  on public.marketplace_refunds
  for select
  using (
    order_id in (
      select o.id from public.marketplace_orders o
      where o.user_id = (select auth.uid())
    )
  );

drop policy if exists marketplace_refunds_vendor_read on public.marketplace_refunds;
create policy marketplace_refunds_vendor_read
  on public.marketplace_refunds
  for select
  using (
    vendor_id in (
      select m.scope_id from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.role = 'vendor'
        and m.is_active = true
        and m.scope_type = 'vendor'
    )
  );

drop policy if exists marketplace_refunds_staff_read on public.marketplace_refunds;
create policy marketplace_refunds_staff_read
  on public.marketplace_refunds
  for select
  using (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','finance','moderation','support','operations')
    )
  );

drop policy if exists marketplace_refunds_staff_write on public.marketplace_refunds;
create policy marketplace_refunds_staff_write
  on public.marketplace_refunds
  for all
  using (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','finance')
    )
  )
  with check (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','finance')
    )
  );
