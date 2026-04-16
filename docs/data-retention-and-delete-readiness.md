# HenryCo Data Retention and Delete Readiness

**Classification:** Internal — Compliance Reference  
**Scope:** Retention schedules, deletion procedures, export readiness, honest limitations

---

## Retention Schedule

### Database tables

| Table | Retention | Cleanup method | Owner |
|---|---|---|---|
| `audit_logs` | 90 days | Partitioned `DELETE` | Platform |
| `staff_audit_logs` | 90 days | Partitioned `DELETE` | Platform |
| `customer_activity` | 1 year | Archive then `DELETE` | Platform |
| `customer_notifications` | 1 year | Archive then `DELETE` | Platform |
| `support_messages` | 7 years | Archive to cold storage | Legal / Compliance |
| `support_threads` | 7 years | Archive to cold storage | Legal / Compliance |
| `marketplace_orders` | 7 years | Archive + soft delete | Marketplace |
| `care_bookings` | 7 years | Archive to cold storage | Care |
| `jobs_applications` | 3 years | Archive then `DELETE` | Jobs |
| `jobs_posts` | 2 years post-close | Archive then `DELETE` | Jobs |
| `logistics_shipments` | 2 years | Archive then `DELETE` | Logistics |
| `profiles` | Until deletion request | Soft delete only | Platform |
| `marketplace_products` | Until deactivation | Soft delete | Marketplace |
| `studio_projects` | Until deletion request | Soft delete | Studio |
| Auth sessions (inactive) | 30 days | Supabase managed | Supabase |
| Password / magic-link tokens | 1 hour | Supabase managed | Supabase |
| Idempotency keys | 24 hours | App cleanup | Platform |

### File storage (Supabase Storage)

| Bucket | Retention | Cleanup trigger |
|---|---|---|
| `avatars` | Until account deletion | Deletion request |
| `product-images` | Until product deactivation | Vendor action |
| `support-attachments` | 7 years | Legal / Compliance |
| `project-assets` | Until project deletion | Studio admin |
| `temp-uploads` | 24 hours | Daily cron (pending automation) |
| `invoices` | 7 years | Finance / Legal |
| `payout-receipts` | 7 years | Finance / Legal |

---

## Retention Automation Status

| Task | Status | Notes |
|---|---|---|
| Audit log 90-day cleanup | **Documented, not automated** | SQL provided in `docs/storage-retention-and-cleanup.md`; requires Supabase pg_cron or Vercel cron setup |
| `customer_activity` 1-year cleanup | **Documented, not automated** | Same — cron setup pending |
| Temp upload 24-hour cleanup | **Documented, not automated** | Script at `scripts/cleanup-temp-uploads.mjs`; not yet scheduled |
| Session cleanup | **Automated** | Handled by Supabase Auth |
| Token cleanup | **Automated** | Handled by Supabase Auth |

**Honest status:** Retention rules are defined and documented. No automated cleanup jobs have been deployed. Manual execution via the SQL procedures in `docs/storage-retention-and-cleanup.md` is the current approach. Cron scheduling is the next required operational step.

---

## Account Deletion and Anonymization

### Current readiness: Manual review process

Self-serve automated deletion is **not implemented**. Account closure and deletion requests are handled through a support ticket workflow intentionally because:

1. Financial records, invoices, and payout history must be retained for regulatory purposes (7 years).
2. Support thread history may be legally required to be retained.
3. Fraud-prevention and trust records cannot be deleted immediately without risk.
4. Wallet balances and pending orders must be resolved before account closure.

### User-facing path

From the Account app at `/settings#privacy-controls`:

- "Request data export" — prefills a support ticket requesting a copy of exportable personal data.
- "Request closure or deletion review" — prefills a support ticket explaining the review process.

The copy in `PrivacyDataControls.tsx` is honest about what is retained:  
_"finance, trust, fraud-prevention, support, and audit records are not removed incorrectly"_

### Manual deletion procedure (staff)

When a deletion request is received and approved:

