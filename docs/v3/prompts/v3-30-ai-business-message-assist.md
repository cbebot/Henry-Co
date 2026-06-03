# V3-30 — AI Intelligence Layer: Business Message Assist (metered)

**Pass ID:** V3-30  ·  **Phase:** D (AI Intelligence Layer)  ·  **Pillar:** P4 (Henry Onyx Intelligence), P8 (Partner & Enterprise)
**Dependencies:** V3-28 (Intelligence chat surface), V3-26 (provider router), V3-27 (usage-billing engine), V3-33 (personal-task gating); V3-57 (business profiles) consumed when present  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-29, V3-31, V3-32)
**Owner gate:** none for the assist itself; AI provider = D3 and AI margin = D4 are **recorded** in `docs/v3/DECISIONS-REQUIRED.md` (confirm, don't re-litigate)  ·  **Risk class:** Money

---

## Role

You are the V3 AI Intelligence engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships **Business Message Assist**: a drafting helper that lets a *business owner* write professional, brand-consistent, customer-facing copy — hiring outreach, listing descriptions, studio proposal language, provider bios. Because the business is selling, this is a *personal/commercial* task, so it is billed `metered_business`: the business wallet is debited per call with the ratified margin layered in. The line you must not cross: **money truth is absolute.** Every billable call is idempotent, wallet-checked before the provider is touched, and never optimistically charged — a failed generation is never billed.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/30-ai-business-message-assist` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Business-side composers already exist and are the real integration points. Jobs ships `apps/jobs/components/hiring/MessageComposer.tsx` with a server-side limiter at `apps/jobs/lib/jobs/messages-rate-limit.ts` and an API under `apps/jobs/app/api/hiring/messages/`. Studio ships the proposal flow under `apps/studio/app/proposals/[proposalId]/` plus a *deterministic, Anthropic-backed* brief copilot (`apps/studio/lib/studio/brief-copilot-action.ts`) with battle-tested anti-abuse ceilings. Marketplace listing authoring and Care provider-profile bios are the other two target surfaces. None of these has a governed, metered, wallet-debited drafting assistant today.

This pass adds the `business_message_assist` task class and wires the V3-28 Henry Onyx Intelligence overlay (metered preset) into those four business composers, charging the business wallet through V3-27 with the V3-33 gate enforcing balance before any provider call. It does not build new payment, router, or chat infrastructure — it composes them.

## Mandatory scope

### S1 — Register the `business_message_assist` task class (metered)

```sql
insert into public.ai_task_pricing (task_class, billing_mode, min_charge_minor, provider_cost_ceiling_minor, margin_bps, description)
values ('business_message_assist', 'metered_business', /* min charge in kobo */ :min, /* ceiling */ :ceiling, /* D4 margin */ :margin_bps,
        'Drafts customer-facing business copy. Metered against business wallet.')
on conflict (task_class) do update set billing_mode = excluded.billing_mode, margin_bps = excluded.margin_bps;
```

`margin_bps` reflects the D4-ratified markup (default 10% = 1000 bps; confirm the recorded answer, do not invent). All money is integer minor units (kobo). Add `business_message_assist` to the `TaskClass` union in `@henryco/ai-router/src/types.ts`.

### S2 — System-prompt preset

Add `business-message-assist` to the V3-26 prompt registry (`packages/ai-router/src/prompts/`):

- **Persona:** "You are Henry Onyx Intelligence, helping a business owner write professional, on-brand, customer-facing copy." (Brand from `@henryco/config`.)
- **Context injection:** when V3-57 business profiles exist, inject the business's name, tone, and language preference; until V3-57 ships, accept an explicit `{ businessName, tone }` arg with a neutral-professional default. Keep the injection point a single typed function so V3-57 wiring is a one-line swap.
- **Task variants** by calling surface: `hiring_outreach`, `listing_description`, `studio_proposal_copy`, `provider_bio`. Each is a sub-template, one preset, selected by a `variant` field.
- **Guardrails:** standard profile (inherited from V3-28) — no competing-brand promotion, no anti-company copy, no fabricated claims/credentials about the business.
- **Output contract:** zod-validated `{ draft: string, variant: BusinessAssistVariant }`.

### S3 — Wire the four business surfaces

- **Jobs hiring** — affordance in `apps/jobs/components/hiring/MessageComposer.tsx`; draft inserts into the message body. Coexists with the existing `messages-rate-limit.ts` (the assist's AI limit is separate from the send limit).
- **Marketplace listing** — affordance in the seller listing-description composer; draft inserts into the description field.
- **Studio proposal** — affordance in the proposal-copy composer under `apps/studio/app/proposals/[proposalId]/`; reuses the existing brief-copilot session/abuse pattern but routes through the V3-26 router and V3-27 billing instead of the standalone Anthropic call. (Do not delete the deterministic copilot in this pass; route the *new metered drafting* through the unified path and leave deprecation of the standalone call as a noted follow-up.)
- **Care provider bio** — affordance in the provider-profile bio composer; draft inserts into the bio field.

Each is the V3-28 overlay bound to `business_message_assist` with the surface's `variant`. The cost-per-call preview (from V3-27) is shown **before** generation; the user confirms; only then is the provider called and the wallet debited.

### S4 — Per-business rate limit

100 assist generations per business per UTC day, enforced server-side at the router boundary (independent of, and additional to, per-surface send limits). On breach return V3-33's `rate_limited`.

### S5 — Telemetry

- `henry.intelligence.business_assist.opened`
- `henry.intelligence.business_assist.draft_used`
- `henry.intelligence.business_assist.charge_recorded` (money-truth event; emitted only after the ledger entry commits)

## Out of scope

- Autonomous catalog/listing generation (assist drafts only; the business owner always authors the final). New product surfaces — Phase G.
- Business profiles themselves — **V3-57** (this pass consumes them).
- The chat overlay, guardrails, streaming — **V3-28**. Billing engine + ledger — **V3-27/V3-17**. The gate — **V3-33**.

## Dependencies

Hard: V3-28, V3-26, V3-27, V3-33. Soft (graceful until present): V3-57 business profiles, V3-17 ledger (the wallet/ledger primitives V3-27 charges against). Blocks nothing downstream.

## Inheritance

`@henryco/ai-router`, `@henryco/intelligence-chat` (V3-28), `@henryco/chat-composer`, `@henryco/config` (brand + division labels), `@henryco/observability` (telemetry + audit), `@henryco/i18n`, and the V3-27 wallet/billing + V3-17 ledger primitives.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_30_business_assist_task_class.sql` — register metered task class with margin (S1).
- `packages/ai-router/src/prompts/business-message-assist.ts` — preset with four variants (S2).
- `packages/ai-router/src/types.ts` — extend `TaskClass` + add `BusinessAssistVariant`.
- Composer wirings: `apps/jobs/components/hiring/MessageComposer.tsx`, marketplace listing composer, `apps/studio/app/proposals/[proposalId]/` composer, Care provider-bio composer.
- `apps/<app>/app/api/intelligence/business-assist/route.ts` (or the shared V3-28 assist route with `taskClass`/`variant` args) — server entry: wallet pre-check → cost preview → confirm → router call → ledger debit → response.

### Trust / safety / compliance
- **Money invariants (absolute):** idempotency key on every billable call; wallet balance ≥ computed charge checked *before* the provider is invoked (V3-33 enforces); charge committed only on successful generation; on provider error, **no debit**. Amounts are BIGINT minor units; the charge is `provider_cost × (1 + margin_bps/10000)` rounded per the ledger's rounding rule.
- Business-account context required (V3-33 `business_account_required` when absent).
- `requireSensitiveAction` is NOT required (this is a billed-but-non-destructive action); audit every charge via `@henryco/observability/audit-log` (actor = business user, action = `business_assist.charged`, amount, idempotency key).
- Provider name never appears anywhere — UI, logs, telemetry, error copy.

### Mobile + desktop parity
Overlay full-screen on web mobile; Expo-native chat in the super-app via the V3-28 shared package. Cost-preview and confirm controls must be reachable above the keyboard (safe-area + `useViewportKeyboard`).

### i18n
Namespace `surface:intelligence.business_assist`. Affordance labels, the four variant titles, cost-preview/confirm copy, rate-limit and error states are keyed copy (Pattern A; Pattern B fallback for the other 11 locales). Respect the business's language preference for the *drafted content's target language* (passed to the model as an instruction), distinct from the UI locale. Zero hardcoded user-facing strings.

### Brand & design system
User-facing surface = **Henry Onyx Intelligence**; division labels ("Henry Onyx Jobs", "Henry Onyx Studio", etc.) sourced from `@henryco/config`. Overlay inherits V3-28 branded chrome (Fraunces, locked `--site-*`/`--accent`, light + dark). Cost preview uses `@henryco/payment-surface` primitives for amount display **style only** — no payment-behaviour changes here; the actual debit is V3-27's ledger call. Zero hardcoded domains.

## Validation gates
1. CI green: typecheck · lint · test · build.
2. i18n strict gate green for `surface:intelligence.business_assist`.
3. End-to-end in each of the four surfaces: open → cost preview → confirm → draft inserted into the surface's field.
4. **Metered billing proof:** a successful generation debits the business wallet by exactly `provider_cost × (1 + margin)` (assert ledger delta + idempotency dedupe on retry); a forced provider error debits **nothing**.
5. Per-business rate limit: 101st generation in a day returns `rate_limited`.
6. Gate proof: missing business context → `business_account_required`; zero wallet → `wallet_zero_blocked` (V3-33).
7. UI: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All gates green; V3-28/26/27/33 + V3-17 merged; D4 margin confirmed against the recorded answer; 7-day soak with the telemetry dashboard showing `charge_recorded` equals ledger debit count (zero drift) and no charges on failed generations.

## Final report contract
`.codex-temp/v3-30-ai-business-message-assist/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `business_message_assist` registered `metered_business` with D4 margin (minor units) and added to `TaskClass`; `BusinessAssistVariant` defined.
- [ ] Preset added to V3-26 registry with four variants, business-context injection point, standard guardrails, brand from `@henryco/config`.
- [ ] Four business composers wired (jobs, marketplace, studio proposal, care bio) with cost-preview-then-confirm before any provider call.
- [ ] Money invariants proven: idempotent, pre-charge wallet check, debit only on success, no debit on error, BIGINT minor units, margin applied.
- [ ] Per-business 100/day limit enforced; gate errors (`business_account_required`, `wallet_zero_blocked`) proven.
- [ ] Three telemetry events (incl. `charge_recorded` post-commit) emitted and schema-valid; every charge audit-logged.
- [ ] i18n `surface:intelligence.business_assist` complete; brand/division labels via config; light+dark, mobile+desktop, CLS≈0.
- [ ] Report written.
