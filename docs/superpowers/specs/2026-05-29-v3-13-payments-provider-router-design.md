# V3-13 — Payments: Provider Router (Design Spec)

- **Date:** 2026-05-29
- **Pass:** V3-13 (Phase B foundation, money-critical)
- **Branch:** `v3/13-payments-provider-router` (off `origin/main` @ `4d1ea6bd`)
- **Dependency:** V3-12 (CERTIFIED on `origin/main`)
- **Status:** Design approved by owner; this doc is the build contract.

---

## 1. Goal & Non-Goals

### Goal
Build a **vendor-agnostic payment provider router** — the contract and orchestration layer that every HenryCo division will route real payments through once live providers land. It selects a provider from `{country, currency, method}`, initiates payment through a uniform adapter, fails over on retryable errors, and writes a money-grade audit + telemetry trail. The state of every payment is tracked in `payment_intents` / `payment_attempts`, with money-correctness invariants enforced **at the database layer** so no application bug can double-charge, skip a state, or re-apply a webhook.

### Non-Goals (explicitly out of scope for V3-13)
- **No live provider SDKs.** Stripe (V3-14), Paystack (V3-15), Flutterwave (V3-16) integrate later. We build against a **mock provider** only.
- **No dormant 48h soak.** Per addendum **A6**, the gate for V3-13 is the **test suite**. Real-money soak lands in V3-14/15/16 with live traffic.
- **No network-graph domain masking** (ANTI-CLONE Principle 9 expensive half) — deferred to V4. We keep the **zero-cost half**: the client response never leaks `selected_provider`.
- **No reconciliation engine** — only the **type contract** for the reconciliation hook (A7).
- **No finance dashboard build-out** — only a minimal owner-gated scaffold; V3-22 builds it.

---

## 2. Resolved Decisions (owner-confirmed)

| # | Decision | Resolution |
|---|----------|------------|
| **Q1** | Env var names (spec addendum A8 vs INTEGRATION-KEYS.md) | Use **INTEGRATION-KEYS.md canonical names**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYSTACK_SECRET_KEY`, `FLW_SECRET_KEY`, `FLW_SECRET_HASH`. Paystack uses **secret-key HMAC** (no separate webhook secret). Align A8 to these — do not fork the contract with `FLUTTERWAVE_*` / `PAYSTACK_WEBHOOK_SECRET`. |
| **Q2** | Payment CTA placement | Add CTA **capability to `@henryco/payment-surface`** + wire **one reference app**. **Register the 6-app rollout in `PASS-REGISTER.md`** and fold into V3-14/15/16 acceptance — not a volatile loose end. |
| **Q3** | Status state machine enforcement | **Defense-in-depth:** DB `BEFORE UPDATE` trigger (unbypassable backstop) **+** TypeScript transition guard (clean errors) **+** `henry.payment.illegal_transition` telemetry. Non-negotiable for money state. |

## 3. Refinements (owner-added at approval)

| # | Refinement | Detail |
|---|-----------|--------|
| **R1** | Sensitive-action gate scope | `requireSensitiveAction` wraps **both intent-create AND refund** (not just refund). Warm reauth copy via i18n. |
| **R2** | `division` as a first-class column | `division` is a **real, indexed column** on `payment_intents`, **not** JSONB metadata — it drives finance-staff RLS and reporting. |
| **R3** | Webhook RPC ordering | `apply_payment_webhook(...)` RPC does **dedup-insert FIRST, effect SECOND, in the same transaction**. Add a **crash-between-steps test**. |

---

## 4. Money-Correctness Invariants (Addendum A1–A10)

These are the load-bearing guarantees. Each maps to an enforcement point.

| ID | Invariant | Enforcement |
|----|-----------|-------------|
| **A1** | Idempotent create — replaying the same request returns the existing intent (HTTP 200), never a second charge. | `UNIQUE(user_id, idempotency_key)` on `payment_intents`; route catches `23505` → `SELECT` existing → 200. |
| **A2** | Status state machine — only legal transitions; illegal rejected + alerted. | DB `BEFORE UPDATE` trigger (backstop) + TS guard + `illegal_transition` event (Q3). |
| **A3** | Webhook dedup — provider redelivery applied exactly once. | `processed_webhooks UNIQUE(provider, provider_event_id)`; dedup-insert-first RPC (R3). |
| **A4** | Currency minor-unit exponent — never assume ×100. | `getCurrencyMinorUnit(code)` (ISO-4217 exponent); reject unsupported currencies. |
| **A5** | `NoSuitableProvider` → manual fallback, **not** an error surface. | Router returns a typed manual-fallback result; route responds with actionable guidance, not 500. |
| **A6** | Tests are the gate, not a soak. | 50+ `node:test` specs + mock e2e; no dormant soak. |
| **A7** | Reconciliation hook — **types only**. | `reconciliation.ts` exports the contract types; no engine. |
| **A8** | Env var names documented. | INTEGRATION-KEYS.md (canonical, per Q1). |
| **A9** | Rollback note. | Documented in `payment-router-architecture.md`. |
| **A10** | `PaymentMethod` includes `apple_pay` + `google_pay` as distinct values. | Type union + capability matrix routes them. V3-13 only **defines** values + routing. |

---

## 5. Design — Nine Sections

### §1 — Package `@henryco/payment-router`

```
packages/payment-router/
  package.json            # private, 0.1.0, type:module, exports map, typecheck script only
  tsconfig.json           # standalone (no extends); ES2022/esnext/bundler/strict/noEmit
  src/
    index.ts              # public barrel
    types.ts              # Result, ISO aliases, PaymentMethod, PaymentProviderKey, PaymentIntentStatus, money guards
    errors.ts             # NoSuitableProviderError, ProviderError, IllegalTransitionError
    router.ts             # createPaymentRouter(), selectProvider(), route()
    state-machine.ts      # legal transition table + assertTransition()
    audit.ts              # writeRouterAudit() — folds money context into writeAuditLog newValues
    reconciliation.ts     # A7 contract types only
    providers/
      adapter-interface.ts # PaymentProviderAdapter contract (every method -> Result)
      mock-provider.ts     # honors MOCK_PAYMENT_FAILURE; only adapter registered in V3-13
    routing/
      country-defaults.ts  # country -> ordered provider preference
      capability-matrix.ts # provider -> supported {method, currency} capabilities
    __tests__/
      *.test.ts            # node:test via tsx
  scripts/
    mock-payment-webhook.mjs # local webhook simulator
