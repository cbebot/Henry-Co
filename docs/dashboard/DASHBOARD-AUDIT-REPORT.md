# HenryCo Unified Dashboard — Phase 0 Full Ecosystem Audit

**Status:** Draft 1 — Phase A through Phase D plus per-division audit (Phase B) consolidated.
**Author:** Claude Code (Opus 4.7), running as Principal Systems Architect / Continuity Auditor.
**Date:** 2026-05-02.
**Branch:** `claude/wonderful-kalam-ef5b00` (worktree).
**Scope:** Read-only audit of the HenryCo monorepo to feed the unified-dashboard rebuild prompt at [`DASHBOARD-REBUILD-FORGED-PROMPT.md`](./DASHBOARD-REBUILD-FORGED-PROMPT.md).
**Truth hierarchy:** every assertion is cited file:line. If a claim cannot be cited, it is marked `UNVERIFIED`.

---

## 0. Preface — what was given, what was assumed, what is uncertain

### 0.1 Forged prompt input
The forged prompt that initiated this pass was truncated mid-sentence inside the "ANTI-PATTERNS" block (final two lines were `  - Do not skip divisions, even if "they look similar"` followed by `  - Do` with no continuation). All other sections were complete. Anti-patterns interpretation: the explicit bullets we have are sufficient — no production code modified, no scaffolds created, no migrations run, no division skipped.

### 0.2 Discovery surprises that diverged from the prompt's framing
| Prompt assumption | Repo truth | Where verified |
|---|---|---|
| "10 division apps" | **13 workspace apps** — 10 Next.js web + 2 Expo/React Native (`super-app`, `company-hub`) + 1 nested orphan (`apps/apps/hub`) | [`apps/`](apps), [`pnpm-workspace.yaml`](pnpm-workspace.yaml) |
| Single `supabase/migrations/` at repo root | **Per-app migrations**; no root `supabase/`. Hub holds the cross-cutting/canonical schema (28 migrations) | `apps/hub/supabase/migrations/`, `apps/learn/supabase/migrations/`, etc. |
| Phase 1 Cross-Division Notifications "queued" | **Substantially implemented at the schema layer** — `customer_notifications` realtime, `staff_notifications` + `staff_notification_states` + `is_staff_in()` predicate already exist | [`apps/hub/supabase/migrations/20260501130000_notification_realtime_publication.sql`](apps/hub/supabase/migrations/20260501130000_notification_realtime_publication.sql), [`apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql`](apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql) |
| Single dashboard surface to replace | **Three coexisting dashboards** — customer (account.henrycogroup.com), owner (hq.henrycogroup.com), staff workspace (workspace./staffhq. → apparently broken, see §A.10) | [`apps/hub/vercel.json:12-72`](apps/hub/vercel.json), [`apps/hub/proxy.ts:78-117`](apps/hub/proxy.ts), [`apps/hub/app/workspace/[[...slug]]/page.tsx:26-37`](apps/hub/app/workspace/%5B%5B...slug%5D%5D/page.tsx), [`apps/hub/app/owner/(command)/page.tsx`](apps/hub/app/owner/%28command%29/page.tsx), [`apps/account/app/(account)/page.tsx`](apps/account/app/%28account%29/page.tsx) |
| Single `account.henrycogroup.com/dashboard` canonical entry | The canonical *customer* surface is `account.henrycogroup.com/` (not `/dashboard`); the owner/staff surfaces live on `hq.*` and `staffhq.*`. The unified shell must reconcile this. | [`packages/config/company.ts:343-361`](packages/config/company.ts), [`apps/hub/vercel.json:12-72`](apps/hub/vercel.json) |
| `building`/`hotel` divisions absent | Both **registered in COMPANY.divisions** with full nav config but no `apps/` — future divisions must be a first-class shell concern | [`packages/config/company.ts:117-161`](packages/config/company.ts) |
| `turbo.json` exists | **Plain pnpm workspaces, no Turborepo** | [`package.json`](package.json), no `turbo.json` exists |

