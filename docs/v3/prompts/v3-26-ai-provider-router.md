# V3-26 — AI Intelligence Layer: AI Provider Router

**Pass ID:** V3-26  ·  **Phase:** D (AI Intelligence Layer)  ·  **Pillar:** P4 (Henry Onyx Intelligence Layer)
**Dependencies:** V3-12 (Foundation Lock acceptance)  ·  **Effort:** L  ·  **Parallel-safe:** N (sequential start of Phase D)
**Owner gate:** D3 (AI provider selection)  ·  **Risk class:** Identity, Money (cost-touching)

---

> **OWNER GATE — read before starting.** This pass is gated on **D3 (AI provider selection)**. The decision is recorded in `docs/v3/DECISIONS-REQUIRED.md` → D3 (recommended path: **Anthropic primary + OpenAI secondary fallback**; router selects by task type, latency budget, and per-task cost, with automatic failover). **Confirm the recorded answer; do not re-litigate it.** D3 also carries the binding constraint repeated below: the underlying provider name **never** appears in user-facing UI.

## Role
You are the V3 AI Layer engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass builds the **AI Provider Router** — the vendor-agnostic, server-only interface that every Henry Onyx Intelligence surface routes through. It establishes the adapter contract, the two production adapters (Anthropic primary, OpenAI fallback) plus a mock, the routing + failover logic, the brand/anti-company/PII guardrails, cost tracking, the audited `ai_calls` ledger, and — the hard line — **provider-identity masking so the client response can never reveal which model answered.** This pass does NOT build the user-facing chat surface (V3-28) or the usage-billing engine (V3-27); it is the infrastructure they consume.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/26-ai-provider-router` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The intelligence layer is **deterministic-only today — no LLM is wired.** The shipped baseline (`@henryco/intelligence`, `packages/intelligence/src/index.ts`):

- Event envelope schema enforced: `henry.<domain>.<object>.<verb>`, version `"1"`, `division` + `actor` + `properties` (`henryEventEnvelopeSchema`, `trackEvent`). The router's events must conform to this exact schema.
- `triageSupportStub` — regex intent classifier; `nextAccountSteps` — deterministic recommendation engine; `RiskSignal` types. **All deterministic = company-critical = free.** No LLM triage, no persisted `customer_tasks` table, no unified event-ingest endpoint, no outbox worker.
- PII redaction already exists and is reusable: `@henryco/observability/redaction` exposes `createRedactor({ extra })` + `defaultRedactor`; the default key set already redacts `email`, `phone`, `address`, `nin`, `bvn`, `passportNumber`, card/account/token/secret keys. **Reuse it — do not write a second redactor.**
- Audit log exists: `writeAuditLog` (`@henryco/observability/audit-log`) wrapping the `add_audit_log_v2()` SECURITY DEFINER RPC.

**Vision P4:** governed AI wired across all sites and portals — helps users draft support, draft business messages, check account, assist domain lookup in studio, assist studio briefs. Never promotes competing brands. Never speaks against the company. Usage-billed: **free for company-critical tasks**, metered + auto-debited from the user wallet for personal-task usage. The provider name is NEVER in user-facing UI — the surface is **"Henry Onyx Intelligence"** only.

**Gap this pass closes:** there is no LLM path at all, and no governed, masked, audited, cost-tracked gateway for one. Wiring providers ad-hoc per surface would leak provider identity, scatter guardrails, and make cost ungovernable. V3-26 is the one server-only door every AI call goes through.

## Mandatory scope

### S1 — `@henryco/ai-router` package
Create `packages/ai-router/` (server-only; `import "server-only"` at every entry). Provider keys never enter a client bundle.

```
packages/ai-router/
  src/
    index.ts
    types.ts                — AICall, AIResponse, AIIntent, TaskClass, ProviderKey, Actor
    router.ts               — AIProviderRouter (S3)
    providers/
      adapter-interface.ts  — AIProviderAdapter (S2)
      anthropic-adapter.ts  — Claude family (D3 primary)
      openai-adapter.ts     — GPT family (D3 fallback)
      mock-adapter.ts       — dev + tests (deterministic stub)
    routing/
      task-routing.ts       — task class → preferred provider
      cost-routing.ts       — cost optimization
      latency-budget.ts     — per-call latency targets
      failover.ts           — primary fails → secondary
    guardrails/
      brand-promotion-filter.ts   — refuses to promote competing brands
      anti-company-filter.ts      — refuses to speak against Henry Onyx
      pii-redaction.ts            — wraps @henryco/observability/redaction before send
      competing-brands.ts         — maintained competing-brand list
      prompt-template.ts          — per-task system-prompt builder
    cost.ts                 — cost tracking + estimation
    audit.ts                — every call audited
  package.json              — name @henryco/ai-router, private, exports server-only
