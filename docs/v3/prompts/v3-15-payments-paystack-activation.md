# V3-15 — Payments: Paystack Activation

**Pass ID:** V3-15 | **Phase:** C | **Pillar:** P2
**Deps:** V3-13 | **Effort:** L | **Parallel:** YES (with V3-14, V3-16) | **Owner gate:** Decision D1 | **Risk:** Money

> **Traceability tags used below:** **D1–D3** = the three contract drift-fixes (interface, unified route, RPC-only status). **G1–G8** = money-pass gaps. **Decision D1** = the product decision that Paystack is the primary Naira-native provider (distinct from drift-fix D1).

## Role
V3 Payments engineer (Paystack). Activate Paystack as the **first live provider** behind the V3-13 router. Execute, then stop.

## Project
Standard project block (see V3-14).

## Read first (non-negotiable — V3-13 already built the seam you plug into)
- `docs/v3/payment-router-architecture.md` — the map. §4 failover (retryable-only), §5 money triad (A1/A2/A3), §6 Principle 9, §8 the activation seam this pass executes.
- `packages/payment-router/src/providers/adapter-interface.ts` — the live contract. **As of V3-13 it has exactly three methods** (`initiate`, `refund`, `verifyWebhook`) plus `readonly key`, each returning `Promise<Result<T, ProviderError>>`. You will **extend** it (scope 1) — do not assume the five-method shape exists yet.
- `apps/account/app/api/payments/webhooks/[provider]/route.ts` — the **unified** webhook route you activate. Note the `provider !== "mock"` 501 guard and the hardcoded `new MockProvider()`; both change (scope 3).
- `apps/hub/supabase/migrations/20260529120000_payment_intents.sql` — A1 `unique(user_id, idempotency_key)`, A2 transition trigger, A3 `apply_payment_webhook` RPC. **The RPC is the ONLY way `status` changes (D3).**
- `docs/v3/INTEGRATION-KEYS.md` (line 47 + the per-env scope table) — canonical Paystack env var names and TEST/LIVE scoping.

## Audit summary
Paystack not integrated. Primary Naira-native provider per **Decision D1**. Supports cards, bank transfers, USSD, mobile money (some markets), QR. V3-13 shipped the router + MockProvider + the dormant unified webhook route; V3-15 lights up the first real provider behind that exact seam — **no routing redesign, no schema change, no account-route rewrite.**

## Mandatory scope

### 1. Extend the adapter interface (D1)
Owner gate D1 names five adapter methods — `initiate`, `finalize`, `refund`, `verifyWebhook`, `getBalance`. The live interface today has only `initiate` / `refund` / `verifyWebhook` (+ `key`). **Add the two missing methods as OPTIONAL members** of `PaymentProviderAdapter` in `adapter-interface.ts`:

- `finalize?` — Paystack `transaction/verify` by reference; the server-authoritative confirmation used on checkout-callback return.
- `getBalance?` — Paystack balance read; the V3-19 reconciliation data source (G4).

They are **optional** (`finalize?`, `getBalance?`) on purpose: `MockProvider` and the **parallel** V3-14/V3-16 adapters must keep compiling, and the dormant `createPaymentRouter` default (zero providers) must stay valid. Callers feature-detect (`if (adapter.finalize) …`). Recommended signatures — follow the file's existing `Result`/`ProviderError` idiom and import `ISO4217` from `../types` as the file already does:

```typescript
export interface FinalizeParams {
  providerReference: string;
}
export interface FinalizeResult {
  /** The SAME dedup key a webhook for this charge carries, so verify and webhook
   *  can never double-apply (G2 / A3). For Paystack, derive from the transaction `reference`. */
  providerEventId: string;
  impliedStatus: "succeeded" | "failed" | "refunded" | null;
  /** Confirmed charged amount in minor units — MUST equal the intent's amountMinor (G5). */
  amountMinor: number;
  currency: ISO4217;
}
export interface BalanceParams {
  currency: ISO4217;
}
export interface BalanceResult {
  currency: ISO4217;
  availableMinor: number;
  /** ISO-8601 instant the balance was read — a V3-19 reconciliation data point (G4). */
  asOf: string;
}

// added to PaymentProviderAdapter, BOTH optional:
finalize?(params: FinalizeParams): Promise<Result<FinalizeResult, ProviderError>>;
getBalance?(params: BalanceParams): Promise<Result<BalanceResult, ProviderError>>;
```

Mirror these in `MockProvider` (keep the e2e harness + reconciliation-data path exercised) and in the in-memory store where it helps prove the property.

### 2. Implement `PaystackAdapter` (D1)
`packages/payment-router/src/providers/paystack-adapter.ts` implementing the FULL (now five-method) interface. Server calls go to `https://api.paystack.co` over HTTPS with `Authorization: Bearer ${PAYSTACK_SECRET_KEY}`; the client uses `@paystack/inline-js`. Every method returns `Promise<Result<T, ProviderError>>` — **never throw** for expected provider-side failures; classify errors `retryable` vs `fatal` per the §4 failover contract.

