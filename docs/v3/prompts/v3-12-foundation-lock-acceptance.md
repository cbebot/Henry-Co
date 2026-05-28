# V3-12 — Foundation Lock Acceptance

**Pass ID:** V3-12
**Phase:** B (FOUNDATION LOCK) — closure pass
**Pillar:** P12 (Global)
**Dependencies:** V3-01 through V3-11 ALL closed
**Effort:** M (1–2 weeks; mostly verification + owner sign-off)
**Parallel-safe:** NO (sequential close of Phase B)
**Owner gate:** D11 (Foundation Lock acceptance — answered in this pass)
**Risk class:** None

---

## Role

You are the V3 Foundation acceptance auditor. This pass is not new construction — it is verification + owner sign-off. You red-team the foundation, document every find, and produce the signed certificate that gates Phase C.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/12-foundation-acceptance` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary

Phase B (FOUNDATION LOCK) closes 11 sub-bars across V3-01 through V3-11. This pass verifies all 11 are actually closed on production — not just in repo state.

Owner instruction (from `OWNER-BRIEF.md`):

> "If the core feels solid, every later version compounds instead of collapsing."

> "Build with proof, not hope, define hard acceptance checks: no dead links, no hardcoded texts, no fake loading states, no duplicated UI labels, no refresh loops that lose context, no empty dashboards pretending to be active systems, no major flows without logs, states, and fallback handling."

---

## Mandatory scope

### S1 — Per-pass closure verification

For each pass V3-01 through V3-11:
- Read its `.codex-temp/v3-NN-*/report.md`.
- Verify every "Self-verification" checkbox is checked.
- Verify the deliverables exist in main (not just on a branch).
- Verify the smoke + live verification evidence is sufficient.
- Note any gaps.

Output `docs/v3/foundation-lock-acceptance.md` Section 1 with per-pass verification rows.

### S2 — Live foundation smoke (the red-team walk)

Author a script `scripts/v3/foundation-smoke.mjs` that walks production and validates:

**Session persistence (V3-01):**
- Sign in. Hard-refresh. Confirm still signed in.
- Open a form. Refresh. Confirm draft restored.
- Sign out in another tab. Confirm soft-toast in first tab.
- Force token expiry. Confirm transparent refresh.

**Auth reliability (V3-02):**
- OAuth sign-in flow end-to-end.
- Logout-everywhere from one device. Confirm second device signs out on next interaction.
- Trigger a sensitive action without recent reauth. Confirm modal blocks; complete reauth; confirm action proceeds.

**Notification + message states (V3-03):**
- Send a support message; recipient sees sent → delivered → seen pip transitions.
- Open a thread; "New" divider renders above first unread.
- Bell badge count updates live.

**Deep links (V3-04):**
- Open a notification deep link unauth. Confirm auth round-trip returns to target.
- Click a share link. Confirm attribution.
- Open a universal link on iOS device. Confirm app opens (if installed) or web fallback.

**Kill loading theater (V3-05):**
- `curl https://care.henrycogroup.com/` and 6 other named surfaces — confirm NO "Loading X" / "Preparing X" in first-render HTML.

**Dead-link sweep (V3-06):**
- Run live-walk script. Confirm zero 404/5xx on internal hrefs across top 30 routes per app.

**Hardcoded text cleanup (V3-07):**
- Switch locale via the 12-locale selector. Confirm strings render in selected locale (or DeepL fallback) — no untranslated runtime fallbacks beyond expected DeepL usage.

**Empty dashboard truth (V3-08):**
- Visit owner workspace + customer dashboard + staff workspace. Confirm every tile distinguishes loading / empty-yet / empty-no-match / error / real data.

**Mobile consistency (V3-09):**
- On physical iPhone + Android: walk auth, support thread, marketplace checkout, KYC. Confirm safe-area + keyboard avoidance + touch targets + modal escape.

**Logs/states/fallbacks (V3-10):**
- Trigger an intentional error on a mutating route. Confirm Sentry receives it, logger emits structured log, response includes degraded field if applicable.
- Curl `/api/health` on all 10 apps; confirm 200.

**One-job-per-card (V3-11):**
- Owner walks 10 representative surfaces. For each card, asks "what's the exact next step?" and confirms the answer.

Each check produces a pass/fail + evidence (screenshot, curl output, log snippet).

### S3 — Cross-cutting tests

Beyond per-pass verification:

