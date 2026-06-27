# Guardrails — Henry Onyx Intelligence

**Pass:** V3-AI-ENGINE-DESIGN-01 · Design only. The non-negotiables every AI build pass must satisfy.

> The AI charge is **money**, the model is a **third party**, and a per-call metered loop can run away. These guardrails are the enforcement checklist — each is mechanical (a reviewer or CI can verify it), not aspirational. They derive from the existing money discipline (SEC-HARDEN-06, the payments money-RPC grant invariant, the FL2 zero-reconciliation rule, the double-entry ledger's balance/append-only triggers) and the studio copilot's proven anti-abuse hardening. Anchors are against `origin/main @ 67c2a67b`.

---

## 1. Money-grade billing — through the real double-entry ledger

The charge moves real money, so it posts through the **actual** spine, not a side channel.

- [ ] **Kobo, integer `BIGINT`.** Every amount — cost, margin, VAT, total, balance, hold, ledger leg — is integer kobo. No float ever touches money. Marketplace product price is the one whole-naira field; convert at the boundary (`*100`) as checkout does (`apps/marketplace/app/api/marketplace/route.ts:671`). The per-call record is `ai_usage_events.total_kobo BIGINT` (not `pricing_quotes.total`, which is int4).
- [ ] **A guarded RPC in `payments_private` is the only writer.** `reserve_wallet_for_ai_usage` / `post_ai_usage_charge` are `SECURITY DEFINER`, `set search_path = public, pg_temp`, with **`revoke … from public, anon, authenticated`** then `grant execute … to service_role` (SEC-HARDEN-06: the PUBLIC/bootstrap grant is additive, so revoking `public` alone is a no-op), and live in the non-PostgREST-exposed `payments_private` schema — unreachable via `/rest/v1/rpc/` by construction (`20260605123000_payments_private_isolation.sql:14`).
- [ ] **Atomic.** `SELECT … FOR UPDATE` on the wallet row + balance debit + `customer_wallet_transactions` insert + **`post_ledger_entry`** + hold settle, in **one** DB transaction. Any failure rolls back the whole thing. Mirrors the proven refund-debit pattern (`20260611130000_v3_19_refunds.sql:301-325`). Strictly safer than the current spend-path CAS (`route.ts:919-927`).
- [ ] **Balanced ledger.** Every AI charge posts a balanced entry: `DR customer_wallet_liability(total) / CR platform_revenue(cost+margin) / CR vat_output_payable(vat)`. The ledger's deferred `assert_entry_balanced()` trigger (`20260607120000_double_entry_ledger.sql:119`) is the final backstop; corrections are reversing entries (append-only, `:158`), never edits.
- [ ] **Idempotent.** `post_ledger_entry` dedups on `(source='ai_usage', source_event_id)` via `on conflict do nothing` (`double_entry_ledger.sql:252`); `ai_usage_events` carries a matching unique key. A crash/retry after the provider responded never double-charges and never double-posts.
- [ ] **Balance never negative.** The settle RPC asserts `balance_kobo >= total` (the reservation already guaranteed it); the DB `customer_wallets_balance_nonneg CHECK` (`20260611130000_v3_19_refunds.sql:197`) is the backstop.
- [ ] **Reconciliation Δ = 0.** `ledger_reconciliation()` balanced; `wallet_ledger_reconciliation()` (wallet == `customer_wallet_liability`) holds for every AI debit (unlike the legacy un-ledgered spend CAS, which the AI path must not replicate); per billed call `ai_usage_events.total_kobo == customer_wallet_transactions.amount_kobo`. Non-zero Δ halts the ramp (the FL2 rule).
- [ ] **CI invariant.** "AI money-RPC grant invariant" asserts `EXECUTE=false` for `public`/`anon`/`authenticated` on both RPCs (mirrors the payments invariant).

## 2. Pre-paid — the wallet gates the call {#2-pre-paid--the-wallet-gates-the-call}

The user can never be surprised; the platform never fronts provider cost it can't recover.

- [ ] **Estimate is a provable upper bound.** Before dispatch, cost is estimated assuming worst case for the resolved tier: output = `maxOutputTokens`, cache-write = worst case, cache-read = 0, calls = `maxCalls`. By construction `estimate ≥ actual`, so settlement can never exceed the reservation (the wallet can't be driven negative after the provider ran).
- [ ] **Priced for the tier that will run.** Because higher tiers cost more (§ARCHITECTURE 3.2a), the pre-flight price uses the **tier the operation resolves to** — a "deep" question is quoted at the deep tier before it runs.
- [ ] **Wallet-zero ⇒ provider not called.** If `available < estimate`, `reserve_wallet_for_ai_usage` returns `insufficient_funds`, the gateway returns a typed non-money error, and **no provider call is made** (owner's hard rule, `PASS-REGISTER.md:131`). The surface shows "top up to continue."
- [ ] **Reservation prevents concurrent overspend.** A hold reduces *available* balance, computed read-time as `balance_kobo − Σ(holds where status='held' AND expires_at > now())` — so an abandoned/crashed call's hold stops counting automatically (no sweeper required; an optional reaper flips stale rows to `released`).
- [ ] **Settle on actuals; refund the difference.** The user is charged the real metered cost for the tier used, never the conservative estimate; the remainder is released.
- [ ] **Every question priced up front.** The surface shows the pre-flight price and the post-call redacted receipt (`AiUsageReceipt`). No silent charge. FREE surfaces skip the wallet phase (still rate-limited).

## 3. Provider + model opacity

The user buys "Henry Onyx Intelligence." The **provider/source (Anthropic) and the real model name are both invisible** — only the swappable, governed implementation knows them.

- [ ] **Never in any client payload.** The provider/source `key`, the **real model name** (`modelUsedInternal`), the API key, the system prompt, and the raw cost/margin **never** cross to a client component or API response. The client receives only `AiUsageReceipt` (total + VAT + a capability `tier` label + quote ref).
- [ ] **Never in user-facing copy.** All AI copy says "Henry Onyx Intelligence." No "Claude/Anthropic/GPT/OpenAI" and **no model name** in any surface, label, error, receipt, or i18n string. The receipt's `tier` is a capability label ("fast"/"standard"/"deep") only — it must never be mapped to a model id or provider.
- [ ] **Redacted in logs.** Prompts, completions, provider/source ids, model ids, and PII run through `createRedactor`/`defaultRedactor` (`packages/observability/src/index.ts:25`) before any log line.
- [ ] **Server-only boundary.** All provider code lives behind the package's `./server` export + `import "server-only"`; a CI check enforces "no provider SDK / no provider id / no real model name in any client bundle."
- [ ] **Model routing is company config, server-only.** The `tier → Claude model` map is governed config, read only on the server; changing it never changes a client surface and never exposes the model.
- [ ] **Margin is invisible.** The receipt never reveals cost or margin (§ARCHITECTURE 3.5) — protects the provider's pricing and the company's margin, and removes a disintermediation signal.

## 4. Runaway-cost caps

A per-call metered loop with a bug or an abuser can burn money fast. Multiple independent ceilings, defence-in-depth.

- [ ] **Per-call output cap.** `maxOutputTokens` per surface bounds the largest single charge.
- [ ] **Per-tier per-call cost cap.** `tiers[tier].maxCostKoboPerCall` in the rate book; a call estimated above it is refused before dispatch. Heavier tiers carry their own ceiling.
- [ ] **Per-user velocity caps.** Daily and monthly spend ceilings per user; FREE surfaces have `freeAllowancePerDay`. Harvest the studio copilot's 6-layer model — per-session / per-account / per-IP / system-wide + salted SHA-256 dedup (`apps/studio/lib/studio/brief-copilot-action.ts:42`).
- [ ] **System-wide kill switch.** A feature flag disables all AI dispatch instantly (flag-dark launch, then monitored ramp). Pass 1 adds the flag to the registry (`@henryco/intelligence` `HenryFeatureFlagName`, `packages/intelligence/src/index.ts:291-296` — no AI flag exists yet).
- [ ] **Provider billing-error backoff.** On a provider billing/quota error, temporarily disable the model and fall back/refuse rather than hammering (studio `shouldTemporarilyDisableModel`, `brief-copilot-action.ts:440`).
- [ ] **Cap hits are observable.** `henry.ai.usage.blocked` is emitted on every refusal (insufficient funds, cap, kill switch) so abuse and mis-tuning are visible.

## 5. Abuse & prompt-injection defence

- [ ] **Schema-constrained output.** Billable generative surfaces use `responseSchema` (JSON-schema-constrained) so output is bounded and parseable — the studio copilot precedent (`brief-copilot-prompt.ts`).
- [ ] **Topic guard.** Surfaces decline off-topic, competing-brand, and anti-company prompts (V3-28 constraint), server-side at the system-prompt level.
- [ ] **Dedup.** Salted hash of (actor, surface, input) collapses rapid duplicate submissions (studio `copilotHash`, `brief-copilot-action.ts:461`).
- [ ] **No new write path.** An assist surface only *fills a form the human submits*; it never writes to the DB directly and never bypasses existing moderation (e.g. marketplace `evaluateListingSubmission`, `route.ts:1716`) or the human-owned upsert (whose slug owner-guard is already in place, `route.ts:1672-1691`).
- [ ] **RLS respected.** "Read my account" style assists run under the user's own access; the AI never sees data the user couldn't (V3-31 constraint).

## 6. Observability & audit

- [ ] **Every billed call emits + records.** `henry.ai.usage.estimated|metered|blocked` + `henry.ai.provider.failed` via `emitEvent`; a durable `henry_events` row via `persistEvent`; the immutable per-call money record is the `ai_usage_events` row.
- [ ] **Governance changes are audited.** Every margin/rate/billable-flag/model-routing change writes `pricing_override_events` (before/after) **and** the server-only `audit-log` (`add_audit_log_v2`, `packages/observability/src/index.ts:65`) — the V19 operator-action gate.
- [ ] **Traceable.** Each call carries a `traceId`; the `usageEventId` on the receipt lets support reconstruct any charge.

## 7. Brand, voice & i18n

- [ ] **Brand.** User-facing brand is **Henry Onyx** ("HenryCo" is a code identifier only). The AI surface is "Henry Onyx Intelligence"; the string comes from `COMPANY`/`getDivisionConfig`/`toBrandName` (`packages/config/company.ts:157,529,557`), never hardcoded.
- [ ] **Voice.** Copy is **calm authority** — no hype, no superlatives, no manufactured urgency. `pnpm tone:check` passes (`CLAUDE.md`).
- [ ] **i18n Pattern A.** New strings extend the EN baseline + types and render via `translateSurfaceLabel` (`packages/i18n/src/surface-copy.ts:2369`); zero new i18n GAPs; `pnpm i18n:check:strict` passes.

## 8. Scope fences (do not cross)

- [ ] **`packages/search-ui` is owner-reserved** — never modify it.
- [ ] **Don't modify** the payment-router providers, the payment money RPCs, or existing `payments_private` functions. The AI path is *added alongside* them (new RPCs, new `ai_usage_events`/holds tables, new chart rows).
- [ ] **`customer_wallets` (kobo) only.** Ignore the legacy V2 `wallets`/`wallet_transactions` (naira) pair entirely.
- [ ] **Register-L** for customer/business surfaces; **Register-D** for owner/staff consoles. A dark-first customer surface is a defect (`docs/v3/inner-surfaces-map.md`).

---

## One-line gate

> **No AI question bills a user unless:** it ran through the gateway, was estimated at its tier and reserved against a sufficient wallet, was metered on provider actuals, was priced through a versioned per-tier rate book (the company's % on cost), had VAT added via the existing engine (`tax` line), was settled by an atomic idempotent service-role-only `payments_private` RPC that **both** debited `customer_wallets` (kobo) **and** posted a balanced double-entry ledger entry, recorded an immutable `ai_usage_events` row, and returned a receipt that names **no provider/source and no real model**. Anything less is not money-grade and must not ship.
