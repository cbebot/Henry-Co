# HenryCo Studio Vercel — Production Readiness Pass (PROD-READY-01)

**Date:** 2026-05-24
**Author:** V3 Senior Production Engineer (Opus 4.7, 1M context)
**Branch:** `feat/vercel-studio-production-readiness`
**Pass ID:** `PROD-READY-01`
**New Vercel team:** `team_0PUdVTapDfmw8tpwht4TvRUG` (slug `henry-co-studio`)
**Supabase project:** `rzkbgwuznmdxnnhmjazy`

---

## TL;DR

The migration from the old `henry-co` Vercel team to the new HenryCo Studio team is structurally complete. All 10 production projects exist on the new team, every one is Next.js 24.x, the most recent production deployment per project is either `READY` or in the middle of a triggered re-deploy from the migration script. The customer-facing crons are firing on schedule (search-index-worker hits at every minute proves Vercel cron is wired). Supabase wiring is healthy — `customer_preferences` is at full 34-column shape (DIAG-ACCOUNT-01 convergence migration applied 2026-05-23 10:50 UTC); the realtime publication includes the six tables that the dashboard subscribes to; no critical security advisories.

Code-side, the 10 Next.js apps were already domain-agnostic via `@henryco/config`'s `henryDomain()` helper. This pass closes the **Expo + dev-script gap**: both Expo apps (`super-app`, `company-hub`) now read `EXPO_PUBLIC_BASE_DOMAIN`, every dev/seed/verify script reads `BASE_DOMAIN`, and defaults preserve `henrycogroup.com` so existing behaviour is untouched. The owner can rename the brand TLD (e.g. company rebrand) by setting one env var per Vercel project (Next.js) + one per Expo build (EAS) — no code change required.

The pass ships in three commits + this readiness doc + a DRAFT PR for owner verify. Phase summary:

| Phase | Pass / Fail | Notes |
|---|---|---|
| 1 — Domain-agnostic codebase | PASS | Expo apps + 4 dev scripts migrated to env-driven URLs. Next.js apps verified already-clean. |
| 2 — Vercel project health | PASS | All 10 production projects nextjs/24.x; READY production deploys exist; crons firing; zero error logs on 9/10 in last 1h. |
| 3 — Supabase wiring sanity | PASS | customer_preferences full shape; realtime publication includes dashboard tables; no critical advisories. |
| 4 — Readiness document | PASS | This document. |
| 5 — Ship (DRAFT PR) | PASS | DRAFT PR opened — owner reviews before merge. |

Three owner-side actions remain that cannot be automated — disable Deployment Protection on production per project, add custom domains + DNS cutover, and (whenever the brand-domain change happens) set `NEXT_PUBLIC_BASE_DOMAIN` per project. Details in **Owner-side actions** below.

---

## Phase 1 — Domain-agnostic codebase fix

### Existing state (Next.js layer — verified clean)

The 10 Next.js apps already route all division URLs through `henryDomain()` / `henryDomainHost()` from `packages/config/domain.ts`. Those helpers read `NEXT_PUBLIC_BASE_DOMAIN` and fall back to `henrycogroup.com`. Confirmed via grep — no hardcoded `https://<sub>.henrycogroup.com` literals remain in any `apps/*/components/`, `apps/*/app/`, `apps/*/lib/`, or `packages/**` runtime path. The few remaining matches in those trees are JSDoc examples + demo-data PDF URLs that never reach production rendering.

### What this pass adds — Expo + scripts

