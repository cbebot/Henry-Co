# V3-53 — Product: Property Rules Engine

**Pass ID:** V3-53 | **Phase:** G | **Pillar:** P1, P7
**Deps:** V3-12 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** Compliance

## Role
V3 Property Rules engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 backlog identifies property rules engine as named-but-not-built. `docs/property-inspection-eligibility-rules.md` exists.

## Mandatory scope

1. **`property_listing_rules` config**:
   - Validity rules: minimum images, address verified, price range valid, owner consent, no banned terms.
   - Inspection eligibility per `property-inspection-eligibility-rules.md`.
   - Per-region overlay (Lagos-specific rules vs Abuja vs other states).

2. **Rule engine**:
   - On listing submit: run rules → status.
   - On listing edit: re-run.
   - On report: trigger admin re-check.

3. **Per-rule decisions**: pass / hold-for-review / reject + reason codes.

4. **Listing governance flag automation**:
   - Auto-suspend listings violating rules until corrected.
   - Notify owner with specific reason + fix path.

5. **Inspection scheduling integration**: eligible listings get "Schedule inspection" CTA.

6. **Staff override** with audit log.

7. **Telemetry** — `henry.property.listing.rule_evaluated`, `henry.property.listing.held`, `henry.property.listing.rejected`, `henry.property.inspection.eligible`.

## Out of scope
- Inspection booking (uses V3-51).
- Marketing copy (V3-25 moderation).

## Dependencies
V3-12.

## Inheritance
Existing property app; @henryco/trust.

## Trust / safety / compliance
- L18 published rules.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Listing submission responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Rule eval** unit tests.
3. **Auto-suspend** smoke.
4. **Inspection eligibility** correct.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Rules schema + engine.
- [ ] Governance automation.
- [ ] Inspection integration.
- [ ] Staff override path.
- [ ] 4 new telemetry events.
- [ ] Report written.
