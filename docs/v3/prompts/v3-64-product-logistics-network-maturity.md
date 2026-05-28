# V3-64 — Product: Logistics Network Maturity

**Pass ID:** V3-64 | **Phase:** G | **Pillar:** P1
**Deps:** V3-12 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Logistics Network engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 PASS 21 shipped logistics rider/dispatcher/manager/owner workspaces + quote/book/track/POD. This pass adds multi-rider routing + bundling + SLA enforcement.

## Mandatory scope

1. **Multi-rider routing**: optimization algorithm assigns multiple deliveries to riders by proximity + capacity + time-window.

2. **Cross-division shipment bundling**: marketplace order + a care service equipment shipment can bundle if same destination + time-window.

3. **Customer tracking polish**: real-time ETA updates; in-app map view; rider photo + name + rating.

4. **SLA enforcement**:
   - Per-tier delivery promise (same-day, next-day, scheduled).
   - SLA breach triggers refund per policy.

5. **Telemetry** — `henry.logistics.bundle.created`, `henry.logistics.routing.optimized`, `henry.logistics.sla.breach`.

## Out of scope
- Logistics API (V3-78).
- B2B logistics dashboard (V3-74).

## Dependencies
V3-12. Blocks V3-74, V3-78.

## Inheritance
Existing logistics backend; @henryco/data.

## Trust / safety / compliance
- Rider identity verified.
- L8 insurance.

## Mobile + desktop parity
Rider app responsive; customer tracking mobile-first.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Routing optimization** — 10 deliveries optimally assigned.
3. **Bundling** smoke.
4. **SLA breach** triggers refund.

## Deployment gate
- 30-day soak; bundling cost vs single-delivery measured.

## Final report contract
Standard.

## Self-verification
- [ ] Multi-rider routing.
- [ ] Bundling.
- [ ] Customer tracking polish.
- [ ] SLA enforcement.
- [ ] 3 new telemetry events.
- [ ] Report written.
