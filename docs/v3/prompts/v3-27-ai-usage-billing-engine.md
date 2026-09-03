# V3-27 — AI Intelligence Layer: AI Usage Billing Engine

**Pass ID:** V3-27  ·  **Phase:** D (AI Intelligence Layer)  ·  **Pillar:** P4 (Intelligence), P2 (Wallet/Payments), P9 (Ledger/Finance)
**Dependencies:** V3-26 (AI provider router), V3-17 (ledger hardening)  ·  **Effort:** XL  ·  **Parallel-safe:** N
**Owner gate:** D4 (AI usage pricing markup)  ·  **Risk class:** Money / Identity

---

## Role
You are the V3 AI Billing engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass is the money meter for every AI call: it estimates cost before the call, enforces a hard wallet-zero cap, debits the wallet through the double-entry ledger after the call, and layers the owner-ratified margin on top of raw provider cost. The line you must not cross: a metered AI call is **never** invoked when the wallet cannot cover it, and a user is **never** charged twice for one logical call. You do not build AI surfaces (V3-28+) and you do not build the router itself (V3-26) — you meter what V3-26 routes.

> **Owner gate D4 — confirm, don't re-litigate.** The AI-usage markup decision was recorded in `docs/v3/DECISIONS-REQUIRED.md` (D4) and ratified in the Phase-D decision round (PR #159). Read the current answer in `docs/v3/DECISIONS-REQUIRED.md` D4 before you start and seed `ai_task_pricing.margin_pct` from it. The owner's stated default is **10% baseline**, waivable per tier. Do not re-open the pricing debate — confirm the recorded answer and apply it.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/27-ai-usage-billing-engine` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The wallet spine already exists and is money-true. `public.wallets` holds `balance_kobo BIGINT` (integer minor units, NGN kobo) keyed by `profile_id`; `public.wallet_transactions` is the movement record (`type`, `amount_ngn`, `currency`, `reference`, `order_id`). V3-17 hardens this into a verified double-entry ledger with reconciliation and an immutable audit trail — this pass writes AI charges **through** that ledger, never directly to `balance_kobo`. V3-26 ships `@henryco/ai-router`: a vendor-agnostic provider interface (`estimateCost`, `invoke`, streaming) with per-call cost telemetry and the provider name masked from every surface. The telemetry envelope contract (`henry.<domain>.<object>.<verb>`, `henryEventNameSchema`) already lives in `@henryco/intelligence/src/index.ts` and is reused here. The gap this pass closes: there is **no metering layer** between the router and the wallet today — no pre-call estimate, no wallet-zero cap, no margin application, no per-call charge, no usage dashboard. Without it, AI usage either runs free (uncapped cost leak) or cannot be offered at all. This pass is that layer.

## Mandatory scope

### S1 — `ai_task_pricing` catalog + `ai_calls` billing columns
New migration `supabase/migrations/<ts>_ai_usage_billing.sql`.

```sql
-- Per-task-class pricing policy. Seeded from DECISIONS-REQUIRED.md D4.
create table public.ai_task_pricing (
  task_class            text primary key,
  billing_mode          text not null check (billing_mode in ('free_company','metered_user','metered_business')),
  margin_pct            numeric(5,4) not null default 0.1000,   -- D4 default 0.10
  min_charge_kobo       bigint not null default 0,
  max_charge_kobo       bigint,                                  -- null = uncapped
  description           text not null,
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users(id)
);

-- Billing fields on the V3-26 call ledger (router owns ai_calls; this pass adds billing columns).
alter table public.ai_calls
  add column if not exists billing_mode      text,
  add column if not exists billed_to_profile uuid references public.profiles(id),
  add column if not exists estimated_cost_kobo bigint,
  add column if not exists actual_cost_kobo  bigint,        -- raw provider cost in kobo
  add column if not exists charged_kobo      bigint,        -- cost + margin, what hit the wallet
  add column if not exists margin_pct_applied numeric(5,4),
  add column if not exists wallet_txn_id      uuid references public.wallet_transactions(id),
  add column if not exists idempotency_key    text;

create unique index if not exists ai_calls_idempotency_key_uniq
  on public.ai_calls (idempotency_key) where idempotency_key is not null;
