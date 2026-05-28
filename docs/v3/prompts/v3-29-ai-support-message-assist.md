# V3-29 — AI: Support Message Assist (free)

**Pass ID:** V3-29 | **Phase:** D | **Pillar:** P4
**Deps:** V3-28 | **Effort:** M | **Parallel:** YES (with V3-30, V3-31, V3-32) | **Owner gate:** none | **Risk:** —

## Role
V3 Support-Assist engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P4: "Helps users draft support messages — FREE (company-critical task)." Per intelligence-rollout-status, deterministic `triageSupportStub` exists. This pass adds AI-assisted draft authoring.

## Mandatory scope

1. **Task class**: `support_message_assist` (registered in `ai_task_pricing` as `free_company`).

2. **System prompt template** (in V3-26 prompt-template registry):
   - Persona: "You are HenryCo Intelligence helping a user describe their issue clearly to HenryCo support."
   - Task: "Help the user articulate their problem. Ask clarifying questions only if necessary. Refuse to discuss competitors, refuse to speak negatively of HenryCo."
   - Output format: structured draft (title + body + suggested category).

3. **Integration with chat-composer**:
   - "Need help writing this?" inline button on support thread compose.
   - Click opens HenryCo Intelligence overlay (from V3-28).
   - User chats; gets a polished draft.
   - "Use this draft" → inserts into composer.

4. **Per-call rate limit**: 10 messages per conversation; 50 conversations per user per day.

5. **Mobile flow**: same overlay, full-screen on mobile.

6. **Telemetry** — `henry.intelligence.support_assist.opened`, `henry.intelligence.support_assist.draft_used`, `henry.intelligence.support_assist.draft_dismissed`.

## Out of scope
- Auto-triage routing (V3-44 auto-assign).
- Support summarization (V3-42 predictive dashboards).

## Dependencies
V3-28.

## Inheritance
@henryco/chat-composer; @henryco/intelligence-chat; @henryco/ai-router.

## Trust / safety / compliance
- Free per D4 baseline (company-critical).
- ANTI-CLONE Principle 1.

## Mobile + desktop parity
Same overlay; mobile full-screen.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **End-to-end** — open assist → chat → use draft → submit support thread.
3. **Rate limit** — 10 messages/conv enforced.
4. **Free billing** — wallet not charged.

## Deployment gate
- 7-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Task class registered as free.
- [ ] System prompt + integration.
- [ ] Rate limit.
- [ ] Mobile flow.
- [ ] 3 new telemetry events.
- [ ] Report written.
