# V3-30 — AI: Business Message Assist (metered)

**Pass ID:** V3-30 | **Phase:** D | **Pillar:** P4, P8
**Deps:** V3-28 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** Money

## Role
V3 Business-Assist engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P4: "Helps business owner draft customer-facing messages — METERED." For employer hiring messages, seller listing descriptions, studio proposal copy.

## Mandatory scope

1. **Task class**: `business_message_assist` (metered_business).

2. **System prompt template**: persona helping a business owner write professional, brand-consistent customer-facing copy. Considers business profile (V3-57) for tone.

3. **Surfaces**:
   - Jobs hiring message compose.
   - Marketplace seller item description compose.
   - Studio proposal draft compose.
   - Care provider profile bio compose.

4. **Per-business rate limit**: 100 messages per business per day.

5. **Pricing**: metered against business wallet; per-call cost shown pre-send.

6. **Telemetry** — `henry.intelligence.business_assist.opened`, `henry.intelligence.business_assist.draft_used`.

## Out of scope
- Auto-generated catalog (only assist, not autonomous).

## Dependencies
V3-28.

## Inheritance
@henryco/intelligence-chat; @henryco/ai-router; business profiles (V3-57 once shipped — placeholder pattern until then).

## Trust / safety / compliance
- Metered; wallet check pre-call.
- ANTI-CLONE Principles 1, 12.

## Mobile + desktop parity
Same overlay.

## i18n
Per locale; business profile language preference respected.

## Validation gates
1. Standard CI.
2. **End-to-end** in each of 4 surfaces.
3. **Metered billing** — wallet charged per call.
4. **Per-business rate limit**.

## Deployment gate
- 7-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Task class registered as metered.
- [ ] Integration with 4 business surfaces.
- [ ] Rate limit enforced.
- [ ] 2 new telemetry events.
- [ ] Report written.
