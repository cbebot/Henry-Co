# V3-78 — Platform/API: Logistics API

**Pass ID:** V3-78  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P11 (Platform & API Layer)
**Dependencies:** V3-76 (public API foundation), V3-74 (logistics business dashboard)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Logistics API engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the **public Logistics API**: scope-gated, versioned, OpenAPI-described endpoints that let an authorized business shipper get a quote, book a shipment, track it, submit/retrieve proof of delivery, and cancel — plus signed status-update callbacks — all through `@henryco/api-gateway` (V3-76). The line you must not cross: a logistics key operates **only on the partner's own shipments**, the API exposes no rider PII or internal routing/dispatch mechanics, customer addresses are redacted in webhooks to operational necessity, and every booking write is idempotent and scope-checked at the gateway.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/78-platform-logistics-api` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The logistics backend is real and substantial. Tables (from `apps/logistics/supabase/migrations/` and the hub logistics-customer-surface migration `apps/hub/supabase/migrations/20260405150000_logistics_customer_surface.sql`): `logistics_quotes`, `logistics_shipments`, `logistics_shipment_legs`, `logistics_tracking_points`, `logistics_pod_records` (proof of delivery), `logistics_claims`, `logistics_issues`, `logistics_addresses`, `logistics_rider_assignments`, `logistics_fleet_riders`, `logistics_fleet_vehicles`, `logistics_events`, `logistics_notifications`, `logistics_role_memberships`, `logistics_settings`. The logistics web app and the V3-74 business shipper dashboard (contracts, bulk shipments, B2B statements) already drive these through first-party cookie-session routes.

V3-76 shipped `@henryco/api-gateway` (`withApiGateway`), the key/scope/call-log/idempotency schema, the `/api/v1/` versioning scheme, the partner key-management UI, and the signed-inbound-callback shape (`account_webhook_receipts`: `event_id unique`, `signature_valid`, `payload_hash`).

The gap this pass closes: there is **no machine interface** to the logistics network. External marketplaces, ERPs, and fulfillment systems must today use a logged-in browser session. This pass exposes the quote→book→track→POD→cancel lifecycle as a stable, versioned, scope-gated public API with signed callbacks, so partners can automate shipping.

## Mandatory scope

### S1 — Endpoints (all under `/api/v1`, all wrapped in `withApiGateway`)

Mount in `apps/logistics/app/api/v1/`. Every handler resolves the shipper from `ApiContext.partnerId` → the partner's `logistics_role_memberships`, and constrains all reads/writes to that partner's shipments.

| Method + path | Scope | Mutating | Behavior |
|---|---|---|---|
| `POST /api/v1/quote` | `logistics:quote` | yes (idempotent) | Compute a quote from pickup/dropoff/parcel; persist a `logistics_quotes` row; return quote id + price (minor units) + service options + quote expiry. |
| `POST /api/v1/shipments` | `logistics:book` | yes | Book a shipment from a quote id (or inline parcel); create `logistics_shipments` + initial `logistics_shipment_legs`; return shipment id + tracking number + status. |
| `GET /api/v1/shipments` | `logistics:read` | — | List the partner's shipments (cursor-based; filter status/date). |
| `GET /api/v1/shipments/{id}` | `logistics:read` | — | Read one shipment (status, legs, current ETA). |
| `GET /api/v1/shipments/{id}/track` | `logistics:read` | — | Tracking timeline from `logistics_tracking_points` (status, coarse location label, timestamps). |
| `POST /api/v1/shipments/{id}/cancel` | `logistics:cancel` | yes | Cancel if cancellable; transition status; apply cancellation policy. |
| `GET /api/v1/shipments/{id}/pod` | `logistics:read` | — | Retrieve proof of delivery (signed-URL to image/signature + delivered-at) from `logistics_pod_records`. |
| `POST /api/v1/webhooks/subscriptions` | `logistics:book` (or `manage:webhooks`) | yes | Subscribe to shipment status events (S4). |
| `GET /api/v1/webhooks/subscriptions` | `logistics:read` | — | List subscriptions. |
| `DELETE /api/v1/webhooks/subscriptions/{id}` | `manage:webhooks` | yes | Unsubscribe. |

List endpoints return `{ data: [...], page: { cursor, has_more } }`. All amounts are integer minor units. Quotes carry an explicit `expires_at`; booking against an expired quote returns a `409 quote_expired` error envelope. POD media is delivered as a short-TTL signed URL (Supabase Storage), never a raw bucket path.

