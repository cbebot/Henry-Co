# Engineering Reference — Henry Onyx Intelligence

**Pass:** V3-AI-ENGINE-DESIGN-01 · Design only · Base `origin/main @ 67c2a67b`

> The implementation-grade companion to [ARCHITECTURE.md](./ARCHITECTURE.md): a fully worked numeric example, the data model/ERD, the error taxonomy, the failure-mode matrix, non-functional requirements, the test strategy, and a glossary. Everything here is a **contract for Pass 1**, not shipped code. Kobo amounts and rates are **illustrative** (clearly marked) — the real rates live in the governed rate card.

---

## 1. Worked example — one question, end to end

A marketplace vendor drafts a listing on the **`standard`** tier. Illustrative standard-tier rates (a Sonnet-class model at ~₦1,600/USD): `in = 0.48 kobo/token`, `out = 2.40 kobo/token`; company margin **10%**; VAT **7.5%** (`TAX.vat`); `minChargeableKobo = 500`.

### 1a. Pre-flight: estimate (provable upper bound) → reserve

The estimator assumes worst case: `output = maxOutputTokens (1,024)`, actual input `1,500`, cache `0`, `calls = 1`.

| Step | Computation | Kobo |
|---|---|---|
| estimate cost | `round(1500×0.48 + 1024×2.40)` = `round(3177.6)` | **3,178** |
| estimate margin | `round(3178 × 0.10)` | 318 |
| estimate net | `max(500, 3178 + 318)` | 3,496 |
| estimate VAT | `round(3496 × 0.075)` = `round(262.2)` | 262 |
| **estimate total** | `3496 + 262` | **3,758** (₦37.58) |

`reserve_wallet_for_ai_usage(estimate_total = 3758)` — succeeds only if `available ≥ 3,758`; otherwise `insufficient_funds` and **the provider is never called**. A hold for 3,758 kobo is created; `available` drops by 3,758.

### 1b. Provider call → meter actuals

The model returns the draft using `1,500` input + `600` output tokens (no cache). Actual `≤` reserved by construction.

### 1c. Price on actuals

| Line | Computation | Kobo |
|---|---|---|
| `ai_compute` (provider cost — internal) | `round(1500×0.48 + 600×2.40)` = `720 + 1440` | **2,160** |
| `ai_margin` (company 10% on cost) | `round(2160 × 0.10)` | **216** |
| net (cost + margin) | `max(500, 2160 + 216)` | 2,376 |
| `tax` (VAT 7.5% on net, via `applyOutputVat`) | `round(2376 × 0.075)` = `round(178.2)` | **178** |
| **`customerTotal`** (debited) | `2376 + 178` | **2,554** (₦25.54) |

### 1d. Settle — `post_ai_usage_charge`, one transaction

```
SELECT … FROM customer_wallets WHERE user_id = :vendor FOR UPDATE;     -- lock
assert balance_kobo ≥ 2554;                                           -- never-negative
UPDATE customer_wallets SET balance_kobo = balance_kobo − 2554;        -- debit
INSERT customer_wallet_transactions(type='debit', amount_kobo=2554, balance_after_kobo=…,
        reference_type='ai_usage', reference_id=:usage_event, division='ai', settlement_currency='NGN');
INSERT ai_usage_events(… cost_kobo=2160, margin_kobo=216, vat_kobo=178, total_kobo=2554, tier='standard', status='settled');
-- balanced double-entry (DR == CR):
post_ledger_entry('ai_usage', :usage_event, 'AI usage', 'NGN', [
   { account_code:'customer_wallet_liability', debit_minor: 2554, credit_minor: 0     },
   { account_code:'platform_revenue',          debit_minor: 0,    credit_minor: 2376  },
   { account_code:'vat_output_payable',        debit_minor: 0,    credit_minor: 178   } ]);
UPDATE customer_wallet_ai_holds SET status='settled' WHERE id = :hold;  -- releases the 3,758 − 2,554 = 1,204 remainder
```

