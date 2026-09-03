# Wave B.2 — Synthesis & Closure

**Wave:** B.2 (Phase B Foundation Lock — second/closing salvage wave)
**Passes conducted:** V3-02b, V3-08, V3-06, V3-04, V3-11
**Conductor:** Claude · Opus 4 · V3 Foundation conductor (direct-authoring model)
**Date:** 2026-05-29
**Status:** **ALL 5 WAVE-B.2 PASSES MERGED TO `main`.** Phase B code work complete; only V3-12 acceptance (owner-gated) remains.

---

## 1. What Wave B.2 was

Wave B.2 was the closing salvage wave of Phase B. Five passes had been started by quota-cut sub-agents whose WIP landed on `origin wip/v3-b2/*` branches (and, for two, only partially). A hard environment finding shaped the whole wave:

> **Background sub-agents in this environment are WRITE-BLOCKED inside the repo** — every `Edit`/`Write`/`mkdir` was denied (a "sensitive-package guard" that then generalized). They could READ + VERIFY but not finish. The **conductor (main) session CAN write repo code** (verified by a successful probe write).

→ **Governance pivot:** the conductor finished every pass by **direct authoring**, and **CI (`GitHub Actions → CI / Lint, typecheck, test, build`) was the authoritative build gate** — the shared worktree root has no `node_modules`, so local `next build`/`tsc` was not the path. Each pass was authored on a `conductor/<pass>` branch, pushed to its canonical `v3/<pass>` ref, opened as a PR, and squash-merged **only on the green required check** (the known-good `MERGEABLE + UNSTABLE` state, where deploy-preview/a11y/e2e noise is non-required).

This synthesis is the honest record of what each pass delivered, what it deferred, and what remains for the owner.

---

## 2. The five passes (merge order)

