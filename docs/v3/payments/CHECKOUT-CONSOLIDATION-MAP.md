# Checkout/payments — the honest map (discovery before any "rebuild")

Read-only survey, 2026-06-29. Purpose: map what actually exists so nothing live is retired
blind. **Conclusion up front: you do NOT need a rebuild. A shared checkout already exists and
is already wired into most divisions. The real work is consolidating 2-3 outliers onto it.**

## What already exists (the shared checkout IS built)

| Layer | Package | Status |
|---|---|---|
| Provider engine (multi-provider) | `@henryco/payment-router` | Flutterwave (LIVE), Paystack, Stripe — already a router, not separate "methods" |
| Shared checkout UI | `@henryco/payment-surface` | `PaymentSurface` + receipt/proof-upload/processing/action-button |
| Money rail (DB) | `@henryco/payments-db` | the shared pooled rail (built this program) |
| Intent + webhook hub | `apps/account` | owns payment_intents, webhooks, refunds (uses payment-router) |
| Pricing/VAT | `@henryco/pricing` | commission + 7.5% VAT |

**The same `PaymentSurface` component is imported by the `pay/[paymentId]` page in jobs,
property, logistics, studio, AND care.** That is the shared checkout, already wired. The
double-entry ledger is balanced and the live provider has settled real money (reconciled).

## The actual gaps (this is the whole job — not a rebuild)

1. **learn** — `/learner/payments` uses NO shared payment package. The one genuine straggler.
   → Bring it onto `PaymentSurface` + the account intent hub (additive; nothing else touched).
2. **studio** — has SIX payment surfaces (`/checkout`, `/client/payment`, `/client/payments`,
   `/finance/payments`, `/pay/[paymentId]`, `/payment`). Its `pay/[paymentId]` already uses
   `PaymentSurface`; the others are fragmentation to fold into the one shared flow.
3. **marketplace** — a bespoke `/checkout` + `/api/checkout` + payment-proof. Decide whether
   it folds into `PaymentSurface` or stays (it may have genuinely marketplace-specific needs
   like cart + proof-of-payment that justify a thin wrapper over the shared core).

## Why a full retire-and-rebuild is the wrong call (honest)

- There are **no "old payment methods" to retire** — providers are already unified behind one
  router. Retiring them means deleting the live Flutterwave integration that's settling money.
- The shared checkout **already exists and is wired** — a rebuild throws away working,
  reconciled code and reintroduces risk (broken settlements, ledger imbalance, VAT/refund
  regressions) for **zero functional gain**.
- It **cannot be tested from here** against the real providers. Money code you can't run
  against a real/staging provider must not be rewritten on faith.

## Recommended safe path (same end state — one shared checkout everywhere — far less risk)

1. **learn → PaymentSurface** (additive, isolated): the highest-value, lowest-risk first
   step. Bring the one straggler onto the shared flow + the account intent hub.
2. **studio de-fragmentation**: collapse the 6 studio payment surfaces onto the single shared
   `pay/[paymentId]` + `PaymentSurface` flow, one surface at a time, each verified.
3. **marketplace**: audit whether `/checkout` can become a thin wrapper over `PaymentSurface`
   (keeping cart + proof-of-payment) or stays as a justified special case.
4. Each step **flag-gated where it touches a live page**, and the **owner verifies in staging
   against the real provider before the old surface is removed.** Retire only after the new
   path is proven for that division — never before.

This gets you exactly what you asked for — one shared checkout, wired to every payment page,
old surfaces retired — without betting the live money path on a blind big-bang.
