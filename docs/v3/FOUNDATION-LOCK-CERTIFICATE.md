# Foundation Lock Certificate — HenryCo V3 Phase B

**Status:** 🔴 **NOT CERTIFIED — owner sign-off pending.**

This certificate is the single artifact that declares Phase B Foundation Lock
COMPLETE. It is **withheld** until the live-production acceptance checks pass and
the owner signs. The conductor does **not** self-sign — certification asserts
production behaviour, and the conductor environment has no production session,
no physical devices, and is not the owner.

> **NO FAKE CLAIMS.** Nothing below is checked off until it is genuinely verified
> against the deployed product. A withheld signature is the honest state when the
> code is merged but the live proof has not yet been collected. See
> `docs/v3/foundation-lock-acceptance.md` for the per-section method.

---

## Gate 1 — Code merged to `main` (S1) — ✅ VERIFIED (repo state)

All 12 Phase B passes' code is merged to `origin/main` (merge commits confirmed
ancestors of `main`); deliverables spot-checked in tree. Two passes carry named,
honest deferrals (V3-04 S5 share-attribution + client not-found beacon; V3-11
S4–S8 qualitative audits + broad telemetry rollout) — quality/rollout follow-ups,
not Phase-B-code gaps. Full table: `docs/v3/foundation-lock-acceptance.md` §1.

| Pass | Title | On `main`? |
|---|---|---|
| V3-01 | Session persistence | ✅ |
| V3-02 | Auth reliability | ✅ |
| V3-02b | Public-shell logout | ✅ |
| V3-03 | Notification & message states | ✅ |
| V3-04 | Deep links | ✅ |
| V3-05 | Kill loading theater | ✅ |
| V3-06 | Dead-link sweep | ✅ |
| V3-07 | Hardcoded text cleanup | ✅ |
| V3-08 | Empty-dashboard truth | ✅ |
| V3-09 | Mobile consistency | ✅ |
| V3-10 | Logs/states/fallbacks | ✅ |
| V3-11 | One-job-per-card | ✅ |

---

## Gate 2 — Live production smoke (S2) — ⏳ PENDING (owner / CI)

Run `node scripts/v3/foundation-smoke.mjs --base https://<prod> --json smoke.json`
against production. The script refuses to imply success when no origin is
reachable (prints a NO-EVIDENCE banner), so the only way this gate flips to ✅ is
a real run with a real table attached here.

- [ ] AASA served (apex) — `applinks` JSON
- [ ] assetlinks.json served (apex) — relation array
- [ ] Protected deep link → login redirect with return param (no leak)
- [ ] Auth-gated surface gates (no 200 leak, no 500)
- [ ] Notifications API gates unauthenticated (no 500)
- [ ] Homepage free of loading-theater copy
- [ ] Every division homepage serves (no 404/5xx)

**Attach run output:** _(paste the per-check table + smoke.json summary here)_

---

## Gate 3 — Cross-cutting live tests (S3) — ⏳ PENDING (owner / live)

- [ ] Auth + role matrix across divisions
- [ ] Cross-division SSO (one login, all divisions)
- [ ] Cross-tab session consistency (logout-everywhere propagates)
- [ ] Mobile-web parity for the above

---

## Gate 4 — Performance baseline (S4) — ⏳ PENDING (owner / live)

- [ ] Lighthouse mobile + desktop, top 30 routes/app
- [ ] Recorded in `docs/v3/performance-baseline-foundation-lock.md`

---

## Gate 5 — Security + a11y baseline (S5) — ⏳ PENDING (owner / CI)

- [ ] V2-PNH-04 headers gate re-run green against deployed apps
- [ ] `pnpm a11y` top-10 surfaces/app — no criticals

---

## Gate 6 — Telemetry health (S6) — ⏳ PENDING (owner / prod read)

- [ ] session / auth / notification / deep-link / UI(skeleton, card) / observability
      events confirmed emitting in production (first-day counts)
- [ ] Recorded in `docs/v3/telemetry-baseline-foundation-lock.md`

> Note: `henry_events` has **no `outcome` column** — confirm by `name` +
> `payload->>'target'/'source'/'outcome'`, matching the shipped readers.

---

## Gate 7 — Owner walkthrough (S7) — ⏳ PENDING (owner)

- [ ] Owner walks 10 representative surfaces on **phone** + **desktop**
- [ ] Per surface: "solid? exact next step present? any fake states?" — verbatim
- [ ] No fake/placeholder states found

---

## Gate 8 — Signature (S8) — 🔴 WITHHELD

Sign **only** when Gates 2–7 each return all-pass. Safety rule (from the V3-12
prompt): *"Don't sign if any S1–S7 returns a fail."* No fail is recorded — but
Gates 2–7 have not been **run**, which is itself not-yet-certifiable.

```
Phase B Foundation Lock — CERTIFIED

Owner signature: ____________________________
Date:            ____________________________
Smoke run ref:   ____________________________   (foundation-smoke.mjs output)
Perf baseline:   ____________________________
Telemetry ref:   ____________________________
Notes:           ____________________________
```

---

## Open items gating this certificate

- **G1 (owner hygiene):** Close contaminated PR #161 (duplicate V3-02b; clean impl is #163).
- **G4 (owner-gated):** Run `foundation-smoke.mjs` against production; attach to Gate 2.
- **G2 / G3 (deferred passes):** V3-04 S5 + V3-11 S4–S8 — pre-declared rollout
  follow-ups; do **not** block this signature but are tracked in
  `docs/closure/wave-b2-synthesis.md` §4.

Until Gate 8 is signed, **Phase B is code-complete but NOT locked.** Phase C
(V3-13+) starts only after the signature.
