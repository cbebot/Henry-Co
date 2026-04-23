-- V2 data-governance, retention, and recovery foundation.
--
-- This migration is intentionally additive:
-- - it records data ownership/retention/recovery policy in queryable tables;
-- - it adds lifecycle metadata columns only when target tables already exist;
-- - it does not delete, prune, archive, or expose customer/staff data;
-- - governance tables have RLS enabled and no browser-readable policies.

begin;

create extension if not exists pgcrypto;

create or replace function public.data_governance_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.data_governance_domains (
  domain_key text primary key,
  display_name text not null,
  owner_team text not null,
  classification text not null,
  restore_priority integer not null check (restore_priority between 1 and 99),
  source_of_truth text not null,
  backup_dependency text not null,
  retention_summary text not null,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.data_retention_policies (
  id uuid primary key default gen_random_uuid(),
  domain_key text not null references public.data_governance_domains(domain_key) on delete cascade,
  schema_name text not null default 'public',
  table_name text not null,
  data_classification text not null,
  retention_rule text not null,
  retention_action text not null,
  soft_delete_required boolean not null default false,
  archive_required boolean not null default false,
  legal_hold_supported boolean not null default false,
  destructive_prune_allowed boolean not null default false,
  backup_requirement text not null,
  restore_source text not null,
  owner_team text not null,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (schema_name, table_name)
);

create table if not exists public.data_storage_surfaces (
  surface_key text primary key,
  domain_key text not null references public.data_governance_domains(domain_key) on delete cascade,
  storage_system text not null,
  bucket_or_provider text not null,
  modeled_table text,
  path_column text,
  data_classification text not null,
  retention_rule text not null,
  backup_truth text not null,
  restore_source text not null,
  owner_team text not null,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.data_recovery_drill_runs (
  id uuid primary key default gen_random_uuid(),
  drill_key text not null,
  domain_key text references public.data_governance_domains(domain_key) on delete set null,
  environment text not null default 'production',
  status text not null default 'planned',
  actor_user_id uuid references auth.users(id) on delete set null,
  scope_summary text not null,
  backup_source_checked text,
  storage_source_checked text,
  restore_target text,
  verification_results jsonb not null default '{}'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists data_retention_policies_domain_idx
  on public.data_retention_policies(domain_key, data_classification);

create index if not exists data_storage_surfaces_domain_idx
  on public.data_storage_surfaces(domain_key, storage_system);

create index if not exists data_recovery_drill_runs_domain_idx
  on public.data_recovery_drill_runs(domain_key, environment, started_at desc);

alter table public.data_governance_domains enable row level security;
alter table public.data_retention_policies enable row level security;
alter table public.data_storage_surfaces enable row level security;
alter table public.data_recovery_drill_runs enable row level security;

drop trigger if exists data_governance_domains_updated_at on public.data_governance_domains;
create trigger data_governance_domains_updated_at
before update on public.data_governance_domains
for each row execute function public.data_governance_set_updated_at();

drop trigger if exists data_retention_policies_updated_at on public.data_retention_policies;
create trigger data_retention_policies_updated_at
before update on public.data_retention_policies
for each row execute function public.data_governance_set_updated_at();

drop trigger if exists data_storage_surfaces_updated_at on public.data_storage_surfaces;
create trigger data_storage_surfaces_updated_at
before update on public.data_storage_surfaces
for each row execute function public.data_governance_set_updated_at();

drop trigger if exists data_recovery_drill_runs_updated_at on public.data_recovery_drill_runs;
create trigger data_recovery_drill_runs_updated_at
before update on public.data_recovery_drill_runs
for each row execute function public.data_governance_set_updated_at();

insert into public.data_governance_domains (
  domain_key,
  display_name,
  owner_team,
  classification,
  restore_priority,
  source_of_truth,
  backup_dependency,
  retention_summary,
  notes
) values
  (
    'identity_account',
    'Identity and account',
    'Platform',
    'CRITICAL SYSTEM OF RECORD / CUSTOMER CONTENT',
    1,
    'profiles, customer_profiles, customer_preferences, customer_security_log, auth-managed Supabase users',
    'Supabase database backups for public metadata; Supabase Auth provider state for auth users; repo migrations rebuild structure only.',
    'Retain active profile data until approved closure/deletion review; never hard-delete finance/trust-linked identities without compliance review.',
    'Auth schema is provider-managed and is not fully reconstructible from app migrations.'
  ),
  (
    'support_notifications',
    'Support and notifications',
    'Support / Platform',
    'CUSTOMER CONTENT / OPERATIONAL LOG',
    2,
    'support_threads, support_messages, customer_notifications, notification_delivery_log',
    'Supabase database backups for rows; external email/SMS/push provider logs are secondary and not HenryCo source of truth.',
    'Support content is long-retention; user-visible notifications may be archived/soft-deleted after policy review; delivery logs are operational evidence.',
    'Partner/internal notifications remain separate from customer-visible inbox rows.'
  ),
  (
    'finance_commerce',
    'Finance and commerce',
    'Finance / Marketplace',
    'CRITICAL SYSTEM OF RECORD / LONG-RETENTION REQUIRED',
    3,
    'customer_wallet_transactions, funding/withdrawal requests, marketplace orders, payments, payouts, pricing quotes',
    'Supabase database backups plus provider reconciliation exports where providers are actually operational.',
    'Retain financial, order, payout, tax, dispute, and reconciliation records for legal/accounting retention; destructive pruning is not allowed in V2.',
    'Stripe remains test-only unless independently proven live; bank-transfer/proof flows are retained as business evidence.'
  ),
  (
    'division_operations',
    'Division operations',
    'Operations',
    'CRITICAL SYSTEM OF RECORD / STAFF INTERNAL',
    4,
    'care bookings, jobs applications/interviews, learn enrollments/certificates, logistics shipments, property listings/viewings, studio projects/proposals/payments',
    'Supabase database backups for normalized rows; Supabase Storage and Cloudinary/external asset exports for files.',
    'Operational records are archived, not destroyed, while open obligations, disputes, certificates, inspections, shipments, or projects remain active.',
    'Some division schemas are repo-present but not exposed/applied in the live REST probe; policy rows document intended governance without faking live maturity.'
  ),
  (
    'staff_audit',
    'Staff audit and operational events',
    'Platform / Trust',
    'STAFF INTERNAL / OPERATIONAL LOG / LONG-RETENTION REQUIRED',
    5,
    'audit_logs, staff_audit_logs, staff_navigation_audit, marketplace_audit_logs, workspace_operational_events',
    'Supabase database backups; application logs/Sentry are supplemental only.',
    'Sensitive staff actions and access/navigation evidence are retained for audit and incident review; no automatic destructive cleanup is deployed in V2.',
    'Audit rows must not store raw provider secrets, credentials, or full private payloads.'
  ),
  (
    'integration_webhook',
    'Integrations, webhooks, and idempotency',
    'Platform',
    'OPERATIONAL LOG / DERIVED OR REPLAYABLE',
    6,
    'account_webhook_receipts, account_idempotency_keys, notification_delivery_log, provider-specific delivery logs',
    'Supabase database backups; provider dashboards are secondary evidence; idempotency keys may be pruned only after policy approval.',
    'Webhook receipts and delivery attempts are retained long enough for replay/reconciliation; do not prune records tied to unresolved finance/support incidents.',
    'APIs + Partnerships remains drafted and is not widened by this migration.'
  )
on conflict (domain_key) do update
set
  display_name = excluded.display_name,
  owner_team = excluded.owner_team,
  classification = excluded.classification,
  restore_priority = excluded.restore_priority,
  source_of_truth = excluded.source_of_truth,
  backup_dependency = excluded.backup_dependency,
  retention_summary = excluded.retention_summary,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

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
) values
  ('identity_account', 'profiles', 'CRITICAL SYSTEM OF RECORD', 'Until approved account closure/deletion review; retain non-erasable finance/trust references separately.', 'Soft-delete or anonymize eligible PII only after manual compliance review.', true, true, true, false, 'Provider database backup plus manual export for requests.', 'Supabase DB backup or logical export; Auth user restore is provider/manual.', 'Platform', 'Auth.users is provider-managed and not fully represented by this table.'),
  ('identity_account', 'customer_profiles', 'CRITICAL SYSTEM OF RECORD', 'Until approved account closure/deletion review.', 'Soft-delete/anonymize eligible PII; retain compliance references.', true, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Platform', ''),
  ('identity_account', 'customer_preferences', 'DERIVED / CUSTOMER CONTENT', 'Until account closure or preference reset.', 'Soft-delete with profile closure or reset by user/staff.', true, true, false, false, 'Provider database backup.', 'Rebuildable from defaults plus DB restore.', 'Platform', ''),
  ('identity_account', 'customer_security_log', 'OPERATIONAL LOG / SECURITY', 'Long-retention while security/fraud review remains relevant.', 'Archive; do not hard-delete active security evidence.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Platform / Trust', ''),
  ('identity_account', 'customer_documents', 'CUSTOMER CONTENT / KYC', 'Retain according to KYC/trust policy and legal hold; delete only after manual review if no longer required.', 'Private archive/soft-delete; no raw public exposure.', true, true, true, false, 'Database metadata plus external asset backup/export.', 'Supabase DB backup for metadata; Cloudinary/Supabase Storage export for object bytes.', 'Trust', 'Live table exists, but its create migration was not found in repo.'),
  ('support_notifications', 'support_threads', 'CUSTOMER CONTENT / LONG-RETENTION REQUIRED', 'Long-retention for legal/support continuity.', 'Archive/soft-delete from active queues; do not destructively prune in V2.', true, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Support / Legal', ''),
  ('support_notifications', 'support_messages', 'CUSTOMER CONTENT / LONG-RETENTION REQUIRED', 'Long-retention for legal/support continuity.', 'Archive/soft-delete from active queues; do not destructively prune in V2.', true, true, true, false, 'Provider database backup plus attachment export where present.', 'Supabase DB backup or logical export plus object backup.', 'Support / Legal', ''),
  ('support_notifications', 'customer_notifications', 'CUSTOMER CONTENT / OPERATIONAL LOG', 'Retain while useful to account history; archive before hiding from user inbox.', 'Use read/archived/deleted lifecycle columns; no hard-delete automation in V2.', true, true, false, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Platform', 'Lifecycle columns already exist in account hardening migration.'),
  ('support_notifications', 'notification_delivery_log', 'OPERATIONAL LOG', 'Retain for delivery/debugging and unresolved incident review.', 'Archive operationally; prune only after written policy and no unresolved incidents.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export; provider logs are secondary.', 'Platform', ''),
  ('finance_commerce', 'customer_wallet_transactions', 'CRITICAL SYSTEM OF RECORD', 'Finance/legal retention; no destructive pruning in V2.', 'Archive only after accounting close; legal hold supported.', false, true, true, false, 'Provider database backup plus finance exports.', 'Supabase DB backup; manual reconciliation against provider/bank records.', 'Finance', ''),
  ('finance_commerce', 'customer_wallet_funding_requests', 'CRITICAL SYSTEM OF RECORD', 'Finance/legal retention; no destructive pruning in V2.', 'Archive closed requests; retain proof metadata.', false, true, true, false, 'Provider database backup plus proof asset backup.', 'Supabase DB backup plus object/provider asset restore.', 'Finance', 'Repo migration exists, but live REST probe did not expose this table on 2026-04-23.'),
  ('finance_commerce', 'customer_wallet_withdrawal_requests', 'CRITICAL SYSTEM OF RECORD', 'Finance/legal retention; no destructive pruning in V2.', 'Archive closed requests; retain approval/rejection evidence.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup plus manual payout reconciliation.', 'Finance', 'Repo migration exists, but live REST probe did not expose this table on 2026-04-23.'),
  ('finance_commerce', 'marketplace_orders', 'CRITICAL SYSTEM OF RECORD', 'Finance/order/tax retention.', 'Archive after lifecycle close; no destructive pruning in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup plus order reconciliation.', 'Marketplace / Finance', ''),
  ('finance_commerce', 'marketplace_order_groups', 'CRITICAL SYSTEM OF RECORD', 'Finance/order/tax retention.', 'Archive after lifecycle close; no destructive pruning in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup plus order reconciliation.', 'Marketplace / Finance', ''),
  ('finance_commerce', 'marketplace_payment_records', 'CRITICAL SYSTEM OF RECORD', 'Finance/legal retention.', 'Archive only; no destructive pruning in V2.', false, true, true, false, 'Provider database backup plus provider exports where applicable.', 'Supabase DB backup plus provider/bank reconciliation.', 'Finance', ''),
  ('finance_commerce', 'marketplace_payout_requests', 'CRITICAL SYSTEM OF RECORD', 'Finance/legal retention.', 'Archive only; no destructive pruning in V2.', false, true, true, false, 'Provider database backup plus payout evidence.', 'Supabase DB backup plus manual reconciliation.', 'Finance / Marketplace', ''),
  ('finance_commerce', 'marketplace_disputes', 'CRITICAL SYSTEM OF RECORD / SUPPORT', 'Retain through dispute, legal, and finance retention window.', 'Archive resolved disputes; no destructive pruning in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup plus support/order reconciliation.', 'Trust / Marketplace', ''),
  ('division_operations', 'care_bookings', 'CRITICAL SYSTEM OF RECORD', 'Retain for service, support, and finance continuity.', 'Archive completed bookings; no destructive pruning in V2.', false, true, true, false, 'Provider database backup plus receipt/proof asset export.', 'Supabase DB backup plus external asset restore.', 'Care Ops', ''),
  ('division_operations', 'jobs_applications', 'CUSTOMER CONTENT / STAFF INTERNAL', 'Retain while hiring/legal review remains relevant.', 'Archive closed applications; deletion only after approved request and legal review.', true, true, true, false, 'Provider database backup plus document storage backup.', 'Supabase DB backup plus storage object export.', 'Jobs Ops', ''),
  ('division_operations', 'jobs_interview_sessions', 'OPERATIONAL LOG / STAFF INTERNAL', 'Retain while application is active and for post-hiring review.', 'Archive; do not hard-delete in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Jobs Ops', 'Repo migration exists, but live REST probe did not expose this table on 2026-04-23.'),
  ('division_operations', 'learn_enrollments', 'CRITICAL SYSTEM OF RECORD', 'Retain enrollment history while learner account/corporate reporting requires it.', 'Archive, not hard-delete, except approved account deletion scope.', true, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Learn Ops', 'Repo migration exists, but live REST probe did not expose this table on 2026-04-23.'),
  ('division_operations', 'learn_certificates', 'CRITICAL SYSTEM OF RECORD', 'Long-retention for certification verification.', 'Never destroy active certificate verification evidence in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup; regenerate public verification only from restored certificate rows.', 'Learn Ops', 'Repo migration exists, but live REST probe did not expose this table on 2026-04-23.'),
  ('division_operations', 'logistics_shipments', 'CRITICAL SYSTEM OF RECORD', 'Retain through delivery, claims, and support window.', 'Archive completed shipments; no destructive pruning in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup plus proof/tracking reconciliation.', 'Logistics Ops', ''),
  ('division_operations', 'property_listings', 'CUSTOMER CONTENT / OPERATIONAL RECORD', 'Retain listing submission/review evidence while listing, inspection, or dispute remains relevant.', 'Archive/soft-delete inactive listings; retain review evidence.', true, true, true, false, 'Provider database backup plus property bucket export.', 'Supabase DB backup plus storage object restore.', 'Property Ops', 'Repo migration exists, but live REST probe did not expose normalized property tables on 2026-04-23; runtime bucket data is live.'),
  ('division_operations', 'property_viewing_requests', 'CUSTOMER CONTENT / OPERATIONAL RECORD', 'Retain viewing/inspection trail while operationally or legally relevant.', 'Archive closed requests; no destructive pruning in V2.', true, true, true, false, 'Provider database backup plus runtime JSON backup.', 'Supabase DB backup and property-runtime object restore.', 'Property Ops', 'Repo migration exists, but live REST probe did not expose this table on 2026-04-23.'),
  ('division_operations', 'studio_projects', 'CRITICAL SYSTEM OF RECORD', 'Retain while project, payment, support, or legal obligations remain active.', 'Archive completed projects; deletion only after approved account/client review.', true, true, true, false, 'Provider database backup plus studio-assets object export.', 'Supabase DB backup plus storage object restore.', 'Studio Ops', ''),
  ('division_operations', 'studio_proposals', 'CRITICAL SYSTEM OF RECORD', 'Retain accepted/rejected proposal and milestone evidence.', 'Archive expired proposals; no destructive pruning in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Studio Ops', ''),
  ('division_operations', 'studio_payments', 'CRITICAL SYSTEM OF RECORD', 'Finance/legal retention.', 'Archive only; no destructive pruning in V2.', false, true, true, false, 'Provider database backup plus proof asset export.', 'Supabase DB backup plus external asset restore.', 'Studio / Finance', ''),
  ('staff_audit', 'audit_logs', 'STAFF INTERNAL / OPERATIONAL LOG', 'Long-retention for security, compliance, and incident response.', 'Archive; destructive pruning requires explicit legal/security approval.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Platform / Trust', 'Existing doc overclaim of automatic 90-day deletion is corrected by the V2 governance docs.'),
  ('staff_audit', 'staff_audit_logs', 'STAFF INTERNAL / OPERATIONAL LOG', 'Long-retention for staff action accountability.', 'Archive; destructive pruning requires explicit legal/security approval.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Platform / Trust', 'Existing doc overclaim of automatic 90-day deletion is corrected by the V2 governance docs.'),
  ('staff_audit', 'staff_navigation_audit', 'STAFF INTERNAL / OPERATIONAL LOG', 'Retain for access review and incident investigation.', 'Archive; destructive pruning requires explicit security approval.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Platform / Trust', ''),
  ('staff_audit', 'marketplace_audit_logs', 'STAFF INTERNAL / OPERATIONAL LOG', 'Retain for marketplace moderation and dispute evidence.', 'Archive; destructive pruning requires explicit legal/security approval.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Marketplace / Trust', ''),
  ('integration_webhook', 'account_webhook_receipts', 'OPERATIONAL LOG', 'Retain while replay/reconciliation risk exists.', 'Archive; prune only after idempotency/replay window and incident review.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Platform', 'Repo migration exists, but live REST probe did not expose this table on 2026-04-23.'),
  ('integration_webhook', 'account_idempotency_keys', 'TEMPORARY / CACHE-LIKE', 'Retain through retry/replay safety window.', 'Eligible for future pruned cleanup only after scheduler and incident exception rules exist.', false, false, false, true, 'Provider database backup is sufficient; not a long-term system of record.', 'Rebuildable after retry window; restore only for active incidents.', 'Platform', 'Repo migration exists, but live REST probe did not expose this table on 2026-04-23.'),
  ('integration_webhook', 'pricing_quotes', 'CRITICAL SYSTEM OF RECORD / DERIVED SNAPSHOT', 'Retain quotes needed for customer, invoice, or dispute context.', 'Archive expired quotes; no destructive pruning in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or recompute only when immutable inputs are available.', 'Pricing / Finance', ''),
  ('integration_webhook', 'pricing_override_events', 'STAFF INTERNAL / OPERATIONAL LOG', 'Retain override evidence for audit.', 'Archive; no destructive pruning in V2.', false, true, true, false, 'Provider database backup.', 'Supabase DB backup or logical export.', 'Pricing / Trust', '')
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

insert into public.data_storage_surfaces (
  surface_key,
  domain_key,
  storage_system,
  bucket_or_provider,
  modeled_table,
  path_column,
  data_classification,
  retention_rule,
  backup_truth,
  restore_source,
  owner_team,
  notes
) values
  ('company-assets', 'identity_account', 'Supabase Storage', 'company-assets', null, null, 'PUBLIC ASSET', 'Retain while referenced by active company surfaces.', 'Supabase database backups do not restore deleted Storage objects; bucket must be backed up separately.', 'Supabase Storage S3-compatible export or dashboard/object copy.', 'Brand / Platform', 'Live bucket is public.'),
  ('hq-internal-comms', 'staff_audit', 'Supabase Storage', 'hq-internal-comms', 'hq_internal_comm_attachments', 'storage_path', 'STAFF INTERNAL / CUSTOMER CONTENT', 'Long-retention with internal comm thread.', 'Supabase database backup covers metadata only; object bytes require storage export.', 'Supabase Storage S3-compatible export plus DB metadata restore.', 'HQ / Platform', 'Bucket is private with storage policies in repo.'),
  ('property-runtime', 'division_operations', 'Supabase Storage', 'property-runtime', null, 'runtime JSON object paths', 'CRITICAL SYSTEM OF RECORD / RUNTIME SNAPSHOT', 'Retain active runtime JSON until normalized DB source is live and verified.', 'Database backups do not restore object bytes; runtime JSON must be exported.', 'Supabase Storage S3-compatible export.', 'Property Ops', 'Live private bucket; normalized property tables were not exposed by REST probe on 2026-04-23.'),
  ('property-media', 'division_operations', 'Supabase Storage', 'property-media', 'property_listing_media', 'media_url', 'CUSTOMER CONTENT / PUBLIC MEDIA', 'Retain while listing is active or review evidence is required.', 'Database backups do not restore object bytes; public bucket objects require separate export.', 'Supabase Storage S3-compatible export.', 'Property Ops', 'Live public bucket.'),
  ('property-documents', 'division_operations', 'Supabase Storage', 'property-documents', 'property_listing_applications', 'document paths', 'CUSTOMER CONTENT / PRIVATE DOCUMENT', 'Retain with listing/application review and legal hold.', 'Database backups do not restore object bytes; private documents require separate export.', 'Supabase Storage S3-compatible export.', 'Property Ops / Trust', 'Live private bucket.'),
  ('jobs-documents', 'division_operations', 'Supabase Storage', 'jobs-documents', 'jobs_applications', 'file_url/storage_path metadata', 'CUSTOMER CONTENT / PRIVATE DOCUMENT', 'Retain with application review and legal hold.', 'Database backups do not restore object bytes; documents require separate export.', 'Supabase Storage S3-compatible export.', 'Jobs Ops / Trust', 'Live private bucket.'),
  ('learn-teaching-files', 'division_operations', 'Supabase Storage', 'learn_teacher_applications', 'supporting_files', 'CUSTOMER CONTENT / PRIVATE DOCUMENT', 'Retain with teacher application/review evidence.', 'Database backups do not restore object bytes; supporting files require separate export.', 'Supabase Storage S3-compatible export.', 'Learn Ops', 'Live private bucket; bucket creation is also in learn migration.'),
  ('studio-assets', 'division_operations', 'Supabase Storage', 'studio-assets', 'studio_project_files', 'path/bucket', 'CUSTOMER CONTENT / PRIVATE PROJECT ASSET', 'Retain with project/proposal/payment obligations.', 'Database backups do not restore object bytes; project assets require separate export.', 'Supabase Storage S3-compatible export.', 'Studio Ops', 'Live private bucket created/ensured by app runtime.'),
  ('cloudinary-care-marketplace-account', 'division_operations', 'Cloudinary', 'configured Cloudinary cloud/folder', 'customer_documents, care receipts/reviews/media, marketplace seller documents, wallet proofs', 'file_url/proof_url/public_id metadata', 'CUSTOMER CONTENT / BUSINESS EVIDENCE', 'Retain while referenced by KYC, finance, support, care, or marketplace records.', 'Repo has metadata only; no Cloudinary asset export job exists in this pass.', 'Cloudinary Admin/API export or provider backup plus DB metadata restore.', 'Platform / Division Ops', 'Cloudinary is operational in repo, but backup/export automation is not implemented here.')
on conflict (surface_key) do update
set
  domain_key = excluded.domain_key,
  storage_system = excluded.storage_system,
  bucket_or_provider = excluded.bucket_or_provider,
  modeled_table = excluded.modeled_table,
  path_column = excluded.path_column,
  data_classification = excluded.data_classification,
  retention_rule = excluded.retention_rule,
  backup_truth = excluded.backup_truth,
  restore_source = excluded.restore_source,
  owner_team = excluded.owner_team,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'customer_profiles',
    'customer_documents',
    'customer_notifications',
    'support_threads',
    'support_messages',
    'marketplace_products',
    'marketplace_reviews',
    'marketplace_reports',
    'marketplace_support_threads',
    'marketplace_support_messages',
    'jobs_applications',
    'learn_enrollments',
    'property_listings',
    'property_listing_media',
    'property_viewing_requests',
    'property_listing_applications',
    'studio_projects',
    'studio_project_files',
    'studio_deliverables'
  ]
  loop
    if to_regclass('public.' || target_table) is not null then
      execute format(
        'alter table public.%I
          add column if not exists archived_at timestamptz,
          add column if not exists archive_reason text,
          add column if not exists deleted_at timestamptz,
          add column if not exists deleted_reason text,
          add column if not exists retention_hold_until timestamptz,
          add column if not exists legal_hold_reason text',
        target_table
      );
    end if;
  end loop;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'audit_logs',
    'staff_audit_logs',
    'staff_navigation_audit',
    'marketplace_audit_logs',
    'workspace_operational_events',
    'customer_activity',
    'customer_security_log',
    'customer_wallet_transactions',
    'customer_wallet_funding_requests',
    'customer_wallet_withdrawal_requests',
    'customer_verification_submissions',
    'customer_trust_profiles',
    'marketplace_orders',
    'marketplace_order_groups',
    'marketplace_payment_records',
    'marketplace_payout_requests',
    'marketplace_returns',
    'marketplace_disputes',
    'care_bookings',
    'jobs_interview_sessions',
    'jobs_interview_events',
    'learn_certificates',
    'learn_certificate_verification',
    'learn_teacher_applications',
    'logistics_shipments',
    'logistics_events',
    'logistics_proof_of_delivery',
    'logistics_issues',
    'property_managed_records',
    'studio_proposals',
    'studio_project_milestones',
    'studio_payments',
    'notification_delivery_log',
    'account_webhook_receipts',
    'account_idempotency_keys',
    'pricing_quotes',
    'pricing_override_events'
  ]
  loop
    if to_regclass('public.' || target_table) is not null then
      execute format(
        'alter table public.%I
          add column if not exists archived_at timestamptz,
          add column if not exists archive_reason text,
          add column if not exists retention_hold_until timestamptz,
          add column if not exists legal_hold_reason text',
        target_table
      );
    end if;
  end loop;
end;
$$;

commit;
