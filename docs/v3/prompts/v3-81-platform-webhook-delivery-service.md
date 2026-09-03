# V3-81 — Platform/API: Webhook Delivery Service

**Pass ID:** V3-81  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P11 (Platform & API Layer)
**Dependencies:** V3-76  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Platform/API engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the one shared, versioned, signed, retryable, observable webhook-delivery service that every public API surface (V3-77 seller, V3-78 logistics, V3-79 booking, V3-80 business-account) emits through — so no per-API pass re-implements signing, retry, dead-lettering, or a delivery log. The line it must not cross: this is delivery infrastructure only — it defines NO domain event semantics (each API pass owns its own event types) and it NEVER sends a payload to an unverified destination or with an unsigned body.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/81-platform-webhook-delivery-service` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Today there is no outbound-webhook capability anywhere in the platform: divisions emit internal canonical events via `@henryco/observability/events` (`henry.<domain>.<noun>.<verb>`, a compile-checked union in `packages/observability/src/events.ts`), and the workflow/outbox patterns are scattered across cron handlers. V3-76 lands the public-API substrate (`api_keys`, `api_scopes`, `packages/api-gateway`, `api_call_log`, partner key-management UI). V3-43 generalises cron + outbox + retry + idempotency into a reusable workflow engine — this pass reuses that retry/outbox machinery rather than building a second one. The per-API passes (V3-77..V3-80) each declare domain event types (`order.created`, `quote.requested`, `booking.cancelled`, etc.) but have no transport to deliver them externally.

The gap V3-81 closes: a single delivery service that partners subscribe to (per-subscription destination URL + secret + event-type filter), that delivers HMAC-SHA256-signed, versioned payloads with bounded exponential-backoff retry, dead-letters after exhaustion, exposes a partner-visible per-event delivery log, and provides a verifier endpoint so partners can prove receipt during setup. It is a transport: producers publish a typed envelope; this service fans it out to matching subscriptions, signs it, delivers it, retries it, and records every attempt.

## Mandatory scope

### S1 — Subscription model
```sql
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners,
  api_key_id UUID REFERENCES api_keys,          -- the key that owns this subscription
  url TEXT NOT NULL,                             -- HTTPS only; validated on create
  secret_hash TEXT NOT NULL,                     -- SHA-256 of the signing secret; plaintext shown ONCE
  event_types TEXT[] NOT NULL DEFAULT '{}',      -- e.g. {'order.created','order.cancelled'}
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','revoked')),
  api_version TEXT NOT NULL DEFAULT 'v1',
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES webhook_subscriptions ON DELETE CASCADE,
  event_id UUID NOT NULL,                        -- stable id of the source event (idempotency anchor)
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 8,
  next_attempt_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','delivering','delivered','failed','dead_lettered')),
  last_status_code INTEGER,
  last_error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, event_id)             -- one delivery row per (subscription, source event)
);
```
RLS: a partner reads only their own subscriptions and deliveries (`partner_id` scoped through `api_keys`); the delivery worker uses the service role. `url` must be `https://`, must not resolve to a private/loopback range (SSRF guard), and is re-validated on every PATCH.

### S2 — Publish API (producer-facing, internal)
```ts
// packages/webhooks/src/publish.ts
export interface WebhookEnvelope<T = unknown> {
  eventId: string;        // caller-stable UUID; the dedup anchor — same id never delivered twice per subscription
  eventType: string;      // 'order.created' etc. — declared by the owning API pass, not by this pass
  apiVersion: 'v1';
  occurredAt: string;     // ISO-8601
  data: T;                // domain payload — the producing pass owns its shape
}

/** Fan out an event to every active subscription whose event_types matches. Inserts one
 *  webhook_deliveries row per matching subscription (idempotent on (subscription_id, eventId)).
 *  Returns the count enqueued. Producers call this from their route handlers / workflow steps. */
export async function publishWebhook<T>(envelope: WebhookEnvelope<T>): Promise<{ enqueued: number }>;
```
`publishWebhook` is the only entry point producers use. It matches `event_types` (exact, no wildcards in v1), inserts `pending` delivery rows under the `(subscription_id, event_id)` unique constraint (so a producer that publishes the same event twice never double-delivers), and returns immediately. It does NOT deliver synchronously.