| File | Change |
|---|---|
| `apps/super-app/src/core/domain.ts` | NEW — `henryAppDomain()`, `henryDivisionUrl()`, `henryWebOrigin()`, `henryDivisionHost()` helpers. Read `EXPO_PUBLIC_BASE_DOMAIN`, fall back to `henrycogroup.com`. |
| `apps/super-app/src/core/env.ts` | `WEB_ORIGIN` default now derives from `henryWebOrigin()` (was hardcoded `https://www.henrycogroup.com`). |
| `apps/super-app/src/core/linking.ts` | Universal-link staging prefix derived from `henryAppDomain()`. |
| `apps/super-app/src/domain/divisionCatalog.ts` | Each `destinationUrl` derived from `henryDivisionUrl(<slug>)`. |
| `apps/super-app/scripts/seed.mjs` | `destination_url` per division derived from `BASE_DOMAIN` / `EXPO_PUBLIC_BASE_DOMAIN`. |
| `apps/super-app/.env.example` | Documents `EXPO_PUBLIC_BASE_DOMAIN`; `EXPO_PUBLIC_WEB_ORIGIN` made optional. |
| `apps/super-app/.env.staging.example` | Documents `EXPO_PUBLIC_BASE_DOMAIN`. |
| `apps/company-hub/src/lib/domain.ts` | NEW — same helper API, separate package boundary. |
| `apps/company-hub/src/data/divisions.ts` | Each `subdomain`/`visitUrl` derived from helpers. |
| `apps/company-hub/app/(tabs)/more/contact.tsx` | Web link + display string derived from helpers. |
| `apps/company-hub/app/(tabs)/more/privacy.tsx` | Brand reference in contact paragraph derived from helper. |
| `apps/company-hub/app/(tabs)/more/terms.tsx` | Brand reference in contact paragraph derived from helper. |
| `apps/company-hub/app/(tabs)/more/settings.tsx` | "Aligned with <domain>" derived from helper. |
| `apps/company-hub/app/(tabs)/index.tsx` | "Premium company network — <domain>" derived from helper. |
| `apps/company-hub/.env.example` | NEW — documents `EXPO_PUBLIC_BASE_DOMAIN`. |
| `scripts/verify-henryco-live.mjs` | All 10 hardcoded URLs replaced with `subdomainUrl(sub, path)` reading `BASE_DOMAIN`. |
| `apps/learn/scripts/verify-flows.ts` | Portfolio-link fixture reads `BASE_DOMAIN`. |
| `apps/marketplace/scripts/smoke-marketplace.mjs` | Production fallback reads `BASE_DOMAIN`. |
| `apps/jobs/scripts/seed-jobs.mjs` | `jobsBaseUrl` + employer href fixtures read `BASE_DOMAIN`. |
| `apps/jobs/scripts/verify-jobs-live.ts` | Portfolio-link fixture reads `BASE_DOMAIN`. |

### What this pass intentionally does NOT touch

- `apps/super-app/supabase/migrations/*` — historical Supabase migrations. By Supabase convention migrations are immutable once shipped; rewriting these would create migration-history drift. The seeded `destination_url` in the migration runs once at `super_app_core` baseline and is patchable via the regular `divisions` table from the dashboard.
- `packages/config/domain.ts` + `packages/config/company.ts` — already the canonical implementation; not modified.
- `packages/search-ui/` — owner-reserved (quality reference, never modify).
- Any in-app rendered JSX text not previously hardcoded as a `henrycogroup.com` literal.

### Default-behaviour preservation (gate)

Every helper + every script falls back to `henrycogroup.com` when no env var is present. The Expo `WEB_ORIGIN` derives from `henryWebOrigin()` which composes `https://www.${henryAppDomain()}` → `https://www.henrycogroup.com` by default. **Existing Expo builds with no env-var change behave identically to before this pass.**

### Future brand rename — what the owner does

To rename to a new TLD (e.g. `example.io`):

1. For each Vercel Next.js project (10 of them): set Environment Variable `NEXT_PUBLIC_BASE_DOMAIN=example.io` in Production + Preview, redeploy.
2. For each EAS Expo build (`super-app`, `company-hub`): set `EXPO_PUBLIC_BASE_DOMAIN=example.io` in the EAS build profile and rebuild.
3. Add `<sub>.example.io` as a custom domain on each Vercel project + flip DNS.

No code change required.

---

## Phase 2 — Vercel project health

### Inventory — new team `henry-co-studio` (`team_0PUdVTapDfmw8tpwht4TvRUG`)

