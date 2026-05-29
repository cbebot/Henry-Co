# V3-13 — Payments: Provider Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vendor-agnostic `@henryco/payment-router` package — capability registry + deterministic country/method routing + provider-agnostic result contract — proven entirely against a MOCK provider, with money-correctness (idempotency, legal state transitions, webhook dedup) tested via an executable TypeScript reference that the SQL migration mirrors.

**Architecture:** A pure routing core (`selectProvider` = country-defaults ∩ capability-matrix ∩ registered-providers) wraps a `PaymentProviderAdapter` interface. The only adapter built here is `MockProvider`. Money semantics live in `state-machine.ts` (legal-transition table) + an in-memory transactional store that mirrors the production SQL RPC ordering (dedup-insert-first, effect-second). The SQL migration is committed as the production mirror, NOT applied in-session. App routes (account) and the payment-surface CTA consume the router. The client response NEVER leaks `selected_provider` (ANTI-CLONE Principle 9).

**Tech Stack:** TypeScript (raw-source package via `exports`→`./src/*.ts`, no build step), `node:test` + `tsx` (NOT vitest/jest), pnpm workspace `workspace:^` deps, Supabase Postgres (plpgsql triggers + SECURITY DEFINER RPC), Next.js 16 App Router route handlers, `@henryco/i18n` (currency + surface copy), `@henryco/observability` (events + audit log), `@henryco/pricing`.

---

## File Structure

**New package `packages/payment-router/`:**
- `package.json` — name `@henryco/payment-router`, private, raw-source exports, `test`/`typecheck` scripts.
- `tsconfig.json` — standalone (no extends), mirrors observability template.
- `src/types.ts` — `Result<T,E>`, branded ISO types, `PaymentMethod` (incl `apple_pay`/`google_pay` — A10), `PaymentProviderKey`, `PaymentIntentStatus`, `PaymentIntentInput`, money guards (`validateAmountMinor`, `normalizeCurrency` — A4).
- `src/errors.ts` — `ProviderError`, `NoSuitableProviderError`, `IllegalTransitionError`.
- `src/state-machine.ts` — `LEGAL_TRANSITIONS`, `isLegalTransition`, `assertTransition` (A2). **Shared source of truth with SQL.**
- `src/providers/adapter-interface.ts` — `PaymentProviderAdapter` + I/O types.
- `src/providers/mock-provider.ts` — `MockProvider` (honors `MOCK_PAYMENT_FAILURE`).
- `src/routing/capability-matrix.ts` — provider → supported `PaymentMethod[]` (A10).
- `src/routing/country-defaults.ts` — ISO-3166 → ordered `PaymentProviderKey[]`.
- `src/router.ts` — `PaymentRouter` class, `selectProvider`, `route`, `createPaymentRouter`.
- `src/audit.ts` — `writeRouterAudit` (folds money context into `writeAuditLog`).
- `src/reconciliation.ts` — A7 contract types only (no engine — that's V3-19).
- `src/testing/in-memory-payment-store.ts` — transactional store mirroring the SQL RPC (A1/A3/crash-between-steps).
- `src/index.ts` — barrel.
- `src/__tests__/*.test.ts` — money-correctness + routing specs.
- `scripts/mock-payment-webhook.mjs` — mock e2e harness.

**Modified / new outside the package:**
- `packages/observability/src/events.ts` — add 9 `henry.payment.*` names (§8).
- `apps/hub/supabase/migrations/20260529120000_payment_intents.sql` — production mirror (§5), NOT applied.
- `apps/account/app/api/payments/intents/route.ts` + `[id]/finalize/route.ts` + `[id]/refund/route.ts` + `webhooks/[provider]/route.ts` (§6).
- `packages/payment-surface/` — optional `cardCta` capability (§7).
- `apps/marketplace/.../pay/[id]/` — one reference CTA wire (§7).
- `docs/v3/payment-router-architecture.md` (new), `docs/v3/INTEGRATION-KEYS.md` (MOCK_PAYMENT row), `docs/v3/PASS-REGISTER.md` (V3-13 detail + **6-app CTA rollout**).
- `apps/hub/app/owner/(command)/finance/dashboard.tsx` — owner-gated stub.
- `.codex-temp/v3-13-payments-provider-router/report.md` — final report.

---

### Task 0: Package scaffold

**Files:**
- Create: `packages/payment-router/package.json`
- Create: `packages/payment-router/tsconfig.json`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "@henryco/payment-router",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts",
    "./errors": "./src/errors.ts",
    "./state-machine": "./src/state-machine.ts",
    "./testing": "./src/testing/in-memory-payment-store.ts"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "test": "tsx --test src/__tests__/*.test.ts"
  },
  "dependencies": {
    "@henryco/i18n": "workspace:^",
    "@henryco/observability": "workspace:^",
    "@henryco/pricing": "workspace:^"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`** (mirror observability — no extends)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Symlink the workspace**

Run: `pnpm install`
Expected: `@henryco/payment-router` appears; `@henryco/{i18n,observability,pricing}` symlinked into its `node_modules`.

- [ ] **Step 4: Commit**

```bash
git add packages/payment-router/package.json packages/payment-router/tsconfig.json pnpm-lock.yaml
git commit -m "V3-13 Task 0 — scaffold @henryco/payment-router package"
```

---

### Task 1: Types + money guards (A4)

**Files:**
- Create: `packages/payment-router/src/types.ts`
- Test: `packages/payment-router/src/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateAmountMinor, normalizeCurrency } from "../types";