### S3 — Delivery worker (signing + retry + dead-letter)
A cron-driven drain (reusing the V3-43 workflow-engine outbox/retry primitives; until V3-43 is on `main`, a self-contained Vercel cron at `apps/account/app/api/cron/webhook-delivery/route.ts` with the same retry contract) that:
- Claims due `pending`/`failed` rows (`next_attempt_at <= now()`), marks `delivering`.
- Signs the body: `X-HenryCo-Signature: t=<unix>,v1=<hex HMAC-SHA256(secret, "<t>.<rawBody>")>` (Stripe-style signed-timestamp scheme to defeat replay), plus `X-HenryCo-Event-Type`, `X-HenryCo-Event-Id`, `X-HenryCo-Delivery-Id`, `X-HenryCo-Api-Version`, `User-Agent: HenryCo-Webhooks/1`.
- POSTs with a hard timeout (10s); 2xx → `delivered` + `delivered_at`; non-2xx/timeout → increment `attempt_count`, set `next_attempt_at` by exponential backoff (8 attempts over ~24h: ~1m, 5m, 15m, 1h, 3h, 6h, 12h, 24h with ±jitter), status `failed`.
- After `attempt_count >= max_attempts` → `dead_lettered` (terminal; surfaced to the partner, never silently dropped).
- The signing secret is read from a server-only store keyed by `subscription_id`; the DB holds only `secret_hash`. Never log the secret or the signature material (redact via `@henryco/observability/redaction`).

### S4 — Observable delivery log + management API
Partner-facing endpoints under `apps/account/app/api/v1/webhooks/` (gateway-wrapped, scope `webhooks:manage` for writes, `webhooks:read` for reads):
- `POST /api/v1/webhooks/subscriptions` (create; secret returned ONCE), `GET` (list), `PATCH /{id}` (pause/resume/update url+event_types — re-validates url), `DELETE /{id}` (revoke).
- `GET /api/v1/webhooks/deliveries?subscription_id=&status=&cursor=` — paginated per-event delivery log (status, attempt_count, last_status_code, last_error, timestamps). This is the "observable" requirement: every event's delivery state is queryable.
- `POST /api/v1/webhooks/deliveries/{id}/redeliver` — manual replay of a `failed`/`dead_lettered` delivery (re-enqueues a fresh attempt; audited).
Plus the partner-facing UI tab inside the V3-76 key-management page (`apps/account/app/(account)/api-keys/webhooks/page.tsx`) listing subscriptions + recent deliveries + a redeliver button.

### S5 — Verifier endpoint (setup confidence)
`POST /api/v1/webhooks/subscriptions/{id}/test` — sends a synthetic `webhook.ping` envelope to the subscription URL using the real signing path, and returns the destination's status code + round-trip latency so a partner can confirm receipt + signature verification BEFORE relying on real events. Rate-limited per subscription. The `webhook.ping` event is the one event type this pass owns (it is transport-level, not a domain event).

### S6 — Telemetry
Add to the `HenryEventName` union in `packages/observability/src/events.ts` + `docs/event-taxonomy.md`:
- `henry.webhook.subscription.created`
- `henry.webhook.subscription.revoked`
- `henry.webhook.delivery.attempted`
- `henry.webhook.delivery.delivered`
- `henry.webhook.delivery.failed`
- `henry.webhook.delivery.dead_lettered`
- `henry.webhook.delivery.redelivered`

Each delivery attempt emits `attempted`; the terminal outcome emits `delivered`/`failed`/`dead_lettered` with a redacted payload (subscription id, event type, attempt count, status code — never the body, never the secret). `dead_lettered` additionally writes an audit row so operators and the partner have a durable record.

