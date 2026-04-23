# HenryCo V2 Data Governance, Backup, and Recovery

**Classification:** Internal - Production data safety reference  
**Scope:** Critical-table ownership, retention, storage backup truth, recovery assumptions, and V2 limitations  
**Last verified:** 2026-04-23  

This document records the V2 production truth from the repo plus a non-destructive Supabase REST/storage probe using the locally available production service-role environment. It does not claim disaster-recovery automation that does not exist.

## Provider Backup Truth

HenryCo's production data backbone is Supabase Postgres. Supabase documentation says hosted projects receive daily database backups, plan-level backup retention differs by plan, and Point-in-Time Recovery is a paid add-on for Pro, Team, and Enterprise projects. The workspace does not contain a Supabase Management API token or dashboard export proving the HenryCo project plan or PITR status, so PITR is **not proven enabled** in this pass.

Supabase database backups cover database metadata, not Storage object bytes. Deleted Supabase Storage objects are not restored by restoring an old database backup. Storage buckets and Cloudinary assets therefore need separate export/backup procedures.

Repo migrations can reconstruct schema only where migrations exist. They cannot reconstruct live rows, Supabase Auth users, Storage object bytes, Cloudinary assets, or provider dashboard history.

## Critical Data Surfaces Audited

| Area | Tables / surfaces audited | Classification | Live probe truth on 2026-04-23 |
|---|---|---|---|
| Identity / account | `profiles`, `customer_profiles`, `customer_preferences`, `customer_security_log`, `customer_documents`, Supabase Auth users | Critical system of record / customer content | Core public tables reachable; `customer_documents` reachable but create migration not found in repo; Auth is provider-managed |
| Notifications / support | `customer_notifications`, `support_threads`, `support_messages`, `notification_delivery_log` | Customer content / operational log | Reachable |
| Commerce / money | `customer_wallet_transactions`, `customer_wallet_funding_requests`, `customer_wallet_withdrawal_requests`, `marketplace_orders`, `marketplace_order_groups`, `marketplace_payment_records`, `marketplace_payout_requests`, `pricing_quotes`, `pricing_override_events` | Critical system of record / long-retention required | Wallet transactions, marketplace, pricing reachable; funding/withdrawal request tables repo-present but not exposed/reachable |
| Trust / KYC | `customer_verification_submissions`, `customer_trust_profiles`, `customer_documents` | KYC / compliance record | Submissions and documents reachable; trust profile table repo-present but not exposed/reachable |
| Staff / audit | `audit_logs`, `staff_audit_logs`, `staff_navigation_audit`, `marketplace_audit_logs`, `workspace_operational_events` | Staff internal / operational log / long-retention required | Audit tables and staff navigation reachable; workspace event table repo-present |
| Care | `care_bookings` plus Cloudinary receipts/media | Critical system of record / customer content | `care_bookings` reachable; asset backup is external-provider dependent |
| Jobs | `jobs_applications`, `jobs_interview_sessions`, `jobs_interview_events`, `jobs-documents` bucket | Customer content / staff internal | Applications reachable; interview tables repo-present but not exposed/reachable; `jobs-documents` bucket live |
| Learn | `learn_enrollments`, `learn_certificates`, `learn_certificate_verification`, `learn_teacher_applications`, `learn-teaching-files` bucket | Critical learning/certification record | Tables repo-present but not exposed/reachable; bucket live |
| Logistics | `logistics_shipments`, `logistics_events`, `logistics_proof_of_delivery`, `logistics_issues` | Critical system of record / operational log | Core shipment/event/proof tables reachable |
| Property | `property_listings`, `property_viewing_requests`, `property_listing_applications`, `property-runtime`, `property-media`, `property-documents` buckets | Customer content / operational record | Normalized property tables repo-present but not exposed/reachable; runtime/media/document buckets live |
| Studio | `studio_projects`, `studio_proposals`, `studio_payments`, `studio_project_files`, `studio-assets` bucket | Critical project/payment record / customer content | Tables and bucket reachable |
| Integrations / webhooks | `account_webhook_receipts`, `account_idempotency_keys`, `notification_delivery_log` | Operational log / replay safety | Notification delivery reachable; account webhook/idempotency tables repo-present but not exposed/reachable |

## Retention and Deletion Rules

V2 uses manual review and archive/soft-delete metadata, not destructive automation.

| Record family | Rule | Enforcement added or confirmed |
|---|---|---|
| Profiles and customer metadata | Retain until approved closure/deletion review; anonymize eligible PII only after compliance review | Governance migration adds lifecycle metadata where tables exist |
| Notifications | Hide via read/archive/delete lifecycle; do not hard-delete in V2 | Existing notification lifecycle columns confirmed; policy row added |
| Support threads/messages | Long-retention legal/support evidence; archive from active queues instead of destructive deletion | Lifecycle metadata added where tables exist |
| Finance, orders, payouts, wallet, pricing | Long-retention accounting/tax/dispute evidence; no destructive pruning in V2 | Archive/legal-hold metadata added where tables exist |
| KYC/trust documents and submissions | Retain while required for trust, fraud prevention, or legal hold | Lifecycle/legal-hold metadata added where tables exist |
| Audit and staff action logs | Retain for security/compliance review; no automatic 90-day deletion claim | Existing retention doc corrected; archive/legal-hold metadata added where tables exist |
| Jobs, learn, logistics, property, studio records | Archive when closed; retain while obligations, verification, inspection, shipment, project, or dispute remains active | Governance policy rows added; lifecycle columns added to existing tables |
| Temporary/idempotency records | Future pruning allowed only after scheduler, incident exceptions, and replay windows are implemented | Marked as temporary/cache-like; no cleanup job added |
| Storage objects | Retention follows owning record; object bytes need separate backup/export | Storage policy rows added; no fake object backup automation added |

