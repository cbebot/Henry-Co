# V2 Closure Certificate

**Audit:** V5-4 V2 Closure Audit · Refresh second pass
**Tool:** Claude Code · Opus 4.7 (1M context) · xhigh
**Date audited:** 2026-05-09 (second pass — re-runs the earlier 2026-05-09 refresh; supersedes it on the strength of live database + headers + URL evidence this pass added)
**Repo HEAD at audit (local):** `701030a` on `feat/dash-08-owner-track-b` (1 commit ahead of `origin/main`; DASH-8 owner Track B not yet pushed; 13 files modified-but-uncommitted including this cert + the V3 backlog re-edits this pass is doing)
**`origin/main` HEAD at audit:** `5ef863c34e0d8be87c83a2453fb77a365acd43e8` (`feat(studio): Phase 3b — AI draft refine bot (#65)`)
**Total `origin/main` commits:** 260
**Latest READY production deploy across 9 web apps (hub-mirrored):** `dc7a79e` (Phase 3a messaging-thread engine, 2026-05-09 ~13:53 UTC).
**Staff app:** `53572de` (2026-05-06 ~10:09 UTC) — ~10 commits behind `origin/main`; **DASH-9 staff dashboard not on staff prod** (UI missing; SQL artefacts confirmed live in production).

---

## Final classification

> **V5-4-NOT-CLOSURE-READY** (refresh second pass, 2026-05-09)

V2 still cannot be formally declared closed. This second-pass refresh re-verifies all prior findings against live database + live headers + live URLs and surfaces:

1. One **factual correction** to the earlier 2026-05-09 refresh: B1 (WhatsApp HMAC) surface area is **3 webhooks** (care + property + studio), not 1 as earlier claimed.
2. One **NEW SERIOUS finding (D8)** never previously catalogued: 4 public tables have RLS disabled with `anon` Postgres role holding SELECT/INSERT/UPDATE/DELETE/TRUNCATE grants — `public.wallets`, `public.wallet_transactions`, `public.care_pricing_items`, `public.care_site_settings`. DASH-3 wallet module is in production; wallets are empty today but become CRITICAL the moment any real flow lands.
3. One **partial substitute** for live verification infra: this pass executed live RLS coverage probes (98.2% coverage measured, 4 outliers named), live security-headers snapshots for two canonicals (full CSP on www; CSP `frame-ancestors`-only on studio — D2 evidence), and live URL probes of all 12 production canonicals + apex (11 of 12 OK; hub. subdomain not aliased — informational, not a regression).

The three named gaps that previously prevented closure remain:

- **Gap 1 (V5-3 deep-sweep deliverables):** the **safe subset** closed on 2026-05-03 via PR #23. The **held-back security subset** (B1 WhatsApp HMAC ×3 webhooks, B2 `WHATSAPP_APP_SECRET`, B3 jobs IDOR, B4 care rate limit) **was never merged**. The follow-up PR `fix/v5-3-security-and-migrations` referenced earlier was never opened. Six days have passed.
- **Gap 2 (staff app deployment lag):** **partially closed → re-stalled and newly material.** Staff prod moved from `8508f75` (2026-04-30) to `53572de` (2026-05-06), but auto-deploy stopped accepting new SHAs after that date. **DASH-9 staff dashboard never reached staff prod** despite being merged to main and despite the DASH-9 SQL artefacts (`is_staff_in`, `is_staff_in_any`, `add_audit_log_v2`, `workspace_set_updated_at`) being confirmed live in production this audit pass.
- **Gap 3 (live verification infrastructure):** **unchanged in durable form.** Playwright runner, Lighthouse CI, axe per-route walker, Mozilla Observatory snapshot, full RLS coverage report still not provisioned. This pass added point-in-time substitutes; the durable infra is still owed.

In the same six days, V3 dashboard work (DASH-1 through DASH-9) shipped on top of the unclosed V2. The platform is now executing V3-class changes against a V2 baseline whose closure conditions were never satisfied. This certificate documents that state honestly.

---

## C0 · V2 pass inventory

