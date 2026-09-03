# V3-94 — Closure: Cross-Pillar Integration Test Pass

**Pass ID:** V3-94  ·  **Phase:** I (Platform / Global / Observability / Closure)  ·  **Pillar:** P12 (Global, Mobile, Observability, Closure)
**Dependencies:** V3-13 → V3-93 ALL closed  ·  **Effort:** L  ·  **Parallel-safe:** N (sequential close of V3 — runs alone, after every other pass)
**Owner gate:** none (but re-verifies every D-decision and L-item live)  ·  **Risk class:** Money, Identity, Compliance (re-verify all three end-to-end)

---

## Role

You are the V3 closure auditor for Henry Onyx. You execute exactly this one pass, then stop and report. This is the penultimate gate before launch readiness (V3-95): you do not build features — you **prove the whole platform is solid on production**, cross-pillar, after every pass V3-13 → V3-93 has landed. You re-run the V3-12 Foundation Lock smoke as a regression contract, walk every public surface across all 13 apps, exercise the full auth + role matrix, and re-verify every Money / Identity / Compliance flow against live state. The line you must not cross: you ship no new product code beyond the integration-test harness and necessary regression fixes; you do not pass any check on repo state alone (every assertion is proven against production); and you do not certify if a single check fails — a failure opens a named `V3-NN-FOLLOWUP` and the gate holds until it closes.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/94-closure-integration-test` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

By the time this pass runs, the platform spans 13 apps (`account`, `apps` super-app host, `care`, `company-hub`, `hub`, `jobs`, `learn`, `logistics`, `marketplace`, `property`, `staff`, `studio`, `super-app`) over ~40 shared `@henryco/*` packages. Phase B Foundation Lock is **CERTIFIED** (V3-12, PR #168) and ships the standing regression contract this pass inherits: `scripts/v3/foundation-smoke.mjs`, `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md`, the per-pass acceptance table, and the performance/telemetry baselines. Phase C laid the money + identity spine — `@henryco/payment-router` (V3-13), the live Paystack rail (V3-15), the double-entry ledger (V3-17), receipts/invoices (V3-18), refunds/reconciliation (V3-19), the KYC vendor integration (V3-24), content moderation (V3-25). Phase D added the governed "Henry Onyx Intelligence" surface; Phases E–H added personalization, the workflow engine, product expansion, and the partner/enterprise suites; Phase I added the public API, mobile parity, observability depth (Sentry across all apps, the uniform `/api/health` via `buildHealthResponse()`, the `henry_events` sink), and the GDPR/NDPR data-rights surface.

Each of those passes shipped with its own report, smoke, and self-verification. But "closed on a branch with a green report" is not "solid, cross-pillar, on production, after every later pass landed on top of it." Later passes mutate shared schema, shared chrome (`PublicSiteShell` / `PublicSiteFooter`), shared auth (`requireSensitiveAction`), and shared money primitives (`@henryco/payment-surface`); a regression introduced in V3-67 can silently break a V3-13 invariant. This pass closes that gap: it is the cross-pillar integration test that walks the assembled whole and proves no pass regressed another. It is the final functional gate; V3-95 turns its evidence into the owner sign-off pack.

## Mandatory scope

### S1 — Per-pass closure re-verification (V3-13 → V3-93)

Author `docs/v3/v3-94-closure-acceptance.md` §1 with one verification row per pass V3-13 → V3-93. For each pass:
- Read its `.codex-temp/v3-NN-<slug>/report.md`; confirm every self-verification checkbox is checked.
- Confirm the pass's deliverables exist **in `main`** (not on a stale branch) and are deployed to production.
- Re-run the pass's own validation gates (its named test suite via `pnpm --filter <pkg> test`, its RLS assertion, its e2e) and confirm still-green — this is the **regression check**: a later pass must not have broken an earlier pass's suite.
- Confirm no later pass silently reverted a money/identity invariant the pass established.
- Record pass / fail / regression-found per row with evidence.

A `regression-found` row does not fail this pass by itself — it opens a `V3-NN-FOLLOWUP` (S8) and the gate holds until that follow-up merges and re-verifies green.

### S2 — Live walk of every public surface

Author `scripts/v3/closure-integration-smoke.mjs` (extends the V3-12 harness; **every URL resolves through `@henryco/config` helpers — `henryDomain(division)` / `henryWebRoot()` / `getAccountUrl()` / `getHubUrl()` / `getStaffHqUrl()` — zero hardcoded `henrycogroup.com` literals in the harness**, V3-07c-enforced). Walk the top 30 routes per app across all 13 apps. For each surface assert:
- HTTP 200 (or correct 401/redirect for protected routes).
- No fake loading copy in first-render HTML (the V3-05 bar: zero "Loading X" / "Preparing X").
- Every internal `href` resolves — zero 404/5xx on cross-division links (the V3-06 bar; cross-division links specifically, since divisions ship independently).
- Every card/button opens its exact next step (the V3-11 bar — spot-checked on the 10 representative surfaces per app).
- The expected `henry.*` telemetry events fire and land in `henry_events`.
- Locale switch across the 12 locales renders translated copy or expected DeepL fallback — no unexpected label-name fallbacks (the V3-07 / V3-07b bar).

Output one pass/fail row per surface; target is 300+ surfaces (top 30 × 10 public-facing apps, plus the staff + owner workspaces).

### S3 — Auth + role + sensitive-action matrix

Exercise every protected surface against the full role set: **customer, division operator, staff, owner** (and the unauthenticated case). For each role × surface:
- Correct redirect on entry (customer → account home via `getAccountUrl()`; staff → staff HQ via `getStaffHqUrl()`; owner → owner workspace via `getHqUrl()`).
- Correct nav, notifications, and badge counts (V3-02 role-status); no cross-role surface reachable.
- Cross-division SSO is seamless (sign in once → enter every division without re-auth).
- `requireSensitiveAction` (V3-02) blocks every money/identity/destructive route without recent reauth, then proceeds after reauth — exercised against a live wallet transfer, a KYC submission, a payment authorization, a password change, and an account-deletion request.
- Multi-tab consistency (V3-01): sign out in tab A → tab B reacts on next interaction.

### S4 — Foundation-lock regression (re-run V3-12 end-to-end)

Run `scripts/v3/foundation-smoke.mjs` (the V3-12 harness) against production unchanged and confirm **ALL PASS** — every Foundation Lock sub-bar (V3-01 → V3-11) still holds after all of Phase C–I landed on top. Any Foundation regression is the highest-severity finding: it opens a `V3-NN-FOLLOWUP` flagged `foundation-regression` and blocks closure outright.

### S5 — Money + Identity + Compliance live re-audit

For every M / I / C-flagged pass (the inventory in `PASS-REGISTER.md` §"Passes touching Money / Identity / Compliance" — V3-13..V3-23, V3-27, V3-30, V3-32, V3-50, V3-65/66 if not gated-out, V3-69, V3-75, V3-85 for Money; V3-24, V3-26, V3-28, V3-33, V3-40, V3-50, V3-67, V3-76 for Identity; V3-21, V3-24, V3-25, V3-53, V3-69, V3-84, V3-88, V3-92, V3-93 for Compliance):
- **Money:** re-verify the four absolute invariants on a live transaction — amounts are BIGINT minor units end-to-end (no float anywhere in the path); every billed/mutating call carries an idempotency key; webhook HMAC verification + reconciliation is fail-closed; the double-entry ledger (V3-17) balances and status equals provider-confirmed money-truth (never optimistic). Run a live Paystack test-mode charge → webhook → ledger entry → receipt and confirm the chain. Confirm the receipt/invoice legal entity reads **"Henry Onyx Limited"** sourced from `@henryco/config` (`company.ts` `legalName`).
- **Identity:** re-verify KYC verification levels gate the actions they should (V3-24); the sensitive-action guard is on every identity route; RLS denies cross-tenant reads (spot-check `payment_intents`, `wallet_transactions`, KYC tables with a non-owning user).
- **Compliance:** re-run the privacy data-rights flow (V3-93 DSAR + deletion + consent ledger); confirm content moderation (V3-25) gates listings/posts/briefs; re-run the compliance checklist for each market committed in D10. Confirm every L-item (`LEGAL-AND-BUSINESS.md` L1–L18) that blocks a shipped pass is closed or explicitly deferred — engage legal review where a flow is live to real customers.

### S6 — Performance + security + a11y vs the V3-12 baseline

- Capture Lighthouse mobile + desktop for the top 30 routes per app; diff against `docs/v3/performance-baseline-foundation-lock.md`. A regression beyond tolerance (LCP/CLS/INP) on any critical user journey opens a `V3-NN-FOLLOWUP` (V3-89 owns the budget; this pass detects).
- Diff the Sentry error rate and release-health against the V3-12 baseline; an elevated error rate on a critical journey is a finding.
- Re-run the V2-PNH-04 security-headers gate across all 13 apps; confirm the baseline survived every later pass. Re-run `pnpm a11y:contrast` and `pnpm a11y` on the top 10 surfaces per app; document residual findings.
- `curl /api/health` on all 13 apps via the production aliases (per `docs/v3/monitoring-conventions.md` — target custom domains, never raw `*.vercel.app` deployment URLs) → expect HTTP 200 with `ok: true` from `buildHealthResponse()`.

### S7 — i18n + hardcoded-text + domain regression (re-run V3-07 / V3-07b / V3-07c gates)

Re-run the strict CI hardcoded-text scanner and the domain-literal scanner repo-wide (the V3-07 / V3-07b / V3-07c gates): zero new hardcoded user-facing strings outside `exempt.json`; zero `henrycogroup.com` literals in `apps/**` or `packages/**` (excluding `packages/search-ui/`, owner-reserved). Confirm operator surfaces (staff dashboards, admin workspaces, server messages, emails, PDFs, structured data, A11y labels) carry no label-name fallbacks — the V3-07b bar. Any reintroduced literal is a finding.

### S8 — Owner-facing acceptance walkthrough + follow-up register

Schedule a live owner walkthrough end-to-end on a physical phone **and** desktop, across the most important journey per pillar (browse → book a service → pay → receive receipt; post a job → interview room; KYC → verified-provider; Henry Onyx Intelligence assist; partner payout). For each, the owner answers: "Does this feel solid? Does every card open the exact next step? Are there any fake states? Did money behave exactly right?" Capture verbatim feedback. Any item that fails the bar opens a `V3-NN-FOLLOWUP` row added to `docs/v3/PASS-REGISTER.md`; the closure gate holds until every follow-up closes and re-verifies. Produce the verdict: **INTEGRATION-VERIFIED** or **NOT VERIFIED** (with every blocking follow-up named).

## Out of scope

- New feature work or new product surfaces — verification + necessary regression fixes only.
- The launch-readiness sign-off pack, credential rotation, backup drill, capacity, incident runbook, owner signature ceremony → **V3-95** (this pass produces the evidence V3-95 signs off).
- The public launch announcement, screen recordings, press kit → **V3-96**.
- Net-new per-route performance budgets and a11y remediation → **V3-89** (this pass detects regressions against its baseline; remediation that isn't a regression is V3-89's).

## Dependencies

- **Requires:** every pass V3-13 → V3-93 closed and on `main`. Inherits the V3-12 Foundation Lock certificate + smoke as its regression contract.
- **Blocks:** **V3-95** (launch readiness consumes this pass's verification evidence) → **V3-96** (showcase). No launch sign-off proceeds until this pass returns INTEGRATION-VERIFIED.

## Inheritance

- `scripts/v3/foundation-smoke.mjs` + `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md` + the V3-12 performance/telemetry baselines — the regression contract (S4, S6).
- `@henryco/config` URL helpers — every URL in every harness routes through them (zero hardcoded domains).
- `@henryco/observability`: `buildHealthResponse()` / `healthStatusCode()` (S6 health probe), `audit-log` (every sensitive action audited), the `henry_events` sink (S2 telemetry assertion source), Sentry adoption (S6 error-rate diff).
- `@henryco/auth`: `requireSensitiveAction` / `fetchWithSensitiveAction` + `role-status` (S3 matrix).
- `@henryco/payment-router` + `@henryco/payment-surface` + the ledger schema (`payment_intents` / `payment_attempts` / `processed_webhooks` / `wallet_transactions`) — S5 money re-audit.
- `@henryco/i18n` strict gate + the V3-07c domain-literal scanner — S7.
- Every pass report under `.codex-temp/v3-NN-<slug>/report.md` — S1.

## Implementation requirements

### Files
- `scripts/v3/closure-integration-smoke.mjs` (new — orchestrates S2/S3, domain-helper-routed).
- `docs/v3/v3-94-closure-acceptance.md` (new — per-pass verification table §1 + S2/S3/S5/S7 findings).
- `docs/v3/performance-baseline-v3-94.md` (new — S6 capture, diffed against the V3-12 baseline).
- `docs/v3/telemetry-baseline-v3-94.md` (new — production event counts per pillar from `henry_events`).
- `docs/v3/PASS-REGISTER.md` (edit — append any `V3-NN-FOLLOWUP` rows raised by S1/S2/S6/S8).
- `.codex-temp/v3-94-closure-integration-test/report.md`.
- **No migrations; no new feature code** (regression fixes, if any, are scoped tightly and re-verified).

### Trust / safety / compliance
This pass is a closure gate — it does not return INTEGRATION-VERIFIED while any S1–S8 check fails. The harness reads production with least-privilege test credentials, never logs session tokens or secrets, and never writes real-money transactions (Paystack test mode only for the S5 chain). The S5 money re-audit re-proves the four absolute money invariants live; the S5 identity re-audit proves RLS denial cross-tenant; the S5 compliance re-audit engages legal where a flow is live to customers. Every L-item that gates a live pass is confirmed closed or explicitly deferred with owner acknowledgement.

### Mobile + desktop parity
S2/S3 run on web-mobile and desktop; the S8 owner walkthrough runs on a physical phone (iOS + Android) and desktop. The super-app (Expo) payment + notification + booking surfaces (V3-87 parity) are walked alongside their web equivalents — parity, not divergence.

### i18n
The harness asserts no unexpected label-name fallbacks across all 12 locales on every walked surface (S2, S7). Any new string introduced by a regression fix flows through `@henryco/i18n` under its surface namespace — never hardcoded. The closure-acceptance doc names the brand as **Henry Onyx** / legal **Henry Onyx Limited**, resolved conceptually from `@henryco/config`.

### Brand & design system
Every harness URL and the acceptance docs source the brand from `@henryco/config` (`company.ts`) — **Henry Onyx** user-facing, **Henry Onyx Limited** on legal/receipt/invoice contexts, **HenryCo / @henryco/\*** unchanged in code. Never "Henry & Co.". Any UI touched by a regression fix uses locked tokens (`--site-*` / `--accent` / `--home-*`, Fraunces display), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. The payment surface stays behaviour-locked — this pass verifies it, it does not change it.

## Validation gates

1. **Standard CI** green on the branch: `Lint, typecheck, test, build` (the only required branch-protection context).
2. **S1 regression suite:** every pass V3-13 → V3-93 re-verified; each pass's own named test suite re-run green via `pnpm --filter <pkg> test`; all reports' checkboxes confirmed; deliverables confirmed in `main` and on production.
3. **S2 live walk:** `closure-integration-smoke.mjs` returns ALL PASS across 300+ surfaces; zero 404/5xx on internal `href`s; zero fake-loading copy; telemetry firing; 12-locale switch clean.
4. **S3 matrix:** every role × every protected surface correct; cross-division SSO seamless; `requireSensitiveAction` blocks-then-proceeds on all five named flows; multi-tab consistency holds.
5. **S4 foundation regression:** `foundation-smoke.mjs` returns ALL PASS (any failure blocks closure outright).
6. **S5 M/I/C re-audit:** live Paystack test charge → webhook → ledger → receipt chain green; the four money invariants re-proven; RLS denial cross-tenant confirmed; DSAR/deletion/consent flow re-run; every gating L-item closed or deferred.
7. **S6 perf/security/a11y:** Lighthouse + Sentry diffed against V3-12 baseline within tolerance; PNH-04 headers gate green on all 13 apps; `/api/health` 200 on all 13 production aliases.
8. **S7 i18n/domain regression:** hardcoded-text scanner + domain-literal scanner repo-wide zero new violations (excl. `packages/search-ui/`).
9. **S8 owner walkthrough:** conducted on physical phone + desktop; verdict recorded; every gap filed as `V3-NN-FOLLOWUP`.

## Deployment gate

This pass **is** a gate. No new product code deploys beyond the harness and any tightly-scoped regression fixes (each re-verified green). The branch goes off `origin/main` → PR → CI green → squash-merge (no force-push, no branch-protection bypass). The pass closes only when every S1–S8 check is PASS and every raised `V3-NN-FOLLOWUP` has merged and re-verified. The verdict **INTEGRATION-VERIFIED** is the single condition that unblocks V3-95. If any check is NOT VERIFIED, the pass stays open until the named follow-ups close.

## Final report contract

`.codex-temp/v3-94-closure-integration-test/report.md` with the standard 9 sections: 1) executive summary (verdict: INTEGRATION-VERIFIED or NOT VERIFIED); 2) files changed; 3) migration/RLS/env (none expected — no schema, no new env; audit reads only); 4) validation evidence (per-pass re-verification table + harness output); 5) smoke (S2/S3/S4 results); 6) live verification (S5 M/I/C re-audit chain + S6 perf/security diff + S8 owner walkthrough notes); 7) telemetry baseline (per-pillar event counts from `henry_events`); 8) deferred items (every `V3-NN-FOLLOWUP` raised, with owning Pass ID and severity); 9) pass-closure assertion (INTEGRATION-VERIFIED, with the full role × surface × pillar coverage proof). Hand-off: **V3-95** (launch readiness).

## Self-verification

- [ ] S1: every pass V3-13 → V3-93 re-verified; each report's checkboxes confirmed; each pass's own test suite re-run green; deliverables confirmed in `main` + on production; regressions filed as follow-ups.
- [ ] S2: `closure-integration-smoke.mjs` ALL PASS across 300+ surfaces; every URL routed through `@henryco/config`; zero 404/5xx internal links; zero fake-loading copy; 12-locale switch clean.
- [ ] S3: customer/operator/staff/owner × every protected surface verified; cross-division SSO seamless; `requireSensitiveAction` blocks-then-proceeds on wallet/KYC/payment/password/delete; multi-tab consistency holds.
- [ ] S4: `foundation-smoke.mjs` (V3-12) re-run ALL PASS — Foundation Lock holds after Phase C–I.
- [ ] S5: live Paystack test charge → webhook → ledger → receipt chain green; four money invariants re-proven (BIGINT minor units, idempotency, fail-closed webhook HMAC + reconciliation, double-entry truth); receipt legal entity = "Henry Onyx Limited" from config; RLS denial cross-tenant confirmed; DSAR/deletion/consent re-run; gating L-items closed or deferred.
- [ ] S6: Lighthouse + Sentry diffed against V3-12 baseline within tolerance; PNH-04 headers green on all 13 apps; `/api/health` 200 (`ok: true`) on all 13 production aliases.
- [ ] S7: hardcoded-text + domain-literal scanners repo-wide zero new violations (excl. `packages/search-ui/`); no operator-surface label-name fallbacks.
- [ ] S8: owner walkthrough conducted on physical phone + desktop; verbatim feedback captured; every gap filed as `V3-NN-FOLLOWUP` in `PASS-REGISTER.md`.
- [ ] Brand correctness: Henry Onyx / Henry Onyx Limited / HenryCo-code throughout; never "Henry & Co."; zero hardcoded domains in the harness.
- [ ] Report written with verdict INTEGRATION-VERIFIED or NOT VERIFIED; hand-off: **V3-95** (launch readiness).
