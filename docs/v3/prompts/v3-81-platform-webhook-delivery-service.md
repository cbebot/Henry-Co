# V3-81 — Platform: Webhook Delivery Service

**Pass ID:** V3-81 | **Phase:** I | **Pillar:** P11
**Deps:** V3-76 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Webhook Delivery engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P11: "Webhooks — versioned, signed, retryable, observable."

## Mandatory scope

1. **Webhook subscription**:
   - Partner subscribes to event types via API.
   - Per-subscription URL + secret.

2. **Delivery service**:
   - Signed payload (HMAC-SHA256 with subscription secret).
   - Retry with exponential backoff (8 attempts over 24h).
   - Dead-letter after exhausted.

3. **Observable**:
   - Partner sees delivery log.
   - Per-event delivery state.

4. **Verifier endpoint** for partners to test webhook receipt.

5. **Telemetry** — `henry.webhook.delivered`, `henry.webhook.failed`, `henry.webhook.dead_lettered`.

## Out of scope
- Specific event types (per per-API pass).

## Dependencies
V3-76.

## Inheritance
V3-43 workflow engine (uses for retry).

## Trust / safety / compliance
- HMAC signatures mandatory.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
N/A.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. **Delivery + retry smoke**.
3. **Signature verification**.
4. **Dead-letter handling**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Subscription mgmt.
- [ ] Delivery service.
- [ ] Observable log.
- [ ] 3 new telemetry events.
- [ ] Report written.
