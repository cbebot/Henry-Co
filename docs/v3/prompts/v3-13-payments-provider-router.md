# V3-13 — Money & Identity Spine: Payment Provider Router

> **STATUS: SHIPPED — PR #169** (squash `0a8e5944`, branch `v3/13-payments-provider-router`, merged 2026-05-29). The `@henryco/payment-router` package, the `PaymentProviderAdapter` contract, the routing core, the `MockProvider` rail, and the money-correctness migration are all live on `main`. The rail is **dormant in production** (no provider secret set → zero providers registered → every route resolves to the A5 manual fallback). This document is the elevated canonical spec and the map every later provider pass (V3-14/15/16) reads. V3-15 (Paystack, PR #170) is the first live adapter built against this contract; residual rollout items are listed under **Residual / hardening follow-ups**.

**Pass ID:** V3-13  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Wallet, Payments, Financial Spine)
**Dependencies:** V3-12 (Foundation Lock acceptance — CERTIFIED, PR #168)  ·  **Effort:** M  ·  **Parallel-safe:** N (sequential start of Phase C)
**Owner gate:** none at start (D1 gates the downstream activation passes V3-14/15/16)  ·  **Risk class:** Money

---

## Role

You are the V3 Payments engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass builds the **`@henryco/payment-router`** — the vendor-agnostic interface and deterministic routing core that every live provider integration (V3-14 Stripe, V3-15 Paystack, V3-16 Flutterwave) plugs into by implementing one interface and registering one instance. It does **not** wire any live provider SDK: it ships the contract, the routing rule, the money-correctness triad (idempotent create, legal status transitions, webhook dedup), and a `MockProvider` that proves the whole path end-to-end. The line it must not cross: no real provider credentials, no live charge, no schema applied to a database — the rail stays dormant until an activation pass and owner sign-off light it.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/13-payments-provider-router` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Today the payment surface is the manual path: `@henryco/payment-surface` renders bank-transfer instructions, the buyer uploads a proof file, staff verify, status flips paid. Its primitives (`payment-receipt`, `payment-proof-upload`, `payment-processing`, `payment-action-button`, plus the `coercePaymentStatus` / `buildPaymentSurfaceContext` adapters) are real and shipped; what is missing is any programmatic charge path — no Stripe, Paystack, or Flutterwave SDK exists anywhere in `apps/` or `packages/`. `payment-surface` defaults to NGN; the multi-currency foundation (`@henryco/i18n/currency`, `isSupportedCurrency`, `getCurrencyMinorUnit`) already exists. The owner's P2 mandate is a **provider abstraction over Stripe + Paystack + Flutterwave** with deterministic routing, webhook verification + reconciliation, and ledger truth. This pass closes the gap between "manual proof only" and "a router that any real provider plugs into" — without taking on a live integration. It is the seam V3-14/15/16 widen, and the money-invariant home (`state-machine.ts` ↔ the SQL trigger) that V3-17 hardens.

## Mandatory scope

### S1 — `@henryco/payment-router` package

New workspace package `packages/payment-router/`, consumed as raw TypeScript source (`exports` → `./src/*.ts`, no build step — the monorepo convention; tests run on `node:test` + `tsx`):

```
packages/payment-router/src/
  types.ts                        Result<T,E>; ISO3166Alpha2/ISO4217; PaymentMethod
                                  (card|bank_transfer|ussd|mobile_money|apple_pay|google_pay — A10);
                                  PaymentProviderKey (stripe|paystack|flutterwave|mock);
                                  PaymentIntentStatus; money guards validateAmountMinor + normalizeCurrency (A4).
  errors.ts                       ProviderError, NoSuitableProviderError, IllegalTransitionError.
  state-machine.ts                LEGAL_TRANSITIONS, isLegalTransition, assertTransition (A2).
                                  *** Shared source of truth with the SQL trigger. ***
  providers/
    adapter-interface.ts          PaymentProviderAdapter + I/O types.
    mock-provider.ts              MockProvider — HMAC webhook verify; MOCK_PAYMENT_FAILURE injection.
  routing/
    capability-matrix.ts          provider → supported PaymentMethod[] (A10).
    country-defaults.ts           ISO-3166 country → ordered PaymentProviderKey[] preference.
  router.ts                       PaymentRouter (selectProvider, route) + createPaymentRouter factory.
  audit.ts                        buildRouterAuditInput — folds money context into an AuditLogInput.
  telemetry.ts                    payment event → EventOutcome / EventClassification (pure maps).
  reconciliation.ts               A7 contract TYPES ONLY (engine is V3-19).
  testing/in-memory-payment-store.ts   transactional store mirroring the SQL RPC (A1/A3/crash-between-steps).
  index.ts                        barrel (runtime-safe: never re-exports a server-only module).
  __tests__/*.test.ts             money-correctness + routing specs.
  scripts/mock-payment-webhook.mjs runnable mock e2e harness (route → webhook → dedup).
```

### S2 — Adapter interface

Every provider implements exactly this contract. Required methods only `initiate` / `refund` / `verifyWebhook`; `finalize` / `getBalance` are **optional** so a webhook-only adapter still compiles and the dormant mock stays minimal. Every method returns a `Result<T, ProviderError>` — adapters never throw for expected provider-side failures; the `retryable` flag on `ProviderError` drives router failover.

```typescript
export interface PaymentProviderAdapter {
  readonly key: PaymentProviderKey;
  initiate(params: InitiatePaymentParams): Promise<Result<InitiatePaymentResult, ProviderError>>;
  refund(params: RefundParams): Promise<Result<RefundResult, ProviderError>>;
  verifyWebhook(params: VerifyWebhookParams): Promise<Result<VerifiedWebhook, ProviderError>>;
  finalize?(params: FinalizeParams): Promise<Result<FinalizeResult, ProviderError>>;  // optional (D1)
  getBalance?(params: BalanceParams): Promise<Result<BalanceResult, ProviderError>>;  // optional (D1/G4)
}
```

`InitiatePaymentResult.clientAction` is the only thing the client ever sees and it is **provider-agnostic by construction**: `{ type: "redirect"; url } | { type: "sdk"; token } | { type: "none" }`, carrying no provider identity (Principle 9). `providerReference` is persisted server-side only.

### S3 — Router + the selection rule

`router.ts` ships `PaymentRouter` (`selectProvider`, `route`) and the `createPaymentRouter` factory. The selection rule is a pure intersection of three independent, individually-testable inputs:

```
candidates(country, method) =
    country-defaults[country]              (ordered preference; e.g. NG → [paystack, flutterwave])
  ∩ { p : method ∈ capability-matrix[p] }  (A10 — provider must support the method; wallets are distinct)
  ∩ registered providers                   (only adapters actually wired in this environment)
```

The intersection preserves country-default order — that order **is** the failover order. `route` walks the candidates: success returns immediately; a **retryable** failure fires `onProviderFailover` and tries the next; a **fatal** failure stops immediately (re-attempting a hard decline risks a double charge). Empty intersection → typed `no_suitable_provider`, mapped by the app route to the A5 manual fallback (never a dead end). The winning provider surfaces only via the server-side `onProviderSucceeded` hook — never in the return value the client receives.

### S4 — Mock provider

`MockProvider` is the only adapter built in this pass. It proves the contract with no live SDK: deterministic provider references, HMAC-signed webhook verification (mirrors how real providers sign), and `MOCK_PAYMENT_FAILURE=retryable|fatal` failure injection so the failover path is testable. `scripts/mock-payment-webhook.mjs` runs the full route → webhook → dedup loop. `createPaymentRouter` registers the mock under every real provider key when `MOCK_PAYMENT=1`, so country/capability routing behaves as in production across the still-dormant rails.

### S5 — `payment_intents` / `payment_attempts` / `processed_webhooks` schema (committed, NOT applied)

Migration `apps/hub/supabase/migrations/20260529120000_payment_intents.sql`. It is the **production mirror** of the TypeScript money-correctness reference and is **committed but NOT applied** in this pass — the owner applies it as a deliberate activation step, never as a CI side effect.

- `payment_intents` — `amount_minor BIGINT CHECK (> 0)` (A4: integer minor units, never float), `currency`, `country`, `method`, `status` with a CHECK constraint over the seven legal statuses, `provider_reference` (nullable), `division`, `metadata JSONB`, **`UNIQUE(user_id, idempotency_key)` (A1)**.
- `payment_attempts` — routing-attempt audit (one row per failover `failed` + the winning `succeeded` with its `provider_reference`); the Q2/G4 anchor used to resolve "which adapter owns this charge".
- `processed_webhooks` — **`UNIQUE(provider, provider_event_id)` (A3)** dedup ledger.
- A `BEFORE UPDATE` trigger `enforce_payment_intent_transition()` whose `if` clauses **mirror `LEGAL_TRANSITIONS` exactly** — defence-in-depth so the DB is the unbypassable guard and the TS table is the in-process guard.
- RLS: a user reads their own intents; finance staff read all. The finance read predicate is `public.is_platform_staff()` (the established sensitive-data reader) — **deliberately the interim, broader-than-finance predicate**; do NOT use `is_staff_in('finance', …)` (`'finance'` is a role, not a division → always false). V3-22 owns narrowing it.

### S6 — Provider-agnostic route handlers

New API routes in the account app (server-side only; the router never runs client-side):
- `POST apps/account/app/api/payments/intents/route.ts` — sensitive-action gate → A4 amount/currency guards → A1 idempotent create → record `payment_attempts` rows → `route()` → persist `provider_reference` server-side → Principle-9 response `{ intentId, status, clientAction }`.
- `POST apps/account/app/api/payments/intents/[id]/finalize/route.ts` — provider-return path (stub in V3-13; activated by V3-15).
- `POST apps/account/app/api/payments/webhooks/[provider]/route.ts` — no session; resolves the adapter generically via `getAdapter(provider)` (absent → 501); HMAC verify via the adapter (fail-closed 401); A3 dedup-insert-first then effect.

### S7 — `@henryco/payment-surface` seam (preserve the manual path)

The manual proof-upload flow is preserved end-to-end — some payments keep using it. Add an optional `cardCta?: { label; href } | null` to `PaymentSurfaceContext`, rendered only while a payment is open, so each pay surface adopts the card path with a single call-site change. Wire it on the marketplace `/pay/[orderNo]` reference **gated on `MOCK_PAYMENT=1`** so production (flag never set) ships no CTA and therefore no dead link to the not-yet-built card route. The other five divisions are registered as rollout work.

### S8 — Audit + telemetry

`buildRouterAuditInput` (pure builder) folds money context — including the server-side `selected_provider` — into an `AuditLogInput`; app routes compose it with `writeAuditLog` from `@henryco/observability/audit-log`. The nine `henry.payment.*` telemetry events are an exhaustive `Record<PaymentEventName, …>` keyed on `Extract<HenryEventName, "henry.payment.${string}">`, so adding an event without mapping it is a compile error:

```
henry.payment.intent.created      henry.payment.webhook.received     henry.payment.no_suitable_provider
henry.payment.intent.succeeded    henry.payment.webhook.verified     henry.payment.illegal_transition
henry.payment.intent.failed       henry.payment.webhook.rejected
henry.payment.intent.refunded
```

## Out of scope

- Live Stripe (V3-14), Paystack (V3-15), Flutterwave (V3-16) — they implement the S2 contract.
- Ledger double-entry hardening (V3-17). Refunds + reconciliation engine (V3-19). Subscription lifecycle (V3-20). Tax engine (V3-21). Finance dashboard + finance-RLS narrowing (V3-22). Native-app payments (V3-23).
- Applying the S5 migration to any database — that is a downstream activation step.

## Dependencies

- **Requires:** V3-12 Foundation Lock acceptance (CERTIFIED).
- **Blocks:** V3-14/15/16 (plug into this router), V3-17 (uses the schema + state machine), V3-19 (uses `refund` + the reconciliation contract types), V3-20 (uses `route` for charges), V3-21 (reads amount/currency/buyer location), V3-22 (queries the tables + narrows the finance RLS), V3-65 (gaming stakes, gated on D2), V3-85 (per-market routing extends `country-defaults`).

## Inheritance

- `@henryco/payment-surface` — manual-payment primitives preserved + extended with the `cardCta` seam.
- `@henryco/observability/audit-log` — every routed call audited; `@henryco/observability` telemetry taxonomy for the nine `henry.payment.*` events.
- `@henryco/i18n/currency` — `isSupportedCurrency` / `getCurrencyMinorUnit` back `normalizeCurrency` + minor-unit math (A4).
- V3-02 sensitive-action guard (`requireSensitiveAction` server / `fetchWithSensitiveAction` client) on the payment-mutating routes.
- `wallets` + `wallet_transactions` (the D8 RLS fix already shipped) — the eventual settlement target (ledger truth is V3-17).

## Implementation requirements

### Files

The package tree in S1; the migration in S5; the three account routes in S6; the `payment-surface` `cardCta` seam in S7; `docs/v3/payment-router-architecture.md` (the activation map V3-14/15/16 read).

### Trust / safety / compliance

All provider secrets are env-only, injected at the adapter seam — never client-bundled, never hardcoded. Client-generated UUIDv4 idempotency key on every intent creation (A1). Webhook verification is provider-specific HMAC, fail-closed, rejection audited (A3). Money is BIGINT minor units throughout (A4 — `validateAmountMinor` rejects non-positive / non-safe-integer; `normalizeCurrency` rejects unsupported codes before any ×exponent math). The `selectProvider` decision and the provider key never appear in any client response or client-visible error (Principle 9). Every routed call is audited via `@henryco/observability/audit-log`.

### Mobile + desktop parity

The route handlers are provider-agnostic and server-side; both web and the Expo super-app eventually call them (Expo via V3-23). Wallet methods `apple_pay` / `google_pay` are first-class `PaymentMethod` values (A10) so platform-compliance routing differs per wallet; the live wallet wiring is Stripe-mediated in V3-14.

### i18n

Payment-method labels, status copy, and error messages flow through `@henryco/i18n`, namespace **`surface:payments`** — never hardcoded. The A5 fallback message ("No payment method available for your region") and every status/error string are typed copy keys; runtime DeepL (Pattern B) covers the other locales.

### Brand & design system

Any user-facing string on a payment surface reads from `@henryco/i18n` (`surface:payments`); the legal entity on receipts/proofs is **"Henry Onyx Limited"** sourced from `@henryco/config` (`company.ts` `legalName`), never hardcoded. The card-CTA href and any callback URL resolve through `@henryco/config` helpers (`getAccountUrl()`), never a literal domain. The `payment-surface` primitives are design-token-only (Fraunces + locked `--site-*`/`--accent`), light + dark, mobile + desktop, CLS ≈ 0 — and behaviour-locked: this pass adds the `cardCta` seam, it does not change manual-payment behaviour.

## Validation gates

1. Standard CI: typecheck, lint, test, build (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Router + money-correctness suite** (≈50+ specs on `node:test` + `tsx` via `pnpm --filter @henryco/payment-router test`): routing intersection, country-default order, capability matrix, retryable-vs-fatal failover, A1 idempotent create, A2 legal transitions (every edge + terminal), A3 webhook dedup including the crash-between-steps case.
3. **Schema RLS** verified against the committed migration: a user reads only their own intents; finance read goes through `public.is_platform_staff()`.
4. **Mock-provider e2e**: `scripts/mock-payment-webhook.mjs` runs the full intent → webhook → dedup lifecycle green.
5. **No live SDK installed**: `package.json` contains no `stripe` / Paystack / `flutterwave-node-v3` dependency (those land in V3-14/15/16).
6. **Manual path preserved**: the `payment-surface` proof-upload flow still functions; production ships no `cardCta` (flag unset).

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/13-payments-provider-router` off `origin/main` → PR → squash-merge (no force-push). Owner reviews `docs/v3/payment-router-architecture.md`. **No real-money soak is owed** — the rail is dormant (no provider secret → A5 fallback everywhere); the soak lands with the first live adapter (V3-15). The S5 migration stays committed-not-applied.

## Final report contract

`.codex-temp/v3-13-payments-provider-router/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the architecture diagram + the test-coverage report.

## Self-verification

- [ ] `@henryco/payment-router` package shipped with the S1 tree.
- [ ] `PaymentProviderAdapter` defined: `initiate`/`refund`/`verifyWebhook` required, `finalize?`/`getBalance?` optional; every method returns `Result<T, ProviderError>`.
- [ ] `PaymentRouter` selection = country-default ∩ capability ∩ registered, in failover order; retryable fails over, fatal stops.
- [ ] `MockProvider` + `MOCK_PAYMENT_FAILURE` injection; `mock-payment-webhook.mjs` e2e green.
- [ ] Migration applied A1 `UNIQUE(user_id, idempotency_key)`, A3 `UNIQUE(provider, provider_event_id)`, BIGINT minor units, the transition trigger mirroring `LEGAL_TRANSITIONS`, and `is_platform_staff()` finance RLS — committed, NOT applied.
- [ ] Three provider-agnostic account routes; webhook route resolves adapters generically and fails closed 401.
- [ ] `cardCta` seam on `payment-surface`, marketplace wired gated on `MOCK_PAYMENT=1` (no production CTA).
- [ ] Audit on every routed call; nine `henry.payment.*` events, exhaustive by construction.
- [ ] No live provider SDK in `package.json`; no client response carries a provider identity (Principle 9).
- [ ] Report written. Hand-off: V3-14, V3-15, V3-16 (parallel against this contract).