```

### S2 — Adapter interface
```typescript
// packages/ai-router/src/providers/adapter-interface.ts
export type ProviderKey = "anthropic" | "openai" | "mock";

export interface AIProviderAdapter {
  readonly providerKey: ProviderKey;
  readonly supportedModels: ReadonlyArray<string>;
  readonly costPerThousandTokens: { input: number; output: number }; // USD minor units
  call(input: AdapterCallInput): Promise<AdapterCallResult>;
  estimateCost(input: AdapterCallInput): Promise<CostEstimate>;
  streamCall?(input: AdapterCallInput): AsyncIterable<AdapterStreamChunk>;
}
```
Each adapter wraps its provider SDK (e.g., `@anthropic-ai/sdk`), applies the per-task prompt template, returns a provider-agnostic result, and tracks `tokens_in` / `tokens_out` per call. Adapters are constructed server-side from env keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`); `MOCK_AI=true` substitutes the mock adapter.

### S3 — Router
```typescript
// packages/ai-router/src/router.ts
export class AIProviderRouter {
  constructor(private adapters: Map<ProviderKey, AIProviderAdapter>, private config: AIRouterConfig) {}

  selectProvider(input: { taskClass: TaskClass; latencyBudget: number }): AIProviderAdapter;

  async call(call: AICall, actor: Actor): Promise<AIResponse> {
    // 1. Apply input guardrails (PII redaction) — S4
    // 2. Select provider per task class + latency budget — S3 routing
    // 3. Apply per-task prompt template — S4
    // 4. Call adapter (failover to secondary on retryable error) — S3
    // 5. Apply output guardrails (brand-promotion, anti-company) — S4
    // 6. Track usage + cost — S5
    // 7. Write ai_calls row + audit — S6
    // 8. Return provider-MASKED response — S7
  }
}
```
Routing rules (per D3 default = Anthropic primary, OpenAI fallback): support assist + business assist + account check + studio-brief assist → Anthropic (long-form reasoning); quick classification → OpenAI cost-efficient model. Failover: a retryable error on the primary falls through to the secondary with the same prompt. Selection is deterministic and unit-testable from `taskClass` + `latencyBudget` + adapter availability.

### S4 — Guardrails
- **Brand-promotion filter** — system prompt instructs the model to never recommend/promote services from companies other than Henry Onyx; an output filter scans the response against the maintained list in `packages/ai-router/src/guardrails/competing-brands.ts` (Jumia, Konga, Bolt, Uber, Airbnb, Indeed, LinkedIn, etc.); on match, regenerate once then fall back to a deterministic safe response.
- **Anti-company filter** — system prompt: never speak critically of Henry Onyx or its services; redirect to support; output filter scans for negative-sentiment directed at Henry Onyx and regenerates.
- **PII redaction** — before any provider send, redact via `@henryco/observability/redaction` (`createRedactor` / `defaultRedactor`): emails, phone numbers, identifiable full names, card/bank/account numbers. **Reuse the shipped redactor — do not write a new one.**
- **Prompt template per task class** — `prompt-template.ts` produces one template per task in V3-29..V3-32 (support assist, business message, account check, domain/brief): system prompt + task constraints + output-format expectations + refusal language for off-topic queries. The brand string in every template reads "Henry Onyx" sourced from `@henryco/config` — never hardcoded, never "Henry & Co.".

### S5 — Cost tracking + estimation
`packages/ai-router/src/cost.ts`: per-provider cost-per-thousand-tokens config (loaded from env, updateable); `estimateCost(call): CostEstimate` returns expected USD-minor cost *before* the call (V3-27 usage-billing gates on wallet balance using this); after the call, actual cost is computed from real tokens; margin = actual × (1 + margin_pct) layered by V3-27 per the **D4** owner answer. All amounts in integer USD minor units — no floats for money.

