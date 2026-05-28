# V3-48 — Workflow: Follow-Up Campaigns

**Pass ID:** V3-48 | **Phase:** F | **Pillar:** P5, P3
**Deps:** V3-43, V3-35 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Campaign engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Auto-trigger follow-up campaigns: post-purchase, post-booking, post-service, post-course." Newsletter is V3-61; this pass is targeted follow-ups.

## Mandatory scope

1. **Campaign workflows**:
   - Post-purchase: thank-you + review request + cross-sell.
   - Post-booking: appointment reminder + post-service feedback request.
   - Post-service: NPS survey + follow-on services.
   - Post-course (Learn): certificate + next-course suggestions + jobs-board pipeline (V3-56).

2. **Multi-step**: each campaign has step sequence with delays.

3. **A/B test ready** (uses V3-91 framework when available; deterministic until then).

4. **Channels**: email, in-app, push.

5. **Per-campaign telemetry**: send / open / click / convert.

6. **Telemetry** — `henry.campaign.step_sent`, `henry.campaign.step_opened`, `henry.campaign.step_clicked`, `henry.campaign.conversion`.

## Out of scope
- Newsletter (V3-61).
- Auto-remind for incomplete actions (V3-45).

## Dependencies
V3-43, V3-35.

## Inheritance
@henryco/email; @henryco/notifications; @henryco/workflow.

## Trust / safety / compliance
- Opt-out per campaign type.
- GDPR-compliant; transactional vs marketing separation.

## Mobile + desktop parity
All channels.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **4 campaign types e2e**.
3. **Opt-out test**.
4. **Per-step telemetry**.

## Deployment gate
- 30-day cycle for full conversion observation.

## Final report contract
Standard.

## Self-verification
- [ ] 4 campaigns.
- [ ] Multi-step sequences.
- [ ] Channel routing.
- [ ] Per-step telemetry.
- [ ] 4 new events.
- [ ] Report written.
