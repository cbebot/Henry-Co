# V3 Backlog — Compiled From V2 Pass Deferrals

**Source:** `.codex-temp/v2-*/report.md` and `.codex-temp/v5-*/report.md`
**Compiled:** 2026-05-03 (V5-4 V2 closure audit)
**Authority:** every entry below is a deferral the originating pass explicitly named in its report. Nothing was invented for this list.

This document is the single load-bearing follow-up list for V3. Items are grouped by intent, not by pass; the originating pass is cited inline so the V3 owner can read the reasoning.

---

## A · Operational gates that must close before V2 can be declared formally closed

These are the items that V5-4 (V2 closure audit) flagged as preventing certification. They are V3-discovery work in name only — most of them are infra provisioning, not feature work.

| # | Item | Origin | What it costs |
|---|---|---|---|
| A1 | Provision Playwright + screenshot baseline runner against Vercel previews; walk every customer-facing flow at 6 breakpoints | V5-3 §8, V5-4 C2 | 1–2d infra + ongoing CI |
| A2 | Provision Lighthouse CI on Vercel previews; baseline top 30 routes (mobile + desktop) | V5-3 §8, V5-4 C4 | 1d infra |
| A3 | Wire `scripts/a11y/audit.mjs` to a real route walker; run axe-core per route | V5-3 §8, V5-4 C4 | the script exists; needs a runner |
| A4 | Mozilla Observatory snapshot on 5 canonical domains (account, hub, marketplace, jobs, property) | V5-3 §8, V5-4 C3 | manual; one hour |
| A5 | RLS coverage report — every user-scoped table verified RLS-on with the right policy | V5-3 §8, V5-4 C3 | needs Supabase admin + pg_dump |
| A6 | Cross-tenant search probe with two test accounts | V5-3 §8 | needs two test accounts |
| A7 | Email-emitting flow walk per division (care@, marketplace@, studio@) | V5-3 §8 | sandbox sender credentials |
| A8 | Notification flow matrix (12 templates × 3 channels) end-to-end with timing | V5-3 §8 | role-grant test users + queue runner |

## B · V5-3 uncommitted work that must ship before closure

V5-3 deep sweep produced real fixes that are still in the working tree on `fix/v5-2-support-dock-mobile-polish`. These need to be committed, PR'd, merged, and deployed before V2 can be considered closed.

