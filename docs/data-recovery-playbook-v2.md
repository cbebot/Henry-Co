# HenryCo V2 Recovery Playbook

**Classification:** Internal - Production recovery runbook  
**Scope:** Database, Storage, external assets, integrity checks, and post-restore release gates  
**Last updated:** 2026-04-23

This playbook is intentionally procedural. It does not claim automated disaster recovery. Use it to run a controlled provider-backed restore, duplicate-project restore, or logical export/import recovery.

## Activation Criteria

Start this playbook when any of these are true:

| Trigger | Examples |
|---|---|
| Data loss or corruption | Accidental destructive write, migration regression, bad provider webhook replay |
| Security containment | Staff credential misuse, exposed service token, suspicious data mutation |
| Provider recovery | Supabase project outage requiring backup restore or duplicate-project restore |
| Storage loss | Missing Storage bucket/object family, broken signed URLs for critical records |
| Finance/support incident | Wallet, order, payout, support, or KYC evidence cannot be trusted |

## Immediate Containment

1. Stop risky write paths: pause cron jobs, provider webhook handlers, bulk staff actions, and import/sync jobs.
2. Capture evidence: incident start time, suspected tables, object buckets, provider logs, commit SHA, deployment IDs, and staff actors.
3. Preserve current state: do not run cleanup scripts, delete objects, rotate data, or replay webhooks until a recovery lead signs off.
4. Choose recovery target: same project restore, duplicate project restore, logical export/import, or targeted manual reconciliation.
5. Record the action in `data_recovery_drill_runs` or an incident/audit log once the governance migration is live.

## Database Recovery Options

| Option | Use when | Truth / limitation |
|---|---|---|
| Supabase dashboard daily backup restore | Whole-project database rollback is acceptable and downtime is planned | Restores database state only; does not restore deleted Storage objects |
| Supabase PITR restore | PITR is proven enabled and a precise recovery timestamp is required | PITR is not proven enabled from this repo; confirm in Supabase dashboard/API first |
| Duplicate project restore | Need forensic comparison or staged validation before cutover | Requires environment variable, auth, storage, provider, and domain reconfiguration |
| Logical dump/import | Need portable off-site export or selective rebuild | Requires database connection string, Supabase CLI, Docker/Postgres tooling, and careful role/schema handling |
| Targeted manual reconciliation | Only a small set of rows/objects/providers are affected | Requires audit trail, backups/exports, and owner approval for finance/trust records |

Minimum logical backup commands when authorized credentials exist:

```bash
supabase db dump --db-url "$DATABASE_URL" -f roles.sql --role-only
supabase db dump --db-url "$DATABASE_URL" -f schema.sql
supabase db dump --db-url "$DATABASE_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

Minimum logical restore shape for a new project:

```bash
psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command "SET session_replication_role = replica" --file data.sql --dbname "$NEW_DATABASE_URL"
```

## Storage Recovery Options

| Surface | Recovery source | Notes |
|---|---|---|
| Supabase Storage buckets | S3-compatible export, dashboard/manual copy, or provider object backup | Database backups restore metadata only, not deleted object bytes |
| `hq-internal-comms` | Supabase Storage export plus `hq_internal_comm_attachments` metadata | Keep private access policies intact after restore |
| `property-runtime` | Supabase Storage export of JSON runtime objects | Required while normalized property tables are not live-proven |
| `property-media` | Supabase Storage export | Public bucket; verify public URLs after restore |
| `property-documents` | Supabase Storage export | Private documents; verify signed URL behavior |
| `jobs-documents` | Supabase Storage export | Private documents; verify signed URL behavior |
| `learn-teaching-files` | Supabase Storage export | Private instructor application files |
| `studio-assets` | Supabase Storage export | Private project/proposal assets |
| Cloudinary assets | Cloudinary provider export/API backup | Repo stores metadata only; no Cloudinary export job exists in V2 |

## Restore Verification Checklist

| Domain | Required check |
|---|---|
| Identity | Staff and customer auth paths work; `profiles` and `customer_profiles` match expected users |
| Support | Support threads/messages load; staff queues link to exact items |
| Notifications | `customer_notifications` and `notification_delivery_log` are queryable; no resend/replay storm occurs |
| Finance | Wallet/order/payment/payout totals reconcile to bank/provider records before writes resume |
| KYC/trust | `customer_documents` links and `customer_verification_submissions` load; no private document is publicly exposed |
| Marketplace | Orders, order groups, payment records, payout requests, disputes, reviews, support records load |
| Care | Bookings load and receipt/proof assets resolve or are flagged |
| Jobs | Applications and document signed URLs load; interview tables must exist before relying on interview recovery |
| Learn | Enrollments/certificates/certificate verification tables exist before claiming certificate recovery |
| Logistics | Shipments, events, proof-of-delivery, and issue records load consistently |
| Property | Runtime bucket JSON is present; normalized property tables must be verified before cutover |
| Studio | Projects, proposals, payments, project files, and `studio-assets` signed URLs load |
| Audit | `audit_logs`, `staff_audit_logs`, `staff_navigation_audit`, and division audit logs are queryable |
| Governance | `data_governance_domains`, `data_retention_policies`, and `data_storage_surfaces` contain seeded rows |

## Release Gates After Restore

Do not reopen production writes until all applicable gates pass:

1. Schema migrations are at the expected commit and no schema drift blocks the app.
2. Auth, support, finance, order, booking, shipment, project, and staff routes pass smoke checks.
3. Storage object checks pass for every bucket used by active records.
4. Provider webhooks are resumed one provider at a time.
5. Finance/provider reconciliation signs off on wallet, order, payout, and payment totals.
6. Staff audit logs capture the restore and reopening decisions.
7. Owner/HQ gets a concise incident closeout with remaining gaps.

## Deferred Automation

The next data-resilience pass should add:

| Gap | Required next action |
|---|---|
| PITR evidence | Query Supabase Management API or export dashboard proof for project plan/PITR state |
| Off-site DB export | Scheduled logical dump to encrypted off-site storage with restore test |
| Storage object backup | Scheduled S3-compatible bucket export and object manifest diff |
| Cloudinary backup | Cloudinary asset manifest/export job for account, care, marketplace, and wallet proof assets |
| Recovery drills | Quarterly duplicate-project restore drill logged in `data_recovery_drill_runs` |
| Integrity checker | Automated row/object reference checker for file URLs, storage paths, and missing buckets |
