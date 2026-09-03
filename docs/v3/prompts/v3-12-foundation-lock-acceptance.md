# V3-12 — Foundation Lock: Acceptance & Certification

> **STATUS: SHIPPED — PR #168. Foundation Lock CERTIFIED.** Phase B (V3-01 → V3-11) is closed; owner sign-off recorded; D11 (Foundation Lock acceptance) is answered; Phase C is unblocked and underway (V3-13 #169, V3-15 #170). Treat this as the elevated canonical record of *how* the foundation was red-teamed and certified, and as the standing regression contract — V3-94 (closure integration test) re-runs this smoke end-to-end. Any item still open is named as residual hardening at the end, not as unbuilt scope. Owner-gated note: D11's answer is already recorded in `docs/v3/DECISIONS-REQUIRED.md` — **confirm it, do not re-litigate it.**

**Pass ID:** V3-12  ·  **Phase:** B (Foundation Lock) — closure pass  ·  **Pillar:** P12 (Global)
**Dependencies:** V3-01 → V3-11 ALL closed  ·  **Effort:** M  ·  **Parallel-safe:** N (sequential close of Phase B)
**Owner gate:** D11 (Foundation Lock acceptance — confirmed here)  ·  **Risk class:** —

---

## Role

You are the V3 Foundation acceptance auditor for Henry Onyx. You execute exactly this one pass, then stop and report. This is not new construction — it is verification, red-team, and the signed certificate that gates Phase C. You prove the foundation is solid **on production**, not merely in repo state, then capture the performance, security, telemetry, and i18n baselines that every later pass compounds on. The line you must not cross: you ship no new feature code beyond the smoke harness; you do not sign the certificate while any S1–S7 check returns a fail; and you do not start any Phase C pass — that is gated on this certificate.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/12-foundation-acceptance` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Phase B closes 11 sub-bars across V3-01 → V3-11 — session persistence, auth reliability, notification/message states, deep links, kill-loading-theater, dead-link sweep, hardcoded-text cleanup, empty-dashboard truth, mobile consistency, logs/states/fallbacks, and one-job-per-card. Each shipped with its own report and self-verification, but "closed on a branch" is not "solid on production." This pass verifies all 11 are live, regression-walks production as a red team, and produces the certificate. It honours the owner's bar verbatim:

> "Build with proof, not hope. Define hard acceptance checks: no dead links, no hardcoded texts, no fake loading states, no duplicated UI labels, no refresh loops that lose context, no empty dashboards pretending to be active systems, no major flows without logs, states, and fallback handling."

> "If the core feels solid, every later version compounds instead of collapsing."

## Mandatory scope

### S1 — Per-pass closure verification
For each pass V3-01 → V3-11: read its `.codex-temp/v3-NN-*/report.md`, confirm every self-verification checkbox is checked, confirm the deliverables exist **in `main`** (not just on a branch), and confirm the smoke/live evidence is sufficient. Record gaps. Output `docs/v3/foundation-lock-acceptance.md` §1 with one verification row per pass.

### S2 — Live foundation smoke (the red-team walk)
Author `scripts/v3/foundation-smoke.mjs` that walks production. **Every URL resolves through `@henryco/config` (`henryDomain(division)` / `henryWebRoot()` / `getAccountUrl()`) — zero hardcoded `henrycogroup.com` literals in the harness** (V3-07c enforces this repo-wide; the smoke script must not reintroduce them). Each check yields pass/fail + evidence (screenshot, curl/HTTP output, log snippet):

- **Session persistence (V3-01):** sign in → hard-refresh → still signed in; open a form → refresh → draft restored; sign out in tab B → tab A shows soft toast; force token expiry → transparent refresh.
- **Auth reliability (V3-02):** OAuth sign-in end-to-end; logout-everywhere from device A → device B signs out on next interaction; sensitive action without recent reauth → modal blocks, complete reauth, action proceeds.
- **Notification + message states (V3-03):** send a support message → recipient sees sent → delivered → seen transitions; thread shows "New" divider above first unread; bell badge updates live.
- **Deep links (V3-04):** open a notification deep link while unauth → auth round-trip returns to target; share link attributes correctly; universal link on iOS opens app (if installed) or web fallback.
- **Kill loading theater (V3-05):** fetch `henryDomain('care')` and 6 other named surfaces → confirm NO "Loading X" / "Preparing X" in first-render HTML.
- **Dead-link sweep (V3-06):** run the live-walk → zero 404/5xx on internal `href`s across the top 30 routes per app.
- **Hardcoded-text cleanup (V3-07):** switch locale via the 12-locale selector → strings render in the selected locale (or expected DeepL fallback) — no unexpected label-name fallbacks.
- **Empty-dashboard truth (V3-08):** owner workspace + customer dashboard + staff workspace → every tile distinguishes loading / empty-yet / empty-no-match / error / real data.
- **Mobile consistency (V3-09):** on physical iPhone + Android, walk auth, support thread, marketplace checkout, KYC → safe-area + keyboard avoidance + 44px touch targets + modal escape all hold.
- **Logs/states/fallbacks (V3-10):** trigger an intentional error on a mutating route → Sentry receives it, logger emits a structured line, response carries a `degraded` field where applicable; curl `/api/health` on all 10 apps → 200.
- **One-job-per-card (V3-11):** owner walks 10 representative surfaces; for each card confirms the exact next step.

### S3 — Cross-cutting tests
- **Auth+role matrix:** sign in as customer, division operator, staff, owner → each lands at the correct redirect, sees the correct nav and notifications, and cannot reach another role's surfaces.
- **Cross-division navigation:** from account, enter each division → seamless SSO.
- **Cross-tab consistency:** change in tab A → observed in tab B.
- **Mobile-web parity:** every flow re-tested on web-mobile.

### S4 — Performance baseline
Capture Lighthouse mobile + desktop for the top 30 routes per app. This is the baseline V3-89 defends. Output `docs/v3/performance-baseline-foundation-lock.md`.

### S5 — Security + a11y baseline
Re-run the V2-PNH-04 headers gate across all 10 apps; confirm the baseline survived Phase B. Run `pnpm a11y` against the top 10 surfaces per app; document residual a11y findings (per-route remediation is V3-89 + N2).

### S6 — Telemetry health
Confirm every event from V3-01 → V3-11 is emitting in production — session, auth, notification, deep-link, UI (skeleton/card), observability. Output `docs/v3/telemetry-baseline-foundation-lock.md` with first-day event counts pulled from the `henry_events` sink.

### S7 — Owner-facing acceptance walkthrough
Schedule a live owner walkthrough on a physical phone + desktop across the 10 representative surfaces. For each, the owner answers: "Does this feel solid? Does every card open the exact next step? Are there any fake states?" Capture verbatim feedback. Any regression/gap → open a `V3-NN-FOLLOWUP` item and add it to `docs/v3/PASS-REGISTER.md`; the gate holds until that follow-up closes.

### S8 — Sign-off certificate + D11 confirmation
When S1–S7 all pass, produce `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md` with: date; pass IDs verified (V3-01 → V3-11); smoke results summary; performance + security + telemetry + i18n baselines; owner signature line. Owner signs. Record the confirmation of **D11 (Foundation Lock acceptance)** in `docs/v3/DECISIONS-REQUIRED.md` — confirm the already-recorded answer, do not re-open it. Phase C (V3-13+) is now startable.

## Out of scope
- New feature work (acceptance only) and new foundation-lock items — any new gap becomes a `V3-NN-FOLLOWUP` in the register, not scope here.
- Per-route a11y remediation and PR performance budgets → V3-89.

## Dependencies
V3-01 → V3-11 ALL closed. Blocks: the entire Phase C (V3-13+) — no Phase C pass starts until this certificate is signed (D11).

## Inheritance
- Every output from V3-01 → V3-11.
- The V2-PNH-04 headers gate; existing `pnpm a11y`, `pnpm i18n:check`, `pnpm typecheck` CI.
- The `henry_events` sink (V3-01 / V3-10) as the telemetry-health source.
- `@henryco/config` URL helpers — the smoke harness routes every URL through them.

## Implementation requirements

### Files
- `scripts/v3/foundation-smoke.mjs` (new — orchestrates S2, domain-helper-routed)
- `docs/v3/foundation-lock-acceptance.md` (new — per-pass verification + S3 findings)
- `docs/v3/performance-baseline-foundation-lock.md` (new — S4)
- `docs/v3/telemetry-baseline-foundation-lock.md` (new — S6)
- `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md` (new — signed)
- `docs/v3/DECISIONS-REQUIRED.md` (edit — confirm D11)
- `.codex-temp/v3-12-foundation-acceptance/report.md`
- No migrations; no new feature code.

### Trust / safety / compliance
The certificate is the closure artifact — do not sign if any S1–S7 returns a fail. If a regression is found, V3-12 does not close until the `V3-NN-FOLLOWUP` closes; the gate is load-bearing. The smoke harness reads production with least-privilege test credentials and never logs session tokens.

### Mobile + desktop parity
The live owner walkthrough and S2/S3 run on both physical mobile and desktop.

### i18n
The walkthrough includes a 12-locale switch verification; the smoke harness asserts no unexpected label-name fallbacks.

### Brand & design system
The certificate and acceptance docs name the brand as **Henry Onyx** / legal **Henry Onyx Limited**, resolved conceptually from `@henryco/config` — never "Henry & Co." The harness uses `henryDomain()` helpers; zero hardcoded domains.

## Validation gates
1. Every pass V3-01 → V3-11 verified per S1.
2. `foundation-smoke.mjs` returns ALL PASS.
3. Auth+role matrix passes.
4. Performance + security + telemetry + i18n baselines captured.
5. Owner sign-off received and the certificate signed.

## Deployment gate
This pass **is** the gate. No new product code deploys beyond the smoke harness. The certificate being signed (and D11 confirmed) is the single condition that unblocks Phase C.

## Final report contract
`.codex-temp/v3-12-foundation-acceptance/report.md` with: 1) executive summary; 2) per-pass verification table; 3) foundation-smoke results; 4) cross-cutting test results; 5) performance baseline; 6) security + a11y residual findings; 7) telemetry baseline; 8) owner walkthrough notes; 9) sign-off status — **CERTIFIED or NOT CERTIFIED** (if NOT, name every blocking item with a follow-up Pass ID).

## Self-verification
- [ ] S1: all 11 prior pass reports verified; deliverables confirmed in `main`.
- [ ] S2: `foundation-smoke.mjs` run, ALL checks pass, every URL routed through `@henryco/config` (zero hardcoded domains).
- [ ] S3: auth+role matrix, cross-division SSO, cross-tab, and mobile-web parity verified.
- [ ] S4: `performance-baseline-foundation-lock.md` captured (top 30 routes/app).
- [ ] S5: PNH-04 headers gate preserved; `pnpm a11y` residuals documented.
- [ ] S6: `telemetry-baseline-foundation-lock.md` captured from `henry_events`.
- [ ] S7: owner walkthrough conducted; any gap filed as `V3-NN-FOLLOWUP`.
- [ ] S8: `FOUNDATION-LOCK-CERTIFICATE.md` signed; D11 confirmed in `DECISIONS-REQUIRED.md`.
- [ ] Phase B closed; Phase C startable; report written with CERTIFIED / NOT CERTIFIED verdict.
