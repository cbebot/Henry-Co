# V3 Backlog — Compiled From V2 Pass Deferrals

**Source:** `.codex-temp/v2-*/report.md` and `.codex-temp/v5-*/report.md`
**Compiled:** 2026-05-03 (V5-4 V2 closure audit)
**Refreshed:** 2026-05-09 (V5-4 V2 closure audit — second pass of 2026-05-09; supersedes the earlier 2026-05-09 refresh)
**Authority:** every entry below is a deferral the originating pass explicitly named in its report. Nothing was invented for this list.

This document is the single load-bearing follow-up list for V3. Items are grouped by intent, not by pass; the originating pass is cited inline so the V3 owner can read the reasoning.

> **2026-05-09 second-pass status:** items B5, B6, B7, B8, B11, B12, F1 remain **closed** (strikethrough). Item C1 is **partially closed** (staff caught up to 2026-05-06 then re-stalled). Items B1–B4 are **carry-forward unchanged** — six days passed without merge. Live verification infra A1–A8 is **carry-forward unchanged** (this pass executed point-in-time substitutes for live header + RLS coverage, but the durable infra is still missing). **B1 line corrected**: surface area is 3 webhooks (care + property + studio), not 1 as the earlier 2026-05-09 refresh claimed. **D8 NEW SERIOUS added** — RLS off + anon grants on 4 public tables. **Q5 carries forward** — Supabase migration tracking drift.

---

## A · Operational gates that must close before V2 can be declared formally closed

These are the items that V5-4 (V2 closure audit) flagged as preventing certification. They are V3-discovery work in name only — most of them are infra provisioning, not feature work.

| # | Item | Origin | What it costs |
|---|---|---|---|
| A1 | Provision Playwright + screenshot baseline runner against Vercel previews; walk every customer-facing flow at 6 breakpoints | V5-3 §8, V5-4 C2 | 1–2d infra + ongoing CI |
| A2 | Provision Lighthouse CI on Vercel previews; baseline top 30 routes (mobile + desktop) | V5-3 §8, V5-4 C4 | 1d infra |
| A3 | Wire `scripts/a11y/audit.mjs` to a real route walker; run axe-core per route | V5-3 §8, V5-4 C4 | the script exists; needs a runner |
| A4 | Mozilla Observatory snapshot on 5 canonical domains (account, hub, marketplace, jobs, property). The 2026-05-09 second-pass audit captured a partial header-curl substitute for www + studio; full Observatory grade still owed | V5-3 §8, V5-4 C3 | manual; one hour |
| A5 | RLS coverage report — every user-scoped table verified RLS-on with the right policy. The 2026-05-09 second-pass audit measured live coverage at 98.2% (218/222) and identified the 4 outliers (see D8); a full per-policy correctness review is still owed | V5-3 §8, V5-4 C3 | needs Supabase admin + pg_dump |
| A6 | Cross-tenant search probe with two test accounts | V5-3 §8 | needs two test accounts |
| A7 | Email-emitting flow walk per division (care@, marketplace@, studio@) | V5-3 §8 | sandbox sender credentials |
| A8 | Notification flow matrix (12 templates × 3 channels) end-to-end with timing | V5-3 §8 | role-grant test users + queue runner |

## B · V5-3 uncommitted work that must ship before closure

V5-3 deep sweep produced real fixes that are still uncommitted. These need to be committed, PR'd, merged, and deployed before V2 can be considered closed.

