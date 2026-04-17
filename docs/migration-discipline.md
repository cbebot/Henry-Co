# HenryCo Migration Discipline

**Classification:** REQUIRED READING for all engineers performing schema changes  
**Version:** 2025.01-data-governance  
**Scope:** All Supabase migrations across HenryCo divisions

---

## Core Principles

1. **Migrations are irreversible commitments.** Plan for forward-only evolution.
2. **Idempotency is mandatory.** Every migration must be safely re-runnable.
3. **Production safety over convenience.** No shortcuts that compromise live data.
4. **Explicit over implicit.** No hidden schema assumptions in app code.
5. **Reviewable and auditable.** All migrations require second-person review.

---

## Migration Naming Convention

Format: `YYYYMMDDHHMMSS_descriptive_purpose.sql`

- **Timestamp:** UTC timestamp when migration is authored (not when applied)
- **Separator:** Underscore `_`
- **Description:** Lowercase, snake_case, action-oriented
- **Suffix:** Always `.sql`

**Examples:**
```
20260403170000_shared_platform_support_foundations.sql
20260415153000_staff_workspace_backend_truth.sql
20260413143000_currency_truth_foundations.sql
```

**Classification Prefixes (optional but recommended):**
- `create_` - New tables/functions/policies
- `add_` - Columns, indexes, constraints
- `fix_` - Corrective migrations
- `rls_` - Row Level Security changes
- `idx_` - Index-only changes
- `drop_` - Removal migrations (require extra scrutiny)

---

## Migration File Structure

Every migration must follow this structure:

```sql
-- Migration: YYYYMMDDHHMMSS_description.sql
-- Author: <name>
-- Reviewer: <name>
-- Purpose: <one-line summary>
-- Risk Level: LOW|MEDIUM|HIGH|CRITICAL
-- Rollback Strategy: <explicit strategy or NONE>

-- 1. Extensions (idempotent)
create extension if not exists pgcrypto;

-- 2. Helper functions (create or replace)
create or replace function public.xxx()
...

-- 3. Tables (create if not exists + alter add column if not exists)
create table if not exists public.new_table (...);
alter table public.new_table add column if not exists new_col type;

-- 4. Indexes (create if not exists)
create index if not exists idx_name on table(columns);

-- 5. Triggers (drop if exists + create)
drop trigger if exists trg_name on table;
create trigger trg_name ...;

-- 6. RLS (enable + drop policy if exists + create policy)
alter table public.table enable row level security;
drop policy if exists policy_name on table;
create policy policy_name ...;

-- 7. Grants (idempotent)
grant execute on function ... to authenticated;
```

---

## Idempotency Requirements

Every statement must be safely re-runnable without errors:

| Operation | Idempotent Pattern |
|-----------|-------------------|
| CREATE TABLE | `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` |
| CREATE INDEX | `CREATE INDEX IF NOT EXISTS` |
| CREATE FUNCTION | `CREATE OR REPLACE FUNCTION` |
| CREATE TRIGGER | `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` |
| CREATE POLICY | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| ALTER COLUMN | Check existence or use `IF NOT EXISTS` |
| DROP operations | Extra scrutiny required; document why |

**Forbidden Patterns:**
```sql
-- NEVER: Non-idempotent CREATE
create table public.users (...);  -- Fails on re-run

-- NEVER: Blind ALTER without guards
alter table users add column email text;  -- Fails if exists

-- NEVER: DROP without explicit migration note
-- (Drops require approval + documented recovery path)
```

---

## Migration Safety Checklist

Before submitting any migration PR, verify:

- [ ] Migration filename follows `YYYYMMDDHHMMSS_description.sql` format
- [ ] File header contains author, reviewer, purpose, risk level, rollback strategy
- [ ] All `CREATE` statements use `IF NOT EXISTS` or `OR REPLACE`
- [ ] All `ALTER` statements use `IF NOT EXISTS` where applicable
- [ ] All `DROP` statements include explicit approval note
- [ ] All triggers use `DROP IF EXISTS` before `CREATE`
- [ ] All policies use `DROP IF EXISTS` before `CREATE`
- [ ] RLS is explicitly enabled for new tables containing user data
- [ ] Indexes are created for foreign keys and frequently filtered columns
- [ ] No raw passwords or secrets in migration files
- [ ] Migration has been tested against a fresh local database
- [ ] Migration has been tested against a copy of production schema (if possible)

---

## High-Risk Change Categories

**CRITICAL (requires written approval + pair deployment):**
- ALTER TABLE ... DROP COLUMN (destructive)
- DROP TABLE (destructive)
- Changes to `auth.users` or auth schema
- Changes to RLS policies on sensitive tables (payments, PII)
- Bulk UPDATE/DELETE statements
- Schema changes during high-traffic periods

