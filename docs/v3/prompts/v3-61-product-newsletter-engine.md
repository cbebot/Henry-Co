# V3-61 — Product: Newsletter Engine

**Pass ID:** V3-61 | **Phase:** G | **Pillar:** P1, P5
**Deps:** V3-48 | **Effort:** M | **Parallel:** YES | **Owner gate:** D7 | **Risk:** —

## Role
V3 Newsletter engineer. Execute, then stop.

## Project
Standard.

## Audit summary
@henryco/newsletter exists (subscribe + transactional templates). Extends to campaign authoring + segmentation + GDPR-compliant unsubscribe.

## Mandatory scope

1. **Campaign authoring** at `apps/hub/app/owner/(command)/newsletter/`:
   - Compose with rich-text editor.
   - Per-segment selection.
   - Test send + schedule.

2. **Segmentation**:
   - By division engagement, by location, by lifecycle stage, by purchase history.
   - Compose AND/OR rules.

3. **Analytics per campaign**: send / open / click / unsubscribe / conversion.

4. **GDPR-compliant**:
   - Double opt-in for new subscribers.
   - One-click unsubscribe per CAN-SPAM + GDPR.
   - Per-category opt-out granularity.

5. **Per D7**: unified `news@henrycogroup.com` sender for marketing; per-division transactional preserved.

6. **Telemetry** — `henry.newsletter.campaign.created`, `henry.newsletter.campaign.sent`, `henry.newsletter.subscriber.opted_out`.

## Out of scope
- Transactional emails (per-division preserved).
- Follow-up campaigns (V3-48).

## Dependencies
V3-48.

## Inheritance
@henryco/newsletter + @henryco/email.

## Trust / safety / compliance
- L6 privacy/terms updated.
- Sender reputation per L11.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Authoring tool desktop-primary.

## i18n
Campaigns per-locale; subscribers' preferred locale respected.

## Validation gates
1. Standard CI.
2. **Campaign send e2e**.
3. **Segmentation correctness**.
4. **Unsubscribe** 1-click works.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Authoring tool.
- [ ] Segmentation.
- [ ] Per-campaign analytics.
- [ ] Unified marketing sender (D7).
- [ ] 3 new telemetry events.
- [ ] Report written.
