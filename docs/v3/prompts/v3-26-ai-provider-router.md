# V3-26 — AI Provider Router

**Pass ID:** V3-26
**Phase:** D (AI INTELLIGENCE LAYER)
**Pillar:** P4 (HenryCo Intelligence Layer)
**Dependencies:** V3-12 (Foundation Lock acceptance)
**Effort:** L (2–4 weeks)
**Parallel-safe:** NO (sequential start of Phase D)
**Owner gate:** D3 (AI provider selection)
**Risk class:** Identity, Money (cost-touching)

---

## Role

You are the V3 AI Layer engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass builds the **AI Provider Router** — the vendor-agnostic interface for the HenryCo Intelligence Layer. Per owner's binding constraint: **the provider name NEVER appears in user-facing UI; it is "HenryCo Intelligence" only.**

This pass does NOT build the user-facing chat surface (V3-28) or the usage-billing engine (V3-27). It establishes the technical infrastructure those surfaces consume.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/26-ai-provider-router` |
| Deploy | Vercel |
| Backend | Supabase |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §2.12 + Vision P4)

> ### 2.12 Intelligence layer (`@henryco/intelligence`)
> - Schemas + types + deterministic helpers (NOT LLM-backed today)
> - Event envelope schema: `henry.<domain>.<object>.<verb>` with version "1" + actor + properties
> - `triageSupportStub` — regex-based intent classifier
> - `nextAccountSteps` — deterministic recommendation engine
> - **Intentionally limited today:** no LLM triage, no persisted `customer_tasks` table, no unified event ingest endpoint, no outbox worker

> ### Vision P4
> Governed AI wired across all sites and portals. Helps users draft support, draft business messages, check account, assist domain lookup in studio, assist studio briefs. Never promotes competing brands. Never speaks against the company. Usage-billed: free for company-critical tasks, metered + auto-debited from user wallet for personal-task usage. Provider name NEVER in user-facing UI — it is "HenryCo Intelligence" only.

---

## Mandatory scope

### S1 — `@henryco/ai-router` package

```
packages/ai-router/
  src/
    index.ts
    types.ts                — AICall, AIResponse, AIIntent, TaskClass, ProviderKey
    router.ts               — main router
    providers/
      adapter-interface.ts
      anthropic-adapter.ts  — Claude family
      openai-adapter.ts     — GPT family
      mock-adapter.ts       — dev + tests
    routing/
      task-routing.ts       — task type → preferred provider
      cost-routing.ts       — cost optimization
      latency-budget.ts     — per-call latency targets
      failover.ts           — primary fails → secondary
    guardrails/
      brand-promotion-filter.ts  — refuses to promote competing brands
      anti-company-filter.ts     — refuses to speak against HenryCo
      pii-redaction.ts            — strips PII before sending to provider
      prompt-template.ts          — per-task system prompt builder
    cost.ts                 — cost tracking + estimation
    audit.ts                — every call audited
  package.json
```

### S2 — Adapter interface

```typescript
export interface AIProviderAdapter {
  readonly providerKey: 'anthropic' | 'openai' | 'mock';
  readonly supportedModels: ReadonlyArray<string>;
  readonly costPerThousandTokens: { input: number; output: number }; // in USD minor units
  call(input: AdapterCallInput): Promise<AdapterCallResult>;
  estimateCost(input: AdapterCallInput): Promise<CostEstimate>;
  streamCall?(input: AdapterCallInput): AsyncIterable<AdapterStreamChunk>;
}
```

Each adapter:
- Wraps the provider SDK (e.g., `@anthropic-ai/sdk`).
- Applies prompt-template per task class.
- Returns provider-agnostic response.
- Tracks tokens in + tokens out per call.

### S3 — Router

```typescript
export class AIProviderRouter {
  constructor(
    private adapters: Map<ProviderKey, AIProviderAdapter>,
    private config: AIRouterConfig
  ) {}