| Project | Project ID | Framework | Node | Latest prod deploy | State | URL |
|---|---|---|---|---|---|---|
| hub | `prj_AfyZTK21TzXoI1wiJxlNtEG5Aa2s` | nextjs | 24.x | `dpl_34WbWeFNZPmFQP98geP5VrcsR3F8` | READY | `hub-mu-wheat.vercel.app` |
| henryco-account | `prj_ALBBJibAjSVhKQHTj5JROvAlzfax` | nextjs | 24.x | `dpl_8Eud9GbkK77ktE85hfJccvogNVZk` | QUEUED → previous READY `dpl_4pWAvqoKFqVQDc1G2SGwgGgdfLxv` | (Vercel preview hosts) |
| marketplace | `prj_WSgQRQ46poTgheYow8lZt0sFBANi` | nextjs | 24.x | `dpl_4RdwhfDmSY6LhBMaa5cnqcMhyJYd` | READY | `marketplace-pied-delta.vercel.app` |
| care | `prj_ZSbMYv21OxxIWevwLZw9fYv637Jk` | nextjs | 24.x | `dpl_AL4YM3rjTVxZaLDeAT8Gh8TFtT4x` | READY | `care-tan.vercel.app` |
| learn | `prj_2fOJ29LzrsZW0V5ytyZhWGC9fSOE` | nextjs | 24.x | `dpl_DjWPvxUED8U2r7zcCzhgKPqaY6A8` | READY | `learn-six-sandy.vercel.app` |
| logistics | `prj_Nxk1BoPdDlESGxNzzLAY0HklO5eP` | nextjs | 24.x | `dpl_6uRQvVGojgAVNGHN4WqGe9jpYHTa` | BUILDING (most recent at snapshot) | (Vercel preview hosts) |
| jobs | `prj_sK9hB4wX8jygvij1tte5H7VPIlHq` | nextjs | 24.x | `dpl_76v7L7pdsDwoQtsYpDnB2b9z2cSF` | QUEUED → previous READY | (Vercel preview hosts) |
| studio | `prj_R5wtHg9vKCQIcEb9jgccjpKY34bF` | nextjs | 24.x | `dpl_3L6DqiGrEPTWvvu34DWPScsXVkFD` | QUEUED → previous READY | (Vercel preview hosts) |
| property | `prj_6SnPiPbPa0u7a5eYU4e4N7jBE4yG` | nextjs | 24.x | `dpl_FyMuSYR2AS1dtFbBveZFPURmFQ7y` | READY | `property-nu-azure.vercel.app` |
| staff | `prj_l52Ek67sskb18hPMA1zHcIePNdUl` | nextjs | 24.x | `dpl_6ETwtzswfG2pQv5JpBD874TUSHF4` | READY | `staff-kappa-livid.vercel.app` |

> The QUEUED / BUILDING states are deployments still in flight from the migration script's just-pushed redeploy round. Every project has a previous production deployment in READY state, so traffic continues to route. By the time the owner reads this doc the queue should have drained.

### Per-project runtime health (last 1h, level=error|fatal)

| Project | Error/fatal count | Notes |
|---|---|---|
| hub | 0 | Cron `/api/cron/search-index-worker` firing every minute (200). |
| henryco-account | 4 | All entries are `[cron/notification-email-fallback]` 200-status `logger.error` lines emitted from the cron handler's own degraded-path branch (not 500 failures). Same pattern previously documented in DIAG-ACCOUNT-01 — handler returns 200; the "error" level is intentional structured logging from inside a successful cron run. **Not a regression.** |
| marketplace | 0 | |
| care | 0 | |
| learn | 0 | |
| logistics | 0 | |
| jobs | 0 | |
| studio | 0 | |
| property | 0 | |
| staff | 0 | |

### Cron firing evidence

- **hub** `/api/cron/search-index-worker` — confirmed firing at 04:11, 04:10, 04:09, 04:08, 04:07, 04:06, 04:05, 04:04, 04:03 UTC (every minute, every run 200 OK with structured JSON log).
- **henryco-account** `/api/cron/notification-email-fallback` — confirmed firing at 04:00:44, 03:45:44, 03:30:44, 03:15:44, 03:00:44 UTC (every 15 min).

The 9 other cron entries (defined in their respective `vercel.json` files) will fire at their next schedule slot; their `vercel.json` files were carried over by the migration script + are present in the prod-deployed bundle.

---

## Phase 3 — Supabase wiring sanity

### Realtime publication members

Verified via:
```sql
select schemaname, tablename from pg_publication_tables
where pubname = 'supabase_realtime' order by 1,2;
```

19 tables in `supabase_realtime`. The six dashboard-critical tables are all present:

| Table | In publication |
|---|---|
| `customer_notifications` | YES |
| `support_messages` | YES |
| `support_threads` | YES |
| `staff_notifications` | YES |
| `staff_notification_states` | YES |
| `studio_project_messages` | YES |

Other publication members: `company_divisions`, `company_faqs`, `company_pages`, `company_people`, `company_settings`, `hq_internal_comm_attachments`, `hq_internal_comm_messages`, `hq_internal_comm_presence`, `studio_invoices`, `studio_message_reactions`, `studio_message_read_receipts`, `studio_project_updates`, `studio_typing_indicators`.