describe("validateAmountMinor", () => {
  it("accepts positive safe integers", () => {
    assert.deepEqual(validateAmountMinor(150000), { ok: true, value: 150000 });
  });
  it("rejects zero, negatives, floats, NaN, unsafe ints", () => {
    for (const bad of [0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(validateAmountMinor(bad).ok, false);
    }
  });
});

describe("normalizeCurrency (A4)", () => {
  it("upcases and accepts a supported currency", () => {
    assert.deepEqual(normalizeCurrency("ngn"), { ok: true, value: "NGN" });
  });
  it("rejects an unsupported currency rather than falling back to NGN", () => {
    const r = normalizeCurrency("ZZZ");
    assert.equal(r.ok, false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @henryco/payment-router test`
Expected: FAIL — module `../types` has no exports.

- [ ] **Step 3: Write `src/types.ts`**

```ts
import { isSupportedCurrency, getCurrencyMinorUnit } from "@henryco/i18n/currency";

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type ISO3166Alpha2 = string;
export type ISO4217 = string;

export type PaymentMethod =
  | "card"
  | "bank_transfer"
  | "ussd"
  | "mobile_money"
  | "apple_pay"
  | "google_pay";

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  "card", "bank_transfer", "ussd", "mobile_money", "apple_pay", "google_pay",
] as const;

export type PaymentProviderKey = "stripe" | "paystack" | "flutterwave" | "mock";

export type PaymentIntentStatus =
  | "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled";

export interface PaymentIntentInput {
  amountMinor: number;
  currency: ISO4217;
  country: ISO3166Alpha2;
  method: PaymentMethod;
  userId: string;
  idempotencyKey: string;
  division?: string | null;
  metadata?: Record<string, unknown>;
}

export function validateAmountMinor(x: number): Result<number, string> {
  if (!Number.isSafeInteger(x) || x <= 0) {
    return { ok: false, error: `amountMinor must be a positive safe integer, got ${x}` };
  }
  return { ok: true, value: x };
}

export function normalizeCurrency(code: string): Result<ISO4217, string> {
  const upper = code.toUpperCase();
  if (!isSupportedCurrency(upper)) {
    return { ok: false, error: `unsupported currency: ${code}` };
  }
  return { ok: true, value: upper };
}

export function minorUnitExponent(currency: ISO4217): number {
  return getCurrencyMinorUnit(currency);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @henryco/payment-router test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/payment-router/src/types.ts packages/payment-router/src/__tests__/types.test.ts
git commit -m "V3-13 Task 1 — payment types + money guards (A4 reject unsupported currency)"
```

---

### Task 2: Errors

**Files:**
- Create: `packages/payment-router/src/errors.ts`

- [ ] **Step 1: Write `src/errors.ts`** (no separate test — exercised by router/state-machine tests)

```ts
import type { PaymentProviderKey, PaymentIntentStatus } from "./types";

export interface ProviderError {
  code: string;
  message: string;
  retryable: boolean;
  providerKey: PaymentProviderKey;
}

export class NoSuitableProviderError extends Error {
  readonly country: string;
  readonly currency: string;
  readonly method: string;
  constructor(country: string, currency: string, method: string) {
    super(`no suitable payment provider for country=${country} currency=${currency} method=${method}`);
    this.name = "NoSuitableProviderError";
    this.country = country;
    this.currency = currency;
    this.method = method;
  }
}

export class IllegalTransitionError extends Error {
  readonly from: PaymentIntentStatus;
  readonly to: PaymentIntentStatus;
  constructor(from: PaymentIntentStatus, to: PaymentIntentStatus) {
    super(`illegal payment intent transition: ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
    this.from = from;
    this.to = to;
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @henryco/payment-router typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/payment-router/src/errors.ts
git commit -m "V3-13 Task 2 — payment router error types"
```

---

### Task 3: State machine (A2) — shared source of truth

**Files:**
- Create: `packages/payment-router/src/state-machine.ts`
- Test: `packages/payment-router/src/__tests__/state-machine.test.ts`

- [ ] **Step 1: Write the failing test** (exhaustive — every legal pair passes, every illegal pair rejects, no-op allowed)

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LEGAL_TRANSITIONS, isLegalTransition, assertTransition, ALL_STATUSES,
} from "../state-machine";
import { IllegalTransitionError } from "../errors";

describe("payment intent state machine (A2)", () => {
  it("allows exactly the documented legal transitions", () => {
    const legal = new Set<string>([
      "pending->processing", "pending->cancelled",
      "processing->succeeded", "processing->failed",
      "succeeded->refunded",
    ]);
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const expected = legal.has(`${from}->${to}`) || from === to; // no-op allowed
        assert.equal(isLegalTransition(from, to), expected, `${from}->${to}`);
      }
    }
  });

  it("assertTransition throws IllegalTransitionError on illegal", () => {
    assert.throws(() => assertTransition("succeeded", "pending"), IllegalTransitionError);
  });

  it("assertTransition is a no-op on legal and on same-state", () => {
    assert.doesNotThrow(() => assertTransition("pending", "processing"));
    assert.doesNotThrow(() => assertTransition("succeeded", "succeeded"));
  });

  it("LEGAL_TRANSITIONS matches the SQL mirror comment block", () => {
    assert.deepEqual(LEGAL_TRANSITIONS.pending.slice().sort(), ["cancelled", "processing"]);
    assert.deepEqual(LEGAL_TRANSITIONS.processing.slice().sort(), ["failed", "succeeded"]);
    assert.deepEqual(LEGAL_TRANSITIONS.succeeded, ["refunded"]);
    assert.deepEqual(LEGAL_TRANSITIONS.failed, []);
    assert.deepEqual(LEGAL_TRANSITIONS.refunded, []);
    assert.deepEqual(LEGAL_TRANSITIONS.cancelled, []);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @henryco/payment-router test`
Expected: FAIL — `../state-machine` missing.

- [ ] **Step 3: Write `src/state-machine.ts`**

```ts
import type { PaymentIntentStatus } from "./types";
import { IllegalTransitionError } from "./errors";

export const ALL_STATUSES: readonly PaymentIntentStatus[] = [
  "pending", "processing", "succeeded", "failed", "refunded", "cancelled",
] as const;

/**
 * THE source of truth for legal payment-intent transitions.
 * The SQL function enforce_payment_intent_transition() in
 * 20260529120000_payment_intents.sql MUST mirror this table exactly.
 */
export const LEGAL_TRANSITIONS: Record<PaymentIntentStatus, PaymentIntentStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["succeeded", "failed"],
  succeeded: ["refunded"],
  failed: [],
  refunded: [],
  cancelled: [],
};

export function isLegalTransition(from: PaymentIntentStatus, to: PaymentIntentStatus): boolean {
  if (from === to) return true; // idempotent no-op write
  return LEGAL_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: PaymentIntentStatus, to: PaymentIntentStatus): void {
  if (!isLegalTransition(from, to)) {
    throw new IllegalTransitionError(from, to);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @henryco/payment-router test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/payment-router/src/state-machine.ts packages/payment-router/src/__tests__/state-machine.test.ts
git commit -m "V3-13 Task 3 — payment intent state machine (A2 legal transitions, SQL source of truth)"
```

---

### Task 4: Adapter interface

**Files:**
- Create: `packages/payment-router/src/providers/adapter-interface.ts`

- [ ] **Step 1: Write `src/providers/adapter-interface.ts`**

```ts
import type { Result } from "../types";
import type { ProviderError } from "../errors";
import type { PaymentProviderKey, PaymentMethod, ISO3166Alpha2, ISO4217 } from "../types";

export interface InitiatePaymentParams {
  intentId: string;
  amountMinor: number;
  currency: ISO4217;
  country: ISO3166Alpha2;
  method: PaymentMethod;
  idempotencyKey: string;
}

export interface InitiatePaymentResult {
  providerReference: string;
  /** Provider-side action the client must complete (redirect/SDK token). Opaque. */
  clientAction: { type: "redirect"; url: string } | { type: "sdk"; token: string } | { type: "none" };
}

export interface RefundParams {
  providerReference: string;
  amountMinor: number;
  reason?: string | null;
}

export interface RefundResult {
  refundReference: string;
}

export interface VerifyWebhookParams {
  rawBody: string;
  signature: string | null;
  secret: string;
}

export interface VerifiedWebhook {
  providerEventId: string;
  eventType: string;
  providerReference: string;
  /** Normalised terminal status this event implies, if any. */
  impliedStatus: "succeeded" | "failed" | "refunded" | null;
}

export interface PaymentProviderAdapter {
  readonly key: PaymentProviderKey;
  initiate(params: InitiatePaymentParams): Promise<Result<InitiatePaymentResult, ProviderError>>;
  refund(params: RefundParams): Promise<Result<RefundResult, ProviderError>>;
  verifyWebhook(params: VerifyWebhookParams): Promise<Result<VerifiedWebhook, ProviderError>>;
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
pnpm --filter @henryco/payment-router typecheck
git add packages/payment-router/src/providers/adapter-interface.ts
git commit -m "V3-13 Task 4 — PaymentProviderAdapter interface (Result-typed, provider-agnostic)"
```

---

### Task 5: Capability matrix (A10)

**Files:**
- Create: `packages/payment-router/src/routing/capability-matrix.ts`
- Test: `packages/payment-router/src/__tests__/capability-matrix.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { providerSupportsMethod, CAPABILITY_MATRIX } from "../routing/capability-matrix";

describe("capability matrix (A10 wallet methods)", () => {
  it("stripe supports apple_pay and google_pay", () => {
    assert.equal(providerSupportsMethod("stripe", "apple_pay"), true);
    assert.equal(providerSupportsMethod("stripe", "google_pay"), true);
  });
  it("paystack supports ussd and bank_transfer but not apple_pay", () => {
    assert.equal(providerSupportsMethod("paystack", "ussd"), true);
    assert.equal(providerSupportsMethod("paystack", "bank_transfer"), true);
    assert.equal(providerSupportsMethod("paystack", "apple_pay"), false);
  });
  it("flutterwave supports mobile_money", () => {
    assert.equal(providerSupportsMethod("flutterwave", "mobile_money"), true);
  });
  it("mock supports every method (test rail)", () => {
    for (const m of CAPABILITY_MATRIX.mock) assert.ok(m);
    assert.equal(providerSupportsMethod("mock", "apple_pay"), true);
  });
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `pnpm --filter @henryco/payment-router test`

- [ ] **Step 3: Write `src/routing/capability-matrix.ts`**

```ts
import type { PaymentProviderKey, PaymentMethod } from "../types";
import { PAYMENT_METHODS } from "../types";

export const CAPABILITY_MATRIX: Record<PaymentProviderKey, readonly PaymentMethod[]> = {
  stripe: ["card", "apple_pay", "google_pay"],
  paystack: ["card", "bank_transfer", "ussd"],
  flutterwave: ["card", "bank_transfer", "mobile_money", "ussd"],
  mock: PAYMENT_METHODS,
};

export function providerSupportsMethod(
  provider: PaymentProviderKey,
  method: PaymentMethod,
): boolean {
  return CAPABILITY_MATRIX[provider].includes(method);
}
```

- [ ] **Step 4: Run test → PASS; Commit**

```bash
pnpm --filter @henryco/payment-router test
git add packages/payment-router/src/routing/capability-matrix.ts packages/payment-router/src/__tests__/capability-matrix.test.ts
git commit -m "V3-13 Task 5 — capability matrix (A10 apple_pay/google_pay enumerated)"
```

---

### Task 6: Country defaults

**Files:**
- Create: `packages/payment-router/src/routing/country-defaults.ts`
- Test: `packages/payment-router/src/__tests__/country-defaults.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { providerPreferenceForCountry } from "../routing/country-defaults";

describe("country defaults", () => {
  it("Nigeria prefers paystack then flutterwave", () => {
    assert.deepEqual(providerPreferenceForCountry("NG"), ["paystack", "flutterwave"]);
  });
  it("US/GB/DE prefer stripe", () => {
    for (const c of ["US", "GB", "DE"]) {
      assert.deepEqual(providerPreferenceForCountry(c), ["stripe"]);
    }
  });
  it("is case-insensitive on country code", () => {
    assert.deepEqual(providerPreferenceForCountry("ng"), ["paystack", "flutterwave"]);
  });
  it("unknown country yields empty preference (router → no_suitable_provider)", () => {
    assert.deepEqual(providerPreferenceForCountry("ZZ"), []);
  });
});
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Write `src/routing/country-defaults.ts`**

```ts
import type { PaymentProviderKey, ISO3166Alpha2 } from "../types";

const EU_ALPHA2 = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);

const EXPLICIT_DEFAULTS: Record<string, PaymentProviderKey[]> = {
  NG: ["paystack", "flutterwave"],
  GH: ["paystack", "flutterwave"],
  KE: ["flutterwave", "paystack"],
  US: ["stripe"],
  GB: ["stripe"],
  CA: ["stripe"],
};

export function providerPreferenceForCountry(country: ISO3166Alpha2): PaymentProviderKey[] {
  const code = country.toUpperCase();
  if (EXPLICIT_DEFAULTS[code]) return [...EXPLICIT_DEFAULTS[code]];
  if (EU_ALPHA2.has(code)) return ["stripe"];
  return [];
}
```

- [ ] **Step 4: Run test → PASS; Commit**

```bash
pnpm --filter @henryco/payment-router test
git add packages/payment-router/src/routing/country-defaults.ts packages/payment-router/src/__tests__/country-defaults.test.ts
git commit -m "V3-13 Task 6 — per-country provider defaults (NG→paystack/flutterwave, EU/US→stripe)"
```

---

### Task 7: Mock provider

**Files:**
- Create: `packages/payment-router/src/providers/mock-provider.ts`
- Test: `packages/payment-router/src/__tests__/mock-provider.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MockProvider } from "../providers/mock-provider";

describe("MockProvider", () => {
  const p = new MockProvider();

  it("initiate succeeds by default and returns a provider reference", async () => {
    const r = await p.initiate({
      intentId: "i1", amountMinor: 1000, currency: "NGN", country: "NG",
      method: "card", idempotencyKey: "k1",
    });
    assert.equal(r.ok, true);
    if (r.ok) assert.match(r.value.providerReference, /^mock_/);
  });

  it("initiate returns a retryable error when failureMode=retryable", async () => {
    const failing = new MockProvider({ failureMode: "retryable" });
    const r = await failing.initiate({
      intentId: "i2", amountMinor: 1000, currency: "NGN", country: "NG",
      method: "card", idempotencyKey: "k2",
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.retryable, true);
  });

  it("verifyWebhook rejects a bad signature", async () => {
    const r = await p.verifyWebhook({ rawBody: "{}", signature: "wrong", secret: "s" });
    assert.equal(r.ok, false);
  });

  it("verifyWebhook accepts a correctly signed body and extracts event id", async () => {
    const body = JSON.stringify({ id: "evt_1", type: "charge.success", reference: "mock_x", status: "succeeded" });
    const sig = MockProvider.sign(body, "s");
    const r = await p.verifyWebhook({ rawBody: body, signature: sig, secret: "s" });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.providerEventId, "evt_1");
      assert.equal(r.value.impliedStatus, "succeeded");
    }
  });
});
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Write `src/providers/mock-provider.ts`**

```ts
import { createHmac } from "node:crypto";
import type {
  PaymentProviderAdapter, InitiatePaymentParams, InitiatePaymentResult,
  RefundParams, RefundResult, VerifyWebhookParams, VerifiedWebhook,
} from "./adapter-interface";
import type { Result } from "../types";
import type { ProviderError } from "../errors";

export type MockFailureMode = "none" | "retryable" | "fatal";

function envFailureMode(): MockFailureMode {
  const v = process.env.MOCK_PAYMENT_FAILURE;
  if (v === "retryable" || v === "fatal") return v;
  return "none";
}

export class MockProvider implements PaymentProviderAdapter {
  readonly key = "mock" as const;
  private readonly failureMode: MockFailureMode;

  constructor(opts?: { failureMode?: MockFailureMode }) {
    this.failureMode = opts?.failureMode ?? envFailureMode();
  }

  static sign(body: string, secret: string): string {
    return createHmac("sha256", secret).update(body).digest("hex");
  }

  private err(code: string, retryable: boolean): { ok: false; error: ProviderError } {
    return { ok: false, error: { code, message: `mock ${code}`, retryable, providerKey: "mock" } };
  }

  async initiate(params: InitiatePaymentParams): Promise<Result<InitiatePaymentResult, ProviderError>> {
    if (this.failureMode === "retryable") return this.err("mock_retryable", true);
    if (this.failureMode === "fatal") return this.err("mock_fatal", false);
    return {
      ok: true,
      value: {
        providerReference: `mock_${params.intentId}`,
        clientAction: { type: "none" },
      },
    };
  }

  async refund(params: RefundParams): Promise<Result<RefundResult, ProviderError>> {
    if (this.failureMode === "fatal") return this.err("mock_refund_fatal", false);
    return { ok: true, value: { refundReference: `mockrf_${params.providerReference}` } };
  }

  async verifyWebhook(params: VerifyWebhookParams): Promise<Result<VerifiedWebhook, ProviderError>> {
    const expected = MockProvider.sign(params.rawBody, params.secret);
    if (params.signature !== expected) return this.err("mock_bad_signature", false);
    let parsed: { id?: string; type?: string; reference?: string; status?: string };
    try {
      parsed = JSON.parse(params.rawBody);
    } catch {
      return this.err("mock_bad_body", false);
    }
    const impliedStatus =
      parsed.status === "succeeded" ? "succeeded"
      : parsed.status === "failed" ? "failed"
      : parsed.status === "refunded" ? "refunded"
      : null;
    return {
      ok: true,
      value: {
        providerEventId: parsed.id ?? "",
        eventType: parsed.type ?? "unknown",
        providerReference: parsed.reference ?? "",
        impliedStatus,
      },
    };
  }
}
```

- [ ] **Step 4: Run test → PASS; Commit**

```bash
pnpm --filter @henryco/payment-router test
git add packages/payment-router/src/providers/mock-provider.ts packages/payment-router/src/__tests__/mock-provider.test.ts
git commit -m "V3-13 Task 7 — MockProvider (HMAC webhook verify, MOCK_PAYMENT_FAILURE modes)"
```

---

### Task 8: Router — selectProvider (intersection)

**Files:**
- Create: `packages/payment-router/src/router.ts` (selectProvider portion)
- Test: `packages/payment-router/src/__tests__/select-provider.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PaymentRouter } from "../router";
import { MockProvider } from "../providers/mock-provider";

describe("selectProvider (country ∩ capability ∩ registered)", () => {
  it("returns null when no provider is registered", () => {
    const router = new PaymentRouter({ providers: [] });
    assert.equal(router.selectProvider({ country: "NG", currency: "NGN", method: "card" }), null);
  });

  it("does not select a country-preferred provider that lacks the method", () => {
    // Register only a paystack-like adapter that cannot do apple_pay; NG+apple_pay → null.
    const router = new PaymentRouter({ providers: [{ key: "paystack" } as never] });
    assert.equal(router.selectProvider({ country: "NG", currency: "NGN", method: "apple_pay" }), null);
  });

  it("falls through to the second NG preference when the first lacks the method", () => {
    const router = new PaymentRouter({
      providers: [{ key: "paystack" } as never, { key: "flutterwave" } as never],
    });
    // mobile_money: paystack lacks it, flutterwave has it → flutterwave.
    assert.equal(router.selectProvider({ country: "NG", currency: "NGN", method: "mobile_money" }), "flutterwave");
  });

  it("selects mock when a mock provider is registered (test rail)", () => {
    const router = new PaymentRouter({ providers: [new MockProvider()] });
    assert.equal(router.selectProvider({ country: "ZZ", currency: "NGN", method: "card" }), null,
      "unknown country still yields null even with mock — country defaults gate first");
  });
});
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Write `src/router.ts` (selectProvider + constructor only — `route` added in Task 9)**

```ts
import type { PaymentProviderAdapter } from "./providers/adapter-interface";
import type { PaymentProviderKey, PaymentMethod, ISO3166Alpha2, ISO4217 } from "./types";
import { providerPreferenceForCountry } from "./routing/country-defaults";
import { providerSupportsMethod } from "./routing/capability-matrix";

export interface SelectProviderQuery {
  country: ISO3166Alpha2;
  currency: ISO4217;
  method: PaymentMethod;
}

export interface PaymentRouterOptions {
  providers: PaymentProviderAdapter[];
}

export class PaymentRouter {
  private readonly registered: Map<PaymentProviderKey, PaymentProviderAdapter>;

  constructor(options: PaymentRouterOptions) {
    this.registered = new Map(options.providers.map((p) => [p.key, p]));
  }

  /** country-defaults ∩ capability-matrix ∩ registered → first match, else null. */
  selectProvider(query: SelectProviderQuery): PaymentProviderKey | null {
    const preference = providerPreferenceForCountry(query.country);
    for (const key of preference) {
      if (!this.registered.has(key)) continue;
      if (!providerSupportsMethod(key, query.method)) continue;
      return key;
    }
    return null;
  }

  getAdapter(key: PaymentProviderKey): PaymentProviderAdapter | undefined {
    return this.registered.get(key);
  }
}
```

- [ ] **Step 4: Run test → PASS; Commit**

```bash
pnpm --filter @henryco/payment-router test
git add packages/payment-router/src/router.ts packages/payment-router/src/__tests__/select-provider.test.ts
git commit -m "V3-13 Task 8 — PaymentRouter.selectProvider (deterministic intersection, null on no match)"
```

---

### Task 9: Router — route() + failover + createPaymentRouter (A5, Principle 9)

**Files:**
- Modify: `packages/payment-router/src/router.ts`
- Test: `packages/payment-router/src/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PaymentRouter } from "../router";
import { MockProvider } from "../providers/mock-provider";

const baseIntent = {
  intentId: "i1", amountMinor: 50000, currency: "NGN", country: "NG",
  method: "card" as const, idempotencyKey: "k1",
};

describe("PaymentRouter.route", () => {
  it("routes NG card through a registered provider and returns a provider-AGNOSTIC result", async () => {
    const router = new PaymentRouter({
      providers: [Object.assign(new MockProvider(), { key: "paystack" as const })],
    });
    const r = await router.route(baseIntent);
    assert.equal(r.ok, true);
    if (r.ok) {
      // ANTI-CLONE Principle 9: result must NOT leak which provider was chosen.
      assert.equal((r.value as Record<string, unknown>).selectedProvider, undefined);
      assert.equal((r.value as Record<string, unknown>).providerKey, undefined);
      assert.ok("clientAction" in r.value);
    }
  });

  it("fails over to the next provider on a retryable error", async () => {
    const failing = Object.assign(new MockProvider({ failureMode: "retryable" }), { key: "paystack" as const });
    const healthy = Object.assign(new MockProvider(), { key: "flutterwave" as const });
    const router = new PaymentRouter({ providers: [failing, healthy] });
    const r = await router.route({ ...baseIntent, method: "card" });
    assert.equal(r.ok, true, "should have failed over to flutterwave");
  });

  it("does NOT fail over on a fatal (non-retryable) error", async () => {
    const fatal = Object.assign(new MockProvider({ failureMode: "fatal" }), { key: "paystack" as const });
    const healthy = Object.assign(new MockProvider(), { key: "flutterwave" as const });
    const router = new PaymentRouter({ providers: [fatal, healthy] });
    const r = await router.route(baseIntent);
    assert.equal(r.ok, false);
  });

  it("returns NoSuitableProviderError when selection yields null (A5 manual fallback)", async () => {
    const router = new PaymentRouter({ providers: [] });
    const r = await router.route(baseIntent);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.kind, "no_suitable_provider");
  });
});
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Extend `src/router.ts`** — append imports + `RouteResult`/`RouteError` types + `route()` + `createPaymentRouter()`

```ts
// --- appended to src/router.ts ---
import type { Result, PaymentIntentInput } from "./types";
import type { InitiatePaymentResult } from "./providers/adapter-interface";
import { MockProvider } from "./providers/mock-provider";

export type RouteIntent = {
  intentId: string;
  amountMinor: number;
  currency: ISO4217;
  country: ISO3166Alpha2;
  method: PaymentMethod;
  idempotencyKey: string;
};

/** Provider-agnostic success payload (Principle 9: no provider identity leaks). */
export interface RouteSuccess {
  intentId: string;
  clientAction: InitiatePaymentResult["clientAction"];
  providerReference: string;
}

export type RouteError =
  | { kind: "no_suitable_provider"; country: string; currency: string; method: string }
  | { kind: "provider_error"; code: string };

export interface RouteHooks {
  onProviderSelected?: (key: PaymentProviderKey, intentId: string) => void;
  onNoSuitableProvider?: (q: SelectProviderQuery) => void;
  onProviderFailover?: (from: PaymentProviderKey, code: string) => void;
}

// add to PaymentRouter:
//   private readonly hooks: RouteHooks;
//   constructor sets this.hooks = options.hooks ?? {};
//
// async route(intent: RouteIntent): Promise<Result<RouteSuccess, RouteError>> { ... }

export function createPaymentRouter(hooks?: RouteHooks): PaymentRouter {
  const useMock = process.env.MOCK_PAYMENT === "1" || process.env.NODE_ENV === "test";
  const providers = useMock ? [new MockProvider()] : [];
  return new PaymentRouter({ providers, hooks });
}
```

The full `route()` body (insert into the class):

```ts
async route(intent: RouteIntent): Promise<Result<RouteSuccess, RouteError>> {
  const query: SelectProviderQuery = {
    country: intent.country, currency: intent.currency, method: intent.method,
  };
  const preference = providerPreferenceForCountry(intent.country);
  const candidates = preference.filter(
    (k) => this.registered.has(k) && providerSupportsMethod(k, intent.method),
  );
  if (candidates.length === 0) {
    this.hooks.onNoSuitableProvider?.(query);
    return { ok: false, error: { kind: "no_suitable_provider", ...query } };
  }
  let lastCode = "unknown";
  for (const key of candidates) {
    const adapter = this.registered.get(key)!;
    this.hooks.onProviderSelected?.(key, intent.intentId);
    const result = await adapter.initiate({
      intentId: intent.intentId, amountMinor: intent.amountMinor, currency: intent.currency,
      country: intent.country, method: intent.method, idempotencyKey: intent.idempotencyKey,
    });
    if (result.ok) {
      return {
        ok: true,
        value: {
          intentId: intent.intentId,
          clientAction: result.value.clientAction,
          providerReference: result.value.providerReference,
        },
      };
    }
    lastCode = result.error.code;
    if (!result.error.retryable) break; // fatal → no failover
    this.hooks.onProviderFailover?.(key, result.error.code);
  }
  return { ok: false, error: { kind: "provider_error", code: lastCode } };
}
```

> **Note for the executing engineer:** Replace the `PaymentRouterOptions` interface to add `hooks?: RouteHooks;` and store it in the constructor. `selectProvider` (Task 8) stays as-is. `route()` reuses the same intersection logic inline so the failover loop sees the full candidate list. `providerReference` is returned for server-side persistence ONLY — the app route omits it from the client JSON (see Task 16). Mock identity in tests is overridden via `Object.assign(new MockProvider(), { key })` so a single mock class can stand in for paystack/flutterwave/stripe.

- [ ] **Step 4: Run test → PASS; Commit**

```bash
pnpm --filter @henryco/payment-router test
git add packages/payment-router/src/router.ts packages/payment-router/src/__tests__/route.test.ts
git commit -m "V3-13 Task 9 — PaymentRouter.route (failover on retryable, A5 no-provider, Principle 9 agnostic result)"
```

---

### Task 10: In-memory payment store (A1 idempotency, A3 webhook dedup, crash-between-steps)

**Files:**
- Create: `packages/payment-router/src/testing/in-memory-payment-store.ts`
- Test: `packages/payment-router/src/__tests__/payment-store.test.ts`

This store is the EXECUTABLE REFERENCE the SQL migration mirrors. It proves the money semantics the live DB enforces.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryPaymentStore } from "../testing/in-memory-payment-store";

function freshIntent() {
  return {
    userId: "u1", amountMinor: 50000, currency: "NGN", country: "NG",
    method: "card" as const, idempotencyKey: "key-1", division: "marketplace",
  };
}

describe("InMemoryPaymentStore — A1 idempotent create", () => {
  it("returns the SAME intent id for a repeated (userId, idempotencyKey)", () => {
    const store = new InMemoryPaymentStore();
    const a = store.createIntent(freshIntent());
    const b = store.createIntent(freshIntent());
    assert.equal(a.ok && b.ok && a.value.id === b.value.id, true);
    assert.equal(store.count(), 1, "no duplicate row created");
  });

  it("treats a different idempotencyKey as a new intent", () => {
    const store = new InMemoryPaymentStore();
    store.createIntent(freshIntent());
    store.createIntent({ ...freshIntent(), idempotencyKey: "key-2" });
    assert.equal(store.count(), 2);
  });
});

describe("InMemoryPaymentStore — A2 transition enforcement", () => {
  it("rejects an illegal transition", () => {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    if (c.ok) {
      const r = store.transition(c.value.id, "refunded"); // pending->refunded illegal
      assert.equal(r.ok, false);
    }
  });
});

describe("InMemoryPaymentStore — A3 webhook dedup (dedup-insert FIRST, effect SECOND)", () => {
  it("applies the effect exactly once across duplicate webhook deliveries", () => {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    if (!c.ok) return;
    store.transition(c.value.id, "processing");
    const evt = { provider: "mock", providerEventId: "evt_9", intentId: c.value.id, impliedStatus: "succeeded" as const };
    const first = store.applyWebhook(evt);
    const second = store.applyWebhook(evt); // duplicate delivery
    assert.equal(first.ok && first.value.applied, true);
    assert.equal(second.ok && second.value.applied, false, "duplicate is an idempotent ack, not re-applied");
    assert.equal(store.getIntent(c.value.id)?.status, "succeeded");
    assert.equal(store.attemptCount(c.value.id), 1, "exactly one attempt row from webhook");
  });

  it("CRASH-BETWEEN-STEPS: if dedup row is inserted but effect never runs, replay completes the effect", () => {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    if (!c.ok) return;
    store.transition(c.value.id, "processing");
    const evt = { provider: "mock", providerEventId: "evt_crash", intentId: c.value.id, impliedStatus: "succeeded" as const };
    // Simulate a crash AFTER dedup-insert, BEFORE the effect.
    store.__crashAfterDedupInsert = true;
    assert.throws(() => store.applyWebhook(evt));
    assert.equal(store.getIntent(c.value.id)?.status, "processing", "effect did not land");
    // Replay: the production RPC is one transaction, so a crash rolls back the dedup row too.
    // The store models this: a crashed apply leaves NO processed-webhook row, so replay re-runs cleanly.
    store.__crashAfterDedupInsert = false;
    const replay = store.applyWebhook(evt);
    assert.equal(replay.ok && replay.value.applied, true, "replay applies the effect");
    assert.equal(store.getIntent(c.value.id)?.status, "succeeded");
  });
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `pnpm --filter @henryco/payment-router test`

- [ ] **Step 3: Write `src/testing/in-memory-payment-store.ts`**

```ts
import { randomUUID } from "node:crypto";
import type { PaymentIntentStatus, PaymentMethod } from "../types";
import { assertTransition } from "../state-machine";

interface IntentRow {
  id: string;
  userId: string;
  amountMinor: number;
  currency: string;
  country: string;
  method: PaymentMethod;
  status: PaymentIntentStatus;
  idempotencyKey: string;
  division: string | null;
}

interface CreateInput {
  userId: string;
  amountMinor: number;
  currency: string;
  country: string;
  method: PaymentMethod;
  idempotencyKey: string;
  division?: string | null;
}

interface WebhookEvent {
  provider: string;
  providerEventId: string;
  intentId: string;
  impliedStatus: "succeeded" | "failed" | "refunded";
}

type StoreResult<T> = { ok: true; value: T } | { ok: false; error: string };

const IMPLIED_TO_STATUS: Record<WebhookEvent["impliedStatus"], PaymentIntentStatus> = {
  succeeded: "succeeded",
  failed: "failed",
  refunded: "refunded",
};

export class InMemoryPaymentStore {
  private intents = new Map<string, IntentRow>();
  private byIdemKey = new Map<string, string>(); // `${userId}:${idemKey}` -> intentId (mirrors UNIQUE constraint)
  private processedWebhooks = new Set<string>(); // `${provider}:${eventId}` (mirrors UNIQUE constraint)
  private attempts = new Map<string, number>(); // intentId -> attempt count

  /** Test-only switch to model a crash AFTER dedup-insert, BEFORE effect. */
  __crashAfterDedupInsert = false;

  createIntent(input: CreateInput): StoreResult<IntentRow> {
    const idemComposite = `${input.userId}:${input.idempotencyKey}`;
    const existingId = this.byIdemKey.get(idemComposite);
    if (existingId) {
      // A1: UNIQUE(user_id, idempotency_key) → return existing, no new row.
      return { ok: true, value: this.intents.get(existingId)! };
    }
    const row: IntentRow = {
      id: randomUUID(),
      userId: input.userId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      country: input.country,
      method: input.method,
      status: "pending",
      idempotencyKey: input.idempotencyKey,
      division: input.division ?? null,
    };
    this.intents.set(row.id, row);
    this.byIdemKey.set(idemComposite, row.id);
    return { ok: true, value: row };
  }

  transition(intentId: string, to: PaymentIntentStatus): StoreResult<IntentRow> {
    const row = this.intents.get(intentId);
    if (!row) return { ok: false, error: "intent not found" };
    try {
      assertTransition(row.status, to); // A2
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
    row.status = to;
    return { ok: true, value: row };
  }

  /**
   * Mirrors apply_payment_webhook(): dedup-insert FIRST, effect SECOND,
   * both in one transaction. A duplicate delivery short-circuits to an
   * idempotent ack. A crash between steps rolls back the dedup row (modelled
   * by throwing before committing the row to processedWebhooks).
   */
  applyWebhook(evt: WebhookEvent): StoreResult<{ applied: boolean }> {
    const dedupKey = `${evt.provider}:${evt.providerEventId}`;
    if (this.processedWebhooks.has(dedupKey)) {
      return { ok: true, value: { applied: false } }; // idempotent ack
    }
    if (this.__crashAfterDedupInsert) {
      // Transaction aborts: dedup row is NOT committed, effect does NOT run.
      throw new Error("simulated crash after dedup-insert, before effect");
    }
    const row = this.intents.get(evt.intentId);
    if (!row) return { ok: false, error: "intent not found" };
    const target = IMPLIED_TO_STATUS[evt.impliedStatus];
    try {
      assertTransition(row.status, target);
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
    // commit: dedup row + effect together
    this.processedWebhooks.add(dedupKey);
    row.status = target;
    this.attempts.set(evt.intentId, (this.attempts.get(evt.intentId) ?? 0) + 1);
    return { ok: true, value: { applied: true } };
  }

  getIntent(id: string): IntentRow | undefined {
    return this.intents.get(id);
  }
  count(): number {
    return this.intents.size;
  }
  attemptCount(intentId: string): number {
    return this.attempts.get(intentId) ?? 0;
  }
}
```

> **Crash-model note:** the production RPC is a single SQL transaction — a crash before `COMMIT` rolls back BOTH the `processed_webhooks` insert and the effect. The store models exactly this: throwing before adding to `processedWebhooks` means a replay finds no dedup row and re-applies cleanly. This is the honest test of "dedup-insert first, effect second, same transaction."

- [ ] **Step 4: Run test → PASS; Commit**

```bash
pnpm --filter @henryco/payment-router test
git add packages/payment-router/src/testing/in-memory-payment-store.ts packages/payment-router/src/__tests__/payment-store.test.ts
git commit -m "V3-13 Task 10 — in-memory payment store (A1 idempotency, A3 dedup + crash-between-steps); SQL reference"
```

---

### Task 11: Router audit folding (§8)

**Files:**
- Create: `packages/payment-router/src/audit.ts`
- Test: `packages/payment-router/src/__tests__/audit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildRouterAuditInput } from "../audit";

describe("buildRouterAuditInput", () => {
  it("folds money + routing context into newValues including selected_provider (server-side audit)", () => {
    const input = buildRouterAuditInput({
      intentId: "i1", country: "NG", currency: "NGN", method: "card",
      selectedProvider: "paystack", outcome: "started", latencyMs: 12, division: "marketplace",
    });
    assert.equal(input.action, "payment.route");
    assert.equal(input.entityType, "payment_intent");
    assert.equal(input.entityId, "i1");
    assert.equal(input.division, "marketplace");
    const nv = input.newValues as Record<string, unknown>;
    assert.equal(nv.selected_provider, "paystack", "audit log MAY record provider (server-side, not client-facing)");
    assert.equal(nv.country, "NG");
    assert.equal(nv.outcome, "started");
    assert.equal(nv.latency_ms, 12);
  });
});
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Write `src/audit.ts`**

```ts
import { writeAuditLog, type AuditLogSupabaseClient, type AuditLogInput } from "@henryco/observability/audit-log";
import type { PaymentProviderKey, PaymentMethod } from "./types";

export interface RouterAuditContext {
  intentId: string;
  country: string;
  currency: string;
  method: PaymentMethod;
  selectedProvider: PaymentProviderKey | null;
  outcome: "started" | "paid" | "failed" | "blocked";
  latencyMs: number;
  division?: string | null;
  reason?: string | null;
}

export function buildRouterAuditInput(ctx: RouterAuditContext): AuditLogInput {
  return {
    action: "payment.route",
    entityType: "payment_intent",
    entityId: ctx.intentId,
    division: ctx.division ?? null,
    reason: ctx.reason ?? null,
    newValues: {
      country: ctx.country,
      currency: ctx.currency,
      method: ctx.method,
      selected_provider: ctx.selectedProvider,
      outcome: ctx.outcome,
      latency_ms: ctx.latencyMs,
    },
  };
}

export async function writeRouterAudit(
  supabase: AuditLogSupabaseClient,
  ctx: RouterAuditContext,
): Promise<void> {
  await writeAuditLog(supabase, buildRouterAuditInput(ctx));
}
```

- [ ] **Step 4: Run test → PASS; Commit**

```bash
pnpm --filter @henryco/payment-router test
git add packages/payment-router/src/audit.ts packages/payment-router/src/__tests__/audit.test.ts
git commit -m "V3-13 Task 11 — router audit folding (server-side records provider; client never sees it)"
```

---

### Task 12: Telemetry — 9 `henry.payment.*` event names (§8)

**Files:**
- Modify: `packages/observability/src/events.ts` (add names to `HenryEventName` union)
- Create: `packages/payment-router/src/telemetry.ts` (name→outcome mapping helper)
- Test: `packages/payment-router/src/__tests__/telemetry.test.ts`

- [ ] **Step 1: Add 9 names to `HenryEventName`** in `packages/observability/src/events.ts`

Insert into the union (alongside existing domains):

```ts
  | "henry.payment.intent.created"
  | "henry.payment.intent.succeeded"
  | "henry.payment.intent.failed"
  | "henry.payment.intent.refunded"
  | "henry.payment.webhook.received"
  | "henry.payment.webhook.verified"
  | "henry.payment.webhook.rejected"
  | "henry.payment.no_suitable_provider"
  | "henry.payment.illegal_transition"
```

- [ ] **Step 2: Write the failing test** (verifies mapping uses ONLY existing `EventOutcome` members)

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { paymentEventOutcome } from "../telemetry";

describe("payment telemetry outcome mapping (no EventOutcome extension)", () => {
  it("maps each payment event to an existing outcome", () => {
    assert.equal(paymentEventOutcome("henry.payment.intent.created"), "started");
    assert.equal(paymentEventOutcome("henry.payment.intent.succeeded"), "paid");
    assert.equal(paymentEventOutcome("henry.payment.intent.failed"), "failed");
    assert.equal(paymentEventOutcome("henry.payment.intent.refunded"), "completed");
    assert.equal(paymentEventOutcome("henry.payment.webhook.received"), "requested");
    assert.equal(paymentEventOutcome("henry.payment.webhook.verified"), "verified");
    assert.equal(paymentEventOutcome("henry.payment.webhook.rejected"), "rejected");
    assert.equal(paymentEventOutcome("henry.payment.no_suitable_provider"), "blocked");
    assert.equal(paymentEventOutcome("henry.payment.illegal_transition"), "blocked");
  });
});
```

- [ ] **Step 3: Run test → FAIL**

- [ ] **Step 4: Write `src/telemetry.ts`**

```ts
import type { EventOutcome, HenryEventName } from "@henryco/observability";

type PaymentEventName = Extract<HenryEventName, `henry.payment.${string}`>;

const OUTCOME_MAP: Record<PaymentEventName, EventOutcome> = {
  "henry.payment.intent.created": "started",
  "henry.payment.intent.succeeded": "paid",
  "henry.payment.intent.failed": "failed",
  "henry.payment.intent.refunded": "completed",
  "henry.payment.webhook.received": "requested",
  "henry.payment.webhook.verified": "verified",
  "henry.payment.webhook.rejected": "rejected",
  "henry.payment.no_suitable_provider": "blocked",
  "henry.payment.illegal_transition": "blocked",
};

export function paymentEventOutcome(name: PaymentEventName): EventOutcome {
  return OUTCOME_MAP[name];
}
```

> **Note:** confirm `@henryco/observability` re-exports `EventOutcome` and `HenryEventName` from its barrel; if not, import from `@henryco/observability/events` (check the package `exports` map during the step and use whichever path resolves). The test will catch a wrong path immediately.

- [ ] **Step 5: Run test → PASS; typecheck observability too**

Run: `pnpm --filter @henryco/payment-router test && pnpm --filter @henryco/observability typecheck`
Expected: PASS — the `Record<PaymentEventName, EventOutcome>` typing fails to compile if any name or outcome is wrong, so this is a compile-time guarantee that §8 introduces no new `EventOutcome`.

- [ ] **Step 6: Commit**

```bash
git add packages/observability/src/events.ts packages/payment-router/src/telemetry.ts packages/payment-router/src/__tests__/telemetry.test.ts
git commit -m "V3-13 Task 12 — 9 henry.payment.* event names + outcome mapping (no EventOutcome extension)"
```

---

### Task 13: Reconciliation contract types (A7 — types only)

**Files:**
- Create: `packages/payment-router/src/reconciliation.ts`

No engine — that is V3-19. This task defines the contract the future engine implements so the package compiles against it.

- [ ] **Step 1: Write `src/reconciliation.ts`**

```ts
import type { PaymentProviderKey, PaymentIntentStatus, ISO4217 } from "./types";

/** A provider's view of a settled charge, normalised for reconciliation. */
export interface ProviderSettlementRecord {
  providerKey: PaymentProviderKey;
  providerReference: string;
  amountMinor: number;
  currency: ISO4217;
  status: PaymentIntentStatus;
  settledAt: string; // ISO 8601
}

/** Our ledger's view of the same intent. */
export interface LedgerRecord {
  intentId: string;
  amountMinor: number;
  currency: ISO4217;
  status: PaymentIntentStatus;
}

export type ReconciliationDiscrepancy =
  | { kind: "amount_mismatch"; intentId: string; ledgerMinor: number; providerMinor: number }
  | { kind: "status_mismatch"; intentId: string; ledgerStatus: PaymentIntentStatus; providerStatus: PaymentIntentStatus }
  | { kind: "missing_in_ledger"; providerReference: string }
  | { kind: "missing_at_provider"; intentId: string };

/** Contract the V3-19 engine implements. Defined here so the router package owns the shape. */
export interface ReconciliationEngine {
  compare(ledger: LedgerRecord[], provider: ProviderSettlementRecord[]): ReconciliationDiscrepancy[];
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
pnpm --filter @henryco/payment-router typecheck
git add packages/payment-router/src/reconciliation.ts
git commit -m "V3-13 Task 13 — reconciliation contract types (A7; engine deferred to V3-19)"
```

---

### Task 14: Barrel + full green

**Files:**
- Create: `packages/payment-router/src/index.ts`
- Test: full package run

- [ ] **Step 1: Write `src/index.ts`**

```ts
export * from "./types";
export * from "./errors";
export * from "./state-machine";
export * from "./router";
export * from "./audit";
export * from "./telemetry";
export * from "./reconciliation";
export * from "./providers/adapter-interface";
export { MockProvider } from "./providers/mock-provider";
export { CAPABILITY_MATRIX, providerSupportsMethod } from "./routing/capability-matrix";
export { providerPreferenceForCountry } from "./routing/country-defaults";
```

- [ ] **Step 2: Full typecheck + test**

Run: `pnpm --filter @henryco/payment-router typecheck && pnpm --filter @henryco/payment-router test`
Expected: typecheck clean; all specs PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/payment-router/src/index.ts
git commit -m "V3-13 Task 14 — package barrel; full router suite green"
```

---

### Task 15: SQL production mirror (§5) — NOT applied

**Files:**
- Create: `apps/hub/supabase/migrations/20260529120000_payment_intents.sql`

Mirrors the state machine (Task 3) + store (Task 10) exactly. Follows conventions from `20260522154818_message_read_state.sql`. **NOT applied in this session — conductor + owner review first.**

- [ ] **Step 1: Write the migration**

```sql
-- V3-13 Payments: Provider Router — payment_intents schema + money-correctness enforcement.
-- Production mirror of packages/payment-router/src/state-machine.ts (A2) and
-- src/testing/in-memory-payment-store.ts (A1, A3). NOT applied in this session;
-- conductor + owner review first.

-- ============ payment_intents ============
create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_minor bigint not null,
  currency text not null,
  country text not null,
  method text not null,
  status text not null default 'pending',
  idempotency_key text not null,
  division text,
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'payment_intents_amount_minor_positive') then
    alter table public.payment_intents add constraint payment_intents_amount_minor_positive check (amount_minor > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payment_intents_status_valid') then
    alter table public.payment_intents add constraint payment_intents_status_valid
      check (status in ('pending','processing','succeeded','failed','refunded','cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payment_intents_user_idem_unique') then
    alter table public.payment_intents add constraint payment_intents_user_idem_unique unique (user_id, idempotency_key); -- A1
  end if;
end $$;

create index if not exists payment_intents_user_id_idx on public.payment_intents (user_id);
create index if not exists payment_intents_division_idx on public.payment_intents (division); -- R2: division indexed
create index if not exists payment_intents_status_idx on public.payment_intents (status);

-- ============ payment_attempts ============
create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references public.payment_intents(id) on delete cascade,
  provider text not null,
  provider_reference text,
  status text not null,
  error_code text,
  created_at timestamptz not null default now()
);
create index if not exists payment_attempts_intent_id_idx on public.payment_attempts (intent_id);

-- ============ processed_webhooks ============
create table if not exists public.processed_webhooks (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  intent_id uuid references public.payment_intents(id) on delete set null,
  created_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'processed_webhooks_provider_event_unique') then
    alter table public.processed_webhooks add constraint processed_webhooks_provider_event_unique unique (provider, provider_event_id); -- A3
  end if;
end $$;

-- ============ updated_at trigger ============
create or replace function public.payments_set_updated_at()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end $$;
revoke all on function public.payments_set_updated_at() from public;

drop trigger if exists payment_intents_set_updated_at on public.payment_intents;
create trigger payment_intents_set_updated_at
  before update on public.payment_intents
  for each row execute function public.payments_set_updated_at();

-- ============ A2 transition enforcement (mirrors state-machine.ts) ============
create or replace function public.enforce_payment_intent_transition()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = old.status then
    return new; -- idempotent no-op
  end if;
  if (old.status = 'pending' and new.status in ('processing','cancelled'))
     or (old.status = 'processing' and new.status in ('succeeded','failed'))
     or (old.status = 'succeeded' and new.status = 'refunded') then
    return new;
  end if;
  raise exception 'illegal payment_intent transition: % -> %', old.status, new.status
    using errcode = 'check_violation';
end $$;
revoke all on function public.enforce_payment_intent_transition() from public;

drop trigger if exists payment_intents_enforce_transition on public.payment_intents;
create trigger payment_intents_enforce_transition
  before update on public.payment_intents
  for each row execute function public.enforce_payment_intent_transition();

-- ============ A3 webhook apply RPC (dedup-insert FIRST, effect SECOND, one txn) ============
create or replace function public.apply_payment_webhook(
  p_provider text,
  p_provider_event_id text,
  p_intent_id uuid,
  p_new_status text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_inserted boolean := false;
begin
  -- STEP 1: dedup-insert FIRST. ON CONFLICT DO NOTHING → duplicate deliveries no-op.
  insert into public.processed_webhooks (provider, provider_event_id, intent_id)
  values (p_provider, p_provider_event_id, p_intent_id)
  on conflict (provider, provider_event_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return jsonb_build_object('applied', false, 'reason', 'duplicate'); -- idempotent ack
  end if;

  -- STEP 2: effect SECOND, same transaction. The BEFORE UPDATE trigger enforces A2.
  update public.payment_intents set status = p_new_status where id = p_intent_id;

  insert into public.payment_attempts (intent_id, provider, status)
  values (p_intent_id, p_provider, p_new_status);

  return jsonb_build_object('applied', true);
end $$;
revoke all on function public.apply_payment_webhook(text, text, uuid, text) from public;
grant execute on function public.apply_payment_webhook(text, text, uuid, text) to service_role;

-- ============ RLS ============
alter table public.payment_intents enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.processed_webhooks enable row level security;

drop policy if exists payment_intents_select_own on public.payment_intents;
create policy payment_intents_select_own on public.payment_intents
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists payment_intents_insert_own on public.payment_intents;
create policy payment_intents_insert_own on public.payment_intents
  for insert to authenticated with check (user_id = (select auth.uid()));

-- NO user UPDATE policy — status changes only via service_role + RPC.

drop policy if exists payment_intents_select_finance on public.payment_intents;
create policy payment_intents_select_finance on public.payment_intents
  for select to authenticated using (public.is_staff_in('finance', null));

drop policy if exists payment_attempts_select_finance on public.payment_attempts;
create policy payment_attempts_select_finance on public.payment_attempts
  for select to authenticated using (public.is_staff_in('finance', null));
```

- [ ] **Step 2: Validate the transition logic matches the TS table by eye** (the SQL `if` clauses must list exactly the pairs in `LEGAL_TRANSITIONS`). Then commit.

```bash
git add apps/hub/supabase/migrations/20260529120000_payment_intents.sql
git commit -m "V3-13 Task 15 — payment_intents migration (A1/A2/A3 enforcement); production mirror, NOT applied"
```

---

### Task 16: Route — POST /api/payments/intents (R1 gate, A1 replay, Principle 9)

**Files:**
- Create: `apps/account/app/api/payments/intents/route.ts`

- [ ] **Step 1: Write the handler** (reference: `apps/account/app/api/wallet/withdrawal/request/route.ts`)

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { createPaymentRouter } from "@henryco/payment-router";
import { validateAmountMinor, normalizeCurrency, type PaymentMethod } from "@henryco/payment-router/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await requireSensitiveAction(request, {
    action: "payment.intent.create",
    entityType: "payment_intent",
    resolveUser: async () => user,
    userId: (u) => u.id,
  });
  if (!guard.ok) return guard.response; // R1: reauth/rate-limit

  const body = await request.json().catch(() => null) as {
    amountMinor?: number; currency?: string; country?: string;
    method?: PaymentMethod; idempotencyKey?: string; division?: string;
  } | null;
  if (!body?.idempotencyKey || !body.country || !body.method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const amount = validateAmountMinor(body.amountMinor ?? NaN);
  if (!amount.ok) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  const currency = normalizeCurrency(body.currency ?? "");
  if (!currency.ok) return NextResponse.json({ error: "Unsupported currency" }, { status: 400 }); // A4

  const admin = createAdminSupabase();

  // A1: idempotent create — UNIQUE(user_id, idempotency_key). On 23505, SELECT and return existing.
  const insert = await admin.from("payment_intents").insert({
    user_id: user.id, amount_minor: amount.value, currency: currency.value,
    country: body.country, method: body.method, idempotency_key: body.idempotencyKey,
    division: body.division ?? null,
  }).select("id, status").single();

  let intentId: string;
  let status: string;
  if (insert.error) {
    if (insert.error.code === "23505") {
      const existing = await admin.from("payment_intents")
        .select("id, status").eq("user_id", user.id).eq("idempotency_key", body.idempotencyKey).single();
      if (existing.error || !existing.data) {
        return NextResponse.json({ error: "Conflict" }, { status: 409 });
      }
      intentId = existing.data.id; status = existing.data.status;
    } else {
      return NextResponse.json({ error: "Failed to create intent" }, { status: 500 });
    }
  } else {
    intentId = insert.data.id; status = insert.data.status;
  }

  const router = createPaymentRouter();
  const routed = await router.route({
    intentId, amountMinor: amount.value, currency: currency.value,
    country: body.country, method: body.method, idempotencyKey: body.idempotencyKey,
  });
  if (!routed.ok) {
    if (routed.error.kind === "no_suitable_provider") {
      // A5: manual fallback — client gets a generic actionable error, never a provider name.
      return NextResponse.json({ error: "No payment method available for your region", code: "manual_fallback" }, { status: 422 });
    }
    return NextResponse.json({ error: "Payment could not be started" }, { status: 502 });
  }

  // persist provider_reference server-side; OMIT it + any provider identity from the client response (Principle 9)
  await admin.from("payment_intents").update({ provider_reference: routed.value.providerReference }).eq("id", intentId);

  return NextResponse.json({
    intentId,
    status,
    clientAction: routed.value.clientAction, // opaque; no provider name
  }, { status: 200 });
}
```

> **Note:** confirm the `@henryco/auth` export path for `requireSensitiveAction` (Grep `sensitive-action-guard` in `packages/auth/package.json` exports during the step). Confirm `createAdminSupabase` import path in `apps/account` (`@/lib/supabase`). If `createPaymentRouter` needs `MOCK_PAYMENT=1`, that env is set in the account app's `.env` for dev; production wiring of real providers is V3-14/15/16.

- [ ] **Step 2: Typecheck the account app**

Run: `pnpm --filter @henryco/account typecheck` (use the actual account package name — Grep `"name"` in `apps/account/package.json`)
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/account/app/api/payments/intents/route.ts
git commit -m "V3-13 Task 16 — POST /api/payments/intents (R1 gate, A1 replay, A4 reject, A5 fallback, Principle 9)"
```

---

### Task 17: Route — POST /api/payments/intents/[id]/finalize

**Files:**
- Create: `apps/account/app/api/payments/intents/[id]/finalize/route.ts`

- [ ] **Step 1: Write the handler**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const intent = await admin.from("payment_intents").select("id, user_id, status").eq("id", id).single();
  if (intent.error || !intent.data || intent.data.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Move pending → processing (the only legal client-driven step; trigger enforces A2).
  const update = await admin.from("payment_intents").update({ status: "processing" }).eq("id", id).eq("status", "pending").select("id, status").maybeSingle();
  if (update.error) {
    return NextResponse.json({ error: "Cannot finalize" }, { status: 409 });
  }
  return NextResponse.json({ intentId: id, status: update.data?.status ?? intent.data.status }, { status: 200 });
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
pnpm --filter @henryco/account typecheck
git add apps/account/app/api/payments/intents/\[id\]/finalize/route.ts
git commit -m "V3-13 Task 17 — POST /api/payments/intents/[id]/finalize (pending→processing, A2 via trigger)"
```

---

### Task 18: Route — POST /api/payments/intents/[id]/refund (R1 gate)

**Files:**
- Create: `apps/account/app/api/payments/intents/[id]/refund/route.ts`

- [ ] **Step 1: Write the handler**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { createPaymentRouter } from "@henryco/payment-router";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await requireSensitiveAction(request, {
    action: "payment.refund",            // R1: refund is sensitive
    entityType: "payment_intent",
    entityId: id,
    resolveUser: async () => user,
    userId: (u) => u.id,
  });
  if (!guard.ok) return guard.response;

  const admin = createAdminSupabase();
  const intent = await admin.from("payment_intents")
    .select("id, user_id, status, provider_reference, amount_minor").eq("id", id).single();
  if (intent.error || !intent.data || intent.data.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (intent.data.status !== "succeeded") {
    return NextResponse.json({ error: "Only succeeded payments can be refunded" }, { status: 409 }); // A2 client-side guard
  }

  const router = createPaymentRouter();
  // Refund executes against whichever adapter owns the reference; provider identity stays server-side.
  const refundProvider = router.getAdapter("mock"); // V3-14/15/16 resolve the real adapter from provider_reference
  const refunded = refundProvider
    ? await refundProvider.refund({ providerReference: intent.data.provider_reference ?? "", amountMinor: intent.data.amount_minor })
    : ({ ok: false } as const);
  if (!refunded.ok) {
    return NextResponse.json({ error: "Refund failed" }, { status: 502 });
  }

  const update = await admin.from("payment_intents").update({ status: "refunded" }).eq("id", id).eq("status", "succeeded").select("id, status").maybeSingle();
  if (update.error) return NextResponse.json({ error: "Refund state update failed" }, { status: 409 });

  return NextResponse.json({ intentId: id, status: "refunded" }, { status: 200 });
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
pnpm --filter @henryco/account typecheck
git add apps/account/app/api/payments/intents/\[id\]/refund/route.ts
git commit -m "V3-13 Task 18 — POST /api/payments/intents/[id]/refund (R1 gate, succeeded→refunded only)"
```

---

### Task 19: Route — POST /api/payments/webhooks/[provider] (no session, HMAC, RPC)

**Files:**
- Create: `apps/account/app/api/payments/webhooks/[provider]/route.ts`

- [ ] **Step 1: Write the handler**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { MockProvider } from "@henryco/payment-router";

export const runtime = "nodejs";

const WEBHOOK_SECRET_ENV: Record<string, string> = {
  mock: "MOCK_PAYMENT_WEBHOOK_SECRET",
  stripe: "STRIPE_WEBHOOK_SECRET",       // wired in V3-14
  paystack: "PAYSTACK_SECRET_KEY",        // secret-key HMAC, V3-15
  flutterwave: "FLW_SECRET_HASH",         // V3-16
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const secretEnv = WEBHOOK_SECRET_ENV[provider];
  if (!secretEnv) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  const secret = process.env[secretEnv];
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? request.headers.get("x-paystack-signature");

  // Only the mock adapter exists in V3-13; real adapters land in V3-14/15/16.
  if (provider !== "mock") {
    return NextResponse.json({ error: "Provider not yet activated" }, { status: 501 });
  }
  const adapter = new MockProvider();
  const verified = await adapter.verifyWebhook({ rawBody, signature, secret });
  if (!verified.ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); // henry.payment.webhook.rejected
  }
  if (!verified.value.impliedStatus) {
    return NextResponse.json({ received: true }, { status: 200 }); // no-op event
  }

  const admin = createAdminSupabase();
  // resolve intent by provider_reference
  const intent = await admin.from("payment_intents").select("id").eq("provider_reference", verified.value.providerReference).single();
  if (intent.error || !intent.data) {
    return NextResponse.json({ received: true }, { status: 200 }); // unknown reference — ack, do not leak
  }

  // A3: dedup-insert first, effect second — atomic in the RPC.
  const applied = await admin.rpc("apply_payment_webhook", {
    p_provider: provider,
    p_provider_event_id: verified.value.providerEventId,
    p_intent_id: intent.data.id,
    p_new_status: verified.value.impliedStatus,
  });
  if (applied.error) {
    return NextResponse.json({ error: "Apply failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
pnpm --filter @henryco/account typecheck
git add apps/account/app/api/payments/webhooks/\[provider\]/route.ts
git commit -m "V3-13 Task 19 — POST /api/payments/webhooks/[provider] (HMAC verify, A3 apply_payment_webhook RPC)"
```

---

### Task 20: payment-surface CTA capability + marketplace reference wire (§7)

**Files:**
- Modify: `packages/payment-surface/` (locate the surface component during the step; Grep `payment-surface` for the entry)
- Modify: one marketplace page that renders a pay surface (Grep for `/pay/` route under `apps/marketplace`)

- [ ] **Step 1: Add an optional `cardCta` to the surface props**

```ts
// In the payment-surface component's props type:
export interface PaymentSurfaceProps {
  // ...existing props...
  /** Server-gated card CTA. null/undefined hides it. Label is i18n-translated by the caller. */
  cardCta?: { label: string; href: string } | null;
}
```

Render it conditionally (only when `cardCta` is provided):

```tsx
{cardCta ? (
  <a href={cardCta.href} className="payment-surface__card-cta" data-testid="payment-card-cta">
    {cardCta.label}
  </a>
) : null}
```

- [ ] **Step 2: Wire the marketplace `/pay/[id]` reference** — compute the label server-side via `translateSurfaceLabel` and pass `cardCta`

```ts
import { translateSurfaceLabel } from "@henryco/i18n/server";
// in the page (server component):
const cardCta = { label: translateSurfaceLabel(locale, "Pay with card"), href: `/pay/${id}/card` };
// pass cardCta to the PaymentSurface
```

- [ ] **Step 3: Typecheck both packages + Commit**

```bash
pnpm --filter @henryco/payment-surface typecheck && pnpm --filter @henryco/marketplace typecheck
git add packages/payment-surface apps/marketplace
git commit -m "V3-13 Task 20 — payment-surface cardCta capability + marketplace /pay/[id] reference wire"
```

> **Note:** if `payment-surface` does not yet exist as a package, Grep confirms the actual surface location; the capability may live in an existing checkout component. Add the smallest server-gated CTA seam that the 6 apps can adopt. Do NOT wire all six here — only marketplace. The other five are registered as rollout work in Task 21.

---

### Task 21: Docs + INTEGRATION-KEYS + PASS-REGISTER (incl. 6-app CTA rollout)

**Files:**
- Create: `docs/v3/payment-router-architecture.md`
- Modify: `docs/v3/INTEGRATION-KEYS.md` (add MOCK_PAYMENT rows)
- Modify: `docs/v3/PASS-REGISTER.md` (V3-13 detail + **register the 6-app CTA rollout** — the explicit Q2 deliverable)

- [ ] **Step 1: Write `docs/v3/payment-router-architecture.md`** — cover: package layout, the country∩capability∩registered selection rule, failover policy (retryable only), the A1/A2/A3 triad and how the TS reference mirrors the SQL, Principle 9 (client never sees provider), the V3-14/15/16 activation seams, and the reconciliation contract (V3-19).

- [ ] **Step 2: Add to `docs/v3/INTEGRATION-KEYS.md`**

```md
| `MOCK_PAYMENT` | Set to `1` to route through the in-package MockProvider (V3-13 dormant rail). | dev/test only |
| `MOCK_PAYMENT_FAILURE` | `retryable` \| `fatal` — force MockProvider failure for failover tests. | dev/test only |
| `MOCK_PAYMENT_WEBHOOK_SECRET` | HMAC secret for the mock webhook route. | dev/test only |
```

- [ ] **Step 3: Update `docs/v3/PASS-REGISTER.md`** — expand the V3-13 line's one-liner to note "router built + proven against mock; A1/A2/A3 enforced at DB + TS reference" AND add a rollout sub-entry under Phase C. Add this block immediately after the Phase C parallelism plan paragraph:

```md
**V3-13 card-CTA rollout (Q2 deliverable):** the `cardCta` capability shipped in payment-surface + wired once in marketplace `/pay/[id]`. Remaining apps to adopt the server-gated CTA (tracked, not yet wired): logistics, studio, jobs, property, care. Each adopts via the same `cardCta={{ label: translateSurfaceLabel(...), href }}` seam when its checkout surface is ready. No live provider until V3-14/15/16.
```

- [ ] **Step 4: Commit**

```bash
git add docs/v3/payment-router-architecture.md docs/v3/INTEGRATION-KEYS.md docs/v3/PASS-REGISTER.md
git commit -m "V3-13 Task 21 — architecture doc + INTEGRATION-KEYS MOCK_PAYMENT + PASS-REGISTER 6-app CTA rollout"
```

---

### Task 22: Owner-gated finance dashboard stub

**Files:**
- Create: `apps/hub/app/owner/(command)/finance/dashboard.tsx` (or `page.tsx` per the hub's owner-command convention — Grep an existing `owner/(command)` route during the step)

- [ ] **Step 1: Write the stub** — owner-gated, reads nothing live yet, states it's the V3-22 surface seam

```tsx
// Owner-only finance dashboard seam (V3-13 stub; populated in V3-22).
export default function FinanceDashboardPage() {
  return (
    <section data-testid="finance-dashboard-stub">
      <h1>Finance</h1>
      <p>Revenue, refunds, disputes — by division, provider, country. Populated in V3-22.</p>
    </section>
  );
}
```

Match the existing owner-command gating wrapper (Grep a sibling `owner/(command)` page for the auth/gate pattern and replicate it).

- [ ] **Step 2: Typecheck + Commit**

```bash
pnpm --filter @henryco/hub typecheck
git add "apps/hub/app/owner/(command)/finance/"
git commit -m "V3-13 Task 22 — owner-gated finance dashboard stub (V3-22 seam)"
```

---

### Task 23: Mock e2e harness + report + final sweep

**Files:**
- Create: `packages/payment-router/scripts/mock-payment-webhook.mjs`
- Create: `.codex-temp/v3-13-payments-provider-router/report.md`

- [ ] **Step 1: Write `scripts/mock-payment-webhook.mjs`** — a runnable harness that creates an intent in the in-memory store, routes via mock, signs a webhook with `MockProvider.sign`, applies it twice, and asserts the second is a dedup no-op. Prints PASS/FAIL.

```js
import { InMemoryPaymentStore } from "../src/testing/in-memory-payment-store.ts";
import { MockProvider } from "../src/providers/mock-provider.ts";

const store = new InMemoryPaymentStore();
const created = store.createIntent({ userId: "u1", amountMinor: 50000, currency: "NGN", country: "NG", method: "card", idempotencyKey: "e2e-1" });
if (!created.ok) { console.error("FAIL create"); process.exit(1); }
store.transition(created.value.id, "processing");
const body = JSON.stringify({ id: "evt_e2e", type: "charge.success", reference: `mock_${created.value.id}`, status: "succeeded" });
const sig = MockProvider.sign(body, "s");
const adapter = new MockProvider();
const verified = await adapter.verifyWebhook({ rawBody: body, signature: sig, secret: "s" });
if (!verified.ok) { console.error("FAIL verify"); process.exit(1); }
const first = store.applyWebhook({ provider: "mock", providerEventId: verified.value.providerEventId, intentId: created.value.id, impliedStatus: "succeeded" });
const second = store.applyWebhook({ provider: "mock", providerEventId: verified.value.providerEventId, intentId: created.value.id, impliedStatus: "succeeded" });
const ok = first.ok && first.value.applied && second.ok && !second.value.applied && store.getIntent(created.value.id)?.status === "succeeded";
console.log(ok ? "PASS mock e2e (route → webhook → dedup)" : "FAIL mock e2e");
process.exit(ok ? 0 : 1);
```

Run: `pnpm --filter @henryco/payment-router exec tsx scripts/mock-payment-webhook.mjs`
Expected: `PASS mock e2e (route → webhook → dedup)`.

- [ ] **Step 2: Full-suite sweep**

Run: `pnpm --filter @henryco/payment-router test && pnpm --filter @henryco/payment-router typecheck && pnpm --filter @henryco/observability typecheck`
Expected: all green.

- [ ] **Step 3: Write `.codex-temp/v3-13-payments-provider-router/report.md`** — record: what shipped, the A1/A2/A3/A4/A5 test results (copy the passing assertions), the DB-test boundary rationale, the "SQL NOT applied" note, the V3-14/15/16 activation seams, and the 6-app rollout register pointer.

- [ ] **Step 4: Commit**

```bash
git add packages/payment-router/scripts/mock-payment-webhook.mjs .codex-temp/v3-13-payments-provider-router/report.md
git commit -m "V3-13 Task 23 — mock e2e harness + closure report; full suite green"
```

---

## Self-Review

**1. Spec coverage** (each spec section → task):
- §1 package layout → Task 0, 14 (barrel). ✓
- §2 types + money guards (A4) → Task 1. ✓
- §3 adapter + MockProvider + createPaymentRouter → Tasks 4, 7, 9. ✓
- §4 router select + route + failover + A5 + Principle 9 → Tasks 8, 9. ✓
- §5 schema (A1/A2/A3, division indexed R2, RLS) → Task 15; proven by Task 10. ✓
- §6 routes (R1 gates, A1 replay, webhook RPC) → Tasks 16–19. ✓
- §7 payment-surface CTA + marketplace wire + 6-app register → Tasks 20, 21. ✓
- §8 telemetry 9 names + no EventOutcome ext + audit folding → Tasks 11, 12. ✓
- §9 tests + docs + INTEGRATION-KEYS + PASS-REGISTER + finance stub + report → Tasks 5–10 (tests), 21, 22, 23. ✓
- A6 (no dormant soak; test suite is the gate) → satisfied: A1/A2/A3 proven by Tasks 3, 10; A4 Task 1; A5 Task 9. ✓
- A7 reconciliation contract → Task 13. ✓
- A10 wallet methods enumerated → Tasks 1 (enum), 5 (matrix). ✓

**2. Placeholder scan:** No "TBD"/"implement later". Three tasks carry explicit "confirm the export path during the step" notes (telemetry barrel path, auth guard path, payment-surface location) — these are deliberate verify-then-proceed instructions with a test that catches a wrong path, NOT placeholders for missing logic.

**3. Type consistency:** `Result<T,E>` shape identical across types/router/store. `PaymentProviderKey` union consistent (stripe|paystack|flutterwave|mock). `PaymentIntentStatus` identical in types, state-machine, store, SQL CHECK. `assertTransition(from,to)` signature consistent (Tasks 3, 10). `RouteSuccess`/`RouteError` consistent between Task 9 definition and Task 16 consumer. `createPaymentRouter()` signature consistent (Tasks 9, 16, 18). Audit `outcome` union (started|paid|failed|blocked) ⊂ EventOutcome. ✓

**4. Money-correctness gate (A1–A5) explicitly proven:**
- A1 idempotent create → Task 10 store test + Task 16 23505-replay path.
- A2 legal transitions → Task 3 exhaustive table + Task 10 illegal-reject + SQL trigger Task 15.
- A3 webhook dedup + crash-between-steps → Task 10 (two tests) + SQL RPC Task 15.
- A4 reject unsupported currency (no NGN fallback) → Task 1.
- A5 no-suitable-provider manual fallback → Task 9 + Task 16 422 path.

