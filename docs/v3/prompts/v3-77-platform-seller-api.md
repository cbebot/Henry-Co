# V3-77 — Platform: Seller API

**Pass ID:** V3-77 | **Phase:** I | **Pillar:** P11, P8
**Deps:** V3-76, V3-71 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Seller API engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3-76 shipped API foundation. This pass adds seller-specific endpoints.

## Mandatory scope

1. **Endpoints**:
   - `GET /api/v1/products` (read seller's catalog)
   - `POST /api/v1/products` (create listing)
   - `PATCH /api/v1/products/<id>` (update)
   - `DELETE /api/v1/products/<id>`
   - `GET /api/v1/orders` (read orders for seller)
   - `POST /api/v1/orders/<id>/ship` (mark shipped)
   - `GET /api/v1/inventory` / `PATCH /api/v1/inventory`
   - `POST /api/v1/webhooks/subscribe` (subscribe to order.created etc.)

2. **Scopes**: `read:products`, `write:products`, `read:orders`, `write:order_fulfillment`, `read:inventory`, `write:inventory`.

3. **Example clients**: TypeScript + Python + Ruby in `docs/api/examples/seller-api/`.

4. **Webhook events**: `order.created`, `order.cancelled`, `payment.received`, `dispute.created`.

5. **Telemetry** — `henry.api.seller.products.read`, `henry.api.seller.order.shipped`, `henry.api.seller.webhook.subscribed`.

## Out of scope
- API foundation (V3-76).
- Developer docs site (V3-83).

## Dependencies
V3-76, V3-71.

## Inheritance
V3-76 API gateway; V3-71 seller suite.

## Trust / safety / compliance
- Per-key scopes enforced.
- Webhook signed.
- ANTI-CLONE Principle 2.

## Mobile + desktop parity
N/A (API).

## i18n
N/A.

## Validation gates
1. Standard CI.
2. **OpenAPI schema** for all endpoints.
3. **Integration tests** — example client successfully uses each endpoint.
4. **Scope enforcement** verified.

## Deployment gate
- Public sandbox + 1 partner integration tested.

## Final report contract
Standard.

## Self-verification
- [ ] All endpoints.
- [ ] OpenAPI schema.
- [ ] 3 example clients.
- [ ] Webhook events.
- [ ] 3 new telemetry events.
- [ ] Report written.