| # | Item | Severity | File(s) |
|---|---|---|---|
| B1 | WhatsApp webhook HMAC verification — **3 webhooks fail-open without it** *(2026-05-09 second-pass correction: care + property webhooks still exist)* | SERIOUS | `apps/care/app/api/webhooks/whatsapp/route.ts`, `apps/property/app/api/webhooks/whatsapp/route.ts`, `apps/studio/app/api/webhooks/whatsapp/route.ts` |
| B2 | `WHATSAPP_APP_SECRET` provisioned in Vercel (Production + Preview) for care, property, studio. Without it the webhook routes return 401 — correct fail-closed but receivers go silent | SERIOUS (operational) | Vercel env, then redeploy |
| B3 | Jobs `/api/hiring/messages` IDOR fix (auth gate + senderType role validation + per-user rate limit) | SERIOUS | `apps/jobs/app/api/hiring/messages/route.ts`, `apps/jobs/lib/jobs/messages-rate-limit.ts` (new) |
| B4 | Care `/api/care/contact` rate limit (5 req / 60 s) | SERIOUS | `apps/care/app/api/care/contact/route.ts`, `apps/care/lib/support/contact-rate-limit.ts` (new) |
| ~~B5~~ | ~~Studio `/pick`, `/pick/[slug]`, `/teams`, `/page` template browser + leadership rebuild + 14 ready-made templates catalog~~ | ~~SERIOUS UX~~ | **CLOSED 2026-05-03 PR #23 `5d29d01`** |
| ~~B6~~ | ~~Studio request scope-step rebuild~~ | ~~SERIOUS UX~~ | **CLOSED 2026-05-03 PR #23 `5d29d01`** |
| ~~B7~~ | ~~Property `/search` server-side pagination (`PAGE_SIZE=12`) + above-the-fold image priority~~ | ~~MODERATE~~ | **CLOSED 2026-05-03 PR #23 `5d29d01`** |
| ~~B8~~ | ~~Marketplace `/search` reveal-in-batches of 24 + above-the-fold priority~~ | ~~MODERATE~~ | **CLOSED 2026-05-03 PR #23 `5d29d01`** |
| B9 | `git rm --cached apps/marketplace/.env.marketplace.pulled` to untrack the Vercel pull artefact (`.gitignore` already has the pattern in V5-3 — file still tracked) | MINOR (token already expired) | git index — **STILL OPEN as of 2026-05-09 second pass** |
| B10 | Hub `/OneSignalSDKWorker.js` review (untracked file, V5-1 surfaced this) | MINOR | `apps/hub/public/OneSignalSDKWorker.js` — still open; OneSignal SW shipped via PR #39 across all apps but `apps/hub/public/OneSignalSDKWorker.js` review specifically not actioned |
| ~~B11~~ | ~~Landing-hero typography re-cap (V5-4 P0 owner pivot 2026-05-03)~~ | ~~SERIOUS UX~~ | **CLOSED 2026-05-03 PR #23 `5d29d01`** (six divisions + hub inline) |
| ~~B12~~ | ~~`packages/brand/` react devDeps~~ | ~~SERIOUS (build blocker)~~ | **CLOSED 2026-05-03 PR #23 `5d29d01`** |

## C · Staff app deployment lag

| # | Item | Severity | Detail |
|---|---|---|---|
| C1 | Staff app deployment lag — newly material on 2026-05-09 because **DASH-9 staff dashboard is not on staff prod** | CRITICAL | **2026-05-09 second-pass refresh:** staff prod still at `53572de` (2026-05-06). Auto-deploy stopped accepting new SHAs after `53572de`. **DASH-9 (`3016c52` + fix-ups), the entire staff dashboard rebuild, is merged to main but NOT running on `staff.henrycogroup.com`.** The DASH-9 SQL artefacts (`is_staff_in`, `is_staff_in_any`, `add_audit_log_v2`, `workspace_set_updated_at`) are confirmed live in production via direct `pg_proc` probe, but the UI is not. Vercel project `prj_frEwPNZMvSTLtnrJR67DRCApEA19`. Recommendation: investigate the GitHub→Vercel webhook for the staff project; manually trigger production deploy of `origin/main` from the Vercel UI |

## D · Security follow-ups deferred from V5-3 §12 + new items from this audit

