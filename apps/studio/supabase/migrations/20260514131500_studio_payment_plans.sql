-- V3 PASS 21 — Studio: milestone-driven payment plans.
--
-- WHY:
--   Studio projects today carry a single deposit_amount + investment on
--   the proposal and one studio_invoices row per release. V3 PASS 21
--   distinctive surface #5 (milestone-driven payment plan) needs:
--     * a per-project payment plan: schedule of release events keyed
--       to milestones,
--     * activation timestamp + cancellation tracking,
--     * total_kobo + currency carried separately from the milestone
--       amounts so the plan can report progress in its own currency.
--   Each studio_payment_plans row owns N studio_payment_plan_releases
--   rows (1:N). On milestone completion the release row is marked
--   `released_at` and an invoice is generated (cron path).
--
-- TABLES:
--   public.studio_payment_plans (id, project_id fk, name, total_kobo,
--   currency, status, activated_at, cancelled_at, created_at, updated_at).
--   public.studio_payment_plan_releases (id, plan_id fk, milestone_id fk
--   nullable, sequence int, label, amount_kobo, percent_basis numeric,
--   currency, released_at, invoice_id fk nullable, created_at).
--
-- RLS:
--   - Service role: full access.
--   - Client: SELECT plan + releases where the project's client_user_id
--     matches auth.uid().
--   - Studio staff: full access via public.is_staff_in('studio').
--
-- DOWN: drop policies + drop both tables.

create table if not exists public.studio_payment_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  name text not null default 'Project payment plan',
  total_kobo bigint not null default 0 check (total_kobo >= 0),
  currency text not null default 'NGN',
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  activated_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists studio_payment_plans_project_uidx
  on public.studio_payment_plans (project_id);

create index if not exists studio_payment_plans_status_idx
  on public.studio_payment_plans (status, activated_at desc);

create table if not exists public.studio_payment_plan_releases (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.studio_payment_plans(id) on delete cascade,
  milestone_id uuid references public.studio_project_milestones(id) on delete set null,
  sequence integer not null default 0,
  label text not null,
  amount_kobo bigint not null default 0 check (amount_kobo >= 0),
  percent_basis numeric(6, 3) check (percent_basis is null or (percent_basis >= 0 and percent_basis <= 100)),
  currency text not null default 'NGN',
  released_at timestamptz,
  invoice_id uuid references public.studio_invoices(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_payment_plan_releases_plan_idx
  on public.studio_payment_plan_releases (plan_id, sequence);

create index if not exists studio_payment_plan_releases_milestone_idx
  on public.studio_payment_plan_releases (milestone_id)
  where milestone_id is not null;

create index if not exists studio_payment_plan_releases_invoice_idx
  on public.studio_payment_plan_releases (invoice_id)
  where invoice_id is not null;

-- updated_at trigger reuse the existing public.studio_set_updated_at()
-- helper (defined in 20260402190000_studio_init.sql).
drop trigger if exists studio_payment_plans_updated_at on public.studio_payment_plans;
create trigger studio_payment_plans_updated_at before update on public.studio_payment_plans
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_payment_plan_releases_updated_at on public.studio_payment_plan_releases;
create trigger studio_payment_plan_releases_updated_at before update on public.studio_payment_plan_releases
for each row execute function public.studio_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────

alter table public.studio_payment_plans enable row level security;
alter table public.studio_payment_plan_releases enable row level security;

drop policy if exists "studio payment plans: service role" on public.studio_payment_plans;
create policy "studio payment plans: service role"
  on public.studio_payment_plans
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "studio payment plans: client read" on public.studio_payment_plans;
create policy "studio payment plans: client read"
  on public.studio_payment_plans
  for select
  using (
    exists (
      select 1
      from public.studio_projects sp
      where sp.id = studio_payment_plans.project_id
        and sp.client_user_id = auth.uid()
    )
  );

drop policy if exists "studio payment plans: staff" on public.studio_payment_plans;
create policy "studio payment plans: staff"
  on public.studio_payment_plans
  for all
  using (public.is_staff_in('studio'))
  with check (public.is_staff_in('studio'));

drop policy if exists "studio payment plan releases: service role" on public.studio_payment_plan_releases;
create policy "studio payment plan releases: service role"
  on public.studio_payment_plan_releases
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "studio payment plan releases: client read" on public.studio_payment_plan_releases;
create policy "studio payment plan releases: client read"
  on public.studio_payment_plan_releases
  for select
  using (
    exists (
      select 1
      from public.studio_payment_plans spp
      join public.studio_projects sp on sp.id = spp.project_id
      where spp.id = studio_payment_plan_releases.plan_id
        and sp.client_user_id = auth.uid()
    )
  );

drop policy if exists "studio payment plan releases: staff" on public.studio_payment_plan_releases;
create policy "studio payment plan releases: staff"
  on public.studio_payment_plan_releases
  for all
  using (public.is_staff_in('studio'))
  with check (public.is_staff_in('studio'));

comment on table public.studio_payment_plans is
  'V3 PASS 21 — milestone-driven payment plan per project. One plan per '
  'project (UNIQUE index on project_id). status: draft → active → '
  'completed | cancelled. activated_at marks transition to active so cron '
  'sweeps can skip drafts.';

comment on table public.studio_payment_plan_releases is
  'V3 PASS 21 — N release events per plan. milestone_id is nullable so plans '
  'can include a deposit release that fires on plan activation (no milestone). '
  'released_at marks the release as fired; invoice_id links to the generated '
  'studio_invoices row.';

-- end of migration --
