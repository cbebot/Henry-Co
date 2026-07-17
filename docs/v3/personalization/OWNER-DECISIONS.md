# Phase E Owner Decisions — E-D1 → E-D5

**Pass:** V3-E-DESIGN-01 · **Type:** Design / architecture only (no feature code, no migration) · **Status:** Awaiting owner ratification · **Base:** `origin/main @ 47de2de2` (2026-07-16)

> Five decisions, framed for a clean choice. Each has a recommended default; ratifying the defaults unblocks the whole build plan. D3 (provider = Anthropic) and D4 (margin/rate card, reconciled 2026-07-03) are **already decided** — nothing here re-litigates them.

---

## E-D1 — Predictive-AI cost model: who pays when the platform asks the question?

**The situation.** Phase D's billing model covers two classes: **METERED** (a person invokes a business/personal task and confirms a price — wallet reserve→settle→VAT) and **FREE** (company-critical surfaces under the daily free-spend budget, ₦5,000/day default — `packages/ai-gateway/src/free-budget.ts:17-18`). Predictive scoring (V3-40/41) is a third class: **platform-invoked** — the customer never asked, so there is nothing to bill them for. The fraud batch could score thousands of entities daily; unpriced, that is unbounded provider spend; customer-billed, it is unconscionable. **This decision governs ALL platform-invoked AI spend in Phase E** — including the V3-36 recommendation re-rank surface (ARCHITECTURE §4.1/§5.2), not only V3-40/41.

**Options.**

| | Option | Cost profile | Trade-off |
|---|---|---|---|
| **A (recommended)** | **Deterministic core, LLM-assisted only behind a flag with a dedicated internal daily budget.** V3-40/41 ship on rules + statistics (the eight `RiskSignalType`s, watchtower signals, seasonal/EWMA forecasts) with **zero** provider spend. LLM features (score-sharpening, staff narratives) register as internal non-billable gateway surfaces inside a new internal spend ledger (the `ai_free_spend_ledger` pattern, separate counter + ceiling, e.g. start ₦2,000/day) — company absorbs as COGS via the existing `ai_provider_cost` account | ₦0 at launch; bounded opt-in spend after | Slightly less sharp scores day one; nothing else lost — a freeze can never rest on an LLM anyway |
| B | LLM-assisted from day one (same internal-budget machinery, flag on at launch) | Bounded but immediate daily spend | Pays provider cost before shadow mode proves the deterministic floor's precision is even insufficient |
| C | Bill the scored party | — | **Rejected.** Violates the pre-paid, price-confirmed billing doctrine; a person cannot be charged for surveillance of themselves |

**Unchanged either way:** customer-facing trust reviews (`*.listing.verify`, `jobs.posting.verify`, `learn.course.verify`, the `intelligence.deep.*` capabilities) remain METERED — a person confirms a price and buys the review. Those already exist in the registry and are not Phase E's to change.

**Recommended: A.** Ratify the internal daily budget number at build time (owner-tunable env, like `FREE_AI_DAILY_BUDGET_KOBO`).

## E-D2 — Personalization consent model: what needs consent, what runs by default?

**The situation.** A `personalizedExperience` consent category already ships in the 5-category consent UI — currently a dead signal (no consumer), device-scoped only (PRIVACY-NDPR §2). NDPA 2023 bases are already encoded in `packages/config/legal.ts`. The choice is where to draw the consent line.

**Options.**

| | Option | What it means | Trade-off |
|---|---|---|---|
| **A (recommended)** | **Legitimate interest for first-party in-product personalization; explicit consent for cross-division profiling + outreach.** Home layout, `/continue` resume, in-app next-step on the page you're on: on by default (user-controlled, not profiling). Cross-division recommendation profiling, deal targeting, geo-flavored personalization, recovery *emails*: gated on `personalizedExperience` (account-scoped, recorded with text version) | Matches the platform's existing doctrine (server-side ops signals legitimate-interest; marketing/optional = consent) and the NDPA basis registry; default experience stays alive | Requires the consent wiring work in V3-34 (planned) |
| B | Consent for everything personal | Maximal caution | Kills the default experience (a new user sees a generic home until they find a toggle); overreads NDPA for first-party product features |
| C | Legitimate interest for everything | Zero friction | Indefensible for cross-service profiling under NDPA §25; contradicts the shipped consent UI's own promise |

**Sub-decisions bundled in:** (1) account value wins over device cookie; first sign-in seeds account from device once. (2) Consent events recorded append-only with `consent_text_version` (the `rooms_recordings_consent` pattern), forward-compatible with V3-93's `consent_log`. (3) Off = graceful division-local defaults, never a broken surface.

**Recommended: A.**

## E-D3 — Fraud approach: rules-hybrid, learned model, or vendor?

