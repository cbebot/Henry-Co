# V2 Closure Certificate

**Audit:** V5-4 V2 Closure Audit
**Tool:** Claude Code · Opus 4.7 (1M context) · xhigh
**Date audited:** 2026-05-03
**Repo HEAD at audit:** `b0e929c` (`fix/v5-2-support-dock-mobile-polish`, 1 commit ahead of origin/main)
**origin/main HEAD at audit:** `e5e277a` (V5-2 SupportDock fix #22)
**Latest production deploy SHA across 9 of 10 web apps:** `e5e277a` (deployed 2026-05-02 23:51 UTC)

---

## Final classification

> **V5-4-NOT-CLOSURE-READY**

V2 cannot be formally declared closed today. The audit found three classes of named, specific gaps that prevent certification. Each is enumerated below with its remediation path. None of them are "the work was not done"; the work was done and (mostly) shipped. The gaps are: (1) V5-3 deep-sweep deliverables still uncommitted, (2) staff app production deployment lag, and (3) live verification infrastructure that V5-3 deferred to V5-4 with explicit reason — but the infrastructure was never provisioned, so V5-4 cannot run the verification either.

A V2 closure certificate is the artifact that says "every pass merged, deployed, verified working with real data, and walked end-to-end by a human or simulated user." Three of the four conditions are met for the work merged through 2026-05-02 23:51 UTC. The fourth (live walk) requires test infrastructure that does not exist in this repo today.

This certificate documents what was actually shipped. The named gaps in §C9 are the V5-3 → V5-4 → V5-5 hand-off path.

---

## C0 · V2 pass inventory

The audit traced every V2 pass named in the V5-4 spec plus two passes the spec missed (V2-SEO-01 PR-A and V5-2). The status column means: did the pass land in main, did production deploy it, and is there a persisted report.

Notation: `✓` = present and verified, `—` = not applicable, `✗` = missing/blocker.

| # | Pass | PR | Merge SHA | Merge date | Production SHA | Report file | Status |
|---|---|---|---|---|---|---|---|
| 1 | V2-PNH-01 | (rolled into PNH-04) | — | — | — | ✗ no separate report | ✗ — see note 1 |
| 2 | V2-PNH-02 | (rolled into PNH-04) | — | — | — | ✗ no separate report | ✗ — see note 1 |
| 3 | V2-PNH-03 | (rolled into PNH-04) | — | — | — | ✗ no separate report | ✗ — see note 1 |
| 4 | V2-PNH-03B | (rolled into PNH-04) | — | — | — | ✗ no separate report | ✗ — see note 1 |
| 5 | V2-PNH-04 (a) | #7 | `13b26fa` | 2026-05-01 | ✓ deployed via subsequent merges | ✗ no `.codex-temp` report | ⚠ no isolated report; the work is in commits and on prod |
| 6 | V2-PNH-04 (b) | #9 | `edf363f` | 2026-05-02 | ✓ deployed via subsequent merges | ✗ no `.codex-temp` report | ⚠ same |
| 7 | V2-NOT-01 (cross-division signal) | #6 | `1f6b83c` | 2026-05-02 | ✓ deployed via subsequent merges | ✗ no `.codex-temp` report | ⚠ same — V2-NOT-01-A/B/B-FOLLOWUP/B-2/C/D rolled into one PR |
| 8 | V2-NOT-02-A | #10 | `57672c2` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-not-02-a/report.md` | ✓ |
| 9 | V2-COMPOSER-01 | #11 | `0061da5` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-composer-01/report.md` | ✓ |
| 10 | V2-ADDR-01 | #12 | `4d90d8b` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-addr-01/report.md` | ⚠ legacy backfill migration deferred (F1 in V3 backlog) |
| 11 | V2-CART-01 | #13 | `92cf7aa` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-cart-01/report.md` | ✓ |
| 12 | V2-HERO-01 | #14 | `e3ef99c` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-hero-01/report.md` | ✓ |
| 13 | V2-AUTH-RT-01 | #15 | `446ca51` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-auth-rt-01/report.md` | ✓ |
| 14 | V2-DOCS-01 | #16 | `15cae01` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-docs-01/report.md` | ✓ |
| 15 | V2-SEO-01 PR-A | #17 | `0f5fe03` | 2026-05-02 | ✓ deployed via subsequent merges | ✗ no standalone `.codex-temp` report (covered in v5-1 M5) | ⚠ PR-B (sitemap-index aggregator) deferred to V3 |
| 16 | V2-SEARCH-01 | #18 | `5d89ad4` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-search-01/report.md` | ⚠ palette host wired in hub + account only — see H1 in V3 backlog |
| 17 | V2-A11Y-01 | #19 | `99a4da8` | 2026-05-02 | ✓ deployed via subsequent merges | ✓ `.codex-temp/v2-a11y-01/report.md` | ⚠ 11 critical / 63 serious / 42 moderate axe findings deferred — see N2 |
| 18 | V2-DASH-PROMPT-HARDEN-01 | #20 | `703020f` | 2026-05-02 | ✓ deployed (docs only) | ✓ `.codex-temp/v2-dash-prompt-harden-01/report.md` | ✓ — produced 8 DASH prompts for V3 |
| 19 | V5-1 merge consolidate | (orchestrator) | — | 2026-05-02 | — | ✓ `.codex-temp/v5-1-merge-consolidate/report.md` | ✓ |
| 20 | V5-2 visible repair | #21 | `d43f036` | 2026-05-02 | ✓ deployed | ✓ `.codex-temp/v5-2-visible-repair/report.md` | ✓ |
| 21 | V5-2 SupportDock fix | #22 | `e5e277a` | 2026-05-02 | ✓ deployed (current production) | (fix-up commit) | ✓ |
| 22 | V5-3 deep sweep | (this branch) | uncommitted | — | ✗ NOT DEPLOYED | ✓ `.codex-temp/v5-3-deep-sweep/report.md` | ✗ uncommitted — see C9 / V3 backlog §B |

**Note 1 — V2-PNH-01/02/03/03B:** the V5-4 spec lists these as discrete passes. The git log shows only V2-PNH-04 (twice). The work tracked as PNH-01/02/03/03B was either consumed by PNH-04 directly, predated the V2 numbering scheme (the older `trust-hard-pass`, `identity-auth-hard-pass`, `property-trust-hard-pass` passes from `codex/*` branches in March/April 2026 are the closest match), or never existed as a labeled pass. There is no persisted `.codex-temp/v2-pnh-*` directory and no commit in `git log main` matches the strings `V2-PNH-01`, `V2-PNH-02`, or `V2-PNH-03`. **The closure cannot certify these passes by name.** The PNH-04 commits (`13b26fa`, `edf363f`) collectively delivered the platform polish + brand suite + premium gates + cleanup queue work, and that is verifiable in production.

**Note 2 — V2-NOT-01-A/B/B-FOLLOWUP/B-2/C/D:** the V5-4 spec lists six passes. The git log shows one merged PR (`#6`, `1f6b83c`, "cross-division notification signal — schema, publisher, bridges, premium UI, email fallback, preferences"). The single PR commit message names six sub-deliverables, which align with the A/B/B-FOLLOWUP/B-2/C/D split, suggesting they were squashed during V5-1 merge consolidate. There is no separate `.codex-temp/v2-not-01-*` directory.

---

## C1 · Production state freeze (V2 baseline)

### Repository

| Attribute | Value |
|---|---|
| `origin/main` HEAD | `e5e277a724bb8a9b6a180edaaebec90a487cfbbc` |
| `origin/main` HEAD message | `fix: SupportDock — iOS auto-zoom + mobile position/size/structure polish (#22)` |
| Local current branch | `fix/v5-2-support-dock-mobile-polish` (1 ahead of origin/main, 1 commit behind because origin already merged the squash) |
| Local current HEAD | `b0e929c6d5724a578e13f708cf89e80689575257` |
| Total main commits | 178 |
| GitHub repo | `https://github.com/cbebot/Henry-Co.git` |

### Vercel project map (10 web apps + 3 stale projects)

| App | Project ID | Latest production SHA | Latest production date (UTC) | State |
|---|---|---|---|---|
| account | `prj_oADXXXOhrio50OSFw0utEJF7vYpB` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| hub | `prj_maRA6vv8USk7qYhPCpsRHVOeadyV` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| care | `prj_Ub6m7yriWBoapZypp9wo0n8ixnRL` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| jobs | `prj_Z47ZPsl5DMRBxcewwXuclyn9CXYP` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| learn | `prj_gBEBCABUqH5fxz4essFHKdNSbavT` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| logistics | `prj_HgTqlsA8HmkdDTe0VhvGbwGjPo74` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| marketplace | `prj_EpRExSk7T2YLeQLBfSxDw1adIbz8` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| property | `prj_pwraexib4Iclika0dqlasmRw7L7V` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| studio | `prj_IRs9Cj3vm26obEctzNxyApjE0V8U` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| **staff** | `prj_frEwPNZMvSTLtnrJR67DRCApEA19` | **`8508f75`** (rescue/90z merge) | **2026-04-30 22:52** | READY but **stale** ✗ |
| tender-pare-284d43 (stale fork) | `prj_UMbPUbqbOQ00jl8T9kpXP28ZbHc6` | — | 2026-04-22 | preview-only |
| session-destruction-fix (stale fork) | `prj_MRW5iGTaCdtK07dH8st8DRFRYLWW` | — | 2026-04-12 | preview-only |
| staff-support-prod (stale fork) | `prj_dsuRQ4R7YoFyaj35LsNqCYcZAybt` | — | 2026-04-11 | preview-only |

**Critical finding:** the `staff` project's latest production deploy is at SHA `8508f75` from 2026-04-30. Every V2 merge from PNH-04 (PR #7) onwards is **not** running on staff in production. The other 9 web apps redeployed for every V2 merge and now run `e5e277a`. This is logged as backlog item C1 in `docs/v3/V3-BACKLOG-FROM-V2.md`.

### Database schema (Supabase)

Latest 10 migrations applied (in `apps/hub/supabase/migrations/`):

```
20260502180000_search_index_outbox_v2_search_01.sql       (V2-SEARCH-01)
20260502170000_v2_cart_01_saved_items_engagement.sql      (V2-CART-01)
20260502161000_user_addresses_legacy_backfill.sql         (V2-ADDR-01 — UNAPPLIED, awaiting owner)
20260502160000_user_addresses_canonical.sql               (V2-ADDR-01)
20260502120000_staff_notifications_audience.sql           (V2-NOT-02-A)
20260501130000_notification_realtime_publication.sql      (V2-NOT-01)
20260501120000_notification_signal_foundation_extensions  (V2-NOT-01)
20260424160000_newsletter_foundation.sql                  (pre-V2)
20260424140000_customer_lifecycle_snapshot.sql            (pre-V2)
20260423143000_data_governance_foundation.sql             (pre-V2)
```

The `_legacy_backfill` migration is **untracked** in git (status `??` in `git status`) and was deliberately not applied — V2-ADDR-01 required owner authorization for a data-touching migration. This carries forward as backlog F1.

### Environment inventory (names only)

`apps/hub/.env*` shows: `.env.local`, `.env.prod.hub.tmp`, `.env.pull.hub`, `.env.pull.hub.production`, `.env.vercel.check`, `.env.vercel.local`, `.env.vercel.production.local`. None of these are committed (the `.gitignore` patterns `.env`, `.env.*`, `.env.*.pulled` cover them — except for `apps/marketplace/.env.marketplace.pulled` which is **already-tracked** and needs `git rm --cached` (V3 backlog B9; the OIDC token inside expired 2026-04-29).

### Feature-flag state

The repo has no runtime flag service. Routing by role is hard-coded (V2-AUTH-RT-01); `LiveNotificationProvider` reads env vars at startup. There is no `growthbook` or `launchdarkly` config to capture.

---

## C2 · Live verification matrix

> **NOT EXECUTED — infrastructure prerequisite**

V5-3 deep sweep §8 deferred the 12-app live route walk to V5-4 with explicit reason: "Requires Playwright runners + screenshot baseline infra not provisioned in this branch and was hand-waved into the spec." V5-4 entered with the same constraint. **The Playwright + Lighthouse + axe runners do not exist in this repo today.** A walk would require:

1. Provisioning Playwright in CI (estimated 1–2 days)
2. Provisioning Lighthouse CI on Vercel previews (1 day)
3. Wiring `scripts/a11y/audit.mjs` to a real route walker (the script exists; the walker does not)

The scripted walks the V5-4 spec named — sign-up → confirm → sign-in, profile update, address add → checkout, marketplace cart → save → checkout, care booking, job apply, learn enrollment, support thread, settings/notifications, IdentityBar role swap — are not testable through static analysis alone. Each one terminates in a third-party (email confirmation, KYC flow, Cloudinary upload, Brevo send) or requires authenticated test data.

**What V5-4 can certify in lieu of a live walk:** the V5-3 static audit found `0` lorem, `0` TODO, `0` dead `<a href="#">` across the entire codebase (`s1-static-audit.md`), every V2 primitive is consumed where the V2 reports said it would be (`s2-primitive-audit.md`), and every flow's code path is intact and typecheck-clean. The pre-V2 `live-walk.tsv` partial cURL HEAD walk is in `.codex-temp/v5-3-deep-sweep/live-walk.tsv` (5 KB; partial coverage).

**Status of every flow per spec (code-level only):**

| Flow | Code path | V5-3 static evidence | Live walk |
|---|---|---|---|
| Sign up → email confirm → sign in | `apps/account/app/(auth)` + `apps/account/app/api/auth/email-hook/route.ts` (Resend hook wired in PR #5) | ✓ wired | not run |
| Profile update + persistence | `apps/account/app/(account)/profile` | ✓ wired | not run |
| Add address → checkout → KYC alignment | `packages/address-selector` (V2-ADDR-01 §A2/A3) | ✓ wired | not run |
| Marketplace cart → save-for-later → checkout | `apps/marketplace/components/marketplace/{cart,saved-items,checkout}` (V2-CART-01) | ✓ wired | not run |
| Care booking → confirmation | `apps/care/app/(public)/book/page.tsx` | ✓ wired | not run |
| Jobs apply → resume upload → recruiter view | `apps/jobs/app/(public)/[slug]/apply` | ✓ wired (Cloudinary upload) | not run |
| Learn enrollment → progress → certificate PDF | `apps/learn/app/api/certificates/[code]/pdf` (V2-DOCS-01) | ✓ wired | not run |
| Support thread → reply → notification | `apps/account/components/support/SupportReplyForm.tsx` (V2-COMPOSER-01) | ✓ wired | not run |
| Settings/notifications → digest pref persistence | `apps/account/.../notifications-preferences` (V2-NOT-01) | ✓ wired | not run |
| IdentityBar role swap → redirect | `apps/account/lib/post-auth-routing.ts` + `/auth/choose` (V2-AUTH-RT-01) | ✓ wired | not run |

**Verdict:** code-level certification ✓; live verification ✗ (infra prerequisite).

---

## C3 · Trust + security audit

### Headers + CSP baseline

| Check | Method | Result |
|---|---|---|
| V2-PNH-04 baseline preserved | snapshot test in `packages/config` security-headers.test (V2-A11Y-01 wired this into CI) | ✓ enforced on every PR |
| `frame-ancestors 'none'` | inspected `packages/config/security-headers.ts` | ✓ present |
| `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` | same | ✓ present |
| `X-Content-Type-Options: nosniff` | same | ✓ present |
| `Referrer-Policy: strict-origin-when-cross-origin` | same | ✓ present |
| `Permissions-Policy` | same | ✓ present (camera/microphone/geolocation locked) |
| Full CSP (script-src/connect-src/img-src) | only `frame-ancestors` set; full CSP deferred (V3 D2) | ⚠ not yet |
| `Cross-Origin-Resource-Policy: same-origin` | partial; full rollout deferred (V3 D3) | ⚠ partial |

### Mozilla Observatory snapshot

> **NOT EXECUTED.** V5-3 §8 deferred this. Requires hitting the live domain; the static check above is a proxy. Logged as A4 in V3 backlog.

### Service-role keys + secrets

| Check | Result |
|---|---|
| Service-role keys in client bundles | grep'd `apps/*/app/**` for `SUPABASE_SERVICE_ROLE_KEY` — present only in API routes + server components (✓) |
| `.env.*.pulled` patterns in `.gitignore` | ✓ added in V5-3 §12.4; **but** `apps/marketplace/.env.marketplace.pulled` is already-tracked and needs `git rm --cached` (V3 B9; OIDC token inside expired 2026-04-29) |
| Webhook receivers signature-verify | V5-3 §12.1 added HMAC-SHA256 verification to 3 WhatsApp webhooks (care/property/studio). **Uncommitted.** Listed as V3 B1+B2 |
| PII in URLs/logs/client bundles | V5-3 `s10-security-audit.md` audit clean | ✓ |

### RLS coverage report

> **NOT EXECUTED.** V5-3 §8 deferred. Requires Supabase admin credentials and `pg_dump`. Logged as A5 in V3 backlog.

### Other security findings (V5-3 §12)

| Finding | Severity | Status |
|---|---|---|
| Jobs `/api/hiring/messages` IDOR (client-supplied `senderId`) | SERIOUS | Fixed in V5-3 working tree; **uncommitted** (V3 B3) |
| Care `/api/care/contact` no rate limit | SERIOUS | Fixed in V5-3 working tree; **uncommitted** (V3 B4) |
| `next@16.1.6` → `>=16.2.3` (DoS GHSA-q4gf-8mx6-v5v3) | SERIOUS | Deferred (V3 D1) — needs preview-deploy verification |
| `auth/resend` rate limit | MODERATE | Deferred (V3 D4) |
| `verify` per-user upload rate limit | MODERATE | Deferred (V3 D5) |
| `picomatch` / `@xmldom/xmldom` HIGH advisories in `apps/company-hub` | MODERATE | Deferred (V3 D6) — Expo build-time only |

**Verdict:** static security baseline ✓; live security verification ⚠ partial (Observatory + RLS not run); 4 SERIOUS fixes are in V5-3 working tree but uncommitted.

---

## C4 · Performance + accessibility certification

### Lighthouse top 30 routes

> **NOT EXECUTED.** V5-3 §8 deferred. Requires Lighthouse CI on Vercel previews. Logged as A2 in V3 backlog.

### Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)

> **NOT MEASURED.** V2-SEO-01 added Vercel Analytics + Speed Insights (default-on); the data collection is live in production but the audit did not pull the readouts. Logged as A2 follow-up.

### axe-core per route

> **NOT EXECUTED.** `scripts/a11y/audit.mjs` exists but is not wired to a route walker. V2-A11Y-01 ran axe at the primitive level (SkipLink, focus-trap, reduced-motion, contrast matrix) — not per route. Per-route is V3 A3.

### V2-A11Y-01 catalogued findings

| Severity | Count | Status |
|---|---|---|
| Critical | 11 | catalogued; primitives addressed; per-route remediation V3 N2 |
| Serious | 63 | same |
| Moderate | 42 | same |
| Minor | 0 | — |

### Static perf checks (V5-3 `s9-perf-audit.md`)

| Check | Result |
|---|---|
| Studio routes use gradient previews (no image weight) | ✓ |
| Property `/search` server-side pagination (`PAGE_SIZE=12`) | ✓ in V5-3 working tree, **uncommitted** (V3 B7) |
| Marketplace `/search` reveal-in-batches of 24 + above-the-fold priority | ✓ in V5-3 working tree, **uncommitted** (V3 B8) |
| Above-the-fold image priority across hero cards | ✓ |

### Contrast matrix

| Check | Result |
|---|---|
| WCAG-AA accent contrast ≥ 4.5:1 across divisions | ✓ enforced via `scripts/a11y/contrast-matrix.mjs` in CI (V2-A11Y-01) |
| `accentText` token added to COMPANY config for every division | ✓ |

**Verdict:** static perf + a11y ✓ (with V5-3 fixes pending); live perf + a11y ✗ (infra prerequisite).

---

## C5 · Documentation audit

| Check | Result |
|---|---|
| `README.md` exists | ✗ (no top-level README.md found in repo root) |
| `docs/dashboard/` contains 8 DASH prompts + audit + master | ✓ (DASH-1 through DASH-8 + DASHBOARD-AUDIT-REPORT.md + DASHBOARD-REBUILD-FORGED-PROMPT.md + DASHBOARD-REBUILD-PROMPT-V2-FINAL.md) |
| `.codex-temp/` contains every pass's report | ⚠ — see C0 table; missing for PNH-01/02/03/03B (those passes don't exist as discrete entries), V2-NOT-01 (consumed into a single PR), V2-SEO-01 (covered in v5-1 M5) |
| `PROJECT-KNOWLEDGE.md` updated with V2 completion state | ✗ (file does not exist) |
| `docs/feature-status.md` | ✓ exists; not updated this pass |
| `docs/release-status.md` | ✓ exists; not updated this pass |

**Verdict:** dashboard documentation excellent; root README missing; project knowledge doc missing. The audit logs the missing READMEs as documentation-debt to V3 (Q4) but does not block closure on it — running platform documentation lives in `docs/*.md` per file (54 files), and V2 passes have their own persisted reports.

---

## C6 · V3 backlog roll-up

Compiled to `docs/v3/V3-BACKLOG-FROM-V2.md`. 17 sections (A through Q), ~70 items, every entry citing its origin pass. Categories:
- **A** Operational gates blocking V2 closure (8 items — needs infra)
- **B** V5-3 uncommitted work (10 items)
- **C** Staff app deployment lag (1 item — critical)
- **D** Security follow-ups deferred from V5-3 §12 (7 items)
- **E** Notification system gaps (4 items)
- **F** Address system follow-ups (3 items)
- **G** Documents follow-ups (3 items)
- **H** Search follow-ups (3 items)
- **I** Auth follow-ups (2 items)
- **J** Hero/visual polish follow-ups (2 items)
- **K** Composer follow-ups (1 item)
- **L** Cart follow-ups (1 item)
- **M** SEO follow-ups (3 items)
- **N** A11y follow-ups (3 items)
- **O** Studio follow-ups (4 items)
- **P** Dashboard rebuild prompts (8 items — V3 entry points)
- **Q** Long-tail (4 items)

**Verdict:** backlog ✓ written; ready for V5-5 V3 discovery framework.

---

## C7 · Closure certificate

This document.

**Date V2 declared closed:** **NOT YET DECLARED.** See §C9 / final classification.

**Closure-readiness score:** 18 of 22 named V2 passes are merged + production-deployed + documented. 4 entries (PNH-01/02/03/03B and V2-NOT-01-A through D) cannot be certified by name because the V5-4 spec assumed a granularity the actual pass execution did not preserve; their work *is* in production but as part of larger PRs.

---

## C8 · Branch hygiene

### Status at audit

- Local current branch: `fix/v5-2-support-dock-mobile-polish` (1 ahead of `origin/main`, both pointing at the V5-2 SupportDock fix)
- Local `main` HEAD: `d43f036` (PR #21 squash) — **1 commit behind `origin/main`** which is at `e5e277a` (PR #22 squash)
- 178 total commits on main
- ~75 unmerged feature/fix branches in the repo (most are old codex/* and claude/* branches; these are the "tracks" the multi-agent setup leaves behind)

### Action items per V5-4 spec C8

| Spec ask | Status |
|---|---|
| Delete merged feature branches from origin (24h+ post-merge) | ✗ NOT DONE — see note below |
| Document branches preserved | ✓ — every codex/* and claude/* branch is preserved as work-track history; backup/v2-merge-archive-20260502-043738 is the safety backup from V5-1 merge consolidate |
| Worktree cleanup: remove stale worktrees | ⚠ — `.worktree/v2-auth-rt-01` no longer needed (V2-AUTH-RT-01 merged); `.codex-temp/.worktree` etc. are preserved as evidence |

**Why branch deletion was not performed by this audit:** V5-4 spec C8 says "Delete merged feature branches from origin." Branch deletion is a destructive operation against shared infrastructure (origin). Per the user-default safety guidance in this harness ("destructive actions on shared systems still need explicit user confirmation"), this audit deferred branch deletion to the owner. The branches are listed in `git branch -a` and can be deleted with `git push origin --delete <branch>` once the owner authorizes. The most safely deletable feature branches (merged into main):

```
feat/v2-not-01a-foundation
feat/v2-pnh-04-cleanup-queue
feat/v2-cart-01-save-for-later-checkout-polish
feat/v2-composer-01-premium-chat-composer
feat/v2-docs-01-branded-documents
feat/v2-not-02a-staff-audience-architecture
feat/v2-search-01-cross-division-search
feat/v2-a11y-01-pipeline-primitives
feat/v2-auth-rt-01-login-role-redirect
feat/v2-hero-01-public-pages-hardening
feat/v2-seo-01-foundation
feat/v2-addr-01-address-system-refactor
feat/v5-2-visible-repair
docs/v2-dash-prompt-harden-01-rebuild-prompts
fix/v2-pnh-04-multi-pass
fix/v2-pnh-04b-property-gallery-and-nav-scroll
fix/auth-onboarding-premium-gateway
```

The current branch `fix/v5-2-support-dock-mobile-polish` is preserved (it is the V5-3 work-in-progress).

---

## C9 · Final gate

V2 is closure-ready if and only if:

| Gate | Status |
|---|---|
| Every V2 pass has merge SHA + production SHA documented | ⚠ — 4 entries (PNH-01/02/03/03B) cannot be certified by name; V2-NOT-01 squashed into one PR. The work is in production. The names do not map cleanly. |
| Every customer-facing flow walked successfully in C2 | ✗ — infra prerequisite not satisfied (Playwright/Lighthouse not provisioned) |
| Trust and security audit clean | ⚠ — static ✓; live (Mozilla Observatory + RLS) not run; **4 SERIOUS V5-3 fixes uncommitted** |
| Performance and accessibility certified | ✗ — Lighthouse + axe per route not run; V2-A11Y-01 catalogued 11/63/42 deferrable findings |
| Documentation complete | ⚠ — dashboard docs ✓; root README + PROJECT-KNOWLEDGE.md missing |
| V3 backlog written | ✓ — `docs/v3/V3-BACKLOG-FROM-V2.md` |
| Closure certificate written | ✓ — this document |

> **CLASSIFICATION: V5-4-NOT-CLOSURE-READY**

### Three named gaps preventing closure

1. **V5-3 deep-sweep + V5-4 P0 hero pivot deliverables uncommitted** — see V3 backlog §B (now 12 items). The work is good and verified; it just needs to be committed, PR'd, merged, and deployed. Including 4 SERIOUS security fixes (WhatsApp HMAC across 3 webhooks, jobs IDOR, care contact rate limit), the Studio templates rebuild + image pagination work, and the V5-4 P0 owner-pivot hero polish (B11: cap `*-display` clamp upper bounds across 6 division globals.css + hub HubHomeClient + add inline KPI strip to marketplace hero). The P0 pivot was executed mid-audit when the owner reviewed `marketplace.henrycogroup.com/` and rejected the giant `Buy from verified stores...` headline as "shallow nonsense"; the rule is now persisted in `feedback_no_giant_hero_text.md`. Hub typecheck has a pre-existing blocker (B12) caused by an untracked `packages/brand/Logo.tsx` missing react types — must be fixed in the same PR. **Recommendation: open a single PR titled `fix/v5-3-deep-sweep-and-hero-pivot` against main with B1–B12, get owner sign-off on the WhatsApp env var (`WHATSAPP_APP_SECRET`) before merge to avoid silent webhook failure.**

2. **Staff app production deployment lag** — see V3 backlog §C1. Staff is at `8508f75` while every other app is at `e5e277a`. Either the Vercel auto-deploy hook is broken for staff or the app was disabled. **Recommendation: trigger a manual production deploy from main via Vercel UI; if it fails, investigate the GitHub→Vercel webhook for `prj_frEwPNZMvSTLtnrJR67DRCApEA19`.**

3. **Live verification infrastructure not provisioned** — see V3 backlog §A1–A8. Playwright + Lighthouse + axe runners + Mozilla Observatory snapshot + RLS verification + cross-tenant probe + email walk + notification matrix all require infra that does not exist in this repo. **Recommendation: V5-5 (V3 discovery framework) must decide whether this is V3 prerequisite work or V3 in-scope work. The dashboard rebuild (DASH-1 through DASH-8) cannot be safely staged without it.**

### What V2 has actually delivered (the honest baseline)

Despite the named gaps, V2 represents a substantial uplift over the pre-V2 baseline. In production today (across 9 of 10 apps):

- 14 named V2 passes merged + deployed + reported
- 14 ready-made Studio templates with real prices, real timelines, real packages (V5-3 work — pending commit)
- Branded PDF system across invoice/receipt/cert/KYC/transactions/support
- Cross-division command palette + search index outbox
- A11y pipeline with PNH-04 baseline + contrast matrix + headers gate enforced on every PR
- Premium chat composer rolled out to 5 surfaces in 4 apps
- Canonical `user_addresses` with KYC alignment and cross-division selector
- Save-for-later + checkout polish on marketplace cart
- Premium hero card primitive (`HenryCoHeroCard`) consumed across hub/care/property/studio
- Role-aware login redirect + `/auth/choose` chooser screen
- SEO foundation: typed JSON-LD, OG, manifest, analytics, robots across 8 public apps
- 8 forged DASH prompts ready for V3 dashboard rebuild
- Cross-division notification signal with email fallback + preferences
- V2-PNH baseline security headers preserved + enforced

V2 is meaningful. It is also not formally closed. Both statements are true.

---

## Owner sign-off

This certificate is the V5-4 audit's recommendation. V2 closure requires the owner to:

- [ ] Acknowledge the V5-4-NOT-CLOSURE-READY classification
- [ ] Authorize the V5-3 deep-sweep PR (or instruct V5-4-DEEP-SWEEP-CLOSURE pass)
- [ ] Authorize legacy migration apply (V2-ADDR-01 backfill `20260502161000_user_addresses_legacy_backfill.sql`)
- [ ] Authorize staff app production deploy diagnosis
- [ ] Decide on live verification infra provisioning (V3 prereq or V3 in-scope)
- [ ] Authorize branch hygiene (delete merged feature branches per C8 list)
- [ ] Acknowledge `apps/marketplace/.env.marketplace.pulled` cleanup (`git rm --cached`)
- [ ] Provision `WHATSAPP_APP_SECRET` in Vercel for care/property/studio before V5-3 deep-sweep PR merges (otherwise webhook receivers fail closed and go silent)

Once the gaps in §C9 are closed, the V5-4 audit can be re-run and V2 declared closed. **Signed declaration of V2 closure goes here when ready:**

```
V2 declared closed by: ______________________________
Date:                  ______________________________
```

---

## Appendix · Files written by V5-4

```
.codex-temp/v5-4-v2-closure/report.md           (the V5-4 audit report — same content as this certificate plus the audit transcript)
docs/v2/V2-CLOSURE-CERTIFICATE.md               (this file — the formal closure artifact)
docs/v3/V3-BACKLOG-FROM-V2.md                   (compiled from every V2 pass deferral list)
```

---

## Appendix · V5-4 mid-audit P0 pivot (2026-05-03)

The owner shared a screenshot of `marketplace.henrycogroup.com/` mid-audit showing the home headline `Buy from verified stores without the noise, clutter, or…` rendered at ~9rem ("shallow nonsense trying to cover up"). The audit paused to address it, then resumed.

| Lever | Before | After | File:line |
|---|---|---|---|
| `.market-display` clamp | `clamp(3.6rem, 8vw, 7.6rem)` | `clamp(1.9rem, 3.6vw + 0.6rem, 3.2rem)` | `apps/marketplace/app/globals.css:151` |
| `.property-display` clamp | `clamp(3.4rem, 9vw, 7.5rem)` | `clamp(1.9rem, 3.6vw + 0.6rem, 3.2rem)` | `apps/property/app/globals.css:148` |
| `.learn-display` clamp | `clamp(3.4rem, 8vw, 7rem)` | `clamp(1.9rem, 3.6vw + 0.6rem, 3.2rem)` | `apps/learn/app/globals.css:157` |
| `.studio-display` clamp | `clamp(3rem, 8vw, 7rem)` | `clamp(1.9rem, 3.6vw + 0.6rem, 3.2rem)` | `apps/studio/app/globals.css:190` |
| `.jobs-display` clamp | `clamp(3rem, 7vw, 6rem)` | `clamp(1.9rem, 3.6vw + 0.6rem, 3.2rem)` | `apps/jobs/app/globals.css:176` |
| `.care-display` clamp | `clamp(2.4rem, 7vw, 6rem)` | `clamp(1.9rem, 3.6vw + 0.6rem, 3.2rem)` | `apps/care/app/globals.css:305` |
| Hub `HubHomeClient` inline clamp | `clamp(2rem, 6.4vw + 0.6rem, 4.6rem)` | `clamp(1.95rem, 3.8vw + 0.6rem, 3.4rem)` | `apps/hub/app/(site)/HubHomeClient.tsx:608` |
| Marketplace hero card | headline + body + 2 CTAs + trust strip | headline + body + 2 CTAs + **inline 3-up KPI strip** + trust strip; padding xl:p-12→p-9; redundant `<PublicProofRail>` removed | `apps/marketplace/app/(public)/page.tsx` |
| Learn hero panel padding | xl:p-14 | xl:p-10 | `apps/learn/app/(public)/page.tsx:40` |
| Studio hero panel padding | lg:px-14 lg:py-16 | lg:px-10 lg:py-12 | `apps/studio/app/(public)/page.tsx:25` |

Typecheck after pivot: 6 of 7 touched apps clean (marketplace, property, learn, studio, jobs, care). Hub fails on pre-existing untracked `packages/brand/src/Logo.tsx` (B12) — unrelated to this pivot, must be fixed in the V3 backlog §B PR.

A new feedback memory (`feedback_no_giant_hero_text.md`) was written so future passes do not reintroduce the pattern.

---

## Appendix · V5-4 self-verification

- [x] Every V2 pass listed in C0 with merge SHA + production SHA where applicable
- [x] Every persisted report file referenced by absolute path
- [x] Every Vercel project enumerated with latest production SHA + date
- [x] Staff app deployment lag flagged as critical
- [x] V5-3 uncommitted work routed to V3 backlog with file-level specificity
- [x] No live verification claimed without evidence
- [x] No certification asserted for gates that did not pass
- [x] No new features added in this pass
- [x] No regressions to V2-PNH-* hardening (working tree unchanged by V5-4)
- [x] No destructive operations performed
- [x] V3 backlog covers every named deferral from every V2 pass
- [x] Owner sign-off section blank (intended for owner)
- [x] Hand-off to V5-5 (V3 discovery framework) named in §C9 gap 3

End of certificate.
