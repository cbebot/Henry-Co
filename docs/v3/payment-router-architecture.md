# Payment Provider Router — Architecture

**Pass:** V3-13 (Payments: Provider Router)
**Package:** `@henryco/payment-router`
**Status:** Built + proven against a MockProvider only. No live provider until V3-14 (Stripe) / V3-15 (Paystack) / V3-16 (Flutterwave). The test suite is the gate (addendum A6 — no dormant 48h soak; real-money soak lands with the live adapters).

This document is the map a V3-14/15/16 implementer reads before wiring a real provider, and the reference for anyone touching money-correctness in HenryCo.

---

## 1. What this package is (and is not)

It **is** a vendor-agnostic routing core: given a payment's country + method + amount, it deterministically selects an ordered list of candidate providers, attempts a charge against each (with a strict failover policy), and returns a provider-agnostic result. Money-correctness invariants (idempotent create, legal status transitions, webhook dedup) are encoded as executable TypeScript that the production SQL migration mirrors line-for-line.

It is **not** a payment SDK and holds **no** vendor credentials. The only adapter implemented here is `MockProvider`. Real adapters are added in V3-14/15/16 by implementing one interface (`PaymentProviderAdapter`) and registering the instance — no routing, schema, or app-route change required.

---

## 2. Package layout

```
packages/payment-router/src/
  types.ts                       Result<T,E>, branded ISO types, PaymentMethod
                                 (incl. apple_pay/google_pay — A10), PaymentProviderKey,
                                 PaymentIntentStatus, money guards (validateAmountMinor,
                                 normalizeCurrency — A4).
  errors.ts                      ProviderError, NoSuitableProviderError, IllegalTransitionError.
  state-machine.ts               LEGAL_TRANSITIONS, isLegalTransition, assertTransition (A2).
                                 *** Shared source of truth with the SQL trigger. ***
  providers/
    adapter-interface.ts         PaymentProviderAdapter + I/O types (initiate / refund / verifyWebhook).
    mock-provider.ts             MockProvider — HMAC webhook verify; MOCK_PAYMENT_FAILURE injection.
  routing/
    capability-matrix.ts         provider → supported PaymentMethod[] (A10).
    country-defaults.ts          ISO-3166 country → ordered PaymentProviderKey[] preference.
  router.ts                      PaymentRouter (selectProvider, route), createPaymentRouter.
  audit.ts                       buildRouterAuditInput — folds money context into an AuditLogInput.
  telemetry.ts                   payment event → EventOutcome / EventClassification (pure maps).
  reconciliation.ts              A7 contract types only (engine is V3-19).
  testing/
    in-memory-payment-store.ts   Transactional store mirroring the SQL RPC (A1/A3/crash-between-steps).
  index.ts                       Barrel (runtime-safe: omits server-only modules).
  __tests__/*.test.ts            Money-correctness + routing specs (node:test + tsx).
  scripts/mock-payment-webhook.mjs  Runnable mock e2e harness (route → webhook → dedup).
```

Consumed as raw TypeScript source (`exports` → `./src/*.ts`, no build step), the monorepo convention. Tests run on `node:test` + `tsx` via `pnpm --filter @henryco/payment-router test`.

---

## 3. The selection rule

`selectProvider` is a pure intersection of three independent inputs:

```
candidates(country, method) =
    country-defaults[country]                     (ordered preference, e.g. NG → [paystack, flutterwave, stripe])
  ∩ { p : method ∈ capability-matrix[p] }         (A10 — provider must support the method)
  ∩ registered providers                          (only adapters actually wired in this environment)
```

The result preserves **country-default order**, so the highest-preference capable-and-registered provider is tried first. If the intersection is empty, selection returns `NoSuitableProviderError` and the route resolves to the **A5 manual-fallback** path.

Each input is small, declarative, and independently testable: country preference is data, capability is data, registration is environment. Routing logic never hardcodes a provider name.

