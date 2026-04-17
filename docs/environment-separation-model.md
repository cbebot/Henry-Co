# HenryCo Environment Separation Model

**Classification:** REQUIRED READING — Prevents production data disasters  
**Version:** 2025.01-data-governance  
**Scope:** All HenryCo development, staging, and production environments

---

## Core Principle

**Production data and non-production environments must never mix.**

This document defines the hard boundaries between environments and the operational rules that prevent cross-contamination.

---

## Environment Definitions

| Environment | Purpose | Data Classification | Network Access |
|-------------|---------|-------------------|----------------|
| **Production** | Live customer-facing services | Real customer data, PII, payments | Public internet, protected |
| **Staging** | Pre-production validation | Synthetic/demo data only | Team access only |
| **Development** | Local development | Local-only seed data | Localhost only |
| **CI/Testing** | Automated tests | Fixture data (ephemeral) | Isolated, no external services |

---

## Data Classification Rules

### Production Data
- Real customer accounts and PII
- Actual payment transactions
- Production orders, bookings, applications
- Real support conversations
- Analytics events from real users

**Handling Requirements:**
- NEVER download to local machines
- NEVER use in staging/development
- NEVER expose in logs or error traces
- NEVER snapshot for testing

### Synthetic/Seed Data
- Generated test accounts (`staging-*@henrycogroup.com`)
- Fake payment records (non-functional)
- Sample orders with dummy products
- Simulated support threads
- Placeholder content

**Handling Requirements:**
- Safe for all non-production environments
- Must not resemble real PII patterns
- Must be clearly identifiable as test data

---

## Environment Boundary Matrix

| From ↓ To → | Production | Staging | Development | CI |
|-------------|------------|---------|-------------|-----|
| **Production** | ✓ Allowed | ✗ FORBIDDEN | ✗ FORBIDDEN | ✗ FORBIDDEN |
| **Staging** | ✗ FORBIDDEN | ✓ Allowed | ✗ FORBIDDEN | ✗ FORBIDDEN |
| **Development** | ✗ FORBIDDEN | ✗ FORBIDDEN | ✓ Allowed | ✗ FORBIDDEN |
| **CI** | ✗ FORBIDDEN | ✗ FORBIDDEN | ✗ FORBIDDEN | ✓ Allowed |

---

## Configuration Boundaries

### Supabase Projects

| Environment | Project Ref Pattern | Auth | Data |
|-------------|---------------------|------|------|
| Production | `rzkbgwuznmdxnnhmjazy` (live) | Real customers | Production data |
| Staging | `xxxxxxxxxstaging` (separate) | Test accounts only | Synthetic data |

**Rules:**
- Production project keys NEVER in non-production code
- Staging project keys NEVER in production deployments
- No shared databases between environments

### Vercel Projects

| Environment | Domain Pattern | Build Target |
|-------------|----------------|--------------|
| Production | `*.henrycogroup.com` | Production |
| Preview | `*.vercel.app` | Staging/branch |
| Development | `localhost:3000-*` | Local |

### Environment Variables

**Production-Only (never in repo, never in staging):**
```
SUPABASE_SERVICE_ROLE_KEY (production project)
STRIPE_SECRET_KEY (live mode)
TWILIO_AUTH_TOKEN (live account)
OWNER_ALERT_EMAIL (real addresses)
```

**Staging-Only:**
```
SUPABASE_SERVICE_ROLE_KEY (staging project)
STRIPE_SECRET_KEY (test mode)
STAGING_RESET_CONFIRM=YES
```

**Development/Shared:**
```
NEXT_PUBLIC_SUPABASE_URL (staging for local dev)
NEXT_PUBLIC_BASE_DOMAIN
```

---

## Operational Rules

### Rule 1: No Production Keys in Development

**Forbidden:**
```bash
# Using production service role for local testing
SUPABASE_SERVICE_ROLE_KEY=<production_key> npm run dev
```

**Required:**
```bash
# Use staging or local Supabase only
SUPABASE_SERVICE_ROLE_KEY=<staging_key> npm run dev
```

### Rule 2: No Seed Scripts Against Production

**Forbidden:**
```bash
# Running seed scripts with production credentials
node apps/marketplace/scripts/seed-marketplace.mjs  # With production env
```

**Required:**
```bash
# Explicit staging-only with verification
set SUPABASE_URL=https://staging.supabase.co
node apps/marketplace/scripts/seed-marketplace.mjs
```

### Rule 3: Migration Safety Per Environment

| Environment | Migration Strategy | Verification Required |
|-------------|-------------------|----------------------|
| Production | Scheduled window, pair deployment | Full smoke test |
| Staging | Anytime, single engineer | Basic health check |
| Development | Local only, disposable | Manual verification |

### Rule 4: Feature Flags for Dangerous Features

Features affecting production data must be flag-guarded:

```typescript
// Required pattern
if (process.env.HENRYCO_ENV === 'production' && !flags.allowDangerousOperation) {
  throw new Error('Operation not permitted in production');
}
```

---

## Environment Detection