- `initiate` → `transaction/initialize`. Return `providerReference` (Paystack `reference`) + `clientAction = { type: "redirect"; url: authorization_url }` (hosted checkout) — opaque and provider-agnostic (Principle 9). Send `amount` in **kobo == amountMinor exactly** (G5).
- `finalize` → `transaction/verify/{reference}`. Return a normalized `FinalizeResult` (impliedStatus + verified amount/currency). **Do NOT mutate `payment_intents` (D3).**
- `refund` → `refund` endpoint; return `refundReference`.
- `verifyWebhook` → HMAC-SHA512 of the RAW body with `PAYSTACK_SECRET_KEY` (G1); parse the event into a normalized `VerifiedWebhook`.
- `getBalance` → `balance` endpoint → `BalanceResult` (G4).
- Capability-matrix entries: card, bank, USSD, mobile_money (per-country). **Build card + bank first, USSD second (G8).**

### 3. Register it — activation is a seam, not a rebuild (D2)
Activate Paystack with exactly these edits. **Do NOT create `apps/account/app/api/payments/webhooks/paystack/route.ts`** — the unified `[provider]` route is the one route every provider shares.
1. Register `new PaystackAdapter()` under the `paystack` key in `createPaymentRouter` (replacing the mock registration for that key when live keys are present; today `MOCK_PAYMENT=1` registers the mock under every real key).
2. In the unified webhook route `apps/account/app/api/payments/webhooks/[provider]/route.ts`: **remove `paystack` from the `provider !== "mock"` 501 guard**, and **replace the hardcoded `new MockProvider()` with a registry lookup that resolves the adapter by the `provider` path param**. `WEBHOOK_SECRET_ENV.paystack` already points at `PAYSTACK_SECRET_KEY`; the route already reads the `x-paystack-signature` header and already calls `await request.text()` before parsing.

That is the whole live-wiring surface — no selection, schema, or account-route change.

### 4. Status changes go ONLY through the RPC (D3)
**NEVER** `UPDATE payment_intents.status` directly — not from the adapter, not from the webhook route, not from the finalize/callback path. Every status change flows through the `apply_payment_webhook` RPC, which **dedup-inserts first, then applies the A2-guarded transition, atomically**. The adapter **PARSES** the Paystack event/verify response into a normalized result; the route hands `{ provider, providerEventId, intentId, newStatus }` to the RPC. A direct UPDATE bypasses A3 dedup and the A2 trigger — a **double-credit hazard**. Closure grep for any direct `payment_intents` status UPDATE outside the migration MUST be zero.

### 5. Webhook HMAC, fail-closed (G1 — MUST-FIX)
Paystack signs **HMAC-SHA512 of the RAW request body** with `PAYSTACK_SECRET_KEY`, in the `x-paystack-signature` header. Verify against the **raw bytes** — read the body as text/buffer BEFORE any JSON parse (re-serialization breaks the HMAC; the route already does `await request.text()` first — keep it that way). Invalid **or** missing signature → fail-closed: emit `henry.payment.webhook.rejected` and return **401** (the route currently returns 400 on a bad signature — change it to 401 per this gap). Test a known-good signature (accept) and a tampered body (reject).

### 6. Stable event-ID for dedup (G2 — MUST-FIX)
A3 keys dedup on `(provider, provider_event_id)`. Paystack identifies events via `data.id` and `reference`; **confirm which is stable across redeliveries** (Paystack retries until it receives a 2xx). Use the stable identifier as `providerEventId`, and produce the **same key whether the status arrives via webhook OR via `finalize`/verify**, so the two paths can never double-apply. The transaction `reference` is shared by both the webhook payload (`data.reference`) and the verify response and is the recommended dedup key. Test: deliver the same event **3×** → effect applied exactly once, two idempotent acks.

### 7. Amount round-trip (G5 — MUST-FIX)
Paystack transacts in **kobo for NGN (exponent 2)**. The `amount` sent to `transaction/initialize` == `amount_minor` **exactly**; the amount confirmed by verify/webhook == the amount charged. Test: ₦1,500 == `150000` kobo round-trips exactly, no float drift.

### 8. Reconciliation data population (G4 — MUST-FIX)
V3-13 defined the reconciliation contract **types** but populated nothing. V3-15 is the first real provider, so it must **emit data points**: `getBalance()` returns the Paystack available balance, and on each settled charge record enough (`provider`, `providerReference`, `amountMinor`, `currency`, settled-at) for the V3-19 engine to compare ledger vs provider. Wire this through the existing `buildRouterAuditInput`/audit path — **server-side only, never in a client response.**

### 9. Env + sandbox-first (G3 — MUST-FIX)
Env vars (canonical names, INTEGRATION-KEYS.md line 47):
- `PAYSTACK_SECRET_KEY` (server)
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (client)

Build and test entirely against Paystack **TEST** keys. TEST→LIVE must be a **pure env change** — Preview env carries TEST keys, Production carries LIVE keys (per the INTEGRATION-KEYS per-env table). **No `if (test) … else …` branching in code.** A grep for test/live conditionals in the adapter must be zero.

