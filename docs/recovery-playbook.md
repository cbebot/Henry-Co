# HenryCo Recovery Playbook

**Classification:** EMERGENCY REFERENCE — Keep accessible during incidents  
**Version:** 2025.01-data-governance  
**Scope:** All HenryCo production systems (Supabase, Vercel, data integrity)

---

## Quick Reference: Incident Severity

| Severity | Criteria | Response Time | Escalation |
|----------|----------|---------------|------------|
| **P0 - Critical** | Production down, data corruption, security breach, payment system failure | Immediate | Platform lead + Owner |
| **P1 - High** | Major feature degraded, partial data unavailability, performance severely impacted | < 30 min | Engineering lead |
| **P2 - Medium** | Minor feature issues, non-critical data discrepancies | < 2 hours | Team lead |
| **P3 - Low** | Cosmetic issues, documentation gaps | < 24 hours | Normal queue |

---

## Emergency Contacts

| Role | Primary | Secondary | Escalation Path |
|------|---------|-----------|-----------------|
| Platform/Data Lead | TBD | TBD | owner@henrycogroup.com |
| Engineering Lead | TBD | TBD | Platform Lead |
| Supabase Support | support@supabase.com | Dashboard | N/A |
| Vercel Support | support@vercel.com | Dashboard | N/A |

---

## Scenario 1: Bad Migration Applied

**Symptoms:**
- Migration errors in logs
- Schema mismatch causing app failures
- Data corruption after ALTER/UPDATE

**Immediate Response (First 5 minutes):**

1. **STOP** — Do not apply more migrations
2. **ASSESS** — Check `apps/hub/scripts/probe-supabase-tables.mjs` output
3. **DOCUMENT** — Screenshot/log exact error messages
4. **COMMUNICATE** — Post in incident channel with:
   - Migration filename
   - Environment (staging/production)
   - Error message
   - Time of application

**Recovery Options:**

### Option A: Migration Failed Mid-Application (Transaction Rolled Back)
```bash
# Likely outcome: No changes applied
# Action: Fix migration file, re-test, re-apply

# 1. Verify state
node apps/hub/scripts/probe-supabase-tables.mjs

# 2. Fix migration (new file, do not edit timestamp)
cp bad_migration.sql fixed_migration.sql
# Edit: correct the issue

# 3. Re-apply
node apps/hub/scripts/apply-hub-migrations.mjs
```

### Option B: Destructive Migration Applied (Column/Table Dropped)
```bash
# Assessment: What was lost?
# - Dropped column: May be recoverable from backups if within retention
# - Dropped table: Requires full restore

# IMMEDIATE: Capture current state
pg_dump $DATABASE_URL --schema-only > current_schema_$(date +%s).sql

# If within backup retention (check Supabase Dashboard Backups):
# 1. Identify last good backup timestamp
# 2. Plan point-in-time recovery via Supabase support

# If beyond retention:
# 1. Assess if data can be reconstructed from audit logs
# 2. Check replica lag (if running read replica)
# 3. Document data loss scope for stakeholders
```

### Option C: Data Corruption from UPDATE/DELETE
```sql
-- If transaction ID is known and within vacuum window:
-- (Requires direct database access and expertise)

-- Emergency: Stop all writes to affected table
-- Contact Supabase support for point-in-time recovery
```

---

## Scenario 2: Production Data Corruption

**Symptoms:**
- Users reporting wrong data
- Inconsistent application state
- Cascade failures across divisions

**Immediate Response:**

1. **ISOLATE** — Stop writes to affected tables if possible
2. **IDENTIFY** — Query audit logs for timeframe:
```sql
-- Find suspect operations
select * from audit_logs 
where created_at > '2025-01-15T10:00:00Z' 
  and entity_type = '<affected_table>'
order by created_at desc;
```

3. **ASSESS SCOPE:**
```sql
-- Row count check
select count(*) from <table> where <corruption_indicator>;

-- Identify affected users
select distinct user_id from <table> where <corruption_indicator>;
```

**Recovery Approaches:**

| Approach | When to Use | Recovery Time | Data Loss |
|----------|-------------|---------------|-----------|
| Audit Log Reconstruction | Limited corruption, good audit trail | Hours | None |
| Point-in-Time Restore | Extensive corruption, within backup window | Hours | Since backup |
| Manual Correction | Isolated records, clear fix | Minutes-Hours | None |
| Full Restore | Catastrophic corruption | 4-24 hours | Since backup |

---

## Scenario 3: RLS Policy Misconfiguration

**Symptoms:**
- Users seeing wrong data
- Users unable to see their own data
- Admin/owner access broken

**Immediate Response:**

1. **Check current RLS state:**
```sql
-- List RLS policies on affected table
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies 
where tablename = '<table_name>';
```

2. **Disable RLS temporarily (EMERGENCY ONLY):**
```sql
-- ⚠️ DANGER: Disables all access controls
alter table <table> disable row level security;
-- Re-enable after fix: alter table <table> enable row level security;
```

3. **Apply fix migration:**
```sql
-- Create emergency fix migration
drop policy if exists broken_policy on <table>;
create policy corrected_policy on <table>
  for all
  using (<corrected_condition>);
```

---

## Scenario 4: Supabase Service Degradation

**Symptoms:**
- Connection timeouts
- Elevated error rates
- Auth failures
- Storage unavailability

**Immediate Checks:**