```

RLS:
- `ai_task_pricing`: `select` for authenticated users (pricing is public-to-the-user so cost preview is honest); `insert/update/delete` only via `is_owner()` (owner-tuned policy).
- `ai_calls` billing columns inherit the V3-26 RLS: a profile may `select` only rows where `billed_to_profile = auth.uid()` (or its profile id); all writes are service-role / server-action only — never client-writable.

Seed `ai_task_pricing` per S5. `margin_pct` default reads the D4-ratified value (0.10).

### S2 — Pre-call estimation + wallet check (`@henryco/ai-billing`)
New package `packages/ai-billing/`. Public surface:

```ts
// packages/ai-billing/src/types.ts
export interface BillingDecision {
  taskClass: string;
  billingMode: 'free_company' | 'metered_user' | 'metered_business';
  estimatedCostKobo: bigint;     // raw provider estimate
  estimatedChargeKobo: bigint;   // estimate * (1 + margin), clamped to [min, max]
  marginPct: number;
  allowed: boolean;
  blockReason?: 'wallet_zero_blocked' | 'unauthenticated_blocked' | 'pricing_missing';
}

// packages/ai-billing/src/estimate.ts
export async function decideBilling(args: {
  taskClass: string;
  profileId: string | null;            // null = unauthenticated
  routerEstimate: { costKobo: bigint };// from @henryco/ai-router estimateCost
  idempotencyKey: string;
}): Promise<BillingDecision>;
```

Logic:
1. Load `ai_task_pricing` row for `taskClass`. Missing → `allowed: false, blockReason: 'pricing_missing'` (fail-closed; never default to free).
2. `free_company` → `allowed: true`, charge = 0, skip wallet read.
3. `metered_user` / `metered_business` → require `profileId` (null → `unauthenticated_blocked`; V3-33 also enforces this at the router, this is defence-in-depth). Compute `estimatedCharge = clamp(round(estimateCostKobo * (1 + marginPct)), min_charge_kobo, max_charge_kobo)`. Read `wallets.balance_kobo` for the profile. If `balance_kobo < max(estimatedCharge, min_charge_kobo)` → `allowed: false, blockReason: 'wallet_zero_blocked'`.
4. All money is `bigint` kobo end-to-end. No floats touch a balance.

### S3 — Post-call charge through the ledger (idempotent)
```ts
// packages/ai-billing/src/charge.ts
export async function chargeForCall(args: {
  aiCallId: string;
  profileId: string;
  taskClass: string;
  actualCostKobo: bigint;        // from router actual token usage
  marginPct: number;
  idempotencyKey: string;
}): Promise<{ chargedKobo: bigint; walletTxnId: string; deduped: boolean }>;
```

Server-only (service-role). One DB transaction (Postgres function `ai_billing_charge(...)` invoked via RPC):
1. If an `ai_calls` row with this `idempotency_key` already has a non-null `wallet_txn_id` → return it, `deduped: true`. **No second charge.**
2. `chargedKobo = clamp(round(actualCostKobo * (1 + marginPct)), min_charge_kobo, max_charge_kobo)`.
3. Insert a `wallet_transactions` debit (`type = 'ai_usage_debit'`, `amount_ngn = -chargedKobo` in the table's stored convention, `reference = aiCallId`) and decrement `wallets.balance_kobo` **in the same transaction** through the V3-17 ledger helper (double-entry: user wallet debit ↔ Henry Onyx AI-revenue account credit). Never UPDATE `balance_kobo` outside the ledger path.
4. Stamp `ai_calls`: `actual_cost_kobo`, `charged_kobo`, `margin_pct_applied`, `wallet_txn_id`, `billed_to_profile`.
5. `free_company` → no wallet txn; stamp `charged_kobo = 0`, `billing_mode = 'free_company'`.

### S4 — Hard wallet-zero cap + failed-call refund
- The metering middleware in `@henryco/ai-billing` wraps every metered `@henryco/ai-router` invocation. Order is invariant: `decideBilling` → if `!allowed` throw `WalletZeroBlockedError` (router never invoked) → `router.invoke` → `chargeForCall`.
- **The API is not called when the wallet cannot cover the estimate.** This is the owner's hard cap; it is enforced before `router.invoke`, in `@henryco/ai-billing`, not optimistically in the UI.
- If `router.invoke` charges-then-fails (provider error after a successful pre-charge in any future eager-charge path), issue a ledger reversal (`type = 'ai_usage_refund'`, positive amount, `reference = aiCallId`) and emit `henry.ai.billing.refund_processed`. Default flow is charge-after-success, so this path is the safety net, not the norm.

### S5 — Free-tier classification (seed)
Seed `ai_task_pricing`. Default for any unseeded task class is **metered** (S2 fails closed on missing rows, so seed every known class):
| task_class | billing_mode | rationale |
|---|---|---|
| `support_message_assist` | `free_company` | helps user message support — company-critical (V3-29) |
| `account_check_assist` | `free_company` | helps user understand own account — company-critical (V3-31) |
| `studio_domain_lookup` | `free_company` | sales-aiding on a paid Studio service (V3-32) |
| `business_message_assist` | `metered_business` | business owner drafting customer-facing copy (V3-30) |
| `studio_brief_assist` | `metered_user` | client-end brief articulation (V3-32) |
| `general_chat` | `metered_user` | the `/intelligence` chat surface (V3-28) |

### S6 — User usage dashboard
Route `apps/account/app/(account)/intelligence/usage/page.tsx` (server component; the `intelligence` route group is introduced here and reused by V3-28).
- Daily + monthly usage chart (calls, free vs metered, kobo charged) from `ai_calls` filtered to `billed_to_profile = current profile`.
- Current wallet balance (read `wallets.balance_kobo`, format with `@henryco/pricing` currency model — never hand-format kobo).
- Per-task-class breakdown table (calls, total charged, free count).
- "Top up wallet" CTA linking to the existing wallet funding flow at `apps/account/app/(account)/wallet/funding/` (via `getAccountUrl('/wallet/funding')` — no hardcoded path/domain).

### S7 — Telemetry
Emit through the `@henryco/intelligence` envelope (`henryEventNameSchema`). Concrete events:
- `henry.ai.billing.charge_succeeded`
- `henry.ai.billing.wallet_zero_blocked`
- `henry.ai.billing.free_call`
- `henry.ai.billing.refund_processed`

Each carries `taskClass`, `billingMode`, `chargedKobo` (omit raw provider cost from any client-reachable payload — internal-only), and `correlationId` tying it to the V3-26 call.

## Out of scope
- AI chat/assist surfaces and inline invocations — V3-28 (chat surface), V3-29/30/31/32 (per-task assists).
- Personal-task gating at the router boundary (unauth block, auth+wallet middleware) — V3-33 (this pass enforces wallet-zero defence-in-depth; V3-33 owns the router-level gate).
- The AI provider router itself, model routing, provider masking — V3-26.
- Ledger double-entry mechanics and reconciliation — V3-17 (this pass calls its helper; it does not reimplement it).

## Dependencies
Depends on V3-26 (`@henryco/ai-router`: `estimateCost`, `invoke`, `ai_calls` table) and V3-17 (verified double-entry ledger helper + `wallet_transactions` conventions). **Blocks** V3-28 (chat surface needs cost preview + charge), V3-33 (gating reads the wallet-zero verdict), and all metered assists V3-30/V3-32.

## Inheritance
`@henryco/ai-router` (V3-26 — estimate/invoke), the V3-17 ledger helper + `public.wallets` / `public.wallet_transactions`, `@henryco/pricing` (currency-model formatting; never hand-format kobo), `@henryco/intelligence` (telemetry envelope `henryEventNameSchema`), `@henryco/observability` (audit log on the charge route), `@henryco/config` (`getAccountUrl`), `@henryco/i18n` (all user-facing copy).

## Implementation requirements
### Files
- `supabase/migrations/<ts>_ai_usage_billing.sql` (S1 table + columns + RLS + `ai_billing_charge` RPC).
- `packages/ai-billing/` — `src/types.ts`, `src/estimate.ts`, `src/charge.ts`, `src/middleware.ts`, `src/index.ts`, `package.json`, `tsconfig.json`, `src/__tests__/`.
- `apps/account/app/(account)/intelligence/usage/page.tsx` + a client chart component under `apps/account/components/intelligence/`.
- `packages/i18n/src/intelligence-usage-copy.ts` (Pattern A typed copy; surface namespace `surface:intelligence`).

### Trust / safety / compliance
- All money in `bigint` kobo; no float ever reaches a balance. Charge math clamps to `[min_charge_kobo, max_charge_kobo]`.
- Idempotency key on every billed call; the charge RPC is the dedupe point (S3 step 1). Retries never double-charge.
- The charge route is sensitive: wrap the server action with `requireSensitiveAction` (`packages/auth/src/server/sensitive-action-guard.ts`) and `@henryco/observability/audit-log` (actor, taskClass, chargedKobo, walletTxnId).
- Wallet writes only via the V3-17 ledger helper inside one DB transaction — never a bare `UPDATE wallets`.
- Provider cost figures are internal-only; never serialize raw provider cost to a client payload (provider-mask intent inherited from V3-26/V3-28).

### Mobile + desktop parity
Wallet check, cost preview, and usage dashboard are identical on web and the Expo super-app — the decision logic lives in `@henryco/ai-billing` (shared), so both clients consume the same verdict. The usage dashboard renders responsively (mobile + desktop) with the shared chart component.

### i18n
All user-facing copy via `@henryco/i18n`, namespace `surface:intelligence` (Pattern A typed copy in `packages/i18n/src/intelligence-usage-copy.ts`). Translate: usage-dashboard labels and chart legends, wallet-balance line, the `wallet_zero_blocked` message + top-up CTA, per-task-class names, and the "free" badge. No hardcoded user-facing strings.

### Brand & design system
Any rendered label reads "Henry Onyx Intelligence" sourced from `@henryco/config` (brand truth: user-facing = Henry Onyx; legal = Henry Onyx Limited; `@henryco/*` code identifiers unchanged) — never hardcode the brand and never the provider name. Usage dashboard uses locked design-system tokens (`--site-*` / `--accent`, Fraunces for editorial headings), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Links via `getAccountUrl()` — zero hardcoded domains.

## Validation gates
1. **Standard CI** — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all green.
2. **Pre-call wallet-check test** — metered call with `balance_kobo` below estimate returns `allowed:false / wallet_zero_blocked` and the router is provably **not** invoked (spy asserts zero `invoke` calls).
3. **Post-call charge accuracy** — `charged_kobo == clamp(round(actualCostKobo * (1 + marginPct)), min, max)`; ledger debit + wallet decrement equal `charged_kobo` to the kobo.
4. **Idempotency** — replaying the same `idempotency_key` returns the first `wallet_txn_id`, `deduped:true`, and asserts exactly one `wallet_transactions` row.
5. **Wallet-zero hard cap** — at `balance_kobo = 0`, every metered task class blocks; free task classes still run.
6. **Free-tier bypass** — `free_company` classes never read the wallet, never insert a txn, stamp `charged_kobo = 0`.
7. **RLS verification** — profile A cannot `select` profile B's `ai_calls` billing rows; pricing catalog is read-only to non-owners.
8. **Refund path** — simulated charge-then-fail issues an `ai_usage_refund` reversal and restores `balance_kobo` exactly.
9. **UI** — usage dashboard real-browser pass: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.
10. **i18n gate** — hardcoded-string scanner clean for the new surface; `surface:intelligence` keys present in en-US Pattern A.

## Deployment gate
- D4 ratified value confirmed from `docs/v3/DECISIONS-REQUIRED.md` and seeded into `ai_task_pricing.margin_pct`.
- All validation gates green; owner review (Money risk class) on the charge path + margin seed.
- 7-day soak with internal-team usage on a feature flag (metering live for staff profiles only) before general enablement; verify reconciliation: sum of `ai_usage_debit` txns == sum of `ai_calls.charged_kobo` for the window.

## Final report contract
`.codex-temp/v3-27-ai-usage-billing-engine/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus a worked charge example (estimate → invoke → charge → ledger entries with kobo arithmetic) and the D4-value-applied attestation.

## Self-verification
- [ ] `ai_task_pricing` created with RLS (read-all-auth / write-owner) and seeded per S5; `ai_calls` billing columns + idempotency unique index added.
- [ ] `@henryco/ai-billing` ships `decideBilling` (pre-call) and `chargeForCall` (post-call) with the invariant order; router never invoked when `!allowed`.
- [ ] Wallet-zero hard cap enforced in `@henryco/ai-billing` before `router.invoke` — proven by test (zero invoke calls).
- [ ] All money is `bigint` kobo; charge clamps to `[min, max]`; wallet writes only through the V3-17 ledger helper in one transaction.
- [ ] Idempotency dedupe proven — one key, one `wallet_txn_id`, one `wallet_transactions` row.
- [ ] Free-tier classes (`support_message_assist`, `account_check_assist`, `studio_domain_lookup`) bypass the wallet and stamp `charged_kobo = 0`.
- [ ] Usage dashboard live at `(account)/intelligence/usage`; balance + per-task breakdown + top-up CTA via `getAccountUrl()`.
- [ ] Four telemetry events emit through the `@henryco/intelligence` envelope; raw provider cost never in a client payload.
- [ ] `surface:intelligence` Pattern A copy added; hardcoded-string scanner clean; brand = "Henry Onyx Intelligence" from `@henryco/config`.
- [ ] `requireSensitiveAction` + audit log on the charge action; refund path restores balance exactly.
- [ ] D4-ratified margin confirmed from DECISIONS-REQUIRED.md and applied; report written.