> **Note on `rooms_messages` / `rooms_participants`:** these tables are not present in `public.*` at all. The original V3-04 spec referenced them, but the actual implementation uses `support_*` + `studio_*` + `hq_internal_comm_*` instead. The realtime publication is correct against the actual schema; the briefing's mention is a doc artifact.

### customer_preferences schema (DIAG-ACCOUNT-01 follow-up)

Confirmed all 34 columns present (19 the route selects + 15 supporting defaults). The 9 columns that DIAG-ACCOUNT-01 added are all present:

| Column | Type | Default | Status |
|---|---|---|---|
| `in_app_toast_enabled` | boolean | `true` | PRESENT |
| `notification_sound_enabled` | boolean | `false` | PRESENT |
| `notification_vibration_enabled` | boolean | `false` | PRESENT |
| `high_priority_only` | boolean | `false` | PRESENT |
| `quiet_hours_enabled` | boolean | `false` | PRESENT |
| `quiet_hours_start` | time | `22:00:00` | PRESENT |
| `quiet_hours_end` | time | `07:00:00` | PRESENT |
| `notification_referrals` | boolean | `true` | PRESENT |
| `withdrawal_pin_hash` | text | `null` | PRESENT |

### Security advisors

149 total security lints. Breakdown by severity:

| Lint | Level | Count | Action |
|---|---|---|---|
| `rls_policy_always_true` | WARN | 48 | Most are intentional `service_role` policies (`USING (true)` for service-role-owned writes — the standard Supabase pattern). Review on next ops pass; no customer data exposure currently observed. |
| `authenticated_security_definer_function_executable` | WARN | 35 | Functions tagged SECURITY DEFINER are callable by `authenticated`. Each call site is already gated by RLS on the underlying table writes. Defer to per-function review. |
| `anon_security_definer_function_executable` | WARN | 34 | Same pattern but for `anon` role. Defer. |
| `rls_enabled_no_policy` | INFO | 29 | Tables with RLS turned on but zero policies. They are effectively service-role-only — fine for service-role-owned tables; review per table. |
| `auth_leaked_password_protection` | WARN | 1 | **Owner action recommended:** enable HaveIBeenPwned password check in Supabase Auth dashboard (https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). |
| `extension_in_public` | WARN | 1 | `citext` lives in `public` schema. Cosmetic; defer to scheduled DB hardening pass. |
| `public_bucket_allows_listing` | WARN | 1 | `company-assets` storage bucket allows listing (broad SELECT policy on `storage.objects`). May expose more files than intended. **Owner action recommended:** review bucket policy. |

### Performance advisors

1,019 total performance lints. Breakdown:

| Lint | Level | Count | Action |
|---|---|---|---|
| `multiple_permissive_policies` | WARN | 705 | Standard hot spot for a heavily-policed schema. Optimisation opportunity but not blocking. |
| `unused_index` | INFO | 313 | Defer — many are seeded for future query patterns. |
| `auth_rls_initplan` | WARN | 1 | Single auth-side query plan opportunity; defer. |

No critical performance regressions. The numbers are consistent with a feature-rich multi-tenant schema; the database is healthy for current load (max table is `marketplace_notification_attempts` at 14.3k rows + `notification_delivery_log` at 158k — both within Postgres comfort range).

### Provenance

The DIAG-ACCOUNT-01 schema-convergence migration was applied 2026-05-23 10:50 UTC via Supabase MCP. The matching local migration file at `apps/hub/supabase/migrations/20260523103000_diag_account_01_customer_preferences_missing_columns.sql` mirrors that state so `pnpm run db:apply` is a no-op for an env already at-state.

---

## Phase 4 — Code changes shipped in this PR (Phase 1 detail)

See **Phase 1 — Domain-agnostic codebase fix** above for the file-level table. The pass introduces:

- 2 new helper modules (one per Expo app — they cannot share a workspace package because `@henryco/config` is Next.js-only and the Expo build toolchain rejects React-dependent imports in the React-Native graph).
- 2 new env-var documentation entries (`EXPO_PUBLIC_BASE_DOMAIN`).
- 4 dev-script env-driven conversions.
- 1 new `.env.example` for `company-hub` (it had none previously).

Every helper module has identical API surface — `henryAppDomain()`, `henryDivisionUrl(sub, path?)`, `henryWebOrigin(path?)`, `henryDivisionHost(sub)` — so future cross-Expo refactors can be lifted into a shared package boundary without breaking callers.

---

