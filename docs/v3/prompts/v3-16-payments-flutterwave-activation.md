# V3-16 — Money & Identity Spine: Flutterwave Activation

**Pass ID:** V3-16  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Wallet, Payments, Financial Spine)
**Dependencies:** V3-13 (payment provider router — SHIPPED PR #169)  ·  **Effort:** L  ·  **Parallel-safe:** Y (with V3-14, V3-15)
**Owner gate:** D1 (payment provider activation per country — **decision recorded in `docs/v3/DECISIONS-REQUIRED.md`; confirm, don't re-litigate**)  ·  **Risk class:** Money

---

## Role

You are the V3 Payments engineer for Henry Onyx (Flutterwave). You execute exactly this one pass, then stop and report. This pass wires Flutterwave as a live provider behind the V3-13 router by implementing one adapter — `FlutterwaveProvider` — against the `PaymentProviderAdapter` contract and registering it. Per D1 (Option A), Flutterwave is the **first-wave Naira-native secondary** that pairs with Paystack for redundancy, and Henry Onyx's **mobile-money + multi-currency** rail across African markets (the second-preference in NG/GH, the first-preference in KE per `country-defaults.ts`). The line it must not cross: the provider is invisible to the client (hosted-redirect, never an inline SDK that leaks identity), money truth is the **webhook**, never the client redirect, a terminal status applies **exactly once** across finalize and webhook, no raw status `UPDATE`, and every minor-unit amount is currency-correct (Flutterwave settles in many currencies — zero-decimal currencies like XOF/XAF must not be ×100).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/16-payments-flutterwave-activation` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3-13 shipped `@henryco/payment-router` (the `PaymentProviderAdapter` contract, the deterministic router, the A1/A2/A3 money-correctness triad, the committed-not-applied migration). V3-15 (PR #170) shipped `PaystackProvider` — the **worked example**: implement the interface over an injected `fetch`, return `Result<T, ProviderError>` on the retryable/fatal axis, register via `createPaymentRouter`, reuse the deduped `apply_payment_webhook` / `advance_payment_intent` split, and verify webhooks fail-closed. `country-defaults.ts` already routes `NG → [paystack, flutterwave]`, `GH → [paystack, flutterwave]`, `KE → [flutterwave, paystack]`; `capability-matrix.ts` already lists `flutterwave → [card, bank_transfer, mobile_money, ussd]` (A10) — Flutterwave is the only provider serving `mobile_money` (M-Pesa, MTN, Vodafone). So routing lights up the instant a `flutterwave` adapter registers, and the NG/GH failover from Paystack to Flutterwave on a retryable error works the moment both register. What is missing is the adapter and its mobile-money + multi-currency wiring.

## Mandatory scope

### S1 — Install + pin the Flutterwave SDK

Add `flutterwave-node-v3` (server SDK) to `packages/payment-router/`, pinned — or call the v3 REST API over an injected `fetch` if the SDK's surface is heavier than the adapter needs (match the Paystack adapter's injected-`fetch` testability). No client-side inline SDK (see S2 + Principle 9).

### S2 — `FlutterwaveProvider` adapter

`packages/payment-router/src/providers/flutterwave-provider.ts`, implementing `PaymentProviderAdapter` (`key = "flutterwave"`). Follow the Paystack template: all HTTP over an injected boundary, secret injected at the `createPaymentRouter` seam. **G3: the same code is TEST or LIVE purely by which keys are supplied** (Flutterwave's `FLWSECK_TEST-…` vs live `FLWSECK-…`) — no `if (test)` branch.

- `initiate` → Flutterwave **Standard** hosted checkout (`/payments`); returns the hosted payment link → `clientAction: { type: "redirect", url }` (Principle 9 — hosted, provider-opaque). `amount` must be in **major units per Flutterwave's API** computed from `amountMinor` using the currency's minor-unit exponent (`getCurrencyMinorUnit` from `@henryco/i18n/currency`) — **do not assume ×100**; XOF/XAF are zero-decimal. `tx_ref = intentId` (stable per intent → idempotent retries + the G2 dedup anchor). Bias the `payment_options` to the chosen method (card / banktransfer / ussd / mobilemoney*).
- `refund` → the refunds endpoint against the transaction id; queued — the intent becomes `refunded` only on the refund webhook (Q3).
- `finalize` → verify-transaction (`/transactions/{id}/verify` or verify-by-reference); read authoritative status. `providerEventId` derives from the transaction reference so finalize and the async success webhook share the dedup key (G2). Flutterwave verify must **assert `amount` + `currency` match the intent** before trusting `successful` (a known Flutterwave verification footgun) — a mismatch is a fatal error, never a success.
- `getBalance` → the balances endpoint, matched on the requested currency (D1/G4).
- `verifyWebhook` → compare the **`verif-hash` header** to `FLW_SECRET_HASH` (constant-time). Fail-closed: missing/mismatched → fatal `ProviderError` the route turns into 401. Then re-verify the transaction server-side via `finalize` before applying a terminal status (Flutterwave webhooks are notification-only; the verify call is the money truth). Event → implied status: `charge.completed` (+ verify `successful`/`status==succeeded` and amount/currency match) → `succeeded`; verify failed → `failed`; refund webhook confirmed → `refunded` (Q3). Dedup key = the transaction id / `flw_ref`.

Failure normalisation: network / 5xx / 429 → **retryable** (the NG/GH router fails over to/from Paystack); 4xx and definitive declines → **fatal**.

### S3 — Webhook handler (no app-route edit needed)

`apps/account/app/api/payments/webhooks/[provider]/route.ts` (shipped V3-13) activates Flutterwave with **no code change**: it resolves `getAdapter("flutterwave")`, `WEBHOOK_SECRET_ENV["flutterwave"]` points at `FLW_SECRET_HASH`, verifies via the adapter (fail-closed 401), resolves the intent by `provider_reference`, applies the effect through the deduped `apply_payment_webhook` RPC (A3). Money-truth telemetry fires only on `applied === true`.

### S4 — Multi-currency + mobile-money correctness

- **Multi-currency:** Flutterwave settles NGN, USD, GBP, EUR, GHS, KES, UGX, ZAR, XAF, XOF natively. Every amount conversion goes through `normalizeCurrency` (A4 — reject unsupported codes) + `getCurrencyMinorUnit` (exponent), so minor→major is exponent-correct per currency. Add only currencies that are both Flutterwave-supported **and** `isSupportedCurrency` in `@henryco/i18n/currency`.
- **Mobile money:** Flutterwave is the sole `mobile_money` provider in `capability-matrix.ts`. The hosted checkout handles the M-Pesa / MTN / Vodafone collection flow; Henry Onyx renders no rail-specific UI in this pass beyond method selection (any mobile-money entry surface is a registered follow-up like the USSD surface).

### S5 — Env + activation seam

Extend `createPaymentRouter` to register `FlutterwaveProvider` when `FLW_SECRET_KEY` is set (mirroring the Paystack seam — live adapters register first so the mock never shadows them). Env vars: `FLW_SECRET_KEY` (server), `FLW_SECRET_HASH` (server — webhook verify). **No `NEXT_PUBLIC_*` Flutterwave key** — a public key + inline SDK would leak provider identity (Principle 9); hosted-redirect avoids it.

### S6 — Telemetry

Reuse the V3-13 `henry.payment.*` taxonomy (nine events, exhaustive by construction) — do **not** invent a `henry.payment.flutterwave.*` family (it would break the exhaustive `Record<PaymentEventName, …>` and leak provider identity into the event name). The provider surfaces only in the server-side audit row.

## Out of scope

- Stripe (V3-14), Paystack (V3-15 — shipped). Subscription lifecycle (V3-20). Refund + reconciliation engine (V3-19). Tax (V3-21). Finance dashboard (V3-22). Payouts (V3-69). Native-app payments (V3-23).
- Applying the migration to production — owner-gated activation step.
- A mobile-money / USSD entry surface beyond method selection — registered as rollout work alongside the V3-15 deferred checkout UI.

## Dependencies

- **Requires:** V3-13 (router + contract + schema); the V3-15 Paystack adapter is the template.
- **Blocks:** V3-19 (refund + reconciliation across providers), V3-69 (Flutterwave payouts). Completes the NG/GH Paystack↔Flutterwave failover pair.

## Inheritance

- `@henryco/payment-router` — `PaymentProviderAdapter`, `createPaymentRouter`, `state-machine.ts`, the deduped `apply_payment_webhook` / `advance_payment_intent` split, `telemetry.ts`, the committed migration.
- `@henryco/i18n/currency` — `isSupportedCurrency`, `getCurrencyMinorUnit`, `normalizeCurrency` (A4 multi-currency correctness).
- The `PaystackProvider` worked example + `docs/v3/payment-router-architecture.md` §8 (activation seams).
- `@henryco/observability/audit-log` + the `henry.payment.*` taxonomy. V3-02 sensitive-action guard on the refund route. `@henryco/config` `getAccountUrl()`.

## Implementation requirements

### Files

`packages/payment-router/src/providers/flutterwave-provider.ts` + `flutterwave-provider.test.ts` (new); `createPaymentRouter` seam (`FLW_SECRET_KEY`); `index.ts` barrel export; `docs/v3/payment-router-architecture.md` updated with **[V3-16]** tags. Multi-currency entries in `capability-matrix.ts` / `country-defaults.ts` only if a new market is committed (defaults already cover NG/GH/KE).

### Trust / safety / compliance

L4 (Flutterwave merchant approval) + L14 (DPA) signed before live-mode. Webhook `verif-hash` compared constant-time, fail-closed 401 (G1), then **server-side re-verify** before any terminal status (Flutterwave's webhook is notification-only). The verify step asserts amount + currency match the intent — never trust `successful` alone. Idempotency via `tx_ref = intentId` + A1 `UNIQUE(user_id, idempotency_key)`. Minor→major conversion is exponent-correct per currency (no blanket ×100). No raw status `UPDATE` (D3). No client response carries a provider identity (Principle 9). The callback resolves via `getAccountUrl()` — zero hardcoded domains.

### Mobile + desktop parity

Web uses the hosted Flutterwave checkout + the `/payments/callback` return (the page is the V3-15-registered deferred follow-up). Expo super-app payments are V3-23. The adapter is transport-agnostic, so the same route serves both once the native shell lands.

### i18n

All Henry Onyx-rendered payment copy flows through `@henryco/i18n`, namespace **`surface:payments`** — method labels (incl. mobile-money), status, errors. Currency display uses `@henryco/i18n/currency` formatting (locale + currency aware), never a hardcoded symbol. The hosted checkout carries no Henry Onyx-authored copy.

### Brand & design system

Receipts/proofs and payment legal text use **"Henry Onyx Limited"** from `@henryco/config` (`company.ts` `legalName`) — the Flutterwave merchant entity must be the same CAC-registered legal entity. Any rendered payment UI is design-token-only (Fraunces + locked `--site-*`/`--accent`), light + dark, mobile + desktop, CLS ≈ 0, and behaviour-locked against the V3-13 money invariants.

## Validation gates

1. Standard CI: `Lint, typecheck, test, build`.
2. **`flutterwave-provider.test.ts`** (≈30+ specs): injected boundary stubbed, retryable/fatal normalisation, **multi-currency minor→major exponent correctness** (NGN ×100, XOF ×1, USD ×100), `verif-hash` verify/reject, the amount/currency-match assertion in verify, finalize↔webhook G2 dedup.
3. **Flutterwave TEST-mode e2e**: card + bank + mobile-money each → success webhook → server re-verify → status flips `succeeded`.
4. **Refund TEST-mode e2e**: refund → refund webhook → `refund_processing → refunded` (Q3).
5. **Webhook `verif-hash` rejection**: tampered/missing hash → 401.
6. **Multi-currency smoke**: NGN + KES + USD intents each clear with correct minor-unit math.
7. **NG failover smoke**: a retryable Paystack error in NG fails over to Flutterwave (router + both adapters registered).
8. **D3 grep** for raw status `UPDATE` returns zero.

## Deployment gate

Confirm D1 in `DECISIONS-REQUIRED.md` (Flutterwave is first-wave with Paystack — Nigeria-first). L4 + L14 signed. TEST-mode soak 48h with synthetic card + bank + mobile-money + refund + multi-currency traffic. Owner approves the test→live key flip (config only, G3 — no code change). Live-mode monitored ramp. **Rollback (A9): any reconciliation delta > 0 or any double-charge → halt + revert.** Migration applied by the owner at activation, never as a merge side effect. Branch `v3/16-payments-flutterwave-activation` off `origin/main` → PR → only required check `Lint, typecheck, test, build` green → squash-merge.

## Final report contract

`.codex-temp/v3-16-payments-flutterwave-activation/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + Flutterwave TEST-mode evidence (card + bank + mobile-money) + the multi-currency minor-unit proof table + the NG failover smoke.

## Self-verification

- [ ] `flutterwave-node-v3` (or injected-`fetch` REST) pinned; no client-side inline SDK.
- [ ] `FlutterwaveProvider` implements the contract over an injected boundary; no test/live branch (G3).
- [ ] `initiate` returns a hosted redirect; amount converts minor→major **per-currency exponent** (no blanket ×100); `tx_ref = intentId`.
- [ ] `finalize` server-verifies and asserts amount + currency match before trusting success; `verifyWebhook` `verif-hash` constant-time, fail-closed, then re-verify.
- [ ] finalize + async webhook apply terminal status through the same deduped `apply_payment_webhook` (G2); no raw status `UPDATE` (D3).
- [ ] `mobile_money` routes only to Flutterwave (A10); multi-currency limited to Flutterwave ∩ `isSupportedCurrency`.
- [ ] `createPaymentRouter` registers on `FLW_SECRET_KEY`; `FLW_SECRET_HASH` webhook verify; no `NEXT_PUBLIC_*` key.
- [ ] Telemetry reuses the nine `henry.payment.*` events (no `flutterwave.*` family); provider name server-side only.
- [ ] L4 + L14 verified; TEST-mode e2e (card + bank + mobile-money + multi-currency + refund) green; NG failover proven; live ramp monitored.
- [ ] Report written.
