# V3-31 — AI: Account Check Assist (free)

**Pass ID:** V3-31 | **Phase:** D | **Pillar:** P4
**Deps:** V3-28 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** Identity

## Role
V3 Account-Check engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P4: "Helps user check anything in their account — FREE; respects RLS; never reveals secrets."

## Mandatory scope

1. **Task class**: `account_check_assist` (free_company).

2. **Account-context retrieval**:
   - Server-only function `getAccountContextForAI(userId)` — pulls user's: recent orders, bookings, KYC status, wallet balance, subscription state, notifications summary.
   - PII-redacted before sending to AI provider (V3-26 guardrail).
   - Includes only data the user already has access to.

3. **System prompt template**:
   - "You are HenryCo Intelligence helping a user understand their HenryCo account. Reference only the provided context. Never reveal information about other users. Never reveal internal IDs or secrets."

4. **Integration**:
   - "Ask about your account" CTA on `apps/account/app/(account)/page.tsx`.
   - Opens chat overlay with account context pre-loaded.
   - User asks: "When did I last buy from store X?" / "What's my wallet balance?" / "What's my KYC status?"
   - AI answers from context (or "I don't have that information").

5. **Telemetry** — `henry.intelligence.account_check.opened`, `henry.intelligence.account_check.question_answered`, `henry.intelligence.account_check.refused`.

## Out of scope
- Cross-user account access (never).
- Mutating actions ("change my address") — handled by sensitive-action guard route.

## Dependencies
V3-28.

## Inheritance
@henryco/intelligence-chat; @henryco/data (aggregator for context).

## Trust / safety / compliance
- Server-only context retrieval; client never sends raw context to provider.
- RLS enforced at retrieval.
- PII redaction in V3-26 guardrails.
- Refusal pattern for cross-user questions audited.
- ANTI-CLONE Principles 1, 6, 12.

## Mobile + desktop parity
Same overlay.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **RLS test** — context retrieval limited to caller.
3. **Cross-user refusal** — attempt to ask about another user; AI refuses.
4. **PII redaction** — verify outbound context to provider has email/phone/PAN redacted.
5. **Free billing** — wallet not charged.

## Deployment gate
- 7-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Task class registered free.
- [ ] Server-only context retrieval.
- [ ] PII redaction.
- [ ] Cross-user refusal verified.
- [ ] 3 new telemetry events.
- [ ] Report written.
