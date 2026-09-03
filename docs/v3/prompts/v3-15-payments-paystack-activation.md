# V3-15 — Money & Identity Spine: Paystack Activation

> **STATUS: SHIPPED (code-only) — PR #170** (squash `bd6b45da`, branch `v3/15-payments-paystack-activation`, merged 2026-05-30). `PaystackProvider` is the **first live adapter** behind the V3-13 router. The merge is **code-only**: production has no `PAYSTACK_SECRET_KEY`, so the rail stays dormant (A5 manual fallback) and the migration stays committed-not-applied. 96/96 package tests green. The owner defined **two finish lines past the merge** (see Deployment gate). This document is the elevated canonical spec and the worked example every other provider pass (V3-14 Stripe, V3-16 Flutterwave) follows. Residual buyer-facing UI is listed under **Residual / hardening follow-ups**.

**Pass ID:** V3-15  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Wallet, Payments, Financial Spine)
**Dependencies:** V3-13 (payment provider router — SHIPPED PR #169)  ·  **Effort:** L  ·  **Parallel-safe:** Y (with V3-14, V3-16)
**Owner gate:** D1 (payment provider activation per country — **decision recorded in `docs/v3/DECISIONS-REQUIRED.md`; confirm, don't re-litigate**)  ·  **Risk class:** Money

---

## Role

You are the V3 Payments engineer for Henry Onyx (Paystack). You execute exactly this one pass, then stop and report. This pass wires Henry Onyx's **first live payment provider** by implementing one adapter — `PaystackProvider` — against the V3-13 `PaymentProviderAdapter` contract and registering it. Paystack is the Naira-native primary per D1: cards, bank transfer, and USSD. The line it must not cross: the provider is **invisible to the client** (hosted-redirect, never an inline SDK that leaks provider identity), money truth is the **webhook**, never the client redirect, and a terminal status applies **exactly once** across the finalize and webhook paths. No raw status `UPDATE` anywhere; no production secret committed; the migration is applied by the owner at activation, not by this pass.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/15-payments-paystack-activation` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3-13 shipped `@henryco/payment-router`: the `PaymentProviderAdapter` contract, the deterministic router (country-default ∩ capability-matrix ∩ registered, in failover order), the money-correctness triad (A1 idempotent create, A2 legal transitions, A3 webhook dedup), and the `MockProvider` rail. `country-defaults.ts` already lists `NG → [paystack, flutterwave]`; `capability-matrix.ts` already lists `paystack → [card, bank_transfer, ussd]`. So routing lights up the instant a `paystack` adapter registers — no routing, schema, or app-route change required. What is missing is the adapter itself and the live finalize/webhook wiring. D1 (Option A) is answered: Nigeria-first, Paystack + Flutterwave together; Stripe is the second wave. This pass delivers the Paystack adapter and is the worked example V3-14/16 transcribe — proving that a real provider is genuinely two edits: implement the interface, register the instance.

## Mandatory scope

### S1 — `PaystackProvider` adapter

`packages/payment-router/src/providers/paystack-provider.ts`, implementing `PaymentProviderAdapter` (`key = "paystack"`). All HTTP goes over an **injected `fetch`** (`PaystackFetch`) so the boundary is unit-tested without network. The base URL is **always** `https://api.paystack.co` — **G3: the same code is TEST or LIVE purely by which secret is supplied** (`sk_test_…` vs `sk_live_…`); there is no `if (test)` branch anywhere.

- `initiate` → `POST /transaction/initialize`. Requires the authenticated buyer's `customerEmail` (Paystack cannot open a charge without a customer identifier; absence is a **fatal** error, not a failover). `amount` is `amountMinor` **verbatim** — `amountMinor` *is* kobo (G5: never ×100). `reference = intentId` (stable per intent → idempotent retries + the G2 dedup anchor). Biases `channels` to the chosen method. Returns `clientAction: { type: "redirect", url: authorization_url }` — **hosted redirect** (Principle 9).
- `refund` → `POST /refund`. Returns the queued refund reference; the intent does **not** become `refunded` here.
- `finalize` → `GET /transaction/verify/{reference}`. Reads authoritative charge state from Paystack instead of trusting the client. `providerEventId` **equals the transaction reference** — the same dedup key the async `charge.success` webhook carries, so finalize and the webhook can never double-apply (G2).
- `getBalance` → `GET /balance`, matched on currency (D1/G4 reconciliation; read time is the honest `asOf`).
- `verifyWebhook` → **HMAC-SHA512** of the **raw request body** keyed by the secret, constant-time-compared to `x-paystack-signature`. Fail-closed: missing/mismatched → a fatal `ProviderError` the route turns into 401. HMAC the exact bytes received — never a re-serialized parse. Event → implied status: `charge.success → succeeded`, `charge.failed → failed`, `refund.processed → refunded` (money confirmed moved — Q3), `refund.failed → succeeded` (revert: money never left), everything else → `null` (informational ack). Refund events resolve by the original charge reference and dedup in a distinct `refund:` namespace.

Failure normalisation (the failover axis): network throw / 5xx / 408 / 425 / 429 → **retryable**; other 4xx and `status:false` envelopes → **fatal**.

### S2 — Webhook handler (no app-route edit needed)

`apps/account/app/api/payments/webhooks/[provider]/route.ts` (shipped in V3-13) activates Paystack with **no code change**: it resolves the adapter generically via `getAdapter("paystack")` and `WEBHOOK_SECRET_ENV["paystack"]` already points at `PAYSTACK_SECRET_KEY`. The route HMAC-verifies via the adapter (fail-closed 401), resolves the intent by `provider_reference`, and applies the effect through the deduped `apply_payment_webhook` RPC (A3 insert-first/effect-second). Money-truth telemetry (`intent.succeeded`/`failed`/`refunded`) fires **only when the RPC reports `applied === true`** — a deduped redelivery is a silent idempotent ack.

### S3 — Finalize + refund routes (live wiring)

- `POST apps/account/app/api/payments/intents/[id]/finalize/route.ts` — the Paystack callback return. Resolve the owning provider from the `succeeded` attempt (Q2 — failover means it may not be the country default) → best-effort `advance_payment_intent(pending → processing)` → `adapter.finalize()` reads authoritative state → the terminal status applies through the **same deduped `apply_payment_webhook`** the async webhook uses (G2). Still pending at the provider → stays `processing`; the webhook confirms later.
- `POST apps/account/app/api/payments/intents/[id]/refund/route.ts` — sensitive-action gate → succeeded-only (else 409) → resolve the owning provider (Q2) → **`advance_payment_intent(succeeded → refund_processing)` as a mutex claimed BEFORE the provider call** (exactly one concurrent caller wins; the loser 409s, so two requests can't both refund) → `adapter.refund()`. The intent **stays `refund_processing`** and becomes `refunded` only on the `refund.processed` webhook (Q3); a synchronous rejection reverts `refund_processing → succeeded`.

### S4 — `refund_processing` status + the write-path split (migration extension)

This pass **extends the existing migration** `apps/hub/supabase/migrations/20260529120000_payment_intents.sql` (it does **not** add a new file) and the matching `state-machine.ts`:
- Add `refund_processing` to the status CHECK + `LEGAL_TRANSITIONS` + the SQL transition trigger. `succeeded → refund_processing → refunded` replaces the old direct `succeeded → refunded`, so **`refunded` always means provider-confirmed**.
- New RPC `advance_payment_intent(p_intent_id, p_from, p_to)` — the **only** synchronous (non-webhook) status writer, whitelisted to the **three non-money edges** (`pending→processing`, `succeeded→refund_processing`, `refund_processing→succeeded`) with a rows-affected optimistic mutex. A non-whitelisted edge raises.
- `apply_payment_webhook(...)` handles the **money-confirming** edges (`→succeeded`/`→failed`/`→refunded`), dedup-insert-first, A2-checked. It no longer writes `payment_attempts` — attempts record routing only (written at initiate, Q2).
- **D3 invariant:** no route ever issues a raw `update … set status`. A repo grep for `.update({ status })` / `set status =` outside the migration must return zero.

Migration stays **committed-not-applied** — applied by the owner at FL2 production activation, never as a merge side effect.

### S5 — Env + activation seam

`createPaymentRouter({ hooks?, callbackUrl? })` reads the env seam:
- `PAYSTACK_SECRET_KEY` set → register the live `PaystackProvider`, built with the **injected** `callbackUrl` (G7 — the app passes `getAccountUrl("/payments/callback")`; the package reads **no** `PAYSTACK_CALLBACK_URL` env, which would be a phantom var).
- `MOCK_PAYMENT=1` → `MockProvider` backfills every real key **not already served** by a live adapter, so `MOCK_PAYMENT=1` is safe alongside a real Paystack key (the mock fills `stripe`/`flutterwave`/`mock` only).
- neither → no providers registered; every route resolves to A5 manual fallback.

Env vars: `PAYSTACK_SECRET_KEY` (server; also the webhook HMAC key). **No `NEXT_PUBLIC_*` Paystack key** — a public key + inline SDK would leak provider identity to the client (Principle 9).

### S6 — Telemetry

Reuse the V3-13 `henry.payment.*` taxonomy (the nine events are exhaustive by construction): `intent.created` on create, `intent.succeeded`/`failed`/`refunded` only on `applied === true`, `webhook.received`/`verified`/`rejected` on the webhook path, `no_suitable_provider` / `illegal_transition` on those guards. The provider name surfaces only in the server-side audit row (`buildRouterAuditInput`), never in telemetry attributes a client could read.

## Out of scope

- Stripe (V3-14), Flutterwave (V3-16). Subscription lifecycle (V3-20). Refund + reconciliation engine (V3-19). Tax (V3-21). Finance dashboard + finance-RLS narrowing (V3-22). Payouts (V3-69). Native-app payments (V3-23).
- Applying the migration to production — that is FL2, an owner-gated activation step.
- The buyer-facing checkout-entry UI + `/payments/callback` page + USSD surface — **deferred by design** (see Residual / hardening follow-ups); the rails stay dormant with no production entry point, and the webhook is the money-truth backstop regardless.

## Dependencies

- **Requires:** V3-13 (router + contract + schema + state machine).
- **Blocks:** V3-19 (refund reconciliation), V3-69 (Paystack payouts). Hands the worked example to V3-14 / V3-16.

## Inheritance

- `@henryco/payment-router` — `PaymentProviderAdapter`, `PaymentRouter`, `createPaymentRouter`, `state-machine.ts`, `audit.ts`, `telemetry.ts`, the committed migration.
- `@henryco/observability/audit-log` + the `henry.payment.*` taxonomy.
- V3-02 sensitive-action guard on the refund route.
- `@henryco/config` `getAccountUrl()` for the G7 callback URL.

## Implementation requirements

### Files

`packages/payment-router/src/providers/paystack-provider.ts` (new); `paystack-provider.test.ts` (new); `state-machine.ts` + the V3-13 migration (extended for `refund_processing` + the two RPCs); the finalize + refund account routes; `createPaymentRouter` seam (`callbackUrl`); `index.ts` barrel export of `PaystackProvider`; `docs/v3/payment-router-architecture.md` (updated with the **[V3-15]** tags).

### Trust / safety / compliance

`PAYSTACK_SECRET_KEY` is server-only and never logged. Webhook HMAC-SHA512 over raw bytes, constant-time-compared, fail-closed 401 (G1). Idempotency via `reference = intentId` (Paystack-side) + A1 `UNIQUE(user_id, idempotency_key)` (our-side). Money is kobo verbatim (G5) — no float, no ×100. The refund mutex claims `refund_processing` **before** the provider call so two requests can't both refund. No raw status `UPDATE` (D3). The client never sees "paystack", `authorization_url` aside, nor a provider-shaped reference (Principle 9). **Owner superseded** the prompt's original inline SDK + `pay.henrycogroup.com/<token>` proxy — do NOT reintroduce either; hosted-redirect achieves Principle 9 without a public-key leak or a proxy hop.

### Mobile + desktop parity

Web uses the hosted-redirect to Paystack checkout and the `/payments/callback` return (the page itself is deferred — see follow-ups). Expo super-app payments are V3-23 (App Store / Play Store policy compliance). The adapter is transport-agnostic, so the same route serves both once the native shell lands.

### i18n

All buyer-facing copy — method labels, status, errors, the USSD-code surface when built — flows through `@henryco/i18n`, namespace **`surface:payments`**. The redirect carries no Henry Onyx-authored copy (Paystack hosts it); everything Henry Onyx renders is a typed copy key, never hardcoded.

### Brand & design system

Receipts/proofs and any payment legal text use **"Henry Onyx Limited"** from `@henryco/config` (`company.ts` `legalName`) — and the Paystack merchant entity must be the **same** CAC-registered legal entity for compliance. The callback URL resolves via `getAccountUrl("/payments/callback")` — zero hardcoded domains. Any rendered payment UI is design-token-only (Fraunces + locked `--site-*`/`--accent`), light + dark, mobile + desktop, CLS ≈ 0, and behaviour-locked against the V3-13 money invariants.

## Validation gates

1. Standard CI: `Lint, typecheck, test, build` (the only required branch-protection context).
2. **Package suite green** (96/96 at merge): adapter HTTP normalisation, the retryable/fatal axis, kobo-verbatim amounts, HMAC verify/reject, the `refund_processing` edges, finalize↔webhook G2 dedup.
3. **FL1 TEST-mode e2e** (functional closure; runbook `.codex-temp/v3-15-paystack/test-mode-runbook.md`, gitignored): card / bank / USSD / refund Q3 lifecycle / webhook dedup 3× (one apply, two idempotent acks) / HMAC fail-closed 401 / sensitive-action guard — each with the exact Paystack TEST action, request, expected DB state, pass/fail.
4. **RLS** unchanged from V3-13 (interim `is_platform_staff()` finance read; V3-22 narrows it).
5. **D3 grep** for raw status `UPDATE` returns zero.

## Deployment gate

Two owner-defined finish lines past the PR merge — **merging is NOT "complete":**
- **FL1 (now, no CAC):** TEST-mode e2e green = functional closure. Achievable today against a Paystack TEST key with no legal gate.
- **FL2 (weeks out, CAC-gated, document-only):** L4 Paystack merchant approval + L14 DPA signed → apply the migration to PROD → `sk_test_` → `sk_live_` flip (**config only**, G3 — no code change) → 48h soak + monitored ramp. **Rollback (A9): ANY reconciliation delta > 0 or any double-charge → halt + revert immediately.** Branch protection requires only `Lint, typecheck, test, build`; do not block a merge on the non-required session-persistence gate.

## Final report contract

`.codex-temp/v3-15-payments-paystack-activation/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the FL1 TEST-mode evidence table + the FL2 activation runbook.

## Residual / hardening follow-ups

- **Buyer-facing checkout-entry UI + `/payments/callback` page + USSD surface** — deferred by design and **registered in PASS-REGISTER as blocking live traffic**. The callback URL is already computed/threaded (G7) so the page slots in with zero router change; a returning buyer 404s today (fine at FL1 — money truth is the webhook, never the redirect).
- **Finance read RLS** on `payment_intents` / `payment_attempts` uses the broad interim `public.is_platform_staff()`. **V3-22 owns** narrowing it to a real finance predicate — and must NOT regress to the always-false `is_staff_in('finance')`.

## Self-verification

- [ ] `PaystackProvider` implements the contract over an injected `fetch`; base URL always `api.paystack.co`; no test/live branch (G3).
- [ ] `initiate` returns a hosted `clientAction.redirect`; `amount` is kobo verbatim (G5); `reference = intentId`; missing email is fatal.
- [ ] `verifyWebhook` HMAC-SHA512 over raw bytes, constant-time, fail-closed; the four charge/refund events map correctly; `refund.processed → refunded` only.
- [ ] `finalize` and the webhook apply the terminal status through the same deduped `apply_payment_webhook` keyed on the same reference (G2).
- [ ] `refund_processing` status + the `advance_payment_intent` / `apply_payment_webhook` split added to migration + `state-machine.ts`; no raw status `UPDATE` (D3).
- [ ] Refund mutex claims `refund_processing` before the provider call; concurrent loser 409s.
- [ ] `createPaymentRouter` registers the live adapter on `PAYSTACK_SECRET_KEY`; callback URL injected via `getAccountUrl` (G7); no `NEXT_PUBLIC_*` Paystack key.
- [ ] Telemetry reuses the nine `henry.payment.*` events; money-truth events fire only on `applied === true`; no provider name client-side (Principle 9).
- [ ] FL1 TEST-mode runbook green; migration committed-NOT-applied; FL2 documented.
- [ ] Report written. Deferred checkout UI + finance-RLS narrowing registered as follow-ups.
