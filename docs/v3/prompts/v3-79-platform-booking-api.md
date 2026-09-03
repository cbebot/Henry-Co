# V3-79 — Platform/API: Booking API

**Pass ID:** V3-79  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P11 (Platform & API Layer)
**Dependencies:** V3-76 (public API foundation), V3-51 (smart booking)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Booking API engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the **public Booking API**: scope-gated, versioned, OpenAPI-described endpoints that let an authorized partner list bookable services, search available slots, create a booking, read it, cancel it, and subscribe to booking webhooks — all through `@henryco/api-gateway` (V3-76), on top of the V3-51 smart-booking engine. The line you must not cross: a booking key operates **only on the partner's own services and bookings**, the API never moves money or exposes provider/customer PII beyond operational necessity, slot search reflects real availability without leaking provider scheduling internals, and every booking write is idempotent and scope-checked at the gateway.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/79-platform-booking-api` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The booking domain is real and lives largely in Henry Onyx Fabric Care. Tables (from `apps/care/supabase/migrations/`): `care_service_categories`, `care_service_packages`, `care_service_addons`, `care_bookings`, `care_booking_garments`, `care_recurring_schedules`, `care_payment_requests`, `care_pod_records`, `care_price_rules`, `care_reviews`, plus the broader `bookings` surface. The care web app and (when shipped) the V3-51 smart-booking engine (slot picker, provider matching, recurring bookings, cancellation policy per service) own these through first-party cookie-session routes. V3-51 is the canonical source of truth for slot availability and provider matching — this API is a thin, scope-gated façade over it.

V3-76 shipped `@henryco/api-gateway` (`withApiGateway`), the key/scope/call-log/idempotency schema, the `/api/v1/` versioning scheme, the partner key-management UI, and the signed-callback shape (`account_webhook_receipts`).

The gap this pass closes: there is **no machine interface** to book a service. External aggregators, business suites, and concierge tools must today use a logged-in browser session. This pass exposes services → slots → bookings → cancel + webhooks as a stable, versioned, scope-gated public API.

## Mandatory scope

### S1 — Endpoints (all under `/api/v1`, all wrapped in `withApiGateway`)

Mount in `apps/care/app/api/v1/` (the care app owns the booking schema; V3-51 provides the availability/matching engine the handlers call). Every handler resolves the partner from `ApiContext.partnerId` → the services that partner is authorized to book against, and constrains all reads/writes accordingly.

| Method + path | Scope | Mutating | Behavior |
|---|---|---|---|
| `GET /api/v1/services` | `booking:read` | — | List bookable services (from `care_service_categories`/`care_service_packages`) the partner may transact: id, name code, duration, base price (minor units), cancellation policy ref. |
| `GET /api/v1/services/{id}/slots?date=YYYY-MM-DD&tz=...` | `booking:read` | — | Available slots for a service on a date, computed by the V3-51 availability engine; returns slot windows + capacity, never provider identity or raw calendar internals. |
| `POST /api/v1/bookings` | `booking:write` | yes | Create a booking for a `service_id` + slot + customer ref; persist `care_bookings`; return booking id + status + (if applicable) a payment-request reference. |
| `GET /api/v1/bookings` | `booking:read` | — | List the partner's bookings (cursor-based; filter status/date). |
| `GET /api/v1/bookings/{id}` | `booking:read` | — | Read one booking (status, slot, service, cancellation eligibility). |
| `POST /api/v1/bookings/{id}/cancel` | `booking:cancel` | yes | Cancel per the service's cancellation policy; transition status; return policy outcome (fee window, refund eligibility — read-only, never a money write). |
| `POST /api/v1/webhooks/subscriptions` | `booking:write` (or `manage:webhooks`) | yes | Subscribe to `booking.*` events (S4). |
| `GET /api/v1/webhooks/subscriptions` | `booking:read` | — | List subscriptions. |
| `DELETE /api/v1/webhooks/subscriptions/{id}` | `manage:webhooks` | yes | Unsubscribe. |

List endpoints return `{ data: [...], page: { cursor, has_more } }`. Amounts are integer minor units. Slot search returns only bookable windows + capacity — never provider names, schedules, or internal matching scores. Creating a booking does **not** charge — it returns a `payment_request_ref` the partner settles through the existing first-party/payment path; the API never moves money.

### S2 — Scopes