```

- **Deps (`workspace:^`):** `@henryco/i18n`, `@henryco/observability`, `@henryco/pricing`.
- **Consumed as raw TS source** via `exports` map → `./src/*.ts` (monorepo convention; no build step).
- **Test script:** `tsx --test src/__tests__/*.test.ts` (matches `@henryco/auth` pattern).

### §2 — Types (`types.ts`)

```ts
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type ISO3166Alpha2 = string;  // no ISO type alias exists in repo; plain string
export type ISO4217 = string;

export type PaymentMethod =
  | "card" | "bank_transfer" | "ussd" | "mobile_money"
  | "apple_pay" | "google_pay";                          // A10

export type PaymentProviderKey = "stripe" | "paystack" | "flutterwave" | "mock";

export type PaymentIntentStatus =
  | "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled";
```

- **`amountMinor: number`** guarded by `Number.isSafeInteger(x) && x > 0` (constructor/validator rejects otherwise).
- **A4:** minor-unit exponent comes from `getCurrencyMinorUnit(code)`. Reject any currency where `isSupportedCurrency(code)` is false — **never** silently assume ×100.
- **Vocab note:** `@henryco/payment-surface` status enum uses `paid`; this schema uses `succeeded`. The mapping (`succeeded` ↔ `paid`) is centralized in §8 and the surface adapter.

### §3 — Adapter Contract (`providers/adapter-interface.ts`)

Per S2, every method returns `Promise<Result<T, ProviderError>>`:

```ts
export interface PaymentProviderAdapter {
  readonly key: PaymentProviderKey;
  initiatePayment(input: InitiatePaymentInput): Promise<Result<ProviderInitiation, ProviderError>>;
  verifyPayment(input: VerifyPaymentInput): Promise<Result<ProviderVerification, ProviderError>>;
  refundPayment(input: RefundInput): Promise<Result<ProviderRefund, ProviderError>>;
  verifyWebhook(input: WebhookVerifyInput): Promise<Result<WebhookEvent, ProviderError>>;
  capabilities(): ProviderCapabilities;
}

export interface ProviderError {
  code: string;
  retryable: boolean;     // drives failover
  providerKey: PaymentProviderKey;
  message: string;
}
```

- **MockProvider** honors `MOCK_PAYMENT_FAILURE` (inject retryable / non-retryable failures for tests). Only adapter registered in V3-13.
- `createPaymentRouter()` reads `MOCK_PAYMENT` to decide registration (in V3-13, always mock).

### §4 — Router (`router.ts`)

- **`selectProvider({ country, currency, method })`:** intersect `country-defaults[country]` ∩ providers whose `capability-matrix` supports `{method, currency}` ∩ registered adapters → return **first** or `null`.
  - `country-defaults`: `NG → [paystack, flutterwave]`; `US/GB/EU → [stripe]`. (V3-13 registers only `mock`, so the mock is the effective adapter; the matrix logic is fully exercised by tests with simulated adapters.)
- **`route(intent)`:** `selectProvider` → write audit → `initiatePayment` → on **retryable** `ProviderError`, fail over to next candidate → return a **provider-agnostic `PaymentResult`**.
  - `null` selection → throw `NoSuitableProviderError` → caught upstream → **manual fallback** (A5), not a 500.
  - **Principle 9 (zero-cost half):** the client-facing response **OMITS `selected_provider`**. The provider key lives only in server-side audit/attempt rows.

### §5 — Schema Migration

`apps/hub/supabase/migrations/<timestamp>_payment_intents.sql` (timestamp > `20260523190000`).

**`payment_intents`**
- `id uuid pk default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `division text not null` — **real indexed column** (R2); index `idx_payment_intents_division`
- `idempotency_key text not null`
- `amount_minor bigint not null check (amount_minor > 0)`
- `currency text not null`
- `method text not null`
- `status text not null default 'pending'`
- `created_at / updated_at timestamptz not null default timezone('utc', now())`
- **`unique (user_id, idempotency_key)`** (A1)

**`payment_attempts`**
- `id uuid pk`, `intent_id uuid not null references payment_intents(id) on delete cascade`
- `provider text not null`, `status text not null`, `provider_ref text`, `error_code text`
- `created_at timestamptz not null default timezone('utc', now())`

**`processed_webhooks`**
- `id uuid pk`, `provider text not null`, `provider_event_id text not null`
- `intent_id uuid references payment_intents(id) on delete set null`
- `received_at timestamptz not null default timezone('utc', now())`
- **`unique (provider, provider_event_id)`** (A3)

**Functions / triggers**
- `payments_set_updated_at()` — body `new.updated_at = timezone('utc', now())`; `BEFORE UPDATE` on `payment_intents`.
- **`enforce_payment_intent_transition()`** — `BEFORE UPDATE`; allows:
  - `pending → processing`, `processing → succeeded | failed`, `pending → cancelled`, `succeeded → refunded`, and **no-op** (`OLD.status = NEW.status`).
  - any other transition → `RAISE EXCEPTION` (Q3 backstop).
- **`apply_payment_webhook(p_provider text, p_event_id text, p_intent_id uuid, p_new_status text, p_provider_ref text, p_error_code text)` RPC** (R3):
  1. **Dedup-insert FIRST:** `INSERT INTO processed_webhooks ... ON CONFLICT (provider, provider_event_id) DO NOTHING`.
  2. If **not inserted** (`NOT FOUND` / 0 rows) → return idempotent-ack (no re-apply).
  3. Else **effect SECOND, same transaction:** `UPDATE payment_intents SET status = p_new_status ...` (passes through the transition trigger) + `INSERT INTO payment_attempts ...`.
  4. Any failure rolls back **both** atomically (function is one transaction).

**RLS**
- `enable row level security` on all three tables.
- **User:** `SELECT` + `INSERT` own rows (`user_id = (select auth.uid())`). **No user `UPDATE` policy** (status only moves via service-role RPC).
- **Finance staff:** `SELECT` via `is_staff_in('finance')` (maps through legacy `profiles.role = 'finance'` — no 'finance' division key exists yet).
- **Service role:** `for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role')`.

### §6 — Routes (`apps/account/app/api/payments/`)

- **`POST intents`** — `requireSensitiveAction` gate (R1, action `payment.intent.create`); validate money (A4); `route()`; **A1 replay**: on `23505` → `SELECT` existing intent → **200**; response **omits `selected_provider`**.
- **`POST intents/[id]/finalize`** — session + ownership check; guarded status transition (writes via service-role RPC path); maps provider verification → status.
- **`POST intents/[id]/refund`** — `requireSensitiveAction` gate (R1, action `payment.refund`, `entityId` = intent id); `succeeded → refunded` only.
- **`POST webhooks/[provider]`** — **no session**; `createAdminSupabase`; `verifyWebhook` HMAC (per-provider, Q1 secrets); call **`apply_payment_webhook` RPC** (R3). `export const runtime = "nodejs"`.

Reauth copy via i18n: warm strings through `translateSurfaceLabel` (English-string-as-key; no `surface:payments` namespace exists).

### §7 — `@henryco/payment-surface` CTA

- Add optional **server-gated** prop `cardCta?: { label: string; href: string } | null` to the payment guide component.
- Label localized via `translateSurfaceLabel(locale, label)`.
- **Wire one reference app:** marketplace `/pay/[id]` (the template surface that the other five mirror).
- **Register the 6-app rollout** (logistics, studio, jobs, property, marketplace, care) in `PASS-REGISTER.md`; fold into V3-14/15/16 acceptance.

### §8 — Audit & Telemetry

- **Add 9 names** to `HenryEventName` union in `@henryco/observability/events`:
  1. `henry.payment.intent.created`
  2. `henry.payment.intent.succeeded`
  3. `henry.payment.intent.failed`
  4. `henry.payment.intent.refunded`
  5. `henry.payment.webhook.received`
  6. `henry.payment.webhook.verified`
  7. `henry.payment.webhook.rejected`
  8. `henry.payment.no_suitable_provider`
  9. `henry.payment.illegal_transition` (Q3)
- **No `EventOutcome` extension needed** — map onto the closed union:
  - created → `started`, succeeded → `paid`, failed → `failed`, refunded → `completed`, webhook.received → `requested`, verified → `verified`, rejected → `rejected`, no_suitable_provider → `blocked`, illegal_transition → `blocked`.
- **`audit.ts`** folds `{ country, currency, method, selected_provider, outcome, latency_ms }` into `writeAuditLog` **`newValues`** (the audit-log signature has no actor/outcome/latency params; actor resolves via `auth.uid()` in `add_audit_log_v2`). `writeAuditLog` never throws.

### §9 — Tests, Docs, Scaffold

**Tests (the gate — 50+ specs + mock e2e):**
- Routing: country-defaults selection, capability intersection, ordered preference.
- Capability matrix: each method × currency including `apple_pay` / `google_pay` (A10).
- Failover: retryable error → next candidate; non-retryable → stop.
- **A1** replay: duplicate idempotency key → same intent.
- **A2** transitions: every legal transition passes; every illegal one rejected (TS guard + DB trigger).
- **A3** dedup: duplicate webhook applied once; **crash-between-steps test** (R3) — effect never applies without the dedup row.
- **A4** exponent: correct minor-unit per currency; unsupported currency rejected (never ×100).
- **A5** null-path: `NoSuitableProvider` → manual-fallback result, not throw-to-500.
- Mock e2e: duplicate-key, duplicate-webhook, illegal-transition end to end.

**Docs:**
- New `docs/v3/payment-router-architecture.md`: routing diagram, adapter contract, state machine, A7 reconciliation contract, **A9 rollback note**, A6 soak reframe.
- Update `docs/v3/INTEGRATION-KEYS.md`: add `MOCK_PAYMENT` row; align A8 to canonical names (Q1).
- Register **V3-13** + the **6-app CTA rollout** in `docs/v3/PASS-REGISTER.md`.

**Scaffold:**
- Minimal owner-gated `apps/hub/app/owner/(command)/finance/dashboard.tsx` stub (V3-22 builds out). No live SDK.

**Report:** `.codex-temp/v3-13-payments-provider-router/report.md` (9 sections + diagram + coverage).

---

## 6. Rollback (A9)

V3-13 is **additive**: a new package, new tables, new routes, new event names. Rollback = revert the branch merge; the migration's tables are unreferenced by existing flows (no live provider consumes them until V3-14+). The mock provider is gated behind `MOCK_PAYMENT`; with no live keys set, the router is inert in production. Full rollback note + drop-order lives in `payment-router-architecture.md`.

## 7. Reconciliation Contract (A7 — types only)

`reconciliation.ts` exports the **shape** a future reconciliation engine consumes (`ReconciliationCandidate`, `ReconciliationResult`, `reconcileIntent` signature) — no implementation. This lets V3-14/15/16 wire provider settlement reports against a stable contract.

## 8. Acceptance

- All `node:test` specs green (the gate, A6).
- `pnpm --filter @henryco/payment-router typecheck` clean.
- Migration applies cleanly; RLS + triggers verified by tests against the contract.
- Client response proven (by test) to omit `selected_provider`.
- Docs + PASS-REGISTER updated; report written.

## 9. Deferred (registered, not lost)

- 6-app CTA rollout → folded into V3-14/15/16 acceptance (PASS-REGISTER).
- Live SDK integration → V3-14 (Stripe), V3-15 (Paystack), V3-16 (Flutterwave).
- Reconciliation engine → consumes A7 contract later.
- Principle 9 network-graph masking (expensive half) → V4.
- Finance dashboard build-out → V3-22.
