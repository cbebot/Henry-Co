# V3-94 — Closure: Integration Test Pass

**Pass ID:** V3-94
**Phase:** I (closure)
**Pillar:** P12 (Closure)
**Dependencies:** V3-13 through V3-93 ALL closed
**Effort:** L (2–4 weeks)
**Parallel-safe:** NO (sequential close of V3)
**Owner gate:** None
**Risk class:** Identity, Money, Compliance (re-verify)

---

## Role

You are the V3 closure auditor. This pass is verification at depth + cross-pillar smoke.

---

## Mandatory scope

### S1 — Cross-pillar smoke test

For every closed pass (V3-13 through V3-93):
- Verify pass-level smoke still passes.
- Verify no regression from later passes.
- Capture evidence.

### S2 — Live walk every public surface

Top 30 routes per app × 10 apps = 300 surfaces. For each:
- HTTP 200.
- No fake loading copy.
- All links resolve.
- All cards have clear next step.
- Telemetry events firing.

### S3 — Auth + role matrix

5 roles × every protected surface verified.

### S4 — Foundation-lock regression test

Re-run V3-12 acceptance smoke. Verify no Phase B regression.

### S5 — Money + identity + compliance audit

For every M/I/C-flagged pass:
- Re-verify production state.
- Re-run compliance checklist.
- Engage legal review where applicable.

### S6 — Performance vs V3-12 baseline

Compare Lighthouse + Sentry error rate + LCP/CLS/INP to V3-12 baseline. Regression triggers V3-NN-FOLLOWUP.

### S7 — Owner-facing acceptance walkthrough

Owner walks the platform end-to-end on physical phone + desktop. Captures verbatim feedback. Anything that fails the bar opens a follow-up Pass ID.

---

## Out of scope

- New feature work.
- New construction (only verification + necessary regression fixes).

## Dependencies / Inheritance / Trust / Mobile / i18n / Gates / Deployment / Report

Cross-pass; standard structure.

---

## Self-verification

- [ ] Every pass V3-13..V3-93 verified.
- [ ] Cross-pillar smoke complete.
- [ ] Live walk complete (300 surfaces).
- [ ] Auth+role matrix complete.
- [ ] Foundation-lock regression clean.
- [ ] M/I/C-flagged passes re-verified.
- [ ] Perf vs V3-12 baseline within tolerance.
- [ ] Owner walkthrough conducted.
- [ ] Report written. Hand-off: V3-95 (launch readiness).
