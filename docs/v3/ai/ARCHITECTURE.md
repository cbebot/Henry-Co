# Architecture — Governed AI Gateway, Metering & Margin Engine

**Pass:** V3-AI-ENGINE-DESIGN-01 · Design only. Read [README.md](./README.md) first — especially "The real money spine."

> Type shapes and SQL here are **design contracts**, not shipped code. They are written concretely so the build pass has no ambiguity. All anchors are against `origin/main @ 67c2a67b`.

---

## 0. The one-paragraph shape

A new server-only package **`@henryco/ai-gateway`** is the *only* path from any Henry Onyx surface to a model provider. A surface never imports a model SDK; it calls the gateway with a typed **task request**. The gateway: (1) resolves the surface policy (billable? margin? caps?); (2) **estimates** a provable upper-bound cost and **reserves** it against the caller's wallet — refusing the call if the wallet can't cover it; (3) dispatches to a **provider adapter** behind a swappable seam (the provider name/model/key never leave the server); (4) **meters** the real token usage the provider reports; (5) **prices** it through the margin engine (provider cost → + margin % = net → + VAT via the existing VAT engine); (6) **settles** the charge in **one atomic, idempotent, service-role-only RPC** that debits the wallet **and posts a balanced double-entry ledger entry**; (7) **records** an immutable usage event and emits telemetry. The result returned to the surface is the model output plus a redacted receipt — never the provider's identity, cost, or margin.

```
 Surface (RSC / "use server")                          @henryco/ai-gateway
 ─────────────────────────────                         ──────────────────────────────────────
  draftListing(input) ───────────►  runAiTask({ surface:"marketplace.listing.draft",
                                                  actorId, input, idempotencyKey })
                                          │
                      ┌────────────────────┼──────────────────────────────────────────────┐
                      │ 1 resolve surface policy (billable? margin? caps?)                  │ ── pricing_rule_books (rate card)
                      │ 2 estimate UPPER-BOUND cost → reserve against wallet (or REFUSE)    │ ── reserve_wallet_for_ai_usage()  [guarded]
                      │ 3 dispatch ──► ProviderAdapter.generate()  (server-only, opaque)    │ ── ./server/providers/* (mirrors payment-router)
                      │ 4 meter actual tokens from provider response                        │
                      │ 5 price actual: cost → +margin = net → +VAT (applyOutputVat)        │ ── @henryco/pricing (+ vat.ts, TAX.vat)
                      │ 6 settle: debit wallet + post balanced ledger entry, ONE txn        │ ── post_ai_usage_charge()  [guarded, payments_private]
                      │ 7 record ai_usage_events row + emit henry.ai.usage.metered          │ ── @henryco/observability
                      └────────────────────┼──────────────────────────────────────────────┘
                                           ▼
  { output, receipt } ◄───────────  output + redacted receipt (no provider id, no cost, no margin)
```

---

## 1. The governed gateway

### 1.1 Why a gateway (and why the provider must be invisible)

