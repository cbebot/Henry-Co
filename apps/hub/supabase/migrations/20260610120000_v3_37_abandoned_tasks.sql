-- =============================================================================
-- V3-37 — Abandoned-Task Recovery: public.abandoned_tasks
-- =============================================================================
-- A server-side, owner-RLS record of a half-finished journey (form draft,
-- booking, KYC, proposal, cart) so the account dashboard can surface a one-
-- click "continue where you left off" and a consent-respecting reminder
-- cadence can gently bring the user back.
--
-- Design notes / invariants:
--   * Extends — does not replace — the client-side draft engine
--     (@henryco/lifecycle/drafts, per-origin localStorage) and the server
--     lifecycle snapshot. This table is the cross-subdomain, recoverable
--     pointer the dashboard + cadence read.
--   * user_id is NULLABLE: an anonymous visitor who provides an email/phone
--     gets a row with user_id NULL + claim_email/claim_phone + claim_token.
--     On login the reconciler matches by token or contact and stamps user_id
--     (the Care-booking reconciliation pattern, apps/account/lib/care-sync.ts).
--   * RLS owner-only: a signed-in user reads/updates ONLY their own claimed
--     rows (dismiss / mark recovered). Inserts + reminder bumps + claim
--     stamping are service-role only (detectors / public capture action /
--     cadence cron / login reconciler) — a user can never forge a task, and
--     unclaimed (user_id NULL) rows are invisible to browser clients until
--     claimed.
--   * state JSONB is SECRET-FREE: never card/PAN, KYC document bytes, or raw
--     tokens — only the restorable snapshot needed to land on the next step.
--   * Idempotent detection: UNIQUE(user_id, task_type, task_ref) for claimed
--     rows; UNIQUE(claim_token) for the pre-claim anonymous row.
--
-- After applying to a real project, regenerate types:  pnpm supabase:types
-- (the schema-drift guard already recognises these columns from this DDL).
-- =============================================================================

begin;

create extension if not exists pgcrypto;

create table if not exists public.abandoned_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  task_type text not null
    check (task_type in ('form_draft','booking','kyc','proposal','cart')),
  task_ref text not null,                    -- stable ref to the underlying record/draft
  division text,                             -- division slug for routing + telemetry
  continue_url text not null,                -- deep link built via @henryco/config helpers
  state jsonb not null default '{}'::jsonb,  -- restorable snapshot (NO secrets, NO PANs)
  last_progress_at timestamptz not null default timezone('utc', now()),
  reminder_count integer not null default 0,
  last_reminder_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending','recovered','expired','dismissed')),
  -- anonymous -> authed claim (only-once-identified capture)
  claim_token uuid,
  claim_email text,
  claim_phone text,
  -- retention lifecycle (matches platform governance shape)
  archived_at timestamptz,
  archive_reason text,
  retention_hold_until timestamptz,
  legal_hold_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, task_type, task_ref)
);

-- pending-work scan for the cadence worker (cheap, hot path)
create index if not exists abandoned_tasks_pending_idx
  on public.abandoned_tasks(status, last_progress_at)
  where status = 'pending';

-- dashboard read: a user's own tasks, newest progress first
create index if not exists abandoned_tasks_user_idx
  on public.abandoned_tasks(user_id, status, last_progress_at desc);

-- idempotent anonymous capture + fast claim-by-token
create unique index if not exists abandoned_tasks_claim_token_idx
  on public.abandoned_tasks(claim_token)
  where claim_token is not null;

-- claim-by-contact reconciliation lookup (unclaimed rows only)
create index if not exists abandoned_tasks_claim_email_idx
  on public.abandoned_tasks(claim_email)
  where user_id is null and claim_email is not null;

create or replace function public.abandoned_tasks_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists abandoned_tasks_touch on public.abandoned_tasks;
create trigger abandoned_tasks_touch
  before update on public.abandoned_tasks
  for each row
  execute function public.abandoned_tasks_touch_updated_at();

alter table public.abandoned_tasks enable row level security;

-- Owner reads only their own CLAIMED rows.
drop policy if exists abandoned_tasks_owner_select on public.abandoned_tasks;
create policy abandoned_tasks_owner_select
  on public.abandoned_tasks
  for select
  using (user_id = auth.uid());

-- Owner updates only their own rows (dismiss / mark recovered). The CHECK keeps
-- the row theirs — they cannot reassign it to another user.
drop policy if exists abandoned_tasks_owner_update on public.abandoned_tasks;
create policy abandoned_tasks_owner_update
  on public.abandoned_tasks
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts + reminder bumps + claim stamping are service-role only. authenticated
-- is NOT granted insert: a user can never forge a task about themselves.
grant select, update on public.abandoned_tasks to authenticated;
grant all on public.abandoned_tasks to service_role;

-- Governance row so recovery is in the data-retention map from day one.
insert into public.data_retention_policies (
  domain_key, table_name, data_classification, retention_rule, retention_action,
  soft_delete_required, archive_required, legal_hold_supported,
  destructive_prune_allowed, backup_requirement, restore_source, owner_team, notes
) values (
  'identity_account',
  'abandoned_tasks',
  'CUSTOMER CONTEXT / RECOVERABLE JOURNEY POINTER',
  'Retain while pending or until the journey is recovered/dismissed; expire after the recovery cadence window (default 14 days of no progress).',
  'Soft-status to expired/dismissed; hard-delete on account closure (cascade).',
  true, true, false, false,
  'Provider database backup; underlying division records are authoritative.',
  'Re-derived by the recovery detectors from drafts + division tables.',
  'Platform',
  'state JSONB is secret-free by construction — never card/bank/PAN, KYC document bytes, or raw tokens; only the restorable snapshot to resume the step.'
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