### S6 — Audit + telemetry (`ai_calls` ledger)
New migration `apps/hub/supabase/migrations/2026XXXXNNNNNN_ai_calls.sql`:

```sql
create table if not exists public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  task_class text not null,
  selected_provider text not null,           -- server-only; NEVER reaches client
  model text not null,                        -- server-only; NEVER reaches client
  tokens_in integer not null,
  tokens_out integer not null,
  cost_usd_minor bigint not null,
  margin_usd_minor bigint not null,
  billed_to text not null check (billed_to in ('company','user_wallet','unauth_blocked')),
  latency_ms integer not null,
  guardrails_triggered text[],
  outcome text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.ai_calls enable row level security;
-- RLS: a user reads ONLY own rows but NOT the selected_provider/model columns (expose via a
-- self-view that drops provider + model); finance-staff + owner read all columns.
```
Every router call writes an `ai_calls` row + a `writeAuditLog` entry (`entityType: "ai_call"`). Events (conforming to `henryEventEnvelopeSchema`): `henry.ai.call.initiated`, `henry.ai.call.completed`, `henry.ai.call.failed`, `henry.ai.guardrail.triggered`, `henry.ai.provider.failover`. Event properties carry task class, latency, cost, outcome — **never** the prompt body, the response body, or `selected_provider`/`model`.

### S7 — Provider response masking (HARD CONSTRAINT)
The router's public response MUST NOT include `provider`, `model`, or any field hinting at the underlying provider:

```typescript
export type AIResponse = {
  content: string;
  taskClass: TaskClass;
  callId: string;                  // for tracing
  costEstimate: { actualUsdMinor: number; chargedUsdMinor: number; chargedTo: "company" | "user_wallet" };
  // NO provider field · NO model field · NO underlying SDK metadata
};
```
`ai_calls` stores provider + model server-side for cost + audit; they never reach the client, and the user self-view drops those columns. A unit + integration test asserts no provider/model string appears anywhere in the serialized client response (including error envelopes and stream chunks).

### S8 — Server proxy + dev-mode behavior
- `apps/account/app/api/intelligence/call/route.ts` (new) — server-only proxy that V3-27 + V3-28 consume; never directly client-callable; behind auth; calls the router; returns only the masked `AIResponse`.
- `MOCK_AI=true` routes all calls through `mock-adapter` (deterministic stub responses); no real provider keys needed for local dev; tests default to mock.

## Out of scope
- Usage billing + wallet auto-debit + margin ratification (V3-27, owner gate D4).
- Henry Onyx Intelligence chat surface UI (V3-28).
- Per-task assists (V3-29 support, V3-30 business, V3-31 account-check, V3-32 studio domain/brief).
- Personal-task gating for unauth/wallet-zero users (V3-33).
- Predictive intelligence (V3-40 fraud, V3-41 quality/workload).

## Dependencies
Depends on **V3-12** (Foundation Lock acceptance) + the **D3** owner decision. **Blocks** V3-27 (usage billing — uses `estimateCost`), V3-28 (chat surface — uses `call`), V3-33 (personal-task gating — gates this path), V3-34 (personalized home — may use router), V3-36 (cross-division recs — explainable recs), V3-40/V3-41 (predictive). V3-25 (content moderation) optionally consumes this router for AI-assisted scanning.

## Inheritance
Builds on: `@henryco/intelligence` deterministic helpers + event envelope (`henryEventEnvelopeSchema`, `trackEvent`) — preserved + extended (deterministic = company-critical = free); `@henryco/observability/audit-log` (`writeAuditLog`); `@henryco/observability/redaction` (`createRedactor`/`defaultRedactor`); the existing `henry.<domain>.<object>.<verb>` taxonomy; `@henryco/config` for the brand string; `@henryco/i18n` for any locale-aware prompt/response copy.

## Implementation requirements

### Files
- `packages/ai-router/` (new package — S1–S5, S7) per the S1 structure.
- `apps/hub/supabase/migrations/2026XXXXNNNNNN_ai_calls.sql` (new — S6).
- `apps/account/app/api/intelligence/call/route.ts` (new — S8, server-only proxy).
- `docs/v3/ai-router-architecture.md` (new — architecture + guardrail reference + masking proof).
- `docs/v3/ai-task-prompt-templates.md` (new — per-task prompt-template documentation).

