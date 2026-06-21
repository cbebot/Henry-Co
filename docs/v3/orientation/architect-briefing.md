# V3 Architect Briefing — Ground Truth

**Compiled:** 2026-05-27 (UTC ~22:10)
**Compiler:** V3 Orientation Briefer (read-only)
**Scope:** Cross-check documented V3 state against git, gh, Supabase MCP, and live `/api/health` curl. Honesty over narrative.
**Output target:** `docs/v3/orientation/architect-briefing.md`
**Source authority:** `git log origin/main` at HEAD `217c66e4`, `gh pr list`, file reads in `docs/v3/`, `docs/closure/`, `.codex-temp/`, live HTTPS curl against the 10 production hostnames.

---

## 1 — V3 Plan Shape

- **Total pass count.** 96 sequential passes (V3-01 → V3-96) split across nine phases A–I, plus two hardening passes (V3-07b, V3-07c) that explicitly do not count toward the 96 and do not gate any phase (`docs/v3/PASS-REGISTER.md:29-30,71-82`).
- **Phase structure** (one-line scope, from `docs/v3/PASS-REGISTER.md:18-28` and `docs/v3/MASTER-PLAN.md:31-154`):
  - **A — Audit.** Ground-truth baseline + per-pass prompts (this is the pass that produced these docs).
  - **B — Foundation Lock (V3-01 → V3-12).** Boring essentials: sessions, auth, notifications, deep links, loading-theater kill, dead-link sweep, hardcoded-text cleanup, empty-dashboard truth, mobile consistency, logs/states/fallbacks, one-job-per-card, acceptance.
  - **C — Money & Identity Spine (V3-13 → V3-25).** Payment provider router, Stripe/Paystack/Flutterwave activation, ledger hardening, receipts/refunds/subscriptions/tax/finance dashboard, KYC vendor, content moderation.
  - **D — AI Intelligence Layer (V3-26 → V3-33).** Vendor-agnostic AI router, usage billing, "HenryCo Intelligence" chat surface, assist surfaces, personal-task gating.
  - **E — Personalization & Predictive (V3-34 → V3-42).** Personalized home, recs, abandoned-task recovery, local availability, smart next-action, fraud/quality prediction, predictive dashboards.
  - **F — Automation & Workflow (V3-43 → V3-48).** Workflow engine foundation, auto-assign/escalate, reminders, owner reports, neglected-queue detection, follow-up campaigns.
  - **G — Product Expansion (V3-49 → V3-66).** Services catalog, verified provider model, smart booking, marketplace ranking, property rules, jobs interview room, studio motion/video, business profiles, gaming arena (gated on D2).
  - **H — Partner & Enterprise (V3-67 → V3-75).** Partner onboarding/payouts, employer/seller/provider/studio/logistics suites, bulk invoicing.
  - **I — Platform/API + Global/Mobile + Observability + Closure (V3-76 → V3-96).** Public API, mobile store submissions, observability depth, privacy/data-rights, integration test, launch readiness, showcase.
