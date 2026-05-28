# V3-80 — Platform: Business-Account API

**Pass ID:** V3-80 | **Phase:** I | **Pillar:** P11, P8
**Deps:** V3-76, V3-75 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Business API engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P11: "Business-account API — multi-user accounts, team roles, analytics access."

## Mandatory scope

1. **Endpoints**:
   - `GET /api/v1/business`
   - `PATCH /api/v1/business`
   - `GET /api/v1/business/members`
   - `POST /api/v1/business/members`
   - `DELETE /api/v1/business/members/<id>`
   - `GET /api/v1/business/analytics`
   - `GET /api/v1/business/invoices`

2. **Scopes**: `business:read`, `business:write`, `business:members:manage`, `business:analytics:read`.

3. **Telemetry** — `henry.api.business.member_added`, `henry.api.business.analytics_read`.

## Dependencies
V3-76, V3-75.

## Inheritance
V3-75; V3-76 gateway.

## Trust / safety / compliance
- Sensitive-action guard.
- Owner role required for member-add.

## Mobile + desktop parity
N/A.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. OpenAPI schema.
3. Integration tests.

## Deployment gate
- Sandbox.

## Final report contract
Standard.

## Self-verification
- [ ] Endpoints.
- [ ] Scopes enforced.
- [ ] 2 new telemetry events.
- [ ] Report written.
