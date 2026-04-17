# HenryCo Change Safety Checklist

**Classification:** REQUIRED FOR ALL PRODUCTION DEPLOYMENTS  
**Version:** 2025.01-data-governance  
**Scope:** All code, configuration, and database changes to production

---

## Purpose

This checklist ensures that every production change is:
- **Reviewed** by appropriate personnel
- **Tested** in a representative environment
- **Revertible** if issues arise
- **Observable** when deployed

**Rule:** No production change proceeds without this checklist completion.

---

## Pre-Deployment Checklist

### 1. Code Quality Verification

- [ ] **Lint passes** — `pnpm run lint:all` exits 0
- [ ] **Typecheck passes** — `pnpm run typecheck:all` exits 0
- [ ] **Tests pass** — `pnpm run test:workspace` exits 0 (or known flakes documented)
- [ ] **Build succeeds** — `pnpm run build:all` completes
- [ ] **Guardrails pass** — `pnpm run guardrails:repo` exits 0

**Evidence Required:** CI run link or terminal output screenshot

### 2. Change Classification

| Type | Criteria | Additional Requirements |
|------|----------|------------------------|
| **Routine** | Bug fix, UI tweak, copy change | Standard PR review |
| **Significant** | New feature, API change | Staging validation + 2 reviewers |
| **Critical** | Auth, payments, data integrity | Full checklist + pair deployment |
| **Emergency** | Security fix, outage recovery | Post-incident review required |

**This change is classified as:** _________

### 3. Scope Assessment

- [ ] **Apps affected:** ___ (list all)
- [ ] **Shared packages changed:** ___ (list all)
- [ ] **Database migrations included:** Yes / No
- [ ] **Environment variables added/changed:** Yes / No
- [ ] **External service dependencies changed:** Yes / No

**Impact Matrix Reviewed:** See `docs/redeploy-impact-matrix.md`

### 4. Database Change Verification (if applicable)

- [ ] Migrations follow naming convention (`YYYYMMDDHHMMSS_description.sql`)
- [ ] Migrations are idempotent (safe to re-run)
- [ ] Migrations tested against staging database
- [ ] No destructive operations without documented recovery plan
- [ ] RLS policies reviewed for security
- [ ] Indexes added for new query patterns
- [ ] Migrations applied to staging before production

**Migration Risk Level:** LOW / MEDIUM / HIGH / CRITICAL

**Migration Application Order:**
1. Apply migrations first
2. Wait 60 seconds for PostgREST cache refresh
3. Deploy application code
4. Verify with probe script

### 5. Staging Validation

- [ ] Change deployed to staging/preview environment
- [ ] Smoke tests pass: `node scripts/verify-henryco-live.mjs`
- [ ] Division-specific smoke tests pass:
  - [ ] Account: authentication, notifications
  - [ ] Marketplace: product browse, cart (guest), checkout gate
  - [ ] Jobs: candidate workspace
  - [ ] Studio: client workspace
  - [ ] Hub: owner dashboard, internal comms
  - [ ] Learn: owner route
  - [ ] Staff: staff workspace (if applicable)
  - [ ] Care: bookings, support
- [ ] Feature flag verification (if applicable)
- [ ] No console errors in browser
- [ ] No 500 errors in logs

**Staging URL:** ___________________

### 6. Rollback Preparation

- [ ] Previous successful deployment identified
- [ ] Rollback procedure documented (if not standard Vercel rollback)
- [ ] Database rollback strategy (if applicable — usually NONE for forward-only)
- [ ] Team member available to execute rollback if needed

**Rollback Time Estimate:** _______ minutes

### 7. Production Deployment Window

- [ ] Low-traffic period selected (avoid business hours peaks)
- [ ] Maintenance window communicated (if downtime expected)
- [ ] Monitoring dashboard open and accessible
- [ ] Incident response channel ready (Slack/Discord)

**Deployment Time:** _______ UTC

### 8. Observability Verification

- [ ] Error tracking configured (Sentry)
- [ ] Key metrics visible in dashboard
- [ ] Alert thresholds appropriate
- [ ] On-call rotation aware of deployment

---

## Deployment Execution Checklist

### During Deployment

- [ ] Deploy to Vercel production (or promote from preview)
- [ ] Wait for deployment to complete (all regions)
- [ ] Run post-deploy smoke tests
- [ ] Monitor error rates for 5 minutes
- [ ] Check critical user flows

### Post-Deployment Verification (within 15 minutes)

- [ ] Production health check passes
- [ ] Error rate normal (baseline comparison)
- [ ] Response times normal (baseline comparison)
- [ ] Key business metrics normal (checkouts, signups, etc.)
- [ ] No critical alerts firing

### Extended Monitoring (within 1 hour)

- [ ] No increase in support tickets
- [ ] Division-specific health checks pass
- [ ] Database performance normal (query times, connection count)
- [ ] External service integrations functional

---

## Post-Deployment Documentation

### Update Status Documents

- [ ] `docs/feature-status.md` updated if new feature
- [ ] `docs/known-issues.md` updated if issues found
- [ ] `docs/intelligence-rollout-status.md` updated if behavior changed

### If Issues Detected

1. **Assess severity:** P0 (critical) / P1 (high) / P2 (medium) / P3 (low)
2. **Decision:** Rollback / Hotfix / Monitor
3. **Execute:** Rollback if P0/P1 and not immediately fixable
4. **Document:** Add to `docs/known-issues.md`

---

## Special Cases

### Emergency Deployment (Security Fix)

**Exceptions permitted:**
- Staging validation abbreviated (but not skipped)
- Single reviewer approval acceptable
- Post-incident review within 24 hours

**Still required:**
- Guardrails pass
- Basic smoke tests
- Rollback plan

### Database Migration Deployment

**Additional requirements:**
- Pair deployment (two engineers present)
- Migration log captured
- Schema drift check before and after
- Query performance sampled for new indexes

### Shared Package Change

**Additional requirements:**
- All dependent apps rebuilt and deployed
- Impact matrix fully reviewed
- Integration tests for affected divisions

---

## Sign-Off

**Deployer:** _________________  **Date/Time:** _________________

**Reviewer:** _________________  **Date/Time:** _________________

**Approved for production deployment:** Yes / No (with conditions)

---

## Quick Reference: Division Smoke Tests

```bash
# Run all smoke tests
node scripts/verify-henryco-live.mjs

# Division-specific tests
node apps/marketplace/scripts/smoke-marketplace.mjs
node apps/studio/scripts/smoke-studio.mjs
node apps/property/scripts/smoke-property.mjs
node apps/jobs/scripts/verify-jobs-live.ts
node apps/learn/scripts/smoke-learn.ts
```

---

## Quick Reference: Rollback Commands

```bash
# Vercel rollback via CLI
vercel rollback <deployment-url>

# Database migration (emergency)
# Note: Migrations are forward-only; restore from backup if critical

# Supabase connection
psql $DATABASE_URL -c "SELECT version();"
```

---

## Related Documents

- `docs/migration-discipline.md` — Migration safety procedures
- `docs/recovery-playbook.md` — Incident response procedures
- `docs/environment-separation-model.md` — Environment boundaries
- `docs/deploy-checklist.md` — Division-specific deployment notes
- `docs/redeploy-impact-matrix.md` — Shared package impact

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-01 | Data Governance Pass | Initial change safety checklist |
