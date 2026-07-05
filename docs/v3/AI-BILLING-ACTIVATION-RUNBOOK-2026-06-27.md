# Henry Onyx Intelligence — AI Billing (#352) Activation Runbook

**Status:** `v3_ai_01_metered_billing` is **committed on `main`, NOT applied to prod**, and the
AI feature flag is **dark**. This is the only money-adjacent migration still pending — it is a
**separate feature from FL2** (FL2 payments are already live; see the go-live status report).

**Apply-readiness (verified on prod `rzkbgwuznmdxnnhmjazy`, 2026-06-27):** every schema
dependency the migration needs is already present —
`payments_private.post_ledger_entry`, ledger accounts `customer_wallet_liability` /
`platform_revenue` / `vat_output_payable`, `pricing_rule_books`, `customer_wallets.balance_kobo`,
and the `customer_wallet_transactions` columns (`type, amount_kobo, balance_after_kobo,
reference_type, reference_id, division`). **The migration will apply cleanly.** The *only* gate
is the rate-card sign-off (Decision D4).

---

## 1. What this migration adds (money mechanics)

Alongside the existing money spine (nothing existing is altered):

- **2 tables:** `customer_wallet_ai_holds` (pre-flight reservations) and `ai_usage_events`
  (immutable per-call money record; `total = cost + margin + vat` enforced by CHECK).
- **3 ledger chart rows:** `ai_provider_cost`, `provider_payable` (provider COGS, recognised
  when the provider invoices the company — not at point of sale), `vat_output_payable` (defensive).
- **3 guarded RPCs** in `payments_private` (service-role only, not PostgREST-exposed):
  - `reserve_wallet_for_ai_usage` — pre-paid reservation; refuses with `insufficient_funds`
    before the provider is called; idempotent on `idempotency_key`; wallet row locked.
  - `post_ai_usage_charge` — the **only** wallet writer: `SELECT … FOR UPDATE`, never-negative
    assert, debit, txn row, **balanced** double-entry post, hold settle — one transaction,
    **idempotent on the hold**, **hard-capped at the reservation** (user never billed above quote).
  - `release_wallet_ai_hold` — frees an unused hold without charging (provider failure/refusal).
- **1 governed rate-card row** in `pricing_rule_books` (`division='ai'`, key `ai-usage-rate-card-v1`).

**Invariants:** kobo BIGINT only (never float); NGN settlement only (FX is display-only);
new tables RLS default-deny, direct DML revoked, writes only via the SECURITY DEFINER RPCs;
the model/provider name is never exposed to the client.

Ledger posting per settled call:
```
DR customer_wallet_liability (total)
CR platform_revenue          (cost + margin)
CR vat_output_payable        (vat)   -- leg omitted when vat = 0
```

---

## 2. THE DECISION — D4 rate card (the only blocker)

The migration seeds an **illustrative** rate card. Per the migration's own comment, the per-token
costs **MUST be reconciled to the live provider list prices for the model routed to each tier
before the AI flag is enabled.** Seeded values:

| Tier | rate.in | rate.out | rate.cacheRead | rate.cacheWrite | marginRate | minChargeableKobo | maxCostKoboPerCall |
|------|---------|----------|----------------|-----------------|------------|-------------------|--------------------|
| fast | 0.16 | 0.80 | 0.016 | 0.20 | 10% | 500 | 50,000 |
| standard | 0.48 | 2.40 | 0.048 | 0.60 | 10% | 500 | 100,000 |
| **deep** | **2.40** | **12.00** | 0.24 | 3.00 | 15% | 500 | 200,000 |

⚠️ The **deep** tier (`2.40` in / `12.00` out) is the documented illustrative placeholder. Real
**Opus 4.8** list price is **$5 / $25** per million tokens (in/out). These seeded numbers do **not**
reflect that and will under-recover cost if shipped as-is.

