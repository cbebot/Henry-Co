# V3-28 — AI Intelligence Layer: Henry Onyx Intelligence Chat Surface

**Pass ID:** V3-28  ·  **Phase:** D (AI Intelligence Layer)  ·  **Pillar:** P4 (Intelligence)
**Dependencies:** V3-26 (AI provider router), V3-27 (AI usage billing)  ·  **Effort:** L  ·  **Parallel-safe:** N
**Owner gate:** none  ·  **Risk class:** Identity

---

## Role
You are the V3 AI Surface engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass builds the **one governed chat surface** users see — branded "Henry Onyx Intelligence", reusing the existing composer, streaming responses, presetting a system prompt per calling context, and refusing competing-brand promotion and anti-company statements with calm copy. The line you must not cross: the underlying AI provider name **never** appears anywhere a user, a payload, an export, or a log line can reach it. You build the surface and its inline invocations; you do not build the router (V3-26), the billing meter (V3-27), the per-task assist logic (V3-29..V3-32), or the cross-division concierge (V3-59).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/28-ai-henryco-intelligence-chat-surface` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The building blocks exist. `@henryco/chat-composer` ships `ChatComposer` / `FullScreenComposer` / `ChatComposerProvider` with draft storage, attachment upload, viewport-keyboard handling, and motion primitives — the input layer is solved. `@henryco/messaging-thread` renders message lists with delivery-state, markdown, and participants. `@henryco/branded-documents` exports `renderDocumentToBuffer` / `buildDocumentFilename` for watermarked PDF export. V3-26 ships `@henryco/ai-router` (`invoke`, streaming, provider-masked) and V3-27 ships `@henryco/ai-billing` (`decideBilling` cost preview + `chargeForCall`) plus the `(account)/intelligence/` route group. The telemetry envelope (`henry.<domain>.<object>.<verb>`, `henryEventNameSchema`) lives in `@henryco/intelligence/src/index.ts`. The gap this pass closes: there is **no user-facing AI chat surface** — no conversation persistence, no per-context system-prompt presets, no inline "Henry Onyx Intelligence can help draft this" invocation on support / business / studio surfaces, no guardrail UX, no branded export. This pass assembles those into one governed surface.

> **Brand correctness is load-bearing here.** The user-facing name is **"Henry Onyx Intelligence"** (brand truth landed on `main` 2026-06-02, PR #188). "HenryCo Intelligence" and "Henry & Co." are retired and must not appear in any rendered string. The brand string is sourced from `@henryco/config`, never hardcoded. Code identifiers stay HenryCo: the package is `@henryco/intelligence-chat`, env prefixes and function names are unchanged.

## Mandatory scope

### S1 — `@henryco/intelligence-chat` package
New package `packages/intelligence-chat/`. Public surface:

```ts
// packages/intelligence-chat/src/types.ts
export type IntelligenceContext =
  | 'general'              // /intelligence standalone surface
  | 'support_draft'       // support thread compose (free — V3-29)
  | 'business_draft'      // business reply compose (metered — V3-30)
  | 'studio_brief'        // studio brief intake (metered — V3-32)
  | 'account_check';      // account questions (free — V3-31)

