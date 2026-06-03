# V3-14 — Money & Identity Spine: Stripe Activation

**Pass ID:** V3-14  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Wallet, Payments, Financial Spine)
**Dependencies:** V3-13 (payment provider router — SHIPPED PR #169)  ·  **Effort:** L  ·  **Parallel-safe:** Y (with V3-15, V3-16)
**Owner gate:** D1 (payment provider activation per country — **decision recorded in `docs/v3/DECISIONS-REQUIRED.md`; confirm, don't re-litigate**)  ·  **Risk class:** Money

---

## Role

You are the V3 Payments engineer for Henry Onyx (Stripe). You execute exactly this one pass, then stop and report. This pass wires Stripe as a live provider behind the V3-13 router by implementing one adapter — `StripeProvider` — against the `PaymentProviderAdapter` contract and registering it. Stripe is Henry Onyx's **card + Apple Pay + Google Pay** provider (the wallet methods Paystack and Flutterwave do not serve) and the **second wave** per D1 (Option A is Nigeria-first Paystack + Flutterwave; Stripe activates for the first market with meaningful card volume outside Africa — US / GB / EU per `country-defaults.ts`). The line it must not cross: Stripe is invisible in Henry Onyx's own network responses except where a wallet genuinely requires client-side Stripe.js, money truth is the **webhook** (`payment_intent.succeeded`), never the client, a terminal status applies **exactly once** across finalize and webhook, no raw status `UPDATE`, and **no card data ever touches Henry Onyx servers** (SAQ-A scope is non-negotiable).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/14-payments-stripe-activation` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3-13 shipped `@henryco/payment-router` (the `PaymentProviderAdapter` contract, the deterministic router, the A1/A2/A3 money-correctness triad, the committed-not-applied migration). V3-15 (PR #170) shipped `PaystackProvider` — the **worked example** for activating a real provider: implement the interface over an injected `fetch`, return `Result<T, ProviderError>` on the retryable/fatal axis, register via `createPaymentRouter`, and reuse the deduped `apply_payment_webhook` / `advance_payment_intent` write-path split. `country-defaults.ts` already routes `US/GB/EU → [stripe]`; `capability-matrix.ts` already lists `stripe → [card, apple_pay, google_pay]` (A10: wallet methods are first-class, distinct from `card`). So routing lights up the instant a `stripe` adapter registers. What is missing is the adapter and its wallet-specific client surface. Stripe is the only provider serving `apple_pay` / `google_pay`, which require client-side Stripe.js + a publishable key — the one place a provider name legitimately reaches the client, governed below.

## Mandatory scope

### S1 — Install + pin the Stripe Node SDK

Add `stripe` (server SDK) to `packages/payment-router/`, pinned. No client `@stripe/stripe-js` / `@stripe/react-stripe-js` until S4 (the wallet surface) — and there, scoped to the account app, not the router package.

### S2 — `StripeProvider` adapter

`packages/payment-router/src/providers/stripe-provider.ts`, implementing `PaymentProviderAdapter` (`key = "stripe"`). Follow the Paystack template exactly — **all HTTP over the Stripe SDK constructed with an injected secret** so the boundary is unit-testable; the secret key is injected at the `createPaymentRouter` seam, never read deep in the adapter. **G3: the same code is TEST or LIVE purely by which secret is supplied** (`sk_test_…` vs `sk_live_…`) — no `if (test)` branch.

- `initiate` → create a Stripe **PaymentIntent** with the `idempotencyKey` passed as Stripe's `Idempotency-Key` header; `amount = amountMinor` **verbatim** (G5 — Stripe also takes minor units; never ×100), `currency` lower-cased per Stripe. Return `clientAction`:
  - card → hosted **Checkout Session** redirect: `{ type: "redirect", url }` (provider-agnostic to the client, Principle 9).
  - `apple_pay` / `google_pay` → `{ type: "sdk", token: <PaymentIntent client_secret> }` — the wallet surface (S4) needs the client secret to mount the Payment Request Button. This is the **single, deliberate** Principle-9 exception, scoped to wallet methods only.
  - `providerReference` = the Stripe PaymentIntent id (server-side only).
- `refund` → `stripe.refunds.create({ payment_intent })`; queued — the intent becomes `refunded` only on `charge.refunded` (Q3).
- `finalize` → `stripe.paymentIntents.retrieve(id)`; read authoritative status. `providerEventId` = a stable charge identifier (the PaymentIntent id) so finalize and the async `payment_intent.succeeded` webhook share the dedup key (G2).
- `getBalance` → `stripe.balance.retrieve()`, matched on currency (D1/G4).
- `verifyWebhook` → `stripe.webhooks.constructEvent(rawBody, signature, secret)` using the **raw bytes** and the `Stripe-Signature` header. Fail-closed: any failure → a fatal `ProviderError` the route turns into 401. Event → implied status: `payment_intent.succeeded → succeeded`, `payment_intent.payment_failed → failed`, `charge.refunded → refunded` (Q3), `charge.dispute.created → null` (informational; tracked for V3-19 disputes). Dedup key = `stripe_event_id` (the event's `id`).

Failure normalisation: network / 5xx / Stripe `StripeConnectionError` / rate-limit → **retryable**; card declines and 4xx → **fatal** (re-attempting a hard decline at another provider risks a double charge).

### S3 — Webhook handler (no app-route edit needed)

`apps/account/app/api/payments/webhooks/[provider]/route.ts` (shipped V3-13) activates Stripe with **no code change**: it resolves `getAdapter("stripe")` generically, `WEBHOOK_SECRET_ENV["stripe"]` points at `STRIPE_WEBHOOK_SECRET`, HMAC-verifies via the adapter (fail-closed 401), resolves the intent by `provider_reference`, and applies the effect through the deduped `apply_payment_webhook` RPC (A3). Money-truth telemetry fires only on `applied === true`.

### S4 — Apple Pay + Google Pay wallet surface (web)

The wallet path is the one provider-aware client surface, scoped to the account app:
- Mount Stripe.js + the **Payment Request Button** (`@stripe/react-stripe-js`) only on the wallet checkout component, fed the PaymentIntent `client_secret` from S2's `{ type: "sdk" }` action.
- The publishable key `STRIPE_PUBLISHABLE_KEY` is a `NEXT_PUBLIC_*` value — acceptable **only** here because Apple/Google Pay cannot function without client-side Stripe.js. Document this as the explicit, bounded Principle-9 carve-out for wallet methods (card + bank stay hosted-redirect and fully provider-opaque).
- **Apple Pay domain verification:** serve `apps/account/public/.well-known/apple-developer-merchantid-domain-association` per Apple's registration. The verified domain is the account origin resolved via `getAccountUrl()` — never a hardcoded host.

### S5 — Stripe Connect framework (no live payouts)

Scaffold the Connect account framework (account creation shape, capability flags) so V3-69 (payouts) has a seam — but **no live payouts in this pass**. Payouts are V3-69; this pass only proves the Connect account can be created in test mode.

### S6 — Env + activation seam

Extend `createPaymentRouter` to register `StripeProvider` when `STRIPE_SECRET_KEY` is set (mirroring the Paystack seam — live adapters register first and record their key so the mock never shadows them; `MOCK_PAYMENT=1` stays safe alongside). Env vars:
- `STRIPE_SECRET_KEY` (server), `STRIPE_WEBHOOK_SECRET` (server), `STRIPE_PUBLISHABLE_KEY` (public — wallet surface only).
- Per-country secret support if multiple legal entities ever exist (single `Henry Onyx Limited` entity today).

### S7 — Telemetry

Reuse the V3-13 `henry.payment.*` taxonomy (nine events, exhaustive by construction) — do **not** invent a `henry.payment.stripe.*` family (the old prompt's per-provider events would break the exhaustive `Record<PaymentEventName, …>` and leak provider identity into the event name). The provider surfaces only in the server-side audit row.

## Out of scope

- Paystack (V3-15 — shipped), Flutterwave (V3-16). Subscription lifecycle (V3-20). Refund + reconciliation engine + dispute response surface (V3-19). Tax (V3-21). Finance dashboard (V3-22). **Stripe Connect live payouts (V3-69).** Native-app payments (V3-23).
- Applying the migration to production — owner-gated activation step.

## Dependencies

- **Requires:** V3-13 (router + contract + schema); the V3-15 Paystack adapter is the template.
- **Blocks:** V3-19 (refund + dispute reconciliation), V3-69 (Stripe Connect payouts).

## Inheritance

- `@henryco/payment-router` — `PaymentProviderAdapter`, `createPaymentRouter`, `state-machine.ts`, the deduped `apply_payment_webhook` / `advance_payment_intent` split, `telemetry.ts`, the committed migration.
- The `PaystackProvider` worked example + `docs/v3/payment-router-architecture.md` (the activation map — read §8 "Activation seams" first).
- `@henryco/observability/audit-log` + the `henry.payment.*` taxonomy. V3-02 sensitive-action guard on the refund route. `@henryco/config` `getAccountUrl()`.

## Implementation requirements

### Files

`packages/payment-router/src/providers/stripe-provider.ts` + `stripe-provider.test.ts` (new); `createPaymentRouter` seam (`STRIPE_SECRET_KEY`); `index.ts` barrel export; the account wallet checkout component + `@stripe/react-stripe-js` (account app only); `apps/account/public/.well-known/apple-developer-merchantid-domain-association`; the Connect-framework scaffold; `docs/v3/payment-router-architecture.md` updated with **[V3-14]** tags.

### Trust / safety / compliance

L4 (Stripe merchant approval) + L14 (Stripe DPA) signed before live-mode. **PCI DSS SAQ-A**: using Stripe Checkout / Payment Element keeps card data entirely off Henry Onyx servers — never accept, store, or log a PAN. Webhook signature verification via `constructEvent` over raw bytes, fail-closed. Idempotency via Stripe's `Idempotency-Key` + A1 `UNIQUE(user_id, idempotency_key)`. Money is minor units verbatim (G5). No raw status `UPDATE` (D3). Card + bank responses carry no provider identity; the wallet `client_secret` is the bounded carve-out (S4). The Apple Pay domain-association file and any callback resolve via `@henryco/config` — zero hardcoded domains.

### Mobile + desktop parity

Web: full Stripe Payment Element + Payment Request Button (Apple Pay on Safari/iOS web, Google Pay on Chrome/Android web). Expo super-app payments are V3-23, where App Store policy forces **Apple Pay for digital goods, web checkout for physical** — design the wallet surface so the native shell can swap entry points without a router change.

### i18n

All Henry Onyx-rendered payment copy flows through `@henryco/i18n`, namespace **`surface:payments`** — never hardcoded. Pass the user's locale to Stripe Elements via its `locale` prop so the hosted/embedded surface matches the app locale.

### Brand & design system

Receipts/proofs and payment legal text use **"Henry Onyx Limited"** from `@henryco/config` (`company.ts` `legalName`) — and the Stripe merchant/business entity must be the same CAC-registered legal entity. The wallet checkout component is design-token-only (Fraunces + locked `--site-*`/`--accent`), light + dark, mobile + desktop, CLS ≈ 0, and behaviour-locked against the V3-13 money invariants. Stripe Elements appearance is themed to the locked tokens, not ad-hoc hex.

## Validation gates

1. Standard CI: `Lint, typecheck, test, build`.
2. **`stripe-provider.test.ts`** (≈30+ specs): SDK boundary stubbed, retryable/fatal normalisation, minor-units verbatim, `constructEvent` verify/reject, the four event→status maps, finalize↔webhook G2 dedup.
3. **Stripe TEST-mode e2e**: create intent → pay via test card → `payment_intent.succeeded` webhook → status flips `succeeded`.
4. **Wallet TEST-mode e2e**: Payment Request Button renders + completes a test Apple/Google Pay charge.
5. **Refund TEST-mode e2e**: refund → `charge.refunded` → `refund_processing → refunded` (Q3).
6. **Webhook signature rejection**: unsigned/tampered webhook → 401.
7. **Idempotency**: same key returns the same intent (A1) and the same Stripe PaymentIntent (Idempotency-Key).
8. **Apple Pay domain verification**: `curl <getAccountUrl()>/.well-known/apple-developer-merchantid-domain-association` returns the valid file.
9. **D3 grep** for raw status `UPDATE` returns zero.

## Deployment gate

Confirm D1 in `DECISIONS-REQUIRED.md` (Stripe is the second wave — activate only for the committed card-volume market). L4 + L14 signed. TEST-mode soak 48h with synthetic card + wallet + refund traffic. Owner approves the `sk_test_` → `sk_live_` flip (config only, G3 — no code change). Live-mode monitored ramp. **Rollback (A9): any reconciliation delta > 0 or any double-charge → halt + revert.** Migration applied by the owner at activation, never as a merge side effect. Branch `v3/14-payments-stripe-activation` off `origin/main` → PR → only required check `Lint, typecheck, test, build` green → squash-merge.

## Final report contract

`.codex-temp/v3-14-payments-stripe-activation/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + Stripe TEST-mode evidence + Apple Pay domain-verification proof + the Connect-framework status.

## Self-verification

- [ ] `stripe` SDK pinned in `packages/payment-router/`; no client Stripe.js outside the account wallet surface.
- [ ] `StripeProvider` implements the contract over an injected secret; no test/live branch (G3); minor units verbatim (G5).
- [ ] card → hosted redirect (provider-opaque); `apple_pay`/`google_pay` → `{ type: "sdk", client_secret }` — the single bounded Principle-9 carve-out.
- [ ] `verifyWebhook` via `constructEvent` over raw bytes, fail-closed; the four event→status maps correct; dedup on `stripe_event_id`.
- [ ] finalize + async webhook apply terminal status through the same deduped `apply_payment_webhook` (G2); no raw status `UPDATE` (D3).
- [ ] Wallet surface mounts the Payment Request Button; `STRIPE_PUBLISHABLE_KEY` carve-out documented; card/bank stay opaque.
- [ ] Apple Pay domain-association file served at the `getAccountUrl()` origin; no hardcoded host.
- [ ] Connect framework scaffolded; NO live payouts (V3-69).
- [ ] Telemetry reuses the nine `henry.payment.*` events (no `stripe.*` family); provider name server-side only.
- [ ] L4 + L14 verified; TEST-mode e2e (card + wallet + refund) green; live ramp monitored; migration applied at activation only.
- [ ] Report written.
