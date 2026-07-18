# Money Model — How the Agency Earns, and What the AI Is Allowed to Cost

**Pass:** V3-STUDIO-AGENCY-DESIGN-01 · Design only. Every mechanism here composes the **live** money spine (ledger + `payments_private` RPCs + VAT engine + rate-card governance — see [README §spine](./README.md)); no new money primitive is introduced before its gate in [PHASED-PLAN.md](./PHASED-PLAN.md). Anchors against `origin/main @ 5f1139ff`.

---

## 1. The earning shape — a priced service with a governed cost envelope

The build is sold the way Studio already sells: a **quoted package price** on the proposal, paid through the **existing Studio rails**. The AI inside the job is **COGS under a hard cap**, not a surprise line on the client's bill:

```
client pays:   package price (quoted up front, VAT-inclusive)  ──► existing studio payment rail
company pays:  provider cost of the job (metered per call)     ──► capped by the job envelope
margin      =  package price − job COGS − delivery overhead    ──► governed by rate card + envelope sizing
```

Two pricing modes, chosen per package (owner decision **SA-D2**):

- **Mode A — fixed price (recommended default).** The client pays the proposal price; the job envelope is sized as a fraction of that price (default **20%**). Price certainty is the product; margin discipline comes from the envelope. If a job threatens its envelope, it **stops and escalates** — the client price never moves without a human-approved change order.
- **Mode B — metered add-on.** Extra AI work beyond the package (more revisions, extra pages, "draft me a launch campaign") is billed per call from the client's wallet through the **unchanged** gateway loop (`reserve_wallet_for_ai_usage` → `post_ai_usage_charge`, quote-before-run, hard-capped at the reservation) on metered `studio.*` surfaces — the shipped `studio.brief.client` precedent. Mode B inherits pre-paid gating for free: wallet-zero ⇒ the model is never called.

## 2. How the package price moves (client → company) {#2-package-price}

**Card (the default rail):** `POST /api/studio/pay/card` → `startStudioCardCharge` → `payment_intents` (`division='studio'`) via `@henryco/payment-router` → the frozen account webhook settles cash→clearing with statutory NGN fee-VAT decomposition → `reconcileStudioCardPayment` flips the `studio_payments` row on exact amount match. **Already live; reused unchanged.**

