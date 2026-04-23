# HenryCo Data Retention and Delete Readiness

**Classification:** Internal - Compliance reference
**Scope:** Retention schedules, deletion procedures, export readiness, and honest limitations
**Updated:** 2026-04-23

This document is the user-data retention companion to [data-governance-backup-recovery-v2.md](./data-governance-backup-recovery-v2.md). It intentionally avoids claiming automated cleanup jobs or short audit-log deletion windows that are not deployed.

## Current Retention Posture

| Record family | Retention rule | Current enforcement truth |
|---|---|---|
| Profiles / customer profiles | Retain until approved account closure/deletion review | Manual review; lifecycle columns are added by the V2 governance migration where tables exist |
| Customer preferences | Retain until reset, account closure, or approved deletion review | Manual review |
| Security logs / trust / KYC | Retain while security, fraud, trust, or legal review remains relevant | Manual review; no destructive pruning in V2 |
| Customer notifications | Archive or soft-delete from the user inbox when no longer useful | `read_at`, `archived_at`, and `deleted_at` exist from account hardening |
| Support threads/messages | Long-retention legal/support evidence | Manual archive/soft-delete; no destructive pruning in V2 |
| Finance records, wallet, orders, payouts, invoices/payment evidence | Long-retention accounting, tax, reconciliation, and dispute evidence | Manual archive/legal-hold only; no destructive pruning in V2 |
| Care/jobs/learn/logistics/property/studio operational records | Retain while service, hiring, certification, shipment, listing, viewing, inspection, project, payment, or support obligations exist | Manual archive/soft-delete where applicable |
| Staff/audit logs | Retain for security, compliance, incident review, and staff accountability | Manual archive/legal-hold only; no automatic 90-day deletion claim |
| Idempotency/webhook receipts | Retain through retry/replay and incident window | Future cleanup may be allowed only after scheduler and incident exceptions exist |
| Storage objects and Cloudinary assets | Retain with owning record and legal hold | Requires separate object/provider backup; DB backups do not restore deleted object bytes |

## Automation Status

| Task | Status | Truth |
|---|---|---|
| Destructive audit-log cleanup | Not deployed | Do not run automatic audit deletion in V2 |
| Customer notification archive cleanup | Not deployed | Manual archive/soft-delete only |
| Temporary upload cleanup | Not deployed as a repo-owned production job | Future scheduler must prove bucket scope and legal-hold exclusions |
| Cross-division deletion sweep | Not deployed | Manual staff review only |
| Recovery/governance metadata | Source-controlled | Added in `20260423143000_data_governance_foundation.sql`; requires normal Supabase migration application |

## Account Deletion and Anonymization

Self-serve automated deletion is not implemented. Account closure and deletion requests are handled through support review because finance, trust, fraud-prevention, support, and audit records must not be removed incorrectly.

When a deletion request is approved, staff should:

1. Confirm there are no active wallet balances, orders, bookings, projects, shipments, applications, disputes, certificates, or legal holds.
2. Soft-delete/anonymize eligible profile fields.
3. Preserve finance, trust, support, audit, KYC, and operational records that must be retained.
4. Remove or archive eligible user-facing content only after confirming retention exclusions.
5. Log the decision and actor in the appropriate audit/action log.

Example profile anonymization shape:

```sql
begin;

update profiles
set is_active = false,
    deleted_at = timezone('utc', now()),
    deleted_reason = 'approved account deletion review',
    full_name = '[deleted]',
    phone = null
where id = '<user_id>';

commit;
```

Email/auth deletion or anonymization must use the Supabase Auth Admin API or Supabase dashboard workflow. Do not assume deleting `profiles` removes the provider-managed auth user.

## Records That Must Not Be Destroyed In V2

| Record type | Reason |
|---|---|
| Financial transactions, invoices, payments, wallet funding/withdrawal proof, marketplace payouts | Accounting, tax, reconciliation, dispute evidence |
| Marketplace orders, disputes, returns, reviews tied to disputes | Order/support/legal continuity |
| Support thread/message history | Support/legal evidence |
| Care booking/service records | Customer service, refund, and legal continuity |
| KYC/trust/security decisions and customer documents under review/hold | Fraud prevention and compliance |
| Staff audit/action/navigation logs | Accountability and incident response |
| Certifications/enrollment verification records | Credential verification |

## Manual Data Export Readiness

No self-serve data export endpoint exists. Export requests are fulfilled manually by staff with service-role access and must avoid exporting secrets, provider tokens, private staff notes not relevant to the request, or unrelated third-party data.

Minimum export scope by category:

| Category | Candidate source |
|---|---|
| Profile | `profiles`, `customer_profiles`, `customer_preferences` |
| Account activity | `customer_activity`, `customer_security_log` |
| Support | `support_threads`, `support_messages` |
| Notifications | `customer_notifications` |
| Finance | Wallet/order/payment rows that are exportable without violating legal retention duties |
| Jobs | `jobs_applications` and eligible candidate documents |
| Marketplace | Orders, reviews, support, disputes, seller application data where owned by the requester |
| Care/logistics/property/studio/learn | Division records tied to the requester and cleared by support/compliance review |

Use JSON export bundles and record the export request in audit/support history. If the export includes signed URLs, use short-lived URLs and never expose service-role credentials.

## Honest Limitations

| Limitation | Severity | Required next action |
|---|---|---|
| No automated retention cleanup | Medium | Add scheduler only after legal-hold, object-backup, and incident-exception rules exist |
| No self-serve export | Medium | Build an authenticated, rate-limited export endpoint after table coverage is stable |
| No automated deletion workflow | Medium | Add deletion review workflow with finance/trust/support blocking checks |
| No storage object backup job | High | Add Supabase Storage and Cloudinary export manifests before destructive cleanup |
| No PITR proof in repo | High | Verify Supabase project plan/PITR via dashboard or Management API |

## Related Documents

- [data-governance-backup-recovery-v2.md](./data-governance-backup-recovery-v2.md) - critical data classification and backup truth
- [data-recovery-playbook-v2.md](./data-recovery-playbook-v2.md) - recovery and post-restore checklist
- [privacy-control-model.md](./privacy-control-model.md) - consent categories
- [consent-and-tracking-boundaries.md](./consent-and-tracking-boundaries.md) - tracking architecture
- [internal-data-access-governance.md](./internal-data-access-governance.md) - staff access governance
