-- V2-PNH-04: marketplace deals curation
--
-- Lets HenryCo staff hand-pick deals that should appear on the /deals
-- page above the algorithmic list. The algorithmic fallback (top
-- discount % from Verified+ sellers, in stock) still runs when there
-- is no active curation row, so the page is never empty.
--
-- A `slot` column controls placement: "today" (single hero), "feature"
-- (1–4 highlighted), "rotation" (rest of the curated grid).

create table if not exists public.marketplace_deals_curation (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  slot text not null default 'rotation',
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  curator_user_id uuid,
  note text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_deals_curation
  drop constraint if exists marketplace_deals_curation_slot_check;
alter table public.marketplace_deals_curation
  add constraint marketplace_deals_curation_slot_check
  check (slot in ('today', 'feature', 'rotation'));

create index if not exists marketplace_deals_curation_active_idx
  on public.marketplace_deals_curation (active, slot, sort_order);

create index if not exists marketplace_deals_curation_window_idx
  on public.marketplace_deals_curation (starts_at, ends_at)
  where active = true;

-- RLS: only staff/owner can write; everyone reads active rows in window.
alter table public.marketplace_deals_curation enable row level security;

drop policy if exists marketplace_deals_curation_read on public.marketplace_deals_curation;
create policy marketplace_deals_curation_read
  on public.marketplace_deals_curation
  for select
  using (
    active = true
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  );

drop policy if exists marketplace_deals_curation_admin_all on public.marketplace_deals_curation;
create policy marketplace_deals_curation_admin_all
  on public.marketplace_deals_curation
  for all
  using (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = auth.uid()
        and m.role in ('owner', 'manager', 'curator')
    )
  )
  with check (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = auth.uid()
        and m.role in ('owner', 'manager', 'curator')
    )
  );