| # | Item | Severity | Notes |
|---|---|---|---|
| D1 | `next@16.1.6` → `>=16.2.3` (DoS GHSA-q4gf-8mx6-v5v3) across all 10 Next apps. Needs preview-deploy verification | SERIOUS | monorepo-wide minor bump |
| D2 | Full CSP (script-src/connect-src/img-src/etc.) for the 8 apps without one. Needs Report-Only soak per app to allowlist Vercel/Supabase/Cloudinary/Brevo/Sentry domains. **2026-05-09 second-pass audit confirmed this open** — `studio.henrycogroup.com` ships only `Content-Security-Policy: frame-ancestors 'none'`; `www.henrycogroup.com` ships the full CSP; the 8 apps without one need to converge on the www pattern | MODERATE | per-app testing |
| D3 | `Cross-Origin-Resource-Policy: same-origin` extension to all apps | MINOR | per-app testing for Cloudinary embeds |
| D4 | `auth/resend` rate limit (in-memory bucket pattern from `signup-rate-limit.ts`) | MODERATE | tight follow-up |
| D5 | `verify` per-user upload rate limit | MODERATE | tight follow-up |
| D6 | `picomatch` / `@xmldom/xmldom` HIGH advisories in `apps/company-hub` (Expo build toolchain) | MODERATE | build-time only; resolvable via `pnpm.overrides` |
| D7 | Jobs messages: verify caller is participant in conversation (not just role-checked) — V5-3's per-role check closed the immediate impersonation surface but not the conversation-membership gap | MODERATE | needs conversation row read |
| **D8** | **NEW 2026-05-09 second pass — RLS off + anon grants on 4 public tables. `public.wallets` (RLS off, anon DELETE/INSERT/SELECT/UPDATE/TRUNCATE), `public.wallet_transactions` (RLS off, anon INSERT/SELECT/UPDATE/TRUNCATE — no DELETE), `public.care_pricing_items` (RLS off, anon DELETE/INSERT/SELECT/UPDATE/TRUNCATE; 6 rows), `public.care_site_settings` (RLS off, anon DELETE/INSERT/SELECT/UPDATE/TRUNCATE; 1 row). DASH-3 wallet module shipped to production on 2026-05-05 — wallets are empty today (zero rows) but become CRITICAL the moment any real wallet flow lands. care_pricing_items + care_site_settings have non-zero rows TODAY that anyone with the public anon key can update or truncate. Fix: SQL migration enabling RLS + REVOKE from anon/authenticated + appropriate per-table policies (wallets owner-scoped; care tables admin-only with authenticated-SELECT for read flows)** | **SERIOUS** | **`apps/hub/supabase/migrations/2026050X_wallets_care_rls_fix.sql` (new)** |

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
| ~~F1~~ | ~~Apply `20260502161000_user_addresses_legacy_backfill.sql` legacy migration in production~~ | **CLOSED 2026-05-09** — confirmed applied in production via `mcp__claude_ai_Supabase__list_migrations` (version `20260502161000` present) |
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
| P8 | DASH-8: owner dashboard track-B | `docs/dashboard/DASH-8-owner-dashboard-track-b.md` — **2026-05-09:** DASH-8 implementation merged to local as `701030a` on `feat/dash-08-owner-track-b` (1 commit ahead of origin/main; not yet pushed/PR'd as of second-pass refresh) |
| P9 | DASH-9: staff dashboard track-C | `docs/dashboard/DASH-9-staff-dashboard-track-c.md` — **2026-05-09:** merged to main via `3016c52` + fix-ups; SQL applied to production (functions confirmed live this audit pass); **but not yet deployed to staff prod** (see C1) |

## Q · Long-tail items not assigned to a single pass

| # | Item | Origin |
|---|---|---|
| Q1 | Hardcoded `henrycogroup.com` literals (~30 in care/account) | V5-3 `s1-static-audit.md` minor |
| Q2 | Hex literals in care app (V2-A11Y-01 routed division contrast tokens; care has stragglers) | V5-3 `s1-static-audit.md` minor |
| Q3 | `scripts/search-backfill.mjs` and `scripts/search-verification.mjs` — make these `pnpm` task entries, not loose scripts | V2-SEARCH-01 hand-off |
| Q4 | Beta release toggle / feature flags audit (`docs/feature-status.md` is the source of truth; V2 did not touch it). Root README + PROJECT-KNOWLEDGE.md still missing | V2 closure verification |
| Q5 | Supabase migration tracking drift — the linked production migration tracking table has 46 remote-only timestamps not in `apps/hub/supabase/migrations/`. DASH-9 worked around this by applying via `supabase db query --linked --file` (idempotent, bypasses tracking). Run `supabase migration repair --status applied <timestamp>` for each remote-only timestamp until tracking matches local | DASH-9 commit `0255fda` |

---

## Open questions for V3 discovery (V5-5 input)

1. Is the live test infra (Playwright + Lighthouse + axe runners) a pre-V3 prerequisite, or part of V3 scope?
2. Should the staff app deployment lag be diagnosed and fixed before V3 begins, or accepted as a known V3 entry condition?
3. Should V3 attempt the dashboard rebuild (DASH-1 through DASH-9) in one wave, or stage it the way V2 staged its passes? **(Note: 2026-05-09 second-pass audit observed that the dashboard rebuild has effectively *already* shipped one-wave, on top of an unclosed V2 baseline. Question is now retrospective: was this the right call, and what does it teach about V3 sequencing?)**
4. Does the property rules engine, jobs interview room, and other named-but-not-built features from `docs/PRODUCT-GAP-LEDGER.md` constitute V3 or V4 work?
5. **NEW from 2026-05-09 second pass:** D8 — should the wallet/care RLS fix ship as a hot-patch SQL migration immediately, or be folded into V3 work? Wallets are zero-row today, but DASH-3 wallet flows are live and the moment funds move, this becomes a CRITICAL data-loss surface.

These five questions are the V5-5 starting point.