The 22-row pass inventory from the 2026-05-03 cert is unchanged in content. 18 of 22 V2 passes are merged + production-deployed + reported. 4 entries (PNH-01/02/03/03B and the V2-NOT-01-A/B/B-FOLLOWUP/B-2/C/D split) cannot be certified by name because those passes were squashed into broader PRs during V5-1 merge consolidate; the work is in production but the granularity the V5-4 spec assumed was not preserved.

The full table is in `.codex-temp/v5-4-v2-closure/report.md` §C0.

**Closures since 2026-05-03 (folded into V3 backlog as strikethroughs):** B5, B6, B7, B8, B11, B12 (V5-3 safe subset, all via PR #23 `5d29d01`); F1 (legacy backfill migration applied to Supabase production, version `20260502161000` confirmed via `mcp__claude_ai_Supabase__list_migrations` on this audit pass).

---

## C1 · Production state freeze

### Repository

| Attribute | Value |
|---|---|
| `origin/main` HEAD | `5ef863c34e0d8be87c83a2453fb77a365acd43e8` |
| `origin/main` HEAD message | `feat(studio): Phase 3b — AI draft refine bot in /client message composer (#65)` |
| Total main commits | 260 |
| Local current branch | `feat/dash-08-owner-track-b` (1 commit ahead of `origin/main`; DASH-8 not yet pushed) |
| Local current HEAD | `701030a` |
| Working-tree dirty | yes — 13 files: 8× `apps/*/lib/supabase.ts` adding `import "server-only"`; `apps/learn/lib/learn/seed.ts`; `apps/staff/app/(track-c)/_actions/{bulk-actions,exports}.ts` per-division authorization at the action boundary; plus this pass's edits to the cert + V3 backlog — defense-in-depth hardening in flight, not yet committed |
| GitHub repo | `https://github.com/cbebot/Henry-Co.git` |

### Vercel project map (10 web apps + 3 stale projects, MCP `list_deployments` this pass)

| App | Project ID | Latest READY production SHA | Date (UTC) | State |
|---|---|---|---|---|
| account (henryco-account) | `prj_oADXXXOhrio50OSFw0utEJF7vYpB` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| hub | `prj_maRA6vv8USk7qYhPCpsRHVOeadyV` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| care | `prj_Ub6m7yriWBoapZypp9wo0n8ixnRL` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| jobs | `prj_Z47ZPsl5DMRBxcewwXuclyn9CXYP` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| learn | `prj_gBEBCABUqH5fxz4essFHKdNSbavT` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| logistics | `prj_HgTqlsA8HmkdDTe0VhvGbwGjPo74` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| marketplace | `prj_EpRExSk7T2YLeQLBfSxDw1adIbz8` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| property | `prj_pwraexib4Iclika0dqlasmRw7L7V` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| studio | `prj_IRs9Cj3vm26obEctzNxyApjE0V8U` | `dc7a79e` | 2026-05-09 13:53 | READY ✓ |
| **staff** | `prj_frEwPNZMvSTLtnrJR67DRCApEA19` | **`53572de`** | **2026-05-06 10:09** | **stale ⚠** |
| stale (tender-pare-284d43, session-destruction-fix, staff-support-prod) | — | — | unchanged | preview-only |

The `5ef863c` (Phase 3b) deploy attempt is in `CANCELED` state across all 9 main apps (`dpl_FTxuZUeJQ51xywQdCZqVNBrjjCyd` for hub), so production is currently running `dc7a79e` (Phase 3a). If the owner wants Phase 3b live, they need to retrigger the production deploy from main.

**Critical finding:** the staff app caught up partially — moved from `8508f75` (2026-04-30) → `53572de` (2026-05-06) — but auto-deploy stopped after `53572de`. **Every DASH-* merge after 2026-05-06 is missing from staff prod**, including DASH-9 which is the entire staff dashboard rebuild. `staff.henrycogroup.com` is running V1 chrome with V2 fixes; the V3 staff Track C operator surface is in main but not deployed. The DASH-9 SQL is in production (verified this pass) but the DASH-9 UI is not.

### Live URL probe (this pass)

| Canonical | HTTP | Note |
|---|---|---|
| `henrycogroup.com` (apex) | 200 | hub serves on apex |
| `www.henrycogroup.com` | 200 | hub canonical |
| `account.henrycogroup.com` | 200 | login redirect (correct) |
| `hub.henrycogroup.com` | 404 | DEPLOYMENT_NOT_FOUND — informational only; the hub is on the apex, not this subdomain (no regression) |
| `care.henrycogroup.com` | 200 | |
| `marketplace.henrycogroup.com` | 200 | |
| `jobs.henrycogroup.com` | 200 | |
| `learn.henrycogroup.com` | 200 | |
| `logistics.henrycogroup.com` | 200 | |
| `property.henrycogroup.com` | 200 | |
| `studio.henrycogroup.com` | 200 | |
| `staff.henrycogroup.com` | 200 | login redirect (correct) — running `53572de` |

### Database schema (Supabase production, MCP `list_migrations` this pass)

V2-era migrations confirmed applied:

- `20260502160000` user_addresses_canonical (V2-ADDR-01) ✓
- `20260502161000` user_addresses_legacy_backfill (closes F1 from prior cert) ✓
- `20260502170000` v2_cart_01_saved_items_engagement (V2-CART-01) ✓
- `20260502180000` search_index_outbox_v2_search_01 (V2-SEARCH-01) ✓
- `20260508105640` notification_signal_foundation_extensions (re-applied V2-NOT-01) ✓

V3-era migrations confirmed applied:

- `20260507182134` get_signal_feed (DASH-4) ✓
- `20260504170556` studio_brief_drafts; `20260504133803` jobs_employer_subscriptions; `20260504135*` property/learn init/policies/teacher_applications/unlock_policy

DASH-9 SQL artifacts (NOT in `list_migrations` because they were applied via `supabase db query --linked --file`, bypassing migration tracking — see commit `0255fda`):

Probed live this pass via `pg_proc`:

| Function | Args |
|---|---|
| `add_audit_log_v2` | `p_action text, p_entity_type text, p_entity_id text, p_old_values jsonb, p_new_values jsonb, p_reason text, p_division text, p_correlation_id uuid` |
| `is_staff_in` | `division_key text, role_key text` |
| `is_staff_in_any` | `(no args)` |
| `workspace_set_updated_at` | `(no args)` |

All four functions exist in production. The migration tracking drift carries forward as Q5 in the V3 backlog. **Schema is correct; tracking table is the inconsistency.**

### Environment inventory

| Item | Status |
|---|---|
| `.gitignore` patterns for `.env`, `.env.*`, `.env.*.pulled`, `supabase/.temp` | ✓ in place |
| `apps/marketplace/.env.marketplace.pulled` git-tracked | ✗ **STILL TRACKED** (B9 carries forward; OIDC token expired 2026-04-29) |
| `WHATSAPP_APP_SECRET` env var | not referenced anywhere in code (moot until B1 ships) |
| `ANTHROPIC_API_KEY` | rotated 2026-05-04 (`2494ac0`) |

### Feature-flag state

No runtime flag service. Routing by role is hard-coded; `LiveNotificationProvider` reads env vars at startup. No `growthbook` or `launchdarkly` config to capture.

---

## C2 · Live verification matrix

> **NOT EXECUTED to V5-4 spec** — durable Playwright + Lighthouse + axe runners do not exist in this repo. This pass added point-in-time live evidence (URL probe, header snapshots, RLS coverage) that substitutes for parts of C2/C3 but does not replace the durable infra.

The 10 V2 customer-facing flows (sign up → email confirm → sign in; profile update; address add → checkout; marketplace cart → save → checkout; care booking; jobs apply; learn enrollment + cert PDF; support thread; settings/notifications; IdentityBar role swap) are all wire-checked clean at the code level. None walked end-to-end against a live deployment.

---

## C3 · Trust + security audit

### Headers + CSP

V2-PNH baseline preserved ✓ via `packages/config/security-headers.ts` snapshot test in CI. Live snapshots taken this pass:

- **`www.henrycogroup.com`** ships the full CSP (`default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co https://api.cloudinary.com; media-src 'self' blob: https://res.cloudinary.com; object-src 'none'; upgrade-insecure-requests`) plus all V2-PNH headers (COOP, CORP, Permissions-Policy, Referrer-Policy, HSTS preload, X-Content-Type-Options, X-Frame-Options=DENY) ✓
- **`studio.henrycogroup.com`** ships only `Content-Security-Policy: frame-ancestors 'none'` — **D2 confirmed open** (full CSP for the 8 apps without one is still deferred; studio is one of them; this is the live evidence).

### Mozilla Observatory snapshot

> **STILL NOT EXECUTED** as the Observatory online tool. A4 in V3 backlog. The point-in-time header probe above is a substitute, not a replacement.

### Service-role keys + secrets

| Check | Result |
|---|---|
| Service-role keys in client bundles | server-side only ✓; uncommitted defense-in-depth `import "server-only"` added to all 8 `apps/*/lib/supabase.ts` (in flight) |
| `apps/marketplace/.env.marketplace.pulled` cleanup | ✗ STILL TRACKED (B9) |
| **Studio WhatsApp webhook HMAC** | ✗ NOT shipped (verify-token only on GET; POST has no signature check) |
| **Care WhatsApp webhook HMAC** | ✗ **NOT shipped** — POST has no HMAC. *(Earlier 2026-05-09 refresh stated care webhook "no longer exists"; that was wrong.)* |
| **Property WhatsApp webhook HMAC** | ✗ **NOT shipped** — POST has no HMAC. *(Same correction as care.)* |
| `WHATSAPP_APP_SECRET` env var referenced in code | no — moot until B1 ships |
| Jobs `/api/hiring/messages` IDOR | ✗ NOT shipped — still accepts client-supplied `senderId`/`senderType` without auth gate or rate limit |
| Care `/api/care/contact` rate limit | ✗ NOT shipped — no rate limiter |
| PII in URLs/logs/client bundles | ✓ clean |

### RLS coverage report — partial live this pass

| Bucket | Count |
|---|---|
| Public tables total | 222 |
| RLS enabled | 218 (98.2%) |
| RLS disabled | 4 (1.8%) |

The 4 outliers (RLS off) and their grants to `anon`:

| Table | Policies | `anon` privileges | Rows |
|---|---|---|---|
| `public.wallets` | 0 | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE | 0 |
| `public.wallet_transactions` | 0 | INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE | 0 |
| `public.care_pricing_items` | 0 | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE | 6 |
| `public.care_site_settings` | 0 | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE | 1 |

**This is D8 (NEW SERIOUS).** Routed to V3 backlog. Severity: SERIOUS today (wallets are zero-row); becomes CRITICAL the moment DASH-3 wallet flows put real money in. `care_pricing_items` and `care_site_settings` are non-zero today and can be tampered or truncated by anyone holding the public anon key.

### Other security findings (open items)

- **B1 Studio + Care + Property WhatsApp HMAC verification — SERIOUS (3 webhooks, not 1 as earlier claimed)**
- B2 `WHATSAPP_APP_SECRET` provisioning — SERIOUS operational
- B3 Jobs IDOR fix — SERIOUS
- B4 Care contact rate limit — SERIOUS
- D1 `next@16.1.6` → `>=16.2.3` (DoS GHSA-q4gf-8mx6-v5v3) — SERIOUS
- D2 Full CSP for the 8 apps without one — MODERATE (verified open this pass)
- D3 `Cross-Origin-Resource-Policy: same-origin` extension to all apps — MINOR
- D4 `auth/resend` rate limit — MODERATE
- D5 `verify` upload rate limit — MODERATE
- D6 `picomatch`/`@xmldom/xmldom` advisories in `apps/company-hub` — MODERATE
- D7 Jobs messages caller-is-participant — MODERATE
- **D8 (NEW SERIOUS) — RLS off + anon grants on `wallets`, `wallet_transactions`, `care_pricing_items`, `care_site_settings`**
- B9 `.env.marketplace.pulled` tracking — MINOR (token expired)

**Verdict:** static security baseline ✓; live security verification ⚠ partial (this pass adds live header + RLS coverage evidence); **B1–B4 SERIOUS fixes still uncommitted six days after V5-3 sweep; D8 NEW SERIOUS surfaces a never-previously-catalogued exposure.**

---

## C4 · Performance + accessibility certification

### Lighthouse top 30 routes

> **STILL NOT EXECUTED.** A2 in V3 backlog.

### Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)

> **STILL NOT MEASURED.** Vercel Analytics + Speed Insights collecting in production; readouts not pulled.

### axe-core per route

> **STILL NOT EXECUTED.** A3 in V3 backlog. `scripts/a11y/audit.mjs` exists; route walker does not.

### V2-A11Y-01 catalogued findings

11 critical / 63 serious / 42 moderate at the primitive level — unchanged. DASH-7 elevation (`f364f93`) closed several mobile-shell a11y caveats (Drawer + BottomSheet focus trap, 44×44 chrome, dvh viewport, prefers-reduced-motion overrides) as a side effect.

### Static perf checks (V5-3 safe subset closures)

| Check | Status |
|---|---|
| Property `/search` server-side pagination (PAGE_SIZE=12) | ✓ shipped PR #23 (was B7) |
| Marketplace `/search` reveal-in-batches of 24 + above-the-fold priority | ✓ shipped PR #23 (was B8) |
| Landing-hero typography re-cap across 6 divisions + hub inline | ✓ shipped PR #23 (was B11) |
| Above-the-fold image priority across hero cards | ✓ |

### Contrast matrix

`scripts/a11y/contrast-matrix.mjs` enforced in CI; WCAG-AA accent contrast ≥ 4.5:1 across divisions ✓.

**Verdict:** static perf + a11y ✓; live perf + a11y ✗.

---

## C5 · Documentation audit

| Check | Result |
|---|---|
| Root `README.md` | ✗ STILL MISSING |
| `docs/dashboard/` (DASH-1..9 + audit + master) | ✓ |
| `.codex-temp/` reports | ⚠ same coverage as 2026-05-03 (PNH-01/02/03/03B + V2-NOT-01 squashed; rest present) |
| `PROJECT-KNOWLEDGE.md` | ✗ STILL MISSING |
| `docs/feature-status.md` / `release-status.md` | ✓ present, not updated this pass |
| `docs/v2/V2-CLOSURE-CERTIFICATE.md` | ✓ refreshed (this file) |
| `docs/v3/V3-BACKLOG-FROM-V2.md` | ✓ refreshed (D8 added; B1 line corrected) |
| `docs/v3/V3-DISCOVERY-INVENTORY.md` / `V3-PROMPT-FUSION-TEMPLATE.md` / `V3-RECOMMENDED-ROADMAP.md` | ✓ V5-5 V3 discovery scaffold |
| `docs/closure/V5-CLEAR-pre-dashboard-clean-sweep.md` | ✓ V5-CLEAR sweep documentation |

**Verdict:** dashboard documentation excellent; root README + PROJECT-KNOWLEDGE.md still missing (Q4).

---

## C6 · V3 backlog roll-up

Compiled to `docs/v3/V3-BACKLOG-FROM-V2.md`. Updated alongside this cert (D8 NEW added; B1 surface area corrected from "1 webhook" to "3 webhooks").

**Closed since 2026-05-03 (now strikethroughs in V3 backlog):** B5, B6, B7, B8, B11, B12, F1.

**Carried forward:** A1–A8 (live verification infra), B1–B4 (V5-3 held-back security), B9 (.env.marketplace.pulled), B10 (OneSignalSDKWorker.js), C1 (refreshed — staff deploy lag, newly material because DASH-9 not on staff prod), D1–D7 (security follow-ups), **D8 (new this pass)**, E1–E4 (notification gaps), F2–F3 (address follow-ups), G1–G3 (documents follow-ups), H1–H3 (search follow-ups), I1–I2 (auth follow-ups), J1–J3 (hero/visual polish), K1, L1, M1–M3, N1–N3, O1–O4, P1–P9 (DASH prompts), Q1–Q5.

---

## C7 · Closure certificate

This document.

**Date V2 declared closed:** **NOT YET DECLARED.** See §C9 / final classification.

---

## C8 · Branch hygiene

### Status at 2026-05-09 second-pass audit

- Local current branch: `feat/dash-08-owner-track-b` (1 ahead of `origin/main`)
- 260 commits on `origin/main`
- ~110 unmerged feature/fix branches in the repo (V2 era preserved as work-track history; new V3 era added on top — `git branch -a` listing this pass)

### Action items per V5-4 spec C8

| Spec ask | Status |
|---|---|
| Delete merged feature branches from origin (24h+ post-merge) | ✗ NOT DONE — destructive op against shared infrastructure; requires owner authorization |
| Document branches preserved | ✓ — every codex/* and claude/* branch preserved as work-track history; `backup/v2-merge-archive-20260502-043738` preserved |
| Worktree cleanup | n/a — no new stale worktrees |

**Branches now safely deletable (merged 2026-05-03 → 2026-05-09):**

```
feat/dash-01-foundations            (#48 fc5c2ae)
feat/dash-02-module-registry        (#49 909b3bf)
feat/dash-03-wallet                 (#51 c590df8)
feat/dash-04-smart-home             (#52 bf65832, #54 fa401e7)
feat/dash-05-command-palette        (#56 8ad9905)
feat/dash-06-realtime               (#55 7a1f024, #57 9a8d683)
feat/dash-07-mobile-shell           (#59 d68dde5)
feat/dash-09-staff-track-c          (squash 3016c52 + fix-ups)
feat/studio-msg-01                  (#26 d04f8f1)
feat/studio-cp-01-frontend          (#27 2366dc5)
feat/public-shell-and-loading-polish (#24 cb5dcf2, #25 3670e94)
feat/public-cta-and-client-workspace (#58 9baf944)
feat/messaging-thread-engine        (#64 dc7a79e)
feat/workspace-shell-engine         (#62 51b5dfa)
feat/ai-draft-assistant             (#65 5ef863c)
feat/workspace-notifications        (#63 fc74e85)
feat/post-merge-corrections         (#60 ca510ed)
fix/studio-portal-helpers-server-only (#29 5acf1bd)
fix/studio-lint-errors-msg01-cp01    (#28 a622739)
```

The V2-era branches from the 2026-05-03 cert (`feat/v2-*`, `fix/v2-pnh-04-*`, `feat/v5-2-visible-repair`, etc.) all remain safely deletable. Owner has not authorized the cleanup in 6 days.

The current branch `feat/dash-08-owner-track-b` is preserved (DASH-8 owner Track B work, not yet pushed/merged).

---

## C9 · Final gate

V2 is closure-ready if and only if:

| Gate | Status |
|---|---|
| Every V2 pass has merge SHA + production SHA documented | ⚠ — 4 entries unverifiable by name (PNH-01/02/03/03B + V2-NOT-01-A through D) |
| Every customer-facing flow walked successfully in C2 | ✗ infra prerequisite not satisfied; partial live URL + header snapshot completed this pass |
| Trust and security audit clean | ✗ static ✓; live URL + headers + RLS coverage probed this pass; **4 SERIOUS V5-3 fixes (B1–B4) still uncommitted; 1 NEW SERIOUS finding (D8) added this pass** |
| Performance and accessibility certified | ✗ Lighthouse + axe per route not run |
| Documentation complete | ⚠ dashboard docs ✓; root README + PROJECT-KNOWLEDGE.md missing |
| V3 backlog written | ✓ refreshed (D8 added; B1 corrected) |
| Closure certificate written | ✓ refreshed (this document) |

> **CLASSIFICATION: V5-4-NOT-CLOSURE-READY** (refresh second pass confirms verdict, with one new SERIOUS finding D8 raising the cost of closure)

### Four named gaps now preventing closure (refresh second pass)

1. **V5-3 deep-sweep held-back security PR — STILL NOT MERGED.** PR #23 (`5d29d01`) closed the safe subset on 2026-05-03; that closure stands. The held-back PR `fix/v5-3-security-and-migrations` (B1 WhatsApp HMAC ×3 webhooks **(corrected from earlier "×1")**, B2 `WHATSAPP_APP_SECRET`, B3 jobs `/api/hiring/messages` IDOR, B4 care `/api/care/contact` rate limit) **was never created**. Six days have passed. Recommendation: create `fix/v5-3-security-followup` branch, ship the four fixes as a single PR, redeploy. Estimated 3–4 hours of work.

2. **Staff app production deployment lag — newly material because DASH-9 targets staff specifically.** Staff prod is at `53572de` (2026-05-06); origin/main is at `5ef863c` (2026-05-09). The staff project (`prj_frEwPNZMvSTLtnrJR67DRCApEA19`) auto-deploy stopped accepting new SHAs after `53572de`. **DASH-9 staff dashboard (`3016c52` + fix-ups) is not running on `staff.henrycogroup.com`** despite being merged to main and despite DASH-9's whole point being "replace apps/staff V1 from scratch with the Track C operator surface at staff.henrycogroup.com." The DASH-9 SQL is live (verified this pass via `pg_proc`); the UI is not. Recommendation: investigate the GitHub→Vercel webhook for the staff project; manually trigger production deploy of `origin/main` from the Vercel UI.

3. **Live verification infrastructure still not provisioned.** A1 through A8 in V3 backlog. Six days have passed without any of the deliverables provisioned. This pass added live header snapshots for two canonicals and a partial live RLS coverage report (98.2% — 4 outliers identified, see D8). Those substitute as point-in-time evidence but are not the durable infra. Recommendation: V5-5 V3 discovery framework was supposed to decide whether this is V3 prereq or V3 in-scope; that decision has not been recorded. With DASH-1 through DASH-9 now in production, the dashboard rebuild has effectively staged itself without the live verification infra. Either accept that as the new V3 baseline, or pause new feature work until A1–A8 are in.

4. **D8 NEW SERIOUS — RLS off on 4 public tables with anon grants.** `public.wallets`, `public.wallet_transactions`, `public.care_pricing_items`, `public.care_site_settings` all have RLS disabled and the `anon` Postgres role holds SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER grants. This was never previously catalogued. Wallets have zero rows today (DASH-3 wallet flows not yet exercised in production), but `care_pricing_items` (6 rows) and `care_site_settings` (1 row) can today be UPDATEd or TRUNCATEd by anyone holding the public anon key via PostgREST. Routed to V3 backlog as D8. Recommendation: ship a SQL migration that runs `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` and `REVOKE … FROM anon, authenticated;` for the four tables, plus the appropriate per-table policy (the wallet tables likely want owner-scoped policies; the care tables likely want admin-only writes + authenticated-SELECT for read flows). This is a hot-patch candidate, not a multi-week project.

### What V2 has actually delivered (refreshed honest baseline)

The 14 items listed in the 2026-05-03 cert remain in production. Net additions since 2026-05-03 (V3 + post-V2 work, on top of unclosed V2):

- DASH-1 through DASH-9 dashboard rebuild (Track A account chrome, Track A modules, Cmd+K palette, realtime spine, mobile shell + 44×44 chrome, Track C staff — Track C merged but not on staff prod)
- Workspace-shell engine (`packages/workspace-shell`)
- Messaging-thread engine (`packages/messaging-thread`)
- Studio AI draft refine bot (Claude Haiku via Anthropic SDK)
- Studio /client portal redesign + STUDIO-MSG-01 + STUDIO-CP-01 + brief co-pilot anti-abuse
- Canonical token system (PR #37)
- Logistics /coverage + OneSignal SW (PR #39)
- Studio /request landing redesign (PR #40)
- V5-CLEAR platform health sweep + V5-CLEAR-FOLLOWUP payment unification
- Marketplace /track + /checkout post-submit polish
- Property home editorial ledger + care brand identity + hub home polish + chrome-01a/01b/02 fixes
- Auth-onboarding premium gateway

V2 + V3 (in flight) is meaningful. V2 is also still not formally closed. Both statements remain true.

---

## Owner sign-off (refresh second pass, 2026-05-09)

This second-pass refresh confirms V5-4-NOT-CLOSURE-READY and adds one new SERIOUS finding (D8). V2 closure requires the owner to:

- [ ] Acknowledge the V5-4-NOT-CLOSURE-READY second-pass classification (2026-05-09)
- [ ] Decide on B1/B2/B3/B4: ship as `fix/v5-3-security-followup` PR (now sized at 3–4h because B1 is 3 webhooks), or formally re-route to V3 backlog with severity transfer
- [ ] **Decide on D8 (NEW): hot-patch SQL migration to enable RLS + REVOKE anon grants on `wallets`, `wallet_transactions`, `care_pricing_items`, `care_site_settings`, or accept the residual risk and route to V3**
- [ ] Diagnose and fix staff app production deploy lag — **DASH-9 is currently blocked from staff prod**
- [ ] Authorize `git rm --cached apps/marketplace/.env.marketplace.pulled` (B9)
- [ ] Decide on live verification infra provisioning (V3 prereq or V3 in-scope) — pending since 2026-05-03
- [ ] Authorize branch hygiene (delete merged feature branches per C8 list)
- [ ] Acknowledge that V3 dashboard work has shipped on top of unclosed V2; decide whether to formally retire the V2 closure attempt and declare "V2 + V3 partial" as the working baseline, or hold V3 progress until V2 closure conditions are met

Once gaps in §C9 are closed, the V5-4 audit can be re-run and V2 declared closed. **Signed declaration of V2 closure goes here when ready:**

```
V2 declared closed by: ______________________________
Date:                  ______________________________
```

---

## Appendix · Files written by this V5-4 refresh second pass

```
.codex-temp/v5-4-v2-closure/report.md           (V5-4 refresh second-pass report — full audit transcript with live evidence)
docs/v2/V2-CLOSURE-CERTIFICATE.md               (this file — refreshed certificate)
docs/v3/V3-BACKLOG-FROM-V2.md                   (refreshed with D8 NEW SERIOUS + B1 surface area correction)
```

The earlier 2026-05-09 versions are overwritten in place. Git history preserves the earlier content; the two 2026-05-09 audits diverge at: (a) B1 surface area (1 → 3); (b) D8 (absent → catalogued); (c) live RLS coverage (claimed-not-run → 98.2% with 4 named outliers); (d) live header evidence (claimed-not-run → captured for www + studio).

---

## Appendix · V5-4 self-verification (refresh second pass)

- [x] Every V2 pass re-checked against the prior cert
- [x] origin/main HEAD captured (`5ef863c`) and total commits count verified (260)
- [x] All 10 web app Vercel project deploy SHAs captured live via MCP `list_deployments` (9 at `dc7a79e`, staff at `53572de`)
- [x] Staff app deployment lag re-flagged with new severity (DASH-9 not on staff prod)
- [x] V5-3 held-back security PR re-confirmed not merged
- [x] B5/B6/B7/B8/B11/B12/F1 confirmed closed (PR #23 + Supabase MCP)
- [x] Supabase migration list pulled live; F1 (`20260502161000_user_addresses_legacy_backfill`) confirmed applied
- [x] **DASH-9 SQL artifacts probed live via `pg_proc` — `is_staff_in`, `is_staff_in_any`, `add_audit_log_v2`, `workspace_set_updated_at` all confirmed present**
- [x] **RLS coverage probed live: 218/222 = 98.2%; 4 outliers named with grant matrices and row counts**
- [x] **D8 NEW SERIOUS added: RLS off + anon grants on 4 public tables**
- [x] Service-role key audit re-run (server-side only; uncommitted hardening noted)
- [x] **All 3 WhatsApp webhook routes re-read line-by-line — none verify HMAC on POST. Earlier refresh's "surface area is 1, not 3" claim corrected.**
- [x] Jobs IDOR re-read at file level (still open — B3)
- [x] Care contact rate limit re-checked at file level (still open — B4)
- [x] `.env.marketplace.pulled` tracking checked via `git ls-files` (still tracked — B9)
- [x] Live URL probe of all 12 production canonicals + apex completed; 11/12 OK + 1 informational (hub. subdomain not aliased)
- [x] Live security-headers snapshot for www.henrycogroup.com (full CSP) + studio.henrycogroup.com (CSP `frame-ancestors` only — D2 evidence)
- [x] No live verification claimed without evidence
- [x] No certification asserted for gates that did not pass
- [x] No new features added in this pass
- [x] No regressions to V2-PNH-* hardening claimed (CI snapshot test is authoritative; this audit did not run CI)
- [x] No destructive operations performed (no branch deletes, no DB writes, no force pushes; SELECT-only probes against Supabase)
- [x] V3 backlog refreshed alongside this cert (D8 added; B1 line corrected)
- [x] Owner sign-off section blank (intended for owner)

End of certificate.
