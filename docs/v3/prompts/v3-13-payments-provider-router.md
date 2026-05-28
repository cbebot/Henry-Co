# V3-13 — Payments: Provider Router

**Pass ID:** V3-13
**Phase:** C (MONEY & IDENTITY SPINE)
**Pillar:** P2 (Wallet, Payments, Financial Spine)
**Dependencies:** V3-12 (Foundation Lock acceptance)
**Effort:** M (1–2 weeks)
**Parallel-safe:** NO (sequential start of Phase C)
**Owner gate:** None at start (D1 affects later passes V3-14/15/16)
**Risk class:** Money

---

## Role

You are the V3 Payments engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass builds the **PaymentProviderRouter** — the vendor-agnostic interface every payment provider integration (V3-14 Stripe, V3-15 Paystack, V3-16 Flutterwave) plugs into. No live provider integration in THIS pass — that's V3-14/15/16. This pass establishes the contract and the routing logic.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/13-payments-provider-router` |
| Deploy | Vercel |
| Backend | Supabase |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §2.14)

> ### 2.14 Payment surface (`@henryco/payment-surface`)
> - UI primitives: payment-action-button, payment-copy-button, payment-file-field, payment-guide, payment-processing, payment-proof-upload, payment-receipt, payment-surface
> - Adapter pattern: `coercePaymentStatus`, `buildPaymentRecordView`, `buildPaymentSurfaceContext`
> - **Current workflow is MANUAL:** bank-transfer instruction → user uploads proof file → staff verifies → status flips paid
> - **NOT INTEGRATED:** no Stripe SDK, no Paystack SDK, no Flutterwave SDK anywhere in `apps/` or `packages/`
> - **Currency:** `payment-surface` defaults to "NGN" — multi-currency foundation per memory `project_henryco_currency.md`

Owner instructions (V3 vision P2):

> Provider abstraction (PaymentProviderRouter) over Stripe + Paystack + Flutterwave. Ledger hardening. Apple/Google Pay via Stripe where supported. Webhook verification + reconciliation.

---

## Mandatory scope

### S1 — `@henryco/payment-router` package

New package `packages/payment-router/`:

```
packages/payment-router/
  src/
    index.ts                — public exports
    types.ts                — PaymentProvider, PaymentIntent, PaymentResult, etc.
    router.ts               — main router with routing rules
    providers/
      adapter-interface.ts  — the contract each provider implements
      mock-provider.ts      — used in dev + tests
    routing/
      country-defaults.ts   — per-country default provider
      capability-matrix.ts  — which provider supports which payment method
    errors.ts
    audit.ts                — every routed call hits audit log
  package.json
```

### S2 — Adapter interface

Every payment provider implements this contract:

```typescript
export interface PaymentProviderAdapter {
  readonly providerKey: 'stripe' | 'paystack' | 'flutterwave' | 'mock';
  readonly supportedCountries: ReadonlyArray<ISO3166Alpha2>;
  readonly supportedCurrencies: ReadonlyArray<ISO4217>;
  readonly supportedMethods: ReadonlyArray<PaymentMethod>;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiateResult>;
  finalizePayment(input: FinalizeInput): Promise<FinalizeResult>;
  refundPayment(input: RefundInput): Promise<RefundResult>;
  verifyWebhook(payload: unknown, headers: Headers): Promise<WebhookVerifyResult>;
  getBalance(): Promise<BalanceSnapshot>; // for finance dashboard reconciliation
}
```

Each method:
- Returns `Result<T, ProviderError>` shape.
- Includes idempotency key support.
- Logs via `@henryco/observability/audit-log`.

### S3 — Router

`router.ts`:

```typescript
export class PaymentProviderRouter {
  constructor(
    private adapters: Map<string, PaymentProviderAdapter>,
    private config: RouterConfig
  ) {}

  selectProvider(input: { country: string; currency: string; method: PaymentMethod }): PaymentProviderAdapter | null;

  async route(intent: PaymentIntent): Promise<PaymentResult> {
    const adapter = this.selectProvider({...});
    if (!adapter) throw new NoSuitableProviderError(intent);
    // audit log
    // call adapter.initiatePayment
    // return PaymentResult
  }
}
```

Routing rules (`country-defaults.ts` + `capability-matrix.ts`):
- Country first (e.g., NG → Paystack first, Flutterwave second).
- Currency second (e.g., USD card → Stripe).
- Method third (e.g., USSD → Paystack; mobile money → Flutterwave; Apple Pay → Stripe).
- Failover: if primary provider returns retryable error, fall through to secondary.

### S4 — Mock provider

For dev + tests:
- Always returns success for valid inputs.
- Idempotency key respected.
- Configurable failure mode (`MOCK_PAYMENT_FAILURE=insufficient_funds`) for testing.
- Webhooks simulated via `npm run mock-payment-webhook -- <intent-id>`.

### S5 — `payment_intents` + `payment_attempts` schema

Migration:

```sql
CREATE TABLE payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amount_minor BIGINT NOT NULL, -- integer minor unit (kobo, cents)
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  method TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','succeeded','failed','refunded','cancelled')),
  selected_provider TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID REFERENCES payment_intents(id) NOT NULL,
  provider TEXT NOT NULL,
  provider_intent_id TEXT,
  outcome TEXT NOT NULL,
  provider_error JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
-- RLS: user reads own intents; staff reads all per is_staff_in('finance')
```

### S6 — Route handlers (provider-agnostic)

