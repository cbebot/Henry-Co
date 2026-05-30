# V3-15 — Payments: Paystack Activation (implementation plan)

**Status:** in progress · **Effort:** L · **Risk:** money
**Base:** `origin/main` @ `0a8e5944` (V3-13 payment-router, PR #169)
**Migration `20260529120000_payment_intents.sql` stays NOT-APPLIED** until owner review + the money soak. This pass edits it in place (it has never run), so there is no migration-on-migration.

Activate Paystack as the **first live payment provider** behind the V3-13 vendor-agnostic router. The router, money-correctness triad (A1/A2/A3), ANTI-CLONE Principle 9 (client never learns the provider), and the dormant mock rail already shipped in V3-13. This pass adds the real adapter and closes the latent gaps V3-13's own closure bar requires.

## Locked decisions (owner)

- **Q1 — guarded RPCs, absolute zero direct status UPDATEs.** No route writes `payment_intents.status` directly. No "benign" carve-out. The grep stays genuinely zero.
- **Q2 — provider persistence at initiate.** Write `payment_attempts` at initiate. Refund/finalize resolve the owning provider from the **succeeded** attempt (failover means the winner may not be first-tried). Doubles as the G4 reconciliation anchor.
- **Q3 — webhook-confirmed refund.** An intent becomes `refunded` ONLY when Paystack's `refund.processed` webhook confirms money moved. Honest intermediate `refund_processing` meanwhile. Money-truth over instant UX.

## Derived decisions (called this pass; flagged for veto)

1. **One guarded RPC `advance_payment_intent(p_intent_id, p_from, p_to)`** with an explicit 3-edge whitelist — `{(pending,processing),(succeeded,refund_processing),(refund_processing,succeeded)}` — returning rows-affected for mutex use. Q1 named `mark_payment_processing`; Q3 then added two more non-money edges, so a single whitelisted function keeps the complete set of non-money advances auditable in one place. Every money-confirming transition stays exclusively in `apply_payment_webhook`. (Alternative: three single-edge `mark_*` functions — trivial swap.)
2. **Remove the `payment_attempts` INSERT from `apply_payment_webhook`.** `payment_attempts` then records routing attempts only, so "resolve provider from the `status='succeeded'` attempt" is unambiguous (a `charge.success` webhook would otherwise write a second `'succeeded'` row). Webhook auditing already lives in `processed_webhooks`. The in-memory store mirrors this (drops its attempt counter; dedup idempotency stays covered by the `applied` flags).
3. **Add `customerEmail` to `InitiatePaymentParams` + `RouteIntent`.** Paystack `transaction/initialize` requires a customer email; threaded from the authenticated user in the create route. Mock ignores it.

## State machine (A2)

```
pending           → processing, cancelled
processing        → succeeded, failed
succeeded         → refund_processing          (was: → refunded)
refund_processing → refunded                   (refund.processed webhook — money moved, confirmed)
refund_processing → succeeded                  (refund.failed / synchronous reject — revert, money still with us)
failed / refunded / cancelled : terminal
```

`refunded` = money actually left, provider-confirmed. Mirrored across: `state-machine.ts` `LEGAL_TRANSITIONS`, the SQL trigger `enforce_payment_intent_transition`, the status CHECK constraint, `PaymentIntentStatus`, and the in-memory store.

## Status-change paths (D3)

- **Non-money advances** → `advance_payment_intent` (whitelisted, rows-affected for mutex). `pending→processing` (finalize), `succeeded→refund_processing` (refund mutex), `refund_processing→succeeded` (revert).
- **Money-confirming** (`→succeeded`, `→failed`, `→refunded`) → **only** `apply_payment_webhook` (deduped, provider-confirmed).
- Routes never UPDATE `status`. (`provider_reference` writes at create are not status writes — allowed.)

## Flows

**Create** (`POST /payments/intents`): insert `pending` (A1 idempotent on 23505) → route with hooks capturing failover + winner → on success write `payment_attempts`: winner `status='succeeded'` + `provider_reference`, each failed-over provider `status='failed'` + `error_code` → persist `provider_reference` on the intent → return `{intentId, status:'pending', clientAction}` (opaque, no provider identity).

**Finalize** (`POST /payments/intents/[id]/finalize`, the Paystack callback return): resolve provider from the succeeded attempt → `advance_payment_intent(pending→processing)` → `adapter.finalize()` (`transaction/verify`) → if it implies a terminal status, `apply_payment_webhook(provider, providerEventId=reference, intentId, impliedStatus)` (deduped by `reference`, so the async `charge.success` webhook can't double-apply — G2).

**Refund** (`POST /payments/intents/[id]/refund`): R1 sensitive-action guard → succeeded-only 409 guard → resolve provider from the succeeded attempt (Q2) → `advance_payment_intent(succeeded→refund_processing)` **as a mutex** (rows-affected=1 → we won; 0 → concurrent refund → 409) → only if won, `adapter.refund()` → on synchronous reject, revert `refund_processing→succeeded` (no webhook will come) → return `status:'refund_processing'`. `refunded` lands later on the `refund.processed` webhook.

**Webhook** (`POST /payments/webhooks/[provider]`): read raw body → emit `henry.payment.webhook.received` → `router.getAdapter(provider).verifyWebhook()` (HMAC-SHA512, fail-closed) → bad/missing signature: **401** + emit `henry.payment.webhook.rejected` (G1) → emit `henry.payment.webhook.verified` → resolve intent by `provider_reference` → `apply_payment_webhook` (A3). Event→status: `charge.success→succeeded`, `charge.failed→failed`, `refund.processed→refunded`, `refund.failed→succeeded` (revert). Dedup keys: charge = `data.reference` (matches finalize — G2); refund = `refund:<refund_id>`.

## Gaps closed

- **G1** HMAC-SHA512 raw-body fail-closed → 401 + `webhook.rejected`.
- **G2** Stable dedup: finalize + webhook share the `reference` key, can't double-apply.
- **G3** TEST→LIVE is env-only (`PAYSTACK_SECRET_KEY` `sk_test_`/`sk_live_`), no `if(test)` branching; base URL always `api.paystack.co`.
- **G4** `payment_attempts` (provider, provider_reference, status) + `getBalance` are the reconciliation anchors.
- **G5** Kobo-exact: `amountMinor` is already the subunit; passed to Paystack verbatim, no ×100.
- **G7** Callback URL via `henryDomain('account', …)`, config-driven.
- **G8** USSD is a secondary capability (Paystack hosted checkout via `transaction/initialize` covers card/bank_transfer/ussd; `channels` biases by method).

## File-by-file

**packages/payment-router/src/**
- `types.ts` — add `refund_processing` to `PaymentIntentStatus`.
- `state-machine.ts` — add to `ALL_STATUSES`; update `LEGAL_TRANSITIONS`.
- `providers/adapter-interface.ts` — `FinalizeParams/Result`, `BalanceParams/Result`, optional `finalize?`/`getBalance?`; `customerEmail` on `InitiatePaymentParams`.
- `providers/mock-provider.ts` — implement `finalize`/`getBalance` (mirror), accept `customerEmail`.
- `providers/paystack-provider.ts` — **new** `PaystackAdapter`.
- `router.ts` — register `PaystackAdapter` when `PAYSTACK_SECRET_KEY` present; mock fills only un-served keys; `customerEmail` on `RouteIntent`.
- `index.ts` — export `PaystackAdapter`.
- `testing/in-memory-payment-store.ts` — mirror `refund_processing`; drop webhook attempt counter.

**apps/hub/supabase/migrations/20260529120000_payment_intents.sql** — status CHECK + trigger edges; add `advance_payment_intent`; remove `payment_attempts` insert from `apply_payment_webhook`.

**apps/account/app/api/payments/** — `intents/route.ts`, `intents/[id]/finalize/route.ts`, `intents/[id]/refund/route.ts`, `webhooks/[provider]/route.ts` (per Flows).

**docs/v3/payment-router-architecture.md** — update §7/§8.

## Test strategy

`node:test` + `tsx`, run `pnpm --filter @henryco/payment-router test`. TDD per unit: state-machine (new edges + terminal guards), in-memory store (refund_processing lifecycle + dedup), PaystackAdapter (HMAC-SHA512 fail-closed, kobo-exact, event→status mapping, Result-not-throw), router (Paystack registration + failover). Routes are Next.js/Supabase wiring verified by reading + the D3 grep (zero direct status UPDATEs in route code); they can't run against live Paystack/Supabase here. Migration is reviewed against the TS mirror, applied later under the money soak.
