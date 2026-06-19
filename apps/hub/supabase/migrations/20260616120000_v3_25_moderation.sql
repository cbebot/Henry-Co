-- =============================================================================
-- V3-25 — Content Moderation Framework: moderation_decisions + moderation_reports
-- =============================================================================
-- One cross-division moderation spine. The two tables are the single source of
-- moderation truth that every publishable surface (marketplace listings, jobs
-- posts, studio briefs, provider/service profiles) passes through.
--
-- Design notes / invariants:
--   * moderation_decisions is an OPERATOR ledger: end users can NEVER read it.
--     Only staff (is_staff_in_any) read it; the pipeline (service-role) inserts.
--     A re-scan is idempotent on (content_type, content_id, content_hash,
--     scanner) — automated rows and a later scanner='manual' staff row coexist,
--     the manual one supersedes at read time (human-gated).
--   * moderation_reports is a USER artifact: a reporter reads ONLY their own
--     rows; staff read all + change status. All writes (report insert, status
--     change) go through service-role server actions — no request-role write
--     grant exists (a user can never forge a decision or another's report).
--   * content_snapshot is PII-REDACTED before it is ever written (no raw phone /
--     email / address / keyed PII) — see @henryco/moderation buildContentSnapshot.
--   * content_type CHECK is kept in lockstep with the ModerationInput.ContentType
--     union in @henryco/moderation/types — adding a domain requires widening both
--     (constraint-drift guard; see notifications_constraint_drift learning).
--
-- Apply protocol (committed-NOT-applied; OWNER-GATED):
--   supabase db query --linked --workdir apps/hub \
--     -f supabase/migrations/20260616120000_v3_25_moderation.sql
--   (ONE atomic txn; never `supabase db push` — that would also ship the
--    committed-NOT-applied FL2 money set). Live ramp stays behind the
--    MODERATION_ENFORCED flag; deterministic-only is the always-safe floor.
--
-- Depends on: public.is_staff_in_any() (20260508120000_is_staff_in_any.sql),
--             public.data_retention_policies (governance map).
-- =============================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- moderation_decisions — the operator decision ledger (+ training corpus)
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  content_type text not null
    check (content_type in ('marketplace_listing','job_post','studio_brief','service_profile')),
  content_id text not null,
  content_hash text not null,                 -- dedupe key for idempotent re-scan
  content_snapshot jsonb not null,            -- PII-redacted snapshot for audit/training
  decision text not null check (decision in ('approve','hold','reject')),
  reasons text[] not null default '{}',
  scanner text not null check (scanner in ('deterministic_rule','ai_check','manual')),
  reviewer uuid references auth.users(id) on delete set null,   -- NULL for automated
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists moderation_decisions_content_idx
  on public.moderation_decisions(content_type, content_id, created_at desc);

create unique index if not exists moderation_decisions_dedupe_idx
  on public.moderation_decisions(content_type, content_id, content_hash, scanner);

-- ---------------------------------------------------------------------------
-- moderation_reports — user-filed reports against published content
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  content_type text not null
    check (content_type in ('marketplace_listing','job_post','studio_brief','service_profile')),
  content_id text not null,
  reporter_id uuid references auth.users(id) on delete set null,
  reason_code text not null,                   -- controlled vocab from the report sheet
  detail text,
  status text not null default 'open'
    check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists moderation_reports_content_idx
  on public.moderation_reports(content_type, content_id, created_at desc);

create index if not exists moderation_reports_status_idx
  on public.moderation_reports(status, created_at desc)
  where status in ('open','reviewing');

create index if not exists moderation_reports_reporter_idx
  on public.moderation_reports(reporter_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — decisions: staff-read only; service-role writes; end users see nothing
-- ---------------------------------------------------------------------------
alter table public.moderation_decisions enable row level security;

-- Staff/moderator read the queue. No end-user policy exists, so non-staff
-- authenticated callers get ZERO rows even with the table SELECT grant.
drop policy if exists moderation_decisions_staff_select on public.moderation_decisions;
create policy moderation_decisions_staff_select
  on public.moderation_decisions
  for select
  using (public.is_staff_in_any());

-- Explicit service-role full access (belt-and-suspenders alongside bypassrls).
drop policy if exists moderation_decisions_service_all on public.moderation_decisions;
create policy moderation_decisions_service_all
  on public.moderation_decisions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- SELECT granted to authenticated so the staff policy can return rows; all
-- writes are service-role only (pipeline + staff server actions).
grant select on public.moderation_decisions to authenticated;
grant all on public.moderation_decisions to service_role;
revoke insert, update, delete, truncate on table public.moderation_decisions from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- RLS — reports: reporter reads own; staff read all; service-role writes
-- ---------------------------------------------------------------------------
alter table public.moderation_reports enable row level security;

-- A reporter reads ONLY their own reports.
drop policy if exists moderation_reports_reporter_select on public.moderation_reports;
create policy moderation_reports_reporter_select
  on public.moderation_reports
  for select
  using (reporter_id = auth.uid());

-- Staff read every report (the unified queue).
drop policy if exists moderation_reports_staff_select on public.moderation_reports;
create policy moderation_reports_staff_select
  on public.moderation_reports
  for select
  using (public.is_staff_in_any());

-- Explicit service-role full access.
drop policy if exists moderation_reports_service_all on public.moderation_reports;
create policy moderation_reports_service_all
  on public.moderation_reports
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- SELECT granted to authenticated for the reporter-own + staff read policies;
-- report insert + status change go through service-role server actions only.
grant select on public.moderation_reports to authenticated;
grant all on public.moderation_reports to service_role;
revoke insert, update, delete, truncate on table public.moderation_reports from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Governance — register both tables in the data-retention map from day one.
-- Guarded: self-skips on chains where data_retention_policies is absent (e.g.
-- the vanilla CI invariant DB) and runs on prod where the governance map exists.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.data_retention_policies') is null
     or to_regclass('public.data_governance_domains') is null then
    raise notice 'governance tables absent — skipping governance registration';
    return;
  end if;

  -- moderation is its own governance domain (P7 Trust & Safety), distinct from
  -- staff_audit. data_retention_policies.domain_key FKs data_governance_domains,
  -- so register the domain first (idempotent).
  execute $dom$
    insert into public.data_governance_domains (
      domain_key, display_name, owner_team, classification, restore_priority,
      source_of_truth, backup_dependency, retention_summary, notes
    ) values (
      'trust_safety',
      'Trust & safety / content moderation',
      'Trust & Safety',
      'OPERATOR / TRUST SIGNAL / LABELED MODERATION CORPUS (PII-redacted)',
      5,
      'moderation_decisions, moderation_reports',
      'Supabase database backups.',
      'Moderation decisions retained as an audit + training corpus; user reports retained while open and for a trailing window after resolution.',
      'content_snapshot is PII-redacted by construction; never store raw content body.'
    )
    on conflict (domain_key) do nothing;
  $dom$;

  execute $ret$
    insert into public.data_retention_policies (
      domain_key, table_name, data_classification, retention_rule, retention_action,
      soft_delete_required, archive_required, legal_hold_supported,
      destructive_prune_allowed, backup_requirement, restore_source, owner_team, notes
    ) values (
      'trust_safety',
      'moderation_decisions',
      'OPERATOR DECISION LEDGER / LABELED MODERATION CORPUS (PII-redacted)',
      'Retain as the moderation audit + training corpus; review retention with Trust & Safety annually.',
      'Archive aged rows; never destructively prune without Trust & Safety + legal sign-off.',
      false, true, true, false,
      'Provider database backup.',
      'Re-derived only by re-scanning live content; the decision history is authoritative.',
      'Trust & Safety',
      'content_snapshot is PII-redacted by construction (no raw phone/email/address/keyed PII); never store raw content body.'
    ),
    (
      'trust_safety',
      'moderation_reports',
      'USER-FILED REPORT / TRUST SIGNAL',
      'Retain while open/reviewing and for a trailing audit window after resolution.',
      'Soft-status to resolved/dismissed; hard-delete on reporter account closure (reporter_id set null).',
      true, true, true, false,
      'Provider database backup.',
      'Not re-derivable — user-submitted; the report row is authoritative.',
      'Trust & Safety',
      'A reporter reads only their own reports; staff read all. No request-role write grant.'
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
  $ret$;
end $$;

commit;
