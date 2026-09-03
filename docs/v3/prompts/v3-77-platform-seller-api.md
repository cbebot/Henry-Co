# V3-77 — Platform/API: Seller API

**Pass ID:** V3-77  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P11 (Platform & API), P8 (Partner & Enterprise)
**Dependencies:** V3-76 (public API foundation), V3-71 (seller business suite)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Seller API engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the **public Seller API**: scope-gated, versioned, OpenAPI-described endpoints that let an authorized marketplace seller manage their own catalog, read their own orders, fulfil shipments, manage inventory, and subscribe to webhooks — entirely through `@henryco/api-gateway` (V3-76). The line you must not cross: a seller key reads and writes **only that seller's own data**, the API never moves money or exposes another party's data or any proprietary ranking/scoring, and every write is idempotent and scope-checked at the gateway.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/77-platform-seller-api` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The marketplace data model is mature and seller-scoped. Real tables (from `apps/marketplace/supabase/migrations/`): `marketplace_products`, `marketplace_product_variants`, `marketplace_product_media`, `marketplace_orders`, `marketplace_order_groups`, `marketplace_order_items` (rows carry a `vendor_id` linking the line to the selling vendor), `marketplace_stores`/`marketplace_sellers` (seller identity), `marketplace_disputes`, `marketplace_returns`, `marketplace_payment_records`, `marketplace_payout_requests`, and `marketplace_role_memberships` (which users may act for which store). The marketplace web app and the V3-71 seller business suite (bulk listing, deal scheduling, performance, payouts, team roles) already mutate these tables through first-party cookie-session routes.

V3-76 shipped `@henryco/api-gateway` (`withApiGateway`), the `api_keys`/`api_scopes`/`api_call_log`/`api_idempotency_keys` schema, the `/api/v1/` versioning scheme, the partner key-management UI in `apps/account`, and the core scope seeds (`read:products`, `write:products`, `read:orders`, `read:inventory`, `read:profile`).

The gap this pass closes: there is **no machine interface** for sellers — every seller mutation today requires a logged-in browser session in the marketplace app. This pass exposes the *same* seller-owned operations as a stable, versioned, scope-gated public API so external storefronts, ERPs, and inventory systems can integrate, with example clients to prove it.

## Mandatory scope

### S1 — Endpoints (all under `/api/v1`, all wrapped in `withApiGateway`)

Mount in `apps/marketplace/app/api/v1/` (the marketplace app owns marketplace data; the gateway provides cross-app auth). Every handler resolves the seller from `ApiContext.partnerId` → the partner's bound `marketplace_stores` row(s), and constrains all queries to `vendor_id`/`store_id` of that seller.

| Method + path | Scope | Mutating | Behavior |
|---|---|---|---|
| `GET /api/v1/products` | `read:products` | — | List the seller's own listings (paginated, cursor-based). |
| `GET /api/v1/products/{id}` | `read:products` | — | Read one of the seller's listings + variants + media. |
| `POST /api/v1/products` | `write:products` | yes | Create a listing (status starts as `draft`/`pending_review`; never auto-published). |
| `PATCH /api/v1/products/{id}` | `write:products` | yes | Update title/price/variants/media on the seller's own listing. |
| `DELETE /api/v1/products/{id}` | `write:products` | yes | Soft-delete (archive) the seller's own listing. |
| `GET /api/v1/orders` | `read:orders` | — | List orders containing the seller's items (cursor-based; filter by status/date). |
| `GET /api/v1/orders/{id}` | `read:orders` | — | Read one order, with only this seller's line items visible. |
| `POST /api/v1/orders/{id}/fulfillments` | `write:order_fulfillment` | yes | Mark the seller's items shipped (carrier, tracking ref); transitions order item state. |
| `GET /api/v1/inventory` | `read:inventory` | — | Read stock levels for the seller's variants. |
| `PATCH /api/v1/inventory` | `write:inventory` | yes | Adjust stock levels for the seller's variants (delta or absolute). |
| `POST /api/v1/webhooks/subscriptions` | `write:products` (or a dedicated `manage:webhooks`) | yes | Subscribe to seller webhook events (S4). |
| `GET /api/v1/webhooks/subscriptions` | `read:profile` | — | List active subscriptions. |
| `DELETE /api/v1/webhooks/subscriptions/{id}` | `manage:webhooks` | yes | Unsubscribe. |

All list endpoints return a stable envelope: `{ data: [...], page: { cursor: string | null, has_more: boolean } }`. Pricing/amount fields are integer minor units (kobo/cents) — never floats — consistent with the money-truth invariant. Order line items show **only this seller's lines**; buyer PII is minimized to what fulfillment requires (name + shipping address for shipped/paid orders only).

### S2 — Scopes

Add (additive migration `apps/marketplace/supabase/migrations/<ts>_seller_api_scopes.sql`, inserting into `api_scopes`): `write:order_fulfillment`, `write:inventory`, `manage:webhooks` (category `seller`). `read:products`, `write:products`, `read:orders`, `read:inventory`, `read:profile` already exist from V3-76. Each scope is independent and deny-by-default.

### S3 — OpenAPI schema

`docs/api/openapi/seller.v1.yaml` — a complete OpenAPI 3.1 description of every S1 endpoint: request/response schemas, scopes (security scheme = bearer API key), error envelope (`$ref` the shared V3-76 error component), pagination, and example payloads. This file is the contract V3-83 (developer docs) renders and the integration tests assert against.

### S4 — Webhook events + subscription model

Seller webhook events delivered to the subscriber's HTTPS callback URL:
- `order.created`, `order.cancelled`, `payment.received`, `dispute.created`, `return.requested`.

Persist subscriptions in `marketplace_webhook_subscriptions` (new table: `id`, `store_id`, `api_key_id`, `target_url`, `events text[]`, `secret_hash`, `status`, timestamps; RLS deny-by-default, seller-scoped). **Outbound delivery itself is V3-81** — this pass records subscriptions and emits the events onto the outbox the V3-81 worker drains; until V3-81 ships, deliver via the existing notification outbox pattern as an interim, documented in the report. Every callback payload is **HMAC-signed** with the subscription secret (header `X-Henry-Signature`) and carries a unique `event_id` so the receiver can dedupe — mirroring the `account_webhook_receipts` shape (`event_id unique`, `signature_valid`, `payload_hash`). Buyer addresses are minimized in payloads (S6 redaction).

### S5 — Example clients

`docs/api/examples/seller-api/` in **three languages** — `typescript/`, `python/`, `ruby/`. Each demonstrates: authenticating with a key, listing products, creating a product with an `Idempotency-Key`, listing orders, posting a fulfillment, adjusting inventory, and verifying a webhook signature. Each is runnable against the sandbox environment and is exercised by the S-integration test (S-gate 3).

### S6 — Telemetry

Via `@henryco/observability`, added to `HenryEventName`:
- `henry.api.seller.products.read`
- `henry.api.seller.product.created`
- `henry.api.seller.order.shipped`
- `henry.api.seller.inventory.adjusted`
- `henry.api.seller.webhook.subscribed`

The gateway already emits `henry.api.call` per request; these are the seller-domain business events.

## Out of scope

- API foundation, key model, gateway, rate limiting, versioning (V3-76).
- The webhook **delivery worker** (retries, backoff, dead-letter) — V3-81 (this pass only records subscriptions + emits events).
- Developer docs portal + sandbox UI (V3-83; this pass produces the OpenAPI spec it consumes).
- Analytics/data exports (V3-82).
- Any payout or refund **write** — money movement is never exposed via this API (Phase C owns it).
- Logistics (V3-78) and booking (V3-79) endpoints.

## Dependencies

**Upstream:** V3-76 (gateway, scopes, versioning, key UI), V3-71 (seller business suite — the first-party operations this API mirrors). **This pass BLOCKS:** V3-83 (developer docs render `seller.v1.yaml`).

## Inheritance

- `@henryco/api-gateway` — `withApiGateway`, `ApiContext`, scope enforcement, idempotency, error envelope, `api_call_log`.
- Marketplace schema — `marketplace_products`, `marketplace_orders`, `marketplace_order_items` (`vendor_id`), `marketplace_stores`/`marketplace_sellers`, `marketplace_product_variants`, `marketplace_role_memberships`.
- `account_webhook_receipts` shape — for the signed-callback verification pattern.
- `@henryco/observability` — telemetry + audit log.

## Implementation requirements

### Files
- `apps/marketplace/app/api/v1/products/route.ts`, `products/[id]/route.ts`, `orders/route.ts`, `orders/[id]/route.ts`, `orders/[id]/fulfillments/route.ts`, `inventory/route.ts`, `webhooks/subscriptions/route.ts`, `webhooks/subscriptions/[id]/route.ts`.
- `apps/marketplace/supabase/migrations/<ts>_seller_api_scopes.sql` (S2) and `<ts>_marketplace_webhook_subscriptions.sql` (S4).
- `docs/api/openapi/seller.v1.yaml` (S3).
- `docs/api/examples/seller-api/{typescript,python,ruby}/` (S5).
- `packages/observability/src/events.ts` — extend `HenryEventName` (S6).

### Trust / safety / compliance
- **Seller isolation:** every query constrained to the authenticated seller's `vendor_id`/`store_id` via `marketplace_role_memberships` — a key can never read or write another store's products, orders, or inventory.
- **Scopes** enforced at the gateway per route; deny-by-default.
- **Idempotency** mandatory on every write (`POST`/`PATCH`/`DELETE`) via `Idempotency-Key` (gateway-enforced).
- **Webhooks** HMAC-signed; `event_id` for dedupe; subscription secrets stored hashed only.
- **ANTI-CLONE Principle 2:** never return proprietary ranking, recommendation signals, internal scoring, or other sellers'/buyers' private data. Order responses minimize buyer PII to fulfillment necessity.
- **Money:** amounts in integer minor units; the API exposes no payout/refund/charge write — read-only order/payment context only.
- **Audit:** gateway logs every call to `api_call_log`; product/inventory writes also recorded via `@henryco/observability/audit-log`.

### Mobile + desktop parity
N/A — this is a headless machine API with no rendered UI. (The seller-facing UI is V3-71.)

### i18n
The API surface is machine-to-machine: response bodies carry stable enum codes (e.g. `status: "pending_review"`), not localized prose. Human-facing error `message` strings are operator/developer text, English-only, exempted in `packages/i18n/exempt.json` with rationale (API protocol, not rendered UI). No new translatable UI namespace.

### Brand & design system
No UI is rendered. OpenAPI `info.title`/`description`, example-client comments, and any docs prose name the company as **Henry Onyx** and the legal entity (in any receipt/order context shown) as **Henry Onyx Limited**, sourced from `@henryco/config` where code-resident. The API host in examples and the spec `servers` block comes from `getApiUrl` / the documented host helper — never the `henrycogroup.com` literal.

## Validation gates
1. **CI:** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` green.
2. **OpenAPI:** `seller.v1.yaml` validates against OpenAPI 3.1 (CI lint step); every S1 endpoint present; error component `$ref`s the V3-76 shared schema.
3. **Integration tests** (~15 cases): each of the three example clients drives every endpoint against the sandbox successfully — create/read/update/delete product, list/read order, post fulfillment, adjust inventory, subscribe + verify webhook signature.
4. **Scope enforcement:** a key without `write:products` gets 403 on create/update/delete; a key without `read:orders` gets 403 on order reads.
5. **Isolation:** seller A's key cannot read or mutate seller B's products/orders/inventory (negative tests).
6. **Idempotency:** replaying a `POST /products` with the same `Idempotency-Key` returns the original resource, not a duplicate.
7. **RLS:** `marketplace_webhook_subscriptions` deny-by-default + seller-scoped; advisor shows no new RLS-disabled/unindexed-FK warnings.

