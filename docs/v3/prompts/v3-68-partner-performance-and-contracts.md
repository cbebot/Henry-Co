# V3-68 — Partner: Performance + Contracts

**Pass ID:** V3-68 | **Phase:** H | **Pillar:** P8
**Deps:** V3-67 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Partner Performance engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P8: "Performance, contracts, payouts, service areas, quality scores."

## Mandatory scope

1. **Performance dashboard per partner**:
   - Completed transactions, completion rate, response time, rating, dispute rate.
   - Trend over time.
   - Compare against tier peers (privacy-respecting; ranks not exact numbers).

2. **Contract storage**:
   - Versioned contracts per partner.
   - Acceptance audit trail (HMAC-signed snapshot + timestamp + IP per ANTI-CLONE Principle 12).
   - Re-acceptance flow on contract version change.

3. **Dispute history**:
   - Partner sees their disputes (own data).
   - Trust staff sees aggregate.

4. **Performance-based actions**:
   - Below-threshold partner: warning email + remediation suggestions.
   - Persistent below-threshold: tier downgrade or suspension.

5. **Telemetry** — `henry.partner.performance.computed`, `henry.partner.contract.version_changed`, `henry.partner.performance.warning_issued`.

## Out of scope
- Partner payouts (V3-69).
- Per-vertical business suites (V3-70..V3-75).

## Dependencies
V3-67.

## Inheritance
@henryco/trust; @henryco/branded-documents.

## Trust / safety / compliance
- Partner-data RLS.
- Contract acceptance audited.
- ANTI-CLONE Principles 1 + 12.

## Mobile + desktop parity
Dashboard responsive; contract review desktop-primary.

## i18n
Per partner locale.

## Validation gates
1. Standard CI.
2. **Performance dashboard renders** for sample partner.
3. **Contract re-acceptance** flow.
4. **Performance warning** triggers on threshold breach.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Dashboard.
- [ ] Contract storage + acceptance audit.
- [ ] Dispute history.
- [ ] Performance-based actions.
- [ ] 3 new telemetry events.
- [ ] Report written.