## Out of scope
- API gateway, `api_keys`/`api_scopes`, rate limiter, key-management page shell — V3-76 (this pass adds a tab + two scopes).
- Domain event **types** and their payload shapes — each owning API pass (V3-77 `order.*`, V3-78 quote/shipment, V3-79 booking, V3-80 business). This pass owns only `webhook.ping`.
- Internal canonical telemetry events (`henry.*` analytics) — `@henryco/observability/events`; distinct from outbound partner webhooks.
- The generalized cron/outbox/retry engine — V3-43 (this pass reuses it; if not yet merged, ships an equivalent-contract cron to be folded back into V3-43 later).
- Developer docs for webhooks (guide page) — V3-83 (this pass ships the OpenAPI fragment it consumes).

## Dependencies
**Depends on:** V3-76 (gateway, scopes table, key-management UI host, error envelope, `partners`/`api_keys`). **Soft-reuses:** V3-43 workflow engine retry/outbox primitives. **Blocks:** every API pass that wants to deliver events externally — V3-77/78/79/80 call `publishWebhook`; V3-83 docs consume this pass's OpenAPI fragment + webhook guide inputs.

## Inheritance
- `packages/api-gateway` (`withApiGateway`, scope-map, error envelope, `api_call_log`) — V3-76.
- V3-43 workflow engine (outbox + retry + idempotency) where merged.
- `@henryco/observability` — `emitEvent` + `HenryEventName`, `writeAuditLog`, `createRedactor` (secret/payload redaction).
- `@henryco/config` — `henrySubdomain`/`henryDomain` for any URL; the SSRF allow/deny logic reuses the trusted-host helpers' patterns conceptually (subscription URLs are partner-owned external hosts, so this is a deny-private-ranges guard, not a trusted-host allowlist).

## Implementation requirements
### Files
- `packages/webhooks/src/` — `publish.ts` (S2), `sign.ts` (HMAC + timestamp scheme), `deliver.ts` (worker S3), `ssrf-guard.ts`, `index.ts`.
- `apps/account/app/api/v1/webhooks/subscriptions/route.ts` + `[id]/route.ts` + `[id]/test/route.ts`.
- `apps/account/app/api/v1/webhooks/deliveries/route.ts` + `[id]/redeliver/route.ts`.
- `apps/account/app/api/cron/webhook-delivery/route.ts` (drain) + `vercel.json` cron entry.
- `apps/account/app/(account)/api-keys/webhooks/page.tsx` (management tab).
- `supabase/migrations/<ts>_v3_81_webhook_delivery.sql` (S1 tables + RLS + 2 scope seeds).
- `packages/observability/src/events.ts` (7 events) + `docs/event-taxonomy.md`.
- `docs/api/openapi/webhooks.yaml` + `docs/api/examples/webhooks/{typescript,python,ruby}/` (verify-signature snippet in each language).

### Trust / safety / compliance
- **HMAC-SHA256 signing mandatory** on every delivery + verifier ping; signed-timestamp scheme defeats replay; partners verify `v1` against `"<t>.<rawBody>"`.
- **SSRF guard:** subscription URL must be HTTPS and must not resolve to private/loopback/link-local/metadata ranges; re-validated on every create/PATCH and immediately before each delivery.
- Signing secret stored hashed in DB; plaintext shown once at creation; never logged.
- Idempotent delivery via `(subscription_id, event_id)` unique constraint — a source event is delivered at most once per subscription regardless of producer retries.
- Dead-letter is terminal + surfaced + audited — events are never silently dropped.
- Per-subscription rate limit on the verifier endpoint; gateway rate limits on management endpoints.
- Redact secret + payload body from all logs/telemetry via `@henryco/observability/redaction`.

### Mobile + desktop parity
The webhook management tab inherits the V3-76 account-app chrome and is responsive (mobile + desktop) using design-system tokens (`--site-*`/`--accent`, Fraunces for headings per the public/editorial recipe, system-sans body); light + dark; CLS≈0; `pnpm a11y:contrast` not regressed. The delivery transport itself is headless (N/A). Expo super-app: no native surface; the management tab is web-only in this pass.