## Schema Governance Added

Migration `apps/hub/supabase/migrations/20260423143000_data_governance_foundation.sql` adds:

| Table | Purpose | Access model |
|---|---|---|
| `data_governance_domains` | Domain ownership, classification, restore priority, backup dependency | RLS enabled; no browser-readable policies |
| `data_retention_policies` | Queryable retention, archive, soft-delete, legal-hold, restore-source policy per table | RLS enabled; no browser-readable policies |
| `data_storage_surfaces` | Bucket/provider ownership and object-backup truth | RLS enabled; no browser-readable policies |
| `data_recovery_drill_runs` | Evidence log for future recovery drills and gaps | RLS enabled; no browser-readable policies |

The same migration adds non-destructive lifecycle columns to existing target tables:

| Column family | Columns | Applied to |
|---|---|---|
| Customer/content lifecycle | `archived_at`, `archive_reason`, `deleted_at`, `deleted_reason`, `retention_hold_until`, `legal_hold_reason` | Profile/content/support/listing/project tables that exist at migration time |
| Critical/audit lifecycle | `archived_at`, `archive_reason`, `retention_hold_until`, `legal_hold_reason` | Finance, audit, event, KYC, shipment, payment, webhook, and pricing tables that exist at migration time |

No RLS policies are weakened and no live data is changed except adding nullable columns and governance metadata rows when the migration is applied.

## Storage and Object Backup Truth

Live buckets observed by the non-destructive storage probe:

| Bucket | Public | Owner / data class | Backup truth |
|---|---:|---|---|
| `company-assets` | Yes | Brand/platform public assets | Requires Supabase Storage object export |
| `property-runtime` | No | Property runtime JSON snapshots | Requires Storage export; DB restore does not restore object bytes |
| `property-media` | Yes | Property listing media | Requires Storage export |
| `property-documents` | No | Property private documents | Requires Storage export and access review |
| `jobs-documents` | No | Jobs candidate/employer documents | Requires Storage export and legal-hold review |
| `studio-assets` | No | Studio project/proposal files | Requires Storage export |
| `hq-internal-comms` | No | Internal comm attachments | Requires Storage export plus DB metadata restore |
| `learn-teaching-files` | No | Learn instructor application files | Requires Storage export |

Cloudinary is used for care, account KYC/wallet proof, and marketplace seller documents/media. The repo stores URLs/public IDs but does not include a Cloudinary backup/export job. Recovery of those bytes depends on Cloudinary provider access or a future asset export process.

## Recovery Priority

1. Freeze writes and capture incident evidence.
2. Restore identity/account and support so users/staff can access accounts and tickets.
3. Restore finance/commerce records and reconcile against bank/provider evidence.
4. Restore division operations in this order: care, logistics, marketplace, studio, jobs, learn, property.
5. Restore audit/action logs and webhook/idempotency evidence.
6. Restore object storage and external assets, then reconcile metadata rows against object existence.
7. Run post-restore smoke checks before reopening write traffic.

## Post-Restore Smoke Checks

Run checks against a restored or duplicate project before production traffic is resumed:

| Check | Minimum assertion |
|---|---|
| Auth/session | Known staff and customer test users can sign in through approved auth path |
| Account | `profiles`, `customer_profiles`, preferences, notifications, wallet history load |
| Support | Thread/message lists and staff routing load without 500s |
| Finance | Wallet/order/payment/payout records reconcile against provider/bank exports |
| Marketplace | Orders, payment records, disputes, reviews, seller documents load |
| Care | Bookings and receipt/proof URLs resolve or are flagged for manual asset recovery |
| Jobs | Applications and `jobs-documents` signed URLs resolve |
| Learn | Enrollment/certificate tables exist before claiming certificate verification recovery |
| Logistics | Shipment/event/proof tables load and tracking state is consistent |
| Property | Runtime bucket JSON exists; normalized property tables must be verified before relying on them |
| Studio | Projects, proposals, payments, and `studio-assets` signed URLs resolve |
| Audit | Staff/action/audit logs remain queryable; no secrets in audit metadata |
| Governance | `data_governance_domains`, `data_retention_policies`, and `data_storage_surfaces` contain seeded rows |

## Hard Limitations

- PITR is not proven enabled because no Supabase Management API token or dashboard evidence exists in the workspace.
- Supabase database restore does not restore deleted Storage objects.
- No automated off-site database dump job exists in this pass.
- No automated Supabase Storage export job exists in this pass.
- No Cloudinary export/backup job exists in this pass.
- Some repo migrations are not reflected in the live REST probe, so those surfaces are **repo-ready but not live-proven**.
- The new governance migration is source-controlled; applying it to production still requires the normal Supabase migration path with database credentials or Supabase project access.

## Final V2 Classification

HenryCo V2 data governance is **production-safe with deferred disaster-recovery automation** once the governance migration is applied. The current recovery backbone remains provider-level Supabase database backups plus manually verified Storage/provider asset export procedures. Full production-complete disaster recovery requires PITR proof, scheduled off-site exports, storage/object backup automation, and a recorded restore drill.
