# AI in Automation — money Prime Directives & runaway-loop protection

> **⚠️ RE-GROUNDED 2026-07-24 — read [RE-GROUNDING-2026-07-24.md](./RE-GROUNDING-2026-07-24.md) first.** SA-2/SA-3/SA-4 are now MERGED on `origin/main @ 241f068a` (not design-only; the base was `8c9794b5`). Where this doc says the SA machine is design-only / the fork risk is prospective, the re-grounding file is authoritative.

**Pass:** V3-F-DESIGN-01 · Design only. Deliverable 3. Any Phase F workflow step that invokes the AI gateway inherits **all** the money Prime Directives. Platform-invoked automation **never** debits a customer wallet. A workflow must not be able to trigger unbounded AI spend. All symbols grounded on `origin/main @ 241f068a` (re-grounded 2026-07-24; orig base 8c9794b5); the metered path's prod-liveness is a **PROD-ACTUAL** gate ([REGROUNDING-LEDGER §2.5](./REGROUNDING-LEDGER.md#25-ai-gateway-v3-4446-ai-steps)).

---

## 0. Two AI modes in automation

| Mode | Who pays | Path | Used by |
|---|---|---|---|
| **Billable (customer-invoked)** | the customer's wallet | `runAiTaskWith` → `reserve_wallet_for_ai_usage` → dispatch → `post_ai_usage_charge` (balanced ledger + VAT) | a *customer* action a workflow merely carries (rare in Phase F) |
| **Internal / non-billable (platform-invoked)** | the company (COGS) | `runAiTaskWith` on a `billable:false` surface → **no wallet** → zero-kobo receipt → `ai_free_spend_ledger` daily cap | **every platform automation** that needs AI (V3-44 escalation triage, V3-46 report narrative) |

**Phase F automations are platform-invoked ⇒ internal / non-billable.** They ride the second mode. The first mode appears only if a workflow is literally executing a customer's own billable request (and then the customer authorized it directly, not the automation).

---

## 1. The money Prime Directives (any AI step inherits these)

Grounded in `packages/ai-gateway` + `payments_private` (migration `20260627120000`):