### 0.3 Uncertainties carried forward (`UNVERIFIED — REQUIRES OWNER CONFIRMATION`)
- **Apparent infinite-redirect loop on `staffhq.henrycogroup.com`** — needs live verification (see §A.10). If real, the existing staff workspace is fully non-functional and the rebuild can replace it without coordination.
- **Whether `app/lib/workspace/data.ts` (the repo-root file outside the workspace) is referenced anywhere by build tooling.** Code-trace says no (the canonical copy is at `apps/hub/app/lib/workspace/data.ts`); but it could be a lift target for a future shared package.
- **Live status of Pre-Notification Hardening (V2-PNH-04 / Auth SMTP proof).** The most recent V2-PNH-04 commit is on the branch (4d90d8b's predecessor); whether the Brevo Auth SMTP proof has been received by ops is not derivable from code. Hard dependency for rebuild start.

---

## A. Repository ground truth

### A.1 Toolchain and root config

| Concern | Truth | Citation |
|---|---|---|
| Package manager | `pnpm@9.15.5`, workspaces only — `apps/*` and `packages/*` | [`package.json:5`](package.json), [`pnpm-workspace.yaml:1-4`](pnpm-workspace.yaml) |
| Node engine | `24.x` | [`package.json:6-8`](package.json) |
| Build orchestrator | None — plain `pnpm -r --filter "./apps/*" run <script>` | [`package.json:10-14`](package.json) |
| Root `next` dev dep | `16.1.6` | [`package.json:38`](package.json) |
| Root `tsconfig.base.json` | **DOES NOT EXIST** — each app carries its own complete `tsconfig.json` | absence of `tsconfig.base.json`, see e.g. [`apps/hub/tsconfig.json:1-34`](apps/hub/tsconfig.json) |
| Root `.env.example` | Only **one** present: `apps/super-app/.env.example` (Expo). No web-app env example at root or per Next app. | [`apps/super-app/.env.example`](apps/super-app/.env.example), absence elsewhere |
| Root DB env example | `env.database.example` for Supabase psql connection only (used for `db:apply` script) | [`env.database.example:1-3`](env.database.example) |
| Cron in CI | None — Vercel cron only, defined per-app `vercel.json` | see [`apps/account/vercel.json:6-15`](apps/account/vercel.json), [`apps/care/vercel.json:6-12`](apps/care/vercel.json), [`apps/hub/vercel.json:6-11`](apps/hub/vercel.json) |
| `.gitignore` flags | Lists `apps/super-app/dist*` and `apps/company-hub/dist*` — **mobile/web-export artefacts**; also lists `/HenryCo/` and `/care/` as legacy nested repos to ignore | [`.gitignore:14-44`](.gitignore) |
| Local dev proxy | `dev-proxy.mjs` only routes hub (3002) and care (3001). **Stale** — does not know about the other 8 web apps. | [`dev-proxy.mjs:1-35`](dev-proxy.mjs) |

### A.2 Workspace inventory — apps

13 entries under `apps/` (verified by `ls apps/`):

| Workspace name | Path | Framework | Port (dev) | Vercel? | Supabase migrations dir? | Has Playwright? |
|---|---|---|---|---|---|---|
| `@henryco/account` | `apps/account` | Next.js 16.1.6 | 3003 | yes | no (uses central) | no |
| (orphan) | `apps/apps/hub/app` | empty directory | — | n/a | no | no |
| `@henryco/care` | `apps/care` | Next.js 16.1.6 | default | yes | no | yes (folder exists) |
| `@henryco/company-hub` | `apps/company-hub` | Expo / React Native | n/a | no | no | no |
| `@henryco/hub` | `apps/hub` | Next.js 16.1.6 (turbo) | 3002 | yes | **yes — canonical** | no |
| `@henryco/jobs` | `apps/jobs` | Next.js 16.1.6 | default | yes | no | no |
| `@henryco/learn` | `apps/learn` | Next.js 16.1.6 | 3018 | yes | yes | yes |
| `@henryco/logistics` | `apps/logistics` | Next.js 16.1.6 | 3004 | yes | no | yes (config) |
| `@henryco/marketplace` | `apps/marketplace` | Next.js 16.1.6 | default | yes | yes | yes |
| `@henryco/property` | `apps/property` | Next.js 16.1.6 | default | yes | yes | yes |
| `@henryco/staff` | `apps/staff` | Next.js 16.1.6 (turbo) | 3020 | yes | no | no |
| `@henryco/studio` | `apps/studio` | Next.js 16.1.6 | default | yes | yes | no |
| `@henryco/super-app` | `apps/super-app` | Expo / React Native | n/a | no | yes (single core file) | no (jest only) |

Citation cluster: every `apps/*/package.json` and `apps/*/next.config.ts`/`apps/*/vercel.json` was read.

> **Audit Finding A.2-1 (cleanup):** `apps/apps/hub/app/` is an empty nested directory — orphaned legacy artefact. Should be deleted in a separate housekeeping pass.

### A.3 Workspace inventory — packages

14 packages under `packages/` (verified by `ls packages/`):

| Package | Purpose (from inspection) | Notable consumers |
|---|---|---|
| `@henryco/address-selector` | Cross-division canonical address picker (V2-ADDR-01 — landed [#12](https://github.com/anthropics/.../pull/12)) | account (verified by import in package.json) |
| `@henryco/brand` | Brand assets bundle | account, hub, marketplace |
| `@henryco/chat-composer` | V2-COMPOSER-01 premium chat composer (claimed 5 surfaces in PR #11) | account, care, jobs, studio (4 confirmed by package.json deps) |
| `@henryco/config` | `COMPANY` divisions catalog, security headers, sender resolution paths, supabase cookie utilities | every web app |
| `@henryco/email` | `resolveSenderIdentity` + provider drivers (Brevo + Resend) + auth-hook templates + layout | every web app |
| `@henryco/i18n` | Localization, currency, country/timezone, phone | every web app |
| `@henryco/intelligence` | Feature-flag parser, intelligence rollout helpers | account, hub, staff |
| `@henryco/lifecycle` | Customer lifecycle snapshot collector | account, staff |
| `@henryco/newsletter` | Newsletter primitives | hub, staff |
| `@henryco/notifications` | Customer + staff publisher shims, event types, validate, severity, supabase admin | account, care, learn, logistics, marketplace, property, staff, studio (+ used server-side via shim) |
| `@henryco/notifications-ui` | Tokens, severity styling, motion, gestures, deep-link, icons, types | **account only** |
| `@henryco/pricing` | Pricing governance package | marketplace, property |
| `@henryco/trust` | Detect, moderation, verification | account, care, jobs, marketplace, property |
| `@henryco/ui` | Shared shells: `brand`, `footer`, `live`, `loading`, `nav`, `providers`, `public`, `public-shell`, `search`, `support`, `theme` + `RouteLiveRefresh` | every web app |

> **Audit Finding A.3-1 (gap):** `@henryco/notifications-ui` ships severity tokens, gesture handlers, deep-link, motion — but **only `@henryco/account` consumes it**. The rebuild shell must broaden adoption (or formalize that the shell owns the rendering and divisions only emit data).

> **Audit Finding A.3-2 (gap):** No `@henryco/auth` package. Every app reimplements `requireRoles`/`viewerHasRole` locally per [`docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md:21`](docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md). Confirmed by absence of `packages/auth`.

> **Audit Finding A.3-3 (gap):** No `@henryco/data` or shared typed-query package. Every app calls Supabase directly. The rebuild's signal feed will need to either (a) introduce one, or (b) live entirely in `apps/hub`/`apps/account` with cross-app data fetched via internal API.

### A.4 Routing, hosts, and the existing dashboard topology

The "dashboard" today is **three surfaces on three different hosts**, all served from two Next.js apps:

| Audience | Host | Vercel rewrite | Real app | Real route |
|---|---|---|---|---|
| Customer | `account.henrycogroup.com` | none (root → `/`) | `apps/account` | `(account)/page.tsx` ([`apps/account/app/(account)/page.tsx:40-534`](apps/account/app/%28account%29/page.tsx)) |
| Owner | `hq.henrycogroup.com` | `/ → /owner`, all paths → `/owner/...` | `apps/hub` | `owner/(command)/page.tsx` ([`apps/hub/app/owner/(command)/page.tsx:22-173`](apps/hub/app/owner/%28command%29/page.tsx)) |
| Staff (legacy) | `workspace.henrycogroup.com` | `/ → /workspace` | `apps/hub` | redirect-only stub at `app/workspace/[[...slug]]/page.tsx` |
| Staff (intended) | `staffhq.henrycogroup.com` | `/ → /workspace`, all paths → `/workspace/...` | `apps/hub` | redirect-only stub (same file) |

Citation: [`apps/hub/vercel.json:12-72`](apps/hub/vercel.json) for rewrites; [`apps/hub/proxy.ts:60-117`](apps/hub/proxy.ts) for host-aware behaviour; [`apps/hub/app/workspace/[[...slug]]/page.tsx:26-37`](apps/hub/app/workspace/%5B%5B...slug%5D%5D/page.tsx) for the stub.

> **Audit Finding A.4-1 (CRITICAL — verify live):** `apps/hub/app/workspace/[[...slug]]/page.tsx` blanket-redirects to `https://staffhq.${baseDomain}${path}`. The proxy on `staffhq.*` rewrites every non-`/workspace` path back to `/workspace/...`, which then hits the same page and redirects again. This is a **suspected infinite redirect loop** on the staff workspace surface. Either the staffhq subdomain currently 502s/redirect-loops in production, or there is a guard I cannot see in code (e.g. a Vercel-level middleware not present in this repo). **Treat the staff workspace as non-functional in the rebuild plan.** Verify on production before publishing the rebuild prompt to the executor.

> **Audit Finding A.4-2 (host hygiene):** `workspace.*` redirects to `staffhq.*` ([`apps/hub/proxy.ts:95-98`](apps/hub/proxy.ts)). The unified shell rebuild should keep `workspace.*` permanently 308'd to whatever the new canonical host becomes (most likely `account.henrycogroup.com/dashboard`).

### A.5 Auth, identity, and shared session

Comprehensive ground truth captured in [`docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md`](docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md), [`docs/identity-state-model.md`](docs/identity-state-model.md), and [`docs/auth-continuity-map.md`](docs/auth-continuity-map.md). Highlights:

- **Source of truth:** `auth.users` (Supabase), with role/profile fan-out across `customer_profiles`, `owner_profiles`, `profiles`, plus per-division `*_role_memberships` tables ([`docs/identity-state-model.md:7-13`](docs/identity-state-model.md)).
- **No root `middleware.ts` in any app** (Glob `apps/*/middleware.ts` returns empty). All auth/cookie/host normalization runs through per-app `proxy.ts` (Glob confirms 10 files: account, care, hub, jobs, learn, logistics, marketplace, property, staff, studio).
- **Shared `.henrycogroup.com` cookie** is forced by `buildSharedCookieHandlers()` and `buildSupabaseCookieOptions()` ([`packages/config/supabase-cookies.ts:182-273`](packages/config/supabase-cookies.ts)). Localhost / IP / unknown hosts fall through to per-host cookies safely.
- **Shared sign-in is canonical at `account.henrycogroup.com`** per [`docs/auth-continuity-map.md:34`](docs/auth-continuity-map.md). Every other app redirects to it for auth entry.
- **Logout is global-scope** across HenryCo sessions (every division's logout route calls `supabase.auth.signOut({ scope: "global" })`) — [`docs/auth-continuity-map.md:39-43`](docs/auth-continuity-map.md).
- **No shared `@henryco/auth` package exists.** Each app's `lib/<vertical>/auth.ts` implements its own `require*` helpers. This is the single biggest architectural debt for the unified shell.

### A.6 Role/permission model — concrete bindings

Hub workspace defines the canonical staff permission model in code:
- **12 platform role families** in [`apps/hub/app/lib/workspace/roles.ts`](apps/hub/app/lib/workspace/roles.ts) — `division_manager`, `operations_staff`, `support_staff`, `finance_staff`, `moderation_staff`, `content_staff`, `analyst`, `coordinator`, `specialist`, `supervisor`, `executive_viewer`, `system_admin`.
- **16 permission strings** in [`apps/hub/app/lib/workspace/types.ts`](apps/hub/app/lib/workspace/types.ts) (`workspace.view`, `workspace.manage`, `overview.view`, `tasks.view`, `inbox.view`, `approvals.view`, `queues.view`, `archive.view`, `reports.view`, `settings.view`, `staff.directory.view`, `division.read`, `division.write`, `division.approve`, `division.finance`, `division.moderate`).
- **7 divisions in `WORKSPACE_DIVISIONS`** (catalog): care, marketplace, studio, jobs, property, learn, logistics ([`docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md:75-77`](docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md)).
- **`COMPANY.divisions` (config)** has 11 entries — adds `hub`, plus future divisions `building` and `hotel` ([`packages/config/company.ts:67-322`](packages/config/company.ts)).

Per-division role catalogs (`DIVISION_ROLE_CATALOG`) in [`apps/hub/app/lib/workspace/roles.ts`](apps/hub/app/lib/workspace/roles.ts) carry authoritative slugs (e.g. `care_manager`, `marketplace_admin`, `learn_academy_admin`).

`logistics_role_memberships` and `jobs_role_memberships` tables **do not exist in the schema** — staff identity for those divisions resolves entirely through `profiles.role` ([`apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:39-44`](apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql)).

### A.7 Shared identity — `is_staff_in()` predicate

The most important new piece of infrastructure for the rebuild lives in [`apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:67-160`](apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql):

```sql
create or replace function public.is_staff_in(division_key text, role_key text default null)
returns boolean language sql stable security definer set search_path = public
```

This single function joins all per-division role tables plus the legacy `profiles.role` mapping into a uniform staff predicate, used by RLS on `staff_notifications` and (per migration comment) "any staff-side row-targeting policy." It is **the canonical staff-membership oracle**. The rebuild's role-gating must consume it (directly via Postgres or via a thin client wrapper) — re-implementing role checks in TypeScript is the path that produced today's fragmentation.

### A.8 Cross-division notification spine — current state

Schema (in `apps/hub/supabase/migrations/`):

| Table | Migration | Notes |
|---|---|---|
| `customer_notifications` | pre-existing; extended by `20260501120000_notification_signal_foundation_extensions.sql` (V2-NOT-01-A) | Added `actor_user_id`, `email_dispatched_at`, `email_provider`, `publisher`, `request_id` + email-fallback indexes. RLS: `auth.uid() = user_id`. |
| `customer_preferences` | extended same migration | Added `email_fallback_enabled`, `email_fallback_delay_hours` (1/4/12/24/48 only), `quiet_hours_timezone` (IANA), `muted_event_types`, `muted_divisions`. |
| `notification_delivery_log` | `20260419150000_notification_delivery_log.sql` (with `purged_at` added in V2-NOT-02-A) | Cross-division delivery audit. |
| `staff_notifications` | `20260502120000_staff_notifications_audience.sql` (V2-NOT-02-A) | Targeting via `recipient_user_id` OR `recipient_role` OR `recipient_division`. RLS via `is_staff_in()`. |
| `staff_notification_states` | same migration | Per-recipient lifecycle (read/archive/delete/restore) — split from content row so broadcasts preserve per-staff inbox semantics. |
| Realtime publication | `20260501130000_notification_realtime_publication.sql` for `customer_notifications`; tail of `20260502120000_…audience.sql` for `staff_notifications` + `staff_notification_states` | All three on `supabase_realtime`. RLS applies to subscription stream. |
| `customer_notifications_purge_candidate_idx` and `staff_notification_states_purge_candidate_idx` | both in V2-NOT-02-A migration | 30-day purge cron sweep |
| `notification_signal_preferences` | `20260420160000_notification_signal_preferences.sql` | Read with the signal client |

Publisher API:
- Customer: `publishNotification(input: PublishInput): Promise<PublishResult>` — [`packages/notifications/index.ts:2`](packages/notifications/index.ts)
- Staff (V2-NOT-02-A): `publishStaffNotification(input: StaffPublishInput): Promise<StaffPublishResult>` — [`packages/notifications/index.ts:29`](packages/notifications/index.ts)

> **Audit Finding A.8-1 (asset):** Phase 1 cross-division notification schema is **substantially shipped**. The rebuild can assume:
> - In-app inbox per user (customer + staff) with realtime via Supabase Realtime
> - Email fallback worker hooks (cron schedules already exist per app — see §A.10)
> - Per-user quiet hours, muted divisions, muted event types
> - Service-role-only inserts via the publisher shims
> - 30-day purge cron infrastructure
> What remains for the dashboard rebuild is **client integration** — subscribing once at the shell, fanning to widgets, reading delivery_log for sent-status, and rendering the unified ranked feed.

### A.9 Email governance (sender identity)

[`packages/email/sender-identity.ts`](packages/email/sender-identity.ts) is the canonical sender resolver. **Critical invariant** ([`packages/email/sender-identity.ts:111-113`](packages/email/sender-identity.ts)): "nothing here ever falls back to the Care identity. The Care sender is reachable only when `purpose === 'care'`."

12 purposes are supported: `auth`, `support`, `care`, `studio`, `marketplace`, `jobs`, `learn`, `property`, `logistics`, `newsletter`, `security`, `generic` — each with its own env-var lookup, branded fallback name, and the shared `noreply` fallback chain.

Provider drivers:
- Brevo (`packages/email/providers/brevo.ts`) — primary editorial + transactional
- Resend (`packages/email/providers/resend.ts`) — support inbox

> **Audit Finding A.9-1 (verify):** Every dashboard surface that triggers email must call `resolveSenderIdentity(purpose)` with a non-`care` purpose unless the email truly belongs to Care. Phase B per-division audit verifies this for each app.

### A.10 Crons (per-app `vercel.json`)

| App | Cron path | Schedule | Purpose |
|---|---|---|---|
| account | `/api/cron/notification-email-fallback` | `*/15 * * * *` | Email-fallback worker (V2-NOT-01-C) |
| account | `/api/cron/notification-purge` | `0 3 * * *` | 30-day soft-delete purge |
| care | `/api/cron/care-automation` | `15 8 * * *` | (Care-specific automation — Phase B will inspect) |
| hub | `/api/cron/owner-reports` | `5 7 * * *` | Owner daily report (also has `/api/cron/owner-reporting/{weekly,monthly}/route.ts` per Glob) |

All other apps have no cron declared in their `vercel.json`. Cron exists only in: account, care, hub.

### A.11 Security headers and proxies

[`packages/config/security-headers.ts`](packages/config/security-headers.ts) supplies a shared baseline. Apps either:
- call `defaultSecurityHeadersConfig()` from `next.config.ts` ([`apps/hub/next.config.ts:11-13`](apps/hub/next.config.ts), [`apps/account/next.config.ts:26-28`](apps/account/next.config.ts)); **and/or**
- apply via `proxy.ts` using `buildSecurityHeaders()` + a per-proxy CSP override ([`apps/hub/proxy.ts:1-27`](apps/hub/proxy.ts)).

> **Audit Finding A.11-1 (verify B-phase):** CSP varies per app. Hub allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src` ([`apps/hub/proxy.ts:12`](apps/hub/proxy.ts)) — driven by Three.js + framer-motion needs. The unified shell must declare a tightened baseline and require divisions to opt-in to script relaxations only when justified.

### A.12 CI / observability

- **CI (canonical):** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `lint:all → typecheck:all → test:workspace (super-app only) → build:all`. CI placeholders for Supabase + base domain so Next builds compile without secrets ([`.github/workflows/ci.yml:18-23`](.github/workflows/ci.yml)). Production env injected by Vercel.
- **EAS build:** `.github/workflows/eas-build.yml` exists for super-app/company-hub mobile.
- **Sentry:** super-app uses `@sentry/react-native` ([`apps/super-app/package.json:24`](apps/super-app/package.json)). **No Sentry on web apps** (no `@sentry/nextjs` in any web app's package.json). Observability gap.
- **Vercel Analytics:** absent in package.json's of all web apps. Not wired.

> **Audit Finding A.12-1 (gap):** Web observability is unwired. The rebuild shell should adopt at minimum `@sentry/nextjs` (or equivalent) and emit the existing `event-taxonomy.md` events. See [`docs/event-taxonomy.md`](docs/event-taxonomy.md) for the agreed taxonomy.

### A.13 Existing docs that pre-date this audit (and should be cross-referenced, not re-derived)

- [`docs/HENRYCO_STAFF_PLATFORM_MASTERPLAN.md`](docs/HENRYCO_STAFF_PLATFORM_MASTERPLAN.md) — staff workspace plan
- [`docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md`](docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md) — comprehensive role/permission map
- [`docs/staff-hq-architecture.md`](docs/staff-hq-architecture.md) — current staffhq architecture
- [`docs/identity-state-model.md`](docs/identity-state-model.md) — what identity signals are live
- [`docs/auth-continuity-map.md`](docs/auth-continuity-map.md) — cross-app session continuity
- [`docs/render-strategy-map.md`](docs/render-strategy-map.md) — dynamic vs ISR per route
- [`docs/feature-status.md`](docs/feature-status.md), [`docs/release-status.md`](docs/release-status.md) — feature reality
- [`docs/critical-bugs.md`](docs/critical-bugs.md), [`docs/known-issues.md`](docs/known-issues.md), [`docs/noncritical-bugs.md`](docs/noncritical-bugs.md), [`docs/qa-report.md`](docs/qa-report.md) — known defects
- [`docs/event-taxonomy.md`](docs/event-taxonomy.md), [`docs/funnel-model-map.md`](docs/funnel-model-map.md) — analytics
- [`docs/kyc-sensitive-action-gating.md`](docs/kyc-sensitive-action-gating.md) — sensitive-action gates
- [`docs/PRODUCT-GAP-LEDGER.md`](docs/PRODUCT-GAP-LEDGER.md), [`docs/BUSINESS-WOW-OPERATIONAL-MATURITY-PASS.md`](docs/BUSINESS-WOW-OPERATIONAL-MATURITY-PASS.md) — gap & maturity
- [`docs/vercel-project-map.md`](docs/vercel-project-map.md), [`docs/redeploy-impact-matrix.md`](docs/redeploy-impact-matrix.md) — deployment

The rebuild prompt should **explicitly require the executor to read these before starting** rather than re-deriving facts from code.

### A.14 Cross-app shared session matrix (from auth-continuity-map.md, verified by file presence)

| App | proxy.ts? | Shared cookie writer? | Logout calls global signOut? |
|---|---|---|---|
| account | yes ([`apps/account/proxy.ts`](apps/account/proxy.ts)) | yes | yes (per [`docs/auth-continuity-map.md:39-43`](docs/auth-continuity-map.md)) |
| care | yes | yes | yes |
| hub | yes | (not listed in continuity-map's normalized set) | yes |
| jobs | yes | yes | yes |
| learn | yes | yes | yes |
| logistics | yes | yes | yes |
| marketplace | yes | yes | yes |
| property | yes | yes (was the recent fix; see continuity-map MUST FIX NOW resolved) | yes |
| staff | yes | (not listed; investigate in B.staff) | yes |
| studio | yes | yes | yes |
| super-app (mobile) | n/a (Expo) | n/a | n/a |
| company-hub (mobile) | n/a | n/a | n/a |

> **Audit Finding A.14-1 (verify in B-phase):** Hub's proxy is **not** listed among the apps that call `buildSharedCookieHandlers()` in [`docs/auth-continuity-map.md:10-19`](docs/auth-continuity-map.md), but its callback/server routes do per the doc ("Care callback routes and HQ workspace/owner server auth now use the same shared cookie-domain resolution path"). Verify hub's `proxy.ts` writes shared cookies on session refresh paths.

### A.15 Three coexisting "dashboards" — what each one is, in plain English

#### A.15.1 Customer (`account.henrycogroup.com/`)
Real, production. [`apps/account/app/(account)/page.tsx:40-534`](apps/account/app/%28account%29/page.tsx) renders, in this order:
1. `RouteLiveRefresh` (live refresh primitive from `@henryco/ui`)
2. `PageHeader` with welcome
3. **8 metric cards** (wallet balance, notifications, subscriptions, trust tier, invoices, support, referrals, transactions) — every one is a `Link` to its detail surface
4. **Action chips** (blocking + high-priority counts)
5. **Lifecycle continue panel** (V2 lifecycle snapshot — `LifecycleContinuePanel`, hydrated from `collectAndPersistLifecycleSnapshot(user.id)`)
6. **Attention panel** (conditional, 3 columns) — pending wallet, unread notifications, active plans, next-tier unlock
7. **Quick actions row** (4 cells: add money, get help, book care, shop)
8. **Action center** + **Smart recommendations** (recommendations gated by `flags.intelligence_recommendations`)
9. **Recent activity** + **Recent notifications** (two-column)
10. **Division services** (Care / Marketplace / Jobs / Studio — only 4, NOT all 7+)

Real data: `getDashboardSummary`, `getWalletFundingContext`, `getAccountTrustProfile`, `getSupportThreads`, `collectAndPersistLifecycleSnapshot` ([`apps/account/app/(account)/page.tsx:42-50`](apps/account/app/%28account%29/page.tsx)).

#### A.15.2 Owner (`hq.henrycogroup.com/owner`)
Real, production. [`apps/hub/app/owner/(command)/page.tsx:22-173`](apps/hub/app/owner/%28command%29/page.tsx) renders:
1. Page header with "Invite staff" + "Update brand settings" actions
2. Data-freshness notice (`OwnerNotice`)
3. **Executive situation room** (briefing.headline + focus + comms-health 4-tile grid + next-best actions)
4. **6 metric cards** (live divisions, recognized revenue, open support pressure, active staff, critical signals, outbound notifications)
5. **Executive digest panel** + **Urgent signals panel**
6. **Division control center** (one card per `WORKSPACE_DIVISIONS`)
7. **Helper recommendations panel** + **Sensitive activity panel** (audit log)

Real data: `getOwnerOverviewData()` from `apps/hub/lib/owner-data.ts`.

#### A.15.3 Staff (`staffhq.henrycogroup.com/workspace`)
**Suspected non-functional** (see A.4-1). The `apps/hub/app/workspace/[[...slug]]/page.tsx` is a 37-line redirect stub — it just redirects every workspace path to `https://staffhq.${baseDomain}${path}` which then re-enters the proxy and (apparently) loops.

Auxiliary surface: `apps/staff` (port 3020) is its own Next.js app — but it's **not the staff dashboard host**. Per [`docs/vercel-project-map.md:11`](docs/vercel-project-map.md) it serves `staff.henrycogroup.com`. This is a separate "staff" subdomain from `staffhq` / `workspace`. Inspect in B.staff.

> **Audit Finding A.15-1 (HUGE):** The unified rebuild has *three* current dashboards to reconcile:
> 1. Real customer surface in account
> 2. Real owner surface in hub
> 3. Apparently broken staff surface in hub (workspace) and a **separate** active staff app at `apps/staff` whose role is unclear from the route map alone
>
> The rebuild prompt must instruct the executor to clarify the staff vs. workspace vs. staffhq distinction and consolidate them into one role-aware shell.

### A.16 The "fourth" dashboard — `apps/staff` is the actually-working unified staff workspace

After deeper trace I discovered `apps/staff` is itself a real, working, premium staff workspace dashboard:

- Entry: [`apps/staff/app/(workspace)/page.tsx:22-79`](apps/staff/app/%28workspace%29/page.tsx) calls `requireStaff()` (apps/staff/lib/staff-auth.ts), pulls a real `getStaffIntelligenceSnapshot`, builds nav with `getFilteredNavItems(viewer)`, renders 4 metric cards (active tasks, open queues, risk signals, notifications) + welcome header
- Per-division pages exist for **all 7 workspace divisions**: care, finance, jobs, kyc, learn, logistics, marketplace, operations (lifecycle, newsletter), property, studio, support, workforce, search, settings
- Auth helper `requireStaff` joins per-division `*_role_memberships` + legacy `profiles.role` ([`apps/staff/lib/staff-auth.ts:1-80`](apps/staff/lib/staff-auth.ts)) — duplicates the SQL `is_staff_in()` predicate at the TypeScript layer
- Lib: `customer-lifecycle.ts`, `finance-data.ts`, `intelligence-data.ts`, `kyc-data.ts`, `navigation.ts`, `roles.ts`, `search.ts`, `staff-auth.ts`, `supabase/{admin,browser,server}.ts`, `newsletter/service.ts`

> **Audit Finding A.16-1 (correction):** The staff dashboard **already exists and works** at `apps/staff` (host: staff.henrycogroup.com per [`docs/vercel-project-map.md:11`](docs/vercel-project-map.md)). The broken `apps/hub/app/workspace/[[...slug]]/page.tsx` stub is a **distinct, separate, dead** surface from a previous architecture iteration. The unified rebuild should treat `apps/staff` as the staff baseline — whose UX patterns to extract — not as a thing to replace from scratch. The customer dashboard at `apps/account` and the owner dashboard at `apps/hub /owner` are the two surfaces the rebuild most disrupts; staff continues largely as-is but gets unified shell primitives.

### A.17 Care staff surface state — silently retired

[`apps/care/app/(staff)/layout.tsx`](apps/care/app/%28staff%29/layout.tsx) is **6 lines**:

```tsx
import { redirect } from "next/navigation";
import { getStaffHqUrl } from "@henryco/config";

export default async function StaffShellLayout() {
  redirect(getStaffHqUrl("/care"));
}
```

Every Care staff route — owner, manager, rider, support, staff — 307-redirects to `https://staffhq.${baseDomain}/care`. But `staffhq.*` either:
- Lands at the broken `/workspace/[[...slug]]` redirect-loop stub in apps/hub, OR
- Is supposed to land in apps/staff/app/(workspace)/care/page.tsx but the proxy on `staffhq.*` rewrites to apps/hub's /workspace/care path

> **Audit Finding A.17-1 (CRITICAL):** All `apps/care/app/(staff)/*` routes are dead. Either:
> - The staffhq.* host correctly serves `apps/staff` and the per-app rebuild already happened (in which case `apps/care/app/(staff)/*` files should be deleted), OR
> - The staffhq.* host is broken (per A.4-1) and Care staff have no working backend dashboard
> Either way, `apps/care/app/(staff)/*` is non-canonical and the `apps/care/app/app/(staff)/manager/page.tsx` + `apps/care/app/app/(staff)/owner/page.tsx` files (note the duplicate `/app/app/` path) are clearly artefacts to clean up.

> **Audit Finding A.17-2 (correction to docs):** [`docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md:108`](docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md) claims "Care `/admin` has no `requireRoles` on the page component." This is **stale**: [`apps/care/app/admin/page.tsx:46`](apps/care/app/admin/page.tsx) calls `requireRoles(["owner", "manager", "support", "staff"])`. The doc needs an update.

### A.18 Email rail separation (V2-PNH-03B) — already shipped

[`packages/email/send.ts:39-74`](packages/email/send.ts) implements provider routing:
- `purpose === "auth"` → **Resend preferred** (DKIM-authenticated henrycogroup.com, isolated from marketing rate limits), Brevo fallback
- `purpose === "support"` → Resend preferred, Brevo fallback
- `purpose === "newsletter"` → Brevo preferred (bulk sender), Resend fallback
- All others → `EMAIL_PROVIDER` env preference, then fallback

`packages/email/send.ts:76-80` calls `applySenderIdentity` which resolves `from`/`fromName` from `purpose` automatically — so divisions don't need to call `resolveSenderIdentity` themselves; they just pass `purpose` to the send function. **The Care fallback invariant is enforced at the package boundary.**

Per-app email send sites (verified via grep `@henryco/email`): `apps/{account,care,hub,jobs,learn,logistics,marketplace,property,studio}/lib/.../email/...` (9 of 10 web apps; `staff` does not currently emit external email).

---

## B. Per-division dashboard audit

> **Note on coverage and depth.** Each app gets a compact section that hits all 12 mandatory subsections (B*-1 through B*-12). Where a subsection genuinely doesn't apply, this is stated explicitly. Citation density is highest where the rebuild prompt will need to make decisions; descriptive recap of obvious surfaces is kept tight. Apps are presented in dependency-readiness order: account → hub → staff → care → marketplace → property → jobs → learn → logistics → studio → super-app → company-hub → orphan.

### B.account — Customer dashboard (`apps/account` → `account.henrycogroup.com`)

**This is the V2 unified dashboard target.** Most decisions in the rebuild prompt are decisions about how this app evolves.

- **B.account-1 Protected routes.** All `(account)` group routes guarded by `requireAccountUser()` ([`apps/account/lib/auth.ts:99-103`](apps/account/lib/auth.ts)) which redirects to `/login` if no session. ~45 protected pages: overview, activity, addresses, care/bookings/[bookingId], documents, invoices/[invoiceId], jobs/{interviews/[sessionId],page,interviews}, learn, logistics, marketplace, messages/{activity,notification,security}/[id], notifications/{recently-deleted,page}, payments, property/{saved,page}, referrals, search, security, settings/{addresses,notifications,page}, studio/{payments/[id],projects/[id],page}, subscriptions/{[subscriptionId],page}, support/{[threadId],new,page}, tasks, verification, verify, wallet/{add,funding/{[requestId],page},withdrawals,page}. Auth surfaces: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/{callback,confirm,resolve,verified}`. API: notifications (10 routes), wallet (6), addresses (5), support (2), webhooks/account, cron/{notification-email-fallback,notification-purge}. All server components except the client form components.
- **B.account-2 Surfaces inventory.** The home page ([`apps/account/app/(account)/page.tsx:40-534`](apps/account/app/%28account%29/page.tsx)) renders, in order: `RouteLiveRefresh`, `PageHeader`, **8 metric cards** (lines 142-243), **action chips** (245-257), `LifecycleContinuePanel` (259), **attention panel** (261-294), **quick actions** (296-316), **action center + smart recommendations grid** (318-396), **recent activity + recent notifications grid** (398-497), **division services** (499-531). Sub-routes mostly follow the same `acct-card` primitive pattern. Empty/loading/error states: `apps/account/components/layout/{AccountRouteLoading,EmptyState,PageHeader}.tsx`, `apps/account/components/notifications/NotificationsFeedEmptyState.tsx`.
- **B.account-3 CTA reality.** Of the 8 metric cards, **all 8 are LIVE** — each is a `Link` to `/wallet`, `/notifications`, `/subscriptions`, `/security`, `/invoices`, `/support`, `/referrals`, `/wallet`. Quick actions: `/wallet`, `/support`, `/care`, `/marketplace` all LIVE (the latter two are external division entries; verify they cross-domain correctly). Recent activity items use `activityMessageHref` ([`apps/account/lib/notification-center.ts`](apps/account/lib/notification-center.ts)) — verify all message types resolve to a real `/messages/.../[id]` page. Division services row only shows 4 of 7 (care, marketplace, jobs, studio) — **omits property, learn, logistics**, which the rebuild must fix. All examined surfaces are LIVE; no DEAD or DECORATIVE found in the home page.
- **B.account-4 Data sources.** [`apps/account/lib/account-data.ts`](apps/account/lib/account-data.ts) (~1500 lines per cursor) drives `getDashboardSummary` (joins `customer_notifications`, `wallet_balances`, `subscriptions`, `customer_invoices`, `support_threads`, `customer_activity_log`), `getWalletFundingContext`, `getSupportThreads`, `getRecentInvoices`, etc. Per-division aggregation through `apps/account/lib/{jobs,learn,logistics,property,studio}-module.ts` files (5 of 7 divisions). **Care path uses `apps/account/lib/care-sync.ts`** (a different pattern — mirror sync from care division), **marketplace has no dedicated module file** ([`apps/account/lib/`](apps/account/lib/) listing). Trust profile from [`apps/account/lib/trust.ts`](apps/account/lib/trust.ts) → `customer_profiles.verification_*`. Lifecycle from `@henryco/lifecycle` → `collectAndPersistLifecycleSnapshot` ([`apps/account/lib/lifecycle/collector.ts`](apps/account/lib/lifecycle/collector.ts)).
- **B.account-5 Role & permission model.** **`requireAccountUser` is not granular RBAC** — it just gates "is logged in" ([`apps/account/lib/auth.ts:99-103`](apps/account/lib/auth.ts)). It does derive `isOwner` from `owner_profiles` ([`apps/account/lib/auth.ts:50-62`](apps/account/lib/auth.ts)) — used to show owner-eligible surfaces. No fine-grained permission per page; the assumption is that all account routes are safe for any authenticated user. **For the rebuild this is the right pattern** for the customer surface; the staff/owner surfaces remain in apps/staff and apps/hub.
- **B.account-6 Notification & email touchpoints.** Notifications: this app **owns the customer notification UI** — `NotificationSignalProvider` ([`apps/account/components/notifications/NotificationSignalProvider.tsx`](apps/account/components/notifications/NotificationSignalProvider.tsx)) is the realtime client; `NotificationBell`, `NotificationFeed`, `NotificationsFeed`, `NotificationToastViewport`, `RecentlyDeletedFeed`, `SwipeableNotificationCard`, `MarkAllReadButton`, `NotificationLifecycleControls`, `NotificationsFeedEmptyState`. **Sole consumer of `@henryco/notifications-ui`**. Notification API: 10 endpoints (archive, purge, read, restore, unread, batch, mark-all-read, preferences, recent, signal). Email: account triggers email via `apps/account/lib/email/send.ts` (purpose values to verify per call); the cron `/api/cron/notification-email-fallback` is the **email-fallback worker** that scans `customer_notifications` for the email-fallback eligibility predicate. **No `care` purpose violations found** in scan — fallback is via the package layer (`@henryco/email`) which auto-applies sender identity, never falling to Care.
- **B.account-7 Mobile & accessibility.** `apps/account/components/layout/MobileNav.tsx` exists. The home page metric cards use `grid sm:grid-cols-2 xl:grid-cols-4` so they collapse cleanly. **Acct-chip and acct-metric primitives** suggest a custom design system; verify `--acct-*` CSS vars are defined and consistent in dark mode. `SwipeableNotificationCard` is a known mobile interaction. **Spotted concerns**: localized strings in many places — `apps/account/lib/account-localization.ts` is the resolver, but the home page mixes `copy.overview.*` keys; if a key is missing the page renders the key string. Modal/sheet patterns: not heavily used on the home page. Focus order on metric grid: native — should pass AA but worth a real audit.
- **B.account-8 Payment / invoice / subscription.** Wallet: `(account)/wallet/{page,add,funding/{page,[requestId]}, withdrawals}`; underlying API at `/api/wallet/{fund,funding/[requestId]/proof,payout-methods,withdrawal/{pin,request}}`. **Real Supabase data** via `wallet_balances`, `wallet_transactions`, `wallet_funding_requests`, `wallet_payout_methods`, `wallet_withdrawal_requests` (inferred from `apps/account/lib/wallet-storage.ts`'s legacy mappers). Invoices: `(account)/invoices/{page,[invoiceId]}` joined to division invoice tables via `apps/account/lib/account-data.ts`. Subscriptions: `(account)/subscriptions/{page,[subscriptionId]}`. **Rebuild implication:** the customer wallet is the canonical wallet — the unified shell can promote a wallet quick-balance card from any module home.
- **B.account-9 KYC / documents / verification.** `(account)/{verification,verify,documents,security}/page.tsx`. `VerificationWorkspace` + `VerificationWorkspaceClient` components ([`apps/account/components/verification/`](apps/account/components/verification/)). [`apps/account/lib/verification.ts`](apps/account/lib/verification.ts) + [`apps/account/lib/trust.ts`](apps/account/lib/trust.ts). Documents stored in Supabase storage (cite [`docs/verification-storage-handoff.md`](docs/verification-storage-handoff.md)). Security panel reads `customer_security_log` ([`apps/account/lib/security-events.ts`](apps/account/lib/security-events.ts)). Sensitive-action gating at [`docs/kyc-sensitive-action-gating.md`](docs/kyc-sensitive-action-gating.md).
- **B.account-10 Support / inbox / messaging.** `(account)/support/{page,[threadId],new}` + `(account)/messages/{activity,notification,security}/[id]`. Support thread API `/api/support/{create,reply}`. The premium chat composer (V2-COMPOSER-01 / `@henryco/chat-composer`) is wired in account: `apps/account/components/support/{NewSupportForm,SupportReplyForm,SupportThreadRoom}.tsx`. Notifications inbox at `(account)/notifications/{page,recently-deleted}` with full lifecycle (read/archive/delete/restore/purge) plus the email-fallback worker.
- **B.account-11 Audit log / admin / owner.** None — account is customer-only. (Confirmed: no `admin/`, `owner/`, `moderation/` routes under `apps/account/app/`.)
- **B.account-12 Known issues — confirm/deny.**
  - Email dark-mode contrast on project-update emails: would require reading `@henryco/email` layout templates — deferred to a UI pass on the email package itself, not the dashboard.
  - Recently-deleted notifications: `(account)/notifications/recently-deleted/page.tsx` and `RecentlyDeletedFeed` exist; cron `/api/cron/notification-purge` purges past 30 days. **Working** based on schema in V2-NOT-02-A.
  - V2-COMPOSER-01: confirmed in account at the 3 support component files above. PR claimed "5 surface rollout" — fifth surface likely a sub-thread or notification reply flow; not material to the rebuild scope.
  - V2-ADDR-01 cross-division address selector: account uses it at `(account)/{addresses,settings/addresses}` and the `(account)/care/bookings/[bookingId]` flow per `@henryco/address-selector` consumer trace. **Working.**

### B.hub — Owner + workspace shell (`apps/hub` → `henrycogroup.com` / `hq.*` / `staffhq.*` / `workspace.*`)

- **B.hub-1 Protected routes.** Public `(site)/*` (about, contact, newsletter, preferences, privacy, search, terms, page). Owner: `owner/(command)/{page, ai/{insights,signals,page}, brand/{pages,settings,subdomains,page}, divisions/{[slug],performance,page}, finance/{expenses,invoices,revenue,page}, messaging/{alerts,queues,team,page}, operations/{alerts,analytics,approvals,queues,page}, settings/{audit,comms,security,page}, staff/{directory,invite,roles,tree,users/[id],page}}` — **gated by `requireOwner()`** ([`apps/hub/lib/owner-auth.ts:55-60`](apps/hub/lib/owner-auth.ts)) which delegates to `apps/hub/app/lib/owner-auth.ts requireOwner` (active `owner_profiles` row with role ∈ `owner|admin`). On forbidden/misconfigured: redirect to `/owner/no-access`. `owner/login`, `owner/no-access` are public to logged-out owners. `workspace/[[...slug]]` is the redirect stub (see A.4-1).
- **B.hub-2 Surfaces inventory.** Owner home ([`apps/hub/app/owner/(command)/page.tsx`](apps/hub/app/owner/%28command%29/page.tsx)): situation room (briefing + comms-health 4-tile grid + next-best actions), 6 metric cards, executive digest panel, urgent signals panel, division control center (one card per `WORKSPACE_DIVISIONS`), helper recommendations panel, sensitive-activity panel (audit). Sub-routes follow OwnerPanel/MetricCard/DivisionBadge/OwnerQuickLink primitives ([`apps/hub/components/owner/`](apps/hub/components/owner/)). Internal-comms surface at `messaging/team` is real (full thread/message/dm/pin/read/search/attachments REST in `apps/hub/app/api/owner/internal-comms/*` — 10 routes).
- **B.hub-3 CTA reality.** Owner home: "Invite staff", "Update brand settings", 6 metric cards as Links (LIVE), `OwnerQuickLink × 6` to alerts/finance/staff/ai/messaging.team/operations.approvals (**LIVE**), 5 signal-cards as `<Link href={signal.href}>` (LIVE if `getOwnerOverviewData` populates real hrefs — verify), division-control cards link to `/owner/divisions/{slug}` (LIVE — page exists), helper recommendations and audit entries are Links (LIVE assuming data populates). No DECORATIVE/DEAD found in code trace.
- **B.hub-4 Data sources.** [`apps/hub/lib/owner-data.ts`](apps/hub/lib/owner-data.ts) is the canonical owner data layer (~similar shape to `apps/account/lib/account-data.ts`). Reads cross-cutting tables: `customer_notifications`, `support_threads`, division-specific approval queues, notification_delivery_log (queued/failed counts), audit log, `*_role_memberships` for staff counts, `wallet_*` for revenue. Uses **service role admin client** ([`apps/hub/lib/supabase.ts`](apps/hub/lib/supabase.ts)) — appropriate for the owner aggregation surface, RLS bypassed by design.
- **B.hub-5 Role & permission model.** Owner check via `owner_profiles` (active=true, role ∈ owner|admin). The **canonical workspace platform model** lives here in [`apps/hub/app/lib/workspace/{types,roles,auth,data,navigation,runtime}.ts`](apps/hub/app/lib/workspace/) — but is **not actively serving any UI** because `app/workspace/[[...slug]]/page.tsx` is the redirect stub. The platform model is consumed by `apps/staff` indirectly via `apps/staff/lib/roles.ts` which mirrors the structure.
- **B.hub-6 Notification & email touchpoints.** Owner reports cron at `/api/cron/owner-reports` daily, plus `cron/owner-reporting/{weekly,monthly}` routes. [`apps/hub/lib/owner-reporting.ts`](apps/hub/lib/owner-reporting.ts) uses `@henryco/email` (purpose likely `generic` or a specific purpose for owner reports — verify the resolveSenderIdentity arg). Owner-side internal-comms produces messages but does not currently emit cross-division `publishNotification` calls (grep confirms hub is not in publishNotification consumer list).
- **B.hub-7 Mobile & accessibility.** **Owner-stated concern: division detail modal mobile overflow / disappearing close.** `divisions/[slug]/page.tsx` is the most likely culprit; the `OwnerPanel` primitive needs scrollability + sticky-close on mobile. Confirmed visually-only (would need browser to verify) — the page uses fixed grid layouts. Audit recommendation: panels need `overscroll-y-contain` and a mobile sheet variant.
- **B.hub-8 Payment / invoice / subscription.** Owner finance center: `owner/(command)/finance/{expenses,invoices,revenue,page}`. Real revenue reads cross-division wallet/invoice tables — see B.hub-4.
- **B.hub-9 KYC / documents / verification.** Owner does not directly handle individual KYC; the staff workspace's `(workspace)/kyc/page.tsx` is the operator surface (apps/staff). Owner sees aggregate signals.
- **B.hub-10 Support / inbox / messaging.** Owner messaging center routes to internal-comms (team threads, queue health, alerts). Not the customer-facing support inbox (that's account / care / division-specific).
- **B.hub-11 Audit log / admin / owner.** The whole owner surface IS the admin/owner panel. Sensitive activity panel on owner home + dedicated `settings/audit/page.tsx`. Reads from `audit_log` (table inferred — see [`apps/hub/lib/owner-data.ts`](apps/hub/lib/owner-data.ts) for actual table name).
- **B.hub-12 Known issues — confirm/deny.**
  - Workspace redirect loop (A.4-1): **CONFIRMED in code**, requires live verification.
  - Repo-root `app/lib/workspace/data.ts`: **CONFIRMED orphan duplicate** — canonical is at `apps/hub/app/lib/workspace/data.ts`.
  - `apps/apps/hub/app/`: **CONFIRMED empty orphan directory**.
  - Owner reports cron: **CONFIRMED present** with daily + weekly + monthly schedules.
  - Division detail modal mobile overflow: **plausible, not confirmed without visual** — requires browser test.

### B.staff — Unified staff workspace (`apps/staff` → `staff.henrycogroup.com`)

- **B.staff-1 Protected routes.** All `(workspace)` group routes guarded by `requireStaff()` ([`apps/staff/lib/staff-auth.ts:1-80`](apps/staff/lib/staff-auth.ts)) which: (1) reads session via shared cookie handlers (correctly using `buildSharedCookieHandlers`), (2) joins `marketplace_role_memberships`, `studio_role_memberships`, `property_role_memberships`, `learn_role_memberships`, plus `profiles.role` for legacy/care/jobs/logistics, (3) records access-source audit to `staff_navigation_audit`, (4) on no-staff-membership: redirects to login or `/no-access`. The `(workspace)` group hosts: page (overview), care, finance, jobs, kyc, learn, logistics, marketplace, operations/{lifecycle,newsletter/{[id],new,page},page}, property, search, settings, studio, support, workforce.
- **B.staff-2 Surfaces inventory.** Home page ([`apps/staff/app/(workspace)/page.tsx:22-79`](apps/staff/app/%28workspace%29/page.tsx)): `RouteLiveRefresh`, `StaffPageHeader`, **4 metric cards** (active tasks, open queues, risk-signals/pending-reviews depending on role, notifications), nav-driven workspace links, supportHref/operationsHref/primaryQueueHref derived from filtered nav. Per-division pages render division-specific tasks + queues. Newsletter sub-flow (`operations/newsletter/{page,new,[id]}`) is a content production surface using `@henryco/newsletter`.
- **B.staff-3 CTA reality.** All metric cards are LIVE (each a Link). `getFilteredNavItems(viewer)` + `viewerCanAccessOperations(viewer)` gate links by permission, so DEAD CTAs are unlikely (filtered out). Per-division pages — would need page-by-page audit to verify all CTAs (not done in this pass; sample look at `(workspace)/care/page.tsx` and `(workspace)/marketplace/page.tsx` recommended for the executor).
- **B.staff-4 Data sources.** [`apps/staff/lib/intelligence-data.ts`](apps/staff/lib/intelligence-data.ts) (`getStaffIntelligenceSnapshot` — joins tasks, signals, notifications across divisions, takes per-viewer division scope), [`apps/staff/lib/finance-data.ts`](apps/staff/lib/finance-data.ts), [`apps/staff/lib/kyc-data.ts`](apps/staff/lib/kyc-data.ts), [`apps/staff/lib/customer-lifecycle.ts`](apps/staff/lib/customer-lifecycle.ts), [`apps/staff/lib/search.ts`](apps/staff/lib/search.ts). Service-role admin client at [`apps/staff/lib/supabase/admin.ts`](apps/staff/lib/supabase/admin.ts).
- **B.staff-5 Role & permission model.** [`apps/staff/lib/roles.ts`](apps/staff/lib/roles.ts) (filtered nav, division access). `requireStaff` is the canonical resolver. **Duplicates the SQL `is_staff_in()` predicate** at TS layer — semantic risk: drift if one is updated and not the other. The rebuild prompt should call this out.
- **B.staff-6 Notification & email touchpoints.** Staff bell widget reads `staff_notifications` + `staff_notification_states` (V2-NOT-02-A schema). Realtime subscription via `supabase_realtime`. **No email emission from apps/staff** (verified via grep).
- **B.staff-7 Mobile & accessibility.** Staff is a desktop-first operator surface; mobile parity acceptable but not premium. Inspect `StaffMetricCard`, `StaffPageHeader`, `StaffPanel` primitives ([`apps/staff/components/StaffPrimitives.tsx`](apps/staff/components/StaffPrimitives.tsx)).
- **B.staff-8 Payment / invoice / subscription.** `(workspace)/finance/page.tsx` reads from cross-division finance data. Operator-side, not customer-facing.
- **B.staff-9 KYC / documents / verification.** `(workspace)/kyc/page.tsx` is the operator KYC review surface; `apps/staff/app/api/kyc/review/route.ts` is the action endpoint.
- **B.staff-10 Support / inbox / messaging.** `(workspace)/support/page.tsx` + `apps/staff/app/api/support/reply/route.ts` for the operator-side support reply flow.
- **B.staff-11 Audit log / admin / owner.** Operator surface itself; no separate admin/audit-log UI inside apps/staff (the audit log lives in apps/hub).
- **B.staff-12 Known issues — confirm/deny.** No specific owner-stated concerns for apps/staff. **Audit Finding B.staff-1 (correction):** `apps/staff` is a fully-functional staff workspace that should be the rebuild's starting point for the staff role, not replaced from scratch.

### B.care — Fabric Care division (`apps/care` → `care.henrycogroup.com`)

- **B.care-1 Protected routes.** `(public)/*` is unauthenticated. `(staff)/*` group is **silently retired** by [`apps/care/app/(staff)/layout.tsx`](apps/care/app/%28staff%29/layout.tsx) — every staff route redirects to `staffhq.${baseDomain}/care`. `admin/page.tsx` is gated by `requireRoles(["owner","manager","support","staff"])` ([`apps/care/app/admin/page.tsx:46`](apps/care/app/admin/page.tsx)). `workspace/access/{page,recovery}` for staff sign-in. `login/page.tsx` for customers.
- **B.care-2 Surfaces inventory.** Public: home, services, pricing, book, track, review, contact, about, unsubscribe. Admin: a single "control center" page with 5 cards (settings, pricing, reviews, bookings, divisions). The (staff) tree's pages exist as files but are dead (redirected). Booking flow is the biggest customer surface — multi-step at `/book`.
- **B.care-3 CTA reality.** Admin cards: each card has an `id` but **no `onClick` or href to a working sub-page** in [`apps/care/app/admin/page.tsx:73-90`](apps/care/app/admin/page.tsx) — they're styled tiles with "Ready for live wiring" sub-label. **Classification: DECORATIVE** (the admin shell exists but the wires aren't connected). Public CTAs (Book, Track, Pricing, Services) all LIVE.
- **B.care-4 Data sources.** Public surfaces read `care_*` tables (bookings, services, pricing, reviews) via [`apps/care/lib/`](apps/care/lib/). The (staff) routes that redirect would have used `apps/care/lib/care/*.ts` — but none of those queries currently render to users.
- **B.care-5 Role & permission model.** Stricter than the rest: [`apps/care/lib/auth/roles.ts`](apps/care/lib/auth/roles.ts) `AppRole`: customer/owner/manager/rider/support/staff. [`apps/care/lib/auth/permissions.ts`](apps/care/lib/auth/permissions.ts) `Permission` union + `ROLE_PERMISSIONS` + `canAccessPath()`. [`apps/care/lib/auth/server.ts`](apps/care/lib/auth/server.ts) `requireRoles`, `getServerSupabase` (uses shared cookie handlers correctly), `getAuthenticatedProfile`. `homeForRole()` lands roles to `/owner`, `/manager`, `/rider`, `/support`, `/staff`, `/track`. **All staff destinations are dead** because their layouts redirect.
- **B.care-6 Notification & email touchpoints.** Care emits notifications via `publishNotification` (grep matches in care/lib code paths). Email send at [`apps/care/lib/email/send.ts`](apps/care/lib/email/send.ts) — passes purpose `care` only for actual care content (verified by file scope). The cron `/api/cron/care-automation` daily at 8:15 ([`apps/care/vercel.json:6-12`](apps/care/vercel.json)) runs care-specific automation (status nudges, reminders).
- **B.care-7 Mobile & accessibility — owner concerns.**
  - **Cloth/category picker long-scroll**: `(public)/book/page.tsx` is the booking flow; the picker is likely in a sub-component (would need to read `apps/care/components/booking/` directory — not part of this pass). Owner-stated as a real issue. **Plausible, not code-cited.**
  - Weak selected state on picker: same caveat. Plausible.
  - CTA unreachable on mobile: same caveat. Plausible.
- **B.care-8 Payment / invoice / subscription.** Booking-level payments via `care_bookings.payment_status` + `quoted_total` + `balance_due`. No subscriptions in care today.
- **B.care-9 KYC / documents / verification.** Not currently exposed in care customer flow; rider verification belongs to staff/operations.
- **B.care-10 Support / inbox / messaging.** Care imports `@henryco/chat-composer` — used in customer↔care thread (likely the `track` or post-booking conversation flow). Customer support flows ultimately funnel into `apps/account/(account)/support` via `apps/care/lib/support/account-sync.ts` and `apps/care/lib/account-linking.ts`.
- **B.care-11 Audit log / admin / owner.** [`apps/care/app/admin/page.tsx`](apps/care/app/admin/page.tsx) is the admin shell (decorative). The owner/manager dashboards under `(staff)` are redirected dead.
- **B.care-12 Known issues — confirm/deny.**
  - Picker concerns: plausible, not code-cited (deferred).
  - `/admin` no requireRoles: **STALE DOC CLAIM** — actually gated (B.care-1 above).
  - Email dark-mode contrast: requires email package template review.
  - The double-nested `apps/care/app/app/(staff)/{manager,owner}/page.tsx` files are **artefacts to delete** (extra `/app/app/` path).

### B.marketplace — Multi-vendor commerce (`apps/marketplace` → `marketplace.henrycogroup.com`)

- **B.marketplace-1 Protected routes.** Public: cart, checkout, search, deals, sell, sell/pricing, trust, help, plus dynamic `(public)/{brand,category,collections,policies,product,store,track}/[slug]`. Customer authenticated: `account/{page,addresses,disputes,following,notifications,orders/{[orderNo],page},payments,reviews,seller-application/{review,start,verification,page},wishlist}`. Vendor: `vendor/{page,analytics,disputes,onboarding,orders/{[groupId],page},payouts,products/{[id],new,page},settings,store}`. Staff: `admin/{[resource],page}`, `finance/{[resource],page}`, `moderation/{[resource],page}`, `operations/{[resource],page}`, `owner/{[resource],page}`, `support/{[resource],page}` — all gated by `requireMarketplaceRoles`. The `[resource]` dynamic route pattern means each surface has a generic "resource explorer" — a unified internal admin pattern.
- **B.marketplace-2 Surfaces inventory.** Vendor analytics, vendor product listing/edit/new, vendor orders, vendor payouts, vendor disputes, vendor settings, vendor store. Staff resource explorers (admin/finance/moderation/operations/owner/support × `[resource]`). Customer order tracking, dispute submission, wishlist, following, reviews, seller application multi-step.
- **B.marketplace-3 CTA reality.** Sample: `(public)/page.tsx` (home) — links to product/category routes (LIVE). Vendor `page.tsx` — depends on data state; would need deeper read. **Marketplace mobile workspace nav** has been improved per recent commits — verify by reading [`apps/marketplace/components/marketplace/shell.tsx`](apps/marketplace/components/marketplace/shell.tsx) (which appears in the raw-`<img>` grep — concerning but separate).
- **B.marketplace-4 Data sources.** [`apps/marketplace/lib/marketplace/data.ts`](apps/marketplace/lib/marketplace/data.ts) + `projections.ts` + `governance.ts` + `policy.ts` + `automation.ts`. Tables: `marketplace_products`, `marketplace_orders`, `marketplace_order_groups`, `marketplace_applications`, `marketplace_disputes`, `marketplace_payouts`, `marketplace_seller_tiers`, `marketplace_deals_curation` (recent migrations).
- **B.marketplace-5 Role & permission model.** [`apps/marketplace/lib/marketplace/auth.ts`](apps/marketplace/lib/marketplace/auth.ts) — requireMarketplaceRoles, getMarketplaceViewer. Roles ([`apps/marketplace/lib/marketplace/types.ts`](apps/marketplace/lib/marketplace/types.ts)): buyer, vendor, marketplace_owner, marketplace_admin, moderation, support, finance, operations, etc.
- **B.marketplace-6 Notification & email touchpoints.** [`apps/marketplace/lib/marketplace/notifications.ts`](apps/marketplace/lib/marketplace/notifications.ts) — calls `publishNotification` + `publishStaffNotification` (verified in grep). Email via `@henryco/email` passing purpose `marketplace`. **Care fallback risk: none observed.**
- **B.marketplace-7 Mobile & accessibility — known issues, CONFIRMED.**
  - **Heavy raw `<img>` use**: 9 raw `<img` occurrences across `apps/marketplace/{proxy.ts,components/marketplace/{shell,cart-experience,product-media-gallery,cart-drawer,public-header-client,product-card-client}.tsx, app/account/page.tsx, next-env.d.ts}`. **Zero `next/image` references**. Owner concern **CONFIRMED**.
  - Layout shift on product/category pages: highly likely given no Next/Image dimension hinting.
  - Mobile workspace nav state: improved per recent commits — verify in shell.tsx.
  - Pending/disabled/spinner button states: would need component-by-component audit; primary buttons in [`apps/marketplace/components/marketplace/`](apps/marketplace/components/marketplace/) need a tri-state pattern.
- **B.marketplace-8 Payment / invoice / subscription.** Cart → checkout → wallet payment or external rail. Vendor payouts at `vendor/payouts/page.tsx`. Invoices likely emitted to customer's `customer_invoices` table.
- **B.marketplace-9 KYC / documents / verification.** Seller application multi-step at `account/seller-application/{start,review,verification,page}`. Application doc storage in Supabase storage bucket (specific bucket name to verify — see [`docs/property-storage-handoff.md`](docs/property-storage-handoff.md) for storage handoff convention).
- **B.marketplace-10 Support / inbox / messaging.** Disputes flow at `account/disputes/page.tsx` + `vendor/disputes/page.tsx` + `moderation/[resource]?type=dispute`. Order conversation thread within order detail page.
- **B.marketplace-11 Audit log / admin / owner.** `admin/[resource]/page.tsx` is the generic admin explorer; specific moderation actions logged to `audit_log` via `apps/marketplace/lib/marketplace/policy.ts`.
- **B.marketplace-12 Known issues — confirm/deny.**
  - Heavy images / no Next/Image: **CONFIRMED via grep** (B.marketplace-7).
  - Mobile workspace nav improvement: **plausibly landed**, verify by reading shell.tsx.
  - Missing pending/disabled/spinner states: **likely true**, need component audit.

### B.property — Premium rentals & managed property (`apps/property` → `property.henrycogroup.com`)

- **B.property-1 Protected routes.** Public: home, search, area/[slug], property/[slug], submit, managed, trust, faq, login, auth/callback. Account: `{page,inquiries,listings,saved,viewings}`. Staff: `admin/{listings,page}`, `agent/page`, `moderation/page`, `operations/page`, `owner/page`, `support/page` — gated by `requirePropertyRoles` ([`apps/property/lib/property/auth.ts`](apps/property/lib/property/auth.ts)).
- **B.property-2 Surfaces inventory.** Listing detail with save/inquiry/viewing for logged-in users. Submission flow for owners. Inspection/viewing coordination for staff. Managed-property views. Admin moderation queue.
- **B.property-3 CTA reality.** Public listing detail Save/Inquire/Viewing — LIVE (per `(public)/property/[slug]/page.tsx` and supporting api). Account dashboard at `account/page.tsx` is a customer-facing inquiry/listing/saved/viewings hub.
- **B.property-4 Data sources.** [`apps/property/lib/property/{data,store,submission}.ts`](apps/property/lib/property/) — listings, inspections, role memberships. RLS policies in `apps/property/supabase/migrations/20260402183500_property_policies.sql`.
- **B.property-5 Role & permission model.** [`apps/property/lib/property/auth.ts`](apps/property/lib/property/auth.ts) — requirePropertyRoles, getPropertyViewer. Eligibility flags per [`docs/property-inspection-eligibility-rules.md`](docs/property-inspection-eligibility-rules.md), [`docs/property-listing-governance.md`](docs/property-listing-governance.md).
- **B.property-6 Notification & email touchpoints.** [`apps/property/lib/property/notifications.ts`](apps/property/lib/property/notifications.ts) — publishNotification + email via `@henryco/email` purpose `property`. [`apps/property/lib/property/email/templates.ts`](apps/property/lib/property/email/templates.ts) for templated emails.
- **B.property-7 Mobile & accessibility — known issues, CONFIRMED.**
  - **Raw `<img>` use**: 5 raw `<img` occurrences across `apps/property/{next-env.d.ts,proxy.ts,components/property/{ui,PropertyImageGallery}.tsx}`. **PropertyImageGallery has 2 raw `<img>`** — directly relevant to the heavy-images concern. **Zero `next/image` references**. Owner concern **CONFIRMED**.
  - Layout shift on home/search/listing detail: highly likely.
  - Pending/disabled/spinner button states: same gap as marketplace.
- **B.property-8 Payment / invoice / subscription.** Inspection fees / managed-property fees / saved-search subscriptions if implemented — verify in [`apps/property/lib/property/data.ts`](apps/property/lib/property/data.ts).
- **B.property-9 KYC / documents / verification.** Owner-submitter KYC for listing publishing (per [`docs/property-verification-state-model.md`](docs/property-verification-state-model.md)).
- **B.property-10 Support / inbox / messaging.** Inquiry threads via `account/inquiries/page.tsx`. Viewing coordination messaging through staff `agent/page.tsx`.
- **B.property-11 Audit log / admin / owner.** `admin/listings/page.tsx` for moderation. property_admin views.
- **B.property-12 Known issues — confirm/deny.**
  - Heavy images / no Next/Image: **CONFIRMED via grep** (B.property-7).
  - Layout shift: **likely** given no image dimensioning.
  - Missing pending/disabled/spinner states: **likely**.
  - Shared-account login URL usage: per [`docs/auth-continuity-map.md:36`](docs/auth-continuity-map.md) "MUST FIX NOW resolved" — verify by reading [`apps/property/lib/property/links.ts`](apps/property/lib/property/links.ts).
  - The `(public)/login/page.tsx` exists — **investigate whether this is the post-fix state (a wrapper that redirects to account login) or pre-fix legacy**.

### B.jobs — Hiring (`apps/jobs` → `jobs.henrycogroup.com`)

- **B.jobs-1 Protected routes.** Public: page, jobs/{[slug],page}, categories/[slug], careers, employers/[slug], hire, talent, trust, help. Candidate: page, alerts, applications, conversations/{[conversationId],page}, files, interviews, profile, saved-jobs, settings. Employer: page, analytics, applicants/{[id],page}, company, hiring/{[pipelineId]/{[applicationId],page},page}, jobs/{[id],new,page}, settings. Recruiter: page, candidates/{[candidateId],page}, employers, history, jobs, pipeline, verification. Staff: admin, analytics, moderation, owner. Auth: login, signup, auth/callback. Gated by `requireJobsRoles` / `requireJobsUser` ([`apps/jobs/lib/auth.ts`](apps/jobs/lib/auth.ts) + [`apps/jobs/lib/jobs/types.ts`](apps/jobs/lib/jobs/types.ts) for `JobsRole`).
- **B.jobs-2 Surfaces inventory.** Candidate dashboard (alerts, applications, interviews, saved jobs, profile, files, conversations, settings). Employer dashboard (jobs, applicants, hiring pipeline, analytics, company, settings). Recruiter dashboard (candidates, jobs, pipeline, employers, history, verification). Admin/moderation/owner — staff variants.
- **B.jobs-3 CTA reality.** Each surface is real per code presence; sampling 1-2 per role recommended for the rebuild executor.
- **B.jobs-4 Data sources.** [`apps/jobs/lib/jobs/{data,content,hiring,hiring-rules,write,trust,posting-eligibility}.ts`](apps/jobs/lib/jobs/) — jobs_postings, jobs_applications, jobs_pipelines, jobs_conversations, jobs_alerts. **No `jobs_role_memberships` table** ([`apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:39-44`](apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql)) — staff identity for jobs resolves entirely through `profiles.role`.
- **B.jobs-5 Role & permission model.** [`apps/jobs/lib/auth.ts`](apps/jobs/lib/auth.ts) — `requireJobsRoles`, `requireJobsUser`. `JobsRole`: candidate, employer, recruiter, admin, owner, moderator + `internalProfile` mapping. **Audit Finding B.jobs-1:** [`docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md:151`](docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md) flags that "Jobs /admin routes to recruiter under retired layout" — verify by reading [`apps/jobs/app/admin/page.tsx`](apps/jobs/app/admin/page.tsx) (deferred to executor; not blocking).
- **B.jobs-6 Notification & email touchpoints.** [`apps/jobs/lib/jobs/notifications.ts`](apps/jobs/lib/jobs/notifications.ts) — publishNotification + email purpose `jobs`. apps/jobs is **NOT** in `@henryco/notifications` consumer list per package.json deps grep — uses chat-composer only. Email-side, jobs-purpose properly resolved via package layer.
- **B.jobs-7 Mobile & accessibility.** Standard Next.js + Tailwind v4. No specific owner concerns flagged for jobs.
- **B.jobs-8 Payment / invoice / subscription.** Employer paid posting? Verify in [`apps/jobs/lib/jobs/posting-eligibility.ts`](apps/jobs/lib/jobs/posting-eligibility.ts) for posting fees if any. Likely free in current scope.
- **B.jobs-9 KYC / documents / verification.** Candidate verification, employer onboarding verification — uses `@henryco/trust` and `apps/jobs/lib/jobs/trust.ts`.
- **B.jobs-10 Support / inbox / messaging.** Conversations at `candidate/conversations/{[conversationId],page}`. Uses `@henryco/chat-composer`.
- **B.jobs-11 Audit log / admin / owner.** `admin/page.tsx`, `moderation/page.tsx`, `owner/page.tsx` — staff surfaces.
- **B.jobs-12 Known issues — confirm/deny.** No specific owner-stated concerns surface for jobs in the prompt list.

### B.learn — Courses & certifications (`apps/learn` → `learn.henrycogroup.com`)

- **B.learn-1 Protected routes.** Public: page, academy, categories/[slug], certifications/{verify/{[code],page},page}, courses/{[slug],page}, help, instructors/{[slug],page}, paths/{[slug],page}, teach, trust. Learner: page, certificates, courses/{[courseId],page}, notifications, payments, progress, saved, settings. Instructor: page. Owner: page, analytics, assignments, certificates, courses, instructors, learners, paths, settings. Admin: page. Analytics, content, support — staff. Auth: login, signup. Gated by `requireLearnRoles` ([`apps/learn/lib/learn/auth.ts`](apps/learn/lib/learn/auth.ts)).
- **B.learn-2 Surfaces inventory.** Learner dashboard (certificates, courses, progress, payments, saved, settings). Instructor dashboard. Owner academy admin (full course/instructor/learner/path management).
- **B.learn-3 CTA reality.** Standard pattern — each role's surface deeply structured; sample-verify in executor.
- **B.learn-4 Data sources.** [`apps/learn/lib/learn/{actions,auth}.ts`](apps/learn/lib/learn/) + supabase tables: learn_courses, learn_paths, learn_enrollments, learn_certificates, learn_assignments, learn_teacher_applications, learn_role_memberships.
- **B.learn-5 Role & permission model.** `requireLearnRoles`. Roles: learner, teacher, academy_owner, academy_admin, etc. Has its own `learn_role_memberships` table.
- **B.learn-6 Notification & email touchpoints.** [`apps/learn/lib/email/learn-templates.ts`](apps/learn/lib/email/learn-templates.ts) — purpose `learn`. publishNotification calls in actions.ts.
- **B.learn-7 Mobile & accessibility.** No specific owner concerns. Has Playwright tests.
- **B.learn-8 Payment / invoice / subscription.** Course payments at `learner/payments/page.tsx`. Per migration `20260501000000_learn_unlock_policy.sql`, unlock policy gates course access — verify pricing/payment integration.
- **B.learn-9 KYC / documents / verification.** Instructor verification + certificate authenticity (verify pages at `(public)/certifications/verify/[code]/page.tsx`).
- **B.learn-10 Support / inbox / messaging.** support/page.tsx for learner help.
- **B.learn-11 Audit log / admin / owner.** owner/* family is the academy admin surface.
- **B.learn-12 Known issues — confirm/deny.** No specific owner-stated concerns.

### B.logistics — Pickup, dispatch, delivery (`apps/logistics` → `logistics.henrycogroup.com`)

- **B.logistics-1 Protected routes.** Only **11 routes total** (the thinnest division app). page (home), [...slug] (catch-all), book, business, **customer** (the customer dashboard), pricing, quote, services, support, track, login. **No staff/admin/operations/owner explicit routes** in apps/logistics/app — operator surfaces live in apps/staff/(workspace)/logistics/page.tsx. Customer-protected: `customer/page.tsx`.
- **B.logistics-2 Surfaces inventory.** Customer dashboard at `customer/page.tsx`. Public quote, book, track flows. Business landing at `business/page.tsx`.
- **B.logistics-3 CTA reality.** Public flows LIVE (quote → book → track). Customer dashboard depends on `apps/logistics/lib/logistics/data.ts` — verify in executor.
- **B.logistics-4 Data sources.** logistics_shipments, logistics_quotes, logistics_riders, logistics_routes (inferred). [`apps/logistics/lib/logistics/`](apps/logistics/lib/logistics/) (path inferred — not directly listed but pattern matches).
- **B.logistics-5 Role & permission model.** **No `logistics_role_memberships` table** — staff identity falls back entirely to `profiles.role` per the `is_staff_in()` predicate function. Customer flows gated by simple session check.
- **B.logistics-6 Notification & email touchpoints.** [`apps/logistics/lib/logistics/notify-customer.ts`](apps/logistics/lib/logistics/notify-customer.ts) — publishNotification + email purpose `logistics`.
- **B.logistics-7 Mobile & accessibility.** No specific owner concerns. Per [`docs/render-strategy-map.md:14`](docs/render-strategy-map.md), public routes moved to ISR revalidate=300.
- **B.logistics-8 Payment / invoice / subscription.** Per-shipment payment via the booking flow. No subscriptions today.
- **B.logistics-9 KYC / documents / verification.** Rider documents — likely server-side staff workflow only.
- **B.logistics-10 Support / inbox / messaging.** support/page.tsx.
- **B.logistics-11 Audit log / admin / owner.** Lives in apps/staff(workspace)/logistics — not in apps/logistics.
- **B.logistics-12 Known issues — confirm/deny.** No specific owner-stated concerns for logistics. The customer-facing surface migration to apps/account/(account)/logistics/page.tsx + apps/account/lib/logistics-module.ts is **already partially in place** (per the customer migration to account dashboard).

### B.studio — Premium product studio (`apps/studio` → `studio.henrycogroup.com`)

- **B.studio-1 Protected routes.** Public `(public)/{page,services/{[slug],page},pricing,process,work/{[slug],page},teams/{[slug],page},pick,faq,trust,contact}`. Client: page, files, projects, proposals, reviews. PM: page, projects, revisions. Sales: page, leads, match, proposals. Delivery: page, assets. Finance: page, invoices, payments. Owner: page. Generic: project/[projectId], proposals/[proposalId], request/page, support/{page,[threadId]}. Auth: login. Gated by `requireStudioRoles` ([`apps/studio/lib/studio/auth.ts`](apps/studio/lib/studio/auth.ts)).
- **B.studio-2 Surfaces inventory.** Client portal (project, proposals, files, reviews). Sales pipeline (leads, match, proposals). PM (projects, revisions). Delivery (assets). Finance (invoices, payments).
- **B.studio-3 CTA reality.** Sample-verify in executor.
- **B.studio-4 Data sources.** [`apps/studio/lib/studio/`](apps/studio/lib/studio/) — studio_projects, studio_proposals, studio_briefs (per migration `20260405120000_studio_brief_domain_intent.sql`), studio_invoices, studio_payments, studio_role_memberships.
- **B.studio-5 Role & permission model.** Roles ([`apps/studio/lib/studio/types.ts`](apps/studio/lib/studio/types.ts)): client, studio_owner, sales_consultation, project_manager, developer_designer, client_success, finance.
- **B.studio-6 Notification & email touchpoints.** [`apps/studio/lib/studio/email/send.ts`](apps/studio/lib/studio/email/send.ts) — purpose `studio`. publishNotification in actions.ts.
- **B.studio-7 Mobile & accessibility — owner concern.**
  - **"Request selector too long / unpremium dropdown"** — most likely `(public)/pick/page.tsx` (the "what to request" picker) or `request/page.tsx`. Plausible without browser visual; flag for executor to specifically rework as a premium typeahead/grid pattern, not a long native `<select>`.
- **B.studio-8 Payment / invoice / subscription.** Invoices at `finance/invoices/page.tsx`, payments at `finance/payments/page.tsx`. Wallet integration through `apps/account/(account)/studio/payments/[id]/page.tsx` + `/api/studio/payments/[id]/wallet`.
- **B.studio-9 KYC / documents / verification.** Client identity via shared trust profile.
- **B.studio-10 Support / inbox / messaging.** support/{page,[threadId]} — uses `@henryco/chat-composer`.
- **B.studio-11 Audit log / admin / owner.** owner/page.tsx is the studio owner overview.
- **B.studio-12 Known issues — confirm/deny.**
  - Long unpremium request selector: **plausible** (B.studio-7).
  - Email dark-mode contrast on project update emails: requires email template review at [`apps/studio/lib/studio/email/`](apps/studio/lib/studio/email/).

### B.super-app — Consumer mobile (`apps/super-app`, Expo/React Native)

- **B.super-app-1 Protected routes.** `app/(tabs)/{index,services,directory,account,_layout}` + `app/legal/{about,contact,privacy,terms,faq,_layout}` + `app/module/[slug]` + `app/+not-found`. Auth via `apps/super-app/src/hooks/useAuthSession.ts`.
- **B.super-app-2 Surfaces inventory.** Hub screen (services index), directory screen (divisions list), account screen (profile + activity), services screen (pages per division), module/[slug] (per-division detail).
- **B.super-app-3 CTA reality.** Mostly LIVE (deep-links to web via `apps/super-app/src/core/linking.ts`).
- **B.super-app-4 Data sources.** Adapter pattern: `apps/super-app/src/platform/adapters/{mock,supabase,expo}/` selected by `apps/super-app/src/platform/bundle.ts` based on runtime mode (local/staging/production) and `EXPO_PUBLIC_LIVE_SERVICES_APPROVED`. Real Supabase via supabase adapter, mock via mock adapter. See [`docs/architecture-summary.md:7-26`](docs/architecture-summary.md).
- **B.super-app-5 Role & permission model.** Customer-only mobile app. Account screen authenticated via Supabase.
- **B.super-app-6 Notification & email.** Push via `expo-notifications` + `apps/super-app/src/platform/adapters/expo/notifications.expo.ts`. Sentry monitoring via `@sentry/react-native`. **No email send from mobile.**
- **B.super-app-7 Mobile & accessibility.** Native — Expo design system at `apps/super-app/src/design-system/`. Primary mobile UX consideration.
- **B.super-app-8 Payment.** Deferred adapter `apps/super-app/src/platform/adapters/payments.deferred.ts` — payments not live in mobile.
- **B.super-app-9 KYC.** Out of mobile scope today.
- **B.super-app-10 Support.** Out of scope.
- **B.super-app-11 Audit log.** N/A.
- **B.super-app-12 Known issues.** **Out of scope for the unified web dashboard rebuild** — mobile app is separate. The web shell must produce stable deep-linkable URLs that mobile can open via `linking.ts`.

### B.company-hub — Public hub mobile (`apps/company-hub`, Expo/React Native)

- **B.company-hub-1 Protected routes.** `app/(tabs)/{index,discover,more/{about,contact,privacy,settings,terms,index,_layout}}` + `app/onboarding`. **Public — no auth.**
- **B.company-hub-2 Surfaces inventory.** Discover screen, divisions index, division detail modal, onboarding.
- **B.company-hub-3 CTA reality.** Mobile deep-links into web flows.
- **B.company-hub-4 Data sources.** Static `apps/company-hub/src/data/divisions.ts` + Supabase for live division status (where applicable).
- **B.company-hub-5 Role & permission.** None — public.
- **B.company-hub-6 Notification & email.** None.
- **B.company-hub-7 Mobile & accessibility — owner concern.**
  - **DivisionDetailModal mobile overflow / disappearing close**: `apps/company-hub/src/components/DivisionDetailModal.tsx` is the file. **Plausible**, requires reading the file to confirm sticky-close + overscroll-y-contain. Flag for the dashboard rebuild as a parallel concern (this is the same UX pattern that the web owner panel needs).
- **B.company-hub-8/9/10/11.** N/A — public discovery app.
- **B.company-hub-12 Known issues.** Modal overflow noted. Out of scope for web dashboard rebuild but the same mobile sheet pattern should be unified.

### B.orphan — `apps/apps/hub/app/`

Empty nested directory. **Delete in a parallel housekeeping pass.** Not part of the rebuild scope.

---

## C. Cross-cutting systems audit

### C.1 Shared identity & session
**Cookie scope** — `.henrycogroup.com` enforced via [`packages/config/supabase-cookies.ts:182-273`](packages/config/supabase-cookies.ts) (`buildSharedCookieHandlers`, `buildSupabaseCookieOptions`, `resolveRequestCookieDomain`). Localhost / IP / unknown hosts fall through safely.

**Per-app cookie writers** — every web app's `proxy.ts` calls `buildSecurityHeaders()`; every server-supabase factory call uses `buildSharedCookieHandlers(cookieStore, cookieDomain)`. Confirmed by code in apps/care/lib/auth/server.ts:51-56. Pattern is uniform, ready for the unified shell.

**Logout** — global-scope `supabase.auth.signOut({ scope: "global" })` on every division's logout route per [`docs/auth-continuity-map.md:39-43`](docs/auth-continuity-map.md). Account logout records `customer_security_log` entry with `scope=global`.

**Auth flows wired**: email+password, magic link, password reset, email confirmation. **Not wired**: MFA / TOTP / passkeys ([`docs/identity-state-model.md:38`](docs/identity-state-model.md) — `FALSE / STALE`).

> **Audit Finding C.1-1 (gap):** No shared `@henryco/auth` package. Every app's `lib/<vertical>/auth.ts` reimplements `require*` helpers + cookie wiring. Consolidating into a package is **explicitly recommended** by the rebuild prompt below as a precondition Sub-Pass 1.

### C.2 Shared UI / design system
- **`@henryco/ui`** — `brand`, `footer`, `live` (RouteLiveRefresh), `loading`, `nav`, `providers`, `public`, `public-shell`, `search`, `support`, `theme`. Used by every web app.
- **`@henryco/notifications-ui`** — tokens, severity styling, motion, gestures, deep-link, icons, types. **Sole consumer: `apps/account`.** A.3-1.
- **`@henryco/brand`** — brand assets bundle. Used by account, hub, marketplace.
- **Per-app primitive duplication**:
  - account uses `acct-card`, `acct-metric`, `acct-chip`, `acct-button-primary`, `acct-button-secondary`, `acct-button-ghost`, `acct-fade-in`, `--acct-*` CSS vars
  - hub uses `OwnerPanel`, `OwnerPageHeader`, `OwnerNotice`, `OwnerQuickLink`, `MetricCard`, `DivisionBadge`, `--owner-accent` + same `--acct-*` vars (the owner surface visually piggybacks on the account theme)
  - staff uses `StaffPageHeader`, `StaffMetricCard`, `StaffPanel`, `StaffQuickLink`, and a `staff-*` vocab
  - marketplace, property, jobs, learn, logistics, studio each have their own `<Division>Panel` / shell components
- **Design tokens** — owner + account share a CSS-var palette (`--acct-*`); divisions each set their own accent via [`packages/config/company.ts`](packages/config/company.ts) (`accent`, `accentStrong`, `dark` per division).

> **Audit Finding C.2-1 (gap):** The unified shell needs a **shared dashboard primitive package** (`@henryco/dashboard-ui` or extension to `@henryco/ui`) with `MetricCard`, `Panel`, `PageHeader`, `EmptyState`, `Section`, `QuickLink`, `Chip`, `Badge`, `SignalCard`. Currently each app reinvents these. The rebuild Sub-Pass 2 should land this package and migrate the 4 dashboards to it.

### C.3 Shared data layer
**No `@henryco/data` package today.** Each app calls Supabase directly:
- account: [`apps/account/lib/{account-data,jobs-module,learn-module,logistics-module,property-module,studio-module,care-sync}.ts`](apps/account/lib/) — already does cross-division aggregation with patches per division
- hub: [`apps/hub/lib/owner-data.ts`](apps/hub/lib/owner-data.ts) — service-role aggregation
- staff: [`apps/staff/lib/intelligence-data.ts`](apps/staff/lib/intelligence-data.ts) — staff-side cross-division aggregation
- divisions: each has `lib/<vertical>/{data,projections,governance}.ts`

**Supabase typegen** — no `database.types.ts` at the workspace root. apps/super-app has its own `apps/super-app/src/core/database.types.ts` ([`apps/super-app/src/core/`](apps/super-app/src/core/)). Web apps appear to operate without generated types — they hand-type rows in each module file (heavy manual maintenance burden).

> **Audit Finding C.3-1 (gap):** The **signal feed** for the unified dashboard is a multi-table cross-division join. Putting it as a per-app implementation would multiply work. **Recommend** a `packages/data/` package with `getSignalFeed`, `getDashboardSummary`, `getInsightStream` shared helpers + a single typegen step at the workspace root. The current account-side cross-division module pattern is a strong starting point — promote it.

### C.4 Notification infrastructure readiness
Already covered in §A.8 (assets) and §A.10 (crons). For the shell:
- **Realtime subscription** — single subscription at the shell level via `@supabase/ssr` browser client; `customer_notifications` and `staff_notifications` are publication members with RLS-isolated streams.
- **Email fallback worker** — already wired in apps/account cron at `*/15 * * * *` with the V2-NOT-01-A schema fields (`email_dispatched_at`, `email_provider`, `publisher`, `request_id`).
- **Quiet hours** — `customer_preferences.quiet_hours_{enabled,start,end,timezone}` + `muted_event_types[]` + `muted_divisions[]`. Publisher should already check these (verify in `packages/notifications/publish.ts`).
- **Per-division event types** — `EVENT_TYPES` in `packages/notifications/event-types.ts`, `STAFF_EVENT_TYPES` in `packages/notifications/staff-event-types.ts`. Templated deep-link via `applyDeepLinkTemplate`.

> **Audit Finding C.4-1 (asset):** The notification spine is Phase 1 ready. The dashboard signal feed can ride on these tables without new schema. The owner-side ranking layer (urgency, recency, role-fit) is the only missing intelligence component — likely a server-side ranker + view.

### C.5 Search infrastructure
- account: `apps/account/lib/search.ts` (cross-division search)
- hub: `apps/hub/lib/search.ts` (owner-side cross-division)
- staff: `apps/staff/lib/search.ts` (staff cross-division)
- per-division: `apps/<vertical>/app/(public)/search/page.tsx`

> **Audit Finding C.5-1 (gap):** Search is **fragmented** — three separate cross-division searches (account, hub, staff) plus per-division. The unified shell's command palette (Cmd+K) needs **one** ranked search service (or a thin fan-out aggregator) with permission-aware result filtering. Recommend a `packages/search/` package or extension to `@henryco/intelligence` in Sub-Pass 3.

### C.6 Email governance compliance
**Compliant** at the package boundary — see §A.18. Per-app email files all import `@henryco/email`'s `sendEmail`, which auto-applies `resolveSenderIdentity(purpose)`. The Care fallback invariant is enforced.

**Risk surface**: any direct Brevo/Resend client instantiation that bypasses the package. Grep across `apps/` returned only **2 hits**:
- [`apps/studio/app/api/webhooks/resend/route.ts`](apps/studio/app/api/webhooks/resend/route.ts) — receives Resend delivery webhooks (not a sender). Safe.
- [`apps/care/lib/resend-server.ts`](apps/care/lib/resend-server.ts) — Care-specific server module. **Needs verification** that it routes through `@henryco/email`'s send wrapper rather than instantiating a raw Resend client (read above shows it imports the `Resend` SDK directly). If it does, that's a Care-purpose-only path — acceptable in spirit but a deviation from the canonical send flow that the rebuild prompt should flag for normalization.

> **Audit Finding C.6-1 (minor):** Care has its own Resend SDK touchpoint outside `@henryco/email`. Verify the purpose passed and migrate into the canonical send wrapper in a follow-up cleanup. Not blocking the rebuild.

### C.7 Security posture
- **RLS coverage** — every cross-cutting table in `apps/hub/supabase/migrations/` enables RLS at creation. Customer side: `customer_notifications`, `customer_preferences`, `customer_profiles`, `customer_invoices` etc. are user-scoped via `auth.uid() = user_id`. Staff side: `staff_notifications` + `staff_notification_states` use the `is_staff_in()` predicate. Per-division migrations (`learn`, `marketplace`, `property`, `studio`) carry their own policies. **Audit Finding C.7-1:** A workspace-wide RLS coverage matrix table-by-table does not exist as a doc — the rebuild prompt's verification step should require generating one (`select * from pg_policies` projection).
- **Service role key usage** — referenced in ~50 server-only files (lib/supabase.ts admin factories, scripts/, cron routes, the bridge migrations, tests). No occurrences in `components/` (client) folders found in spot checks. Confirmation that service role stays server-side: every `lib/supabase*.ts` admin factory is import-prefixed with `"server-only"` per [`apps/account/lib/auth.ts:1`](apps/account/lib/auth.ts) pattern. Looks safe.
- **CORS / CSP / security headers** — `defaultSecurityHeadersConfig()` from `@henryco/config` is the baseline. Hub's CSP allows `'unsafe-inline'` + `'unsafe-eval'` in `script-src` ([`apps/hub/proxy.ts:12`](apps/hub/proxy.ts)) — relax driven by Three.js + framer-motion. **Audit Finding C.7-2:** Tighten Hub CSP to nonce-based inline scripts in a follow-up; not blocking the rebuild but worth flagging.
- **Webhook signature verification** — `apps/account/app/api/webhooks/account/route.ts`, `apps/studio/app/api/webhooks/resend/route.ts`. Each must verify provider signature; verify in pre-rebuild gate.

### C.8 Observability
- **Sentry** — only `apps/super-app` (mobile). **No Sentry on any web app.** Major gap.
- **Vercel Analytics** — absent.
- **Structured logging** — ad-hoc `console.error` patterns (e.g. `apps/account/lib/auth.ts:45-46`). No central logger.
- **Event taxonomy** — defined in [`docs/event-taxonomy.md`](docs/event-taxonomy.md) but emission sites in code unclear without a deeper grep.

> **Audit Finding C.8-1 (gap):** The unified shell rebuild should land `@sentry/nextjs` (or alternative) on at least the customer + owner + staff hosts (account, hub, staff). Add a structured logger in `@henryco/config` or a new `@henryco/observability` package. Implement the [`docs/event-taxonomy.md`](docs/event-taxonomy.md) emission sites consistently.

### C.9 Performance baseline
- **Image handling** — confirmed: marketplace + property use raw `<img>` (B.marketplace-7, B.property-7). Account, hub, staff, jobs, learn, logistics, studio: not directly checked in this pass — the rebuild prompt should require an audit grep + Next/Image migration as a sub-pass.
- **Cloudinary** — heavily used (env var `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dhueyqvid` per [`apps/super-app/.env.example:20`](apps/super-app/.env.example), and `next.config.ts` allows `res.cloudinary.com` as a `remotePatterns` entry per [`apps/account/next.config.ts:18`](apps/account/next.config.ts)). The shell should build a `<DivisionImage>` primitive that auto-applies Cloudinary URL transforms + Next/Image dimensions.
- **RSC vs client** — account home is fully server-rendered; only inner widgets are client components. `force-dynamic` is on most authenticated routes (correct given per-user data). The shell can safely stream RSC + use Suspense for sub-widgets.

### C.10 Structural critique of the existing dashboards (the input to the rebuild prompt)

Holding all of the above in mind, here is the ruthless critique:

**The current "dashboard" is three different products with three different vocabularies, three different design systems, and three different data layers — bound by shared cookie scope and a vague aesthetic family.**

1. **Implicit information architecture today**: a user with multiple roles must know which subdomain to visit for which task. A customer who is also a marketplace vendor and a staff member uses three URLs, three sign-in flows (well-papered-over), and three mental models. The unified rebuild's job is to collapse this without losing the per-role density.

2. **Decorative cards and dead CTAs**: confirmed in Care (`apps/care/app/admin/page.tsx`'s 5 tiles are styled but unwired — "Ready for live wiring"). Likely echoed elsewhere. The rebuild's verification gate (E.9 below) must be merciless: every CTA must be LIVE, no DECORATIVE allowed.

3. **Duplication**: `getStaffIntelligenceSnapshot` (apps/staff) and `getOwnerOverviewData` (apps/hub) and `getDashboardSummary` (apps/account) compute overlapping things — open support, queued notifications, recent activity, lifecycle signals. A `packages/data/` layer can collapse this.

4. **Division concerns leaking into shells**: the account home page hard-codes the four-division services row (Care/Marketplace/Jobs/Studio) and omits Property/Learn/Logistics/Hotel/Building. This is the wrong shape for an extensible shell — divisions should *register* into the shell rather than the shell hand-curating them.

5. **Workspace surface is broken**: A.4-1, A.17-1. The rebuild can fix this by abandoning the `staffhq.*` host architecture and folding staff workspace into the unified shell at `account.henrycogroup.com/dashboard?role=staff` (or a sibling host like `app.henrycogroup.com`).

6. **Notifications-UI is account-only**: A.3-1. The shell rebuild must promote notifications-ui to a foundation that all surfaces consume.

7. **No shared dashboard primitives**: C.2-1. Three apps reinvent metric cards, panels, headers. The shell rebuild lands `@henryco/dashboard-ui`.

8. **No shared command palette / search**: C.5-1. Cmd+K in the rebuild needs a single ranked source.

9. **The owner-stated "unwanted" is justified**: cloth picker long-scroll (Care), heavy raw `<img>`s (Marketplace, Property), missing button states (Marketplace, Property), unpremium request selector (Studio), modal mobile overflow (Hub division detail, Company-Hub division-detail-modal). All are artefacts of patchwork additions on top of three independently-evolving dashboards. Fixing each in isolation would not solve the meta-problem; only a unified shell with first-class mobile + state primitives does.

> **The rebuild's purpose, in one sentence:** stop maintaining three (four) dashboards, and replace them with one role-aware shell that registers division modules, owns the signal feed + command palette + notification spine + mobile sheet vocabulary as first-class primitives.

---

## D. Rebuild preconditions, risks, and shell↔module contracts

### D.1 Hard dependencies that must resolve before rebuild starts

| Precondition | Status (from repo) | Blocking? | Where it lives |
|---|---|---|---|
| **Pre-Notification Hardening (V2-PNH-04) — Auth SMTP proof received** | UNVERIFIED in code (commit `edf363f V2-PNH-04: cleanup queue` landed; SMTP proof is an ops/Brevo confirmation, not a code artefact) | **YES — blocking** | Confirm with ops before starting Sub-Pass 1 |
| **Cross-Division Notifications schema** | LANDED — V2-NOT-01-A, B, V2-NOT-02-A migrations in apps/hub/supabase/migrations | No | §A.8 |
| **Realtime publication on `customer_notifications` + `staff_notifications`** | LANDED | No | [`apps/hub/supabase/migrations/20260501130000_*.sql`](apps/hub/supabase/migrations/20260501130000_notification_realtime_publication.sql), [`apps/hub/supabase/migrations/20260502120000_*.sql`](apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql) |
| **`is_staff_in()` predicate** | LANDED | No | §A.7 |
| **Email rail separation (V2-PNH-03B)** | LANDED | No | §A.18 |
| **Shared cookie domain** | LANDED | No | §C.1 |
| **Canonical address selector (V2-ADDR-01)** | LANDED #12 | No | recent commit log |
| **Premium chat composer (V2-COMPOSER-01)** | LANDED #11 across 5 surfaces (account, care, jobs, studio confirmed; 5th to verify) | No | recent commit log |
| **Lifecycle snapshot (V2 lifecycle)** | LANDED `20260424140000_customer_lifecycle_snapshot.sql` | No | apps/account home consumes it |
| **Staff workspace at `apps/staff`** | LANDED + functional | No | §A.16 |
| **Workspace surface redirect-loop fix (apps/hub)** | UNFIXED — A.4-1 | NO (rebuild replaces it) | §A.4 |

> **Audit Finding D.1-1 (single hard blocker):** Auth SMTP proof for Brevo. Without it, the customer signup/auth email rail risk recurs (the prior production-signup outage that caused V2-PNH-03B). The rebuild prompt should require `auth.users` magic-link + signup confirmation tested end-to-end on preview before merging into main.

### D.2 Data that must exist before rebuild can be verified

For each role × division combination, seeded data covering empty / partial / populated / error states:

| Role | Divisions to seed | Data needs |
|---|---|---|
| Customer (no purchases yet) | n/a | Empty state on metrics, attention panel, recent activity, recent notifications |
| Customer (active) | care, marketplace, jobs (saved), property (saved), learn (enrolled) | One booking, one order, two saved jobs, two saved properties, one enrolled course |
| Customer (problem) | wallet (pending verification), notifications (unread × 3), trust (verification pending) | Attention panel populated |
| Owner | n/a | Real or synthetic 6-metric set, a few signals, audit log entries |
| Staff `support` | care, marketplace, jobs, property, learn (the default home divisions) | Open support threads in each |
| Staff `operations_staff` | care, property, learn | Active queues per division |
| Staff `rider` | care, logistics | Pickup/delivery queue items |
| Staff `marketplace_admin` | marketplace | Approval queue, dispute, payout pending |
| Staff `property_admin` | property | Listing moderation queue |
| Staff `learn academy_admin` | learn | Teacher applications, course approvals |
| Staff `studio` (sales/PM/delivery) | studio | Pipeline at multiple stages |

Seeding scripts already exist per app: `apps/marketplace/scripts/seed-marketplace.mjs`, `apps/property/scripts/seed-property.mjs`, `apps/learn/scripts/seed-learn.ts`, `apps/jobs/scripts/seed-jobs.mjs`, `apps/studio/scripts/seed-studio.mjs`. **The rebuild prompt should require these to extend with role-coverage seeds.**

### D.3 Risk register (ranked)

| Rank | Risk | Severity | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | **Auth/session continuity regression** during shell migration — shared cookie writes broken on a single division leak users out cross-app | CRITICAL | MEDIUM | Pre-rebuild: snapshot existing cookie write tests; rebuild Sub-Pass 1 must pass auth-continuity Playwright matrix unchanged | Rebuild executor + ops |
| 2 | **RLS regression** if rebuild introduces new server-side aggregation routes that bypass user-context | CRITICAL | LOW–MEDIUM | All shell aggregations must use server-session client where row-scoping matters; service-role only for cross-tenant aggregates with explicit allowlist | Rebuild executor |
| 3 | **Realtime subscription scaling** — single shell-level subscription to `customer_notifications` + `staff_notifications` + division-specific channels could overwhelm Supabase realtime quotas | HIGH | LOW (Supabase realtime scales) | Subscribe once per session; fan to widgets via React context; throttle reconnections | Rebuild executor |
| 4 | **Workspace surface migration** — users currently on `staffhq.*` will land on a moved surface | HIGH | n/a (broken anyway per A.4-1) | 308 redirect from `workspace.*` and `staffhq.*` to the new canonical host on day-1 | Rebuild executor |
| 5 | **Mobile layout regressions** — promoting per-app primitives to shared could shift sizing | MEDIUM | MEDIUM | Visual regression tests on at least 3 viewports (375×667, 414×896, 768×1024) per shell page | Rebuild executor |
| 6 | **Performance — signal feed query cost** crossing 8+ tables × 7 divisions × user-scoping | MEDIUM | MEDIUM | Materialized view or function returning ranked signals; cap at N=50 with cursor; cache 30s in RSC | Rebuild executor |
| 7 | **Migration of existing user state** — saved drafts, preferences, in-flight forms must survive shell route changes | MEDIUM | MEDIUM | Preserve every existing API path; only the UI shell changes | Rebuild executor |
| 8 | **Email-fallback worker conflict** with shell signal-feed display logic | LOW | LOW | The cron is independent; mark `email_dispatched_at` is sufficient | n/a |
| 9 | **Notifications-ui duplication** if shell forks vs migrates | LOW | MEDIUM | Migrate apps/account onto shared shell; do not duplicate the package | Rebuild executor |
| 10 | **Cron schedule overlap** between owner-reports + notification-purge if both run on same minute | LOW | LOW | Already staggered (07:05, 03:00, 08:15, *:15) | n/a |

### D.4 Shell vs workspace-module contracts

What the shell owns forever:
- Identity bar (avatar, role pill, role switcher, sign-out)
- Workspace rail (left sidebar) listing role-eligible workspace modules — registered, not hard-coded
- Workspace slot — current module renders here
- Context drawer — notifications inbox + signal feed + command palette
- Realtime subscription (customer_notifications, staff_notifications)
- Email-fallback awareness (read `email_dispatched_at` to dim already-emailed signals)
- Quiet hours / muted preferences enforcement at the rendering layer
- Mobile chrome (bottom action bar + sheet primitives)
- Empty state vocabulary
- Loading vocabulary (skeletons, RSC streaming Suspense fallbacks)
- Error vocabulary (error.tsx + retry primitives)
- Theme tokens
- Motion tokens
- Accessibility primitives (focus-visible ring, dialog primitives, live region)
- Keyboard map (Cmd+K palette, ?+ shortcut hints)
- Telemetry emission (event-taxonomy.md events)

What each workspace module contributes via registration:
- Module slug (e.g. `care`, `marketplace`, `studio`)
- Display name + icon + accent (from `COMPANY.divisions[slug]`)
- `getHomeWidgets(viewer): Widget[]` — server-side function returning the module's home widgets
- `getCommandPaletteEntries(viewer): PaletteEntry[]` — module-specific commands (e.g. "Create job posting", "Approve seller application")
- `getNotificationCategories(): Category[]` — which notification categories this module owns
- `getEmptyTeaching(): TeachingContent` — what to show when this module's home is empty for this viewer
- `getDeepLinkTemplate(eventType): string` — for notification → workspace deep link
- `getRoleGate(viewer): RoleDecision` — does the viewer see this module at all? at what permission level?

Module home widget contract:
```ts
type Widget = {
  id: string;
  title: string;
  // Server-rendered React node; the shell composes it into the home layout.
  render: () => Promise<ReactNode>;
  // Layout hint — actual placement decided by shell heuristics.
  size: "sm" | "md" | "lg";
  // For ranking on a busy home page.
  weight: number;
  // For empty/loading/error fallbacks.
  empty?: () => ReactNode;
  loading?: () => ReactNode;
  error?: (e: unknown) => ReactNode;
};
```

This contract makes new divisions (`building`, `hotel`) trivial to add: register a module file in the divisions catalog and the shell picks it up.

> **Update to C.6-1:** [`apps/care/lib/resend-server.ts`](apps/care/lib/resend-server.ts) is for **receiving** Resend inbound email (a separate SDK use-case from sending). Not a governance violation; left as a "normalize / document" cleanup item.

---

## E. Rebuild prompt (companion document)

The self-authored rebuild forged prompt lives at [`DASHBOARD-REBUILD-FORGED-PROMPT.md`](./DASHBOARD-REBUILD-FORGED-PROMPT.md) in this same directory. It cites this audit by section anchor and is paste-ready for owner-side review then executor handoff.

---

## Audit complete — summary of findings

**Severity-ranked findings index** (each links back to the section above):
- **CRITICAL — verify live:** A.4-1 (workspace redirect loop), A.17-1 (Care staff routes redirect to broken host)
- **HIGH — gap:** A.3-1 (notifications-ui account-only), A.3-2 (no shared @henryco/auth), C.1-1 (auth duplication), C.2-1 (no shared dashboard primitives), C.3-1 (no shared data layer), C.4-1 (asset confirmed; ranker missing), C.5-1 (search fragmented), C.8-1 (no web observability)
- **MEDIUM — confirmed:** B.marketplace-7 (raw `<img>`), B.property-7 (raw `<img>`), Care admin decorative tiles, Studio request selector
- **LOW — cleanup:** A.2-1 (apps/apps/hub orphan), B.hub-12 (workspace data.ts duplicate), Care `app/app/(staff)/` artefact
- **DOC corrections:** A.17-2 (Care /admin DOES have requireRoles — role-workflow-matrix is stale), B.staff-1 (apps/staff is the working staff workspace, not a thing to replace)
- **ASSETS already shipped (no work needed):** A.8 notification spine, A.16 staff workspace, A.18 email rail separation, V2-ADDR-01, V2-COMPOSER-01, lifecycle snapshot, shared cookie domain

**Single hard blocker for rebuild start:** D.1-1 — confirmation that Brevo Auth SMTP proof has been received by ops (V2-PNH-04 dependency).

**Single biggest architectural opportunity:** consolidate three (four) dashboards + reimplemented role helpers + notification-ui into a shared shell at `account.henrycogroup.com/dashboard` with role-aware workspace-module registration. The contracts for that consolidation are in §D.4.

— end of audit —