**Runtime Detection (Server-Side Only):**
```typescript
// apps/*/lib/env.ts pattern
export function getEnvironment(): 'production' | 'staging' | 'development' {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'staging';
  return 'development';
}

export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

export function requireNonProduction(): void {
  if (isProduction()) {
    throw new Error('This operation is forbidden in production');
  }
}
```

**Never Trust Client-Side Detection:**
```typescript
// BAD: Client can spoof
const isProd = window.location.hostname === 'marketplace.henrycogroup.com';

// GOOD: Server-side validation only
const isProd = process.env.VERCEL_ENV === 'production';
```

---

## Seeding Protocols

### Staging Seed Procedure

```bash
# 1. Verify environment
node -e "console.log(process.env.SUPABASE_URL)"  # Must show staging URL

# 2. Run reset checklist (dry run first)
node apps/super-app/scripts/reset-staging.mjs

# 3. Only with explicit confirmation
set STAGING_RESET_CONFIRM=YES
node apps/super-app/scripts/reset-staging.mjs --execute

# 4. Re-seed divisions
node apps/super-app/scripts/seed.mjs

# 5. Verify
node scripts/verify-henryco-live.mjs
```

### Production Never Seeded

**Absolute Rules:**
- No truncate operations in production
- No bulk delete scripts in production
- No "reset" functionality in production
- All production data originates from user actions

---

## Audit Requirements

All environment-crossing actions must be logged:

| Action | Log Location | Retention |
|--------|--------------|-----------|
| Production DB access | Supabase logs + audit_logs | 90 days |
| Service role key usage | Application logs | 30 days |
| Migration application | Migration log + staff_audit_logs | Permanent |
| Seed script execution | stdout + staging logs | 30 days |

---

## Incident Response: Environment Contamination

**If production data is found in staging/development:**

1. **IMMEDIATE:** Stop all access to contaminated environment
2. **ASSESS:** Determine scope (tables, row counts, duration)
3. **ISOLATE:** Prevent further spread
4. **ERASE:** Purge contaminated data
   ```sql
   -- Example: Purge PII from staging
   truncate table profiles, customer_activity, support_threads;
   -- Re-seed with synthetic data only
   ```
5. **INVESTIGATE:** How did production data enter?
6. **REMEDIATE:** Fix process gap that allowed contamination
7. **DOCUMENT:** Incident report with root cause

---

## File System Boundaries

### Tracked in Repo
```
.env.example                    # Templates only
.env.*.example                  # Environment-specific templates
docs/                           # All documentation
```

### Gitignored (Never Tracked)
```
.env                            # Local secrets
.env.local                      # Local overrides
.env.production.local           # Production secrets (local only)
.env.staging.local              # Staging secrets (local only)
.vercel/.env.production.local   # Vercel-pulled secrets
*.log                           # Log files
data/                           # Any data exports
backups/                        # Backup files
```

---

## URL and Domain Boundaries

### Production Domains (Real Data)
- `account.henrycogroup.com`
- `marketplace.henrycogroup.com`
- `care.henrycogroup.com`
- `jobs.henrycogroup.com`
- `hub.henrycogroup.com` / `hq.henrycogroup.com`
- `studio.henrycogroup.com`
- `learn.henrycogroup.com`
- `property.henrycogroup.com`
- `logistics.henrycogroup.com`
- `staff.henrycogroup.com`

### Non-Production Domains (Synthetic Data)
- `*.vercel.app` — Preview deployments
- `localhost:*` — Local development

### Domain Detection Pattern
```typescript
export function isProductionHost(hostname: string): boolean {
  return hostname.endsWith('.henrycogroup.com') && 
         !hostname.includes('staging') &&
         !hostname.includes('preview');
}
```

---

## Testing Boundaries

### Unit Tests
- No database required
- No external services
- Pure function testing only

### Integration Tests
- Staging Supabase only
- Ephemeral data (cleaned after test)
- No production services

### E2E Tests
- Staging deployments only (`*.vercel.app`)
- Synthetic user flows
- No real payments or notifications

### Production Monitoring
- Read-only health checks
- No mutations
- No synthetic data creation

---

## Checklist: Before Operating on Production

- [ ] Verified current environment is production (not staging)
- [ ] Change approved by second engineer (for sensitive operations)
- [ ] Rollback plan documented
- [ ] Maintenance window scheduled (if downtime expected)
- [ ] Monitoring dashboard open
- [ ] Team communication channel ready
- [ ] No local development dependencies
- [ ] All operations via infrastructure-as-code (no manual SQL)

---

## Checklist: Setting Up Development Environment

- [ ] Using staging Supabase project (not production)
- [ ] Service role key is staging key
- [ ] No production environment variables in `.env.local`
- [ ] Guardrails pass: `pnpm run guardrails:repo`
- [ ] Seeding scripts configured for staging

---

## Related Documents

- `docs/env-boundaries.md` — Environment variable handling
- `docs/migration-discipline.md` — Safe migration practices
- `docs/recovery-playbook.md` — Incident response
- `docs/staging-dataset.md` — Staging data management

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-01 | Data Governance Pass | Initial environment separation model |
