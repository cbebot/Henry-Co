# V3-79 — Platform: Booking API

**Pass ID:** V3-79 | **Phase:** I | **Pillar:** P11
**Deps:** V3-76, V3-51 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Booking API engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P11 + V3-51 booking.

## Mandatory scope

1. **Endpoints**:
   - `GET /api/v1/services` (list)
   - `GET /api/v1/services/<id>/slots?date=...`
   - `POST /api/v1/bookings`
   - `GET /api/v1/bookings/<id>`
   - `POST /api/v1/bookings/<id>/cancel`
   - Webhook subscriptions for `booking.*` events.

2. **Scopes**: `booking:read`, `booking:write`, `booking:cancel`.

3. **Example clients**: TS + Python.

4. **Telemetry** — `henry.api.booking.slot_searched`, `henry.api.booking.created`, `henry.api.booking.cancelled`.

## Out of scope
- Provider matching (uses V3-51).

## Dependencies
V3-76, V3-51.

## Inheritance
V3-76 gateway; V3-51 booking engine.

## Trust / safety / compliance
- Sensitive-action gates apply.

## Mobile + desktop parity
N/A.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. OpenAPI schema.
3. Integration tests.

## Deployment gate
- Public sandbox.

## Final report contract
Standard.

## Self-verification
- [ ] Endpoints + scopes.
- [ ] Webhooks.
- [ ] Example clients.
- [ ] 3 new telemetry events.
- [ ] Report written.