  selectProvider(input: { taskClass: TaskClass; latencyBudget: number }): AIProviderAdapter;

  async call(call: AICall, actor: Actor): Promise<AIResponse> {
    // 1. Apply guardrails (S4)
    // 2. Select provider
    // 3. Apply prompt template
    // 4. Call adapter
    // 5. Apply post-response filters (S4)
    // 6. Track usage (S5)
    // 7. Audit log
    // 8. Return response with masked provider identity
  }
}
```

Routing rules:
- Support assist + business assist → Anthropic (best long-form reasoning).
- Quick classification → OpenAI 4o-mini (cost-efficient).
- Account-check → Anthropic.
- Studio brief assist → Anthropic.
- Per D3 owner answer; current default = Anthropic primary, OpenAI fallback.

Failover: if primary returns retryable error, fall through to secondary with the same prompt.

### S4 — Guardrails

**Brand-promotion filter:**
- System prompt instructs: "Never recommend, promote, or favorably mention services from companies other than HenryCo when answering."
- Output filter: scan response for known competing brand names (Jumia, Konga, Bolt, Uber, Airbnb, Indeed, LinkedIn, etc. — maintain in `packages/ai-router/src/guardrails/competing-brands.ts`); if matched, regenerate or fallback to deterministic response.

**Anti-company filter:**
- System prompt: "Never speak critically of HenryCo or its services. If asked, redirect to support."
- Output filter: scan for negative-sentiment patterns directed at HenryCo; regenerate.

**PII redaction:**
- Before sending to provider, redact: email addresses, phone numbers, full names of identifiable individuals, credit card numbers, bank account numbers.
- Use `@henryco/observability/redaction` defaults.

**Prompt template per task class:**
- One template per task in V3-29 through V3-32 (support assist, business message, account check, domain/brief).
- Each template defines: system prompt, task constraints, output format expectations, refusal language for off-topic queries.

### S5 — Cost tracking + estimation

`packages/ai-router/src/cost.ts`:
- Per-provider cost-per-thousand-tokens config (loaded from env, updateable).
- `estimateCost(call): CostEstimate` — returns expected USD cost before the call (used by usage-billing V3-27 to gate on wallet balance).
- After call, actual cost computed from tokens used.
- Margin: actual cost × (1 + margin_pct) per V3-27 + D4 owner answer.

### S6 — Audit + telemetry

Every router call writes to `ai_calls` table:

```sql
CREATE TABLE ai_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  task_class TEXT NOT NULL,
  selected_provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_in INTEGER NOT NULL,
  tokens_out INTEGER NOT NULL,
  cost_usd_minor BIGINT NOT NULL,
  margin_usd_minor BIGINT NOT NULL,
  billed_to TEXT NOT NULL CHECK (billed_to IN ('company','user_wallet','unauth_blocked')),
  latency_ms INTEGER NOT NULL,
  guardrails_triggered TEXT[],
  outcome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_calls ENABLE ROW LEVEL SECURITY;
