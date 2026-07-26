# Re-Grounding — Phase F on the CURRENT system (2026-07-24)

**Pass:** V3-F-DESIGN-01 (refresh) · Design only. **Authoritative over the rest of this folder where they disagree.** The original Phase F design (PR #517, commit `fb9a0dc7`) was authored against `origin/main @ 8c9794b5`, when the studio-agency orchestration stack (SA-2/SA-3/SA-4) was **design-only / open on stacked branches**. That premise is now **false**. This document re-grounds the whole folder on `origin/main @ 241f068a` and records the live-DB truth, so no builder inherits a stale claim.

> **One-line delta:** the SA machine the engine-unification thesis reasoned about *prospectively* is now **merged and (mostly) applied on prod**. The thesis is unchanged and stronger; the migration is no longer prospective — it is a **retrofit of shipped code**, and the "two competing engines" risk is **present, not future**.

---

## 0. What changed since #517 was written

| # | #517 said (base `8c9794b5`) | Truth on `origin/main @ 241f068a` (2026-07-24) | Evidence |
|---|---|---|---|
| **R1** | "SA-3 orchestration is **DESIGN-ONLY on main**; only SA-1 is merged." (REGROUNDING-LEDGER **H2**) | **FALSE — SA-2/SA-3/SA-4 are MERGED.** SA-2 `#512` (`334afd80`), SA-3 reland `#523` (`b08b1e9b`), SA-4 `#524` (`241f068a`). | `git log origin/main` |
| **R2** | "There is no `/api/agency/tick`, no decisions inbox, no `owner.studio.*` actions, no `approved_artifact_hash`." | **All shipped.** `apps/studio/app/api/agency/tick/route.ts` (`runAgencyTick` + `acquireTickLock`), `studio_agency_decisions` inbox, `owner.studio.*` tranche-3 founder actions (SA-4), `studio_build_jobs.approved_artifact_hash` (write-once). | files on main |
| **R3** | "The fork risk is **prospective** — SA-3 isn't built, so we set the seam at design time." (ENGINE-UNIFICATION) | **PRESENT.** Two bespoke drain loops already ship: `/api/agency/tick` (studio) **and** `/api/cron/operator-tick` (hub, SA-4 — every-30-min, `runOperatorTick`). Plus **two** single-flight lock tables and **two** internal-spend counters (§2). | files on main |
| **R4** | PROD-ACTUAL gates: "verify `ai_free_spend_ledger` / metered-billing / ledger are live before relying." | **Confirmed live (probe 2026-07-24).** `ai_free_spend_ledger`, `search_index_outbox`, `studio_build_jobs`, `studio_agency_decisions`, `studio_agency_tick_lock`, `approved_artifact_hash` **all present on prod** `rzkbgwuznmdxnnhmjazy`. | live `to_regclass` probe |
| **R5** | (n/a — SA-4 didn't exist) | **SA-4's operator spine migration is MERGED-BUT-UNAPPLIED on prod:** `ai_operator_spend_ledger` and `ai_operator_tick_lock` return `to_regclass = NULL`. The operator is dark on prod until applied. | live probe |
| **R6** | (n/a) | **V3-34 personalization migration is MERGED-BUT-UNAPPLIED on prod** (`#514`): `user_home_layouts`, `personalization_consent_events`, `customer_preferences.personalization_enabled` all absent — the V3-73/V3-34 "repo≠prod" lesson, still live. Relevant to V3-45's consent reads + any "account-authoritative consent" dep. | live probe (V3-E2 pass) |

Live probe (verbatim result, prod `rzkbgwuznmdxnnhmjazy`, 2026-07-24):
```
studio_build_jobs=t  studio_agency_decisions=t  studio_agency_tick_lock=t
approved_artifact_hash_col=t  ai_free_spend_ledger=t  search_index_outbox=t
ai_operator_spend_ledger=f  ai_operator_tick_lock=f
```

---

## 1. The central question — unchanged answer, re-grounded justification

**The answer stands: GENERALIZE at the RAIL layer.** SA-3's build-job lifecycle remains a **domain saga** that runs ON the shared `@henryco/workflow` rail; it is not a second engine and not a flattened queue. See [ENGINE-UNIFICATION.md](./ENGINE-UNIFICATION.md) for the full altitude/lifetime/state/money argument — none of which the SA-merge changes.

**What the SA-merge changes is the migration path and its urgency:**

- #517 framed two cases — "V3-43 lands first" (natural) vs "SA-3 lands first" (a *risk*). **Case B is now the reality.** SA-2/SA-3/SA-4 shipped **before** Phase F. So V3-43 is authored into an estate that **already has** the bespoke drain loops the rail must absorb.
- Therefore V3-43's scope gains an explicit, non-optional deliverable: **retire the two shipped ticks onto the rail and reconcile the duplicated primitives** — not "add a reconciliation note so SA-3 lands on the rail" (that note is moot; SA-3 already built `/api/agency/tick`).
- This is *cheap now and expensive later*: SA-4's operator spine migration is **not yet applied to prod** (R5). Reconciling `ai_operator_tick_lock`/`ai_operator_spend_ledger` into the shared rail primitives **before** that migration is activated avoids a prod-live retrofit.

---

## 2. The shipped duplications the rail must reconcile (the concrete work)

The prior "shared primitives to extract once" (ENGINE-UNIFICATION §"Shared primitives") is no longer prospective — SA-2/3/4 **shipped** hand-rolled instances. V3-43 promotes ONE of each; the SA sagas migrate onto it.

| Primitive | Shipped instance #1 (SA-2/3, studio) | Shipped instance #2 (SA-4, hub operator) | Rail reconciliation (V3-43) |
|---|---|---|---|
| **Single-flight tick lock** | `studio_agency_tick_lock` (CAS on `locked_until`, `acquireTickLock`/`releaseTickLock`, TTL 90s > route `maxDuration` 60s) — `apps/studio/lib/agency/store.ts` | `ai_operator_tick_lock` (identical CAS-row idiom, TTL 90s) — `apps/hub/lib/founder-intelligence/operator-tick.ts` | ONE `workflow_locks` primitive (CAS-row, TTL, holder). Two lock tables → one; each saga names its own lock KEY, not its own table. |
| **Drain loop / tick cron** | `/api/agency/tick` (`runAgencyTick`, `CRON_SECRET` + `timingSafeEqual`, per-job CAS claim, `*/2`) | `/api/cron/operator-tick` (`runOperatorTick`, `timingSafeEqual`, `*/30`) | Both become **registered handlers** on the single `workflow-drain` cron. Zero bespoke tick routes remain. |
| **Internal AI-spend ledger** | studio daily-ceiling read `dailyAgencySpendKobo(now)` (sums `studio_build_jobs.budget/cost` over the UTC day) — a *derived* counter | `ai_operator_spend_ledger` (window_day PK + `ai_operator_spend_today/add` RPCs, reserve-before-run, degrade-CLOSED) — a *durable* counter, cloned from `ai_free_spend_ledger` | ONE internal-spend pattern: the shipped `ai_free_spend_ledger` (`20260705200844`, **live on prod**). The operator's clone (`ai_operator_spend_ledger`) is a **third** counter — reconcile it into the shared pattern rather than let Phase F add a fourth (see [AI-IN-AUTOMATION.md](./AI-IN-AUTOMATION.md) §3). |
| **Append-only event log** | `studio_build_events` (job/kind/payload/ts) | `founder_action_proposals` audit + `henry.studio.operator.*` events | ONE `workflow_runs` shape + `writeAuditLog(correlationId=jobId)` convention (unchanged from #517). |
| **HMAC callback verifier** | `executor-callback` (studio) reuses the shipped `owner-inbound-email` handshake + monotonic-seq | (SA-4 adds no external callback) | ONE shared verifier primitive (unchanged from #517). |
| **Legal-transition choke point** | `enforce_studio_build_job_transition` DB trigger + `checkTransition` (studio) | (SA-4 rides the studio trigger) | Stays a DOMAIN concern — the rail owns generic job state, NOT studio stages (unchanged: the domain-state boundary). |

**The single most important re-grounded action:** V3-43 must land the shared **single-flight lock** primitive and migrate `studio_agency_tick_lock` + `ai_operator_tick_lock` onto it — because SA-3's own hardest-won lesson (the concurrent-tick daily-ceiling bypass, fixed by the single-flight lock in `#523`) is now duplicated in TWO places, and Phase F would make it THREE. One lock primitive, one correctness proof.

---

## 3. Re-grounded invariants that gain concrete shipped precedent

- **Platform-invoked AI never debits a wallet + single-flight + reserve-before-run + degrade-CLOSED** — these were *design intents* in #517's AI-IN-AUTOMATION; SA-4 **shipped them concretely** (`operator-tick.ts`: `noBillingPort` billable:false surface, `ai_operator_tick_lock` single-flight, reserve `committedKobo += estimate` BEFORE `runAiTask`, `evaluateOperatorBudget` degrade-CLOSED on ledger error, `maxDuration 60 < TTL 90`). Phase F's runaway-loop guard should **cite and reuse SA-4's shipped implementation**, not re-derive it. See [AI-IN-AUTOMATION.md](./AI-IN-AUTOMATION.md) §3.
- **The two-engines prohibition now has a live counter-example to prevent:** SA-4's `/api/cron/operator-tick` is the estate's **second** agency drain loop. If Phase F adds a third (`/api/cron/workflow-drain`) without absorbing these, the brief's "do not ship two competing engines" is already violated at three. The rail must be the *only* drain loop; the ticks become handlers.

---

## 4. PROD-ACTUAL ledger (live, 2026-07-24) — supersedes #517 §2.5–2.6 "verify before relying"

| Object | Prod state | Note |
|---|---|---|
| `search_index_outbox` (rail prior-art) | ✅ applied | V3-43 generalizes it, behaviour-locked |
| `ai_free_spend_ledger` (internal-spend pattern) | ✅ applied | the shared internal-spend counter |
| `studio_build_jobs` / `studio_agency_decisions` / `studio_agency_tick_lock` / `approved_artifact_hash` | ✅ applied (2026-07-19) | the SA saga is real on prod |
| money spine (ledger + `payments_private` + the 5 money RPCs + VAT) | ✅ live (FL2, verified 2026-06-27; corroborated) | do-not-touch |
| `ai_operator_spend_ledger` / `ai_operator_tick_lock` (SA-4 spine) | ⚠️ **NOT applied** (code merged `#524`) | reconcile into the rail lock/ledger BEFORE activation |
| `user_home_layouts` / `personalization_consent_events` / `customer_preferences.personalization_enabled` (V3-34) | ⚠️ **NOT applied** (code merged `#514`) | any V3-45 "account-authoritative consent" read degrades to false until applied |

**Rule for every Phase F build pass:** re-probe `to_regclass` on prod for the exact objects it reads/writes before relying on them (the V3-73 + V3-34 lesson). Merged-to-main ≠ applied-to-prod.

---

## 5. Which docs this refresh corrects (read them WITH this file)

- **REGROUNDING-LEDGER.md** — **H2 is inverted** (SA merged, not design-only); §2.5–2.6 PROD-ACTUAL gates are **upgraded to confirmed-applied** per §4 above; add R5/R6 (SA-4 + V3-34 unapplied).
- **ENGINE-UNIFICATION.md** — the "prospective / future fork / Case B is a risk" framing is **now present-tense reality**; the "add a reconciliation note to SA-3's plan" action is **moot** (SA-3 shipped `/api/agency/tick`) and is replaced by the §2 reconciliation table.
- **OWNER-DECISIONS.md — F-D1** — the recommendation (generalize at the rail) is unchanged; its *action* changes from "add a note so SA-3 lands on the rail" to "**V3-43 retires the shipped `/api/agency/tick` + `/api/cron/operator-tick` onto the rail and reconciles the two lock tables**."
- **PASS-PLAN.md — V3-43** — scope gains: migrate the **two shipped agency ticks** (not only the ≈18 crons) + land the shared single-flight lock + reconcile `ai_operator_tick_lock`/`ai_operator_spend_ledger`. Its PROD-ACTUAL line is satisfied by §4.
- **AI-IN-AUTOMATION.md — §3** — cite SA-4's shipped single-flight + reserve-before-run + degrade-CLOSED as the concrete precedent; the automation ledger reconciles with `ai_operator_spend_ledger` rather than adding a new counter.
- **README.md / ARCHITECTURE.md / CAMPAIGNS-AND-SUPPRESSION.md** — base ref → `241f068a`; campaigns/suppression claims (Postmark-only, `scopeMatchesCampaign`, STAFF-6 resolved on main) are **unchanged and still true** (no SA-merge impact).

Everything else in #517 (the campaign suppression CI rules, the notifications-spine grounding, the money-spine do-not-touch, the Register-L/D audience axis, the V3-44…48 re-grounded plan) **holds unchanged** — it was grounded on primary sources that did not move.
