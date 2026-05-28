# V3-28 — HenryCo Intelligence Chat Surface

**Pass ID:** V3-28 | **Phase:** D | **Pillar:** P4
**Deps:** V3-26, V3-27 | **Effort:** L | **Parallel:** NO | **Owner gate:** none | **Risk:** Identity

## Role
V3 AI Surface engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P4: "Governed chat UI labeled 'HenryCo Intelligence' only; declines competing-brand questions; declines anti-company statements."

**Hard constraint:** Provider name NEVER appears in user-facing UI.

## Mandatory scope

1. **`@henryco/intelligence-chat` package** (new):
   - Chat UI: WhatsApp-style + branded for HenryCo Intelligence.
   - Uses `@henryco/chat-composer` (existing) for input.
   - Streams responses (uses V3-26 streaming if supported).
   - Per-context preset: each calling surface (support, business, studio brief, etc.) gets its own system-prompt preset.

2. **`/intelligence` route** at `apps/account/app/(account)/intelligence/`:
   - Generic chat surface for authenticated users.
   - Conversation history persisted in `intelligence_conversations` table.
   - User can rename / delete conversations.
   - Wallet balance + cost-per-message preview visible.

3. **Inline chat invocation**:
   - On support thread compose: "HenryCo Intelligence can help you draft this" → opens overlay → drafted reply inserted back.
   - On business reply compose: same pattern (metered).
   - On studio brief intake: same.

4. **Guardrail UI**:
   - When guardrail triggers (brand promotion, anti-company, off-topic): show calm refusal copy with link to relevant HenryCo resource.

5. **Branding lock**:
   - Loading state: "HenryCo Intelligence is thinking…" — never references Claude/GPT/etc.
   - Error: "HenryCo Intelligence is unavailable. Please try again." — never references provider.
   - About / settings page: "Powered by advanced AI" — no provider name.

6. **Conversation export**:
   - User can download conversation as PDF (via @henryco/branded-documents).
   - Watermarked per ANTI-CLONE Principle 5.

7. **Telemetry** — `henry.intelligence.conversation.started`, `henry.intelligence.message.sent`, `henry.intelligence.guardrail.triggered`, `henry.intelligence.conversation.exported`.

## Out of scope
- Task-specific assists (V3-29..V3-32).
- Personal-task gating logic (V3-33).
- Concierge cross-division guided assistant (V3-59).

## Dependencies
V3-26, V3-27. Blocks V3-29, V3-30, V3-31, V3-32, V3-59.

## Inheritance
@henryco/chat-composer; @henryco/messaging-thread; @henryco/ai-router; @henryco/branded-documents.

## Trust / safety / compliance
- Brand-lock + provider-mask enforced from UI to telemetry.
- Wallet balance shown pre-send for metered context.
- Conversation history RLS — user-only.
- ANTI-CLONE Principles 1, 9.

## Mobile + desktop parity
Web: full surface. Expo: mobile-native chat via shared package + Expo's native modules.

## i18n
All UI copy via @henryco/i18n; AI responses respect user locale.

## Validation gates
1. Standard CI.
2. **Provider-mask test** — grep response payloads + UI snapshots for provider names; ZERO matches.
3. **Guardrail UX smoke** — competing brand mention + anti-company question both produce refusal with link.
4. **Wallet preview** — cost shown before send; matches V3-27 estimate.
5. **Streaming smoke** — large response streams smoothly.

## Deployment gate
- 7-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Chat package shipped.
- [ ] /intelligence route live.
- [ ] Inline invocations from 3+ surfaces.
- [ ] Guardrail UI.
- [ ] Provider-mask enforced.
- [ ] Conversation export.
- [ ] 4 new telemetry events.
- [ ] Report written.
