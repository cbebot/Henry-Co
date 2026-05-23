# V3-10 anti-patterns — observability hard stops

Owner-quality bar. These rules apply to every server-side and client-side change
under V3-10 and every downstream pass that builds on the observability baseline
(V3-43 workflow engine, V3-89 observability depth, payment passes V3-13 to V3-19).

Treat the list as code-review gates: if a diff violates any of these, the PR
does not land. The rules are codified here so V3-07/V3-09/V3-43/V3-89 reviewers
can reference one document instead of re-deriving the rationale per PR.

---

## A7.1 — Do not log credentials or tokens

**Never log:**

- session tokens (`access_token`, `refresh_token`, `session.access_token`,
  cookie values containing `sb-*`)
- authorization headers (`Authorization`, `Cookie`, `X-Api-Key`)
- the raw body of a `POST /auth/*` route, including signup/login bodies
- `service-role` keys, `SUPABASE_SERVICE_ROLE_KEY`, `DEEPL_AUTH_KEY`,
  payment provider secret keys

The default `@henryco/observability/redaction` redactor strips a known key list
on every emit, but redaction is a defence-in-depth, not a substitute for thinking
about what's in the payload. Build the structured log entry from named fields
(`{ userId, route, outcome }`), not by spreading the request body.

## A7.2 — Do not log full request bodies for payment or KYC routes

For payment-touching and KYC routes, redaction-by-key isn't enough — the bodies
contain free-form text that may include card numbers, dates of birth, or ID
numbers in unexpected fields. Restrict log payloads to:

- the route name + outcome
- the actor id (`user.id` — already a UUID, not PII by itself)
- a numeric size summary (`bodyByteLength`) instead of the body itself
- a non-PII slug of the operation (`kyc.verification.id`, not the document)

If you need to debug payment requests in development, use Sentry breadcrumbs
locally — they're scrubbed before transmission.

## A7.3 — Do not introduce a second logging library

`@henryco/observability/logger` is the only structured logger. No `pino`,
`winston`, `debug`, `consola`, `loglevel`, or `bunyan`. If you find yourself
wanting one of those, the gap should be filed against `@henryco/observability`
as a feature request, not patched in a single app.

The exception: one-time CLI scripts under `scripts/` may use `console.log`
because they don't ship to production.

## A7.4 — Do not silently swallow caught exceptions

Every `catch` block must do one of:

- log via `logger.warn` or `logger.error` and continue (degraded path)
- emit a typed event with `outcome: 'failed'` or `outcome: 'blocked'`
- re-throw (the boundary above will handle it)

A bare `catch {}` is an anti-pattern in server code. The only acceptable
"silent" catch is when wrapping a best-effort side effect (e.g. breadcrumb
emission) that is documented as best-effort in a code comment.

## A7.5 — Do not write to Sentry from client code without PII filtering active

The `buildClientSentryConfig()` builder enables `beforeSend` PII redaction by
default. Do not pass `{ beforeSend: undefined }` to disable it. Do not write
to Sentry via `Sentry.captureMessage()` with raw user input. The acceptable
client-side captures are:

- `Sentry.captureException(error, { tags, extra: { digest } })` from
  `app/error.tsx` (see V3-10 S7 + A8 reference at
  `apps/account/app/error.tsx`)
- `Sentry.addBreadcrumb(...)` from the events emitter (already handled by
  `emitEvent`)

If a new client-side capture is needed, the diff must show the explicit
redaction step that runs before `captureMessage`.

## A7.6 — Do not skip the redaction utility when logging objects with user data

`logger.info("op_completed", { user })` is wrong if `user` is the full
`auth.users` row — that row contains email, phone, metadata, app_metadata.
Either pull the fields you actually want (`{ userId: user.id }`) or wrap
the spread in `defaultRedactor({...})`.

The redactor strips a known key list; new sensitive keys (e.g. when a future
column is added to a profile table) need to be added to `DEFAULT_REDACT_KEYS`
in `packages/observability/src/redaction.ts`.

## A7.7 — Do not log inside hot loops without sampling

Each emit is one stdout line + one Vercel log entry + one Sentry breadcrumb.
Logging on every iteration of a 10k-row batch will fill the log buffer + cost
real money. Use:

- `logger.info("batch_started", { count: N })` once at start
- `logger.info("batch_completed", { count: N, durationMs })` once at end
- inside the loop, only `logger.warn/error` for actual failures, not for
  per-iteration progress

## A7.8 — Do not call /api/health from inside a request handler

The health endpoint is for Vercel monitoring + future SLO tooling, not for
internal-service liveness checks. If your route needs to know whether
Supabase is reachable, call Supabase directly — `/api/health` adds a
network hop and a circular failure mode (health probe failing because the
route timed out trying to ask the health endpoint).

## A7.9 — Do not emit a typed event without setting `outcome`

`emitEvent({ name, classification, outcome, ... })` — `outcome` is required
by the contract because owner analytics dashboards split rows on it. Forgetting
to set it (or setting `outcome: undefined`) breaks every downstream join.

Use `'started' | 'completed' | 'failed' | 'blocked' | ...` per the
`EventOutcome` enum in `@henryco/observability/events`.

## A7.10 — Do not return success when a side effect silently failed

S4 degraded-side-effect reporting is the explicit contract. If the primary
action succeeded but a side effect (email, notification, search index)
failed, the response MUST include `degraded: ['<side_effect_name>']` (or
the equivalent shape used by the route's existing schema — e.g. the
intelligence-rollout reference uses `side_effect_failures: [...]`).

A response of `{ ok: true }` when an email send failed silently is a lie
the support team will eventually pay for.

---

## Enforcement

These rules are reviewed at PR time. The `scripts/v3/event-emission-audit.mjs`
script automates two of them (A7.3 + A7.10 indirectly — by counting routes
that emit a typed event + use the workspace logger). The remaining rules
require eyes on the diff.

A future pass may extend the audit script to grep for the patterns in this
document (`console.*` outside scripts, `catch {}` outside breadcrumbs).