- **Auth+role matrix** — sign in as customer, division operator, staff, owner; confirm each lands at correct redirect, sees correct nav, gets correct notifications, can't access other roles' surfaces.
- **Cross-division navigation** — from account, click into each division; confirm seamless SSO.
- **Cross-tab consistency** — make changes in tab A; observe in tab B.
- **Mobile-web parity** — every flow tested on web mobile.

### S4 — Performance baseline

Capture Lighthouse mobile + desktop scores for top 30 routes per app. This is the baseline V3-89 (observability depth) will defend.

Output `docs/v3/performance-baseline-foundation-lock.md`.

### S5 — Security baseline

Re-run the V2-PNH-04 headers gate across all 10 apps. Confirm baseline preserved through Phase B.

Run `pnpm a11y` against the top 10 surfaces per app. Document residual a11y findings (per-route a11y remediation is V3-89 + N2).

### S6 — Telemetry health

Verify all events from V3-01 through V3-11 are emitting in production:
- Session events
- Auth events
- Notification events
- Deep-link events
- UI events (skeleton, card)
- Observability events

Output `docs/v3/telemetry-baseline-foundation-lock.md` with first-day event counts.

### S7 — Owner-facing acceptance walkthrough

Schedule a live owner walkthrough:
- Owner navigates the 10 representative surfaces on a physical phone + desktop.
- For each surface, owner answers: "Does this feel solid? Does every card open the exact next step? Are there any fake states?"
- Capture owner verbatim feedback.

If owner identifies a regression or gap: open a follow-up V3-NN-FOLLOWUP item and add to PASS-REGISTER.md.

### S8 — Sign-off certificate

When all S1–S7 pass:
- Produce `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md` with:
  - Date.
  - Pass IDs verified (V3-01 through V3-11).
  - Smoke results summary.
  - Performance + security + telemetry baselines.
  - Owner signature line.
- Owner signs.
- Phase C is now startable.

---

## Out of scope

- New feature work (acceptance only).
- New foundation-lock items (this pass closes Phase B; new items become V3-NN-FOLLOWUP in the register).

---

## Dependencies

- V3-01 through V3-11 ALL closed.

Blocks:
- Phase C entire (V3-13+).

---

## Inheritance

- Every output from V3-01 through V3-11.
- Existing V2-PNH-04 headers gate.
- Existing `pnpm a11y`, `pnpm i18n:check`, `pnpm typecheck` CI.

---

## Implementation requirements

### Files

- `scripts/v3/foundation-smoke.mjs` (new — orchestrates S2)
- `docs/v3/foundation-lock-acceptance.md` (new — per-pass verification + S3 findings)
- `docs/v3/performance-baseline-foundation-lock.md` (new — S4 output)
- `docs/v3/telemetry-baseline-foundation-lock.md` (new — S6 output)
- `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md` (new — signed)
- `.codex-temp/v3-12-foundation-acceptance/report.md` (the pass report)

---

## Trust / safety / compliance

- The certificate is the closure artifact. Don't sign if any S1–S7 returns a fail.
- If a regression is found, V3-12 doesn't close until V3-NN-FOLLOWUP closes — preserve the gate.

## Mobile + desktop parity

- Live owner walkthrough on both.

## i18n

- Walkthrough includes locale-switch verification.

---

## Validation gates

1. Every pass V3-01–V3-11 verified per S1.
2. Foundation smoke script returns ALL PASS.
3. Auth+role matrix passes.
4. Performance + security + telemetry + i18n baselines captured.
5. Owner sign-off received.

## Deployment gate

This pass IS the gate. No new code deployed in this pass beyond the smoke script.

## Final report contract

`.codex-temp/v3-12-foundation-acceptance/report.md` with:
1. Executive summary
2. Per-pass verification table
3. Foundation smoke results
4. Cross-cutting test results
5. Performance baseline
6. Security + a11y residual findings
7. Telemetry baseline
8. Owner walkthrough notes
9. Sign-off status — CERTIFIED or NOT CERTIFIED

If NOT CERTIFIED: name every blocking item with a follow-up Pass ID.

---

## Self-verification

- [ ] All 11 prior pass reports verified.
- [ ] Foundation smoke script run + all checks pass.
- [ ] Auth+role matrix verified.
- [ ] Performance baseline captured.
- [ ] Security baseline preserved.
- [ ] Telemetry verified emitting.
- [ ] Owner walkthrough conducted.
- [ ] Owner signed FOUNDATION-LOCK-CERTIFICATE.
- [ ] Phase B closed. Phase C startable.
- [ ] D11 (Foundation Lock acceptance) answered in DECISIONS-REQUIRED.md.