```sql
BEGIN;

-- 1. Soft-delete profile
UPDATE profiles
SET is_active = false,
    deleted_at = NOW(),
    deleted_reason = 'User requested deletion'
WHERE id = '<user_id>';

-- 2. Anonymize PII fields
UPDATE profiles
SET full_name = '[deleted]',
    phone     = NULL
WHERE id = '<user_id>';

-- Note: email anonymization requires Supabase Auth Admin API, not SQL.
-- Use: supabase.auth.admin.deleteUser(userId) to remove auth record.
-- The auth deletion will cascade where FK constraints are configured.

COMMIT;
```

File storage cleanup:
```js
await supabase.storage.from('avatars').remove([`${userId}/*`]);
```

Document the deletion in a compliance log entry. Notify the user within 30 days of the request.

**Records that MUST NOT be deleted regardless of user request:**

| Record type | Reason | Retention |
|---|---|---|
| Financial transactions, invoices, payouts | Regulatory / tax | 7 years |
| Support thread history | Legal / audit | 7 years |
| Care booking records | Legal / audit | 7 years |
| Marketplace order history | Legal / regulatory | 7 years |
| Audit logs involving this user | Fraud / compliance | 90 days (then auto-deleted) |
| Trust/KYC decisions | Fraud prevention | Platform discretion |

---

## Data Export Readiness

### Current readiness: Manual staff export

No self-serve data export endpoint exists. Export requests are fulfilled by staff.

### Export scope (what can be provided)

Personal data that can be meaningfully exported for a user:

| Category | Table(s) | Format |
|---|---|---|
| Profile information | `profiles`, `customer_profiles` | JSON |
| Account activity | `customer_activity` WHERE user_id = X | JSON |
| Support threads | `support_threads`, `support_messages` | JSON |
| Notifications | `customer_notifications` | JSON |
| Jobs applications | `jobs_applications` (if table exists) | JSON |
| Marketplace orders | `marketplace_orders`, `marketplace_order_groups` | JSON |
| Wallet history | `customer_wallet_transactions` (if exists) | JSON |
| Bookings | `care_bookings` | JSON |

### Staff export query template

```sql
-- Export user data as JSON — run with service role
SELECT json_build_object(
  'profile',     (SELECT row_to_json(p) FROM profiles p WHERE p.id = '<user_id>'),
  'activity',    (SELECT json_agg(row_to_json(a)) FROM customer_activity a WHERE a.user_id = '<user_id>' LIMIT 1000),
  'notifications',(SELECT json_agg(row_to_json(n)) FROM customer_notifications n WHERE n.user_id = '<user_id>' LIMIT 500)
) AS user_data_export;
```

Expand this template with division-specific tables as needed.

### Self-serve export: future work

A self-serve `/api/account/export` endpoint is the preferred long-term solution. It would:
1. Require authentication (user can only export their own data)
2. Rate-limit requests (e.g. one export per 24 hours)
3. Exclude records that must be retained (financial, audit)
4. Return a JSON bundle with a short-lived signed URL
5. Log the export request in `audit_logs`

This is deferred until the data model across all divisions is stable enough to produce a reliable export without surprising omissions.

---

## Right to Restriction

Users may request that data processing be restricted without full deletion (e.g. during a dispute). Current approach: support ticket review. No automated restriction mechanism exists.

---

## Children's Data

HenryCo's platforms are not directed at users under 16. Account creation requires explicit acceptance of terms. No special procedures for children's data requests are currently defined beyond standard account deletion.

---

## Honest Limitations

| Limitation | Severity | Mitigation |
|---|---|---|
| No automated retention cleanup | Medium | Manual SQL provided; cron setup is the next operational step |
| No self-serve export | Medium | Support ticket workflow is honest and functional |
| No automated deletion | Medium | Manual staff procedure is defined; automated endpoint is deferred |
| No cross-division deletion sweep | Medium | Deletion procedure must be run per division table set |
| No restriction flag on profiles | Low | Deletion is the only current tool for compliance requests |

---

## Related Documents

- [privacy-control-model.md](./privacy-control-model.md) — consent categories
- [consent-and-tracking-boundaries.md](./consent-and-tracking-boundaries.md) — tracking architecture
- [internal-data-access-governance.md](./internal-data-access-governance.md) — staff access
- [storage-retention-and-cleanup.md](./storage-retention-and-cleanup.md) — SQL cleanup procedures
- [recovery-playbook.md](./recovery-playbook.md) — incident response