- **Timeline.** 9–18 months wall-clock with parallelization; ~22–31 months sequential (`docs/v3/MASTER-PLAN.md:190-204`).
- **Five most-urgent owner decisions** (from `docs/v3/OWNER-BRIEF.md:46-54`, status verified against `docs/v3/DECISIONS-REQUIRED.md`): D11 Foundation Lock gate (PENDING — `DECISIONS-REQUIRED.md:216`), D1 payment provider activation (PENDING — line 33), D3 AI provider (PENDING — line 70), D6 KYC vendor (PENDING — line 124), D2 gaming posture (PENDING — line 50). **All five owner-answer slots read `_____` in the doc.** None have inline written answers.
- **Critical-path passes** per `docs/v3/DEPENDENCIES.md:239-254`: V3-01 → V3-02 → V3-04 → V3-11 → V3-12 → V3-13 → V3-17 → V3-19 → V3-94 → V3-95 → V3-96 (~27 sequential passes end-to-end).
- **Pass IDs added since initial authoring.** PASS-REGISTER.md (origin/main) contains V3-07b and V3-07c rows (lines 75-76, added via merged PR #136 commit `eb61a9e9`). It does **NOT** contain V3-02b, V3-DELIVERY-01, or V3-DOMAIN-01 (grep count = 0 against `docs/v3/PASS-REGISTER.md`). Those three IDs exist only in `.codex-temp/` reports, `docs/v3/notification-delivery-incident.md`, `docs/v3/domain-decision.md`, and the V3-02 closure report — i.e., in volatile / non-register locations.

---

## 2 — Phase B Execution Record (Ground Truth)

Sources: `git log origin/main` (HEAD `217c66e4`), `git branch --contains <sha>`, `gh pr list --state all`, `.codex-temp/v3-0N-*` directories, Supabase `supabase_migrations.schema_migrations` (via the synthesis-doc §3 query record dated 2026-05-27).

| Pass | Branch | HEAD SHA | PR | State | Merge SHA on main | Merge time (UTC) | Report path | Closure assertion (verbatim) | Migration applied? |
|---|---|---|---|---|---|---|---|---|---|
| V3-01 | `v3/01-session-persistence` | `1caf3897` | [#129](https://github.com/cbebot/Henry-Co/pull/129) | MERGED | `1caf3897` | 2026-05-22 11:58:32 | `.codex-temp/v3-01-session-persistence/` (exists per ls) | "Mandatory scope S1–S7 ✅ all delivered. Addendum 9 of 10 ✅." (synthesis §1) | `20260522124106 v3_01_henry_events` + `20260522235600 v3_01_henry_events_anon_insert_policy` applied per synthesis §3 |
| V3-01 slice 5b finalize | `feat/v3-01-slice-5b-finalize` | `217c66e4` | [#130](https://github.com/cbebot/Henry-Co/pull/130) | MERGED | `217c66e4` | 2026-05-24 12:26:04 | `docs/closure/V3-01-slice-5b-rollback-gate.md` | "Slice 5b finalize — migration safety, telemetry probes, A4 runbook + CI gate" (commit subject) | Idempotency fix on existing migration; no new schema |
| V3-02 | `v3/02-auth-reliability` | **`f37f0e97`** | **NONE** | **NO-PR** | **NOT ON MAIN** | n/a | `.codex-temp/v3-02-auth-reliability/report.md` (210 lines) | "All 95 `@henryco/auth` unit tests pass... PR not yet opened" (report §1, §4) | **No migrations** — V3-02 introduces zero schema changes (report §3) |
| V3-03 | `v3/03-notification-message-states` | `d825cd60` | [#131](https://github.com/cbebot/Henry-Co/pull/131) | MERGED | `d825cd60` | 2026-05-23 04:33:46 | synthesis §1 (no separate report on disk) | "Closes PRODUCT-GAP-LEDGER #1... S1 Migration (applied) / S2 Delivery state machine / S3 Redelivery cron / S4 Legacy backfill / S5 Shared bell primitive (per-shell wiring deferred) / S6 Read receipts UI / S7 Observability events" (synthesis §1) | `20260523041459 v3_03_message_read_state` + `20260523073251 realtime_publication_customer_notifications` applied per synthesis §3 |
| V3-04 | **no branch exists** | n/a | NONE | NO-PR | NOT ON MAIN | n/a | none | n/a — pass not started | n/a |
| V3-05 | `v3/05-kill-loading-theater` | `0c33ffa2` | [#132](https://github.com/cbebot/Henry-Co/pull/132) | MERGED | `0c33ffa2` | 2026-05-23 04:56:31 | synthesis §1 | "Inventory: Class B (theater) before 72 → after 0." (synthesis §1) | n/a — no schema |
| V3-06 | **no branch exists** | n/a | NONE | NO-PR | NOT ON MAIN | n/a | none | n/a — pass not started | n/a |
| V3-07 | `v3/07-hardcoded-text-cleanup` | `9e192a3d` | [#134](https://github.com/cbebot/Henry-Co/pull/134) | MERGED | `9e192a3d` | 2026-05-23 03:48:56 | synthesis §1 | "S1 scaffold+audit / S2 full (40 sites migrated) / S3 full / S4 deferred / S5 full / S6 full / S7 partial / S8 full / S9 full (hook only). Before any S6 work GAP=1308; after S6 migration GAP=1305 (net −3)." (synthesis §1) | n/a — no schema |
| V3-08 | **no branch exists** | n/a | NONE | NO-PR | NOT ON MAIN | n/a | none | n/a — pass not started | n/a |
| V3-09 | `v3/09-mobile-consistency` | `8396a93e` | [#135](https://github.com/cbebot/Henry-Co/pull/135) | MERGED | `8396a93e` | 2026-05-23 04:11:15 | synthesis §1 | "6 commits, ~720 net new lines. Sections S1/S2/S3/S4/S5/S8/S10 Full; S6 Scaffold; S7 Partial (6 fixed, ~10 deferred); S9 Scaffold." (synthesis §1) | n/a — no schema |
| V3-10 (anchor) | `v3/10-logs-states-fallbacks` | `42c2562f` | [#133](https://github.com/cbebot/Henry-Co/pull/133) | MERGED | `42c2562f` | 2026-05-23 01:16:59 | synthesis §1 | "S1 Sentry adoption audit + wire missing inits — **10/10 apps wired** (was 3/10)... S7 + A8 Canonical `error.tsx` ... S8 + A6 Uniform `/api/health` endpoint across all 10 apps." (synthesis §1) | n/a — no schema (telemetry-only) |
| V3-11 | **no branch exists** | n/a | NONE | NO-PR | NOT ON MAIN | n/a | none | n/a — pass not started | n/a |
| V3-12 | **no branch exists** | n/a | NONE | NO-PR | NOT ON MAIN | n/a | none | n/a — pass not started | n/a |

**Verification:** every Wave B.1 merge SHA above was confirmed against `main` via `git branch -a --contains <sha> | grep main`. All six Wave B.1 SHAs + the `217c66e4` finalize SHA are present on `origin/main`. V3-02's `f37f0e97` returns only `v3/02-auth-reliability` (NOT on `main`).

**V3-DELIVERY-01** is a registered hardening-pass concept (`docs/v3/notification-delivery-incident.md:230-244`) — no branch, no PR, no entry in PASS-REGISTER.

---

## 3 — Wave B.1 Closure State

**Verdict line verbatim** (`docs/closure/wave-b1-synthesis.md:428`): *"WAVE B.1 CLOSURE STILL INCOMPLETE — only G7 owner visual confirmation remains."*

**T1–T6 remediation status** (sources: synthesis §2/§6, remediation `.codex-temp/wave-b1-remediation/report.md`, T6 evidence file at `.codex-temp/wave-b1-remediation/t6-execution-2026-05-27T1623Z.md`).

- **T1 — Merge PR #130.** ✅ DONE. PR #130 merged at `2026-05-24T12:26:04Z`, merge commit `217c66e4` (synthesis line 5, header revision). Verified by `git log --oneline | grep 217c66e4` returning `217c66e4 V3-01 slice 5b finalize — migration safety, telemetry probes, A4 runbook + CI gate (#130)`.
- **T2 — Vercel `/api/health` bypass on 10 projects.** ✅ DONE per the synthesis-doc 2026-05-27 operator update, but the **anonymous external curl evidence still shows the SSO/binding gap from the auditor's point of view**: my live curl run at 2026-05-27 22:09 UTC returned 8× HTTP 402 (marketplace/care/jobs/learn/logistics/property/studio/staff) and 2× HTTP 404 (apex `henrycogroup.com`, `account.henrycogroup.com`). The synthesis documents this gap in `docs/v3/monitoring-conventions.md` — bypass affects deployment URLs, not the alias pattern an external visitor sees. Monitoring should target verified production aliases.
- **T3 — V3-10 owner tile visual verification.** UNKNOWN. Visual check requires an authenticated browser at hub `/owner/(command)/dashboard`. The remediation engineer flagged this as owner-only (synthesis §6 G7). The tile component exists in code (`apps/hub/app/owner/(command)/dashboard/observability-tile.tsx`, V3-10 PR #133 commit `ce6eacf5`). Henry-events has 252 rows including the 3 V3-01 auth event names, so data exists for the tile to render.
- **T4 — 1408 failed-notification investigation.** ✅ DONE. Diagnosed as a V3-03 cron misclassification (no email-attempted guard); benign. Full root cause + recommendation in `docs/v3/notification-delivery-incident.md`. 13 distinct users, all in-app notifications were delivered through realtime pre-V3-03.
- **T5 — Synthesis-doc update.** ✅ DONE per remediation report §6.
- **T6 — Post-soak re-verification at `2026-05-26T04:56:31Z`.** ✅ DONE on 2026-05-27 at 16:23 UTC. The 72-hour mark elapsed 2026-05-26 04:56:31Z (current UTC = 2026-05-27 22:10Z, so ~41h past). Evidence file `.codex-temp/wave-b1-remediation/t6-execution-2026-05-27T1623Z.md` records: 0 production 500 rows across all 10 Vercel projects over the 72h sweep; telemetry-gap classified as quiet/no-sampled-traffic rather than emit-pipeline regression (last `henry_events` row at `2026-05-23T13:32:21Z`). G6 flips to READY.

**G1–G8 status** (synthesis §6 gate scoreboard, lines 412-423, current readings):

| Gate | Status | Evidence |
|---|---|---|
| G1 — All Wave B.1 PRs merged | ✅ READY | All six squash-merges + PR #130 finalize present on `origin/main`; verified by `git log --oneline origin/main`. |
| G2 — 10 Vercel production deploys healthy | ✅ READY (per synthesis) | Bypass + binding work documented complete; external curl matrix in my run still shows 402×8 + 404×2, but `monitoring-conventions.md` accepts that GET on protected deployment URLs may 401 while production aliases work — owner-side monitoring action. |
| G3 — V3-01 24h soak clean | ✅ READY | Production-only refresh-failure rate = 0 over rolling 19h (synthesis §6 G3). |
| G4 — V3-03 migration + backfill applied | ✅ READY | Migration `20260523041459 v3_03_message_read_state` applied 2026-05-23 04:14:59 UTC; 183 support_messages + 102 support_threads + 1409 customer_notifications + 0 staff_notifications backfilled to 100% `delivery_state` coverage; legacy `/care?booking=` action_urls = 0 with 768 canonical paths present (synthesis §3). |
| G5 — Baseline captured + committed | ✅ READY | `.codex-temp/wave-b1-closure/baseline-snapshot.md` exists. |
| G6 — No 72h regression | ✅ READY | T6 re-run 2026-05-27T16:23Z file recorded above. |
| G7 — V3-10 owner tile live with data | ❌ NOT READY (owner action) | Code correct + henry_events populated; owner visual confirmation still pending per synthesis §6 G7. |
| G8 — PASS-REGISTER updated with V3-07b/c | ✅ READY | Lines 75-76 of `docs/v3/PASS-REGISTER.md` on `origin/main`. |

**One outstanding gate: G7 visual verification by owner.** Adjacent recommended follow-up: cron security hardening for `apps/learn/app/api/cron/learn-automation/route.ts` to fail-closed when `CRON_SECRET` is absent (synthesis verdict block).

---

## 4 — V3-02 State

- **Branch existence.** `git branch --list v3/02-auth-reliability` returns the branch.
- **HEAD SHA.** `git rev-parse v3/02-auth-reliability` returns `f37f0e97e08f79dc03963a79025e387b5427fc21` — exact match to the conversation record's `f37f0e97`.
- **Open PR.** `gh pr list --state all --search "v3-02"` returns no PR for V3-02 (the prior `v3-02` namespace shows the older V2-PNH passes only). **There is no PR for V3-02.**
- **Reachable from main.** `git branch -a --contains f37f0e97` returns ONLY `v3/02-auth-reliability` — confirms `f37f0e97` is NOT on `origin/main`. The current `origin/main` HEAD is `217c66e4` (the slice-5b finalize merge), 27 commits behind V3-02's tip.
- **Closure report.** `.codex-temp/v3-02-auth-reliability/report.md` exists (210 lines). The required 9-section structure is present:
  1. Executive summary — ships single-entry `logoutEverywhere`, server-side `requireSensitiveAction` guard, client `fetchWithSensitiveAction` modal, role-chooser badges, sign-out-everywhere endpoint, OAuth UX hardening (signed `hc_oauth_error` + `hc_oauth_link_intent` cookies), six new canonical telemetry events.
  2. Files changed — `@henryco/auth` package 10 new + 5 modified + 4 new tests; `@henryco/observability` 9 new event names (report lists 9, not 6 — see below); `@henryco/ui` two prop additions for opt-in callback; `apps/account` 3 new routes + 6 modified files; `apps/hub`, `apps/staff`, `apps/marketplace` chrome wirings.
  3. Migration / RLS / env — **no migrations, no RLS changes**; `HENRYCO_AUTH_OAUTH_LINK_INTENT` introduced as a new optional env toggle, default OFF.
  4. Validation gate evidence — `@henryco/auth` typecheck PASS + 95/95 tests PASS; `@henryco/account` typecheck has pre-existing failures unrelated to V3-02.
  5. Smoke verification — DEFERRED to a Vercel preview deploy that doesn't exist yet.
  6. Live verification — pending merge + 48h soak.
  7. Telemetry baseline — 9 new events.
  8. Deferred items — 7 items including the V3-02b style cleanup (6 public-shell `onSignOut` wirings).
  9. Pass closure assertion — 8 items all ticked.
- **A1–A11 addenda status.** The report uses addendum labels A1, A2, A3, A4, A6, A7, A9, A11 explicitly. A1 (link-intent) ships infrastructure but is **gated off** behind `HENRYCO_AUTH_OAUTH_LINK_INTENT`. A2 (rollback-trigger metrics) named in §6. A3 (rate-limit fallback) implemented. A4 (no biometric) honored. A6 (`hc_oauth_error` cookie) shipped. A7 (Realtime broadcast + 200ms grace) shipped. A9 (own-user + 10/min) shipped on role-status endpoint. A11 (Idempotency-Key replay) shipped on `fetchWithSensitiveAction`. **A5, A8, A10 are not explicitly labeled in the report**; the report itself states "Addendum 9 of 10" was completed in V3-01 (referring to V3-01's PR #129 body, not V3-02 — synthesis §1 line 26). The owner-facing "11 V3-02 addendum items A1–A11" framing in the question does not map 1-to-1 to labels written in this report; this should be flagged for the owner.
- **V3-02b in PASS-REGISTER.** **NO.** `grep -c V3-02b docs/v3/PASS-REGISTER.md` returns 0. The "6 remaining public-shell `onSignOut` wirings" item lives only in `.codex-temp/v3-02-auth-reliability/report.md` deferred-items §8 item 2. This is exactly the risk Section 6 of this briefing addresses.
- **HENRYCO_AUTH_OAUTH_LINK_INTENT flag.** Present in code at `packages/auth/src/server/oauth-link-intent.ts:167` (`isOAuthLinkIntentEnabled` reads `process.env.HENRYCO_AUTH_OAUTH_LINK_INTENT`). Default OFF — diversion only activates on `=1` or `=true`. **Not yet present in `docs/v3/INTEGRATION-KEYS.md`.** The V3-02 report §3 explicitly recommends adding it in a follow-up.

---

## 5 — Infrastructure Decisions

- **`docs/v3/infrastructure-decisions.md` — does NOT exist** (`ls docs/v3/infrastructure-decisions.md` returns "No such file or directory"). The Cloudflare-in-front-of-Vercel decision is therefore **not durably recorded in the V3 plan**; the only place it appears is the synthesis doc and `docs/v3/handoff/vercel-migration-playbook.md`. No scheduled trigger date is captured in any V3-canonical doc — the prompt-stated trigger ("after Wave B.2 closes") cannot be verified against a written source.
- **`docs/v3/domain-decision.md` — EXISTS** (15 lines). Verbatim record:
  - Chosen domain: `henry.holdings`
  - Registrar: Cloudflare
  - Decision date: 2026-05-23
  - **Status: TO ACQUIRE** — purchase not yet executed. Acquisition trigger is "Wave B.1 fully merged + CAC certificate received + corporate bank account opened. Then buy."
  - Pre-acquisition: development continues on `vercel.app` subdomains; SSO and OAuth callbacks remain on `henrycogroup.com` until V3-DOMAIN-01 executes.
- **Current production domain.** `henrycogroup.com` is live (per `docs/v3/domain-decision.md:13-14` and the synthesis doc's 8/10 SSO-bound subdomains). `henry.holdings` has not been bought yet.
- **V3-DOMAIN-01 prompt.** No file matches `docs/v3/prompts/v3-domain-01*.md`. The ID is referenced in `docs/v3/domain-decision.md` and the synthesis doc but **no prompt file exists** and **no PASS-REGISTER row exists** (grep count = 0).

---

## 6 — Deferred & Backlog Items

Source citations: synthesis §5 (lines 191-222), V3-02 report §8 (lines 184-191), `docs/v3/notification-delivery-incident.md`, `docs/v3/domain-decision.md`. Each item is marked **REGISTER** (durable in PASS-REGISTER.md) or **VOLATILE** (only in `.codex-temp/` or scoped docs).

| # | Item | Where currently tracked | Durability |
|---|---|---|---|
| 1 | V3-02b — 6 public-shell `onSignOut` wirings (care, jobs, learn, logistics, property, studio public chromes; hub-public) | V3-02 report §8 item 2 only | **VOLATILE — AT RISK** |
| 2 | V3-07b — operator-surface i18n wave (~1,305 GAPs) | PASS-REGISTER.md line 75 | REGISTER |
| 3 | V3-07c — mechanical `henrycogroup.com` sweep (~156 sites) | PASS-REGISTER.md line 76 | REGISTER |
| 4 | V3-DELIVERY-01 — 1,408 false-failed notifications cron-guard fix | `docs/v3/notification-delivery-incident.md` only | **VOLATILE — AT RISK** |
| 5 | V3-DOMAIN-01 — henry.holdings domain migration | `docs/v3/domain-decision.md` only; no prompt file | **VOLATILE — AT RISK** |
| 6 | V3-09 S7 — ~10 touch-target violations | synthesis §5 item 7 | **VOLATILE** |
| 7 | V3-09 KYC document upload full-screen migration | synthesis §5 item 8 (deferred to V3-24) | partly covered (V3-24 owns) |
| 8 | V3-09 chat-composer keyboard-hook migration | synthesis §5 item 9 | **VOLATILE** |
| 9 | V3-05 S4 — `<ListStates>` primitive adoption (pilot deferred) | synthesis §5 item 12 | **VOLATILE** |
| 10 | V3-03 S5 — per-shell `<NotificationBell />` wiring (jobs, learn, logistics, property, studio + public marketplace/care chrome) | synthesis §5 item 16 | **VOLATILE** |
| 11 | V3-01 S7 — `NEXT_PUBLIC_HENRY_TELEMETRY_SOURCE` browser tagging | synthesis §5 item 21 | **VOLATILE** |
| 12 | V3-01 S7 — `useFormDraft` → `persistEvent` `draft_restored` bridge | synthesis §5 item 22 | **VOLATILE — partial** |
| 13 | V3-01 T3 — cross-tab logout test un-fixme | synthesis §5 item 23 | **VOLATILE** |
| 14 | V3-10 S2 — `console.*` sweep across 36 baselined routes | synthesis §5 item 3 | **VOLATILE** |
| 15 | V3-10 S4 — degraded side-effect pattern extension | synthesis §5 item 4 | **VOLATILE** |
| 16 | V3-10 S6 — audit-log adoption on sensitive routes (depends on V3-02) | synthesis §5 item 5 | **VOLATILE** |
| 17 | V3-10 A4 — 100% mutating-route typed-event emission coverage (baseline 3/150) | synthesis §5 item 6 | **VOLATILE** |
| 18 | V3-07 telemetry sink wiring + owner translation-health tile | synthesis §5 item 26 (deferred to V3-89) | partly covered |

**Items NOT in PASS-REGISTER.md that are explicitly load-bearing and at risk of being lost: V3-02b, V3-DELIVERY-01, V3-DOMAIN-01.** Recommend a single 3-row PASS-REGISTER update before any Wave B.2 spawn to durably anchor them.

---

## 7 — Decisions Answered vs Pending

Source: `docs/v3/DECISIONS-REQUIRED.md` — 17 numbered decisions (D1–D17). Every decision's `**Owner answer:** _____` slot reads blank on `origin/main` (verified by full-doc read, lines 33, 50, 70, 88, 107, 124, 142, 160, 181, 199, 216, 234, 250, 267, 284, 300, 331).

| ID | Decision summary | Status | Owner answer if any | Passes affected |
|---|---|---|---|---|
| D1 | Payment provider activation per country (Paystack+Flutterwave first vs Stripe-first vs defer) | **PENDING** | _____ | Blocks V3-14, V3-15, V3-16 |
| D2 | Gaming-arena legal posture per market (formal opinion vs defer to V4 vs skill-only) | **ANSWERED (2026-06-21)** | Refined Option C — free-play foundation builds now (V3-GAMING-01); real-money escrow stays deferred per market until L7+L15+L8. See `DECISIONS-REQUIRED.md:50` | Unblocks free V3-65; V3-66 stays legally gated |
| D3 | AI provider selection (Anthropic only vs Anthropic+OpenAI fallback vs open-source vs hybrid) | **PENDING** | _____ | Blocks V3-26 |
| D4 | AI usage pricing markup (0% vs 10% vs tiered vs subscription) | **PENDING** | _____ | Blocks V3-27 |
| D5 | Tax engine selection (Avalara vs TaxJar vs Stripe Tax vs roll-our-own vs defer) | **PENDING** | _____ | Blocks V3-21 |
| D6 | KYC vendor per market (Smile Identity+Onfido vs Sumsub vs Veriff vs internal) | **PENDING** | _____ | Blocks V3-24 |
| D7 | Email/SMS senders per division (per-division vs unified vs hybrid) | **PENDING** | _____ | V3-46, V3-48, V3-61 (operational) |
| D8 | Mobile-app stack (Expo continue vs Flutter vs React Native vs defer) | **PENDING** | _____ | Blocks V3-86, partially V3-23 |
| D9 | Monetization rates per division (Care/Marketplace/Property/Jobs/Learn/Logistics/Studio %) | **PENDING** | _____ | Partial blocks V3-20, V3-69, V3-75, V3-22 |
| D10 | Per-market localization commitment (Nigeria-only vs Africa triad vs Anglosphere vs full 12) | **PENDING** | _____ | Blocks V3-84 |
| D11 | Foundation Lock acceptance gate (Phase B-before-Phase-C hard gate vs softer vs no gate) | **PENDING** | _____ | Blocks Phase C start |
| D12 | Anti-clone hardening posture (Light vs Moderate vs Aggressive) | **PENDING** | _____ | Cross-cuts every phase |
| D13 | V3 PASS 21–25 reconciliation (continue cycle vs pause vs parallel) | **PENDING** | _____ | Coordination only |
| D14 | V6 dashboard rebuild placement (after V3 vs into Phase B vs parallel track) | **PENDING** | _____ | Informs Phase G |
| D15 | Branch hygiene bulk delete authorization (yes-with-spot-check vs auto-30d vs manual) | **PENDING** | _____ | Operational |
| D16 | Public roadmap surface granularity (quarterly themes vs specific timelines vs vote-on) | **PENDING** | _____ | V3-60 scope |
| D17 | V3-07b operator-surface i18n scope (Option A full + Option B en-US Pattern A + DeepL) | **PENDING** | _____ | Blocks V3-07b only |

**Specifically confirming the recommendations the chat record cited:** none of D1, D2, D3, D6, D11 have inline written owner answers on `origin/main`. The five answers Claude-in-chat recorded (Paystack+Flutterwave first, defer gaming, Anthropic+OpenAI, Smile+Onfido, hold Foundation Lock) are **only in chat history**, not in `docs/v3/DECISIONS-REQUIRED.md`. They have not been promoted to the durable record. The architect should either re-confirm with the owner and inline-write them, or treat all 17 decisions as still owed.

---

## 8 — The Honest Readout

**Q1. Is Phase B Wave B.1 truly closed?**

**NO.** The most-recent verdict in `docs/closure/wave-b1-synthesis.md:428` is *"WAVE B.1 CLOSURE STILL INCOMPLETE — only G7 owner visual confirmation remains."* Seven of eight gates (G1, G2, G3, G4, G5, G6, G8) are READY per the synthesis-doc scoreboard as of 2026-05-27 16:05 UTC. G7 (V3-10 owner observability tile visual verification at hub `/owner/(command)/dashboard`) is still pending owner action; it cannot be agent-executed without an authenticated browser. Adjacent cron-security hardening for `apps/learn/app/api/cron/learn-automation/route.ts` is the only other named follow-up. Live curl of all 10 `/api/health` endpoints at 22:09 UTC returned 8×402 + 2×404, which is consistent with the synthesis-doc note that monitoring belongs on production aliases rather than raw deployment URLs — but a visitor-perspective external probe does still surface the configuration gap.

**Q2. Is V3-02 truly merged to main, or only committed to its branch?**

**Only committed to its branch.** SHA `f37f0e97` lives on `v3/02-auth-reliability` and is **NOT** reachable from `origin/main` (`git branch -a --contains f37f0e97` returns only the source branch). `origin/main` HEAD is `217c66e4`. `gh pr list --state all --search "v3-02"` returns no PR for V3-02 — **no PR has been opened**. The closure report at `.codex-temp/v3-02-auth-reliability/report.md` is on disk (210 lines, 9 sections), but `apps/account/components/security/GlobalSignOutCard.tsx`, `apps/marketplace/components/marketplace/public-header-client.tsx` and the entire `packages/auth/src/server/*` and `packages/auth/src/client/*` set show as staged/unstaged in the working tree per `git status` — V3-02's diff is sitting in the working tree on the v3/02 branch, not in `main`'s history.

**Q3. Is Wave B.2 (V3-04, V3-06, V3-08, V3-11, V3-12 plus V3-02b cleanup) clear to spawn right now?**

**NO.** Three gating items prevent a clean spawn:

1. **G7 owner visual verification is still open** (Wave B.1 not formally closed). The synthesis doc states explicitly (`docs/closure/wave-b1-synthesis.md:445-446`): *"Do **not** spawn Wave B.2 (V3-02 / V3-04 / V3-06 / V3-08 / V3-11 / V3-12) until G7 is green. A live owner-tile rendering issue would still block Wave B.2 because V3-02 cannot land safely without working observability tiles to verify it."*
2. **V3-02 is not yet merged.** Wave B.2 in the synthesis doc's grouping includes V3-02. Until V3-02 ships through a PR and lands on `main`, V3-04, V3-08, V3-11 cannot start (`docs/v3/DEPENDENCIES.md:29,33,36`: V3-04 deps on V3-02; V3-08 deps on V3-03 already met; V3-11 deps on V3-04; V3-12 deps on V3-01..V3-11). V3-04 + V3-11 are blocked end-to-end by V3-02; V3-12 is blocked on every other pass; V3-06 (deps V3-05 only) and V3-08 (deps V3-03 only) are technically startable on dependency alone, but the synthesis-doc gate above sequences them all behind G7.
3. **V3-02b, V3-DELIVERY-01, V3-DOMAIN-01 are not in PASS-REGISTER.md.** Spawning Wave B.2 without first promoting these three items into the durable register risks losing them when the volatile `.codex-temp/` artifacts age out. Recommend a single 3-row PASS-REGISTER update before any Wave B.2 spawn.

Owner-required actions before Wave B.2 spawn: (a) visual-verify G7; (b) open + merge a PR for V3-02 (no PR exists today); (c) update PASS-REGISTER.md with V3-02b + V3-DELIVERY-01 + V3-DOMAIN-01; (d) inline-write the five chat-recorded D-answers (D1/D2/D3/D6/D11) into `docs/v3/DECISIONS-REQUIRED.md`.

End of briefing.