| # | Item | Severity | File(s) |
|---|---|---|---|
| B1 | WhatsApp webhook HMAC verification (3 webhooks fail-open without it) | SERIOUS | `apps/care/app/api/webhooks/whatsapp/route.ts`, `apps/property/.../whatsapp/route.ts`, `apps/studio/.../whatsapp/route.ts` |
| B2 | `WHATSAPP_APP_SECRET` provisioned in Vercel (Production + Preview) for care, property, studio. Without it the webhook routes return 401 — correct fail-closed but receivers go silent | SERIOUS (operational) | Vercel env, then redeploy |
| B3 | Jobs `/api/hiring/messages` IDOR fix (auth gate + senderType role validation + per-user rate limit) | SERIOUS | `apps/jobs/app/api/hiring/messages/route.ts`, `apps/jobs/lib/jobs/messages-rate-limit.ts` (new) |
| B4 | Care `/api/care/contact` rate limit (5 req / 60 s) | SERIOUS | `apps/care/app/api/care/contact/route.ts`, `apps/care/lib/support/contact-rate-limit.ts` (new) |
| B5 | Studio `/pick`, `/pick/[slug]`, `/teams`, `/page` template browser + leadership rebuild + 14 ready-made templates catalog | SERIOUS UX | `apps/studio/lib/studio/templates.ts` (new), `apps/studio/app/(public)/pick/[slug]/` (new), `apps/studio/app/(public)/pick/page.tsx`, `apps/studio/app/(public)/teams/page.tsx`, `apps/studio/app/(public)/page.tsx`, `apps/studio/app/request/page.tsx`, `apps/studio/lib/studio/request-presets.ts`, `apps/studio/lib/studio/types.ts` |
| B6 | Studio request scope-step rebuild (Codex prior session: real tech-stack picker with priced deltas) | SERIOUS UX | `apps/studio/components/studio/request-scope-step.tsx`, `apps/studio/components/studio/request-builder.tsx` + 6 sibling files, `apps/studio/lib/studio/{pricing,request-config,actions,workflows,types}.ts` |
| B7 | Property `/search` server-side pagination (`PAGE_SIZE=12`) + above-the-fold image priority | MODERATE | `apps/property/app/(public)/search/page.tsx`, `apps/property/components/property/ui.tsx` |
| B8 | Marketplace `/search` reveal-in-batches of 24 + above-the-fold priority | MODERATE | `apps/marketplace/components/marketplace/search-experience.tsx`, `apps/marketplace/components/marketplace/product-card-client.tsx` |
| B9 | `git rm --cached apps/marketplace/.env.marketplace.pulled` to untrack the Vercel pull artefact (`.gitignore` already has the pattern in V5-3 — file still tracked) | MINOR (token already expired) | git index |
| B10 | Hub `/OneSignalSDKWorker.js` review (untracked file, V5-1 surfaced this) | MINOR | `apps/hub/public/OneSignalSDKWorker.js` |
| B11 | Landing-hero typography re-cap (V5-4 P0 owner pivot 2026-05-03): cap `*-display` clamp upper bounds to ~3.2rem across marketplace, property, learn, studio, jobs, care + hub `HubHomeClient` inline clamp, plus marketplace hero now embeds inline 3-up KPI strip and tightens padding. Owner saw the giant `Buy from verified stores...` headline on marketplace and rejected it as "shallow nonsense". Per `feedback_no_giant_hero_text.md` this rule applies platform-wide. | SERIOUS UX | 7 files: `apps/{marketplace,property,learn,studio,jobs,care}/app/globals.css`, `apps/hub/app/(site)/HubHomeClient.tsx`, `apps/marketplace/app/(public)/page.tsx`, `apps/learn/app/(public)/page.tsx`, `apps/studio/app/(public)/page.tsx` |
| B12 | `packages/brand/` new untracked `Logo.tsx` + `package.json` peer-dep update introduces hub typecheck failure (`Could not find a declaration file for module 'react'`). Add `@types/react` + `react` devDep to `packages/brand` and re-run `pnpm install` before merging the V5-3+P0 PR | SERIOUS (build blocker) | `packages/brand/package.json`, `pnpm-lock.yaml` |

## C · Staff app deployment lag

