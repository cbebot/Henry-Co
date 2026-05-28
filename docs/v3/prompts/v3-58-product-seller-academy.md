# V3-58 — Product: Seller Academy

**Pass ID:** V3-58 | **Phase:** G | **Pillar:** P1, P8
**Deps:** V3-56, V3-57 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Seller Academy engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Seller academy + tiered seller badges."

## Mandatory scope

1. **Academy course track** in Learn:
   - "Becoming a verified seller" — foundational.
   - "Optimizing your storefront" — intermediate.
   - "Premium seller best practices" — advanced.

2. **Seller-tier badges** (tied to V3-50 quality + V3-58 completion):
   - Bronze: completed foundational.
   - Silver: foundational + intermediate + 50+ transactions.
   - Gold: all 3 + 200+ transactions + 4.5+ rating.

3. **Badge surface**: visible on business profile + marketplace listings.

4. **Certification incentives**: tier-based platform-fee discounts (per D9 monetization rates).

5. **Telemetry** — `henry.seller.academy.enrolled`, `henry.seller.academy.completed`, `henry.seller.tier.upgraded`.

## Out of scope
- General Learn courses (existing).
- Seller business suite tooling (V3-71).

## Dependencies
V3-56, V3-57.

## Inheritance
Existing Learn; V3-50 quality scoring.

## Trust / safety / compliance
- Cert + tier audited.

## Mobile + desktop parity
Responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Academy courses** in Learn catalog.
3. **Tier badge logic** correct.
4. **Fee discounts** applied per tier.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] 3 academy courses.
- [ ] Tier badges live.
- [ ] Fee discount.
- [ ] 3 new telemetry events.
- [ ] Report written.
