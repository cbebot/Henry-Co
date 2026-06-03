# V3-33 — AI Intelligence Layer: Personal-Task Gating

**Pass ID:** V3-33  ·  **Phase:** D (AI Intelligence Layer)  ·  **Pillar:** P4 (Henry Onyx Intelligence), P7 (Trust & Identity)
**Dependencies:** V3-26 (provider router), V3-27 (usage-billing engine + `ai_task_pricing`)  ·  **Effort:** M  ·  **Parallel-safe:** N (gate consumed by V3-29/30/31/32; must land before they certify)
**Owner gate:** none (AI provider = D3 and margin = D4 recorded; confirm, don't re-litigate)  ·  **Risk class:** Identity

---

## Role

You are the V3 AI Intelligence engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the **server-side gate** that every Henry Onyx Intelligence call passes through before a single token reaches a provider: unauthenticated users get **zero** personal-task usage; an authenticated user whose wallet is at zero is hard-stopped on metered tasks (the provider is never called); a task whose class is unknown **fails closed**. The line you must not cross: the gate is **server-side and unbypassable**. No client flag, header, or UI state can grant access — the decision lives at the router boundary, and every block is audited.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/33-ai-personal-task-gating` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3-26 ships `@henryco/ai-router` (the vendor-agnostic router) and V3-27 ships the usage-billing engine plus the `ai_task_pricing` catalog (`task_class` → `billing_mode` ∈ {`free_company`, `metered_user`, `metered_business`}). The task-class assists (V3-29 support, V3-30 business, V3-31 account-check, V3-32 studio) each register a class and call the router. What does not exist yet is the single, authoritative **admission control** in front of every router call. Without it, gating logic would scatter across surfaces and drift — exactly the failure the owner's binding constraint forbids ("unauth users get zero personal-task usage; wallet-zero ⇒ API not called").

This pass concentrates that decision into one middleware at the router boundary in `@henryco/ai-router`, with four explicit, fail-closed error codes, audit on every block, and a public-surface rule that lets logged-out pages *advertise* the assistant but never invoke it. It builds on V3-26's router and V3-27's pricing catalog + wallet/ledger; it adds no new task classes and no UI surface of its own.

## Mandatory scope

### S1 — Admission middleware at the router boundary

In `@henryco/ai-router/src/router.ts`, every call passes through `admitTask(ctx)` **before** any provider adapter is selected:

```ts
export type AdmissionContext = {
  taskClass: string;
  session: { userId: string } | null;          // from @henryco/auth on the server
  businessContext?: { businessId: string } | null;
  requestId: string;                            // idempotency / correlation
};
export type AdmissionDecision =
  | { ok: true; billingMode: BillingMode; estimatedChargeMinor: number }
  | { ok: false; code: GateErrorCode };

export async function admitTask(ctx: AdmissionContext): Promise<AdmissionDecision>;
```

Decision logic (in order, fail-closed):
1. Resolve `billing_mode` from `ai_task_pricing` by `taskClass`. **Missing ⇒ `task_not_classified`** (never default to allow).
2. `free_company` ⇒ require `session` (no anonymous usage). No wallet check.
3. `metered_user` ⇒ require `session` **and** user wallet balance ≥ `min_charge`. Else `wallet_zero_blocked` / `auth_required`.
4. `metered_business` ⇒ require `session` **and** `businessContext` **and** business-wallet balance ≥ `min_charge`. Else `business_account_required` / `wallet_zero_blocked` / `auth_required`.

Balances are read from the V3-27 / V3-17 ledger (integer minor units). The gate computes the *estimated* charge but does not debit — debiting is V3-27's responsibility after a successful provider call.

### S2 — Explicit, fail-closed error codes

```ts
export type GateErrorCode =
  | 'auth_required'            // unauthenticated user attempted any AI call
  | 'wallet_zero_blocked'      // authenticated user, balance below min_charge on a metered task
  | 'business_account_required'// metered_business task without business context
  | 'task_not_classified';     // task class absent from ai_task_pricing — fail closed
```

Each maps to a stable HTTP status (`auth_required` → 401; the rest → 403) and a translated, calm user-facing message. The router never reveals provider, model, or internal cost in the error.

### S3 — Audit every blocked call

Every `ok: false` decision writes an `@henryco/observability/audit-log` entry: actor (user/anonymous), `taskClass`, `code`, `requestId`, timestamp. This is the abuse-detection substrate (repeated `task_not_classified` or `auth_required` from one source is a probe signal). Successful admissions are *not* spam-audited here — V3-27 records the billed usage row.

### S4 — Public-surface gating

Logged-out public pages (e.g. a marketplace product detail viewed without a session) **may** render a "Sign in to use Henry Onyx Intelligence" CTA (label via `@henryco/i18n`, brand via `@henryco/config`) but the AI endpoint returns `auth_required` for any anonymous invocation. There is no anonymous trial, no preview token, no client-side bypass. The CTA links to sign-in via `getAccountUrl()`.

### S5 — Telemetry

- `henry.ai.gating.unauth_blocked`
- `henry.ai.gating.wallet_zero_blocked`
- `henry.ai.gating.task_not_classified`

(The `business_account_required` block reuses `unauth_blocked`'s family with a `reason` property, or add `henry.ai.gating.business_required` if a distinct event is cleaner — pick one and document it.)

## Out of scope

- Per-task pricing values, margin, and the debit itself — **V3-27**.
- Specific task-class implementations and their presets — **V3-29 / V3-30 / V3-31 / V3-32**.
- The chat surface and guardrails — **V3-28**. The provider adapters — **V3-26**.

## Dependencies

Hard: V3-26 (router to insert the middleware into), V3-27 (`ai_task_pricing` + wallet/ledger balance reads). **Blocks** the certification of V3-29, V3-30, V3-31, V3-32 — those assists rely on this gate being authoritative — and closes the gating half of Phase D.

## Inheritance

`@henryco/ai-router` (router boundary), `@henryco/auth` (server session resolution), `@henryco/observability` (audit + telemetry), `@henryco/i18n` (error copy), `@henryco/config` (brand + `getAccountUrl`), and the V3-27/V3-17 ledger for balance reads.

## Implementation requirements

### Files
- `packages/ai-router/src/admission.ts` — `admitTask` + `GateErrorCode` + decision logic (S1/S2).
- `packages/ai-router/src/router.ts` — call `admitTask` before adapter selection; short-circuit on `ok: false`.
- `packages/ai-router/src/errors.ts` — error-code → HTTP-status + i18n-key map (S2).
- The shared AI API entry (the route(s) the V3-29..V3-32 surfaces call) — translate a gate failure into the correct status + translated body; never call the provider on a block.
- Public-surface CTA component + wiring on at least one logged-out page (S4).

### Trust / safety / compliance
- **Server-side only:** the gate runs on the server with the session resolved by `@henryco/auth` from cookies — never trusts a client-supplied userId, role, or "isAuthed" flag.
- **Fail-closed everywhere:** unknown task class, missing pricing row, or any error in admission ⇒ deny. A bug must never open the gate.
- Balance reads are consistent with the ledger (no stale cache that could let a zero-wallet call through).
- Audit on every block (S3). No PII in the audit beyond the actor reference.
- This pass performs no debit and no mutation of account state — it is admission control only.

### Mobile + desktop parity
The gate is server-side and applies identically to web and the Expo super-app — there is no client surface to vary. The public-surface CTA must render correctly on web mobile (safe-area, no layout shift).

### i18n
Namespace `surface:intelligence.gating`. The four error messages and the "Sign in to use Henry Onyx Intelligence" CTA are keyed copy (Pattern A; Pattern B fallback for the other 11 locales). Errors are translated at the API boundary by locale. Zero hardcoded user-facing strings.

### Brand & design system
The only user-facing string family here is the gating copy + CTA — brand = **Henry Onyx Intelligence** via `@henryco/config`, never the provider name. CTA uses design-system tokens (light + dark) and links via `getAccountUrl()`. Zero hardcoded domains.

## Validation gates
1. CI green: typecheck · lint · test · build.
2. i18n strict gate green for `surface:intelligence.gating`.
3. **Unauth block:** call any AI endpoint with no session → 401 `auth_required`; provider adapter never invoked (assert via mock spy).
4. **Wallet-zero block:** authenticated user, zero balance, metered task → 403 `wallet_zero_blocked`; provider never invoked.
5. **Business-context block:** `metered_business` task without business context → 403 `business_account_required`.
6. **Unclassified fail-closed:** invent a task class absent from `ai_task_pricing` → 403 `task_not_classified`; provider never invoked.
7. **Client-bypass attempt:** a forged client "authed/role" flag does not change the decision (session resolved server-side only).
8. **Audit verification:** each of the four blocks writes an audit-log entry with the correct code + actor.
9. Public surface: a logged-out page shows the CTA but the endpoint still returns `auth_required`.

## Deployment gate
All gates green; V3-26 + V3-27 merged; **48h soak** with the audit log reviewed for unexpected blocks (a spike in `task_not_classified` means a surface registered a class incorrectly — investigate before the dependent assists certify). The gate must be live and clean before V3-29/30/31/32 close.

## Final report contract
`.codex-temp/v3-33-ai-personal-task-gating/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `admitTask` runs at the router boundary before adapter selection; all four billing modes handled in order, fail-closed.
- [ ] Four explicit error codes (`auth_required`, `wallet_zero_blocked`, `business_account_required`, `task_not_classified`) with stable HTTP statuses and translated copy.
- [ ] Unknown task class fails closed; missing/erroring admission denies; gate never opens on a bug.
- [ ] Session resolved server-side via `@henryco/auth`; forged client flags cannot grant access (proven by test).
- [ ] Balances read from the V3-27/V3-17 ledger in minor units; provider never invoked on any block (mock-spy proven).
- [ ] Every block audit-logged; three telemetry events emitted and schema-valid.
- [ ] Public-surface CTA renders ("Sign in to use Henry Onyx Intelligence", brand via config) but the endpoint returns `auth_required`.
- [ ] i18n `surface:intelligence.gating` complete; links via `getAccountUrl()`; light+dark on the CTA.
- [ ] Report written. Phase D gating half complete.