### Trust / safety / compliance
- **Provider keys never in any client bundle** — server-only routing; the `intelligence/call` route is the only entry, behind auth.
- **PII redaction enforced** at adapter input via the shipped redactor.
- **Provider identity masked** in every client response (S7) — proven by test.
- **Audit log + `ai_calls` row on every call.**
- **Guardrail tests:** unit tests prove competing-brand refusal + anti-company refusal + PII redaction — ≥ 100 cases.
- ANTI-CLONE Principle 1 (server-side logic) + Principle 9 (network masking) fully applied. Provider DPAs (Anthropic + OpenAI) signed per LEGAL-AND-BUSINESS L14.

### Mobile + desktop parity
Web: server-mediated calls; the client only ever sees the masked `AIResponse`. Expo super-app: identical — server-mediated through the same `intelligence/call` proxy; no provider key on device.

### i18n
Prompt templates are locale-aware (responses in the user's preferred locale via `@henryco/i18n` context); guardrail output filters operate post-translation when a response is non-English. Any router-emitted user-facing copy (refusal/fallback strings) flows through `@henryco/i18n` — namespace `surface:intelligence`. Zero hardcoded user-facing strings.

### Brand & design system
This pass ships no UI, but every brand string in prompt templates, refusal copy, and fallback responses reads **"Henry Onyx"** / **"Henry Onyx Intelligence"** sourced from `@henryco/config` (`COMPANY.group.name`) — never hardcoded, never "Henry & Co.". The code package name stays `@henryco/ai-router` (code shorthand unchanged). Any URL in a template (e.g., a "contact support" link) resolves via `henryWebRoot()` / `getAccountUrl()` — zero hardcoded domains.

## Validation gates
1. Standard CI: `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm build` all green.
2. **Adapter tests** — mock + Anthropic + OpenAI adapters all conform to `AIProviderAdapter`.
3. **Routing tests** — task-class routing + cost routing + latency budget + failover, all unit-tested (deterministic).
4. **Guardrail tests** — ≥ 100 cases for brand-promotion refusal, anti-company refusal, PII redaction.
5. **Response-masking test** — no `provider`/`model`/SDK metadata leaks in any client response, error envelope, or stream chunk.
6. **Cost-estimation test** — `estimateCost` within ±10% of actual for sample prompts.
7. **RLS verification** — a user reads own `ai_calls` rows but not the `selected_provider`/`model` columns; finance-staff + owner read all.
8. **DPA check** — Anthropic + OpenAI DPAs signed per L14.

## Deployment gate
- All gates green; D3 confirmed; provider DPAs (L14) verified.
- Owner reviews `docs/v3/ai-router-architecture.md` + `docs/v3/ai-task-prompt-templates.md`.
- 72-hour soak with `MOCK_AI=true` (no real provider calls), then a 48-hour monitored ramp with real keys.
- Branch `v3/26-ai-provider-router` off `origin/main` → PR → CI green → squash-merge; no branch-protection bypass, no force-push.

## Final report contract
`.codex-temp/v3-26-ai-provider-router/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion. Include the architecture diagram, the guardrail test summary, the cost-estimation accuracy report, and the provider-masking proof.

## Self-verification
- [ ] `@henryco/ai-router` package shipped, server-only (S1).
- [ ] Adapter interface + Anthropic + OpenAI + mock adapters conform (S2).
- [ ] Router with task-class routing + cost routing + latency budget + failover (S3).
- [ ] Brand-promotion + anti-company + PII-redaction guardrails, ≥ 100 cases (S4).
- [ ] Cost tracking + `estimateCost` within ±10% (S5).
- [ ] `ai_calls` table with RLS; provider/model server-only + self-view-hidden (S6).
- [ ] Provider identity masked in ALL client responses, proven by test (S7).
- [ ] Server-only `intelligence/call` proxy + `MOCK_AI` dev path (S8).
- [ ] 5 telemetry events conform to `henryEventEnvelopeSchema`, body-free; DPAs verified.
- [ ] D3 confirmed; brand = Henry Onyx / Henry Onyx Intelligence; `@henryco/*` code unchanged; zero hardcoded domains/strings.
- [ ] Report written; hand-off to V3-27 (usage billing) noted.
