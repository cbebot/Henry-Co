# V3-12 — Foundation Lock acceptance (audit + smoke orchestrator + certificate)

**Pass:** V3-12 (Phase B Foundation Lock — closure/acceptance)
**Branch:** `v3/12-foundation-acceptance` (authored on `conductor/v3-12`)
**Base:** `origin/main` @ `21190952` (post V3-11 merge — the last Phase B code pass)
**Author:** Claude · Opus 4 · V3 Foundation conductor
**Status:** **SCAFFOLD DELIVERED — NOT CERTIFIED.** Conductor-doable acceptance
artifacts are complete (S1 repo-state verification, S2 smoke orchestrator,
NOT-CERTIFIED certificate, synthesis). S2-live, S3–S7, and the S8 signature are
**owner-gated** and explicitly NOT claimed.

---

## Objective (owner's literal question)

> "Is the foundation actually locked? Prove every pass landed, prove the live
> product serves the foundation behaviours, and only then sign."

V3-12 splits that into what a conductor can *prove from the repo* and what only
the owner can *prove against production*. It delivers the former honestly and
hands the latter to the owner with a runnable probe and an unsigned certificate
— rather than fabricating a green sign-off.

---

## What shipped (complete + verifiable)

### S1 — Per-pass closure verification (repo state) — `docs/v3/foundation-lock-acceptance.md`
For each pass V3-01..V3-11, confirmed the merge commit is an ancestor of
`origin/main` and spot-checked named deliverables in the tree. **Result: 12/12
passes' code merged to `main`** (V3-01 #129/#130, V3-02 #158, V3-02b #163, V3-03
#131, V3-04 #166, V3-05 #132, V3-06 #165, V3-07 #134, V3-08 #164, V3-09 #135,
V3-10 #133/#152, V3-11 #167). Live-prod columns are marked ⏳ owner-gated — S1
proves *code landed*, not *production behaviour*.

### S2 — Live smoke orchestrator — `scripts/v3/foundation-smoke.mjs`
Pure-`fetch` Node (no `node_modules`, runs in CI). Emits a per-check PASS/FAIL/
SKIP/WARN table across the HTTP-observable foundation behaviours:

| Check | Pass | Asserts |
|---|---|---|
| `aasa` | V3-04 | `/.well-known/apple-app-site-association` → 200 + `applinks` JSON |
| `assetlinks` | V3-04 | `/.well-known/assetlinks.json` → 200 + relation array |
| `deeplink-roundtrip` | V3-04 | protected deep link → login redirect w/ return param (no 200 leak) |
| `auth-gate` | V3-02 | gated surface gates (redirect/401/403), never 200-leak, never 500 |
| `notif-api-gate` | V3-03 | notifications API gates unauthenticated, never 500 |
| `no-loading-theater` | V3-05 | homepage HTML free of banned warmup copy |
| `top-routes-live` | V3-06 | every division homepage serves (no 404/5xx) |

**Honesty design (load-bearing):** origin resolution is env-driven (never
hardcodes the apex — mirrors `live-walk.mjs`); a guessed-route 404 is SKIP, not
a fake FAIL; and when **no origin is reachable** every check SKIPs and the run
prints a **"NO PRODUCTION EVIDENCE COLLECTED — this run proves NOTHING"** banner
and exits 0 (refuses to fake-pass *and* fake-fail). Self-tested against an
unreachable host: 7/7 SKIP, banner fired, exit 0 — confirming it cannot
manufacture a green S2.

### S8 scaffold — `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md`
Staged 🔴 **NOT CERTIFIED**. Gate 1 (code merged) is the only ✅; Gates 2–7 are ⏳
checklists; Gate 8 is a 🔴 **WITHHELD** signature block. Signed only when 2–7
return all-pass, per the prompt's *"Don't sign if any S1–S7 returns a fail."*

### Synthesis — `docs/closure/wave-b2-synthesis.md`
The keystone closure record for Wave B.2: 5-pass merge table with squash SHAs,
per-pass shipped/deferred, the direct-authoring + CI-gate governance model, the
**soak-waiver framing** (V3-02 residual 48h soak *waived by owner — green
through +6h*, NOT "completed 48h soak"), consolidated deferrals, and owner open
items.

---

## Diff scope (V3-12 surface vs `origin/main`)

```
docs/v3/foundation-lock-acceptance.md     (new — S1 per-pass verification + S2–S8 PENDING)
docs/v3/FOUNDATION-LOCK-CERTIFICATE.md     (new — NOT CERTIFIED, owner sign-off block)
docs/closure/wave-b2-synthesis.md          (new — Wave B.2 keystone closure)
scripts/v3/foundation-smoke.mjs            (new — S2 live smoke orchestrator, node-only)
.codex-temp/v3-wave-b2/v3-12-foundation-acceptance.md   (this report; force-added)
```

Docs + one node-only script. No app/package code, no shared tokens, no new
user-facing strings, no hardcoded domains. CI is expected MERGEABLE+UNSTABLE
(docs/script change touches no build graph).

---

## Validations

| Gate | How | Result |
|---|---|---|
| `foundation-smoke.mjs` parse | `node --check` | **GREEN** |
| `foundation-smoke.mjs` runtime | self-test vs unreachable host `--check` | **GREEN** — 7/7 SKIP, NO-EVIDENCE banner, exit 0 |
| S1 merge-ancestry | `git merge-base --is-ancestor <sha> origin/main` ×12 | **GREEN** — all 12 ancestors |
| repo-root lint/typecheck/build | GitHub Actions `CI / Lint, typecheck, test, build` | **authoritative gate — run on the PR** |

---

## Deferred / owner-gated — NOT done here (NO FAKE CLAIMS)

These require production access, physical devices, and the owner. None are
claimed:

- **S2 (live):** run `foundation-smoke.mjs --base https://<prod>` and attach the table.
- **S3:** auth+role matrix, cross-division SSO, cross-tab consistency, mobile-web parity.
- **S4:** Lighthouse top-30/app → `performance-baseline-foundation-lock.md`.
- **S5:** headers gate + `pnpm a11y` against deployed apps.
- **S6:** confirm telemetry events emit in prod (first-day counts) → `telemetry-baseline-foundation-lock.md`.
- **S7:** owner walks 10 surfaces on phone + desktop; verbatim answers.
- **S8:** the **signature** — withheld until S2–S7 are all-pass.

Carried-forward pass deferrals (named in their own PRs, not hidden):
**G2** V3-04 S5 share-attribution + client not-found beacon; **G3** V3-11 S4–S8
qualitative audits + broad `<CardTelemetry>` rollout. Plus **G1** owner hygiene:
close contaminated PR #161.

---

## Final status

**SCAFFOLD DELIVERED — NOT CERTIFIED.** The conductor-provable half of Foundation
Lock is done and honest: 12/12 passes' code verified on `main`, a self-tested
live-smoke probe that cannot fake a green, an unsigned certificate, and the Wave
B.2 synthesis. The signature and live proof are owner-gated (D11). Phase B is
**code-complete but NOT locked** until the owner runs S2–S7 and signs Gate 8.