Today the only real model calls are **three** `apps/studio` server actions that `new Anthropic(...)` inline (`brief-copilot-action.ts:791`, `refine-draft-action.ts:105`, `brief-chat-action.ts:126`). They already encode the right instincts — server-only isolation, env-key, timeout/backoff, graceful heuristic fallback (`brief-copilot-action.ts:646`), salted dedup (`:461`), 6-layer anti-abuse (`:42`) — but they live in one division and bill nothing. The gateway **harvests** those patterns into one governed seam so that the provider is swappable (D3), never leaks to the client (owner's hard constraint), and billing/caps/metering/audit are enforced once, uniformly, in one place.

### 1.2 Package layout (mirrors `@henryco/payment-router`, with a stronger boundary)

The **exports map is the boundary**: the `.` barrel is client-safe (types + pure helpers); everything touching a provider SDK, a secret, or the service-role DB lives behind **`./server`** and never enters a client bundle. (`@henryco/payment-router` isolates by *runtime construction* rather than an exports wall — `packages/payment-router/package.json:6-14`; the gateway closes that gap with a hard `./server` boundary.)

```
packages/ai-gateway/
  package.json            // "@henryco/ai-gateway", private, type:module
                          //   exports: { ".": "./index.ts", "./server": "./src/server/index.ts" }
                          //   deps: @henryco/config, @henryco/pricing, @henryco/observability, zod
  tsconfig.json           // copy packages/payment-router (or messaging) tsconfig: include ["index.ts","src/**/*"], types ["node"]
  index.ts                // PURE barrel — types only (AiTask, AiSurfaceKey, AiUsageReceipt, errors). client-safe.
  src/
    surfaces.ts           // surface registry (keys, billable flag, default policy) — pure, testable
    metering.ts           // unit model + provable-upper-bound estimator — pure, testable
    pricing-ai.ts         // computeAiUsageBreakdown() — pure (lives in @henryco/pricing; see §3)
    redaction.ts          // strips provider identity/cost/margin from anything client-bound — pure
    server/
      index.ts            // import "server-only"; runAiTask() — the orchestrator
      providers/
        types.ts          // AiProviderAdapter interface (the seam) — mirrors PaymentProviderAdapter
        anthropic.ts      // adapter #1 (wraps @anthropic-ai/sdk) — server-only
        // openai.ts      // adapter #2 — the ratified D3 fallback; no caller change
      dispatch.ts         // provider selection + failover (mirrors payment-router router.ts)
      billing.ts          // reserve/settle via the guarded payments_private RPCs
  src/__tests__/*.test.ts // tsx --test (explicit file list); never imports a module that imports "server-only"
```

> **Type home.** Extend `@henryco/intelligence`'s `division` enum with `"ai"` and add the `henry.ai.*` event-name schema there (it owns the canonical `henry.<domain>.<object>.<verb>` taxonomy); put the gateway *runtime* (adapters, dispatch, billing) in `@henryco/ai-gateway`. Taxonomy and runtime stay separated.

### 1.3 The adapter seam (mirrors `PaymentProviderAdapter`)

The seam is a **fan-out abstraction**: one stable interface, N provider implementations, selected at runtime — exactly the shape of `packages/payment-router/src/providers/adapter-interface.ts:159-190`.

```ts
// src/server/providers/types.ts
export interface AiProviderAdapter {
  /** Opaque internal discriminant, e.g. "anthropic". NEVER returned to a client. (cf. PaymentProviderAdapter.key) */
  readonly key: AiProviderKey;
  generate(req: ProviderRequest): Promise<Result<ProviderResult, ProviderError>>; // Result<T,E>, never throws on expected failures
}

export interface ProviderRequest {
  modelTier: "fast" | "standard" | "deep"; // task-routed → concrete model INSIDE the adapter (D3's tiered strategy)
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxOutputTokens: number;                  // hard cap — a runaway-cost guardrail
  responseSchema?: object;                  // JSON-schema-constrained output
  timeoutMs: number;
}

export interface ProviderResult {
  output: string;
  usage: ProviderUsage;                      // raw token counts FROM the provider — the metering truth
  modelUsedInternal: string;                 // concrete model id — internal only; redacted before client
  finishReason: "stop" | "length" | "refusal" | "error";
}

export interface ProviderUsage { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; }
```

- **`Result<T, ProviderError>`**, not throws, for expected provider failures — mirroring payment-router (`types.ts:8`, `adapter-interface.ts:155`). `ProviderError` carries a server-only `providerKey` for audit (cf. `errors.ts:6-7`).
- **`modelTier` not `model`, and the mapping is company-governed.** Surfaces request a capability tier; the adapter maps tier → a concrete Claude model via a **company-set routing config** (carried in the rate card / provider config, governed like margins). This is D3's "Anthropic, with company-governed model switching": the company changes which Claude model a surface/tier uses **without a code change**, and the real model name never leaves the server. The studio copilot's current `claude-haiku-4-5` is the default `fast` mapping until the company sets otherwise.
- **Selection & failover** (`dispatch.ts`) mirror `PaymentRouter` (`router.ts:73-151`): a `Map<key, adapter>`, an ordered eligible list = the failover order, failing over only on `error.retryable`. D3's OpenAI fallback is registering a second adapter — no caller change.
- **Opacity is enforced, not hoped for.** `redaction.ts` drops `modelUsedInternal` (the real model name) and `key` (the provider/source) before anything returns to a surface; logs run through `@henryco/observability`'s `createRedactor` (`packages/observability/src/index.ts:25`). The client receives an `AiUsageReceipt` (§3.5) that names **neither the provider/source nor the model** — only "Henry Onyx Intelligence."

### 1.4 The surface registry — governance starts here

Every entry point is a **registered surface** with a stable key and policy. Pure and testable; the *rates* it references live in the governed rate card (§3.3).

```ts
export type AiSurfaceKey =
  | "marketplace.listing.draft"   // Pass 1 — METERED (a seller's business task)
  | "support.message.assist"      // later — FREE  (company-critical: V3-29)
  | "account.check.assist"        // later — FREE  (V3-31)
  | "studio.brief.staff"          // later — FREE/internal (the existing staff copilot; NOT billed)
  | "studio.brief.client"         // later — METERED (client-end briefs; V3-32)
  | "business.message.assist";    // later — METERED (V3-30)

export interface AiSurfacePolicy {
  surface: AiSurfaceKey;
  billable: boolean;             // false ⇒ company-critical/subsidized; no wallet interaction
  ruleBookKey: string;          // → pricing_rule_books (margin %, caps); ignored when !billable
  modelTier: "fast" | "standard" | "deep";
  maxOutputTokens: number;
  maxCalls: number;             // upper bound on provider round-trips per task (estimator uses this)
  freeAllowancePerDay?: number; // rate-limit even FREE surfaces (the studio anti-abuse lesson)
}
```

The FREE/METERED split is the owner's model: free for company-critical tasks, metered for personal/business tasks (`docs/v3/PASS-REGISTER.md:131`). It is **per-surface data** — flipping a surface is a rate-card edit. Note V3-32 splits into `studio.brief.staff` (FREE/internal — billing staff usage is neither intended nor supported) and `studio.brief.client` (METERED), per the register's "metered for client-end" (`PASS-REGISTER.md:141`).

---

## 2. The metering model

### 2.1 What a "unit" is

The billable quantity is **provider tokens** — the only thing the provider charges on and the only thing we can meter truthfully. A call's metered usage is the `ProviderUsage` the adapter returns. Credits, if ever offered, are a *funding* UX over kobo, never the metering unit (see [D4](./D3-D4-DECISION-FRAMEWORK.md#d4)).

### 2.2 Two metering moments: estimate (provable upper bound), then actual

- **Estimate (pre-flight, step 2)** drives the reservation and the pre-paid gate. It must be a **provable upper bound** on the §2.3 cost formula, or the prepaid guarantee fails. Concretely the estimator assumes, for the surface's policy: input tokens from the actual prompt size, **output = `maxOutputTokens`**, **cache-write = the worst-case prompt-cache write**, **cache-read = 0** (reads only ever *lower* cost), and **`calls = maxCalls`**. By construction `estimate ≥ actual` for every call.
- **Actual (post-flight, step 5)** is `ProviderResult.usage`. The charge is repriced on actuals and the reservation settled — the user is **refunded the difference**. Because `actual ≤ reserved` is an invariant the estimator guarantees, settlement can never exceed the reservation (so the wallet can never be driven negative after the provider has run).

```ts
export interface MeteredUsage { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; calls: number; }
```

### 2.3 Cost — provider cost in kobo

Provider list prices (USD per million tokens) are converted and **pinned at rate-card authoring time** via `@henryco/pricing`'s `convertMinorUnits` (`packages/pricing/src/exchange-rate.ts`), so the hot path makes no FX call and cost is deterministic per rate-card version:

```
cost_kobo = round( inputTokens*r.in + outputTokens*r.out + cacheReadTokens*r.cacheRead + cacheWriteTokens*r.cacheWrite )
```

All rounding flows through the single chokepoint `roundInt` (`packages/pricing/src/index.ts:122`) so AI lines round identically to every other breakdown.

---

## 3. The margin engine (extends `@henryco/pricing`, reuses the VAT engine)

### 3.1 Where it plugs in

`@henryco/pricing` already owns `Money` (kobo, `index.ts:1`), `PricingBreakdown` (`:86`), the rounding chokepoint (`:122`), the rate-set→breakdown pattern, **and a complete VAT engine** (`vat.ts` + `TAX.vat`). The margin engine is a **sibling builder**, not a parallel system. Two additive changes only:

1. **Extend `PricingBreakdownLine.code`** (`index.ts:64-80`) with `"ai_compute" | "ai_margin"`. **VAT reuses the existing `"tax"` code** — do **not** add a `"vat"` code (it would be invisible to `extractTaxFromBreakdown`, `index.ts:161`, and never reach a receipt/invoice/remittance).
2. **Extend `PricingBreakdown.meta.division`** (`:98`) with `"ai"`.

`computeAiUsageBreakdown(...)` and `AiUsageRuleSet` are the only new symbols.

### 3.2 Per-tier rate card: cost → net → total, billed per call ("each question")

Two owner rules drive the pricing:

- **The company's percentage applies to every call.** Each *question* a user asks carries the company's margin on top of the provider cost — billed per call, from the wallet.
- **Higher models for higher operations are billed higher.** The company plans to route heavier operations to more capable models and charge more for them. So the rate card is **keyed by model tier**: a more capable tier (a stronger Claude model) carries a higher per-token cost *and* may carry a higher margin %, so a "deep" question costs more than a "fast" one — transparently, and priced before it runs.

The rate card is therefore a **tier table**, not a single rate. Each tier names (server-side, company-governed — never in this client-safe type) a concrete Claude model and carries that model's per-token kobo cost plus the company's margin % for that tier:

```ts
export type AiModelTier = "fast" | "standard" | "deep"; // extensible — the company can add e.g. "expert"

export interface AiTierRate {
  // The concrete Claude model backing this tier is COMPANY CONFIG (server-only) — never exposed here.
  rate: { in: number; out: number; cacheRead: number; cacheWrite: number }; // kobo per token for THIS tier's model
  marginRate: number;          // the company's % for THIS tier (a higher tier may carry a higher %)
  minChargeableKobo: number;   // per-call floor
  maxCostKoboPerCall: number;  // per-call cap (estimate above ⇒ refused pre-dispatch)
}

export interface AiUsageRuleSet {
  key: string;                 // e.g. "ai_usage_default_ngn" → pricing_rule_books.rule_book_key
  version: string;             // effective-dated
  currency: "NGN";
  tiers: Record<AiModelTier, AiTierRate>;   // ← per-tier rates + per-tier company %
}

export function computeAiUsageBreakdown(input: {
  rules: AiUsageRuleSet;
  tier: AiModelTier;           // the tier this operation resolved to
  usage: MeteredUsage;         // estimate OR actual
}): PricingBreakdown;
```

Per call, the resolved tier's row prices it (margin on **provider cost**, the owner's framing — `PASS-REGISTER.md:131`):