**HIGH (requires senior review):**
- New tables without RLS
- Changes to indexed columns
- Adding non-nullable columns without defaults
- Changing column types

**MEDIUM (requires normal PR review):**
- Adding nullable columns
- Adding indexes
- Creating views
- Adding helper functions

**LOW (standard review):**
- Adding comments
- Refreshing materialized views
- Grant changes

---

## Application Code Coupling Rules

App code must never assume migrations have run. Defensive patterns required:

```typescript
// BAD: Assumes column exists
const { data } = await supabase.from('orders').select('new_column');

// GOOD: Graceful degradation
const { data, error } = await supabase.from('orders').select('*');
if (error?.message?.includes('column "new_column" does not exist')) {
  // Fallback or warning
}
```

**Migration-First Deployment Rule:**
1. Apply migrations to target environment
2. Wait for schema cache refresh (~60 seconds for PostgREST)
3. Deploy application code that depends on new schema
4. Never reverse this order

---

## Rollback and Recovery

**No Automatic Rollbacks:** PostgreSQL migrations are forward-only. Plan for recovery instead.

**Recovery Strategies by Change Type:**

| Change Type | Recovery Approach |
|-------------|-------------------|
| ADD COLUMN | No recovery needed; column can remain |
| DROP COLUMN | Restore from backup if data needed; otherwise ignore |
| DROP TABLE | Restore from backup; table recreation + data import |
| RLS Policy Change | Re-run previous policy creation migration |
| Bad Data Migration | Corrective migration; no automatic undo |

**Emergency Recovery Playbook:** See `docs/recovery-playbook.md`

---

## Migration Review Process

**Required Reviewers by Risk Level:**

| Risk | Reviewers | Approval Required |
|------|-----------|-------------------|
| CRITICAL | 2 senior engineers + data lead | Written (PR comment) |
| HIGH | 1 senior engineer | PR approval |
| MEDIUM | Any team member | PR approval |
| LOW | Any team member | PR approval |

**Review Checklist for Reviewers:**
- [ ] Migration is idempotent (safe to re-run)
- [ ] No destructive operations without explicit recovery plan
- [ ] RLS policies are appropriate for data sensitivity
- [ ] Indexes support expected query patterns
- [ ] No secrets or credentials exposed
- [ ] App code changes are coupled correctly (migration first, then app)

---

## Testing Migrations

**Local Testing:**
```bash
# 1. Reset local database to known state
# 2. Run all migrations in order
pnpm --filter @henryco/hub run db:apply

# 3. Verify schema
node apps/hub/scripts/probe-supabase-tables.mjs
```

**Staging Testing:**
```bash
# 1. Apply to staging first
DATABASE_URL=<staging> node apps/hub/scripts/apply-hub-migrations.mjs

# 2. Run division smoke tests
node apps/marketplace/scripts/smoke-marketplace.mjs
node apps/jobs/scripts/verify-jobs-live.ts
```

**Production Deployment:**
```bash
# 1. Schedule during low-traffic window
# 2. Have recovery plan ready
# 3. Apply migrations
# 4. Wait 60s for PostgREST cache
# 5. Verify with probe script
# 6. Deploy dependent app code
```

---

## Migration Directory Organization

```
apps/hub/supabase/
├── migrations/
│   ├── 20260402235500_workspace_staff_platform.sql
│   ├── 20260403170000_shared_platform_support_foundations.sql
│   └── ... (all migrations in single ordered list)
├── config.toml          # Supabase CLI config
└── .temp/               # Local-only, gitignored
```

**Rules:**
- All migrations in one flat directory (no subdirectories)
- No editing existing migrations after they've been applied to production
- No deleting migration files ever
- New migrations only appended (timestamp ordering)

---

## Post-Migration Verification

After applying migrations to any environment:

```bash
# 1. Verify tables exist with correct columns
node apps/hub/scripts/probe-supabase-tables.mjs

# 2. Verify RLS is enabled on sensitive tables
# (Check Supabase Dashboard or query information_schema)

# 3. Run app smoke tests
node scripts/verify-henryco-live.mjs
```

---

## Incident Response for Migration Failures

1. **Stop:** Do not apply additional migrations
2. **Assess:** Determine scope (staging vs production, partial vs complete)
3. **Communicate:** Notify team via incident channel
4. **Document:** Capture error messages, migration file, environment state
5. **Recover:** Follow recovery playbook; do not improvise
6. **Post-Incident:** Review process, improve checklist

**Escalation Path:**
- Migration errors → Engineering lead → Platform team → Data lead

---

## Related Documents

- `docs/recovery-playbook.md` - Emergency procedures
- `docs/change-safety-checklist.md` - Pre-deploy verification
- `docs/environment-separation-model.md` - Staging vs production boundaries
- `docs/ops-supabase-handoff.md` - DB objects still needing implementation

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-01 | Data Governance Pass | Initial migration discipline documentation |