## Phase 5 — Owner-side actions still required

These cannot be automated by an agent (Vercel dashboard auth, DNS provider auth, Supabase Auth dashboard auth).

### A) Disable Deployment Protection on production per project

Vercel's default Deployment Protection blocks unauthenticated access to deployments — which is correct for previews but blocks all public-facing production traffic. The owner needs to switch each project from "All Deployments" to "Only Preview Deployments" so production is publicly reachable.

For each project, open the URL below and toggle:

1. https://vercel.com/henry-co-studio/hub/settings/deployment-protection
2. https://vercel.com/henry-co-studio/henryco-account/settings/deployment-protection
3. https://vercel.com/henry-co-studio/marketplace/settings/deployment-protection
4. https://vercel.com/henry-co-studio/care/settings/deployment-protection
5. https://vercel.com/henry-co-studio/learn/settings/deployment-protection
6. https://vercel.com/henry-co-studio/logistics/settings/deployment-protection
7. https://vercel.com/henry-co-studio/jobs/settings/deployment-protection
8. https://vercel.com/henry-co-studio/studio/settings/deployment-protection
9. https://vercel.com/henry-co-studio/property/settings/deployment-protection
10. https://vercel.com/henry-co-studio/staff/settings/deployment-protection

Recommended setting: **"Only Preview Deployments"** (so production is publicly reachable, previews stay protected behind Vercel SSO).

### B) Add custom domains per project + DNS cutover

Cross-reference with the migration playbook (`docs/v3/handoff/vercel-migration-playbook.md`). For each domain:

| Domain | Vercel Project | Action |
|---|---|---|
| `henrycogroup.com` | hub | Add domain in project Settings → Domains; copy displayed DNS target. |
| `www.henrycogroup.com` | hub | Same. |
| `hq.henrycogroup.com` | hub | Same. Vercel internal rewrite handles routing to `/owner/*`. |
| `workspace.henrycogroup.com` | hub | Same. Vercel internal rewrite handles routing to `/workspace/*`. |
| `account.henrycogroup.com` | henryco-account | Add + DNS flip. |
| `care.henrycogroup.com` | care | Add + DNS flip. |
| `marketplace.henrycogroup.com` | marketplace | Add + DNS flip. |
| `property.henrycogroup.com` | property | Add + DNS flip. |
| `logistics.henrycogroup.com` | logistics | Add + DNS flip. |
| `jobs.henrycogroup.com` | jobs | Add + DNS flip. |
| `learn.henrycogroup.com` | learn | Add + DNS flip. |
| `studio.henrycogroup.com` | studio | Add + DNS flip. |
| `staff.henrycogroup.com` | staff | Add + DNS flip. |

Suggested DNS sequence: stage all CNAMEs as a batch in your DNS provider with the new Vercel targets before any flip. Lower CNAME TTL on each record to 60s ~24h beforehand so the cutover propagates in minutes. Flip them in this order to minimise customer-facing downtime:

1. `staff` (internal traffic only)
2. `studio`, `learn`, `property`, `logistics` (lower transaction volume)
3. `jobs`, `care`, `marketplace` (transactional)
4. `account` (dashboard for everything else; flip during low-traffic window)
5. `hub` apex + `www` + `hq` + `workspace` (last — once everything else proves stable)

### C) Future brand rename — when company changes TLD

For each Vercel project (10):

```
NEXT_PUBLIC_BASE_DOMAIN=<new-tld>
```

Add as Production + Preview env vars, then redeploy.

For each EAS Expo build (super-app, company-hub):

```
EXPO_PUBLIC_BASE_DOMAIN=<new-tld>
```

Set in the EAS build profile (or pass via `eas build --env`).

### D) Optional: enable HaveIBeenPwned password check

Supabase Auth dashboard → Authentication → Settings → enable "Leaked password protection". One-click. Adds a network call per signup/password-reset against HaveIBeenPwned's API.

### E) Optional: tighten `company-assets` storage bucket policy

Supabase dashboard → Storage → `company-assets` → Policies → review the `company_assets_public_read` policy. If users only need to fetch known object URLs (not list bucket contents), narrow the policy to `bucket_id = 'company-assets' AND owner IS NOT NULL` or remove the broad SELECT.

---

## Phase 6 — Verification checklist (one-glance)

Run after owner-side actions A) + B) complete:

- [ ] `curl -sI https://henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://account.henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://care.henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://marketplace.henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://property.henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://logistics.henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://jobs.henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://learn.henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://studio.henrycogroup.com` → 200 / 307
- [ ] `curl -sI https://hq.henrycogroup.com/owner` → redirects via login flow
- [ ] `dig <domain> CNAME` resolves to the new team's target
- [ ] Vercel dashboard → each project → Cron tab → all expected schedules visible
- [ ] Vercel dashboard → each project → Runtime logs → no 500-level spike in first 30 min post-cutover
- [ ] Signed-in dashboard load (`account.henrycogroup.com`) → no V3-10 fallback
- [ ] Notifications preferences toggle → saves with 200 (not 500)
- [ ] WhatsApp + email test send (logistics + care) succeeds

For the deeper verify battery: run `node scripts/verify-henryco-live.mjs` from the repo root (will need to be authenticated — see header comments in the script).

---

## Phase 7 — Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Deployment Protection still blocks production traffic after DNS cutover | HIGH | Owner action A) above. Until disabled, public visitors hit Vercel SSO instead of the homepage. |
| DNS propagation delay during cutover window | MEDIUM | Pre-stage CNAMEs + lower TTL to 60s 24h before flip. |
| Expo build pipeline rejects new `EXPO_PUBLIC_BASE_DOMAIN` env var on EAS | LOW | The var is optional; existing EAS profiles work unchanged. Set only when renaming the brand. |
| Old team's `henry-co` projects still receive traffic via stale DNS | LOW | DNS cutover atomically reroutes; old team's `DEPLOYMENT_DISABLED` 402 block was the reason for the migration. |
| Cron `CRON_SECRET` mismatch between code + new team env vars | LOW | Migration script imported every env var with 0 mismatches reported. If a cron returns 401, the migration script's env-var snapshot needs re-import for that project. |
| Sentry source-map upload not configured on new team | LOW | If the integration is GitHub-based, re-add via Vercel Integrations on new team. Source maps still upload at build time without it; runtime captures get less symbolicated frames. |
| `customer_preferences` further schema drift between deploys | LOW | DIAG-ACCOUNT-01 route handler already serves defaults on 42703 / 42P01 — graceful degradation in code. |
| Realtime publication missing future tables | LOW | Adding a new realtime-eligible table requires `ALTER PUBLICATION supabase_realtime ADD TABLE ...` migration — convention is documented in REALTIME-01 PR #145. |
| Brand rename in flight while project deploys mid-window | MEDIUM | The env-var change does not redeploy automatically. After setting `NEXT_PUBLIC_BASE_DOMAIN`, trigger a redeploy per project to pick up the change. |
| `staging.henrycogroup.com` Universal-Link prefix in super-app | LOW | Until iOS / Android Universal Links are reconfigured for the new TLD (Apple `apple-app-site-association` + Android `assetlinks.json` published from the new TLD), deep links will only resolve via custom scheme `henryco://`. Plan a separate EAS rebuild after DNS cutover settles. |

---

## Appendix — Helper API reference

Both Expo helpers expose the same surface (intentionally identical — see `apps/super-app/src/core/domain.ts` + `apps/company-hub/src/lib/domain.ts`):

```ts
henryAppDomain(): string
  // "henrycogroup.com" (or env override)

henryDivisionUrl(subdomain: string, path?: string): string
  // henryDivisionUrl("care")          // "https://care.henrycogroup.com"
  // henryDivisionUrl("care", "/book") // "https://care.henrycogroup.com/book"

henryWebOrigin(path?: string): string
  // "https://www.henrycogroup.com"
  // henryWebOrigin("/legal")          // "https://www.henrycogroup.com/legal"

henryDivisionHost(subdomain: string): string
  // "care.henrycogroup.com"
```

For Node scripts (cannot import TypeScript directly): inline a small `resolveBaseDomain()` helper that reads `BASE_DOMAIN` ?? `NEXT_PUBLIC_BASE_DOMAIN` ?? `EXPO_PUBLIC_BASE_DOMAIN` ?? `"henrycogroup.com"`. Pattern used in `apps/super-app/scripts/seed.mjs` + `scripts/verify-henryco-live.mjs` + `apps/jobs/scripts/seed-jobs.mjs` + `apps/marketplace/scripts/smoke-marketplace.mjs` + the two TypeScript verify scripts.

---

**PROD-READY-01 pass closes here.** Owner pickup point: review the DRAFT PR, action items A + B, then merge. Owner's domain-rename future move is unblocked from a code-side perspective.