### S2 — Scopes

Add (additive migration `apps/logistics/supabase/migrations/<ts>_logistics_api_scopes.sql`, inserting into `api_scopes`, category `logistics`): `logistics:quote`, `logistics:book`, `logistics:read`, `logistics:cancel`, and `manage:webhooks` if not already seeded by a sibling. Each independent and deny-by-default.

### S3 — OpenAPI schema

`docs/api/openapi/logistics.v1.yaml` — complete OpenAPI 3.1: every S1 endpoint, request/response schemas, bearer-API-key security, the shared V3-76 error component (`$ref`), pagination, quote-expiry `409`, and example payloads. This is the contract V3-83 renders and the integration tests assert against.

### S4 — Webhook events + signed callbacks

Shipment status events delivered to the subscriber's HTTPS callback:
- `shipment.booked`, `shipment.picked_up`, `shipment.in_transit`, `shipment.out_for_delivery`, `shipment.delivered`, `shipment.cancelled`, `shipment.exception`.

Persist subscriptions in `logistics_webhook_subscriptions` (new: `id`, `partner_id`, `api_key_id`, `target_url`, `events text[]`, `secret_hash`, `status`, timestamps; RLS deny-by-default, partner-scoped). Every callback is **HMAC-signed** (`X-Henry-Signature`) with a unique `event_id` for receiver-side dedupe — mirroring `account_webhook_receipts`. **Outbound delivery is V3-81**; until it ships, emit onto the existing logistics notification/outbox path as a documented interim. Status-update events fire off `logistics_events` transitions so the API timeline and webhook stream stay consistent.

### S5 — Example clients

`docs/api/examples/logistics-api/` in **TypeScript** and **Python** — each demonstrates: authenticate, request a quote, book from the quote with an `Idempotency-Key`, poll tracking, retrieve POD, cancel, and verify a webhook signature. Both runnable against sandbox and exercised by the integration test (S-gate 3).

### S6 — Telemetry

Via `@henryco/observability`, added to `HenryEventName`:
- `henry.api.logistics.quoted`
- `henry.api.logistics.booked`
- `henry.api.logistics.tracked`
- `henry.api.logistics.cancelled`
- `henry.api.logistics.webhook.subscribed`

The gateway already emits `henry.api.call`; these are logistics-domain business events.

## Out of scope

- API foundation, gateway, key model, rate limiting, versioning (V3-76).
- The webhook **delivery worker** with retries/backoff/dead-letter (V3-81; this pass records subscriptions + emits events).
- Logistics business dashboard / contracts / B2B statements (V3-74).
- Internal rider mechanics: dispatch optimization, rider assignment logic, multi-rider routing, vehicle telematics — never exposed via the public API.
- Developer docs portal (V3-83; this pass produces the OpenAPI spec).
- Any payment write — money movement is not exposed via this API (Phase C owns settlement; quote price is read-only context).

## Dependencies

**Upstream:** V3-76 (gateway, scopes, versioning, signed-callback shape), V3-74 (business shipper dashboard — the first-party operations this API mirrors). **This pass BLOCKS:** V3-83 (developer docs render `logistics.v1.yaml`).

## Inheritance

- `@henryco/api-gateway` — `withApiGateway`, `ApiContext`, scope enforcement, idempotency, error envelope, `api_call_log`.
- Logistics schema — `logistics_quotes`, `logistics_shipments`, `logistics_shipment_legs`, `logistics_tracking_points`, `logistics_pod_records`, `logistics_events`, `logistics_role_memberships`, `logistics_addresses`.
- `account_webhook_receipts` shape — signed-callback verification pattern.
- `@henryco/observability` — telemetry + audit log.

## Implementation requirements

### Files
- `apps/logistics/app/api/v1/quote/route.ts`, `shipments/route.ts`, `shipments/[id]/route.ts`, `shipments/[id]/track/route.ts`, `shipments/[id]/cancel/route.ts`, `shipments/[id]/pod/route.ts`, `webhooks/subscriptions/route.ts`, `webhooks/subscriptions/[id]/route.ts`.
- `apps/logistics/supabase/migrations/<ts>_logistics_api_scopes.sql` (S2) and `<ts>_logistics_webhook_subscriptions.sql` (S4).
- `docs/api/openapi/logistics.v1.yaml` (S3).
- `docs/api/examples/logistics-api/{typescript,python}/` (S5).
- `packages/observability/src/events.ts` — extend `HenryEventName` (S6).

