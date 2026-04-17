# HenryCo Storage Retention and Cleanup

**Classification:** OPERATIONAL GUIDE — Data lifecycle management  
**Version:** 2025.01-data-governance  
**Scope:** Database storage, file storage, logs, and audit data

---

## Purpose

Define retention periods, cleanup procedures, and storage governance for HenryCo data to:
- Control storage costs
- Ensure compliance with data protection requirements
- Maintain system performance
- Preserve necessary audit trails

---

## Storage Categories

### 1. Database Storage

#### Audit and Log Tables

| Table | Retention | Cleanup Strategy | Owner |
|-------|-----------|------------------|-------|
| `audit_logs` | 90 days | Partitioned deletion | Platform |
| `staff_audit_logs` | 90 days | Partitioned deletion | Platform |
| `customer_activity` | 1 year | Archive + delete | Platform |
| `customer_notifications` | 1 year | Archive + delete | Platform |
| `support_messages` | 7 years | Archive to cold storage | Legal/Compliance |
| `support_threads` | 7 years | Archive to cold storage | Legal/Compliance |

#### Operational Tables

| Table | Retention | Cleanup Strategy | Owner |
|-------|-----------|------------------|-------|
| `profiles` | Permanent | Soft delete only | Platform |
| `owner_profiles` | Permanent | Soft delete only | Platform |
| `marketplace_orders` | 7 years | Archive + soft delete | Marketplace |
| `marketplace_products` | Permanent | Soft delete (deactivate) | Marketplace |
| `jobs_applications` | 3 years | Archive + delete | Jobs |
| `jobs_posts` | 2 years post-close | Archive + delete | Jobs |
| `care_bookings` | 7 years | Archive to cold storage | Care |
| `studio_projects` | Permanent | Soft delete only | Studio |
| `logistics_shipments` | 2 years | Archive + delete | Logistics |

#### Session and Temporary Data

| Table/Category | Retention | Cleanup | Owner |
|----------------|-----------|---------|-------|
| Auth sessions | 30 days inactive | Supabase managed | Supabase |
| Password reset tokens | 1 hour | Automatic | Supabase |
| Magic link tokens | 1 hour | Automatic | Supabase |
| Email OTP | 1 hour | Automatic | Supabase |
| Idempotency keys | 24 hours | Automatic cleanup | App |

### 2. File Storage (Supabase Storage)

| Bucket | Retention | Cleanup Strategy | Owner |
|--------|-----------|------------------|-------|
| `avatars` | Until account deletion | Delete with account | Platform |
| `product-images` | Until product deletion | Delete on deactivate | Marketplace |
| `support-attachments` | 7 years | Archive to cold storage | Support |
| `project-assets` | Permanent | Keep with project | Studio |
| `temp-uploads` | 24 hours | Cron cleanup | Platform |
| `invoices` | 7 years | Archive to cold storage | Finance |
| `payout-receipts` | 7 years | Archive to cold storage | Finance |

### 3. Application Logs

| Log Type | Retention | Storage | Owner |
|----------|-----------|---------|-------|
| Vercel Build Logs | 1 year | Vercel managed | Vercel |
| Vercel Runtime Logs | 3 days (Hobby) / 30 days (Pro) | Vercel managed | Vercel |
| Supabase Postgres Logs | 1 day (free) / 7 days (Pro) | Supabase managed | Supabase |
| Sentry Error Events | 90 days | Sentry managed | Platform |
| Application Audit Logs | 90 days | Database | Platform |

### 4. Backup Storage

| Backup Type | Retention | Location | Owner |
|-------------|-----------|----------|-------|
| Supabase Automated | Project tier dependent | Supabase managed | Supabase |
| Manual Schema Exports | 30 days | Secure team storage | Platform |
| Critical Table Exports | 90 days | Encrypted storage | Platform |

---

## Cleanup Procedures

### Database Cleanup Queries

#### Audit Logs (90-day retention)
```sql
-- Monthly cleanup (run in transaction)
begin;
delete from audit_logs 
where created_at < now() - interval '90 days';
commit;

-- Vacuum to reclaim space
vacuum analyze audit_logs;
```

#### Customer Notifications (1-year retention)
```sql
-- Quarterly cleanup
begin;
-- Archive first if needed
insert into archive.customer_notifications_2024
select * from customer_notifications
where created_at < '2024-01-01';

-- Delete old
delete from customer_notifications
where created_at < now() - interval '1 year';
commit;
```

#### Soft Delete Implementation
```sql
-- Example: Soft delete for profiles
alter table profiles add column if not exists deleted_at timestamptz;
alter table profiles add column if not exists deleted_reason text;

-- "Delete" operation
update profiles 
set is_active = false, 
    deleted_at = now(),
    deleted_reason = 'User requested'
where id = '<user_id>';

-- Query active only
create view active_profiles as
select * from profiles where deleted_at is null;
```

### File Storage Cleanup

#### Temporary Uploads Cleanup
```bash
# Daily cleanup script (to be scheduled)
node scripts/cleanup-temp-uploads.mjs
```

```javascript
// scripts/cleanup-temp-uploads.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTempUploads() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // List old temp files
  const { data: files } = await supabase
    .storage
    .from('temp-uploads')
    .list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'asc' }
    });
    
  const oldFiles = files?.filter(f => f.created_at < cutoff) || [];
  
  // Delete in batches
  for (const file of oldFiles) {
    await supabase.storage.from('temp-uploads').remove([file.name]);
  }
  
  console.log(`Cleaned up ${oldFiles.length} temp files`);
}

cleanupTempUploads();
```