### 10. Domain masking — deferred, config-driven (G7 — note)
The checkout redirect ideally goes through `pay.<henry-domain>/<token>`, but `<henry-domain>` is mid-migration (henrycogroup.com → henry.holdings, tracked as **V3-DOMAIN-01**). Use a config-driven `henryDomain()` helper — **never a hardcoded host**. If the masking proxy is not live, redirect to Paystack's hosted `authorization_url` directly. **Do not block V3-15 on masking.**

### 11. USSD — secondary (G8 — scope note)
Build card + bank-transfer correctness first. Add the USSD surface ("Pay via USSD" with country-correct codes — Nigeria: bank-issued `*XXX#`) only after the core charge/verify/webhook/refund path is proven. Don't let USSD polish delay money correctness.

### 12. Telemetry
Use the existing V3-13 `henry.payment.*` family (architecture §9) — the exhaustive `Record<PaymentEventName, …>` map makes adding an event a **compile error** until it's mapped, so extend the taxonomy when you add names. `henry.payment.webhook.rejected` (G1) already belongs to this family. **Do NOT invent a provider-named `henry.payment.paystack.*` family.**

## Out of scope
- Stripe (V3-14), Flutterwave (V3-16). Subscriptions, tax, payouts (V3-69) handled separately.
- Applying the V3-13 migration — it lands at activation; coordinate with the owner (the SQL is committed, not yet applied).

## Dependencies
V3-13 (router + unified webhook route + migration). Blocks: V3-19 (reconciliation engine), V3-69 (Paystack payouts).

## Inheritance
Router selection (country ∩ capability ∩ registered); `payment_intents` schema + A1/A2/A3; Principle 9 response shape; observability.

## Trust / safety / compliance
- L4 Paystack merchant approval signed; DPA per L14.
- Webhook HMAC mandatory, fail-closed (G1).
- ANTI-CLONE Principles 1, 6, 9, 12 — the client never learns the provider (Principle 9): no provider name/key/reference in any client response or client-visible error.

## Mobile + desktop parity
Web: full Paystack inline + hosted redirect. Expo: deferred to V3-23.

## i18n
Paystack hosted-checkout carries its own locale labels; all HenryCo-controlled inline copy goes through `@henryco/i18n` (no hardcoded strings — the strict scan gate applies).

## Validation gates (test-mode closes the build)
1. Standard CI (lint, typecheck, test, build).
2. Paystack TEST-mode e2e — card + bank (USSD after).
3. Refund TEST-mode e2e.
4. Webhook HMAC: known-good accepted, tampered rejected with **401 + `henry.payment.webhook.rejected`** (G1).
5. Event dedup: same event **3×** → applied once (G2).
6. Amount round-trip: ₦1,500 == `150000` kobo exact (G5).
7. Reconciliation data emitted: `getBalance()` returns a balance; a settled charge records a comparable data point (G4).
8. Status-path grep: **zero** direct `payment_intents` status UPDATEs outside the migration (D3).
9. Env-only flip: TEST→LIVE proven by env swap, **zero** code change (G3).

## Deployment gate (live)
- **LIVE 48h soak with A9 halt (G6):** any reconciliation delta ≠ 0 → **HALT**; any double-charge/double-credit → **HALT + revert**; failure rate > 2× the test-mode baseline → **investigate** before ramping.
- Monitored ramp after a clean soak.
- (Test-mode closes on e2e evidence; the 48h soak applies to **LIVE only**.)

## Closure bar (must all hold)
- HMAC verify: pass + reject (G1).
- Event dedup 3× → once (G2).
- Amount round-trip exact (G5).
- Reconciliation data emitted (G4).
- Refund e2e green.
- Status changes ONLY via `apply_payment_webhook` RPC — grep for direct `payment_intents` status UPDATE outside the migration is **zero** (D3).
- TEST→LIVE proven env-only (G3).
- Test evidence in sandbox; 48h soak in live (G6).

## Final report contract
Standard report + the closure-bar checklist above, each item with evidence (test output, grep results, env-diff proof).

## Self-verification
- [ ] Interface extended with optional `finalize?` + `getBalance?`; mock + parallel adapters still compile (D1).
- [ ] PaystackAdapter implements all five methods, Result-based, retryable/fatal classified (D1).
- [ ] Activation = adapter + register + webhook-guard flip; NO new route (D2).
- [ ] Zero direct `payment_intents` status UPDATEs; all status via the RPC (D3).
- [ ] Webhook HMAC-SHA512 raw-body, fail-closed 401 + `henry.payment.webhook.rejected` (G1).
- [ ] Dedup stable across redeliveries AND webhook-vs-verify; 3× → once (G2).
- [ ] Amount round-trip exact in kobo (G5).
- [ ] Reconciliation data emitted via `getBalance` + per-charge record (G4).
- [ ] TEST→LIVE env-only, no code branching (G3).
- [ ] Domain masking config-driven, not blocking (G7).
- [ ] Card + bank first, USSD second (G8).
- [ ] L4 + L14 verified.
- [ ] LIVE 48h soak + A9 halt rules honored (G6).
- [ ] Report written.
