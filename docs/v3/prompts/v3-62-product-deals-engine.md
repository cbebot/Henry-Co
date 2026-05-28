# V3-62 — Product: Deals Engine

**Pass ID:** V3-62 | **Phase:** G | **Pillar:** P1, P3
**Deps:** V3-35 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Deals engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3-35 shipped personalized deals. This pass adds the engine: deal creation by partners, discovery surface, fairness audit at depth.

## Mandatory scope

1. **Partner deal creator** in business suite:
   - Self-service deal authoring per V3-35 schema.
   - Per-business deal calendar.

2. **Discovery surfaces**:
   - `/deals` cross-division hub.
   - Per-division deal section.
   - Search filter "On deal".

3. **Fairness audit at depth**:
   - Impression distribution alert if 1 partner > 30% of impressions in a category.
   - Owner override capacity for promoted deals (paid placement).

4. **Deal expiry workflow**: auto-archive on ends_at.

5. **Telemetry** — `henry.deal.partner_authored`, `henry.deal.discovery_viewed`, `henry.deal.fairness_alert_triggered`.

## Out of scope
- Personalization (V3-35).
- Newsletter promotion (V3-61).

## Dependencies
V3-35.

## Inheritance
V3-35 schema + personalization context.

## Trust / safety / compliance
- Approval workflow per V3-35.
- ANTI-CLONE Principles 1 + 12.

## Mobile + desktop parity
Discovery responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Partner authoring** smoke.
3. **Discovery surfaces** render personalized.
4. **Fairness audit** triggers.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Partner self-service.
- [ ] Cross-division hub.
- [ ] Fairness audit.
- [ ] Expiry workflow.
- [ ] 3 new telemetry events.
- [ ] Report written.
