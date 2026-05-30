# Payment Provider Router — Architecture

**Pass:** V3-13 (Provider Router) · V3-15 (Paystack activation)
**Package:** `@henryco/payment-router`
**Status:** `PaystackProvider` is the **first live adapter** (V3-15) — the routing core, MockProvider rail, and money-correctness invariants are unchanged from V3-13. Stripe (V3-14) and Flutterwave (V3-16) still wire against this same interface. The test suite is the gate; the real-money soak runs against a live Paystack TEST key on the owner side.

This document is the map a V3-14/16 implementer reads before wiring a real provider, and the reference for anyone touching money-correctness in HenryCo. Sections updated for V3-15 are tagged **[V3-15]**.

---

## 1. What this package is (and is not)

It **is** a vendor-agnostic routing core: given a payment's country + method + amount, it deterministically selects an ordered list of candidate providers, attempts a charge against each (with a strict failover policy), and returns a provider-agnostic result. Money-correctness invariants (idempotent create, legal status transitions, webhook dedup) are encoded as executable TypeScript that the production SQL migration mirrors line-for-line.

It is **not** a payment SDK and holds **no** vendor credentials — adapters take secrets by injection (constructor / env-read at the seam), never hardcoded. The implemented adapters are `MockProvider` and, as of **[V3-15]**, the live `PaystackProvider`. Further providers are added in V3-14/16 by implementing one interface (`PaymentProviderAdapter`) and registering the instance — no routing, schema, or app-route change required.

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
                                 Includes the refund_processing edges [V3-15: Q3].
                                 *** Shared source of truth with the SQL trigger. ***
  providers/
    adapter-interface.ts         PaymentProviderAdapter + I/O types: initiate / refund /
                                 verifyWebhook (required) + finalize? / getBalance? (optional, D1).
    mock-provider.ts             MockProvider — HMAC webhook verify; MOCK_PAYMENT_FAILURE injection;
                                 finalize/getBalance for the dormant-rail e2e.
    paystack-provider.ts         [V3-15] Live Paystack adapter (transaction/initialize + /verify,
                                 refund, HMAC-SHA512 webhook, balance) over an injected fetch.
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
pending           → processing | cancelled
processing        → succeeded  | failed
succeeded         → refund_processing                 [V3-15: Q3 — request accepted, money NOT yet moved]
refund_processing → refunded   | succeeded            [V3-15: refunded = provider-confirmed; succeeded = revert]
failed, cancelled, refunded → (terminal — no outgoing edges)
```

`assertTransition` enforces it in TypeScript. The SQL `BEFORE UPDATE` trigger (`enforce_payment_intent_transition`) has one `if` clause per edge that **mirrors this table exactly** — same edges, same terminals, same same-state no-op. A status change not in the table raises in both layers. When the two ever diverge, the mirrored tests are what catch it.

**[V3-15] `refunded` is honest by construction.** `succeeded → refund_processing` only records that a refund was *requested*; the intent becomes `refunded` **only** when Paystack's `refund.processed` webhook confirms the money actually moved. A synchronous provider rejection reverts `refund_processing → succeeded` (the money never left). So `refunded` always means provider-confirmed — never optimistic.

**[V3-15] Write-path split (D3).** Two guarded RPCs are the *only* ways an intent's status changes — never a raw `UPDATE`:
- `advance_payment_intent(id, from, to)` — the three **non-money** edges (`pending→processing`, `succeeded→refund_processing`, `refund_processing→succeeded`). A non-whitelisted edge raises.
- `apply_payment_webhook(...)` — the **money-confirming** edges (`→succeeded`/`→failed`/`→refunded`), always dedup-insert-first (A3). Both finalize and the async webhook funnel through it, so a terminal status applies exactly once (G2).

### A3 — Webhook dedup (insert-first, effect-second)
`processed_webhooks` carries `UNIQUE(provider, provider_event_id)`. The `apply_payment_webhook` RPC, in **one transaction**:
1. **inserts** the dedup row first — a duplicate delivery hits the unique constraint and is reported as an idempotent no-op (`applied: false`);
2. only on a fresh insert does it **apply** the status effect (A2-checked).

Insert-first/effect-second means a duplicate webhook can never re-apply an effect, and a crash between the two steps cannot leave a half-applied event (the transaction rolls back both). The in-memory store models the same ordering, including the crash-between-steps case, so the property is proven without a database.

> **DB-test boundary:** money semantics are proven by the executable TypeScript reference. The SQL migration (`apps/hub/supabase/migrations/20260529120000_payment_intents.sql`) is the **production mirror** — **NOT applied in-session**. The owner applies it when activating the rail. **[V3-15]** extends this same file (it does not add a new migration): the `refund_processing` status + edges, the `advance_payment_intent` RPC, and `apply_payment_webhook` no longer writing `payment_attempts` (attempts are recorded by the route at initiate time — the G4 anchor).

---

## 6. Principle 9 — the client never sees the provider

ANTI-CLONE Principle 9: a competitor must not be able to learn HenryCo's payment routing by reading network traffic.

- The app route persists `provider_reference` (and, for audit/reconciliation/refunds, `selected_provider`) **server-side only**.
- The client response carries `{ intentId, status, clientAction }` — `clientAction` is opaque and provider-agnostic. It **never** contains a provider name, key, or provider-shaped reference.
- Error responses are generic: A5 → `{ error: "No payment method available for your region", code: "manual_fallback" }` (422); provider failure → generic 502. Neither leaks which providers were tried.

The refund path resolves the owning adapter from the server-side `provider_reference`; provider identity stays on the server end-to-end.

---

## 7. App surface (account API + payment-surface seam)

**Account API routes** (`apps/account/app/api/payments/...`) — V3-15 wiring:
- `POST /intents` — R1 sensitive-action gate → A4 amount/currency guards → A1 idempotent create → on a *fresh* insert, record the `payment_attempts` rows (each failover `failed` + the winner `succeeded` with its `provider_reference` — the **Q2/G4 anchor**) → `route()` with the buyer's `customerEmail` and the injected **[V3-15: G7]** `callbackUrl` (from `getAccountUrl("/payments/callback")`, never a hardcoded host) → persist `provider_reference` server-side → Principle-9 response. A replay of an already-moved intent returns current truth with `clientAction: none` (re-initialising a live charge would be a double-charge hazard).
- `POST /intents/[id]/finalize` **[V3-15]** — the Paystack callback return. Resolve the owning provider from the `succeeded` attempt (Q2) → best-effort `advance_payment_intent(pending→processing)` → `adapter.finalize()` reads authoritative charge state (`transaction/verify`) instead of trusting the client → the terminal status is applied through the **same deduped `apply_payment_webhook`** the async webhook uses, so finalize and a later `charge.success` can't double-apply (G2). Still pending at the provider → stays `processing`; the webhook confirms later.
- `POST /intents/[id]/refund` **[V3-15]** — R1 gate → succeeded-only (else 409) → resolve the owning provider (Q2; failover means it may not be the country-default) → `advance_payment_intent(succeeded→refund_processing)` as a **mutex claimed BEFORE the provider call** (exactly one concurrent caller wins; the loser 409s, so two requests can't both refund) → `adapter.refund()`. The intent **stays `refund_processing`** and becomes `refunded` only on the `refund.processed` webhook (Q3). A synchronous provider rejection reverts `refund_processing→succeeded` (money never left).
- `POST /webhooks/[provider]` — no session; per-provider secret env (`WEBHOOK_SECRET_ENV`); HMAC verify via the adapter, **fail-closed 401** on missing/mismatched signature (G1) → resolve intent by `provider_reference` → A3 `apply_payment_webhook` RPC; money-truth telemetry (`intent.succeeded/failed/refunded`) fires **only when the RPC reports `applied === true`** (a deduped redelivery is a silent idempotent ack). A provider not activated in this env → 501. **[V3-15]** Paystack verifies live (secret-key HMAC-SHA512); the mock rail is unchanged.

**payment-surface `cardCta` seam** (V3-13 deliverable): an optional `cardCta?: { label; href } | null` on `PaymentSurfaceContext`, rendered only while a payment is open. It is the one-call-site change all pay surfaces adopt. The marketplace `/pay/[orderNo]` reference wires it **gated on `MOCK_PAYMENT=1`** so production — where the flag is never set — ships no CTA and therefore no dead link to the not-yet-built card route. The other five divisions (logistics, studio, jobs, property, care) are registered as rollout work in `PASS-REGISTER.md`.

> **[V3-15] Deferred by design (per prompt §3 "no account-route change"):** the buyer-facing checkout-entry UI and the `/payments/callback` page are **not** built in this pass — the rails stay dormant with no production entry point. The callback URL is still computed and threaded (G7) so the page slots into the canonical path later with zero router change, and the async webhook is the money-truth backstop regardless of whether a buyer ever lands on that page. The adapter is also **hosted-redirect-only** (`clientAction.redirect` to Paystack's `authorization_url`) rather than the prompt's literal `@paystack/inline-js`, because an inline SDK + `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` would expose provider identity to the client and violate Principle 9.

---

## 8. Activation seams — how V3-14/15/16 wire a real provider

The entire live-provider wiring is two edits per provider — **[V3-15] Paystack is the worked example** (`providers/paystack-provider.ts`):

1. **Implement the adapter.** Implement `PaymentProviderAdapter`: `initiate`, `refund`, `verifyWebhook` (required) plus `finalize?` / `getBalance?` (optional, D1 — Paystack implements both; an adapter whose flow is webhook-only may omit them). Take the secret by injection and do **all** HTTP over an injected `fetch` (so the boundary is stubbable without network — that is how the adapter is unit-tested). Return `retryable` vs `fatal` `ProviderError`s per the failover contract in §4. G3: the **same code** is TEST or LIVE purely by which secret (`sk_test_…` / `sk_live_…`) is supplied — there is no env branch.
2. **Register it.** `createPaymentRouter` reads the env seam and registers the live adapter under its key. Capability-matrix + country-defaults entries already exist, so routing lights up the instant the adapter registers.

The webhook route needs **no edit** to activate: it resolves the adapter generically via `getAdapter(provider)` (absent → 501) and `WEBHOOK_SECRET_ENV[paystack]` already points at `PAYSTACK_SECRET_KEY`. No change to selection, schema, or the account routes.

**[V3-15] `createPaymentRouter(options?)` seam.** The factory now takes an options object `{ hooks?, callbackUrl? }`:
- `PAYSTACK_SECRET_KEY` set → register the live `PaystackProvider`, built with the **injected** `callbackUrl` (G7 — the app passes `getAccountUrl("/payments/callback")`; the package reads **no** `PAYSTACK_CALLBACK_URL` env, which would be a phantom/uninventoried var).
- `MOCK_PAYMENT=1` → `MockProvider` backfills every real key **not already served by a live adapter**. Because live adapters register first and record their key in `served`, the mock can never shadow live Paystack — so `MOCK_PAYMENT=1` is safe to leave on alongside a real key (the mock just fills `stripe`/`flutterwave`/`mock`).
- neither → **no providers registered**; every route resolves to A5 manual-fallback — the safe dormant default.

---

## 9. Telemetry + audit + reconciliation

- **Telemetry** (`telemetry.ts`): nine `henry.payment.*` event names map to existing `EventOutcome` / `EventClassification` axes via exhaustive `Record<PaymentEventName, …>` maps. The `Extract<HenryEventName, "henry.payment.${string}">` template type makes it a **compile error** to add a payment event without mapping it — the telemetry layer cannot drift from the taxonomy.
- **Audit** (`audit.ts`): `buildRouterAuditInput` is a pure builder folding money context (including server-side `selected_provider`) into an `AuditLogInput`. It records the provider for reconciliation/refunds — server-side only, never in a client response.
- **Reconciliation** (`reconciliation.ts`): contract **types only** in V3-13 — `ProviderSettlementRecord`, `LedgerRecord`, `ReconciliationDiscrepancy` (`amount_mismatch | status_mismatch | missing_in_ledger | missing_at_provider`), and a `ReconciliationEngine.compare(ledger, provider)` shape. The engine that fills it is **V3-19** (A7).

---

## 10. Invariants a reviewer should re-check on any change here

1. `LEGAL_TRANSITIONS` (TS) and the `enforce_payment_intent_transition` trigger (SQL) still describe the same edge set — including the `refund_processing` edges.
2. The webhook RPC still inserts the dedup row **before** applying the effect, in one transaction.
3. **[V3-15] D3 — no raw status `UPDATE` anywhere.** Every `payment_intents` status change goes through `advance_payment_intent` (the 3 non-money edges) or `apply_payment_webhook` (money-confirming, deduped). A repo grep for direct `.update({ status })` / `set status =` outside the migration must return **zero**.
4. **[V3-15] G2** — `finalize` and the async webhook apply the terminal status through the *same* `apply_payment_webhook` keyed on the *same* reference, so a charge can confirm exactly once across both paths. Money-truth telemetry fires only on `applied === true`.
5. No client response or client-visible error carries a provider name/key/reference (Principle 9). The winning provider surfaces only via the server-side `onProviderSucceeded` hook.
6. New providers are added by interface + registration only — no `if (provider === "...")` branching in routing.
7. The barrel (`index.ts`) never re-exports a `server-only` module (would throw under `tsx`).