| # | Item | Severity | Detail |
|---|---|---|---|
| C1 | Staff app last production deploy: `8508f75` (rescue/90z-inner-page-premium-completion, 2026-04-30). Every V2 merge from PNH-04 (PR #7, #9) onwards is missing in production for staff | CRITICAL | Either retrigger the staff deployment from main or investigate why staff stopped auto-deploying. Vercel project `prj_frEwPNZMvSTLtnrJR67DRCApEA19` — last 20 deployments all on or before 2026-04-30. The other 9 web apps redeployed for every V2 merge; staff did not |

## D · Security follow-ups deferred from V5-3 §12

| # | Item | Severity | Notes |
|---|---|---|---|
| D1 | `next@16.1.6` → `>=16.2.3` (DoS GHSA-q4gf-8mx6-v5v3) across all 10 Next apps. Needs preview-deploy verification | SERIOUS | monorepo-wide minor bump |
| D2 | Full CSP (script-src/connect-src/img-src/etc.) for the 8 apps without one. Needs Report-Only soak per app to allowlist Vercel/Supabase/Cloudinary/Brevo/Sentry domains | MODERATE | per-app testing |
| D3 | `Cross-Origin-Resource-Policy: same-origin` extension to all apps | MINOR | per-app testing for Cloudinary embeds |
| D4 | `auth/resend` rate limit (in-memory bucket pattern from `signup-rate-limit.ts`) | MODERATE | tight follow-up |
| D5 | `verify` per-user upload rate limit | MODERATE | tight follow-up |
| D6 | `picomatch` / `@xmldom/xmldom` HIGH advisories in `apps/company-hub` (Expo build toolchain) | MODERATE | build-time only; resolvable via `pnpm.overrides` |
| D7 | Jobs messages: verify caller is participant in conversation (not just role-checked) — V5-3's per-role check closed the immediate impersonation surface but not the conversation-membership gap | MODERATE | needs conversation row read |

## E · Notification system gaps (from V2-NOT-01/02 reports + V5-3 primitive audit)

| # | Item | Origin | Notes |
|---|---|---|---|
| E1 | Hub owner workspace MISSING `notifications-ui` primitive | V5-3 `s2-primitive-audit.md` | bell present in customer apps; owner needs it |
| E2 | Care MISSING `address-selector` and `branded-documents` adoption | V5-3 `s2-primitive-audit.md` | foundations exist; care app needs the wiring |
| E3 | Cross-app notification timing measurement (S6) | V5-3 §8 | publishing surfaces wired; e2e timing not measured |
| E4 | Dead `workspace_notifications` schema collision | V2-NOT-02-A §1.2 (decision C) | left in place; revisit in V3 |

## F · Address system follow-ups (V2-ADDR-01)

| # | Item | Notes |
|---|---|---|
| F1 | Apply `20260502161000_user_addresses_legacy_backfill.sql` legacy migration in production. V2-ADDR-01 required owner sign-off before applying | needs explicit owner authorization |
| F2 | Customer addresses migration: confirm `customer_addresses` and `marketplace_addresses` rows are zero in production (pre-migration data shape was already aligned) | one-time check |
| F3 | KYC review tooling for address proof matcher (A3) | V2-ADDR-01 phased into V3 |

## G · Documents follow-ups (V2-DOCS-01)

| # | Item | Notes |
|---|---|---|
| G1 | Care booking PDF route handler (template ready in `@henryco/branded-documents`) | 5-line route handler, pattern in `apps/account/lib/branded-documents.ts` |
| G2 | Property listing one-pager PDF route handler | same |
| G3 | Jobs application package PDF route handler | same |

## H · Search follow-ups (V2-SEARCH-01)

| # | Item | Notes |
|---|---|---|
| H1 | Wire palette host into remaining 6 division shells (care, jobs, learn, logistics, marketplace, property, studio) — V2-SEARCH-01 wired hub + account only | V2-SEARCH-01 §S5 |
| H2 | Search-index outbox worker runs every minute via `vercel.json` cron — verify timing under realistic load | one-time check |
| H3 | Backfill all existing rows via `scripts/search-backfill.mjs` against production | one-time run |

## I · Auth follow-ups (V2-AUTH-RT-01)

| # | Item | Notes |
|---|---|---|
| I1 | Multi-role chooser screen UX hardening (currently auth/choose works; could surface badge counts for each role) | V2-AUTH-RT-01 §R3 |
| I2 | Cross-subdomain cookie audit re-verified post-V5-2 (V5-2 SupportDock did not touch auth, but worth a smoke) | one-time |

## J · Hero/visual polish follow-ups (V2-HERO-01)

| # | Item | Notes |
|---|---|---|
| J1 | Studio `/pay/[paymentId]` route exists post-V2-HERO-01; V5-3 audit confirms production-grade. Add a `/pay` index that lists outstanding proposals for a logged-in user | UX gap, low priority |
| J2 | Hero card primitive `HenryCoHeroCard` consumed across hub/care/property/studio. Not yet on jobs, learn, marketplace, logistics homes | sweep |
| J3 | Owner pivot 2026-05-03: every landing hero must show capability evidence above the fold (KPI strip, real categories, featured items, verified-seller counts). Marketplace hero now ships an inline 3-up KPI strip; replicate the pattern on property, learn, studio, jobs, care, logistics homes — see `feedback_no_giant_hero_text.md` | UX |

## K · Composer follow-ups (V2-COMPOSER-01)

| # | Item | Notes |
|---|---|---|
| K1 | Care support reply (message mode), studio support reply, jobs hiring composer all use the chat composer. Logistics support has no composer surface yet | sweep |

## L · Cart follow-ups (V2-CART-01)

| # | Item | Notes |
|---|---|---|
| L1 | Property `/account/saved` and jobs `/candidate/saved-jobs` were left with their pre-existing storage. V2-CART-01 unified marketplace; cross-division "saved" model deferred | architectural |

## M · SEO follow-ups (V2-SEO-01 PR-A → PR-B/C)

| # | Item | Notes |
|---|---|---|
| M1 | PR-B: master sitemap-index aggregator (deferred from PR-A) | named |
| M2 | hreflang stub becomes real after `V2-COPY-01` ships | dependent |
| M3 | Per-route metadata sweep (currently `createDivisionMetadata` is per-app; some routes still lean on layout defaults) | sweep |

## N · A11y follow-ups (V2-A11Y-01)

| # | Item | Notes |
|---|---|---|
| N1 | VoiceOver on macOS scheduled as 2-week follow-up (V2-A11Y-01 report header) | screen reader coverage |
| N2 | 11 critical / 63 serious / 42 moderate axe findings cataloged in V2-A11Y-01 — primitives + contrast addressed; per-route remediation is V3 work | sweep |
| N3 | `super-app` (Expo/React Native) has its own a11y stack; not in V2-A11Y-01 scope | separate workstream |

## O · Studio follow-ups (V5-3 templates work)

| # | Item | Notes |
|---|---|---|
| O1 | `demoUrl: null` for all 14 templates intentionally. Each template should get a real preview deploy in V3 | photography + preview deploy |
| O2 | Real headshots for studio leadership (founder named; three role-titled leads need real names) | depends on company |
| O3 | Studio in-app analytics: track which template categories convert at what rate | observability |
| O4 | `/pick` traffic check + price re-baseline at the 30-day mark (V5-3 §9 hand-off suggests scheduling an agent) | scheduled task |

## P · Dashboard rebuild (V2-DASH-PROMPT-HARDEN-01)

V2-DASH-PROMPT-HARDEN-01 produced 8 forged prompts (DASH-1 through DASH-8) plus the V2-FINAL master orchestration prompt. These prompts are the entry points to V3-DASH execution. They are documentation, not code; the dashboard rebuild itself is V3 work.

| # | Item | File |
|---|---|---|
| P1 | DASH-1: shell foundations skeleton | `docs/dashboard/DASH-1-shell-foundations-skeleton.md` |
| P2 | DASH-2: module registry + reference modules | `docs/dashboard/DASH-2-module-registry-reference-modules.md` |
| P3 | DASH-3: remaining modules rollout | `docs/dashboard/DASH-3-remaining-modules-rollout.md` |
| P4 | DASH-4: smart-home signal feed | `docs/dashboard/DASH-4-smart-home-signal-feed.md` |
| P5 | DASH-5: command palette | `docs/dashboard/DASH-5-command-palette.md` |
| P6 | DASH-6: realtime notification spine | `docs/dashboard/DASH-6-realtime-notification-spine.md` |
| P7 | DASH-7: mobile shell | `docs/dashboard/DASH-7-mobile-shell.md` |
| P8 | DASH-8: owner dashboard track-B | `docs/dashboard/DASH-8-owner-dashboard-track-b.md` |

## Q · Long-tail items not assigned to a single pass

| # | Item | Origin |
|---|---|---|
| Q1 | Hardcoded `henrycogroup.com` literals (~30 in care/account) | V5-3 `s1-static-audit.md` minor |
| Q2 | Hex literals in care app (V2-A11Y-01 routed division contrast tokens; care has stragglers) | V5-3 `s1-static-audit.md` minor |
| Q3 | `scripts/search-backfill.mjs` and `scripts/search-verification.mjs` — make these `pnpm` task entries, not loose scripts | V2-SEARCH-01 hand-off |
| Q4 | Beta release toggle / feature flags audit (`docs/feature-status.md` is the source of truth; V2 did not touch it) | V2 closure verification |

---

## Open questions for V3 discovery (V5-5 input)

1. Is the live test infra (Playwright + Lighthouse + axe runners) a pre-V3 prerequisite, or part of V3 scope?
2. Should the staff app deployment lag be diagnosed and fixed before V3 begins, or accepted as a known V3 entry condition?
3. Should V3 attempt the dashboard rebuild (DASH-1 through DASH-8) in one wave, or stage it the way V2 staged its passes?
4. Does the property rules engine, jobs interview room, and other named-but-not-built features from `docs/PRODUCT-GAP-LEDGER.md` constitute V3 or V4 work?

These four questions are the V5-5 starting point.
