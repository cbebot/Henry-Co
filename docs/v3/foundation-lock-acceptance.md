# V3-12 — Foundation Lock Acceptance

**Pass:** V3-12 (Phase B closure — acceptance + owner sign-off)
**Branch:** `v3/12-foundation-acceptance`
**Author:** Claude · Opus 4 · V3 Foundation acceptance auditor
**Date:** 2026-05-29
**Status:** **SCAFFOLD DELIVERED — NOT YET CERTIFIED.** Repo-state verification (S1) complete; live-production smoke (S2), cross-cutting live tests (S3), performance (S4), security/a11y (S5), telemetry-in-prod (S6), owner walkthrough (S7), and the signature (S8) are **owner-gated** and not claimed here.

> **NO FAKE CLAIMS.** This document verifies only what can be verified from `main` repo state. It does NOT assert that any live-production behavior passed — those checks require production access, physical devices, and the owner, and are explicitly marked PENDING. Certification is withheld until they clear (see `FOUNDATION-LOCK-CERTIFICATE.md`).

---

## Section 1 — Per-pass closure verification (repo state)

**Method:** for each pass V3-01..V3-11, confirm its merge commit is an ancestor of `origin/main` and its named deliverables exist in the tree. This proves the *code* landed; it does NOT prove production behavior (that is S2/S7).

| Pass | Title | Merge commit(s) | On `main`? | Deliverable spot-check | Live-prod verified? |
|---|---|---|---|---|---|
| V3-01 | Session persistence | #129 `1caf3897`, slice-5b #130 `217c66e4` | ✅ | reauth round-trip + draft restore + A4 rollback gate + CI gate | ⏳ owner-gated (S2) |
| V3-02 | Auth reliability | #158 `11ffea5c` | ✅ | `logoutEverywhere`, sensitive-action reauth modal, OAuth UX | ⏳ owner-gated (S2) |
| V3-02b | Public-shell logout (blocker) | #163 `c73bc8c4` | ✅ | 6 shells wire `onSignOut`→`logoutEverywhere` | ⏳ owner-gated (S2) |
| V3-03 | Notification & message states | #131 `d825cd60` | ✅ | `is_read`/`read_at`, sent/delivered/seen state machine | ⏳ owner-gated (S2) |
| V3-04 | Deep links | #166 `75a59dc0` | ✅ | auth round-trip mw, AASA/assetlinks, `@henryco/seo/deeplinks`, telemetry | ⏳ owner-gated (S2) |
| V3-05 | Kill loading theater | #132 `0c33ffa2` | ✅ | warmup-copy sweep; plain-state language | ⏳ owner-gated (S2, curl) |
| V3-06 | Dead-link sweep | #165 `bb301d46` | ✅ | static scan + CI `--check` gate (0 DEAD/0 LEGACY) | ⏳ owner-gated (S2, live-walk) |
| V3-07 | Hardcoded text cleanup | #134 `9e192a3d` | ✅ | i18n-gaps closed; domain-literal reduction | ⏳ owner-gated (S2, locale switch) |
| V3-08 | Empty-dashboard truth | #164 `cb03dd4e` | ✅ | tile state distinction; 0 mock literals; honest trends | ⏳ owner-gated (S2) |
| V3-09 | Mobile consistency | #135 `8396a93e` | ✅ | safe-area, keyboard avoidance, modal escape | ⏳ owner-gated (S5, physical device) |
| V3-10 | Logs/states/fallbacks | #133 `42c2562f`, systemic fix #152 `54e25c12` | ✅ | `@henryco/observability` adoption; degraded-side-effect reporting | ⏳ owner-gated (S2, error inject) |
| V3-11 | One-job-per-card | #167 `21190952` | ✅ | inventory (A87/B0/C12/D0/review0), `--check` D-gate, card telemetry | ⏳ owner-gated (S7, owner walk) |

**S1 result:** **12/12 passes' code is merged to `main`** (all merge commits confirmed ancestors of `origin/main`). Two passes carry **named, honest deferrals** (not gaps hidden): V3-04 (S5 share attribution + client not-found beacon) and V3-11 (S4–S8 qualitative audits + broad telemetry rollout). See `docs/closure/wave-b2-synthesis.md` §4. These are quality/rollout follow-ups; they do not block Phase B *code* completion.

---

## Section 2 — Live foundation smoke (S2) — PENDING

The smoke orchestrator is authored at `scripts/v3/foundation-smoke.mjs`. It must be run against production by the owner (or wired into a scheduled CI job with production credentials). It is **not run here** — the conductor environment has no production session, no physical devices, and must not fabricate pass/fail evidence.

Run: `node scripts/v3/foundation-smoke.mjs --base https://<prod>` → emits a per-check pass/fail table. Until that runs with real output attached, every S2 row stays ⏳.

---

## Section 3 — Cross-cutting tests (S3) — PENDING (owner / live)
Auth+role matrix, cross-division SSO, cross-tab consistency, mobile-web parity. Require live multi-role sessions.

## Section 4 — Performance baseline (S4) — PENDING (owner / live)
Lighthouse mobile+desktop for top 30 routes/app → `docs/v3/performance-baseline-foundation-lock.md` (not yet produced; needs live URLs).

## Section 5 — Security + a11y baseline (S5) — PENDING (owner / CI)
Re-run V2-PNH-04 headers gate + `pnpm a11y` top-10 surfaces/app. The repo a11y workflow exists; results must be captured against the deployed apps.

## Section 6 — Telemetry health (S6) — PENDING (owner / prod read)
Confirm session/auth/notification/deep-link/UI(skeleton,card)/observability events emit in production → `docs/v3/telemetry-baseline-foundation-lock.md` with first-day counts. Requires a production `henry_events` read.

## Section 7 — Owner walkthrough (S7) — PENDING (owner)
Owner walks 10 representative surfaces on phone + desktop; answers "solid? exact next step? any fake states?" per surface. Capture verbatim.

## Section 8 — Sign-off (S8) — WITHHELD
`docs/v3/FOUNDATION-LOCK-CERTIFICATE.md` is staged as **NOT CERTIFIED**. It is signed only when S2–S7 return all-pass. Per the prompt's safety rule: *"Don't sign if any S1–S7 returns a fail."* No fail is recorded — but S2–S7 have not been **run**, which is itself a not-yet-certifiable state.

---

## Gaps / follow-ups identified

- **G1 (owner):** Close contaminated PR #161 (duplicate V3-02b; clean impl shipped as #163).
- **G2 (deferred pass):** V3-04 S5 share attribution + client not-found beacon.
- **G3 (deferred pass):** V3-11 S4–S8 qualitative audits + broad card-telemetry rollout.
- **G4 (owner-gated):** Run `foundation-smoke.mjs` against production and attach output to Section 2.

None of G1–G4 are foundation-lock *regressions*; G2/G3 are pre-declared rollout follow-ups, G1 is hygiene, G4 is the live-verification step that gates the signature.
