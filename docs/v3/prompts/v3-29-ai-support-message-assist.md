# V3-29 — AI Intelligence Layer: Support Message Assist (free, company-critical)

**Pass ID:** V3-29  ·  **Phase:** D (AI Intelligence Layer)  ·  **Pillar:** P4 (Henry Onyx Intelligence)
**Dependencies:** V3-28 (Intelligence chat surface), V3-26 (provider router), V3-27 (usage-billing engine), V3-33 (personal-task gating)  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-30, V3-31, V3-32)
**Owner gate:** none (AI provider already decided — D3, recorded in `docs/v3/DECISIONS-REQUIRED.md`; confirm, don't re-litigate)  ·  **Risk class:** —

---

## Role

You are the V3 AI Intelligence engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships **Support Message Assist**: an inline, free-to-the-user drafting helper that turns a confused or terse user into a clear, well-categorised support thread. It is a *company-critical* task (it reduces support cost and resolution time), so it is billed `free_company` — the user's wallet is never touched. The line you must not cross: this is *draft authoring only*. It never auto-submits a thread, never routes/triages on the user's behalf, and never speaks for Henry Onyx to the user as if it were an agent.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/29-ai-support-message-assist` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The support thread surface is real and shipped. `apps/account/app/(account)/support/page.tsx`, `support/new/`, and `support/[threadId]/` render the thread list and composer; the API lives at `apps/account/app/api/support/create/route.ts` and `support/reply/route.ts`, both auth-gated, both idempotent (via `getIdempotentResponse`/`rememberIdempotentResponse`), both emitting intel events through `triageSupportInput` + `emitIntelligenceEvent` from `apps/account/lib/intelligence-rollout.ts`. Today's "intelligence" is the **deterministic** `triageSupportStub` regex classifier in `@henryco/intelligence` — there is no LLM-backed drafting anywhere.

This pass closes that gap. It introduces the `support_message_assist` task class and wires a "Need help writing this?" affordance into the support composer that opens the Henry Onyx Intelligence overlay (built in V3-28), lets the user converse, and returns a structured draft (title + body + suggested category) the user can accept into the composer. It consumes — never duplicates — the V3-26 router, the V3-27 billing engine, the V3-33 gate, and the V3-28 chat surface. It does not build new AI infrastructure.

## Mandatory scope

### S1 — Register the `support_message_assist` task class

Register one task class in the AI pricing catalog (the `ai_task_pricing` table created in V3-27), seeded via migration:

```sql
-- supabase migrations: register support_message_assist as free_company
insert into public.ai_task_pricing (task_class, billing_mode, min_charge_minor, provider_cost_ceiling_minor, description)
values ('support_message_assist', 'free_company', 0, 0, 'Drafts a clear support thread for the user. Company-critical: free.')
on conflict (task_class) do update
  set billing_mode = excluded.billing_mode,
      description   = excluded.description;
```

`billing_mode = 'free_company'` means V3-33's gate still requires an authenticated session (no anonymous usage) but V3-27 records a zero-charge usage row — the wallet is never debited. Add the task class to the TypeScript `TaskClass` union exported by `@henryco/ai-router/src/types.ts` (do not invent a parallel enum).

### S2 — System-prompt preset in the V3-26 prompt registry

Add a preset keyed `support_message_assist` to the prompt-template registry shipped in V3-26 (`packages/ai-router/src/prompts/`), not inline in any app:

- **Persona:** "You are Henry Onyx Intelligence, helping a customer describe a problem clearly to Henry Onyx support." (Brand string sourced from `@henryco/config` `COMPANY.group.name` at registry build — never hardcode "Henry Onyx".)
- **Task:** "Help the user articulate their issue. Ask at most two clarifying questions, only if essential. Do not promise resolutions, refunds, or timelines. Do not discuss competing brands. Do not speak negatively of Henry Onyx."
- **Output contract:** a JSON-structured draft validated by a zod schema — `{ title: string (≤120), body: string (≤4000), suggestedCategory: SupportCategory }`. `SupportCategory` must be the existing account support category enum consumed by `mapAccountSupportCategoryToDivision` in `@henryco/config`; the model selects from that closed set, never a free-form string.

The guardrail layer (brand-promotion / anti-company / off-topic refusal) is inherited from V3-28 — do not re-implement it; reference the preset's `guardrailProfile: 'standard'`.

### S3 — Inline composer integration

In the support composer (`apps/account/app/(account)/support/new/` and the reply composer under `support/[threadId]/`):

- Render a calm, secondary "Need help writing this?" affordance adjacent to the `@henryco/chat-composer` input (it already exports `ChatComposer` / `FullScreenComposer`).
- Click opens the Henry Onyx Intelligence overlay from V3-28 with the `support_message_assist` preset bound.
- The user converses; the assistant returns a structured draft.
- A "Use this draft" action inserts `title` → the thread title field and `body` → the composer body via the composer's controlled-value API; `suggestedCategory` pre-selects the category control. The user can still edit everything before sending. **The assist never calls `support/create`** — submission stays the user's explicit action through the existing route.

### S4 — Per-conversation + per-day rate limits

Enforce server-side at the router boundary (mirroring the conservative ceilings already in `apps/studio/lib/studio/brief-copilot-action.ts`):

- 10 assistant messages per assist conversation.
- 50 assist conversations per user per UTC day.

On breach, return the V3-33 error envelope `rate_limited` with a translated, calm message; the composer stays fully usable for manual typing.

### S5 — Telemetry

Emit through `@henryco/observability` using the `henry.<domain>.<noun>.<verb>` schema validated by `henryEventNameSchema` in `@henryco/intelligence`:

- `henry.intelligence.support_assist.opened`
- `henry.intelligence.support_assist.draft_used`
- `henry.intelligence.support_assist.draft_dismissed`

## Out of scope

- AI auto-triage / queue routing of submitted threads — **V3-44** (workflow-auto-assign-escalate).
- Support thread summarisation for staff — **V3-42** (predictive staff dashboards).
- The chat overlay UI, streaming, guardrail refusal copy, conversation persistence — **V3-28** (this pass consumes it).
- Metered billing mechanics — **V3-27**; the gate — **V3-33**.

## Dependencies

Hard deps: V3-28 (overlay + presets), V3-26 (router + prompt registry), V3-27 (`ai_task_pricing` + usage recording), V3-33 (auth gate, even for free tasks). Blocks nothing downstream; it is a leaf surface.

## Inheritance

`@henryco/ai-router` (router + `TaskClass` + prompt registry), `@henryco/intelligence-chat` (V3-28 overlay), `@henryco/chat-composer` (`ChatComposer`, controlled-value API, `useDraftStorage`), `@henryco/intelligence` (event schema, `triageSupportInput`), `@henryco/config` (brand + `mapAccountSupportCategoryToDivision`), `@henryco/observability` (telemetry + audit), `@henryco/i18n`.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_29_support_assist_task_class.sql` — register task class (S1).
- `packages/ai-router/src/prompts/support-message-assist.ts` — preset (S2).
- `packages/ai-router/src/types.ts` — extend `TaskClass` union.
- `apps/account/app/(account)/support/new/` + `support/[threadId]/` composer components — inline affordance + draft-insert wiring (S3).
- `apps/account/app/api/intelligence/support-assist/route.ts` (or the shared V3-28 assist route with a `taskClass` arg) — server entry that calls the router with the preset, enforcing S4 limits.

### Trust / safety / compliance
- Auth required (V3-33 `free_company` still demands a session). Reject anonymous calls with `auth_required`.
- The structured-output zod schema is the only contract the composer trusts — never insert raw model text into the title/category fields unparsed.
- Audit each assist invocation via `@henryco/observability/audit-log` (actor = user, action = `support_assist.invoked`).
- No PII leaves the server beyond what the user typed; this pass sends no account context to the provider (that is V3-31's job).

### Mobile + desktop parity
The overlay is full-screen on web mobile and uses the Expo-native chat path in the super-app (both provided by V3-28's shared package). The "Need help writing this?" affordance must clear safe-area insets and not overlap the on-screen keyboard (reuse `useViewportKeyboard` from `@henryco/chat-composer`).

### i18n
Namespace `surface:intelligence.support_assist`. The affordance label, overlay title, "Use this draft" / "Dismiss" actions, rate-limit message, and the unavailable/error states are all keyed copy via `@henryco/i18n` (Pattern A), with Pattern B DeepL fallback for the 11 non-en-US locales. The model's drafted *content* is user data, not UI copy, and is not run through the i18n gate. Zero hardcoded user-facing strings.

### Brand & design system
User-facing brand is **Henry Onyx Intelligence**, sourced from `@henryco/config` — never the literal string, never the provider name (no "Claude"/"GPT"). The overlay inherits V3-28's branded chrome (Fraunces display, locked `--site-*`/`--accent` tokens, light + dark). The composer affordance uses design-system tokens only. Zero hardcoded domains — any "contact support" links go through `getAccountUrl()` / `henryWebRoot()`.

## Validation gates
1. CI green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. i18n strict gate green (`surface:intelligence.support_assist` complete in en-US; no hardcoded-text violations).
3. End-to-end: open assist → converse → "Use this draft" → title/body/category populated → user edits → submits → a real `support_threads` row is created by the *existing* route, not by the assist.
4. Rate limit: 11th message in a conversation and 51st conversation in a day both return `rate_limited`; composer remains usable.
5. Free billing: a `support_message_assist` call records a zero-charge usage row in V3-27 and leaves wallet balance unchanged (assert before/after).
6. Auth gate: anonymous call returns `auth_required` (V3-33).
7. UI: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All gates green; V3-28/26/27/33 merged to `main`; 7-day soak with telemetry dashboard showing `opened` → `draft_used` conversion and zero non-zero charges on the free task class.

## Final report contract
`.codex-temp/v3-29-ai-support-message-assist/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `support_message_assist` registered `free_company` in `ai_task_pricing` and added to the `TaskClass` union.
- [ ] System-prompt preset added to the V3-26 registry with brand from `@henryco/config`, closed-set category output, standard guardrail profile.
- [ ] Inline "Need help writing this?" affordance wired into both support composers; "Use this draft" populates title/body/category without auto-submitting.
- [ ] Per-conversation (10) + per-day (50) limits enforced server-side; breach returns `rate_limited`.
- [ ] Three telemetry events emitted and schema-valid; assist invocation audit-logged.
- [ ] Free billing proven (zero-charge usage row, wallet unchanged); auth gate proven.
- [ ] i18n namespace `surface:intelligence.support_assist` complete; brand = Henry Onyx Intelligence via config; light+dark, mobile+desktop, CLS≈0.
- [ ] Report written.
