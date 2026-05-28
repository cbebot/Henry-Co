# V3-59 — Product: Concierge / Guided Assistant

**Pass ID:** V3-59 | **Phase:** G | **Pillar:** P1, P4
**Deps:** V3-28 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Concierge engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Concierge / guided assistant — cross-division assistant powered by HenryCo Intelligence."

## Mandatory scope

1. **Concierge surface** at `/concierge` or floating widget:
   - Welcomes first-time users.
   - Offers to walk through booking a service, listing on marketplace, applying to a job, etc.
   - Powered by V3-28 chat surface.

2. **Guided flows** for first-time users:
   - "I want to book a service" → asks needs → suggests services → opens slot picker.
   - "I want to sell something" → asks category → walks through listing creation.
   - "I'm looking for a job" → asks skills → recommends jobs.
   - "I need design help" → asks scope → opens studio intake.

3. **Cross-division stitching**: each completed flow surfaces related next steps from other divisions.

4. **Trigger logic**:
   - New-user onboarding.
   - User-initiated via floating button.
   - Surface-triggered ("Need help completing this?" CTA on hard pages).

5. **Telemetry** — `henry.concierge.opened`, `henry.concierge.flow_started`, `henry.concierge.flow_completed`, `henry.concierge.cross_division_referral`.

## Out of scope
- Customer support (V3-29 support assist).
- AI personality at depth (extends V3-28 system prompts).

## Dependencies
V3-28.

## Inheritance
@henryco/intelligence-chat; V3-39 smart-next-action; V3-36 recommendations.

## Trust / safety / compliance
- Same guardrails as V3-28.
- Free for company-critical flows (registration, account setup); metered for personal explore.

## Mobile + desktop parity
Floating widget responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **4 guided flows** smoke.
3. **Cross-division stitching** verified.
4. **Trigger correctness**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Surface + widget.
- [ ] 4 guided flows.
- [ ] Cross-division stitching.
- [ ] Trigger logic.
- [ ] 4 new telemetry events.
- [ ] Report written.
