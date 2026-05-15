-- V3 PASS 21 — Property: managed-client maintenance tickets.
--
-- WHY:
--   A managed-property owner needs a path to file a maintenance ticket
--   ("AC stopped working", "tenant reported water leak") and to track
--   the response. Operators need a triage queue that surfaces SLA breaches.
--
-- RLS:
--   - Listing owner (managed client) can read + write own tickets.
--   - Property staff can read + write all tickets.
--
-- IDEMPOTENT: yes.

create table if not exists public.property_maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  managed_record_id uuid references public.property_managed_records(id) on delete set null,
  reported_by_user_id uuid,
  normalized_email text,
  reporter_name text not null,
  reporter_email text not null,
  reporter_phone text,
  category text not null default 'general' check (
    category in ('plumbing', 'electrical', 'hvac', 'pest', 'structural', 'security', 'appliance', 'general')
  ),
  severity text not null default 'medium' check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  summary text not null,
  body text not null default '',
  status text not null default 'open' check (
    status in ('open', 'triaged', 'in_progress', 'scheduled', 'completed', 'closed', 'cancelled')
  ),
  attachments jsonb not null default '[]'::jsonb,
  scheduled_for timestamptz,
  resolved_at timestamptz,
  assigned_agent_id uuid references public.property_agents(id) on delete set null,
  resolution_notes text not null default '',
  sla_due_at timestamptz,
  sla_breach boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_property_maintenance_tickets_listing
  on public.property_maintenance_tickets (listing_id, created_at desc);
create index if not exists idx_property_maintenance_tickets_status
  on public.property_maintenance_tickets (status, severity, created_at desc);
create index if not exists idx_property_maintenance_tickets_owner
  on public.property_maintenance_tickets (reported_by_user_id, created_at desc)
  where reported_by_user_id is not null;
create index if not exists idx_property_maintenance_tickets_sla
  on public.property_maintenance_tickets (sla_due_at)
  where status in ('open', 'triaged', 'in_progress', 'scheduled');

alter table public.property_maintenance_tickets enable row level security;

drop policy if exists "owners can read own maintenance tickets"
  on public.property_maintenance_tickets;
create policy "owners can read own maintenance tickets"
on public.property_maintenance_tickets
for select
using (
  reported_by_user_id = auth.uid()
  or exists (
    select 1
    from public.property_listings l
    where l.id = listing_id and l.owner_user_id = auth.uid()
  )
  or public.is_property_staff()
);

drop policy if exists "owners can insert own maintenance tickets"
  on public.property_maintenance_tickets;
create policy "owners can insert own maintenance tickets"
on public.property_maintenance_tickets
for insert
with check (
  reported_by_user_id = auth.uid()
  or exists (
    select 1
    from public.property_listings l
    where l.id = listing_id and l.owner_user_id = auth.uid()
  )
  or public.is_property_staff()
);

drop policy if exists "staff can manage maintenance tickets"
  on public.property_maintenance_tickets;
create policy "staff can manage maintenance tickets"
on public.property_maintenance_tickets
for update
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "staff can delete maintenance tickets"
  on public.property_maintenance_tickets;
create policy "staff can delete maintenance tickets"
on public.property_maintenance_tickets
for delete
using (public.is_property_staff());

drop trigger if exists trg_property_maintenance_tickets_updated_at
  on public.property_maintenance_tickets;
create trigger trg_property_maintenance_tickets_updated_at
before update on public.property_maintenance_tickets
for each row execute function public.set_updated_at();