## Deployment gate
All gates green. Ship to the **sandbox** environment first; require **one real partner integration** end-to-end (create → fulfil an order → receive a verified webhook) before promoting `live` scopes. No force-push; branch `v3/77-platform-seller-api` → PR → CI green → squash-merge.

## Final report contract
`.codex-temp/v3-77-platform-seller-api/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification (sandbox + partner integration) · telemetry baseline · deferred items (interim outbox delivery until V3-81; `manage:webhooks` scope adoption) · pass-closure assertion.

## Self-verification
- [ ] S1 all endpoints mounted via `withApiGateway`, seller-scoped, with cursor pagination + minor-unit amounts.
- [ ] S2 seller scopes seeded additively; deny-by-default; no implicit grants.
- [ ] S3 `seller.v1.yaml` validates as OpenAPI 3.1 and covers every endpoint.
- [ ] S4 webhook subscriptions persisted + HMAC-signed + `event_id` dedupe; delivery deferred to V3-81 with documented interim.
- [ ] S5 TypeScript + Python + Ruby example clients run green against sandbox.
- [ ] S6 five seller telemetry events emit via `@henryco/observability` and added to `HenryEventName`.
- [ ] Seller isolation proven by negative tests; idempotency proven on writes.
- [ ] ANTI-CLONE Principle 2 honored: no scoring/ranking/cross-party data; buyer PII minimized.
- [ ] No money-moving write exposed; amounts in integer minor units.
- [ ] Brand strings from `@henryco/config` (Henry Onyx / Henry Onyx Limited); no hardcoded host; protocol strings exempted in i18n.
- [ ] Report written; hand-off to V3-83 stated.