---

## 4. Failover policy (retryable only)

`PaymentRouter.route` walks the selected candidates in order:

- **Success** → return immediately with the provider-agnostic result.
- **Retryable failure** (`error.retryable === true`) → fire the `onProviderFailover` hook and try the next candidate.
- **Fatal failure** (`error.retryable === false`) → **stop immediately**. Do not fail over.

The fatal/stop rule is deliberate: a fatal error (e.g. malformed request, hard decline) will fail identically at the next provider and re-attempting risks a double charge. Only transient/infrastructure errors are retried. When the candidate list is exhausted, `route` returns `{ ok: false, error: { kind: "provider_error", code } }`; the app route maps that to a generic HTTP 502 — never a provider name (see §6).

`MOCK_PAYMENT_FAILURE=retryable|fatal` injects each branch for the failover specs.

---

## 5. The money-correctness triad (A1 / A2 / A3)

These three invariants are the heart of the pass. Each is implemented **twice** — once as executable TypeScript (the `testing/in-memory-payment-store.ts`, exhaustively unit-tested) and once as production Postgres (the committed migration). The TypeScript reference is the spec; the SQL is the production mirror. They are kept structurally identical on purpose.

### A1 — Idempotent create
A `payment_intents` row carries `UNIQUE(user_id, idempotency_key)`. Creating with a key that already exists raises `23505`; the app route catches it, `SELECT`s the existing row, and returns it unchanged. The same client request retried any number of times yields exactly one intent.

### A2 — Legal status transitions
`LEGAL_TRANSITIONS` (in `state-machine.ts`) is the single allowed-edges table:

```
pending    → processing | cancelled
processing → succeeded  | failed
succeeded  → refunded
failed, cancelled, refunded → (terminal — no outgoing edges)
```

`assertTransition` enforces it in TypeScript. The SQL `BEFORE UPDATE` trigger (`enforce_payment_intent_transition`) has one `if` clause per edge that **mirrors this table exactly** — same edges, same terminals, same same-state no-op. A status change not in the table raises in both layers. When the two ever diverge, the mirrored tests are what catch it.

### A3 — Webhook dedup (insert-first, effect-second)
`processed_webhooks` carries `UNIQUE(provider, provider_event_id)`. The `apply_payment_webhook` RPC, in **one transaction**:
1. **inserts** the dedup row first — a duplicate delivery hits the unique constraint and is reported as an idempotent no-op (`applied: false`);
2. only on a fresh insert does it **apply** the status effect (A2-checked).

Insert-first/effect-second means a duplicate webhook can never re-apply an effect, and a crash between the two steps cannot leave a half-applied event (the transaction rolls back both). The in-memory store models the same ordering, including the crash-between-steps case, so the property is proven without a database.

> **DB-test boundary:** money semantics are proven by the executable TypeScript reference. The SQL migration (`apps/hub/supabase/migrations/20260529120000_payment_intents.sql`) is the **production mirror** — committed, **NOT applied in-session**. The owner applies it when activating the rail.

---

## 6. Principle 9 — the client never sees the provider

ANTI-CLONE Principle 9: a competitor must not be able to learn HenryCo's payment routing by reading network traffic.

- The app route persists `provider_reference` (and, for audit/reconciliation/refunds, `selected_provider`) **server-side only**.
- The client response carries `{ intentId, status, clientAction }` — `clientAction` is opaque and provider-agnostic. It **never** contains a provider name, key, or provider-shaped reference.
- Error responses are generic: A5 → `{ error: "No payment method available for your region", code: "manual_fallback" }` (422); provider failure → generic 502. Neither leaks which providers were tried.

The refund path resolves the owning adapter from the server-side `provider_reference`; provider identity stays on the server end-to-end.

---

## 7. App surface (account API + payment-surface seam)

