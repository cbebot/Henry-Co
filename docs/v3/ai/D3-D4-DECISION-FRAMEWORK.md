# Decision Framework — D3 (answered), D4 (open), and the launch checkpoints

**Pass:** V3-AI-ENGINE-DESIGN-01 · Design only. The decisions that gate the first AI build pass.

> Two decision slots in `docs/v3/DECISIONS-REQUIRED.md` cover the AI engine: **D3** AI provider selection (blocks V3-26) and **D4** AI usage pricing markup (blocks V3-27). On `origin/main @ 67c2a67b`, **D3 is ANSWERED** (`DECISIONS-REQUIRED.md:77`) and **D4 is PENDING** (`:95`). This document restates D3 with its launch consequence, makes **D4** concrete for a clean choice, and surfaces two launch checkpoints (failover-at-launch, VAT-at-launch). The recommended option is listed first and marked ✅.
>
> **There is no "ledger fork."** An earlier draft proposed choosing between billing on the wallet vs the ledger — an artifact of a stale-branch study. On main the double-entry ledger exists and V3-27 explicitly depends on V3-17 (`PASS-REGISTER.md:136`); the AI charge posts through the ledger via the new guarded RPC ([ARCHITECTURE §4](./ARCHITECTURE.md#4-billing)). The only real sequencing fact is the **FL2 production-apply gate** (below).

Quick links: [D3](#d3) · [D4](#d4) · [VAT checkpoint](#vat-checkpoint) · [Decision sheet](#decision-sheet)

---

## D3 — AI provider selection — ANSWERED (Anthropic; company-governed model switching) {#d3}

> Reference: `docs/v3/DECISIONS-REQUIRED.md` [§ D3 — AI provider selection](../DECISIONS-REQUIRED.md#d3--ai-provider-selection). **Hard constraint:** neither the **provider/source** (Anthropic) **nor the real model name** (e.g. any Claude model id) ever appears in user-facing UI, copy, errors, or receipts — the user sees **"Henry Onyx Intelligence"** and nothing else. Both are server-only and redacted from logs.

**Owner's direction:** the provider is **Anthropic**, and the engine **switches between models depending on how the company configures it** — company-governed model selection across the Anthropic (Claude) family (a fast model for routine drafts, a stronger model for complex reasoning). This sharpens the register's 2026-05-28 answer (`DECISIONS-REQUIRED.md:77` — "Anthropic primary … tiered model strategy"): **Anthropic is the provider; the live, governable axis is which Claude model each surface/tier uses, set by the company** — not multi-provider routing. Settled; do not relitigate.

Design consequences:

1. **Model selection is company-governed configuration, not hardcoded.** The adapter's `modelTier: "fast" | "standard" | "deep"` ([ARCHITECTURE §1.3](./ARCHITECTURE.md#13-the-adapter-seam-mirrors-paymentprovideradapter)) maps to a concrete Claude model via a **company-set routing config** (carried in the rate card / provider config, governed like margins). The company changes which model a surface or tier uses **without a code change**; the model id stays server-only, and the user only ever sees "Henry Onyx Intelligence." The studio copilot's current `claude-haiku-4-5` becomes the default `fast` mapping until the company sets otherwise.
2. **The provider seam stays — so a provider *can* be switched "depending on how the company set it."** Anthropic is the configured provider today; because the adapter interface mirrors `@henryco/payment-router` (register an implementation behind a stable interface), a different or secondary provider can be enabled later **purely by company configuration** — no caller or surface change. A cross-vendor fallback is therefore *available through the seam if the company enables it*, not a required build item.

### Resilience note (not a blocking checkpoint) {#failover-checkpoint}

Running a single provider (Anthropic) with company-governed model switching is the **intended configuration**, so there is no "launched without failover" risk to ratify. The adapter still carries the studio integration's resilience — per-call timeout race, billing-error backoff, and graceful degrade (refuse/queue rather than error, `apps/studio/lib/studio/brief-copilot-action.ts:440,646`). If the company later wants cross-vendor outage resilience, registering a secondary-provider adapter is a configuration step the seam already supports.

---

## D4 — AI usage margin model — OPEN {#d4}

> Reference: `docs/v3/DECISIONS-REQUIRED.md` [§ D4 — AI usage pricing markup ratification](../DECISIONS-REQUIRED.md#d4--ai-usage-pricing-markup-ratification). **Status: PENDING** — owner to answer before V3-27. Owner's stated baseline: **~10% margin on provider cost**; FREE for company-critical tasks, METERED for personal/business tasks (`PASS-REGISTER.md:131`).

**Question:** how is the company's margin on AI usage structured?

**Owner's direction (this session):** *the company has its own percentage, applied to **every question (each call)**; and higher-capability models are released for higher operations and **billed higher** accordingly.* So the engine bills **per call** with **the company's margin % on top of provider cost on every call**, and pricing is **tiered by model** — a heavier operation routes to a stronger model whose higher provider cost (and, if the company sets it, higher margin %) makes the question cost more. This is realized directly: the rate card is a **per-tier table** ([ARCHITECTURE §3.2](./ARCHITECTURE.md#32-per-tier-rate-card-cost--net--total-billed-per-call-each-question)), each tier carrying its own per-token cost + company % ([§3.2a](./ARCHITECTURE.md#32a-tiered-operations--higher-models-higher-bills-per-question)).

**What the architecture makes true:** the per-tier margin %, the caps, and the per-surface billable flag are **data in the rate card** (`pricing_rule_books`, `division='ai'`), versioned and audited ([ARCHITECTURE §3.3](./ARCHITECTURE.md#33-governance--the-rate-card-is-a-versioned-rule-book)). So **A/B/C below are configurations of one margin engine** — the choice is the *launch numbers*, not which system to build. (Option D is a different axis — see the note.)

| Option | What | Trade-offs |
|---|---|---|
| **A — 0% pass-through** | User pays raw provider cost; company subsidizes everything. | + Most generous. − No revenue; doesn't fund the platform. |
| **B — Flat ~10% on cost, waivable for premium** ✅ *launch default* | `marginRate = 0.10` in the default rate book; company-critical surfaces set `billable:false`; waivable per premium tier (the register's Option B intent). | + Honors the owner's stated baseline; transparent; per-surface FREE/METERED already expressible. + Trivial to operate. − Leaves value on the table for premium "deep" tasks vs tiering. |
| **C — Tiered / per-surface margin** ✅ *the governed evolution* | Different `marginRate` per surface or capability tier (e.g. 5% fast / 15% standard / 25% deep) — additional rate-book rows. | + Captures more value where users value it most. − More to explain; tune with real usage data, not guesses. |
| **D — Subscription-only** | No per-call billing; users pay a fixed fee for unlimited Henry Onyx Intelligence (the register's Option D). | + Simple user mental model. − Caps revenue at the subscription price; mishandles "whale" users; abandons the metered, pre-paid wallet model the rest of Phase D is built on. Recommend **against** for launch. |

**✅ Recommendation: adopt B + C together — per-call margin, tiered by model — and decline D.** Bill **per call** with the company's % on provider cost (B), and make the rate card **per model tier** from day one (C), so higher operations on stronger models cost more — exactly the owner's direction. Company-critical surfaces are **FREE** (`billable:false`); metered surfaces bill per call; premium tiers may waive or discount. **Decline D (subscription)** for launch — it abandons the metered/pre-paid model and caps revenue; it can return later as a packaging layer over metered billing, not a replacement. Because every number lives in the governed rate card, all of this is set and later retuned without code, with a `pricing_override_events` audit trail.

**The only owner inputs needed are the numbers:**

1. **Margin % per tier.** A flat 10% across tiers is the obvious start (the stated baseline); or set a rising % on heavier tiers (e.g. `fast 10% / standard 12% / deep 15%`) so premium reasoning earns more. *(Default if unspecified: flat 10%.)*
2. **Which Claude model backs each tier** (company config, server-only) — this sets each tier's per-token cost, hence its price. *(Default: `fast` = the model studio uses today; `standard`/`deep` = stronger models you choose.)*
3. **FREE vs METERED per surface.** Proposed defaults: support-assist + account-check **FREE**; marketplace draft-a-listing + business-message + studio client-brief **METERED**; studio staff copilot **internal/FREE**.
4. **Premium-tier policy** — do premium subscribers get waived/discounted AI margin, and on which tiers?
5. **Per-call floor + caps** — minimum charge per question and the per-call cost ceiling per tier (runaway-cost guard).

> **Funding UX is a separate axis (not a margin option).** "Prepaid credit packs" are sometimes proposed here. They are **not** a margin model and **not** "just a labeled wallet top-up": the wallet ([ARCHITECTURE §4.4](./ARCHITECTURE.md#44-who-holds-the-wallet-pass-1-the-marketplace-vendor)) is a **single shared `customer_wallets` balance**, already pre-paid by ordinary top-up — so a trivial "pack" adds nothing. A *genuine* AI credit pack (AI-scoped balance, bonus credits like "buy ₦5k get ₦6k", expiry, non-refundability) cannot be a plain shared-wallet top-up without becoming a cash-equivalent spendable on real goods — a separate sub-balance/tagged-ledger and a money/accounting decision. **Flag it as a later, separate decision; it is out of scope for D4.**

> **Margin is never shown to the user.** The receipt shows only the user-facing total and VAT ([ARCHITECTURE §3.5](./ARCHITECTURE.md#35-provider-cost-and-margin-are-internal)).

---

## VAT-at-launch — a finance checkpoint {#vat-checkpoint}

VAT is **already engineered** ([README](./README.md#vat--already-built-and-live-reused-not-reinvented)): `@henryco/config TAX.vat` (7.5%, `rateVersion`), `@henryco/pricing` `applyOutputVat`, the `tax` line code, the `vat_output_payable` ledger account, and a `vat_reconciliation(from,to)` close (`20260607140000_v3_vat_01_settlement_vat.sql`). So **D5 (tax engine) is largely pre-answered for AI** — the rate + classification live in config; re-scope D5 from "VAT rate source" to "per-supply AI treatment/classification" (AI usage is `standard`).

The remaining question is a **finance/compliance call**, not an engineering default: **collect 7.5% VAT from the first metered AI call, or defer VAT (charge cost+margin only) until later?** Because the metered path rides the ledger apply (FL2) and `vat_output_payable` + `vat_reconciliation` already exist, **collecting at launch is fully supported** and is the recommended path — provided the company is VAT-registered for this supply. If the owner prefers to defer, the engine simply prices `treatment` as non-`standard` (0 VAT) until ready, with no code change.

> **Confirm:** collect 7.5% VAT on AI usage from Pass-1 launch (recommended; supported by `vat_output_payable` + `vat_reconciliation`), or defer? And: is Henry Onyx Limited VAT-registered for this supply?

---

## The FL2 production-apply gate (context, not a decision)

The ledger, `payments_private`, and VAT settlement are committed but **applied to prod only at FL2** (Paystack go-live; `docs/v3/prompts/v3-15-payments-paystack-activation.md`). The *non-money* gateway (adapter, metering, margin math, FREE surfaces, the studio refactor) can build and run before FL2; the **metered** billing path goes live with the ledger apply. Since pre-paying a wallet also requires the funding rail (FL2), metered AI billing is naturally a post-FL2 capability. No decision required — just sequencing the phased plan around it.

---

## Decision sheet {#decision-sheet}

| ID | Decision | Status / Recommended | Owner's answer | Unblocks |
|---|---|---|---|---|
| **D3** | AI provider + model switching | **ANSWERED** — Anthropic; company-governed switching across Claude models per surface/tier. **Provider source AND real model name never shown to users** (only "Henry Onyx Intelligence"). | ✓ (settled) | V3-26 |
| **D3-cfg** | Model routing config | Company sets which Claude model each tier/surface uses (governed like margins); a secondary provider stays optional via the seam | ✓ (config, not a build gate) | — |
| **D4** | Margin model (per-call %, tiered by model) | **OPEN (numbers only)** — per-call company % on every question + per-tier rate card (higher model → higher bill); decline subscription. Owner sets: per-tier %, model-per-tier, FREE/METERED, premium policy, floor/caps. | _____ | V3-27 (billing) |
| **D4-fund** | Prepaid credit packs | Separate later decision (cash-equivalence implications); NOT part of D4 | _____ (defer) | — |
| **VAT** | Collect VAT at Pass-1 launch | Collect 7.5% (supported by existing engine) — confirm VAT registration | _____ | metered billing |
| **D5** | Tax engine (AI scope) | Largely pre-answered — rate/classification in config; re-scope to per-supply AI treatment | _____ | (informational) |

Once **D4** (and the two checkpoints) are answered, [Pass 1](./PHASED-PASS-BREAKDOWN.md#pass-1) is fully specified.