**What the owner must decide / confirm:**
1. **Tier → model mapping.** Confirm what `AI_MODEL_FAST`, `AI_MODEL_STANDARD`, `AI_MODEL_DEEP`
   resolve to in prod env. The rate for each tier must match *that* model's list price.
2. **Per-unit cost numbers.** For each tier, set `rate.in/out/cacheRead/cacheWrite` from the routed
   model's real list price, converted to NGN:
   `NGN_per_unit = (USD_list_price_per_unit) × (USD→NGN FX)`.
   (Confirm the unit the margin engine `computeAiUsageBreakdown` in `@henryco/ai-gateway` multiplies
   by — per-token vs per-1k — and match the seed's unit.)
3. **Margin %** per tier (seeded 10% / 10% / 15%) — confirm or adjust.
4. **Floor + caps:** `minChargeableKobo` (per-call floor, seeded ₦5) and `maxCostKoboPerCall`
   (per-call cost cap) — confirm acceptable.
5. **VAT:** 7.5% output VAT is applied by the existing VAT engine and posted to `vat_output_payable`.
   No decision needed beyond confirming AI sales are VAT-applicable.

The rate card is **tunable live** (`pricing_rule_books` row, `ON CONFLICT DO UPDATE`), so numbers
can be corrected without a new migration — but they should be right *before* the flag flips.

---

## 3. Activation sequence (do NOT run until D4 is signed off)

1. **Finalize the rate card** (section 2). Update the seed block in the migration (or plan to
   `UPDATE pricing_rule_books` live immediately after apply).
2. **Apply the migration to prod** — `v3_ai_01_metered_billing`. Predecessor order is already
   satisfied on prod (payment_intents → payments_private_isolation → double_entry_ledger →
   v3_vat_01_settlement_vat → fl2_wallet_rail_completion → v3_19_refunds → **this**).
3. **Set prod env:** `ANTHROPIC_API_KEY`, `AI_MODEL_FAST/STANDARD/DEEP`, `AI_GATEWAY_TIMEOUT_MS`,
   `AI_PROVIDER_TIMEOUT_MS`, `AI_SURFACES`. Keep `MOCK_AI` unset in prod.
4. **Preview-first:** enable `AI_LISTING_ASSIST_ENABLED` (and any AI surface flag) on a preview
   deploy; smoke a real reserve → settle → release cycle with a small funded wallet.
5. **Flip the flag on prod** with a monitored ramp.

---

## 4. Verification checklist

- [ ] `reserve` refuses (`insufficient_funds`) when available balance < estimate (provider not called).
- [ ] `post_ai_usage_charge` debits wallet + posts a **balanced** ledger entry (DR == CR) in one txn.
- [ ] **Idempotency:** replaying a settled hold returns the prior result with **no second debit/post**.
- [ ] **Hard cap:** a settle request above the reservation is refused (`exceeds_reservation`).
- [ ] `release` frees an unused hold without touching balance; idempotent.
- [ ] Abandoned holds stop counting against available balance after `expires_at`.
- [ ] Model/provider name absent from client bundle (grep the built bundle).
- [ ] **Margin reconciliation:** after a real provider invoice, compare `ai_provider_cost`
      (DR provider COGS) vs collected `platform_revenue` margin — confirm positive net margin.
- [ ] #352 already shipped 38/38 PGlite proofs through the real ledger — re-run on a throwaway DB
      after any rate-card edit.

---

## 5. Rollback

- **Flag off** = no AI calls, no money movement. The migration is **additive** (new tables / RPCs /
  chart rows / rate-card row) — safe to leave applied even with the flag dark.
- Outstanding holds expire automatically (`expires_at`); no manual cleanup needed.
- A bad rate card is corrected live via `UPDATE pricing_rule_books` — no migration churn.

---

*Prepared 2026-06-27. Prerequisites verified live on prod; numbers in §2 require owner sign-off
(Decision D4) before §3 is executed. Nothing in this runbook has been applied.*