Two pre-existing spine gaps this design **inherits and must not widen** (they are prerequisites, not agency features — scoped in SA-2's gate):

- The Studio **wallet** debit (`apps/account/app/api/studio/payments/[id]/wallet/route.ts`) is an app-layer CAS that posts **no ledger entry**. Until a guarded wallet-spend RPC exists, agency packages are **card-rail only** (or bank-transfer with finance verification) — the design does not route new revenue over the unledgered path.
- `studio_payments.amount` is integer **major-unit naira**; all agency records ([§3](#3-the-job-cost-envelope)) are **kobo BIGINT** per the Prime Directive, converting only at the studio-table boundary as `card-rail.ts` already does.
- Studio per-sale revenue *recognition* is a documented v1 gap (`card-rail.ts` header: webhook posts cash→clearing only). The agency doesn't fix this alone, but its job records give finance the per-job COGS to recognize against once the studio division-sale breakdown lands.

VAT on the package price rides the existing engine exactly as Studio sales do today; nothing new.

## 3. The job cost envelope (metering the agent) {#3-the-job-cost-envelope}

The gateway's per-call loop cannot hold a 30-minute agent (5-min holds, `maxCalls: 1`), so the job gets an **envelope**: one budget, many metered calls, one settlement record — composing existing pieces:

```sql
-- DESIGN CONTRACT (SA-2 migration) — RLS default-deny; service-role writes; owner/staff read.
create table studio_build_usage (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references studio_build_jobs(id),
  attempt int not null,
  source text not null check (source in ('executor','gateway')),  -- harness-counted vs runAiTask receipts
  usage jsonb not null,               -- {calls, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens}
  provider_cost_kobo bigint not null, -- priced via the agency rate-card row (same meterAiCostKobo shape)
  usage_event_id uuid,                -- when source='gateway': FK-by-value to ai_usage_events
  created_at timestamptz not null default now(),
  unique (job_id, attempt, source)    -- idempotent settlement per executor report
);
```

- **Pricing truth**: a new `pricing_rule_books` row (`division='ai'`, key `studio-build-rate-card-v1`) holding per-token rates for the agent's tier — the same governed, live-tunable pattern as `ai-usage-rate-card-v1`, priced by the same linear `meterAiCostKobo` shape in `@henryco/pricing`. Envelope defaults (the 20% fraction, per-package floors/ceilings) live in the same row, so the owner tunes economics without a deploy (audited via `pricing_override_events`).
- **Mode A (fixed price)**: the envelope is an **internal** cost ceiling — no client wallet is touched per call. The harness-reported usage settles into `studio_build_usage`; the job's `cost_kobo` accrues. **Be precise about what is and isn't ledgered in v1:** `studio_build_usage` is *operational metering*, not a ledger post — no RPC exists for non-wallet COGS and this design forbids new money RPCs pre-gate (§6). Finance recognizes Mode-A provider cost **periodically from the provider invoice, reconciled against `Σ studio_build_usage.provider_cost_kobo`**, using the chart accounts the AI migration seeded (`ai_provider_cost` expense / `provider_payable` liability — on prod per the apply runbook stamped 2026-07-03, `docs/v3/ai/APPLY-v3-ai-01-metered-billing.md`; re-verify at build time as with any prod-state claim). A guarded per-job COGS-posting RPC that automates that recognition is an explicitly **deferred, gated deliverable** (§6 / [PHASED-PLAN](./PHASED-PLAN.md) deferred list). Client money and ledger revenue flow only through §2 — those are fully ledgered today.
- **Mode B (metered)**: each call is a normal gateway call — hold, settle, `ai_usage_events` row, balanced ledger post (`DR customer_wallet_liability / CR platform_revenue / CR vat_output_payable`) — with the `usage_event_id` mirrored into `studio_build_usage` so the job view is complete. For a **bounded multi-call block** under one hold, the levers already exist un-exercised: `maxCalls > 1` scales the reservation estimate, and `reserve_wallet_for_ai_usage` accepts caller-set `p_expires_at` (the long-hold lever) — a design-contract use of shipped SQL, not a new RPC.
- **Invariants**: settlement idempotent by `(job_id, attempt, source)`; `Σ studio_build_usage.provider_cost_kobo ≤ studio_build_jobs.budget_kobo + approved increases` (tick-enforced stall at breach, harness kill before it); every kobo figure BIGINT; every record carries `job_id` end-to-end for audit.

## 4. Refunds and failure money {#4-refunds-and-failure-money}

- **Job fails pre-deploy after payment**: refund follows the **existing** refund machinery only (`initiate_payment_refund` — ledgered, capped, never-negative). Policy (full vs partial by stage) is an SA-D2 sub-decision; mechanism is fixed: no new refund path.
- **Budget breach**: never bills the client in Mode A (the envelope is the company's problem); in Mode B the reservation hard-cap already guarantees the client never pays above quote (`exceeds_reservation` refusal; overage absorbed as margin — shipped semantics).
- **Cancellation pre-build**: deposit refund per the same policy; the job row closes `cancelled` with its cost trail intact.

## 5. Internal spend — the Owner-AI operator and owner-invoked ops {#5-internal-spend}

Non-billable by definition (the company working for itself), governed like the shipped free-AI guardrail rather than the wallet:

- Operator turns run on free surfaces (`hub.founder.assist` today; a sibling `hub.founder.operator` with its own `freeAllowancePerDay` if separation is wanted) — zero-kobo receipts, full telemetry, **no wallet interaction** (shipped `billable:false` semantics).
- A **daily operator spend ceiling** reuses the `ai_free_spend_ledger` idiom (durable daily counter + `allow/conserve/exhausted` degradation; default budget an SA-D2 knob, seeded at the same ₦5,000/day order of magnitude as the shipped free-budget default) — so an operator loop can never silently compound cost while the owner sleeps.
- Owner-invoked build jobs (company's own sites, experiments) are normal jobs with Mode-A envelopes and **no client payment leg** — same caps, same audit, flagged `internal` so finance separates COGS-for-revenue from company R&D.

## 6. What is deliberately NOT built

No new money RPC in SA-1→SA-3 (the phased gate for *any* new guarded function — a future ledgered wallet-spend for studio, and the Mode-A per-job COGS-posting RPC of §3 — is explicit in [PHASED-PLAN.md](./PHASED-PLAN.md) and rides its own adversarial review). No client-facing per-token pricing (opacity: clients buy outcomes and tier brands, never tokens). No escrow/milestone-hold primitive yet (phased payment UX leans on the committed-on-main `studio_payment_plans` releases — a V3 Pass-21 migration; **verify it is applied on prod before an agency package depends on it**, since Pass-21 tables were absent at the 2026-06-27 live probes). No non-NGN charging (everything chargeable is NGN-only on `main`; multi-currency waits for the MC program, unchanged).