```
r           = rules.tiers[tier]
cost_kobo   = meter(usage, r.rate)                                       // higher tier ⇒ higher per-token cost ⇒ higher cost
margin_kobo = round(cost_kobo * r.marginRate)                           // the company's % for this tier — on THIS call
net_kobo    = max(r.minChargeableKobo, cost_kobo + margin_kobo)         // floor (see note)
breakdown   = { lines: [ {code:"ai_compute", amount:cost_kobo},         // internal-only line (§3.5)
                         {code:"ai_margin",  amount: net_kobo - cost_kobo} ],
                totals: { customerTotal: net_kobo, vendorGross: cost_kobo, platformNet: net_kobo - cost_kobo, vendorNet: 0 },
                meta: { division:"ai", ruleBookKey, ruleVersion, tier } }
withVat     = applyOutputVat(breakdown, { treatment: "standard" }, TAX.vat)  // adds a "tax" line; total = net + vat
total_kobo  = withVat.totals.customerTotal                               // billed per question, from the wallet
```

> **`minChargeableKobo` (the micro-call floor).** Without it, a call whose provider cost rounds margin to 0 (cost < ~5 kobo at 10%) realizes no margin, and sub-kobo charges are possible. The floor is applied to **`net_kobo`** (cost + margin) **per tier**, so the company's % holds at volume and every billed call clears a minimum. The floored remainder is attributed to the `ai_margin` line (net − cost), keeping the breakdown internally consistent before VAT.