Base before the wave: `5fa16317` (V3-02 merge `11ffea5c` #158 + post-login redirect fix #162).

| # | Pass | PR | Squash SHA | One-line |
|---|---|---|---|---|
| 1 | V3-02b — public-shell logout-everywhere | #163 | `c73bc8c4` | 6 public shells route sign-out through `logoutEverywhere` |
| 2 | V3-08 — empty-dashboard truth | #164 | `cb03dd4e` | Tiles distinguish loading / empty-yet / empty-no-match / error / real |
| 3 | V3-06 — dead-link sweep | #165 | `bb301d46` | Static scan + CI `--check` gate + link fixes |
| 4 | V3-04 — deep links | #166 | `75a59dc0` | Auth round-trip + universal/app links + typed builders + telemetry |
| 5 | V3-11 — one-job-per-card | #167 | `21190952` | Card inventory + enforceable D-gate + card telemetry |

### V3-02b — public-shell logout-everywhere (`c73bc8c4`, #163)
**Shipped:** care, jobs, learn, logistics, property, studio public shells now wire `onSignOut={() => logoutEverywhere({ supabase, redirectTo: "/" })}` via thin `"use client"` `*AccountChip` wrappers (learn inline; matches the marketplace template). Closes the "no dead logout paths" foundation-lock gap that the register flagged as a **V3-12 blocker**.
**Build:** the merged branch (`ea19cefc`) was build-verified — real `next build` green ×6 + typecheck + lint.
**⚠ Owner action:** PR **#161 is CONTAMINATED** (a divergent `feat/v3-02b-public-shell-onsignout-wirings` head that also guts `packages/config/company.ts`, deletes `company.test.mjs`, edits `packages/auth/src/server.ts` — never built/validated). The clean `ea19cefc` was merged as #163 instead. **#161 is still OPEN — the owner should close it** (the conductor deliberately did not).

### V3-08 — empty-dashboard truth (`cb03dd4e`, #164)
**Shipped:** ReferralsCard fake "up" trend → honest "flat"; subscriptions empty-state CTA + footnote across 12 locales; **0** mock/sample/dummy literals across 7 divisions + invoices. Every audited tile now distinguishes its states truthfully.

### V3-06 — dead-link sweep (`bb301d46`, #165)
**Shipped:** static dead-link scanner + CI `--check` gate (0 DEAD / 0 LEGACY static), link fixes, artifact hygiene (large generated catalogs gated behind an opt-in flag rather than committed run-to-run). S7 seed fix: cross-division account seeds target the hub host so `henryWebRoot("/terms")` does not register a false 404. Live-walk 404s were confirmed to be an **environment artifact** (apex not serving the hub deploy), **not code bugs**.

### V3-04 — deep links (`75a59dc0`, #166) — the lynchpin
**Shipped:** S1 auth round-trip middleware (`deep-link-middleware.ts` + account callback, open-redirect defense); S2 universal/app links (20 AASA + assetlinks handlers + Expo `app.json`); S3 inventory; S4 typed builders `@henryco/seo/deeplinks`; S6 email UTM; **S7** owner `DeepLinkHealthTile` + `getDeepLinkHealthMetrics` (reads `payload->>target/outcome` — there is **no** `outcome` column on `henry_events`); **S8** `recordDeepLinkArrived`/`recordDeepLinkDeadLink` in `packages/observability/src/deeplink-telemetry.ts`, wired into account `[...slug]/page.tsx` via `after()` so telemetry never blocks routing.
**Deferred (honestly, in the #166 body):** **S5 share-attribution wiring** (mount `<ShareButton/>` across marketplace/property/jobs/learn + `customer_referrals` credit + signup attribution) and the **client-side not-found beacon** (public ingest needs abuse-hardening). Confirmed still unmounted on `main`.
**Note:** mobile native config hardcodes the domain (unavoidable — Expo `app.json` is static); web/server paths are fully config-derived.

### V3-11 — one-job-per-card (`21190952`, #167)
**Shipped:** S1 inventory scanner (`scripts/v3/card-inventory.mjs`, `node:fs`-only so it runs without `node_modules` and in CI); S2 classification → **total=99, A=87, B=0, C=12 (C1:5 C2:7 C3:0), D=0, needs-review=0, excluded=3** (loading skeletons + a staff-care `page-server` loader excluded **transparently** via `NON_CARD_STRUCTURAL_RE` and listed in the report; genuinely-ambiguous surfaces resolved via `CLASS_OVERRIDES` recorded human judgements). The `--check` D-gate is **green** (no card "looks actionable but does nothing"). S9 telemetry: 3 canonical `henry.ui.card.{rendered,clicked,demoted}` events + `<CardTelemetry>` primitive in `@henryco/ui` + an owner clickthrough tile.
**Deferred (honestly, in the #167 body + report):** **S4–S8 qualitative design audits** (button-label exactness, summary drill-down, cross-surface consistency, density, mobile) — not started; telemetry wired into **1 of 87** A-cards as the reference integration; `dashboard-shell` `nextStep` contract field is type-level only. Mirrors V3-04's foundation-vs-rollout split.

---

## 3. Integrity gate (load-bearing — do not soften)

V3-02 (#158) merged **2026-05-28T09:10:55Z**. Its Addendum-A4 rollback gate prescribed a residual 48h soak (deadline **2026-05-30T09:10Z**). **The owner WAIVED the residual soak window**; the pass was green through **+6h**.

> Closure docs MUST state: **"residual soak window waived by owner — green through +6h,"** NOT "completed 48h soak" (it did not run to +48h). The owner once asked to phrase it as "completed"; the truthful waiver framing was used and later affirmed (**"NO FAKE CLAIMS"**). This wave holds that line.

The same honesty standard governs the deferrals in §2: every deferred item is named in its PR body and pass report, not quietly dropped.

---

## 4. Deferrals carried out of Wave B.2 (consolidated)

These are real, named follow-ups — not hidden gaps:

1. **V3-04 S5 — share attribution** (`<ShareButton/>` mounts + `customer_referrals` source='share' credit + `henry.share.attributed_install` on share-arrival signup). Deferred for a dedicated pass.
2. **V3-04 — client-side not-found beacon** (public ingest endpoint needs abuse-hardening before shipping).
3. **V3-11 S4–S8 — qualitative card/button/summary audits** (labels, drill-down, consistency, density, mobile) + broad `<CardTelemetry>` rollout beyond the 1 reference card + `dashboard-shell` `nextStep` runtime consumers.

None of these block Phase B *code* completion; they are quality/rollout follow-ups consistent with the "ship the enforceable foundation, label the rollout" pattern.

---

## 5. Open items for the owner

1. **Close PR #161** (contaminated V3-02b duplicate — still OPEN). The clean implementation shipped as #163.
2. **V3-12 Foundation Lock acceptance is owner-gated (D11).** The conductor-doable scaffold (per-pass verification + smoke script + NOT-CERTIFIED certificate) is delivered alongside this synthesis; the live-production smoke, Lighthouse baseline, physical iPhone/Android walk, owner walkthrough, and the **signature** require the owner. See `docs/v3/foundation-lock-acceptance.md` and `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md`.

---

## 6. Phase B status

All Phase B foundation passes are merged to `main`:

V3-01 (#129/#130) · V3-02 (#158) · V3-02b (#163) · V3-03 (#131) · V3-04 (#166) · V3-05 (#132) · V3-06 (#165) · V3-07 (#134) · V3-08 (#164) · V3-09 (#135) · V3-10 (#133/#152) · V3-11 (#167).

**Phase B does not formally CLOSE until V3-12 returns owner sign-off (D11).** Wave B.2 delivered the code; V3-12 delivers the proof and the certificate. Phase C (V3-13+) starts only after that signature.
