# V3-12 — Studio AI: migrate the 3 inline Anthropic calls onto the governed gateway

**Date:** 2026-06-30
**Branch base:** `origin/main` @ `bb3e21eb` (worktree `v3-studio-ai-gateway`)
**Task source:** "V3 AI — remaining runtime-gated tasks", Task 2 (V3-12 / #12)
**Money impact:** none directly. One surface (`studio.brief.client`) becomes METERED but stays
fail-closed/flag-dark until studio wallets exist. No migrations. No ledger change.

---

## 1. Goal

`apps/studio` makes **three direct `new Anthropic(...)` calls**, bypassing the governed
`@henryco/ai-gateway`. Route all three through the gateway so they inherit provider/model
**opacity**, the system-wide **kill switch**, **audit/telemetry**, and (for the client-end
surface) **metering** — while **preserving each feature's existing behavior, anti-abuse, and
graceful fallback** exactly. The headline win: close the opacity holes (see §8) and leave
studio with **no provider SDK at all**.

The three calls:

| File | Feature | Audience | Gateway surface | Billing |
|---|---|---|---|---|
| `lib/studio/brief-copilot-action.ts` | one-shot structured brief generator | **public / anon-capable** | `studio.brief.staff` | FREE |
| `lib/studio/brief-chat-action.ts` | multi-turn "talk it through" brief coach | **public / anon-capable** | `studio.brief.coach` *(new)* | FREE |
| `lib/portal/refine-draft-action.ts` | client↔team message polish | **authed** (client portal) | `studio.brief.client` | METERED |

---

## 2. Current state (verified against `origin/main`)

- The gateway exposes the proven server entry `runAiTask(task, opts)` and the high-level
  `createAssistRunner({ surface, resolveActor, billing? })` mount helper
  (`packages/ai-gateway/src/server/{index,assist-kit}.ts`). The marketplace METERED draft
  (`apps/marketplace/lib/ai/draft-listing-action.ts`) is the proven template.
- `studio.brief.staff` (billable:false) and `studio.brief.client` (billable:true) are
  **already registered** (`surfaces.ts`), but **both point at one stub prompt builder**
  `buildStudioBriefPrompt` → `singleShotPrompt` (free-form brief prose). That output shape
  matches **none** of the three real actions.
- The gateway enforces **"no anonymous AI at the router"**: `runAiTask`/`runAiTaskWith` refuse
  a blank `actorId`, and `createAssistRunner` refuses a null actor.
- **Opacity scan** (`scripts/v3/ai-opacity-scan.mjs`) currently scopes
  `SCAN_ROOTS = ["packages/ai-gateway","apps/marketplace"]` and *explicitly documents studio's
  three calls as the out-of-scope "Pass-2 gateway-migration target."* This task **is** Pass-2.
- Studio has **no payments/wallet wiring** (`PAYMENTS_DATABASE_URL`/`payments-db` absent) and
  does **not** depend on `@henryco/ai-gateway` or `@henryco/payments-db` yet.
- `@anthropic-ai/sdk` is imported by **exactly** the three action files (+ `package.json`).

## 3. The two findings that reshape this task

**(A) Registration ≠ compatibility.** A gateway surface is *(policy + prompt builder + output
contract)*. The studio surfaces have policy but only a stub builder. Faithful routing requires
**real gateway prompt builders** that reproduce each action's output shape:
- copilot → strict **20-field `BriefCopilotStructured`** JSON (+ out-of-scope refusal stub).
- chat → multi-turn **`{reply, ready}`** envelope.
- refine → **message polish** (free-form refined text).

**(B) Anonymous-funnel collision.** `brief-copilot` is a **public, anonymous-capable** tool
(`ANON_LIMIT_PER_SESSION=5` by session cookie vs `AUTH_LIMIT_PER_DAY=20`; "*Sign in for a higher
limit*"), and `brief-chat` (`/request/copilot` "Talk it through") has **no auth check at all**.
Mounting them via `createAssistRunner` (which demands a `userId`) would refuse every anonymous
prospect and silently drop them to the deterministic fallback — **killing the model-powered
public funnel**. Only `refine` is genuinely auth-gated (`getClientPortalViewer`).

**Resolution (no gateway-invariant change):** copilot/chat call **`runAiTask` directly** with a
**stable synthetic `actorId`** — `session:<cookieId>` for copilot (it already mints a session
cookie), and a per-conversation id for chat. The gateway requires a *non-empty* actor, not a
*verified* one; studio's own anti-abuse (6-layer for copilot; turn-ceiling + backoff for chat)
remains the authoritative guard. `refine` keeps the authed `createAssistRunner` path. This
preserves the public funnel and leaves the cross-division "no anonymous AI" rule **untouched**.
(See §11 Decision D1 for the considered-but-rejected alternative of an `allowAnonymous` surface
policy flag.)

## 4. Approach: faithful & complete (user-approved)

Migrate all three, **behavior-identical when enabled**, by (a) adding three faithful gateway
prompt builders, (b) rewiring each studio action to call the gateway in place of the inline
provider call while keeping its validation / anti-abuse / parsing / fallback, and (c) closing
the opacity leaks and removing the SDK. No behavior is simplified; the model path produces the
same shapes the existing parsers already consume.

## 5. End-state behavior model (the invariant we test)

| `ai_gateway` master flag | copilot (FREE) | chat (FREE) | refine (METERED) |
|---|---|---|---|
| **OFF (today's default)** | deterministic `buildFallbackStructured` | deterministic `nextCoachReply` | graceful "kept as-is" (original draft) |
| **ON**, provider configured | governed model call, opaque receipt | governed model call, opaque receipt | governed call **iff** studio wallet funded; else graceful "kept as-is" |

In every cell: **no provider name or real model id** reaches a client bundle, a log, a DB row,
or a receipt. With the master OFF, the system behaves exactly like "no `ANTHROPIC_API_KEY`"
does today — so the default deploy posture is unchanged.

## 6. Design — `@henryco/ai-gateway` changes

All gateway prompt text is composed with the shared doctrine via `composeSystemPrompt(...)`
(premium concierge, honesty, decline-competitor/anti-company, **opacity**), exactly as the
marketplace structured-draft builder does.

1. **Split the studio brief builders** (`src/server/prompts.ts`):
   - `studio.brief.staff` → **new `buildStudioBriefStructuredPrompt`** that emits the
     **20-field `BriefCopilotStructured` JSON schema + the out-of-scope refusal stub +
     anti-injection rules**, ported faithfully from studio's `BRIEF_COPILOT_SYSTEM_PROMPT`.
     Reads `task.input.description`.
   - `studio.brief.client` → **new `buildStudioMessageRefinePrompt`** (message *polish*: preserve
     intent/voice/language, strip filler, brief), ported from refine's `SYSTEM_PROMPT`. Reads
     `task.input.draft` (+ optional `projectTitle`/`projectSummary` context).
   - Update `PROMPT_BUILDERS` so the two no longer share `buildStudioBriefPrompt`. Remove the now
     orphaned `buildStudioBriefPrompt` stub.
2. **New surface `studio.brief.coach`** (multi-turn, FREE):
   - Add to the `AiSurfaceKey` union + `AI_SURFACES` registry: `billable:false`,
     `modelTier:"fast"`, `maxOutputTokens:512`, `maxCalls:1`.
   - **New `buildStudioBriefCoachPrompt`**: the ported `BRIEF_CHAT_SYSTEM_PROMPT` + the
     conversation via `normalizeChatMessages(task.input.messages)` (same primitive
     `intelligence.chat` uses).
3. **Output validation:** studio surfaces don't end in `.draft`/`.verify`, so the orchestrator's
   `validateOutput` returns `true` and passes the raw string back for the studio parser — no
   gateway change needed; assert this in a test so it can't silently regress.
4. **Tests** (`tsx --test`, pure, in-memory billing): coach registered FREE; each builder reads
   the right input keys and emits the right system/contract; the structured builder's schema is
   round-trip-parseable by a copy of `normaliseStructured`; the existing
   `studio.brief.staff/client` billable assertions still pass.

> Porting note: the canonical prompt + schema now live **once**, server-side in the gateway
> (the doctrine's intent). Studio keeps only its **parsers** (`normaliseStructured`,
> `parseChatEnvelope`) and **deterministic fallbacks** — never the provider prompt or model id.

## 7. Design — `apps/studio` changes (per action)

Common: remove `import Anthropic from "@anthropic-ai/sdk"`, the inline `client.messages.create`,
the `withModelTimeout` wrapper (the gateway owns the timeout), and every `claude-*` literal.
Add deps `@henryco/ai-gateway` + `@henryco/payments-db`; remove `@anthropic-ai/sdk`.

**7a. `brief-copilot-action.ts` → `studio.brief.staff` (FREE, anon-capable)**
- Keep: input validation, the 6-layer anti-abuse + dedup/cache (`countRecentDrafts`,
  `countByIpHash`, `countSystemWide`, session cookie, `findCachedDraft`), `buildFallbackStructured`,
  `normaliseStructured`, `writeStudioLog`, the `studio_brief_drafts` accounting rows.
- Replace the inline call with `runAiTask({ surface:"studio.brief.staff",
  actorId: userId ?? \`session:${sessionId}\`, input:{ description }, idempotencyKey:<inputHash> },
  { /* no billing (FREE); omit audit for the anon path */ })`.
- Parse `result.value.output` with the existing `normaliseStructured`; on `!result.ok`
  (kill-switch/not-configured/rate-limited/provider-failure) → existing `buildFallbackStructured`
  path (same "ok:true + fallback" UX).
- **Opacity:** stop writing `model_used`/`tokens_*` provider internals to `studio_brief_drafts`
  (write `model_used: null` or an opaque label; the gateway owns redacted telemetry). Scrub the
  `model`/token fields from `writeStudioLog`. Set `meta.modelUsed` to the opaque constant
  `"henry-onyx-intelligence"` for the model path (and keep the local `FALLBACK_MODEL` label for
  the deterministic path).

**7b. `brief-chat-action.ts` → `studio.brief.coach` (new, FREE, anon-capable)**
- Keep: `sanitizeMessages`, `BRIEF_CHAT_MAX_TURNS` ceiling, `redactChatText` (apply **before**
  passing messages to the gateway), `modelDisabledUntil` backoff on billing/auth errors,
  `parseChatEnvelope`, `nextCoachReply`/`coachTurn` deterministic fallback.
- Replace the inline call with `runAiTask({ surface:"studio.brief.coach",
  actorId:\`session:${perConversationId}\`, input:{ messages: redactedMessages },
  idempotencyKey:<turnKey> }, {})`. Parse output with `parseChatEnvelope`; any `!result.ok` or
  unparseable envelope → `coachTurn(messages)` (unchanged).
- **Opacity:** `BriefChatTurn.modelUsed` → opaque constant for the model path (keep
  `FALLBACK_MODEL` for the deterministic path). Drop the `BRIEF_COPILOT_MODEL` import.

**7c. `refine-draft-action.ts` → `studio.brief.client` (METERED, authed)**
- Keep: `MIN/MAX_DRAFT_CHARS`, `getClientPortalViewer` auth, the graceful "kept as-is"
  fallback (`originalDraft`).
- Replace the inline call with `createAssistRunner({ surface:"studio.brief.client",
  resolveActor: () => viewer ? { userId: viewer.id, supabase } : null,
  billing: createPgBillingPort(getStudioPaymentsSqlExecutor()) })` then
  `run({ input:{ draft, projectTitle, projectSummary }, idempotencyKey })`.
- `getStudioPaymentsSqlExecutor()` is **lazy/guarded** (`@henryco/payments-db` over
  `PAYMENTS_DATABASE_URL`); with the env unset (today) and the master flag dark, billing is never
  reached (kill switch is checked first). If the master is later enabled before studio wallets
  exist, `reserve` fails closed → graceful "kept as-is". No crash, no charge.
- **Opacity:** **remove `modelUsed` from `RefineDraftResult`** (the leak) and update callers; the
  success payload exposes only `refined` (+ the gateway's redacted `receipt` if the UI wants it).

**7d. Opacity scan**: add `"apps/studio"` to `SCAN_ROOTS` in `scripts/v3/ai-opacity-scan.mjs`,
proving no `claude-*` id and no SDK import remains anywhere in studio.

**7e. Prompt module cleanup**: `lib/studio/brief-copilot-prompt.ts` (exports only
`BRIEF_COPILOT_MODEL` + `BRIEF_COPILOT_SYSTEM_PROMPT`, both now in the gateway) is deleted;
`BRIEF_CHAT_SYSTEM_PROMPT` likewise moves to the gateway (studio keeps the chat *fallback*
constants it still uses: coach prompts, closing, max-turns).

## 8. Opacity contract — the leaks closed

| Leak (today) | Location | After |
|---|---|---|
| `modelUsed: response.model` returned **to the client** | refine `RefineDraftResult` | field removed |
| real `model_used` + provider token counts **persisted to DB** | copilot `studio_brief_drafts` insert ×3 | null / opaque; tokens dropped |
| real model name in **server logs** | copilot `writeStudioLog` details | scrubbed |
| `claude-*` model-id **literals** in app code | `brief-copilot-prompt.ts`, `refine-draft-action.ts` | removed (gateway owns model selection) |
| `@anthropic-ai/sdk` import in an app | all 3 actions + `package.json` | removed; studio has **no provider SDK** |
| studio **excluded** from opacity scan | `SCAN_ROOTS` | studio **added** → provable-green |

## 9. Error / fallback mapping (no dead-ends)

Gateway `{ ok:false, error.code }` → existing graceful UX, per action:
- `kill_switch_active`, `not_configured`, `rate_limited`, `wallet_insufficient`,
  `provider_failed`, `auth_required`, `validation_failed` → copilot/chat: deterministic fallback;
  refine: original draft "kept as-is".
This is a pure mapping; the action never surfaces a gateway error code raw to the user.

## 10. Testing & proof strategy (TDD; all local — definition of done)

**Gateway (pure, `tsx --test`):**
- builder unit tests (§6.4): input-key reading, system-prompt contract, coach multi-turn,
  structured round-trip parse, `studio.brief.coach` FREE, validateOutput passthrough.

**Studio (action tests with an injected fake gateway runner — no network):**
- copilot: master-OFF → fallback (provider never called); master-ON happy → parsed structured;
  anon (`session:` actorId) **not refused**; rate-limit/dedup short-circuit before the runner;
  **no `model_used`/token written to the DB row** (assert on the captured insert); `meta.modelUsed`
  opaque.
- chat: master-OFF → `nextCoachReply`; ON happy → parsed `{reply,ready}`; PII redacted before the
  runner sees it; turn ceiling honored; opaque `modelUsed`.
- refine: master-OFF / no-wallet → original draft; ON + funded (fake billing) → `refined`;
  **`RefineDraftResult` has no `modelUsed`** (type-level + runtime).

**Repo gates (must pass, captured as evidence):**
`pnpm run typecheck:all` · `lint:all` · `test:workspace` · `i18n:check:strict` · `tone:check`
· `node scripts/v3/ai-opacity-scan.mjs` (now green **with studio in scope**).

**Runtime (owner-assisted per the agreed handoff):** running studio + confirming the copilot,
coach, and refine still work before/after is the owner's verification; I deliver the code +
all local proofs above. (No migrations → no production apply for this phase.)

## 11. Decisions to confirm

- **D1 — anonymous funnel handling (recommended: synthetic `actorId`).** Preserve the public
  copilot/chat by passing a stable synthetic `actorId` to `runAiTask` (no gateway change).
  *Rejected alternative:* add an `allowAnonymous` flag to the surface policy + orchestrator — more
  honest/self-documenting but it modifies a **cross-division security invariant** and its tests;
  higher blast radius for no functional gain here. **Proposing D1-synthetic.**
- **D2 — opaque `modelUsed` label.** copilot/chat keep a `modelUsed` field for the UI but set it
  to a brand-opaque constant (`"henry-onyx-intelligence"`) on the model path. Alternative: drop
  the field entirely (more invasive to callers). **Proposing keep-but-opaque.**
- **D3 — refine staging.** Rely on the gateway's fail-closed (no studio wallet ⇒ graceful
  fallback) rather than inventing a second studio-only flag. The owner enables the client surface
  when studio wallets land. **Proposing fail-closed.**

## 12. Out of scope / non-goals

- Building studio wallets / funding the client surface (refine stays inert until then).
- Turning any flag **on** (everything ships dark).
- Touching money infra, the ledger, `payments_private`, or any migration (there are none).
- The other public surfaces or non-studio divisions.

## 13. Risks & mitigations

- **Behavior drift** (gateway prompt ≠ old prompt) → port verbatim; round-trip parser tests;
  owner before/after run.
- **Anon regression** → explicit anon tests (synthetic actorId not refused).
- **Hidden SDK/model literal left behind** → opacity scan with studio in scope is the backstop.
- **Refine silently failing once master is on but wallets aren't** → it degrades to the existing
  graceful "kept as-is"; documented; owner enables deliberately.
- **Windows monorepo build quirks** → run gates with the known `--workspace-concurrency=1` where
  needed.

## 14. Definition of done

All three calls routed through the gateway with behavior preserved; the six opacity items in §8
closed; studio in the opacity scan and green; all repo gates green with captured output; spec +
implementation committed on `worktree-v3-studio-ai-gateway`; ready for the owner's runtime
before/after check. No production change required this phase.
