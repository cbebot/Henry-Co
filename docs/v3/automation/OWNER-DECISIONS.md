# Owner Decisions — Phase F (defaults included)

> **⚠️ RE-GROUNDED 2026-07-24 — read [RE-GROUNDING-2026-07-24.md](./RE-GROUNDING-2026-07-24.md) first.** SA-2/SA-3/SA-4 are now MERGED on `origin/main @ 241f068a` (not design-only; the base was `8c9794b5`). Where this doc says the SA machine is design-only / the fork risk is prospective, the re-grounding file is authoritative.

**Pass:** V3-F-DESIGN-01 · Design only. Deliverable 5. What only the owner can ratify before/within Phase F, each with a recommended ✦ default. The design fixes the **mechanisms** (one rail, consent chokepoint, internal-spend cap, watermark); every **number and policy** below is a seed value, tunable without a redeploy where a rule book exists. Defaults are kept **consistent with the already-ratified studio-agency decisions** (SA-D1…D5, ratified 2026-07-18).

> **Status: PENDING owner ratification.** Recommended defaults let the build proceed if the owner says "defaults are fine."

---

## F-D1 — The engine-unification call (blocks V3-43 shape)

Does the platform workflow engine generalize SA-3, or stay separate? (Full analysis: [ENGINE-UNIFICATION.md](./ENGINE-UNIFICATION.md).)

- **✦ Default — Generalize at the rail; the studio build lifecycle is a domain saga on the shared rail.** One durable-job rail (`@henryco/workflow`), promoted from the existing `search_index_outbox`/`drainOutbox` idiom; the saga keeps its own state table but runs its tick + side-effects **as registered handlers/jobs on the rail** — one drain loop, one retry/dead-letter/idempotency contract, not two engines.
- **Re-grounded 2026-07-24 — the action changed:** SA-2/SA-3/SA-4 are now MERGED, so `/api/agency/tick` **and** the SA-4 `/api/cron/operator-tick` **already ship**. The recommendation is unchanged, but its action is no longer "add a note so SA-3 lands on the rail" — it is **V3-43 retires BOTH shipped ticks onto the rail and reconciles the two single-flight lock tables (`studio_agency_tick_lock` + `ai_operator_tick_lock`) into one rail primitive.** Cheapest to do **before** SA-4's operator migration is applied to prod (live-probed: it is not yet). See [RE-GROUNDING §2](./RE-GROUNDING-2026-07-24.md).
- **Variant:** keep them fully separate with a documented boundary. **Not recommended** — the estate would then run **three** competing drain loops (studio tick + operator tick + workflow-drain), the exact thing the brief forbids.
- **What only you decide:** whether to accept the retrofit cost now (fold the two shipped ticks + locks onto the rail) rather than let a third loop land. Recommendation: **yes.**

## F-D2 — Escalation targets & SLAs (blocks V3-44/47)

Who gets escalated to, after how long, per queue. Built in the spirit of SA-3's ratified **"never auto-advance a human decision"** invariant (SA-D2: client-silence escalates to the owner, never auto-advances). The three-rung staff ladder below is a **new Phase F construct** for staff queues — it follows V3-47's own spec (queue-manager → lead → owner); SA-3 itself defines only never-auto-advance + escalate-to-owner, not a senior/lead staff chain.