New API routes:
- `apps/account/app/api/payments/intents/route.ts` — POST create intent
- `apps/account/app/api/payments/intents/[id]/finalize/route.ts` — POST finalize (called by client after provider redirect)
- `apps/account/app/api/payments/webhooks/[provider]/route.ts` — POST webhook receiver (verifies + idempotent processes)

Each route:
- Calls into router (server-side only).
- Returns provider-agnostic response shape.
- Logs structured events.
- Sensitive-action guard from V3-02 applied.

### S7 — Existing `@henryco/payment-surface` integration

The manual-proof-upload flow is preserved (some payments still use it). Add a "use card payment instead" CTA on the manual-proof page when the user's country/currency has a live provider.

The router is callable from the existing `payment-surface` adapter helpers — wrap the new router behind the existing interface.

### S8 — Audit + telemetry

Events:
- `henry.payment.intent.created`
- `henry.payment.intent.failed`
- `henry.payment.intent.succeeded`
- `henry.payment.intent.refunded`
- `henry.payment.webhook.received`
- `henry.payment.webhook.verified`
- `henry.payment.webhook.rejected`
- `henry.payment.router.no_suitable_provider`

Every router call logs via `@henryco/observability/audit-log` with: user, country, currency, method, selected_provider, outcome, latency_ms.

---

## Out of scope

- Live Stripe integration (V3-14).
- Live Paystack integration (V3-15).
- Live Flutterwave integration (V3-16).
- Ledger double-entry hardening (V3-17 — separate pass).
- Refund + reconciliation engine (V3-19).
- Subscription lifecycle (V3-20).
- Tax engine (V3-21).
- Finance dashboard (V3-22).

This pass only builds the ROUTER + the contract.

---

## Dependencies

- V3-12 (Foundation Lock acceptance) closed.

Blocks:
- V3-14 (Stripe), V3-15 (Paystack), V3-16 (Flutterwave) — they plug into this router.
- V3-17 (Ledger hardening) — uses payment_intents/attempts schema.
- V3-19 (Refunds + reconciliation) — uses router refundPayment.
- V3-20 (Subscriptions) — uses router for charges.
- V3-21 (Tax engine) — uses payment_intents amount + currency + buyer location.
- V3-22 (Finance dashboard) — queries payment_intents.
- V3-65 (Gaming arena stakes) — uses router (gated on D2).
- V3-85 (Per-market payment routing) — extends this router.

---

## Inheritance

- `@henryco/payment-surface` — existing manual-payment UI primitives preserved + extended.
- `@henryco/observability/audit-log` — every routed call logged.
- `@henryco/auth/server/sensitive-action-guard` from V3-02 — applied to payment-mutating routes.
- Existing `wallets` + `wallet_transactions` tables — extended (D8 RLS fix already shipped per recent commits).

---

## Implementation requirements

### Files

(See S1 for package structure.)

Additional:
- `apps/account/app/api/payments/intents/route.ts` (new)
- `apps/account/app/api/payments/intents/[id]/finalize/route.ts` (new)
- `apps/account/app/api/payments/webhooks/[provider]/route.ts` (new — stub for V3-14+ to extend)
- `apps/hub/supabase/migrations/2026XXXXNNNNN_payment_intents.sql` (new)
- `apps/hub/app/owner/(command)/finance/dashboard.tsx` — initial scaffolding (V3-22 builds it out)
- `docs/v3/payment-router-architecture.md` (new — architecture reference)

### Trust / safety / compliance

- All provider secrets stored in env vars; never client-bundled (ANTI-CLONE Principle 6).
- Idempotency key on every payment intent creation; client-generated UUID v4.
- Webhook verification uses provider-specific HMAC; rejection logged.
- Audit log on every routed call (ANTI-CLONE Principle 12).
- Money in minor unit BIGINT to avoid float precision.
- `selectProvider` decision result NOT exposed in client response (ANTI-CLONE Principle 9 — network masking).

### Mobile + desktop parity

- The route handlers are payment-provider-agnostic; both web + Expo super-app eventually use them (Expo via V3-23 native-app compliance).
- Apple Pay / Google Pay support is in V3-14 (Stripe-mediated).

### i18n

- Payment-method labels, status copy, error messages all via `@henryco/i18n` namespace `surface:payments`.

---

## Validation gates

1. Standard CI.
2. **Provider router test suite** — 50+ unit tests covering routing rules, capability matrix, failover, idempotency.
3. **Schema RLS verified** — payment_intents readable only by owner + finance-staff.
4. **Mock-provider e2e** — full intent lifecycle works with mock.
5. **No live SDK installed** — verify no Stripe/Paystack/Flutterwave SDK in package.json (those install in V3-14/15/16).
6. **Existing payment-surface flow preserved** — manual proof upload still functions.

## Deployment gate

- All gates pass.
- Owner reviews architecture doc.
- 48-hour soak (zero traffic; this is dormant until V3-14 ships).

## Final report contract

`.codex-temp/v3-13-payments-provider-router/report.md` with the standard 9 sections + architecture diagram + test coverage report.

---

## Self-verification

- [ ] `@henryco/payment-router` package shipped.
- [ ] Adapter interface defined + documented.
- [ ] Router with routing rules + failover.
- [ ] Mock provider for dev + tests.
- [ ] `payment_intents` + `payment_attempts` schema applied with RLS.
- [ ] Provider-agnostic route handlers in account app.
- [ ] Audit log on every routed call.
- [ ] 8 new telemetry events.
- [ ] No live SDK installed (defer to V3-14/15/16).
- [ ] Report written. Hand-off: V3-14, V3-15, V3-16 (parallel).