### Log Rotation

**Vercel:** Automatically managed based on plan tier

**Sentry:** Automatic with 90-day retention

**Database Logs:** Configure in Supabase Dashboard → Logs → Retention

---

## Storage Monitoring

### Key Metrics to Track

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|-------------------|-------------------|--------|
| Database size | 70% of tier limit | 85% of tier limit | Cleanup or upgrade |
| Storage bucket size | 75% of limit | 90% of limit | Cleanup or upgrade |
| Audit log table size | 10M rows | 50M rows | Archive and cleanup |
| Inactive auth users | 1 year | 2 years | Notify / deactivate |

### Monitoring Queries

```sql
-- Database size check
select pg_size_pretty(pg_database_size('postgres'));

-- Table sizes (largest first)
select 
  schemaname,
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_stat_user_tables
order by pg_total_relation_size(relid) desc
limit 20;

-- Audit log row counts by month
select 
  date_trunc('month', created_at) as month,
  count(*) as row_count
from audit_logs
group by 1
order by 1 desc;

-- Old soft-deleted records
select 
  table_name,
  count(*)
from profiles
where deleted_at is not null
  and deleted_at < now() - interval '30 days'
group by table_name;
```

---

## Data Archiving

### Archive Strategy

For data exceeding retention but requiring preservation:

1. **Export to cold storage:**
   - JSON export to encrypted S3/GCS bucket
   - Schema + data dump to secure storage
   - Exclude PII unless legally required

2. **Archive location:**
   - Separate project/tenant from production
   - Access restricted to compliance/legal team
   - Encrypted at rest

3. **Archive format:**
   ```bash
   # Schema + data export
   pg_dump $DATABASE_URL \
     --table=public.care_bookings \
     --data-only \
     --compress=9 \
     > care_bookings_2024.sql.gz
   
   # Encrypt
   gpg --encrypt --recipient compliance@henrycogroup.com \
     care_bookings_2024.sql.gz
   ```

### Retention After Archive

| Data Category | Archive Retention | Destruction Date |
|---------------|-------------------|------------------|
| Financial records | 7 years | 7 years + 1 day |
| Customer communications | 3 years | 3 years + 1 day |
| Operational analytics | 2 years | 2 years + 1 day |
| Session/debug logs | 90 days | 90 days + 1 day |

---

## GDPR/Data Deletion Requests

### Right to Erasure Procedure

1. **Verify request:** Confirm identity via support ticket
2. **Identify scope:**
   - User ID from auth.users
   - All related records across tables
   - File storage attachments

3. **Execute deletion (soft delete first):**
   ```sql
   begin;
   -- Soft delete profile
   update profiles 
   set is_active = false, deleted_at = now() 
   where id = '<user_id>';
   
   -- Anonymize PII
   update profiles
   set full_name = '[deleted]', 
       phone = null,
       email = '[deleted]@anonymized.local'
   where id = '<user_id>';
   
   -- Delete auth user (cascades where configured)
   -- Note: Requires admin API, not SQL
   commit;
   ```

4. **Delete file storage:**
   ```javascript
   // Delete user uploads
   await supabase.storage.from('avatars').remove([`${userId}/*`]);
   ```

5. **Document:** Record deletion in compliance log

6. **Confirm:** Notify user within 30 days

### Data Portability

For export requests:
```sql
-- Export user data (JSON format)
copy (
  select json_agg(row_to_json(t))
  from (
    select * from profiles where id = '<user_id>'
    union all
    select * from customer_activity where user_id = '<user_id>'
    -- ... other tables
  ) t
) to '/tmp/user_export_<user_id>.json';
```

---

## Cleanup Automation

### Recommended Cron Schedule

| Task | Frequency | Tool |
|------|-----------|------|
| Temp file cleanup | Daily | Vercel Cron |
| Audit log partition rotation | Monthly | Supabase Cron |
| Old notification deletion | Weekly | Supabase Cron |
| Storage usage report | Weekly | GitHub Action |
| Full database size check | Daily | Monitoring |

### Supabase Cron Example
```sql
-- Enable pg_cron extension
select cron.schedule(
  'cleanup-temp-uploads',
  '0 2 * * *',  -- 2 AM daily
  $$ 
    -- Cleanup SQL here
    delete from temp_uploads where created_at < now() - interval '24 hours';
  $$
);
```

---

## Emergency Cleanup

### If Storage Critical Threshold Exceeded

1. **Immediate (stop the bleeding):**
   - Identify largest tables/files
   - Pause non-essential logging
   - Disable automatic backups temporarily

2. **Short-term (reclaim space):**
   - Vacuum full (requires downtime)
   - Delete temp/old data beyond retention
   - Archive and compress old partitions

3. **Long-term (prevent recurrence):**
   - Upgrade storage tier
   - Implement retention policies
   - Add monitoring alerts

---

## Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Platform Team** | Database cleanup, audit log retention, storage monitoring |
| **Division Teams** | Division-specific table cleanup, business data retention |
| **Compliance** | Legal hold management, GDPR requests, archive access |
| **Security** | Secure deletion verification, encryption key management |

---

## Related Documents

- `docs/migration-discipline.md` — Schema change procedures
- `docs/recovery-playbook.md` — Incident response
- `docs/environment-separation-model.md` — Data environment boundaries
- `docs/env-boundaries.md` — Configuration management

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-01 | Data Governance Pass | Initial storage retention framework |
