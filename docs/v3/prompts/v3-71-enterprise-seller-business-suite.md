# V3-71 — Enterprise: Seller Business Suite

**Pass ID:** V3-71 | **Phase:** H | **Pillar:** P8
**Deps:** V3-57, V3-58 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Seller Suite engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P8: "Seller business suite — bulk listing, deal scheduling, performance analytics, payout management, team roles."

## Mandatory scope

1. **Bulk listing tools**:
   - CSV import for product catalog.
   - Bulk price/inventory update.
   - Bulk publish/unpublish.

2. **Deal scheduling**:
   - Plan deals weeks in advance.
   - Auto-activate on date.
   - Per-deal performance.

3. **Performance analytics**:
   - Listings views + conversions.
   - Top sellers per category.
   - Seasonal trends.

4. **Payout management**:
   - View V3-69 schedule.
   - Adjust payout method.

5. **Team roles** (uses V3-57 business-members):
   - Owner, manager, operator, viewer.

6. **Telemetry** — `henry.seller_suite.bulk_listing.imported`, `henry.seller_suite.deal.scheduled`, `henry.seller_suite.team_member.invited`.

## Out of scope
- Marketplace ranking (V3-52).
- Seller academy (V3-58).

## Dependencies
V3-57, V3-58. Blocks V3-77.

## Inheritance
Marketplace seller dashboard (existing); V3-58 academy badges.

## Trust / safety / compliance
- Team-role audit.
- Sensitive actions (payout change) guarded.

## Mobile + desktop parity
Desktop-primary; mobile summary.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Bulk CSV import** smoke.
3. **Deal scheduling** activates on time.
4. **Analytics renders**.
5. **Team-role gates**.

## Deployment gate
- 30-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Bulk listing.
- [ ] Deal scheduling.
- [ ] Analytics.
- [ ] Payout management.
- [ ] Team roles.
- [ ] 3 new telemetry events.
- [ ] Report written.