**Balance check:** DR `2,554` == CR `2,376 + 178`. ✓ The deferred `assert_entry_balanced` trigger confirms at commit.
**Refund of the over-estimate:** `3,758 − 2,554 = 1,204` kobo is released back to `available` (never left the wallet's `balance_kobo`).

### 1e. Receipt (what the surface shows)

```json
{ "totalKobo": 2554, "vatKobo": 178, "tier": "standard",
  "surface": "marketplace.listing.draft", "usageEventId": "…", "billed": true }
```
Rendered: **"Henry Onyx Intelligence · ₦25.54 (incl. ₦1.78 VAT) · Standard."** No provider, no model, no cost, no margin.

### 1f. Same question, `deep` tier — "higher model, higher bill"

Deep-tier (Opus-class) rates `in = 2.40`, `out = 12.00`; deep margin **15%**:

| | cost | margin | net | VAT | **total** |
|---|---|---|---|---|---|
| `standard` | 2,160 | 216 | 2,376 | 178 | **2,554 (₦25.54)** |
| `deep` | 10,800 | 1,620 | 12,420 | 932 | **13,352 (₦133.52)** |

The identical question costs **₦25.54** on `standard` and **₦133.52** on `deep` — higher operations on stronger models bill higher, by construction, and the price is shown before the call runs. Deep-tier ledger entry: `DR customer_wallet_liability 13,352 / CR platform_revenue 12,420 / CR vat_output_payable 932` (balanced).

### 1g. Provider COGS (recognized separately)

When the provider invoices the company for that month's usage (e.g. the `2,160`/`10,800` kobo costs), COGS is posted once, separately from the user charge:
`DR ai_provider_cost (expense) / CR provider_payable (liability)`. **Margin = `platform_revenue` − `ai_provider_cost`** in the P&L — not carved at point of sale.

---

## 2. Request lifecycle (sequence)

```
Vendor        Surface (server)      ai-gateway/server         payments_private (svc role)     Anthropic (server-only)
  │  click "Draft"  │                      │                            │                            │
  │────────────────>│ runAiTask(surface,actorId,input,idemKey)         │                            │
  │                 │─────────────────────>│ 1 resolve policy + tier    │                            │
  │                 │                      │ 2 estimate (upper bound)   │                            │
  │                 │                      │ 3 reserve ───────────────> reserve_wallet_for_ai_usage  │
  │                 │                      │                            │  (insufficient? → REFUSE, no provider call)
  │                 │                      │ 4 dispatch ────────────────┼──────────────────────────> generate()
  │                 │                      │ 5 meter actual usage <─────┼──────────────────────────── result+usage
  │                 │                      │ 6 price (cost→margin→VAT)  │                            │
  │                 │                      │ 7 settle ────────────────> post_ai_usage_charge  ──────> post_ledger_entry
  │                 │<─ output + receipt ──│   (debit wallet + balanced ledger entry, one txn, idempotent)
  │<─ draft fills form, "₦25.54 incl VAT" │                            │                            │
```

Provider identity and model id terminate at the gateway's `./server` boundary; nothing right of step 5 crosses back to the surface.

---

## 3. Data model & ERD

Two new tables; everything else is existing. Arrows are FKs / logical references.

```
auth.users ──< customer_wallets ──────< customer_wallet_transactions      (existing)
                    │  (1:1 balance projection of ledger acct                )
                    │   customer_wallet_liability)                            
                    ├──< customer_wallet_ai_holds      (NEW — reservations)
                    └──< ai_usage_events               (NEW — immutable per-call record)
                                  │
                                  └─ reference_id ─> journal_entries(source='ai_usage', source_event_id)  (existing ledger)
pricing_rule_books (division='ai')  ──(rate card, by key+version)──>  ai_usage_events.rule_version   (existing table)
pricing_override_events             ──(governance audit of rate/margin/model changes)               (existing table)
ledger chart (NEW rows): ai_provider_cost (expense), provider_payable (liability)
```

### `ai_usage_events` (NEW) — immutable per-call record

| column | type | notes |
|---|---|---|
| `id` | uuid pk | also the ledger `source_event_id` |
| `user_id` | uuid → auth.users | the billed actor (the vendor) |
| `surface` | text | `AiSurfaceKey` |
| `tier` | text | `fast`/`standard`/`deep` (capability, not a model name) |
| `input_tokens`,`output_tokens`,`cache_read_tokens`,`cache_write_tokens`,`calls` | int | metered actuals |
| `cost_kobo`,`margin_kobo`,`vat_kobo`,`total_kobo` | **bigint** | kobo; `total = cost + margin + vat` |
| `rule_book_key`,`rule_version` | text | the rate card that priced it |
| `status` | text | `settled` / `refunded` |
| `created_at` | timestamptz | append-only (no UPDATE except status→refunded via reversing flow) |
| | | **unique** `(id)`; reconcile: `total_kobo == customer_wallet_transactions.amount_kobo` |

`bigint` (not `pricing_quotes.total`'s int4) keeps the kobo-BIGINT directive whole.

### `customer_wallet_ai_holds` (NEW) — pre-flight reservation

| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `wallet_id` | uuid → customer_wallets | |
| `user_id` | uuid → auth.users | |
| `estimate_kobo` | bigint | the reserved upper bound |
| `status` | text | `held` / `settled` / `released` |
| `idempotency_key` | text **unique** | dedups reservations |
| `surface`,`tier` | text | |
| `created_at`,`expires_at` | timestamptz | **available = balance − Σ(holds where status='held' AND expires_at > now())** |

RLS: both tables service-role-write only; SELECT-own for the user's own usage dashboard (or service-role-only + a read view) — finalized in Pass 1. The money writers are the two `payments_private` RPCs; direct table DML is revoked from `anon/authenticated` per the ledger pattern.

---

## 4. Error taxonomy (typed, returned by the gateway)

All are **non-throwing** `Result` errors (mirroring `@henryco/payment-router`'s `ProviderError`); the surface maps each to calm-authority copy.

| code | money moved? | provider called? | meaning / surface treatment |
|---|---|---|---|
| `insufficient_funds` | no | **no** | wallet can't cover the estimate → "Top up to continue." |
| `cap_exceeded` | no | no | estimate over the tier's `maxCostKoboPerCall` → "This is too large to run in one step." |
| `kill_switch_active` | no | no | global AI flag off → "Henry Onyx Intelligence is paused." |
| `rate_limited` | no | no | per-user/IP/session velocity cap (or FREE allowance) hit → "Please wait a moment." |
| `provider_timeout` | no | started, no usable result | hold released, no charge → "That took too long — try again." |
| `provider_error` | no | yes (failed) | hold released, no charge; backoff may temporarily disable the model → graceful retry/refuse. |
| `provider_refusal` | **maybe** | yes | model declined (off-topic/guard). Policy: refusals are **not billed** in Pass 1 (released). |
| `schema_validation_failed` | no | yes | output failed `responseSchema` → retried once, else refused (released). |
| `duplicate` | no (idempotent) | n/a | replayed `idempotency_key`/`source_event_id` → returns the prior result; never double-charges. |

---

## 5. Failure-mode & edge-case matrix

| Scenario | Behavior | Mechanism |
|---|---|---|
| Wallet can't cover estimate | Provider never called; nothing spent | reserve-before-dispatch returns `insufficient_funds` |
| Provider times out / errors before a usable result | Hold released; no charge | gateway catches `Result.error`; hold expiry / explicit release |
| Crash **after** provider responds, **before** settle | No charge persisted; retry re-prices and settles once | hold `expires_at` frees `available`; settle idempotent on `source_event_id` |
| Retry of an already-settled call | No-op; returns prior receipt | `post_ledger_entry` `on conflict do nothing` + `ai_usage_events` unique |
| Two concurrent calls by one user | Both can't overspend; second refused if `available` short | holds reduce `available` read-time; `FOR UPDATE` serializes settle |
| Actual cost would exceed reservation | Impossible by construction | estimator is a provable upper bound (worst-case output + cache-write + maxCalls) |
| Settle RPC fails mid-transaction | Full rollback (no debit, no ledger, no event) | single DB transaction + deferred balance trigger |
| AI charge needs reversing (dispute/goodwill refund) | Reversing ledger entry + wallet credit; `ai_usage_events.status='refunded'` | mirror the existing refund-debit pattern in reverse (`DR platform_revenue/vat_output_payable / CR customer_wallet_liability`); never edit the original entry |
| Ledger not yet applied to prod (pre-FL2) | Metered path not live; non-money gateway (FREE surfaces, studio refactor) can run | metered settle requires `post_ledger_entry`; gated on ledger apply |
| Provider/model name leaks toward client | Build fails | redaction + CI "no provider id / model name in client bundle" check |
| Rate card missing for a surface/tier | Call refused (`cap_exceeded`-class config error), logged | gateway requires a resolvable rate-book row before dispatch |

---

## 6. Non-functional requirements

| NFR | Target |
|---|---|
| **Gateway overhead** | < ~50 ms added latency beyond the provider call (estimate + reserve are a single indexed read + one RPC). |
| **Availability / degrade** | A provider outage degrades gracefully (refuse/queue with calm copy), never charges, never 500s the host surface. FREE surfaces fall back to the existing heuristic where one exists (studio precedent). |
| **Idempotency window** | Indefinite — keyed on a canonical `source_event_id`; a replay any time returns the prior result. |
| **Observability** | Every call emits `henry.ai.usage.*` + a `henry_events` row + an `ai_usage_events` row; every refusal emits `henry.ai.usage.blocked`. Traced by `traceId`; reconstructable by `usageEventId`. |
| **Cost telemetry** | Per-call `cost_kobo`/`margin_kobo`/`vat_kobo` retained for owner analytics; provider-cost trend monitored against the rate card (drift alert). |
| **Privacy** | Prompts/outputs redacted in logs; PII never logged raw; provider/model/key never logged. |
| **Determinism** | Pricing is pure and deterministic per rate-card version; FX pinned at rate-card authoring time (no hot-path FX call). |

---

## 7. Test & verification strategy

| Layer | What proves it | How |
|---|---|---|
| Pricing math | cost→margin→floor→net→VAT correct; rounding via `roundInt`; per-tier; `estimate ≥ actual` always | pure unit tests, `tsx --test` (no DB); property test for the upper-bound invariant |
| VAT | `tax` line emitted; `extractTaxFromBreakdown` reads it; figures match `applyOutputVat` | reuse `@henryco/pricing` vat tests; add AI-breakdown cases |
| Ledger posting | every AI entry balances; append-only; idempotent | PGlite (throwaway, outside the repo) proofs: post → assert `Σdebit==Σcredit`; replay `source_event_id` → no-op; attempt UPDATE/DELETE → rejected |
| Wallet atomicity | no torn write; never-negative; concurrent calls can't overspend | PGlite: forced mid-RPC failure → full rollback; parallel settle under `FOR UPDATE` |
| Reconciliation | `wallet_ledger_reconciliation` Δ0 after AI debits; `ledger_reconciliation` balanced; `vat_reconciliation` ties out | seeded scenario asserting Δ == 0 |
| Grant lockdown | `EXECUTE=false` for `public`/`anon`/`authenticated` on both RPCs | CI "AI money-RPC grant invariant" (mirrors payments invariant) |
| Opacity | no provider id / real model name in any client bundle or log | CI bundle-scan + redaction unit test |
| Brand/voice/i18n | "Henry Onyx" only; calm authority; no GAPs | `pnpm tone:check`, `pnpm i18n:check:strict` |

---

## 8. Glossary

- **Surface** — a registered AI entry point (`AiSurfaceKey`) with a policy (billable?, default tier, caps).
- **Tier** — a capability level (`fast`/`standard`/`deep`); maps server-side to a company-set Claude model and a rate-card row. A user-safe label; never a model name.
- **Rate card** — the governed `pricing_rule_books` row (`division='ai'`) holding per-tier rates + margins + caps, versioned and effective-dated.
- **Hold / reservation** — a pre-flight lien on wallet balance (`customer_wallet_ai_holds`) sized to the estimate; reduces *available* balance until settle or expiry.
- **Settle** — converting a hold into a real charge at actual cost via `post_ai_usage_charge` (wallet debit + balanced ledger post), releasing the remainder.
- **Net** — cost + margin (the ex-VAT price); becomes `platform_revenue`.
- **Output VAT** — 7.5% added on top of net via `applyOutputVat`; becomes `vat_output_payable`.
- **COGS** — provider cost, recognized separately as `ai_provider_cost` when the provider invoices the company.
- **Clearing / liability** — `customer_wallet_liability` is the ledger account the wallet projects; a spend debits it.
- **Projection** — the wallet's `balance_kobo` is a materialized view of `customer_wallet_liability` (credits − debits), reconciled by `wallet_ledger_reconciliation`.
- **FL2** — the owner-gated production-apply finish-line for the payments/ledger spine (Paystack go-live).

---

## 9. Assumptions & open items

- **Kobo-per-token rates and margins above are illustrative.** Real values come from D4 + the company's model-routing config and are seeded into the rate card.
- **Refusal billing policy:** Pass 1 does **not** bill provider refusals; revisit if abuse via deliberate refusals appears.
- **Per-tier margin shape (flat vs rising):** owner input (D4).
- **Usage-dashboard read model:** SELECT-own RLS vs a service-role read view — finalized in Pass 1.
- **Multi-currency display:** AI prices are NGN-settled; display in other currencies reuses `@henryco/pricing`'s FX layer (approximate-display labeling), no new FX work.

---

## 10. Document change-control

- **Authored against:** `origin/main @ 67c2a67b`. App-file line numbers drift — trust named symbols; re-verify before building.
- **Rewrite provenance:** see [README § Provenance](./README.md#provenance--why-this-design-was-rewritten).
- **Ratification gates:** D4 + the VAT-at-launch checkpoint ([D3-D4](./D3-D4-DECISION-FRAMEWORK.md)) must be answered before Pass 1 builds.