Mapped onto `PricingBreakdown.totals` so downstream readers "just work": `customerTotal` = total debited; `vendorGross` = `cost_kobo` (COGS); `platformNet` = margin; the `tax` line + `meta.vat` carry VAT for receipts/remittance exactly as a marketplace sale does.

### 3.2a Tiered operations — higher models, higher bills, per question

The surface policy sets a **default tier** (`modelTier`), but an operation can **escalate** to a higher tier when it needs a more capable model — this is "higher models for higher operations." Escalation is server-side and governed: the gateway resolves the tier the operation requires (surface default, or the operation declares a heavier need), looks up that tier's company-set Claude model + rate, prices the call from that tier's row, and bills it per question. Because every tier lives in one rate card, a "deep" question costs more than a "fast" one **by construction** — and the user always sees the **pre-flight price for the tier their operation will use** before it runs (never a surprise; [GUARDRAILS §2](./GUARDRAILS.md#2-pre-paid--the-wallet-gates-the-call)). The company governs **both axes** from the governance console (Pass 3) — *which Claude model backs each tier* and *the margin % per tier* — each change audited via `pricing_override_events`. The real model name and the provider source never leave the server in any of this.

### 3.3 Governance — the rate card is a versioned rule book

Margin %, per-token rates, caps, and the per-surface billable flag are **data**, not constants. They live in the existing **`pricing_rule_books`** table (`apps/hub/supabase/migrations/20260417170000_shared_pricing_governance.sql:6-21`): `rules jsonb` holds the `AiUsageRuleSet` body, versioned (`version`, `effective_from`/`effective_to`), **service-role-only by RLS** (`:69`). The AI engine adds rows, not tables:

- `pricing_rule_books`, `division='ai'`, `rule_book_key='ai_usage_default_ngn'`, `rules` = an `AiUsageRuleSet`. Per-surface overrides are keyed `ai_usage_<surface>`.
- Margin/rate changes go through **`pricing_override_events`** (`:41`, `before`/`after` jsonb) — the governance audit trail the later governance UI writes.

> The immutable **per-call** record is **not** `pricing_quotes` — that table's `total` column is `integer` (int4, ₦21.47M ceiling; `shared_pricing_governance.sql:34`), which violates the kobo-BIGINT directive at scale. Pass 1 adds a dedicated **`ai_usage_events`** table with `total_kobo BIGINT` (§7). `pricing_rule_books` (the rate card) is reused as-is.

### 3.4 VAT — reuse the existing engine

VAT is not net-new ([README](./README.md#vat--already-built-and-live-reused-not-reinvented)). The AI charge is the **platform's own VATable service** sold to the vendor → treatment `standard`, rate from `@henryco/config` `TAX.vat` (`packages/config/tax.ts:33`). It uses **`applyOutputVat`** (the EXCLUSIVE / add-on-top direction, `packages/pricing/src/vat.ts:97`), which the engine documents as fitting "a platform's own VATable service" (`vat.ts:93-95`): net is priced first, VAT added on top, the new `customerTotal` is the VAT-inclusive amount the wallet pays. This emits a `tax` line (`vat.ts:108`) read by `extractTaxFromBreakdown`, and the kobo VAT figure is available for the ledger leg.

> **Direction note.** Consumer marketplace prices are VAT-*inclusive* (carve, `applyInclusiveVat`). The AI charge is VAT-*exclusive* (add-on) because it is a B2B service fee quoted as cost+margin — an explicit, justified divergence the VAT engine supports directly. If the owner prefers a single inclusive regime everywhere, switch to `carveInclusiveVat`/`buildSaleVatRecognition`; the ledger leg below is unchanged.

### 3.5 Provider cost and margin are internal

`ai_compute` (provider cost) and `ai_margin` are breakdown lines **for the ledger and analytics**, never client fields. The redacted receipt shows only the user-facing total and its VAT — never cost, margin, provider, or model (revealing margin invites disintermediation and exposes the provider's price).

```ts
// index.ts (pure barrel) — what a surface is allowed to see
export interface AiUsageReceipt {
  totalKobo: number;        // what was debited (this question)
  vatKobo: number;          // shown for transparency/receipts
  surface: AiSurfaceKey;
  tier: AiModelTier;        // capability label only ("fast"|"standard"|"deep") — explains WHY a heavier question cost more.
                            // It is a capability name, NOT the real model name and NOT the provider/source.
  usageEventId: string;     // → ai_usage_events (support/audit reference)
  billed: boolean;          // false for FREE surfaces
  // NO cost, NO margin, NO real model name, NO provider/source.
}
```

A surface may render the tier with a friendly capability label (e.g. "Standard" / "Advanced") so users understand why a heavier operation costs more — but it must never map that label to a model id or to "Anthropic/Claude."

---

## 4. Billing — debit the wallet AND post the ledger, in one transaction {#4-billing}

This is the money core. It honors every Prime Directive by posting through the **real** double-entry ledger, not a side channel.

### 4.1 Two-phase: reserve, then settle (authorize → capture)

The call must be **pre-paid**, but true cost is known only after the provider responds. So billing is two-phase:

```
PRE-FLIGHT   reserve_wallet_for_ai_usage(estimate_total, idem) → HOLD; fails 'insufficient_funds' if available can't cover
   call provider …
POST-FLIGHT  post_ai_usage_charge(hold_id, actual_total, breakdown, idem)
                 → locks wallet (FOR UPDATE), debits balance_kobo, writes customer_wallet_transactions
                 → posts the balanced ledger entry (DR customer_wallet_liability / CR platform_revenue / CR vat_output_payable)
                 → releases the (estimate − actual) remainder of the hold
                 → idempotent: same source_event_id ⇒ no-op
```

A **new table `customer_wallet_ai_holds`** (kobo) models the reservation: `id`, `wallet_id`, `user_id`, `estimate_kobo`, `status (held|settled|released)`, `idempotency_key UNIQUE`, `surface`, `created_at`, `expires_at`. **Available balance** is computed read-time as `balance_kobo − Σ(holds where status='held' AND expires_at > now())` — so a crashed/abandoned call's hold stops counting against the user automatically (no sweeper required); an optional reaper flips stale rows to `released` for hygiene. This mirrors how marketplace already nets available balance against pending requests.

### 4.2 The guarded settlement RPC

```sql
-- DESIGN CONTRACT (Pass 1 migration). In payments_private. SECURITY DEFINER, search_path pinned, service_role-only.
create or replace function payments_private.post_ai_usage_charge(
  p_hold_id        uuid,
  p_user_id        uuid,
  p_usage_event_id uuid,          -- canonical id; also the ledger source_event_id (idempotency)
  p_cost_kobo      bigint,        -- provider cost  → platform_revenue split / COGS analytics
  p_margin_kobo    bigint,        -- company margin
  p_vat_kobo       bigint,        -- output VAT (from applyOutputVat / TAX.vat)
  p_breakdown      jsonb
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_total bigint := p_cost_kobo + p_margin_kobo + p_vat_kobo;
begin
  -- 1. idempotency: if ai_usage_events already settled for p_usage_event_id, return it unchanged.
  -- 2. SELECT ... FROM customer_wallets WHERE user_id = p_user_id FOR UPDATE;  (true row lock — not app CAS)
  -- 3. assert balance_kobo >= v_total  (never-negative; reservation already guaranteed it).
  -- 4. UPDATE customer_wallets SET balance_kobo = balance_kobo - v_total;
  -- 5. INSERT customer_wallet_transactions(type='debit', amount_kobo=v_total, balance_after_kobo=<new>,
  --        reference_type='ai_usage', reference_id=p_usage_event_id, division='ai',
  --        settlement_currency='NGN', display_currency='NGN', exchange_rate=1, metadata=p_breakdown);
  -- 6. INSERT ai_usage_events(... total_kobo=v_total, status='settled' ...).
  -- 7. POST THE LEDGER ENTRY (balanced; net = cost+margin recognized as revenue, VAT as liability):
  --      perform payments_private.post_ledger_entry('ai_usage', p_usage_event_id::text, 'AI usage', 'NGN',
  --        jsonb_build_array(
  --          jsonb_build_object('account_code','customer_wallet_liability','debit_minor', v_total,        'credit_minor',0),
  --          jsonb_build_object('account_code','platform_revenue',        'debit_minor',0,'credit_minor', p_cost_kobo + p_margin_kobo),
  --          jsonb_build_object('account_code','vat_output_payable',      'debit_minor',0,'credit_minor', p_vat_kobo)));
  --      -- DR total == CR (cost+margin) + CR vat  ⇒ balanced by construction.
  -- 8. UPDATE customer_wallet_ai_holds SET status='settled' WHERE id=p_hold_id; release the remainder.
  -- ALL in one txn. Any failure rolls the whole thing back.
end $$;

revoke all     on function payments_private.post_ai_usage_charge(uuid,uuid,uuid,bigint,bigint,bigint,jsonb)
  from public, anon, authenticated;     -- SEC-HARDEN-06: the PUBLIC/bootstrap grant is additive
grant  execute on function payments_private.post_ai_usage_charge(uuid,uuid,uuid,bigint,bigint,bigint,jsonb)
  to service_role;
```

Properties this guarantees (the Prime Directives, mechanically):

- **Atomic** — `SELECT … FOR UPDATE` + wallet debit + transaction insert + **ledger post** in one DB transaction; the ledger's own deferred balance trigger (`assert_entry_balanced`, `double_entry_ledger.sql:119`) is the final backstop. Mirrors the proven refund-debit pattern (`20260611130000_v3_19_refunds.sql:301-325`). **Strictly better than the current spend-path CAS**, and unlike that CAS it keeps `wallet_ledger_reconciliation` whole (the wallet-liability ledger account moves with the balance).
- **Idempotent** — `post_ledger_entry` dedups on `(source='ai_usage', source_event_id=p_usage_event_id)` via `on conflict do nothing` (`double_entry_ledger.sql:252`); `ai_usage_events` carries a matching unique key. A retry after the provider responded never double-charges and never double-posts.
- **Guarded** — `payments_private`, `SECURITY DEFINER`, `search_path` pinned, **executable only by `service_role`** with `revoke … from public, anon, authenticated` (the SEC-HARDEN-06 lesson), and the schema is not PostgREST-exposed — unreachable via `/rest/v1/rpc/`. A CI invariant asserts `EXECUTE=false` for non-service roles (mirrors the existing payments money-RPC grant invariant).
- **Kobo** — every amount `bigint` kobo; no floats touch money.
- **Correctly recognized** — net (cost+margin) → `platform_revenue`; VAT → `vat_output_payable`; the wallet liability decreases by the gross. Provider cost as a COGS expense is recognized separately when the company is invoiced by the provider (`DR ai_provider_cost / CR provider_payable` — a small chart addition mirroring `processor_fees`); margin = revenue − COGS in the P&L, not a point-of-sale carve.

### 4.3 Pre-paid gating (wallet-zero ⇒ no call)

`reserve_wallet_for_ai_usage(estimate_total, …)` returns `insufficient_funds` when `available < estimate_total`. The gateway treats that as a typed, **non-money error** and **returns before dispatching to the provider** — the model is never called, nothing is spent, the surface shows a "top up to continue" affordance. This is the owner's hard "wallet-zero = API not called" rule (`PASS-REGISTER.md:131`), enforced where it must be: before dispatch. FREE surfaces skip the wallet phase entirely (still rate-limited by `freeAllowancePerDay`).

The wallet is funded through the **existing rail**: `credit_wallet_topup` (`double_entry_ledger.sql:363`) credits the wallet and posts `DR payments_clearing / CR customer_wallet_liability` when a top-up settles — so AI spend draws down a balance that already has a clean ledger origin.

### 4.4 Who holds the wallet (Pass 1: the marketplace vendor)

There is **no separate vendor/seller wallet** — a marketplace vendor spends from the **shared `customer_wallets`** balance, the same wallet a buyer uses at checkout (`apps/marketplace/lib/marketplace/payment.ts`). The draft-a-listing charge debits the **vendor's `customer_wallets.balance_kobo`** (`actorId` = the vendor's `user_id`). No buyer is involved in listing creation.

### 4.5 Production-apply dependency

The ledger + `payments_private` + VAT settlement are **committed but not yet applied to prod** (the FL2 gate). The wallet table itself is live. So the *non-money* gateway (adapter, metering, margin math, FREE surfaces, the studio refactor) can build and run before FL2; the **metered** path's `post_ai_usage_charge` goes live when the ledger is applied (it rides the payments FL2 apply). And since pre-paying a wallet requires the funding rail (also FL2), metered AI billing is naturally a post-FL2 capability. The phased plan marks this gate.

---

## 5. The assist-surface pattern (Register-L; marketplace draft-a-listing first)

### 5.1 The contract a surface honors

1. Runs server-side (`"use server"`/RSC) and calls `runAiTask({ surface, actorId, input, idempotencyKey })`. **Never** imports a provider SDK; **never** sees a provider id, model, cost, or margin.
2. Renders in the correct **register**: **Register-L** (light-primary editorial) for customer/business audiences — `@henryco/dashboard-shell` primitives, serif display, division-accent tokens (`accent` for fills, `accentText` for AA accent-as-text, `packages/config/company.ts:31-40`). A dark-first customer surface is a defect (`docs/v3/inner-surfaces-map.md`). An owner/staff governance console is **Register-D** (`--cc-*`, `packages/command-surface`).
3. All visible strings via i18n **Pattern A** — added to the EN baseline + types, rendered through `translateSurfaceLabel` (`packages/i18n/src/surface-copy.ts:2369`); a bypassing literal is an i18n GAP. Copy is **calm authority** (no hype/superlatives; `pnpm tone:check`, `CLAUDE.md`).
4. Shows the **pre-flight price** ("about ₦X, debited from your wallet") and, after the call, the **redacted receipt**. Never a surprise charge.
5. Branded **"Henry Onyx Intelligence"** (string from `COMPANY`/`getDivisionConfig`/`toBrandName`, `packages/config/company.ts:157,529,557` — never hardcoded; "HenryCo" is a code identifier, never user-facing).

### 5.2 Where draft-a-listing mounts (concrete)

The vendor create/edit flow is a native `<form action="/api/marketplace">` carrying `intent=vendor_product_upsert` (`apps/marketplace/app/vendor/products/new/page.tsx:38`; persisted at `apps/marketplace/app/api/marketplace/route.ts:1640`). The vendor pages use the **local** `WorkspaceShell` (`apps/marketplace/components/marketplace/shell.tsx:485`), which has an `actions` slot and renders the form as `children` — no `hero` slot. So:

- **Mount point:** a Register-L panel as the **first child** of `WorkspaceShell` on `/vendor/products/new` + `/vendor/products/[id]`, above the `<form>` (mirroring the existing "Seller economics in this flow" `market-panel` at `new/page.tsx`). A "Draft with Henry Onyx Intelligence" trigger can also sit in the shell `actions` slot.
- **Flow:** vendor types a title (+ optional notes) → trigger → gateway drafts `summary`, `description`, suggested `category`, `specifications` → the draft **populates the form fields** (the field set is at `new/page.tsx:38-86`, including `base_price` in whole naira at `:86`) → vendor edits and submits as usual. The AI **never** writes to the DB; it only fills the form the human submits.
- **Billing:** metered; debits the vendor's `customer_wallets`. Pre-flight price shown on the trigger.

### 5.3 What the AI must NOT do on this surface

- It must not write to the DB or bypass the human-submitted upsert. The drafted listing flows through the **same** `vendor_product_upsert` path, inheriting its owner guard — the slug-takeover that once existed here is **already fixed** on main (the handler resolves the current slug owner and refuses cross-vendor upserts, `route.ts:1672-1691`; F-04), and it must not bypass the listing moderation gate (`evaluateListingSubmission`, `route.ts:1716`).
- AI-suggested prices are advisory and edited by the vendor before submit (`base_price` is whole naira at `marketplace_products.base_price`, `apps/marketplace/supabase/migrations/20260402180000_marketplace_init.sql:113`).

---

## 6. Observability & audit

Per `@henryco/observability` (`packages/observability/src/index.ts`):

- **`emitEvent`** with typed names in the closed `henry.<domain>.<entity>.<verb>` union — add `henry.ai.usage.estimated`, `henry.ai.usage.metered`, `henry.ai.usage.blocked` (insufficient funds / cap / kill switch), `henry.ai.provider.failed` (to `@henryco/intelligence`'s name registry). (`index.ts:32`)
- **`persistEvent`** (`:39`) writes a durable `henry_events` row per billed call; the immutable per-call money record is the `ai_usage_events` row.
- **`createRedactor`/`defaultRedactor`** (`:25`) scrub prompts, provider ids, model ids, and PII from every log line.
- **Governance changes** (margin/rate/billable-flag edits) write `pricing_override_events` **and** the server-only `audit-log` (`add_audit_log_v2`, `packages/observability/src/index.ts:65` subpath) — the V19 operator-action gate.

---

## 7. Data model summary (what Pass 1's migration creates)

| Object | Kind | Purpose |
|---|---|---|
| `pricing_rule_books` rows (`division='ai'`) | data (existing table) | AI rate card: per-token rates, margin %, caps, per-surface billable flag |
| `pricing_override_events` rows | data (existing table) | governance audit for margin/rate changes |
| **`ai_usage_events`** | **new table** (BIGINT kobo) | immutable per-call record: usage, cost/margin/vat/total_kobo, surface, status, rule_version |
| **`customer_wallet_ai_holds`** | **new table** (kobo) | pre-flight reservations, idempotency-keyed, expiry-aware |
| `customer_wallet_transactions` rows (`reference_type='ai_usage'`, `division='ai'`) | data (existing table) | the settled wallet debits |
| `ai_provider_cost` ledger account (+ `provider_payable`) | **new chart rows** | COGS recognition when the provider invoices the company |
| `reserve_wallet_for_ai_usage(...)` | **new RPC** (payments_private) | atomic, guarded, pre-paid reservation |
| `post_ai_usage_charge(...)` | **new RPC** (payments_private) | atomic, guarded, idempotent: wallet debit + balanced ledger post |

No existing money table behavior is altered. No payment RPC, payment-router provider, or `payments_private` existing function is modified — the AI path is **added alongside**.

---

## 8. Open questions routed to decisions

- **Provider** → [D3](./D3-D4-DECISION-FRAMEWORK.md#d3) — **already answered** (Anthropic primary + OpenAI fallback, tiered); Pass 1 sequences it (Anthropic first).
- **Margin model** → [D4](./D3-D4-DECISION-FRAMEWORK.md#d4) — the one open decision.
- **VAT at launch** → a finance checkpoint in [D4 / the decision sheet](./D3-D4-DECISION-FRAMEWORK.md#vat-checkpoint): collect 7.5% from the first metered call (the engine + `vat_output_payable` support it), or defer VAT until remittance reporting exists.

Continue to [PHASED-PASS-BREAKDOWN.md](./PHASED-PASS-BREAKDOWN.md) and [GUARDRAILS.md](./GUARDRAILS.md).