### Trust / safety / compliance
- **Partner isolation:** every read/write constrained to the authenticated partner's shipments via `logistics_role_memberships` — a key never sees another partner's shipments, quotes, or POD.
- **Address & PID redaction:** webhook payloads carry only operationally necessary pickup/dropoff detail; never full customer PII, never rider identity/phone. POD media returned only as short-TTL signed URLs.
- **No rider PII** ever crosses the public boundary (no `logistics_fleet_riders` data, no `logistics_rider_assignments`).
- **Scopes** enforced at the gateway per route; deny-by-default.
- **Idempotency** mandatory on `quote`, `shipments`, `cancel`, and subscription writes via `Idempotency-Key`.
- **Webhooks** HMAC-signed; `event_id` dedupe; secrets stored hashed only.
- **ANTI-CLONE Principle 2:** no proprietary routing/dispatch/pricing-model internals or third-party data exposed; quotes return a price, not the pricing formula.
- **Money:** amounts in integer minor units; no payment write exposed.
- **Audit:** gateway logs every call to `api_call_log`; booking/cancel also recorded via `@henryco/observability/audit-log`.

### Mobile + desktop parity
N/A — headless machine API with no rendered UI. (Customer-facing tracking UI is V3-64; business dashboard is V3-74.)

### i18n
Machine-to-machine: response bodies carry stable enum status codes (`in_transit`, `out_for_delivery`, …), not localized prose. Human-facing error `message` strings are operator/developer text, English-only, exempted in `packages/i18n/exempt.json` with rationale. No new translatable UI namespace.

### Brand & design system
No UI rendered. OpenAPI `info`, example-client comments, and docs prose name the company **Henry Onyx** (legal entity **Henry Onyx Limited** where a receipt/label context appears), sourced from `@henryco/config` where code-resident. The spec `servers` block and example hosts come from `getApiUrl` / the documented host helper — never the `henrycogroup.com` literal.

## Validation gates
1. **CI:** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` green.
2. **OpenAPI:** `logistics.v1.yaml` validates as OpenAPI 3.1; every S1 endpoint present; error component `$ref`s V3-76 shared schema.
3. **Integration tests** (~14 cases): both example clients drive the full lifecycle against sandbox — quote → book → track → POD → cancel + webhook-signature verification + quote-expiry 409.
4. **Scope enforcement:** a key without `logistics:book` gets 403 on booking; without `logistics:cancel`, 403 on cancel; without `logistics:read`, 403 on track/read.
5. **Isolation:** partner A's key cannot read/track/cancel partner B's shipments (negative tests).
6. **Redaction:** webhook payloads + track responses contain no rider PII and no full customer PII; POD only as signed URL.
7. **RLS:** `logistics_webhook_subscriptions` deny-by-default + partner-scoped; advisor shows no new RLS-disabled/unindexed-FK warnings.

## Deployment gate
All gates green. Ship to **sandbox** first; require **one real partner integration** end-to-end (quote → book → receive a verified `delivered` webhook) before promoting `live` scopes. No force-push; branch `v3/78-platform-logistics-api` → PR → CI green → squash-merge.

## Final report contract
`.codex-temp/v3-78-platform-logistics-api/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification (sandbox + partner integration) · telemetry baseline · deferred items (interim outbox delivery until V3-81) · pass-closure assertion.

## Self-verification
- [ ] S1 all endpoints mounted via `withApiGateway`, partner-scoped, with cursor pagination + minor-unit amounts + quote expiry.
- [ ] S2 logistics scopes seeded additively; deny-by-default.
- [ ] S3 `logistics.v1.yaml` validates as OpenAPI 3.1 and covers every endpoint.
- [ ] S4 webhook subscriptions persisted + HMAC-signed + `event_id` dedupe; delivery deferred to V3-81 with documented interim.
- [ ] S5 TypeScript + Python example clients run green against sandbox.
- [ ] S6 five logistics telemetry events emit via `@henryco/observability` and added to `HenryEventName`.
- [ ] Partner isolation proven by negative tests; idempotency proven on quote/book/cancel.
- [ ] No rider PII and no full customer PII in webhooks/track; POD only via signed URL.
- [ ] ANTI-CLONE Principle 2 honored: no routing/dispatch/pricing internals exposed; no money write.
- [ ] Brand strings from `@henryco/config` (Henry Onyx / Henry Onyx Limited); no hardcoded host; protocol strings exempted in i18n.
- [ ] Report written; hand-off to V3-83 stated.