Add (additive migration `apps/care/supabase/migrations/<ts>_booking_api_scopes.sql`, inserting into `api_scopes`, category `booking`): `booking:read`, `booking:write`, `booking:cancel`, and `manage:webhooks` if not already seeded by a sibling. Each independent and deny-by-default.

### S3 — OpenAPI schema

`docs/api/openapi/booking.v1.yaml` — complete OpenAPI 3.1: every S1 endpoint, request/response schemas, bearer-API-key security, the shared V3-76 error component (`$ref`), pagination, slot-query parameters, cancellation-policy outcome shape, and example payloads. This is the contract V3-83 renders and the integration tests assert against.

### S4 — Webhook events

Booking events delivered to the subscriber's HTTPS callback:
- `booking.created`, `booking.confirmed`, `booking.rescheduled`, `booking.cancelled`, `booking.completed`, `booking.no_show`.

Persist subscriptions in `care_webhook_subscriptions` (new: `id`, `partner_id`, `api_key_id`, `target_url`, `events text[]`, `secret_hash`, `status`, timestamps; RLS deny-by-default, partner-scoped). Every callback is **HMAC-signed** (`X-Henry-Signature`) with a unique `event_id` for receiver dedupe — mirroring `account_webhook_receipts`. **Outbound delivery is V3-81**; until it ships, emit onto the existing care notification/outbox path as a documented interim. Booking state transitions fire the corresponding events so the API and webhook stream stay consistent.

### S5 — Example clients

`docs/api/examples/booking-api/` in **TypeScript** and **Python** — each demonstrates: authenticate, list services, search slots for a date, create a booking with an `Idempotency-Key`, read it, cancel it, and verify a webhook signature. Both runnable against sandbox and exercised by the integration test (S-gate 3).

### S6 — Telemetry

Via `@henryco/observability`, added to `HenryEventName`:
- `henry.api.booking.slot_searched`
- `henry.api.booking.created`
- `henry.api.booking.cancelled`
- `henry.api.booking.webhook.subscribed`

The gateway already emits `henry.api.call`; these are booking-domain business events.

## Out of scope

- API foundation, gateway, key model, rate limiting, versioning (V3-76).
- Slot computation, provider matching, recurring-booking logic, cancellation-policy authoring — owned by V3-51; this API **calls** the engine, never reimplements it.
- The webhook **delivery worker** (V3-81; this pass records subscriptions + emits events).
- Developer docs portal (V3-83; this pass produces the OpenAPI spec).
- Any payment/refund write — money movement is never exposed (Phase C owns it; bookings return a `payment_request_ref` only).

## Dependencies

**Upstream:** V3-76 (gateway, scopes, versioning, signed-callback shape), V3-51 (smart-booking engine — slot availability, provider matching, cancellation policy). **This pass BLOCKS:** V3-83 (developer docs render `booking.v1.yaml`).

## Inheritance

- `@henryco/api-gateway` — `withApiGateway`, `ApiContext`, scope enforcement, idempotency, error envelope, `api_call_log`.
- V3-51 smart-booking engine — slot availability + provider matching + per-service cancellation policy (the handlers call these, never duplicate them).
- Booking schema — `care_service_categories`, `care_service_packages`, `care_bookings`, `care_recurring_schedules`, `care_payment_requests`.
- `account_webhook_receipts` shape — signed-callback verification pattern.
- `@henryco/observability` — telemetry + audit log.

## Implementation requirements

### Files
- `apps/care/app/api/v1/services/route.ts`, `services/[id]/slots/route.ts`, `bookings/route.ts`, `bookings/[id]/route.ts`, `bookings/[id]/cancel/route.ts`, `webhooks/subscriptions/route.ts`, `webhooks/subscriptions/[id]/route.ts`.
- `apps/care/supabase/migrations/<ts>_booking_api_scopes.sql` (S2) and `<ts>_care_webhook_subscriptions.sql` (S4).
- `docs/api/openapi/booking.v1.yaml` (S3).
- `docs/api/examples/booking-api/{typescript,python}/` (S5).
- `packages/observability/src/events.ts` — extend `HenryEventName` (S6).