1. **No anon.** Every gateway call requires an authenticated actor or refuses `auth_required` before any wallet/provider work (`orchestrator.ts:142-144`). A workflow step supplies a real actor id (the customer for billable; a synthetic platform/system actor for internal).
2. **Wallet-zero ⇒ provider never called.** For billable calls, `reserve_wallet_for_ai_usage` computes `available = balance − Σ active holds` and refuses `insufficient_funds` *before* dispatch (`orchestrator.ts:200-203`). Pre-paid gating is structural.
3. **Hard-capped at reservation, wallet never negative — in TS and SQL.** If provider actuals exceed the hold, the customer is billed the **reserved** breakdown (company absorbs the overage as margin) — `orchestrator.ts:277-279`; the SQL `post_ai_usage_charge` returns `exceeds_reservation` with no mutation (`migration:267-271`).
4. **Atomic, idempotent, balanced double-entry + VAT.** Settlement posts `DR customer_wallet_liability / CR platform_revenue / CR vat_output_payable` in one transaction, idempotent on `ai_usage_events.hold_id` (`migration:213-332`). Amounts are **integer kobo**, never float.
5. **Provider + model opacity.** Provider/model/cost/margin **never** cross to a client — everything goes through `redactReceipt` + `assertClientSafe` (`redaction.ts`). Model ids live only in `server/config.ts`. A workflow's client-visible output (a notification, an email, a report section) carries **no** provider string.
6. **Guarded RPC only — never raw SQL, never the SDK directly.** Money mutations flow only through the `SECURITY DEFINER` `payments_private` RPCs (service_role, non-PostgREST). A workflow step must go through `runAiTaskWith` with a billing port (`createPgBillingPort`) — direct provider-SDK use bypasses every directive above and is forbidden.
7. **No new money RPC in Phase F.** The design introduces no `payments_private` function. The existing wallet-debit paths (metered-AI charge, withdrawal reserve, refund clawback) are each `SECURITY DEFINER`, `service_role`-only, and reversal/user-initiated — none a general-purpose automation debit ([REGROUNDING-LEDGER §2.6](./REGROUNDING-LEDGER.md#26-money-spine-do-not-touch-context)); Phase F adds none.

---

## 2. Platform automation NEVER debits a customer wallet

This is architecturally guaranteed, and the design must keep it so:

- There is **no general-purpose automation debit RPC** on main. The wallet-debit paths — metered-AI charge (`post_ai_usage_charge`, hard-capped at a *customer-authorized prepaid hold*), the withdrawal reserve (*user-initiated*), and the refund clawback (`initiate_payment_refund`, reverses a customer's *own* top-up) — are each `service_role`-only and reversal/user-initiated. **None is reachable by a platform automation acting on its own**, and none is a general-purpose debit RPC.
- Platform-invoked AI runs on **`billable:false` surfaces** (`hub.founder.assist` today; a sibling `hub.founder.operator`/`workflow.*` surface with its own allowance if separation is wanted). These skip the wallet phase entirely — `orchestrator.ts:253-260` issues a `totalKobo:0, billed:false` redacted receipt and never calls `reserve`/`settle`.
- The company's real cost of an internal turn is metered as **provider cost only** (`estimateFreeTurnCostKobo`, `server/quote.ts`) and accrued to the **internal spend budget** (§3), not to any customer.

> **The E precedent (from V3-34 / MONEY-MODEL §5):** internal AI is "the company working for itself" — non-billable by definition, governed like the shipped free-AI guardrail rather than the wallet. Phase F automations are the same shape.

**Design rule:** a Phase F workflow step MUST NOT (a) call `reserve_wallet_for_ai_usage`/`post_ai_usage_charge` on behalf of a customer the customer did not directly authorize, (b) introduce a new debit RPC, or (c) run AI on a `billable:true` surface with a platform/system actor. Any of these is a review-blocking finding.

---

## 3. Runaway-loop protection (a workflow cannot compound unbounded AI spend)

Because a workflow is a *loop that can enqueue more work*, the automation layer must cap AI spend at three tiers — all built on shipped mechanisms:

1. **Per-call ceiling.** `maxCostKoboPerCall` refuses a call whose estimated upper-bound cost exceeds the surface's cap, before dispatch (`orchestrator.ts:183-185`). A single step can never overspend.
2. **Daily internal-spend ceiling (the durable cap).** `ai_free_spend_ledger` (window_day PK, `spent_kobo`) + `ai_free_spend_today()` / `ai_free_spend_add()` (migration `20260705150000`, **live on prod** — probed 2026-07-24) accumulate the provider cost of internal turns; `evaluateFreeBudget` degrades `allow → conserve (at 0.8) → exhausted` (`free-budget.ts`), default **₦5,000/day** (`FREE_AI_DAILY_BUDGET_KOBO_DEFAULT`). **Phase F automations share/extend this ledger** so a stuck loop cannot silently compound cost overnight.
   - **Re-grounded 2026-07-24 — this now has a SHIPPED concrete precedent:** SA-4 (`#524`, merged) implemented exactly this shape for the operator — a `billable:false` surface via `noBillingPort`, its own daily ledger + single-flight lock (`ai_operator_spend_ledger` / `ai_operator_tick_lock`), **reserve-the-upper-bound estimate BEFORE `runAiTask`** (`operator-tick.ts`: `ctx.committedKobo += estimate` then `runAiTask`), and **degrade-CLOSED** on a ledger read error (`evaluateOperatorBudget` returns `exhausted` when the counter is unreadable). Phase F **reuses this shipped implementation**, and **reconciles `ai_operator_spend_ledger` into the shared internal-spend pattern rather than adding a THIRD counter** (`ai_free_spend_ledger` + studio's derived daily-spend + operator's ledger already make two-and-a-half — see [RE-GROUNDING §2](./RE-GROUNDING-2026-07-24.md)). *Owner-tunable — see [OWNER-DECISIONS F-D4](./OWNER-DECISIONS.md).*
3. **Per-workflow AI-spend guard (new, V3-43 foundation requirement).** The rail must bound how much AI a single job/definition can trigger per drain window: a `max_ai_calls_per_job` / `max_ai_kobo_per_job` budget carried in `WorkflowContext`, checked before each `runAiTaskWith`, so a handler that loops cannot fan out into unbounded calls even under the daily ceiling. A job that would exceed its per-job budget **dead-letters with an alert**, never proceeds silently.
4. **Single-flight per tick (SA-3's hardest-won lesson, now shipped twice).** Two concurrent drain ticks must not each spend the ceiling. SA-3 fixed this with a CAS-row lock whose TTL exceeds the route `maxDuration` (`studio_agency_tick_lock`, `#523`); SA-4 cloned it (`ai_operator_tick_lock`). The rail owns **ONE** such lock primitive so the reservation holds ACROSS ticks (not just within one) — the reserve-before-run in (2) is only sound under this lock.

Plus the shipped backstops every call already gets: provider billing-class backoff (`MODEL_DISABLED_BACKOFF_MS` 15 min on credit/billing/auth errors — `anthropic.ts`), the `killSwitchEnabled` kill switch, and the per-surface `freeAllowancePerDay` rate limiter.

```
step wants AI ──► per-job budget? ──no──► dead-letter + alert
      │ yes
      ▼
  runAiTaskWith(billable:false surface)
      │
      ├─ kill switch? ─yes─► refuse
      ├─ per-call maxCostKobo? ─exceeds─► cap_exceeded (no dispatch)
      ├─ daily budget (ai_free_spend_ledger)? ─exhausted─► conserve/refuse
      ▼
   dispatch ──► meter provider cost ──► ai_free_spend_add(cost) ──► redacted zero-kobo receipt
```

---

## 4. Where AI actually appears in Phase F (and how each is bounded)

| Pass | AI use | Mode | Bound |
|---|---|---|---|
| **V3-43** engine | none itself | — | provides the **per-job AI-spend guard** (§3.3) that all others inherit |
| **V3-44** auto-assign/escalate | "AI-augmented escalation" — classify/triage | prefer the **free deterministic `triageSupportStub`** (no model call); if any model triage, **internal non-billable** | per-call + daily + per-job caps; risk-class **M (AI-adjacent)** |
| **V3-46** owner reports | optional AI narrative (`composeMorningBriefNarrative`) | **internal non-billable** | daily budget + per-job cap; owner-only output; no figures in telemetry; risk-class **M (AI-adjacent)** |
| **V3-45** reminders | none (templated copy) | — | i18n copy keys only |
| **V3-47** queue-health | none (measurement) | — | — |
| **V3-48** campaigns | none (copy **by key only**, no inline/AI copy) | — | if AI drafting is ever added, it is human-gated (SA-D1: AI-authored free text waits for a human) + internal non-billable |

**Net:** the only AI in Phase F is internal, non-billable, capped three ways, and provider-opaque. No automation touches a customer wallet. Passes that reach for AI (V3-44, V3-46) are marked risk-class **M** in [PASS-PLAN.md](./PASS-PLAN.md) and gate on the PROD-ACTUAL AI-liveness checks.

---

## 5. Verification hooks (design-time review gates)

- **Grep gate:** no direct Anthropic SDK import outside `packages/ai-gateway/src/server/providers/*`. Any Phase F handler importing a provider SDK is a blocking finding.
- **Surface gate:** every Phase F AI call names a surface; assert the surface is `billable:false` for platform-invoked steps.
- **Budget gate:** every AI-invoking handler declares a per-job AI budget in its `WorkflowContext`; a handler without one fails review.
- **Opacity gate:** snapshot-test that a workflow's client-visible artifacts (notification body, email, report section) contain no forbidden keys (`provider`, `model`, `costKobo`, `margin`) — reuse `assertClientSafe`.
- **PROD-ACTUAL gate:** before any **metered** step ships, confirm `customer_wallet_ai_holds`/`ai_usage_events` + the three RPCs + `ai-usage-rate-card-v1` exist on prod (migration `20260627120000` is COMMITTED-NOT-APPLIED); before any **internal** step relies on the daily cap, confirm `ai_free_spend_ledger` is applied.