1. **Check Supabase Status:** https://status.supabase.com
2. **Check Vercel Status:** https://status.vercel.com
3. **Verify connectivity:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Test Supabase Auth
node scripts/verify-henryco-live.mjs
```

**Mitigation Options:**

| Issue | Mitigation |
|-------|------------|
| Connection pool exhausted | Implement connection retry/backoff in app |
| Auth service down | Enable read-only mode, queue mutations |
| Database unresponsive | Enable maintenance page, investigate queries |
| Storage failing | Disable uploads, queue for retry |

---

## Scenario 5: Accidental Production Data Exposure

**Symptoms:**
- Wrong environment data in production
- Seed/test data visible to real users
- PII leakage

**Immediate Response:**

1. **STOP THE BLEEDING:**
   - Remove exposed data immediately
   - Disable affected feature if needed
   - Check access logs for data access

2. **ASSESS EXPOSURE:**
```sql
-- Query audit logs for access to exposed data
select * from audit_logs 
where entity_type = '<table>' 
  and created_at > '<exposure_start>'
order by created_at;
```

3. **DOCUMENT:**
   - What data was exposed
   - How many users potentially accessed it
   - Duration of exposure
   - Root cause

4. **NOTIFY:**
   - Internal: Engineering lead, Data lead, Owner
   - External: If user data affected, legal/compliance review required

---

## Scenario 6: Deployment Rollback Needed

**Symptoms:**
- New deployment causing failures
- Critical bug in production
- Performance regression

**Vercel Rollback Procedure:**

1. **Identify last known good deployment:**
   - Vercel Dashboard → Project → Deployments
   - Find last successful deployment before issue

2. **Immediate rollback:**
   ```bash
   # Vercel CLI
   vercel --version  # Verify CLI
   vercel rollback <deployment-url>  # Or use Dashboard
   ```

3. **Verify rollback:**
   ```bash
   node scripts/verify-henryco-live.mjs
   ```

**Database State Considerations:**

| App Rollback? | Migration Applied? | Action Required |
|---------------|-------------------|-----------------|
| Yes | No | Safe to rollback |
| Yes | Yes (non-breaking) | Safe to rollback |
| Yes | Yes (breaking) | Cannot rollback without data migration |

---

## Backup and Restore Procedures

### Current Backup Reality (Supabase-Managed)

**What Supabase Provides:**
- Daily automated backups (retention: project tier dependent)
- Point-in-time recovery (PITR) available on Pro tier
- Database branching for testing

**What HenryCo Must Manage:**
- Cross-region backup strategy (if required)
- Critical data exports for long-term retention
- Backup verification/testing

### Manual Backup Procedures

**Schema Backup:**
```bash
# Schema only
pg_dump $DATABASE_URL --schema-only > schema_$(date +%Y%m%d_%H%M%S).sql

# Specific tables
pg_dump $DATABASE_URL --table=public.critical_table > critical_table_$(date +%s).sql
```

**Data Export (for critical tables):**
```bash
# JSON export via Supabase
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function export() {
  const { data } = await supabase.from('critical_table').select('*');
  console.log(JSON.stringify(data, null, 2));
}
export();
" > critical_table_export_$(date +%s).json
```

### Restore Procedures

**Point-in-Time Recovery (via Supabase):**
1. Contact Supabase support with target timestamp
2. Provide business justification
3. Supabase creates new project with restored data
4. Redirect applications to new project (or replace existing)

**Manual Restore (partial):**
```bash
# Restore specific table from dump
psql $DATABASE_URL < table_backup.sql
```

---

## Post-Incident Actions

**Required within 24 hours:**

1. **Incident Report:**
   - Timeline of events
   - Root cause analysis
   - Impact assessment (users affected, data lost, duration)
   - Recovery steps taken

2. **Process Improvements:**
   - What failed in our safeguards?
   - What detection could have caught this earlier?
   - What prevention measures should be added?

3. **Documentation Updates:**
   - Update this playbook with lessons learned
   - Update checklists that were missed
   - Update monitoring if gaps identified

---

## Prevention Checklists

### Before Any Production Change

- [ ] Change tested in staging environment
- [ ] Rollback plan documented
- [ ] Monitoring in place to detect issues
- [ ] Team member available to respond
- [ ] Maintenance window communicated (if applicable)

### Quarterly Disaster Recovery Drills

- [ ] Test restore from backup (in isolated environment)
- [ ] Verify audit log completeness
- [ ] Test incident communication channels
- [ ] Update contact information
- [ ] Review and update this playbook

---

## Audit Log Emergency Queries

**Recent errors by actor:**
```sql
select actor_id, actor_role, action, count(*) 
from audit_logs 
where created_at > now() - interval '1 hour'
  and (action like '%error%' or action like '%fail%')
group by actor_id, actor_role, action
order by count(*) desc;
```

**All changes to specific entity:**
```sql
select * from audit_logs 
where entity_type = 'support_threads' 
  and entity_id = '<thread_id>'
order by created_at;
```

**Staff actions in timeframe:**
```sql
select * from staff_audit_logs 
where created_at > now() - interval '4 hours'
order by created_at desc;
```

---

## Environment-Specific Notes

### Staging Recovery
- More permissive; can be fully rebuilt from seeds
- No PII concerns
- Use for testing recovery procedures

### Production Recovery
- **Never** test experimental fixes directly
- All changes require approval
- Communication to stakeholders mandatory
- Document every action taken

---

## Related Documents

- `docs/migration-discipline.md` — Safe migration practices
- `docs/change-safety-checklist.md` — Pre-deploy verification
- `docs/environment-separation-model.md` — Staging vs production boundaries
- `docs/ops-supabase-handoff.md` — DB architecture reference

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-01 | Data Governance Pass | Initial recovery playbook |
