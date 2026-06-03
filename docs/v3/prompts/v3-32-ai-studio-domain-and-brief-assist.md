# V3-32 — AI Intelligence Layer: Studio Domain + Brief Assist

**Pass ID:** V3-32  ·  **Phase:** D (AI Intelligence Layer)  ·  **Pillar:** P4 (Henry Onyx Intelligence)
**Dependencies:** V3-28 (Intelligence chat surface), V3-26 (provider router), V3-27 (usage-billing engine), V3-33 (personal-task gating); builds on existing Studio deterministic helpers  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-29, V3-30, V3-31)
**Owner gate:** none (AI provider = D3 and margin = D4 recorded; confirm, don't re-litigate)  ·  **Risk class:** Money

---

## Role

You are the V3 AI Intelligence engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships two related Studio assists: **Domain Lookup Assist** (suggests available domain variants when a desired name is taken) and **Brief Assist** (structures a client's loose project description into scope, deliverables, timeline, and budget range). Domain lookup is `free_company` — it *aids a sale* on a paid Studio service. Brief assist is `metered_business` — it is consumed at the client end and the client pays. The line you must not cross: domain lookup never auto-registers anything; brief assist drafts only — it never auto-generates or auto-sends a binding proposal.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/32-ai-studio-domain-and-brief-assist` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Studio already ships real, deterministic versions of both surfaces. `apps/studio/lib/studio/domain-intelligence.ts` (`"server-only"`) does slug normalisation and a brandish-slug avoidance set; `apps/studio/lib/studio/brief-copilot-action.ts` is an Anthropic-backed brief copilot with mature anti-abuse ceilings (min-word-count, per-session/per-account/per-IP/system-wide caps, SHA-256 dedup) and a system prompt in `brief-copilot-prompt.ts`. The proposal flow lives under `apps/studio/app/proposals/[proposalId]/`. What is missing: a real domain-availability/registry lookup, AI-suggested variants, and routing the metered brief drafting through the unified V3-26 router + V3-27 billing instead of a standalone Anthropic call.

This pass adds two task classes, wires domain lookup to a registry API, and brings brief assist under the governed router/billing/gate stack — preserving the existing anti-abuse discipline. It does not rebuild the proposal flow or the deterministic helpers.

## Mandatory scope

### S1 — Register two task classes

```sql
insert into public.ai_task_pricing (task_class, billing_mode, min_charge_minor, provider_cost_ceiling_minor, margin_bps, description) values
 ('studio_domain_lookup', 'free_company',    0, 0, 0,        'Domain availability + AI variants. Sales-aiding on a paid service. Free.'),
 ('studio_brief_assist',  'metered_business', :min, :ceiling, :margin_bps, 'Structures a client brief. Metered at the client end.')
on conflict (task_class) do update set billing_mode = excluded.billing_mode, margin_bps = excluded.margin_bps;
```

Margin reflects the D4-ratified markup (confirm recorded answer). Add both to the `TaskClass` union in `@henryco/ai-router/src/types.ts`. All money in integer minor units (kobo).

### S2 — Domain Lookup Assist (free)

- Input: a desired domain label (reuse `slugifyDomainLabel` from `domain-intelligence.ts`, and the `BRANDISH_SLUGS` avoidance set).
- Availability: call a domain-registry API behind an adapter (`apps/studio/lib/studio/domain-registry.ts`) so the vendor (Namecheap / GoDaddy / Cloudflare Registrar) is swappable; the vendor key/secret comes from env (`STUDIO_DOMAIN_REGISTRY_*`), never hardcoded, never exposed client-side.
- AI step (router, `studio_domain_lookup` preset): when the desired name is taken, suggest available variants that respect the brandish-avoidance set.
- Output: `{ requested, available: boolean, price?, variants: { domain, available, price }[], ipRiskFlag: boolean }`. `ipRiskFlag` reuses the existing brandish heuristic — never suggest a trademark-collision variant.

### S3 — Brief Assist (metered)

- Input: the client's loose project description.
- Router call (`studio_brief_assist` preset): structure into `{ scope, deliverables[], timelineRange, budgetRange, suggestedTemplates[] }`; `suggestedTemplates` are drawn from the existing Studio template catalog, not invented.
- Insert the generated brief into the existing proposal-intake flow under `apps/studio/app/proposals/[proposalId]/` — as an editable draft the client/owner finalises. **Never** auto-sign or auto-send.
- Preserve the existing anti-abuse ceilings from `brief-copilot-action.ts` but enforce them through the V3-27 billing/limit path; route the model call through V3-26, not the standalone Anthropic SDK call. Leave deprecation of the standalone call as a noted follow-up if a full cutover is out of this pass's reach.

### S4 — Rate limits

Domain lookup: 50/day per user. Brief assist: 20/day per user. Enforced server-side at the router boundary, in addition to the inherited anti-abuse ceilings. Breach → V3-33 `rate_limited`.

### S5 — Telemetry

- `henry.intelligence.studio_domain.queried`
- `henry.intelligence.studio_brief.drafted`
- `henry.intelligence.studio_brief.charge_recorded` (money-truth; post-ledger-commit)

## Out of scope

- Auto-registering domains end-to-end — V4.
- Auto-generating or auto-signing complete proposals — brief assist drafts only; signing stays the existing proposal-sign route.
- The chat overlay, guardrails, streaming — **V3-28**. Billing/gate — **V3-27/V3-33**. The deterministic helpers stay as-is.

## Dependencies

Hard: V3-28, V3-26, V3-27, V3-33, plus the existing Studio deterministic helpers. Blocks nothing downstream.

## Inheritance

`apps/studio/lib/studio/*` (`domain-intelligence.ts`, `brief-copilot-action.ts`, `brief-copilot-prompt.ts`, proposal flow), `@henryco/ai-router`, `@henryco/intelligence-chat` (V3-28), `@henryco/config` (brand + division label "Henry Onyx Studio"), `@henryco/observability`, `@henryco/i18n`, and V3-27 wallet/billing.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_32_studio_assist_task_classes.sql` (S1).
- `apps/studio/lib/studio/domain-registry.ts` — registry adapter (S2).
- `packages/ai-router/src/prompts/studio-domain-lookup.ts` + `studio-brief-assist.ts` — presets (S2/S3).
- `packages/ai-router/src/types.ts` — extend `TaskClass`.
- Domain-lookup UI affordance in the Studio domain surface; brief-assist affordance in `apps/studio/app/proposals/[proposalId]/`.
- `apps/studio/app/api/intelligence/studio-assist/route.ts` (or the shared V3-28 assist route with `taskClass` arg) — server entry: free path for domain lookup; metered path (wallet pre-check → cost preview → confirm → debit) for brief assist.

### Trust / safety / compliance
- Domain-registry secret server-only via env; never returned to the client.
- **Brief assist money invariants (absolute):** idempotency key per billable call; wallet checked before the provider is called (V3-33); debit only on success; no debit on error; BIGINT minor units; D4 margin applied. Audit each charge via `@henryco/observability/audit-log`.
- Brandish-avoidance / trademark heuristic enforced on every variant — never surface a known-brand collision.
- Domain lookup is free but still auth-gated (`free_company` ⇒ session required).

### Mobile + desktop parity
Both assists use the V3-28 overlay (full-screen on web mobile, Expo-native in the super-app). Domain-result table and brief sections must be readable on a phone and clear the keyboard.

### i18n
Namespaces `surface:intelligence.studio_domain` and `surface:intelligence.studio_brief`. Affordance labels, result/section headings, availability + IP-risk badges, cost-preview/confirm copy, rate-limit and error states are keyed copy (Pattern A; Pattern B fallback for the other 11 locales). Domain strings and the client's brief content are user data, not UI copy. Zero hardcoded user-facing strings.

### Brand & design system
User-facing = **Henry Onyx Intelligence** within **Henry Onyx Studio**, both from `@henryco/config`; never the provider name. Overlay inherits V3-28 branded chrome (Fraunces, locked tokens, light + dark). Cost preview uses `@henryco/payment-surface` amount display for style only — no payment-behaviour change. Domain examples in tests use a generic placeholder (e.g. `example-studio.com`), never a hardcoded company domain. Zero hardcoded domains in code.

## Validation gates
1. CI green: typecheck · lint · test · build.
2. i18n strict gate green for both namespaces.
3. **Domain lookup smoke:** query a taken label → `available: false` + variants; query a free label → `available: true` + price; registry secret never reaches the client.
4. **Brief assist smoke:** a vague description → structured `{ scope, deliverables, timelineRange, budgetRange, suggestedTemplates }` inserted as an editable draft into the proposal flow; never auto-signed.
5. **Billing split:** domain lookup records a zero-charge usage row (wallet unchanged); brief assist debits exactly `provider_cost × (1 + margin)` on success and **nothing** on error (idempotent on retry).
6. Rate limits: 51st domain lookup and 21st brief assist in a day return `rate_limited`; inherited anti-abuse ceilings still trip.
7. UI: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All gates green; V3-28/26/27/33 merged; D4 margin confirmed; 7-day soak with `charge_recorded` matching the brief-assist ledger debit count (zero drift) and zero charges on the free domain path.

## Final report contract
`.codex-temp/v3-32-ai-studio-domain-and-brief-assist/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `studio_domain_lookup` (free) + `studio_brief_assist` (metered, D4 margin) registered and added to `TaskClass`.
- [ ] Domain lookup wired to a swappable registry adapter (secret server-only via env) with AI variants respecting the brandish-avoidance set + IP-risk flag.
- [ ] Brief assist routes through V3-26/V3-27, preserves the existing anti-abuse ceilings, inserts an editable draft into the proposal flow, never auto-signs.
- [ ] Money invariants proven for brief assist (idempotent, pre-charge check, debit on success only, no debit on error, minor units, margin); domain lookup proven free.
- [ ] Per-day limits (50 / 20) enforced on top of inherited ceilings; breach returns `rate_limited`.
- [ ] Three telemetry events (incl. post-commit `charge_recorded`) emitted and schema-valid; every charge audit-logged.
- [ ] Both i18n namespaces complete; brand = Henry Onyx Intelligence / Henry Onyx Studio via config; tests use a generic example domain; light+dark, mobile+desktop, CLS≈0.
- [ ] Report written.
