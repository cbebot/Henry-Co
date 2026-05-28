# V3 Owner Brief

**Pass:** V3 Strategic Architect (Phase G output — the phone-readable summary)
**Compiled:** 2026-05-17
**Read time:** 5 minutes

This is the briefing. Read it on a phone. Decide what to start.

---

## V3 in one paragraph

V3 is the 12-pillar build that turns HenryCo from a multi-division V2 baseline into a premium ecosystem at scale. It runs as nine phases (A–I) containing 96 passes. Phase A is the audit you are now reading the output of. Phase B is the FOUNDATION LOCK — twelve passes that close every "boring essential" you named (sessions, auth, notifications, deep links, live data, dead links, hardcoded text, fake loading, empty dashboards, mobile, logs, one-job-per-card) and which gate every later phase. Phases C through F are the strategic core: money + identity + AI + personalisation + automation. Phases G through I ship the product expansion (Care broadens to a services platform, marketplace ranks at scale, property rules engine + jobs interview room, business profiles + seller academy, gaming arena if you sign legally off), build the partner + enterprise suites, and ship the public API + mobile apps + observability + closure. The critical path is twenty-seven sequential passes; realistic wall-clock is nine to eighteen months depending on your availability + legal sign-offs + how much you parallelize.

---

## The nine phases in one line each

- **A — Audit:** ground truth. This pass. Done.
- **B — Foundation Lock:** boring essentials. The base. No new pillar starts until this closes.
- **C — Money & Identity:** payments router + Stripe/Paystack/Flutterwave + ledger + KYC vendor + content moderation.
- **D — AI Intelligence Layer:** governed AI. Provider router + usage billing + HenryCo-Intelligence chat surface + per-task gating. Never name the provider in UI.
- **E — Personalisation + Predictive:** per-user home + recs + fraud prediction + quality + workload prediction.
- **F — Automation + Workflow:** generalized engine. Auto-assign + escalate. Owner reports auto-generated.
- **G — Product Expansion:** Care broadens. Marketplace ranks. Property rules. Jobs interview room. Studio motion/video. Business profiles. Seller academy. Concierge. Gaming (gated).
- **H — Partner + Enterprise:** onboarding + payouts + employer/seller/provider/studio/logistics business suites + bulk invoicing.
- **I — Platform + Mobile + Observability + Closure:** public API + mobile store submissions + traces/SLOs/data-lake/A-B + privacy/data-rights + integration test + launch.

Total: **96 passes**.

---

## Critical path

The longest dependency chain is ~27 passes:

`V3-01 → V3-02 → V3-04 → V3-11 → V3-12` (Foundation Lock close)
`→ V3-13 → V3-17 → V3-19 → V3-94 → V3-95 → V3-96` (Money spine → closure)

Critical path informs scheduling, not scope. Parallelize where you can.

---

## Top five decisions blocking start

(Full list in `DECISIONS-REQUIRED.md`.)

1. **D11 — Foundation Lock acceptance gate.** Commit that no Phase C+ pass starts until Phase B closes? **Recommended: YES.**
2. **D1 — Payment provider activation per country.** Start with Paystack + Flutterwave (Nigeria-native) before Stripe? **Recommended: YES, Paystack + Flutterwave first.**
3. **D3 — AI provider selection.** Anthropic primary + OpenAI fallback? **Recommended: YES.**
4. **D6 — KYC vendor.** Smile Identity for African markets + Onfido for international? **Recommended: YES.**
5. **D2 — Gaming arena legal posture.** Defer gaming entirely from V3? **Recommended: YES (option B); revisit in V4.**

If you answer these five today, Phase B can start tomorrow and Phase C can start the moment Phase B closes.

---

## Top three risks

1. **Owner availability.** V3 has many gating decisions. If you are intermittently available, batch your answers in single syncs rather than blocking each pass on a question. Recommend a weekly 30-minute decision review.
2. **Premature scale temptation.** You will be tempted to skip Phase B to "start a feature pillar." Foundation cracks cost more later than a careful Phase B costs now. Hold the gate.
3. **Legal sign-off delays.** Gaming (V3-65/66), per-market launches (V3-84), and tax computation (V3-21) all need real legal work. Start L1-L18 (legal/business items) in week 1 even while engineering does Phase B.

---

## Recommended first phase to execute and why

**Start Phase B (FOUNDATION LOCK) immediately, in Wave B.1 (six passes in parallel).**

Why:
- Owner-decision blockers are minimal at Phase B start (only D11 at close, not start).
- Most Phase B passes are parallelizable, so wall-clock is short (~6 weeks).
- Phase B work directly addresses every concern you stated verbatim: "session persistence, auth reliability, notifications and message states, deep links into exact workflows, live data for dashboards/invoices/subscriptions/receipts, consistent mobile behavior, no dead links, no hardcoded texts, no fake loading states, no duplicated UI labels, no refresh loops that lose context, no empty dashboards pretending to be active systems, no major flows without logs, states, and fallback handling."
- Closing Phase B unblocks 16 downstream passes (the highest unblock count of any pass in V3 per `DEPENDENCIES.md`).

Wave B.1 (parallel) = V3-01 (session), V3-03 (notification message states), V3-05 (kill loading theater), V3-07 (hardcoded text), V3-09 (mobile consistency), V3-10 (logs/states/fallback).

Open each prompt at `docs/v3/prompts/v3-NN-*.md` and copy it into a fresh Claude window — that's how a pass starts.

---

## What to do today (concrete)

1. Read `docs/v3/AUDIT-BASELINE.md` to confirm the current state matches your mental model (15 min).
2. Answer D1, D2, D3, D6, D11 inline in `docs/v3/DECISIONS-REQUIRED.md` (10 min).
3. Engage your lawyer on L4 (payment merchant onboarding), L5 (KYC vendor contract), L10 (trademark filings) — these have long lead times (one phone call).
4. Spawn Wave B.1 by copying any of `docs/v3/prompts/v3-01-*.md`, `v3-03-*`, `v3-05-*`, `v3-07-*`, `v3-09-*`, `v3-10-*` into separate Claude sessions.
5. Schedule a weekly 30-minute V3 sync with yourself: review what closed, answer the next decision batch, commit to the next wave.

---

## Where everything lives

- `docs/v3/AUDIT-BASELINE.md` — ground truth current state
- `docs/v3/PASS-REGISTER.md` — every pass with ID, slug, phase, deps, risk
- `docs/v3/MASTER-PLAN.md` — execution roadmap per phase
- `docs/v3/DECISIONS-REQUIRED.md` — your decision list with recommendations
- `docs/v3/DEPENDENCIES.md` — directed graph: what blocks what
- `docs/v3/LEGAL-AND-BUSINESS.md` — non-code prerequisites (legal entity, tax, KYC vendor, app store accounts, etc.)
- `docs/v3/ANTI-CLONE.md` — defense-in-depth patterns to apply across V3
- `docs/v3/OWNER-BRIEF.md` — this file
- `docs/v3/audit/` — deeper per-domain audits (foundation-base-lock + pillar-gap-map; expand in follow-up sessions)
- `docs/v3/prompts/v3-NN-*.md` — one prompt file per pass; each is self-contained and executable in a fresh Claude window

---

## The promise of this plan

Every pass listed has a prompt file you can copy + paste. Every prompt is self-contained — no conversation history needed. Every recommendation has a rationale. Every risk is named. Every decision is yours.

The plan is complete, sequenced, and honest.

When you finish reading this, you know what V3 is, how many passes it takes, what decisions are blocking, which phase to start first, and where every detailed prompt lives.

Start Phase B today.

---

End of brief.
