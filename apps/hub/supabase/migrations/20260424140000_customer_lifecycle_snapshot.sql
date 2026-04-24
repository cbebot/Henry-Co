-- V2 customer lifecycle snapshot layer.
--
-- Purpose: a normalized per-(user_id, pillar) snapshot of where a customer
-- is in their HenryCo journey, derived from existing transactional tables.
-- This does NOT duplicate transactional data — it caches the summary so
-- staff surfaces can scan lifecycle state without rescanning every division.
--
-- Guarantees:
-- - additive only (no changes to existing tables)
-- - service-role only (no browser-readable RLS policies)
-- - lifecycle governance row added to data_retention_policies
-- - retention lifecycle columns added (archived_at, legal_hold_reason, etc.)
-- - no PII or secrets — stores pillar state plus next-action deep link only

begin;

create extension if not exists pgcrypto;

create table if not exists public.customer_lifecycle_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pillar text not null,
  division text not null default 'account',
  stage text not null,
  status text not null default '',
  priority text not null default 'normal',
  blocker_reason text,
  last_active_at timestamptz,
  last_event_at timestamptz,
  next_action_label text,
  next_action_url text,
  reference_type text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  archive_reason text,
  retention_hold_until timestamptz,
  legal_hold_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, pillar)
);

create index if not exists customer_lifecycle_snapshots_user_idx
  on public.customer_lifecycle_snapshots(user_id);

create index if not exists customer_lifecycle_snapshots_stage_idx
  on public.customer_lifecycle_snapshots(stage, priority, last_active_at desc);

create index if not exists customer_lifecycle_snapshots_pillar_idx
  on public.customer_lifecycle_snapshots(pillar, stage);

create index if not exists customer_lifecycle_snapshots_reengagement_idx
  on public.customer_lifecycle_snapshots(last_active_at)
  where stage in ('dormant', 'reengagement_candidate', 'churn_risk');

alter table public.customer_lifecycle_snapshots enable row level security;

-- Service-role only. Do not expose to browser clients.
drop policy if exists customer_lifecycle_snapshots_service_role_all
  on public.customer_lifecycle_snapshots;

create or replace function public.customer_lifecycle_snapshots_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists customer_lifecycle_snapshots_updated_at
  on public.customer_lifecycle_snapshots;
create trigger customer_lifecycle_snapshots_updated_at
before update on public.customer_lifecycle_snapshots
for each row execute function public.customer_lifecycle_snapshots_set_updated_at();

-- Record governance for the new table so lifecycle becomes part of the
-- data-retention map from day one.
insert into public.data_retention_policies (
  domain_key,
  table_name,
  data_classification,
  retention_rule,
  retention_action,
  soft_delete_required,
  archive_required,
  legal_hold_supported,
  destructive_prune_allowed,
  backup_requirement,
  restore_source,
  owner_team,
  notes
) values (
  'identity_account',
  'customer_lifecycle_snapshots',
  'DERIVED SUMMARY / CUSTOMER CONTEXT',
  'Retain while customer account is active; snapshot is derived and can be recomputed from source tables if purged.',
  'Soft-delete with account closure; archive stale rows only after written policy.',
  true,
  true,
  false,
  false,
  'Provider database backup; source tables are authoritative and reconstruct this layer.',
  'Recompute via lifecycle collector from customer_activity, marketplace_orders, support_threads, wallets, care_bookings, logistics_shipments, studio_projects.',
  'Platform',
  'Never store raw PII, payment card/bank secrets, or support content in metadata — only stage, timing, and deep-link references.'
)
on conflict (schema_name, table_name) do update
set
  domain_key = excluded.domain_key,
  data_classification = excluded.data_classification,
  retention_rule = excluded.retention_rule,
  retention_action = excluded.retention_action,
  soft_delete_required = excluded.soft_delete_required,
  archive_required = excluded.archive_required,
  legal_hold_supported = excluded.legal_hold_supported,
  destructive_prune_allowed = excluded.destructive_prune_allowed,
  backup_requirement = excluded.backup_requirement,
  restore_source = excluded.restore_source,
  owner_team = excluded.owner_team,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

commit;