### i18n
The webhook management UI uses `@henryco/i18n` namespace `surface:webhooks` — every label, status (`active`/`paused`/`revoked`/`delivered`/`failed`/`dead_lettered`), button, and error message is translated; zero hardcoded strings. API response bodies and `event_type`/error `code` tokens are machine-facing English-by-contract and exempted in `packages/i18n/exempt.json` with a pointer to this pass.

### Brand & design system
The management tab renders the Henry Onyx brand strictly via `@henryco/config` (division/group labels), Fraunces + locked tokens, never hardcoded brand strings and never the retired "Henry & Co." The signature header prefix `X-HenryCo-*` and `User-Agent: HenryCo-Webhooks/1` correctly use the **code shorthand** "HenryCo" (machine-facing wire identifiers, invisible to end users — unchanged per the brand rule). Zero hardcoded domains anywhere: internal URLs via `henrySubdomain`/`henryDomain`; partner destination URLs are external and partner-owned (SSRF-guarded, not brand-controlled).

## Validation gates
1. **CI:** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` green.
2. **Signature verification test** (~4): the documented verify snippet (each of TS/Python/Ruby) validates a real signed body; a tampered body and an expired timestamp both fail verification.
3. **Delivery + retry smoke** (~6): a 2xx destination → `delivered`; a flaky destination (5xx then 2xx) → retried then `delivered` with `attempt_count` advanced on the documented schedule.
4. **Dead-letter test:** a permanently-failing destination exhausts `max_attempts` → `dead_lettered`, one audit row, one `henry.webhook.delivery.dead_lettered` event, surfaced in the delivery log.
5. **Idempotency test:** publishing the same `eventId` twice to one subscription creates exactly one delivery row and at most one successful POST.
6. **SSRF test:** subscription create/PATCH rejects `http://`, loopback, private, and metadata-IP URLs.
7. **RLS test:** partner A cannot read partner B's subscriptions or deliveries.
8. **Verifier test:** `POST .../test` delivers a signed `webhook.ping` and returns the destination status + latency; rate limit enforced.
9. **UI gates** for the management tab: real-browser light + dark, mobile + desktop, CLS≈0, contrast not regressed, all copy from `surface:webhooks`.
10. **OpenAPI validity:** `webhooks.yaml` passes a 3.1 linter; the 3 example clients run green against the sandbox.

## Deployment gate
All gates green; V3-76 merged to `main` (hard dep). Cron drain proven on the sandbox against live destinations (including a deliberately-failing one to exercise dead-lettering). **14-day soak** on the sandbox before partner subscriptions are enabled in production — webhook reliability is judged over time, not at a point. No owner sign-off required (no D-gate).

## Final report contract
`.codex-temp/v3-81-platform-webhook-delivery-service/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] `webhook_subscriptions` + `webhook_deliveries` shipped with RLS, HTTPS+SSRF-validated URLs, hashed secrets (S1).
- [ ] `publishWebhook` is the single producer entry point; idempotent on `(subscription_id, event_id)` (S2).
- [ ] Worker signs every body (HMAC-SHA256 signed-timestamp), retries on the documented 8-attempt/~24h backoff, dead-letters terminally (S3).
- [ ] Partner-observable delivery log + management endpoints + redeliver + management UI tab shipped (S4).
- [ ] Verifier `webhook.ping` endpoint proves receipt + signature before real events flow (S5).
- [ ] 7 new `henry.webhook.*` telemetry events in the typed union + taxonomy; dead-letter audited (S6).
- [ ] Secret + payload redacted from all logs; secret shown once; never logged.
- [ ] Management UI: Henry Onyx brand via `@henryco/config`, `surface:webhooks` i18n, locked tokens, light+dark, mobile+desktop, CLS≈0, contrast intact; zero hardcoded domains/strings.
- [ ] OpenAPI 3.1 fragment + TS/Python/Ruby verify-signature examples shipped and green.
- [ ] Report written at the path above.