**Account API routes** (`apps/account/app/api/payments/...`):
- `POST /intents` — R1 sensitive-action gate → A4 amount/currency guards → A1 idempotent create → `route()` → persist `provider_reference` server-side → Principle-9 response.
- `POST /intents/[id]/finalize` — single legal `pending → processing` advance (A2 enforced by the trigger).
- `POST /intents/[id]/refund` — R1 gate → succeeded-only (else 409) → adapter refund → `succeeded → refunded`.
- `POST /webhooks/[provider]` — no session; HMAC verify via the adapter → resolve intent by `provider_reference` → A3 `apply_payment_webhook` RPC. Mock-only in V3-13; real providers return 501 until activated.

**payment-surface `cardCta` seam** (V3-13 deliverable): an optional `cardCta?: { label; href } | null` on `PaymentSurfaceContext`, rendered only while a payment is open. It is the one-call-site change all pay surfaces adopt. The marketplace `/pay/[orderNo]` reference wires it **gated on `MOCK_PAYMENT=1`** so production — where the flag is never set — ships no CTA and therefore no dead link to the not-yet-built card route. The other five divisions (logistics, studio, jobs, property, care) are registered as rollout work in `PASS-REGISTER.md`.

---

## 8. Activation seams — how V3-14/15/16 wire a real provider

The entire live-provider wiring is two edits per provider:

1. **Implement the adapter.** Create `providers/stripe-provider.ts` implementing `PaymentProviderAdapter` (`initiate`, `refund`, `verifyWebhook`). Return `retryable` vs `fatal` errors per the failover contract in §4. Hold credentials via env (`STRIPE_SECRET_KEY` etc. — already inventoried in `INTEGRATION-KEYS.md`).
2. **Register it.** In `createPaymentRouter`, register the real adapter under its key instead of the mock. The capability-matrix and country-defaults entries for that provider already exist, so routing lights up the moment the adapter is registered.

Then in the webhook route, remove the provider from the "not yet activated" (501) guard and point `WEBHOOK_SECRET_ENV[provider]` at the live secret. No change to selection, schema, or the account routes.

`createPaymentRouter()` today: `MOCK_PAYMENT=1` registers `MockProvider` under every real key (`stripe`/`paystack`/`flutterwave`/`mock`) so country∩capability routing behaves exactly as production while the mock executes charges. With the flag unset, **no providers are registered** and every route resolves to A5 manual-fallback — the safe dormant default.

---

## 9. Telemetry + audit + reconciliation

- **Telemetry** (`telemetry.ts`): nine `henry.payment.*` event names map to existing `EventOutcome` / `EventClassification` axes via exhaustive `Record<PaymentEventName, …>` maps. The `Extract<HenryEventName, "henry.payment.${string}">` template type makes it a **compile error** to add a payment event without mapping it — the telemetry layer cannot drift from the taxonomy.
- **Audit** (`audit.ts`): `buildRouterAuditInput` is a pure builder folding money context (including server-side `selected_provider`) into an `AuditLogInput`. It records the provider for reconciliation/refunds — server-side only, never in a client response.
- **Reconciliation** (`reconciliation.ts`): contract **types only** in V3-13 — `ProviderSettlementRecord`, `LedgerRecord`, `ReconciliationDiscrepancy` (`amount_mismatch | status_mismatch | missing_in_ledger | missing_at_provider`), and a `ReconciliationEngine.compare(ledger, provider)` shape. The engine that fills it is **V3-19** (A7).

---

## 10. Invariants a reviewer should re-check on any change here

1. `LEGAL_TRANSITIONS` (TS) and the `enforce_payment_intent_transition` trigger (SQL) still describe the same edge set.
2. The webhook RPC still inserts the dedup row **before** applying the effect, in one transaction.
3. No client response or client-visible error carries a provider name/key/reference (Principle 9).
4. New providers are added by interface + registration only — no `if (provider === "...")` branching in routing.
5. The barrel (`index.ts`) never re-exports a `server-only` module (would throw under `tsx`).