**The situation.** The register's V3-40 row says "Move beyond 8 rules-based signals; train on labeled signals" (`docs/v3/PASS-REGISTER.md:160`; the prompt file itself phrases it as a "learned-and-rules-hybrid risk score"). Ground truth: labeled fraud data is scarce (money went live weeks ago; several entity domains are pre-data), a deterministic threat engine just shipped (watchtower, PR #501), and the V3-90 event lake that would feed a learned model is unbuilt.

**Options.**

| | Option | What ships | Trade-off |
|---|---|---|---|
| **A (recommended)** | **Versioned deterministic hybrid now.** `scoreEntity` fuses the eight rules signals + watchtower detections + behavioral aggregates under config-driven weights in `model_versions` (versioned, shadow-moded, owner-promoted — the full governance machine), LLM-advisory per E-D1. "Learning" = owner-ratified weight/threshold updates as new model versions, informed by shadow precision/recall reports | The whole enforcement + governance architecture, honest about data reality | Not ML; catches rule-expressible fraud only — which is what the data supports today |
| B | Train a learned model now | ML pipeline | No training data volume; no feature lake (V3-90 pending); an unvalidatable model in a money-adjacent control is worse than rules |
| C | Vendor fraud API | Fast capability | New sub-processor (NDPA DPA per `LEGAL-AND-BUSINESS.md:267`), per-call cost, data leaves the platform — against the in-house doctrine; and the D6 KYC-vendor integration is still deferred-gated (answered 2026-05-28 in `DECISIONS-REQUIRED.md:132` — Smile Identity/Onfido — but listed PENDING in `PROGRAM-STATUS-2026-06-21.md:308` and no vendor adapter is built), so vendor plumbing has no precedent |

**Recommended: A**, with a standing note in the pass report: revisit B after V3-90 lands and shadow mode has accumulated ≥1 real labeled fraud cohort (the MASTER-PLAN Phase E exit criterion — "fraud scoring catches at least one real fraud event in shadow-mode before going live" — is the natural checkpoint).

## E-D4 — Apply `v3_37_abandoned_tasks` to prod?

**The situation.** V3-37's code shipped and runs, but its dedicated table is committed-NOT-applied — every consumer is best-effort, so recovery silently no-ops on prod (`docs/v3/PROGRAM-STATUS-2026-06-21.md:111`). The migration is low-risk by construction: owner-only RLS, service-role-only writes, secret-free state by test, RLS proof script in-repo (`scripts/v3/prove-abandoned-tasks-rls.sql`), plus the paired notification-category CHECK-widen migration (`20260610121000`) that **must** apply with it (lock-step rule — drift here caused a prod outage once).

**Options:** **A (recommended)** — apply both now (dry-run-first, per the FL2 convention), turning the already-shipped feature on and unblocking every Wave E.2 recovery arc. **B** — hold until Wave E.2 starts (status quo; feature stays inert; no risk, no value).

**Recommended: A.** This is the cheapest real user value in the whole phase.

## E-D5 — Recovery outreach channels: build send now or keep the V3-45/48 seam?

**The situation.** The recovery sweep sends real **in-app** nudges; email/push are dispatch intents only ("real multi-channel send → V3-45/48"). The only live recovery emails today are marketplace `abandoned_cart` and care payment reminders, each on its own per-division queue. The email rail just moved to Postmark (#500). Phase F's V3-45/48 are designed to own multi-channel reminders/campaigns, consuming `user_engagement_events`' never-used consumer columns.

**Options:** **A (recommended)** — keep the seam: Phase E ships in-app + intents; V3-45/48 build the send rail on Postmark + canonical suppression (P0.2 fixed first). Marketplace/care automations keep running untouched. **B** — pull recovery email forward into Phase E: a minimal Postmark sender inside the sweep, day-3/day-7 templates (`recovery-copy.ts` already has them). Faster recovery revenue, but builds a second send path Phase F must then unify, and touches suppression surface area early.

**Recommended: A** — unless the owner wants recovery emails live this quarter, in which case B is safe **only after P0.2** and with `evaluateSuppression` added at the send seam plus real quiet-hours wiring (the cadence planner already enforces per-channel opt-out and has a quiet-hours gate, but it does not call `evaluateSuppression`, and the shipped sweep currently bypasses quiet hours — see PRIVACY-NDPR §4).

---

## Ratification record

| Decision | Owner's answer | Date |
|---|---|---|
| E-D1 predictive-AI cost model | _____ | _____ |
| E-D2 personalization consent model | _____ | _____ |
| E-D3 fraud approach | _____ | _____ |
| E-D4 apply `abandoned_tasks` | _____ | _____ |
| E-D5 recovery channels | _____ | _____ |