-- RLS: user reads own calls; finance-staff reads all; owner reads all
```

Events:
- `henry.ai.call.initiated`
- `henry.ai.call.completed`
- `henry.ai.call.failed`
- `henry.ai.guardrail.triggered`
- `henry.ai.provider.failover`

### S7 — Provider response masking

**HARD CONSTRAINT:** The router's public response surface MUST NOT include `provider`, `model`, or any field that hints at the underlying provider. The response shape is:

```typescript
type AIResponse = {
  content: string;
  taskClass: TaskClass;
  callId: string; // for tracing
  costEstimate: { actualUsdMinor: number; chargedUsdMinor: number; chargedTo: 'company' | 'user_wallet' };
  // NO provider field
  // NO model field
  // NO underlying SDK metadata
};
```

The `ai_calls` table stores provider + model server-side for cost + audit, but they NEVER reach the client.

### S8 — Dev-mode behavior

- `MOCK_AI=true` env routes all calls through mock-adapter (deterministic stub responses).
- No real provider keys needed for local dev.
- Tests use mock by default.

---

## Out of scope

- Usage billing + wallet auto-debit (V3-27).
- HenryCo Intelligence chat surface UI (V3-28).
- Per-task assists (V3-29 through V3-32).
- Personal-task gating (V3-33).
- Predictive intelligence (V3-40, V3-41).

---

## Dependencies

- V3-12 (Foundation Lock acceptance) closed.
- D3 (AI provider selection) — answered by owner.

Blocks:
- V3-27 (usage billing) — uses router for cost estimation.
- V3-28 (chat surface) — uses router for actual calls.
- V3-33 (personal-task gating) — uses router as the gated path.
- V3-34 (personalized home) — may use router for personalization.
- V3-36 (cross-division recs) — uses router for explainable recs.
- V3-40 (fraud prediction) — may use router for risk scoring.
- V3-41 (quality + workload prediction).

---

## Inheritance

- `@henryco/intelligence` deterministic helpers — preserved + extended (deterministic = company-critical = free).
- `@henryco/observability/audit-log` — every call logged.
- `@henryco/observability/redaction` — PII redaction in guardrails.
- Existing event taxonomy.

---

## Implementation requirements

### Files

(See S1 for package structure.)

Additional:
- `apps/hub/supabase/migrations/2026XXXXNNNNN_ai_calls.sql` (new — S6 schema)
- `apps/account/app/api/intelligence/call/route.ts` (new — server-only proxy that V3-27 + V3-28 will use; never directly client-callable)
- `docs/v3/ai-router-architecture.md` (new — architecture + guardrail reference)
- `docs/v3/ai-task-prompt-templates.md` (new — per-task prompt template documentation)

### Trust / safety / compliance

- **Provider keys NEVER in client bundle.** Server-only routing.
- **PII redaction enforced** at adapter input.
- **Provider identity masked** in client response.
- **Audit log on every call.**
- **Guardrail tests:** unit tests prove competing-brand refusal + anti-company refusal + PII redaction. 100+ test cases.
- ANTI-CLONE Principle 1 (server-side logic) + Principle 9 (network masking) — both fully applied.
- DPA per LEGAL-AND-BUSINESS L14.

### Mobile + desktop parity

- Web: server-mediated calls; client only sees masked response.
- Expo: same; server-mediated.

### i18n

- Prompt templates can be locale-aware (e.g., responses in user's preferred locale).
- Guardrail filters operate post-translation if response is in non-English.

---

## Validation gates

1. Standard CI.
2. **Adapter tests** — mock-adapter + Anthropic adapter + OpenAI adapter all conform to interface.
3. **Routing tests** — task-class routing + cost routing + latency budget + failover all unit-tested.
4. **Guardrail tests** — 100+ cases for brand-promotion, anti-company, PII redaction.
5. **Response masking test** — verify no provider/model leaks in client response.
6. **Cost estimation test** — estimateCost returns within ±10% of actual for sample prompts.
7. **DPA check** — verify Anthropic + OpenAI DPAs signed per L14.

## Deployment gate

- All gates pass.
- Owner reviews architecture + prompt template docs.
- 72-hour soak with MOCK_AI=true (no real provider calls).
- Then with real keys, monitored ramp for 48 hours.

## Final report contract

`.codex-temp/v3-26-ai-provider-router/report.md` with the standard 9 sections + architecture diagram + guardrail test summary + cost estimation accuracy report.

---

## Self-verification

- [ ] `@henryco/ai-router` package shipped.
- [ ] Adapter interface + Anthropic + OpenAI + mock adapters.
- [ ] Routing rules + failover + latency budget.
- [ ] Brand-promotion + anti-company + PII guardrails.
- [ ] Cost tracking + estimation.
- [ ] `ai_calls` table with RLS.
- [ ] Provider identity masked in all client responses.
- [ ] DPAs verified.
- [ ] 5 new telemetry events.
- [ ] Report written. Hand-off: V3-27 (usage billing).
