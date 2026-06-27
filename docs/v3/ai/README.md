# Henry Onyx Intelligence — Governed AI Engine (Phase D foundation)

**Pass:** V3-AI-ENGINE-DESIGN-01 · **Type:** Design / architecture only (no feature code, no migration) · **Risk class:** M (money) · **Status:** Draft for owner ratification · **Base:** origin/main @ `67c2a67b`

> This folder is the blueprint for the **governed AI gateway + usage-billing + margin engine** — the foundation of Phase D ("AI Intelligence Layer", V3-26 → V3-33, `docs/v3/PASS-REGISTER.md:129`). It is the architecture the build passes implement. It introduces **no code and no migration**; it specifies them, and it frames the one owner decision (**D4**) still open for the first build pass.

---

## Executive summary

Henry Onyx Intelligence lets users invoke AI across the ecosystem and **bills each question** to their wallet, cleanly and pre-paid. One server-only package (`@henryco/ai-gateway`) is the single path to the model; every call is **metered** (provider tokens), **priced** (provider cost + the company's margin %, **per model tier**), has **VAT** added via the existing engine, and is **debited from the wallet in one guarded transaction that also posts a balanced double-entry ledger entry**. It is **pre-paid** (wallet-zero ⇒ the model is never called), **idempotent** (a retry never double-charges), and **provider- and model-opaque** (users only ever see "Henry Onyx Intelligence").

- **Tiered by model, billed accordingly.** Heavier operations route to stronger models and cost more — priced before the question runs. The company sets which Claude model backs each tier and the margin % per tier, all as governed config.
- **Posts through the real money spine.** The double-entry ledger, `payments_private` schema, wallet, VAT engine, and the provider-adapter pattern (`@henryco/payment-router`) already exist on `main`; the AI charge reuses them — it does not reinvent money.
- **First surface:** marketplace "draft-a-listing" (a metered vendor task). Later: support/account assists (free), business + studio assists (metered), the Intelligence chat surface, personal-task gating.
- **Decided:** D3 — provider is **Anthropic with company-governed model switching**. **Open:** D4 — the margin **numbers** (per-tier %), plus a VAT-at-launch finance checkpoint. See [the decision framework](./D3-D4-DECISION-FRAMEWORK.md).
- **This pass:** documentation only — no code, no migration. It specifies exactly what Pass 1 builds once D4 is ratified.

A fully worked numeric example (one question, end to end, including the ledger entry) is in [ENGINEERING-REFERENCE.md §1](./ENGINEERING-REFERENCE.md#1-worked-example--one-question-end-to-end).

---

## What this is

Users invoke AI across the ecosystem. Each call is **metered**, **priced per question** (provider cost + the company's margin %), and **debited from the user's wallet** — pre-paid, never a surprise charge, VAT accounted for. Pricing is **tiered by model**: higher operations route to stronger models and are **billed higher**; the company's margin % applies to **every call** and is governable per tier and per surface. The provider is **Anthropic**, with **company-governed model switching** across the Claude family (a fast model for routine drafts, a stronger one for complex reasoning — set by company config, not hardcoded; the seam keeps a provider swap possible later). **Neither the provider/source nor the real model name is ever shown to the user** — the surface is "Henry Onyx Intelligence" only.

The first assist surface is **marketplace "draft-a-listing"**: a vendor drafts a product listing with Henry Onyx Intelligence; the call is metered and debited from the vendor's wallet, posting revenue and VAT to the double-entry ledger.

## Read in this order

| # | Doc | What it answers |
|---|-----|-----------------|
| 1 | **[README.md](./README.md)** (this) | Orientation + the real money spine the design binds to. Read first. |
| 2 | **[ARCHITECTURE.md](./ARCHITECTURE.md)** | The gateway (provider-agnostic adapter seam, mirroring `@henryco/payment-router`), the metering model, the margin engine (extends `@henryco/pricing`), how a charge **debits the wallet and posts to the double-entry ledger in one guarded transaction** (idempotent, kobo, VAT via the existing engine), and the Register-L assist-surface pattern. |
| 3 | **[D3-D4-DECISION-FRAMEWORK.md](./D3-D4-DECISION-FRAMEWORK.md)** | **D3 is already answered** (2026-05-28: Anthropic primary + OpenAI fallback, tiered) — restated with the launch-sequencing consequence. **D4** (margin model) is the open decision: options + recommendation, framed for a clean owner choice. |
| 4 | **[PHASED-PASS-BREAKDOWN.md](./PHASED-PASS-BREAKDOWN.md)** | Pass 1 → later passes, with dependencies, risk class, and gates. |
| 5 | **[GUARDRAILS.md](./GUARDRAILS.md)** | The non-negotiables: money-grade billing, pre-paid gating, provider opacity, runaway-cost caps, abuse defence, observability/audit. |
| 6 | **[ENGINEERING-REFERENCE.md](./ENGINEERING-REFERENCE.md)** | Implementation-grade reference: a fully worked numeric example, data model/ERD, error taxonomy, failure-mode matrix, NFRs, test strategy, glossary. |

---

## The real money spine (what the AI charge posts through)

This pass studies the **actual** spine on `origin/main @ 67c2a67b` — not an idealized one, and not a stale branch. (The first study of this pass was run against the 180-commit-stale `v3/typography-reading-foundation` branch and wrongly concluded the ledger/VAT/payments did not exist; an adversarial pass on the merge base corrected it. The lesson is recorded in [§ Provenance](#provenance-why-this-design-was-rewritten).) The spine is **built and committed**, gated for production apply behind **FL2** (the owner-gated Paystack go-live: merchant approval + DPA → apply migrations → `sk_test_`→`sk_live_` → soak; `docs/v3/prompts/v3-15-payments-paystack-activation.md`).

### Double-entry ledger — `apps/hub/supabase/migrations/20260607120000_double_entry_ledger.sql`

- **`public.ledger_accounts`** (`:33`) — chart of accounts: `code` PK, `type ∈ {asset,liability,revenue,expense,equity}`, `normal_balance`, forced consistent with class (`:52`).
- **`public.journal_entries`** (`:69`) — one head per financial event; **`unique (source, source_event_id)`** (`:81`) is the idempotency key; `currency = 'NGN'` (`:85`); append-only.
- **`public.journal_lines`** (`:91`) — `debit_minor BIGINT` / `credit_minor BIGINT` (kobo), exactly-one-sided (`:106`), non-negative (`:101`).
- **Balanced by construction** — deferred constraint trigger `payments_private.assert_entry_balanced()` (`:119`, wired `:148`): at commit, ≥2 lines, `Σdebit = Σcredit`, total > 0, else rollback. **Append-only** — `payments_private.block_ledger_mutation()` blocks UPDATE/DELETE/TRUNCATE (`:158`).
- **The only sanctioned writer:** `payments_private.post_ledger_entry(p_source, p_source_event_id, p_description, p_currency, p_lines jsonb)` (`:200`) — validates NGN, ≥2 balanced lines, idempotent via `on conflict (source, source_event_id) do nothing` (`:252`).
- **Seeded chart** (`:58`): `cash_settlement`, `payments_clearing`, **`customer_wallet_liability`**, **`platform_revenue`**, `processor_fees`, `refunds`, `vat_payable`. The settlement-VAT migration adds **`vat_output_payable`** (liability) + `fee_vat_recoverable` (asset) (`20260607140000_v3_vat_01_settlement_vat.sql:40`).

### `payments_private` schema isolation — `20260605123000_payments_private_isolation.sql`

A non-PostgREST-exposed schema (`:14`): `revoke usage … from anon, authenticated`, `grant usage … to service_role`. The money RPCs live here, so they are **unreachable via `/rest/v1/rpc/`** by construction; routes call them over a pooled direct-Postgres connection as `service_role`. The payment-intent state machine (`enforce_payment_intent_transition`, `:28`) lives here too.

### Wallet — a projection of the ledger

- **`public.customer_wallets`** — `balance_kobo BIGINT`, `currency`, `frozen_at`/`frozen_reason`, `is_active`, `user_id`. Typed at `packages/data/src/database.types.ts:3231`. DB guard `customer_wallets_balance_nonneg CHECK (balance_kobo >= 0)` (`20260611130000_v3_19_refunds.sql:197`).
- **`public.customer_wallet_transactions`** — `amount_kobo`, `balance_after_kobo`, `type` (`debit`/`credit`), `status`, `reference_type`/`reference_id`, `division`, `display_currency`/`settlement_currency`/`exchange_rate`, `metadata`. Typed at `database.types.ts:3098`. (Note: no `currency_snapshot` column.)
- **The wallet balance is a projection of the ledger account `customer_wallet_liability`** — `payments_private.wallet_ledger_reconciliation()` (`double_entry_ledger.sql:464`) asserts `Σ balance_kobo == credit-balance of customer_wallet_liability`.
- **Mutation is split, and that is the key opening for this pass:**
  - **Credit (top-up)** — `payments_private.credit_wallet_topup(...)` (`double_entry_ledger.sql:363`): atomic balance increment **and** `DR payments_clearing / CR customer_wallet_liability` in one txn. ✓ ledger-tied.
  - **Refund debit** — inside `initiate_payment_refund(...)` (`20260611130000_v3_19_refunds.sql:301`): `SELECT … FOR UPDATE` + never-negative + balance decrement **and** `DR customer_wallet_liability / CR payments_clearing`. ✓ ledger-tied.
  - **Spend debit (marketplace sale, studio invoice) — still app-layer compare-and-swap, NOT ledger-tied:** `apps/marketplace/app/api/marketplace/route.ts:919-927` (`.update({ balance_kobo }).eq("balance_kobo", currentBalanceKobo)`) + a transaction row (`:942`); same in `apps/account/app/api/studio/payments/[id]/wallet/route.ts:100-102`. **There is no general-purpose `debit_wallet` RPC.** A wallet-paid sale moves the projection without posting to `customer_wallet_liability` — which would break `wallet_ledger_reconciliation` by construction.

> **Consequence for this design.** The AI usage charge is a **wallet spend**, and it must be the *first* spend path done correctly: a **new guarded `post_ai_usage_charge` RPC** in `payments_private` that, in one transaction, locks the wallet (`FOR UPDATE`), decrements `balance_kobo`, writes the `customer_wallet_transactions` row, **and posts the balanced ledger entry** (`DR customer_wallet_liability / CR platform_revenue / CR vat_output_payable`) — mirroring the proven refund-debit pattern. This satisfies V3-27's stated dependency on V3-17 (the ledger), keeps `wallet_ledger_reconciliation` whole, and establishes the atomic spend pattern the existing marketplace/studio CAS writes can migrate to later. See [ARCHITECTURE §4](./ARCHITECTURE.md#4-billing).

### VAT — already built and live, reused (not reinvented)

VAT is a complete, audited, config-driven engine on main:

- **`@henryco/config` `TAX.vat`** (`packages/config/tax.ts:33`): `{ jurisdiction:"NG", standardRate:0.075, rateVersion:"NG-VAT-7.5-2020-02-01", currency:"NGN" }`, plus per-supply `TAX_CLASSIFICATION` + `resolveVatClassification(...)` (`:213`). One rate; `treatment` varies per supply.
- **`@henryco/pricing/vat.ts`** — `computeOutputVat`/`applyOutputVat` (EXCLUSIVE add-on, `:75`/`:97`), `carveInclusiveVat`/`applyInclusiveVat`/`buildSaleVatRecognition` (INCLUSIVE carve, `:149`/`:187`/`:223`). Rate is dependency-injected via a `VatRatePolicy` (canonical value = `TAX.vat`); never hardcoded.
- **The canonical VAT line code is `"tax"`** (`packages/pricing/src/index.ts:64-80`), read everywhere via `extractTaxFromBreakdown` (`:161`); the authoritative kobo figure is `PricingBreakdown.meta.vat` (`:110`). **A new AI charge must emit `code:"tax"`** — a parallel `"vat"` code would be invisible to every receipt/invoice/remittance reader.
- **Settlement posting:** `payments_private.post_sale_revenue(p_source_event_id, p_gross_minor, p_output_vat_minor)` (`20260607140000_v3_vat_01_settlement_vat.sql:197`) posts `DR payments_clearing / CR platform_revenue(gross−vat) / CR vat_output_payable(vat)`; the live marketplace path reads `meta.vat.outputVatMinor` and calls it (`apps/marketplace/lib/checkout/sale-reconcile-port.ts:185`).

> The AI charge **reuses this engine**: it prices net = cost + margin, adds VAT via `applyOutputVat` (treatment `standard`, policy `TAX.vat`) — the EXCLUSIVE direction the engine documents as fitting "a platform's own VATable service" (`vat.ts:93-95`) — emits a `tax` line, and posts `vat_output_payable` through the ledger. **D5 (tax engine) is largely pre-answered** for AI: the rate + classification already live in config.

### The provider-adapter template — `@henryco/payment-router`

The directive's "swappable provider, like the payment adapter" is real: `PaymentProviderAdapter` (`packages/payment-router/src/providers/adapter-interface.ts:159`) — a `readonly key` discriminant + `Result<T, ProviderError>`-returning methods; the router registers a `Map<key, adapter>` and fails over by capability/country (`router.ts:73-151`); the **provider identity never reaches the client** (`RouteSuccess` omits the key, `router.ts:40`; provider surfaces only via server-side hooks, ANTI-CLONE Principle 9); secrets are read in exactly one factory (`createPaymentRouter`, `router.ts:187`). The AI gateway mirrors this seam — and **improves on it** with a hard `./server` exports boundary (payment-router isolates by convention, not an exports wall).

### The one existing AI integration

`@henryco/intelligence` is **100% heuristic** (no model, no embeddings) — safe to leave or extend. The only real model calls are **three** `apps/studio` server actions using `@anthropic-ai/sdk` (`claude-haiku-4-5`): `brief-copilot-action.ts:791`, `refine-draft-action.ts:105`, `brief-chat-action.ts:126`. They already encode the right hardening (server-only, graceful no-key fallback `brief-copilot-action.ts:646`, anti-abuse `:42`, salted dedup `:461`, timeout/backoff `:440`) — the gateway harvests these and the three become its first refactor targets. `ANTHROPIC_API_KEY` is read ad-hoc in studio; **no central provider-secret seam exists yet** (`integrations.ts` holds only `NEXT_PUBLIC_*` keys) — the gateway adds one, server-only.

---

## Where this lands in the codebase (real anchors @ 67c2a67b)

| Concern | Reuse / extend | Anchor |
|---|---|---|
| Money type, breakdown, rounding chokepoint | `@henryco/pricing` (`Money`, `PricingBreakdown`, `roundInt`/`sumAmounts`) | `packages/pricing/src/index.ts:1,86,122,128` |
| VAT (reuse, don't reinvent) | `applyOutputVat` + `TAX.vat`; emit `tax` line code | `packages/pricing/src/vat.ts:97`; `packages/config/tax.ts:33`; line code `pricing/src/index.ts:79` |
| Margin engine | **extend** `@henryco/pricing` — `computeAiUsageBreakdown()`, line codes `ai_compute`/`ai_margin`, division `"ai"` | `packages/pricing/src/index.ts:64-80,98` |
| Rate-card governance | `pricing_rule_books` (versioned JSONB rules, service-role RLS) | `apps/hub/supabase/migrations/20260417170000_shared_pricing_governance.sql:6-21,69` |
| Ledger posting | `payments_private.post_ledger_entry`; accounts `customer_wallet_liability`/`platform_revenue`/`vat_output_payable` | `…/20260607120000_double_entry_ledger.sql:200,58`; `…/20260607140000_v3_vat_01_settlement_vat.sql:40` |
| Wallet (debit substrate) | `customer_wallets`/`customer_wallet_transactions`; new guarded debit RPC mirrors `initiate_payment_refund`'s wallet leg | `database.types.ts:3231,3098`; `…/20260611130000_v3_19_refunds.sql:301` |
| Gateway package | **new** `@henryco/ai-gateway` (pure `.` barrel + server-only `./server`), mirroring `@henryco/payment-router` | `packages/payment-router/src/providers/adapter-interface.ts:159`; `packages/payment-router/package.json:6` |
| Provider-secret seam (new) | server-only `getAiProviderConfig()/isConfigured` (mirror `integrations.ts` shape, NOT `NEXT_PUBLIC`) | `packages/config/integrations.ts` |
| First assist surface | marketplace `vendor_product_upsert` form; Register-L panel in the vendor shell | `apps/marketplace/app/vendor/products/new/page.tsx:38`; `apps/marketplace/app/api/marketplace/route.ts:1640` |
| Brand string (user-facing) | "Henry Onyx Intelligence" via `COMPANY`/`getDivisionConfig` (or `toBrandName`); never hardcode | `packages/config/company.ts:157,529,557` |
| Assist-surface register | Register-L (light-primary editorial) via `@henryco/dashboard-shell` | `docs/v3/inner-surfaces-map.md:28` |
| i18n for new strings | Pattern A — extend EN baseline + types, route via `translateSurfaceLabel`; calm-authority voice (`tone:check`) | `packages/i18n/src/surface-copy.ts:2369`; `packages/i18n/src/locales.ts:18`; `CLAUDE.md` |
| Metering / events / redaction | `@henryco/observability` (`emitEvent`, `persistEvent`, `createRedactor`, server-only `audit-log`) | `packages/observability/src/index.ts:25,32,39,65` |

---

## Prime Directives this design must never violate

1. **Money is kobo (integer BIGINT).** Marketplace product prices are stored in *whole naira*; convert at the boundary (`*100`) as checkout does (`apps/marketplace/app/api/marketplace/route.ts:671`).
2. **Money moves only through a guarded RPC** in `payments_private` — `SECURITY DEFINER`, `search_path` pinned, **`revoke … from public, anon, authenticated`** then `grant execute … to service_role` (the SEC-HARDEN-06 lesson: the PUBLIC/bootstrap grant is additive, so revoking from `public` alone is a no-op), reachable only by the server as `service_role`.
3. **The ledger is balanced and append-only** — every AI charge posts a balanced `journal_entries`/`journal_lines` pair via `post_ledger_entry`; corrections are reversing entries, never edits.
4. **Every billed call is idempotent** — a canonical `source_event_id` makes a retry a no-op, never a double-charge.
5. **Pre-paid.** Wallet balance gates the call; estimated cost > available balance ⇒ **the provider is never called** (wallet-zero cap).
6. **Provider + model opacity.** The provider/source (Anthropic), the **real model name** (any Claude model id), and the API key never reach the client, never appear in copy/errors/receipts, and are redacted from logs. The user sees "Henry Onyx Intelligence" — nothing else.
7. **Brand + voice.** User-facing brand is **Henry Onyx** ("HenryCo" is a code identifier only); copy is **calm authority** (no hype/superlatives; `pnpm tone:check`). All strings via i18n Pattern A.
8. **Register-L** for customer/business assist surfaces; a dark-first customer surface is a defect.
9. **Do not touch** `packages/search-ui` (owner-reserved), the payment-router providers, the payment money RPCs, or `payments_private` behavior. This design *adds* an AI posting path alongside them.

---

## Provenance — why this design was rewritten

The first draft of this doc set was authored from a study run against the checked-out working branch (`v3/typography-reading-foundation`), which is ~180 commits behind main and predates the payments/ledger/VAT program. That draft wrongly asserted "no ledger, no VAT, no payment RPCs" and proposed reinventing them. A four-critic adversarial review pointed at the merge base caught the VAT error; verifying the base directly surfaced the rest. **Every source claim here is re-derived against `origin/main @ 67c2a67b`** (the PR base). Future readers: app-file line numbers drift — trust the named symbols over the line numbers, and re-verify against the current base before building.

## Scope boundary

Documentation only. No package, no migration, no surface is built. The phased breakdown specifies what Pass 1 builds once **D4** is ratified (D3 is already answered).