- **✦ Default — a three-rung, audited, human-gated chain**, one rung per breach episode (no re-page every tick):
  1. **queue manager** (division's queue owner) — on breach / initial alert
  2. **staff lead** (`workspace.manage` holder) — **+2h** unresolved
  3. **owner** — **+4h** unresolved
- **✦ Default SLAs** (division-overridable via `queue_sla_config`; code defaults as fallback):

  | Queue | Response/resolution SLA | Warn window |
  |---|---|---|
  | support | 4h first-response | 1h |
  | kyc_review | 24h | 4h |
  | moderation | 2h (high-pri) / 24h (standard) | 30m / 4h |
  | finance_refunds | 48h | 8h |

  Finance auto-escalates above `workflow_queue_config.high_value_minor` (BIGINT). **High-value threshold default: ₦100,000 (10,000,000 kobo).**
- **✦ Default delegation:** owner taps the owner-rung at first; queue-manager/lead rungs route to named staff via roles from day one. (Mirrors SA-D1's "owner keeps deploy/money/social; delegate the rest by role.")
- **Variant:** add owner **push** to the owner rung (SA-3/SA-4 designs the hub push-registration surface) — recommended once the account-side push path is extended to hub.
- **What only you decide:** the SLA numbers and the owner-rung dwell time (4h). Redistribution stays **proposal-only** (a human accepts) — not offered as auto-apply.

## F-D3 — Campaign policy (blocks V3-48)

Which follow-up campaigns run, and how conservatively.

- **✦ Default — the four shipped campaigns, one enable-flag each, enabled one at a time lowest-volume first:** `post_purchase`, `post_booking`, `post_service`, `post_course` — all `lifecycle_journey` (marketing) class, copy **by key only** (no AI-authored free text — consistent with SA-D1's "templated autonomous, AI free-text human-gated").
- **✦ Default cadence caps:** ≤3 steps per campaign; deterministic A/B arms until V3-91; a per-campaign opt-out ("stop these follow-ups") honored on the next step; **30-day observation** proving zero opt-out/suppression escape before all four are on.
- **✦ Default double-contact rule:** a campaign **suppresses** when a V3-45 reminder schedule for the same item is active; a completed action **cancels** the matching reminder.
- **Variant:** review-every-campaign-cohort before enabling the next (safest, slowest) — recommended if the first cohort shows any escape.
- **What only you decide:** whether any campaign includes a **cross-sell/discount** step (money-adjacent framing) — default `post_purchase` step 3 is a relevant cross-sell (no discount). Discounts/deals are V3-62, not here.

## F-D4 — Automation AI-spend budget (blocks V3-44/46 AI steps; V3-43 guard)

How much AI can platform automation spend, and with what protection. (Mechanism: [AI-IN-AUTOMATION.md](./AI-IN-AUTOMATION.md).)

- **✦ Default — internal, non-billable, three-tier capped:**
  - platform automation AI runs on **`billable:false` surfaces** — **never** a customer wallet;
  - a **daily internal-spend ceiling** via `ai_free_spend_ledger` — **₦5,000/day** default (same order of magnitude the owner ratified for the studio operator in SA-D2), shared/extended across automation with `allow → conserve → exhausted` degradation;
  - a **per-job AI budget** (`max_ai_calls_per_job` / `max_ai_kobo_per_job`) so a looping handler dead-letters rather than compounding cost.
- **✦ Default posture:** V3-44 escalation triage stays on the **free deterministic stub** (no model call) unless the owner wants model triage; V3-46 report narrative (`composeMorningBriefNarrative`) is internal non-billable.
- **Variant:** a separate `workflow.*`/`hub.founder.operator` surface with its **own** daily allowance (isolates automation spend from interactive founder-AI spend) — recommended once automation AI volume is measurable.
- **What only you decide:** the daily ceiling (₦5,000/day) and whether automation AI shares the founder-AI budget or gets its own.

## F-D5 — Sender identity (D7) (blocks V3-46/48/61 operationally)

**D7 is currently PENDING** — the owner has not chosen. The prompt's Option C example (`news@henrycogroup.com`) references a **legacy domain**; the estate has since moved to **Henry Onyx** and to **Postmark-only** sending.

- **✦ Default — Option C, realized on the current Postmark stack:** per-purpose transactional sender identities (preserve brand: accounts/support/care/studio/… via `resolveSenderIdentity`) + a **unified marketing identity** on the Postmark `marketing-broadcast` stream — using **henryonyx.com / Henry Onyx** addresses via `@henryco/config`, **not** the legacy `henrycogroup.com`. This is already how the code separates rails ([REGROUNDING-LEDGER H3](./REGROUNDING-LEDGER.md#1-the-headline-corrections-read-these-first)); the decision is really "confirm the unified marketing sender address + name."
- **Variant:** two senders only (`team@`/`news@`) — simpler reputation management, less per-division brand.
- **What only you decide:** the exact marketing sender address (e.g. `news@henryonyx.com`) and display name, and confirm the per-purpose transactional identities. **Operational, does not gate a phase** — but blocks V3-48/46/61 delivery config.

## F-D6 — Cron migration soak posture (informs V3-43 rollout)

Migrating ≈18 live crons onto one rail is behaviour-locked but not risk-free.

- **✦ Default — dual-run + 14-day soak:** each migrated cron keeps its schedule and prior summary shape; the rail runs alongside a pre-migration baseline for 14 days confirming zero dropped jobs and a flat dead-letter count before the rail is declared authoritative. The `search-index-worker`/`drainOutbox` migration is proof-of-generalization and goes **after** the low-risk notification crons.
- **Variant:** big-bang cutover (faster, riskier) — not recommended for live crons.
- **What only you decide:** the soak length (14 days) and whether to gate the rail behind a flag during soak.

---

## Ratification checklist

| # | Decision | ✦ Recommended default | Blocks |
|---|---|---|---|
| F-D1 | Engine unification | Generalize at rail; SA-3 saga on the rail | V3-43 shape |
| F-D2 | Escalation targets & SLAs | 3-rung manager→+2h lead→+4h owner; SLAs per table; ₦100k high-value | V3-44/47 |
| F-D3 | Campaign policy | 4 campaigns, one flag each, lowest-volume-first, 30-day escape-zero | V3-48 |
| F-D4 | Automation AI-spend budget | internal non-billable; ₦5k/day ledger; per-job cap | V3-44/46/43 |
| F-D5 | Sender identity (D7) | Option C on Postmark/Henry Onyx (not henrycogroup) | V3-46/48/61 (op) |
| F-D6 | Cron migration soak | dual-run + 14-day soak | V3-43 rollout |

**If the owner replies "defaults are fine," Wave F.1 (V3-43) is unblocked immediately; Wave F.2 unblocks on F-D2/F-D3/F-D4; V3-48 delivery config waits on F-D5.**