export interface IntelligenceChatProps {
  context: IntelligenceContext;
  conversationId?: string;
  onDraftAccepted?: (text: string) => void;   // inline-invocation insert-back
  presetSystemPromptKey: string;              // resolves to a server-side preset; NEVER ships raw prompt to client
}
export function IntelligenceChat(props: IntelligenceChatProps): JSX.Element;
```

- Renders the conversation with `@henryco/messaging-thread` and composes with `@henryco/chat-composer` (`ChatComposer` inline, `FullScreenComposer` for the standalone surface). Do not reimplement input.
- Streams assistant responses from the V3-26 router (token-by-token if the provider supports it).
- Per-context system-prompt **preset key** only crosses the wire; the actual preset text is resolved server-side (anti-clone — never expose the system prompt to the client).
- Cost preview per message uses `@henryco/ai-billing.decideBilling` (metered contexts show kobo-per-message; free contexts show a "free" badge).

### S2 — `/intelligence` standalone surface
Route `apps/account/app/(account)/intelligence/page.tsx` (the route group introduced by V3-27).
- Authenticated-only generic chat for `context: 'general'` (metered, `general_chat` task class).
- Conversation history persisted in `public.intelligence_conversations` + `public.intelligence_messages` (S3).
- User can rename and delete conversations.
- Wallet balance + per-message cost preview visible (from `@henryco/ai-billing`).

### S3 — Conversation persistence schema
Migration `supabase/migrations/<ts>_intelligence_conversations.sql`:

```sql
create table public.intelligence_conversations (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id),
  context     text not null,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table public.intelligence_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.intelligence_conversations(id) on delete cascade,
  role             text not null check (role in ('user','assistant','system')),
  body             text not null,
  ai_call_id       uuid references public.ai_calls(id),   -- links to V3-27 billing
  created_at       timestamptz not null default now()
);
```

RLS (strict, user-only):
- Both tables: `select/insert/update/delete` only where `profile_id = auth.uid()` (messages join through their conversation). No staff/owner read of conversation bodies by default — these are private user content. Service-role server actions write assistant rows.
- `system`-role messages are server-written only; never client-insertable.

### S4 — Inline chat invocation (3 surfaces)
Mount `IntelligenceChat` as an overlay from:
1. **Support thread compose** — `apps/account/app/(account)/support/[threadId]/` compose area: affordance "Henry Onyx Intelligence can help you draft this" → overlay (`context: 'support_draft'`, free) → drafted reply inserted back via `onDraftAccepted`.
2. **Business reply compose** — the business-suite messaging compose (`context: 'business_draft'`, metered) → same insert-back pattern.
3. **Studio brief intake** — the studio brief step (`context: 'studio_brief'`, metered) → same pattern.

Each affordance copy comes from `@henryco/i18n`; each reads the brand string from `@henryco/config`.

### S5 — Guardrail UX
When the V3-26 governance layer flags a turn (competing-brand promotion, anti-company statement, or off-topic personal-task abuse), render a **calm refusal** in the thread — not an error toast. Refusal copy is from `@henryco/i18n` and includes a link to the relevant Henry Onyx resource (via `henryWebRoot()` / `henryDomain()` — no hardcoded URL). Emit `henry.intelligence.guardrail.triggered` with the guardrail reason code.

### S6 — Branding lock (provider mask end-to-end)
- Loading state: "Henry Onyx Intelligence is thinking…" — never "Claude"/"GPT"/any provider.
- Error state: "Henry Onyx Intelligence is unavailable. Please try again." — never names a provider.
- About/settings line: "Powered by advanced AI." — no provider name.
- Every one of these strings is a `@henryco/i18n` key; the brand token is from `@henryco/config`. The provider name appears in **zero** client-reachable surfaces, payloads, exports, or human-readable logs.

### S7 — Conversation export
- User can export a conversation as PDF via `@henryco/branded-documents` (`renderDocumentToBuffer` + a new `IntelligenceConversationDocument` template, watermarked per the anti-clone export convention used by existing templates).
- Filename via `buildDocumentFilename`; download via the existing branded-documents API route pattern (signed, auth-gated). The provider name does not appear in the export.

### S8 — Telemetry
Through the `@henryco/intelligence` envelope (`henryEventNameSchema`):
- `henry.intelligence.conversation.started`
- `henry.intelligence.message.sent`
- `henry.intelligence.guardrail.triggered`
- `henry.intelligence.conversation.exported`

## Out of scope
- Per-task assist behaviour (free/metered classification, rate limits, surface-specific prompt content) — V3-29 (support assist), V3-30 (business assist), V3-31 (account-check assist), V3-32 (studio domain/brief assist). This pass mounts the surface and wires the contexts; those passes own each assist's logic.
- Personal-task gating at the router boundary (unauth block, auth+wallet middleware) — V3-33.
- The provider router, model routing, governance-prompt authoring — V3-26.
- Billing math, wallet-zero cap, ledger charge — V3-27 (this pass shows the preview and the balance; it does not compute or charge).
- Cross-division guided concierge — V3-59.

## Dependencies
Depends on V3-26 (`@henryco/ai-router` invoke/stream + governance flags) and V3-27 (`@henryco/ai-billing` cost preview + `ai_calls`, `(account)/intelligence/` route group). **Blocks** V3-29, V3-30, V3-31, V3-32 (each mounts into this surface's contexts) and V3-59 (concierge builds on this chat package).

## Inheritance
`@henryco/chat-composer` (`ChatComposer`, `FullScreenComposer`, `ChatComposerProvider`, draft + viewport-keyboard hooks), `@henryco/messaging-thread` (thread render, delivery-state, markdown), `@henryco/ai-router` (V3-26 invoke/stream + governance), `@henryco/ai-billing` (V3-27 `decideBilling` preview), `@henryco/branded-documents` (`renderDocumentToBuffer`, `buildDocumentFilename`, watermark), `@henryco/intelligence` (telemetry envelope), `@henryco/config` (brand string + URL helpers), `@henryco/i18n` (all copy), `@henryco/observability` (audit on export + guardrail).

## Implementation requirements
### Files
- `packages/intelligence-chat/` — `src/IntelligenceChat.tsx`, `src/types.ts`, `src/stream.ts`, `src/index.ts`, `package.json`, `tsconfig.json`, `src/__tests__/`.
- `supabase/migrations/<ts>_intelligence_conversations.sql` (S3 tables + strict user-only RLS).
- `apps/account/app/(account)/intelligence/page.tsx` (+ conversation list/detail client components under `apps/account/components/intelligence/`).
- Inline-invocation mounts in `apps/account/app/(account)/support/[threadId]/`, the business-suite messaging compose, and the studio brief intake step.
- `packages/branded-documents/src/templates/intelligence-conversation.tsx` (new export from package index).
- `packages/i18n/src/intelligence-chat-copy.ts` (Pattern A typed copy; namespace `surface:intelligence`).

### Trust / safety / compliance
- Conversation RLS is user-only; bodies are private (no default staff/owner read). `system`-role rows server-written only.
- System-prompt presets resolve server-side; only a preset **key** crosses the wire (anti-clone — prompt text never client-exposed).
- Provider mask is absolute (S6): the provider name is in no string, payload, export, or human-readable log. Add a CI grep gate.
- Audit (`@henryco/observability/audit-log`) on conversation export and on every guardrail trigger.
- Metered contexts go through `@henryco/ai-billing` (V3-27) — this surface never charges directly; it shows the preview and the V3-27 wallet-zero block message.

### Mobile + desktop parity
Web: full surface (standalone `/intelligence` + inline overlays). Expo super-app: mobile-native chat via the shared `@henryco/intelligence-chat` + `@henryco/chat-composer` (already viewport-keyboard-aware) — the React-render layer is shared; the Expo host wires native modules. Overlay invocations degrade to a full-screen sheet on mobile.

### i18n
All UI copy via `@henryco/i18n`, namespace `surface:intelligence` (Pattern A typed copy `packages/i18n/src/intelligence-chat-copy.ts`). Translate: loading/error/about strings, inline-invocation affordance copy, guardrail refusal copy + resource link label, conversation rename/delete controls, cost-preview / free-badge labels, export control. AI **responses** respect the user's locale (passed to the V3-26 router). No hardcoded user-facing strings.

### Brand & design system
User-facing name is "Henry Onyx Intelligence" sourced from `@henryco/config` (brand truth: Henry Onyx user-facing / Henry Onyx Limited legal / `@henryco/*` code unchanged) — never hardcode brand, never name the provider. Surface uses locked design-system tokens (`--site-*` / `--accent`, Fraunces for editorial headings), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`). All links via `henryWebRoot()` / `henryDomain()` / `getAccountUrl()` — zero hardcoded domains.

## Validation gates
1. **Standard CI** — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` green.
2. **Provider-mask test** — grep streamed response payloads, UI snapshots, exported PDFs, and human-readable logs for any provider name; **zero** matches. CI gate fails the build on a match.
3. **Brand-string test** — rendered surface shows "Henry Onyx Intelligence"; "HenryCo Intelligence" / "Henry & Co." appear nowhere; brand string traced to `@henryco/config`.
4. **Guardrail UX smoke** — a competing-brand prompt and an anti-company prompt each produce a calm in-thread refusal with a working resource link, and emit `henry.intelligence.guardrail.triggered`.
5. **Cost preview** — metered context shows kobo-per-message matching V3-27 `decideBilling`; free context shows the free badge.
6. **Streaming smoke** — a large response streams smoothly with no layout shift (CLS ≈ 0).
7. **RLS verification** — profile A cannot `select` profile B's conversations or messages; `system` rows reject client insert.
8. **Inline insert-back** — drafted text from each of the 3 inline surfaces inserts into the host composer via `onDraftAccepted`.
9. **Export** — conversation PDF renders watermarked via `@henryco/branded-documents`, auth-gated, provider name absent.
10. **UI** — real-browser pass: light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.
11. **i18n gate** — hardcoded-string scanner clean for the new surface; `surface:intelligence` keys present in en-US Pattern A.

## Deployment gate
- All validation gates green; the provider-mask CI gate is required-to-merge.
- Owner review (Identity risk class) on the brand-lock + provider-mask + conversation-privacy RLS.
- 7-day soak on a feature flag (standalone surface + inline invocations enabled for staff profiles first) before general enablement.

## Final report contract
`.codex-temp/v3-28-ai-henryco-intelligence-chat-surface/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the provider-mask grep evidence (payloads + snapshots + export + logs) and the brand-string trace to `@henryco/config`.

## Self-verification
- [ ] `@henryco/intelligence-chat` ships `IntelligenceChat` reusing `@henryco/chat-composer` + `@henryco/messaging-thread`; streams from V3-26; preset key only (never raw prompt) crosses the wire.
- [ ] `(account)/intelligence` standalone surface live with conversation rename/delete and wallet + per-message cost preview.
- [ ] `intelligence_conversations` + `intelligence_messages` created with strict user-only RLS; `system` rows server-written only.
- [ ] Inline invocation wired on 3 surfaces (support draft / business draft / studio brief) with insert-back via `onDraftAccepted`.
- [ ] Guardrail UX renders a calm in-thread refusal with a resource link for competing-brand + anti-company prompts.
- [ ] Provider mask absolute — name absent from strings, payloads, exports, and logs; CI grep gate enforces it.
- [ ] User-facing name is "Henry Onyx Intelligence" from `@henryco/config`; "HenryCo Intelligence"/"Henry & Co." appear nowhere.
- [ ] Conversation export ships a watermarked branded PDF; provider name absent.
- [ ] Four telemetry events emit through the `@henryco/intelligence` envelope.
- [ ] `surface:intelligence` Pattern A copy added; hardcoded-string scanner clean; locked tokens + Fraunces + light/dark + CLS ≈ 0 + contrast verified; zero hardcoded domains.
- [ ] Audit log on export + guardrail; report written with provider-mask evidence + brand-string trace.
