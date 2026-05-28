# V3-78 — Platform: Logistics API

**Pass ID:** V3-78 | **Phase:** I | **Pillar:** P11
**Deps:** V3-76, V3-74 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Logistics API engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P11. V3 PASS 21 shipped logistics backend; this exposes it via public API.

## Mandatory scope

1. **Endpoints**:
   - `POST /api/v1/quote`
   - `POST /api/v1/shipments`
   - `GET /api/v1/shipments/<id>`
   - `GET /api/v1/shipments/<id>/track`
   - `POST /api/v1/shipments/<id>/cancel`
   - `POST /api/v1/shipments/<id>/pod` (proof of delivery)
   - Webhook subscriptions for status updates.

2. **Scopes**: `logistics:quote`, `logistics:book`, `logistics:read`, `logistics:cancel`.

3. **Signed callbacks** for status updates.

4. **Example clients**: TS + Python.

5. **Telemetry** — `henry.api.logistics.quoted`, `henry.api.logistics.booked`, `henry.api.logistics.tracked`.

## Out of scope
- Logistics dashboard (V3-74).
- Internal rider mechanics.

## Dependencies
V3-76, V3-74.

## Inheritance
V3-76 gateway; existing logistics backend.

## Trust / safety / compliance
- Customer addresses redacted in webhooks (only pickup/dropoff details for booked shipments).
- ANTI-CLONE Principle 2.

## Mobile + desktop parity
N/A.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. OpenAPI schema.
3. Integration tests.
4. Webhook signature.

## Deployment gate
- Public sandbox.

## Final report contract
Standard.

## Self-verification
- [ ] All endpoints.
- [ ] Signed webhooks.
- [ ] Example clients.
- [ ] 3 new telemetry events.
- [ ] Report written.