### Trust / safety / compliance
- **Partner isolation:** every read/write constrained to the authenticated partner's services and bookings — a key never sees another partner's bookings, customers, or slot internals.
- **Slot privacy:** slot search returns bookable windows + capacity only — never provider identity, raw calendars, or matching scores (ANTI-CLONE Principle 2).
- **Customer/provider PII** minimized to operational necessity; sensitive booking actions honor the V3-02 sensitive-action posture where a session is involved (the API path uses key auth, but cancellation/refund-affecting actions are audit-logged).
- **Scopes** enforced at the gateway per route; deny-by-default.
- **Idempotency** mandatory on `bookings` create, `cancel`, and subscription writes via `Idempotency-Key`.
- **Webhooks** HMAC-signed; `event_id` dedupe; secrets stored hashed only.
- **Money:** booking creation never charges — returns a `payment_request_ref`; amounts are integer minor units; no payment/refund write exposed.
- **Audit:** gateway logs every call to `api_call_log`; booking create/cancel also recorded via `@henryco/observability/audit-log`.

### Mobile + desktop parity
N/A — headless machine API with no rendered UI. (The booking UI is V3-51 / the care app.)

### i18n
Machine-to-machine: response bodies carry stable enum status codes (`confirmed`, `cancelled`, `no_show`, …), not localized prose. Human-facing error `message` strings are operator/developer text, English-only, exempted in `packages/i18n/exempt.json` with rationale. No new translatable UI namespace.

### Brand & design system
No UI rendered. OpenAPI `info`, example-client comments, and docs prose name the company **Henry Onyx** (division **Henry Onyx Fabric Care**; legal entity **Henry Onyx Limited** where a receipt/confirmation context appears), sourced from `@henryco/config` where code-resident. The spec `servers` block and example hosts come from `getApiUrl` / the documented host helper — never the `henrycogroup.com` literal.

## Validation gates
1. **CI:** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` green.
2. **OpenAPI:** `booking.v1.yaml` validates as OpenAPI 3.1; every S1 endpoint present; error component `$ref`s V3-76 shared schema.
3. **Integration tests** (~13 cases): both example clients drive the full flow against sandbox — list services → search slots → create → read → cancel + webhook-signature verification + double-book/idempotency.
4. **Scope enforcement:** a key without `booking:write` gets 403 on create; without `booking:cancel`, 403 on cancel; without `booking:read`, 403 on services/slots/read.
5. **Isolation:** partner A's key cannot read/cancel partner B's bookings (negative tests).
6. **Availability fidelity:** slot search results match the V3-51 engine's first-party availability for the same service/date (parity test); no provider PII or scores leak.
7. **RLS:** `care_webhook_subscriptions` deny-by-default + partner-scoped; advisor shows no new RLS-disabled/unindexed-FK warnings.

## Deployment gate
All gates green. Ship to **sandbox** first; require **one real partner integration** end-to-end (list → book → receive a verified `booking.confirmed` webhook) before promoting `live` scopes. No force-push; branch `v3/79-platform-booking-api` → PR → CI green → squash-merge.

## Final report contract
`.codex-temp/v3-79-platform-booking-api/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification (sandbox + partner integration) · telemetry baseline · deferred items (interim outbox delivery until V3-81; recurring-booking endpoints if deferred) · pass-closure assertion.

## Self-verification
- [ ] S1 all endpoints mounted via `withApiGateway`, partner-scoped, with cursor pagination + minor-unit amounts.
- [ ] S2 booking scopes seeded additively; deny-by-default.
- [ ] S3 `booking.v1.yaml` validates as OpenAPI 3.1 and covers every endpoint.
- [ ] S4 webhook subscriptions persisted + HMAC-signed + `event_id` dedupe; delivery deferred to V3-81 with documented interim.
- [ ] S5 TypeScript + Python example clients run green against sandbox.
- [ ] S6 four booking telemetry events emit via `@henryco/observability` and added to `HenryEventName`.
- [ ] Slot search reflects V3-51 availability with no provider PII/scores; booking creation never charges (returns `payment_request_ref`).
- [ ] Partner isolation proven by negative tests; idempotency proven on create/cancel.
- [ ] ANTI-CLONE Principle 2 honored; no money/refund write exposed; amounts in integer minor units.
- [ ] Brand strings from `@henryco/config` (Henry Onyx / Henry Onyx Fabric Care / Henry Onyx Limited); no hardcoded host; protocol strings exempted in i18n.
- [ ] Report written; hand-off to V3-83 stated.
