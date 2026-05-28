# V3-10 — Foundation: Logs, States, Fallbacks

**Pass ID:** V3-10
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global, Observability)
**Dependencies:** Phase A audit
**Effort:** M (1–2 weeks)
**Parallel-safe:** YES
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass closes the **logs/states/fallbacks** sub-bar. Owner's bar: "no major flows without logs, states, and fallback handling". Every mutating route logs structured events; every degraded side effect (e.g., email-send failure) reports explicitly; every read query has a fallback if the source is unavailable.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/10-logs-states-fallbacks` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §2.13 + §3 cross-cutting)

> ### 2.13 Observability (`@henryco/observability`)
> - Logger with PII redaction (default redact keys)
> - Event-taxonomy emitter (`emitEvent`)
> - Sentry config builders (server, client, edge) — decoupled from `@sentry/nextjs` version
> - DASH-9 audit-log writer at `/audit-log` subpath (server-only)
> - **GAP:** per-app Sentry `Sentry.init` adoption inventory unknown; some apps may not call it yet
> - **GAP:** no traces / no SLOs / no performance-budget enforcement yet

From intelligence-rollout-status: "routes now report degraded side effects explicitly" — this pattern exists for intelligence routes; extend to every mutating route.

Owner: "no major flows without logs, states, and fallback handling".

---

## Mandatory scope

### S1 — Sentry adoption inventory

For each of the 10 web apps:
- Check if `Sentry.init(buildServerSentryConfig())` is called.
- Check if `Sentry.init(buildClientSentryConfig())` is called.
- Check if `instrumentation.ts` exists and wires Sentry per `@henryco/observability/sentry/instrumentation`.

For any app missing Sentry init, wire it. Use the existing `@henryco/observability` builders.

### S2 — Logger adoption inventory

For each mutating route (POST/PATCH/PUT/DELETE handlers in `app/api/**/route.ts`):
- Verify structured log entries on entry, success, error paths.
- Use `@henryco/observability` `logger`, not `console.log`.
- Include redacted payload preview where safe.

Grep `apps/*/app/api/**/route.ts` for `console.log` and replace with `logger.info`. Grep for `console.error` and replace with `logger.error`.

### S3 — Event-emission per mutating route

Every mutating route emits a `@henryco/observability/emitEvent` call with:
- `name: 'henry.<domain>.<object>.<verb>'` per the existing taxonomy.
- `actor` resolved from session.
- `properties` with redacted operation details.

Audit + extend. Build a script `scripts/v3/event-emission-audit.mjs` that lists every mutating route and whether it emits a typed event.

### S4 — Degraded side-effect reporting

For every mutating route that has side effects (email send, notification publish, search-index outbox write, webhook deliver), the route response:
- Includes a `degraded` field listing side effects that failed but didn't fail the primary action.
- e.g., `{ ok: true, id: '...', degraded: ['email_send_failed', 'notification_publish_failed'] }`.

The intelligence-rollout pattern (`apps/account/app/api/support/create/route.ts`) is the reference. Apply across:
- All payment-touching routes.
- All KYC submission routes.
- All notification-publishing routes.
- All webhook-receiving routes (where the receiver triggers downstream side effects).

### S5 — Fallback handling for read queries

Every read query that depends on an external service (Typesense, Google Places, Cloudinary, payment provider, AI provider — when these come online):
- Has a documented fallback if the service is unavailable.
- The fallback returns degraded results (empty list, cached value, or "service unavailable" message) without crashing the page.

Audit each:
- Typesense `/api/search` — fallback to direct DB query OR graceful empty results (currently graceful empty per V2-SEARCH-01).
- Google Places `/api/addresses/autocomplete` — fallback to user-provided text with `verified: false` flag.
- Cloudinary image load failures — fallback to placeholder.
- Future payment provider calls (V3-14/15/16) — fallback to "service temporarily unavailable" with retry option.
- Future AI provider calls (V3-26) — fallback to deterministic version where possible.

### S6 — Audit log adoption

`@henryco/observability/audit-log` (DASH-9 writer) is server-only. Audit:
- Every sensitive-action route (extends V3-02 work) writes audit log entry.
- Audit log entries include: actor, action, target, ip, ua, outcome, timestamp.
- Retention period: 1 year minimum.

### S7 — Error boundaries on every route segment

Every Next.js route group has an `error.tsx`:
- Renders a human-readable fallback with retry option.
- Logs the error via `@henryco/observability/logger`.
- Sends to Sentry.

Audit each app's route tree; add missing `error.tsx`.

### S8 — Health check endpoint

Each web app has `/api/health` returning:
- `{ ok: true, version: '<commit-sha>', deploy: '<vercel-deploy-id>', uptime_seconds: N }`.
- Used by Vercel monitoring + future SLO tooling.

### S9 — Owner-workspace observability tile

Extend the owner dashboard with:
- "Error rate (last 24h)" — pulled from Sentry stats API or aggregated event log.
- "Degraded side effects (last 24h)" — grouped by type.
- "Slowest routes (last 24h)" — p95 latency.

If V3-89 (observability depth) hasn't shipped, this is a basic version. V3-89 will extend.

---

## Out of scope

- Performance budget enforcement on PR (V3-89).
- Distributed traces / OpenTelemetry (V3-89).
- SLO definitions (V3-89).
- Data lake / event tracking depth (V3-90).
- A/B testing framework (V3-91).

---

## V3-10 ADDENDUM — clarifications, applied before execution

### A1. Rollback trigger threshold (MUST-FIX)

During the 72-hour soak, if any of the following are true, revert and re-author:
- Unhandled exception rate per 1000 requests rises more than 2x the pre-merge baseline (captured the day before deploy).
- Any single new typed event emits at a rate >10x its expected order of magnitude (suggests an emit loop).
- p95 server-response time on any of the top-10 routes degrades by more than 25%.

Baseline numbers are captured by the executor in the pre-deploy step and pasted into the report.

### A2. S6 dependency resolution (MUST-FIX)

V3-02 (auth reliability) ships AFTER V3-10. Therefore V3-10 enumerates the initial sensitive-action route list itself:
- All payment-touching routes (placeholder until V3-13).
- All KYC submission routes.
- All password/email change routes.
- All session-revocation routes.
- All admin-action routes (owner/staff dashboards).
- All export-data routes.

V3-02 will extend this list; V3-10 establishes the pattern and covers what already exists today.

### A3. S2 grep scope expansion (MUST-FIX)

Replace `console.*` with structured logger across:
- `apps/*/app/api/**/route.ts` (API handlers).
- `apps/*/app/**/actions.ts` (server actions).
- `apps/*/app/**/actions/*.ts` (server actions, grouped).
- `apps/*/middleware.ts` (middleware).
- `apps/*/lib/**/*.ts` (server-side libs).
- `packages/*/src/server/**/*.ts` (shared server code).

The bar: zero `console.log` / `console.error` in any server-side code path. The exception is one-time CLI scripts under `scripts/`, which may keep console output.

### A4. Mutating-route coverage bar (MUST-FIX)

`>= 50 routes` is replaced with: `100% of mutating routes enumerated by scripts/v3/event-emission-audit.mjs emit a typed event AND log structured entries on entry/success/error.`

The audit script is the source of truth for `every`. If the script reports any route missing emission or logging, the pass is not closed.

### A5. S5 fallback list (MUST-FIX, completion)

Extend S5 to also cover:
- Resend / Brevo (email send) — degraded flag on the response per S4.
- Supabase Realtime — UI shows `reconnecting` with last known state preserved.
- Supabase Storage (image/file fetch) — placeholder asset.
- OneSignal / Twilio / Termii (push, SMS) — degraded flag on the response; user-visible delivery state shows `pending`.
- DeepL runtime translation — fall back to the source-locale string and emit `henry.i18n.deepl_fallback` event.

Every fallback path emits a typed event so degraded conditions are observable.

### A6. Health endpoint unhealthy paths (MUST-FIX)

`/api/health` checks must verify:
- Supabase connection (lightweight `SELECT 1`).
- Critical env vars present (without revealing values).

Returns 200 only if all checks pass. Returns 503 with a structured body listing failed checks otherwise. Vercel health-check polling and any future SLO tooling consume the 503 signal.

### A7. Anti-patterns (MUST-FIX, add to prompt)

- Do not log session tokens, refresh tokens, or auth headers.
- Do not log full request bodies for payment or KYC routes.
- Do not introduce a second logging library; use `@henryco/observability/logger` exclusively.
- Do not silently swallow caught exceptions — every catch logs at appropriate level.
- Do not write to Sentry from client code without PII filtering active.
- Do not skip the redaction utility when logging objects that may contain user data.

### A8. Error.tsx visual specification (SHOULD-FIX)

The error boundary fallback inherits Pass 19 tokens + Pass 20 polish + Pass 25 typography. Layout:
- Centered card on `surface-base`.
- Section label `SOMETHING WENT WRONG` (label token, uppercase).
- Headline using h2 token: a short human sentence per locale.
- Body in body-sm: brief explanation, not a stack trace.
- Two buttons: primary `Try again` (calls `reset()`), secondary `Go home` (`router.push('/')`).
- Reference ID line in caption token if logger returns one: `ref <id> — share with support if this repeats`.
- Reference ID is logged to Sentry too so support can match.

### A9. Cross-Wave-B.1 merge coordination (MUST-FIX)

V3-07 (hardcoded text), V3-09 (mobile consistency), and V3-10 all touch `error.tsx` files and mutating-route code. The conductor's merge order for Wave B.1 must be:

1. V3-10
2. V3-07
3. V3-09
4. V3-03
5. V3-05

V3-10 lands first because it establishes the `error.tsx` pattern that V3-07 then extracts strings from. V3-09's mobile work comes after the visual pattern is set. V3-03 and V3-05 have lower file overlap and land last.

If any merge produces conflicts in `error.tsx` or shared logger calls, the conductor re-spawns a follow-up agent per the standard protocol.

### A10. Owner observability tile (SHOULD-FIX)

Use the aggregated event log as the data source for the tile, not the Sentry stats API. Reasons: Sentry stats API requires a paid plan tier and the project may not have it; the `henry_events` table is already the canonical event sink (per V3-01 slice 5b). Query pattern follows existing owner-tile server actions (e.g., session-health-tile from V3-01). All tile strings localized via `@henryco/i18n` namespace `surface:owner-observability`.

---

## Dependencies

- Phase A audit complete.

Blocks:
- V3-43 (workflow engine foundation) — assumes structured logs + events from every route.
- V3-89 (observability depth) — extends this baseline.

---

## Inheritance

- `@henryco/observability` package — extend adoption, don't fork.
- DASH-9 `add_audit_log_v2` Supabase function — use for sensitive-action logging.
- Existing event taxonomy in `@henryco/intelligence` — preserve.

---

## Implementation requirements

### Files

- `scripts/v3/event-emission-audit.mjs` (new)
- `scripts/v3/sentry-adoption-audit.mjs` (new)
- Per-app fixes for missing Sentry init / missing logger usage / missing event emission
- Per-route fixes for degraded side-effect reporting
- `apps/<app>/app/api/health/route.ts` (new — 10 apps; copy/paste pattern)
- `apps/<app>/app/error.tsx` (new where missing)
- `apps/hub/app/owner/(command)/dashboard/observability-tile.tsx` (new — V3-89 extends)

### No migrations.

### Integration changes

- Sentry projects per Vercel deploy (owner provisions DSN env vars per app if not already present).

---

## Trust / safety / compliance

- PII redaction enforced (already in `@henryco/observability/redaction`).
- Logs never include passwords, tokens, full credit card numbers.
- Sentry filtering rules to drop irrelevant events.
- ANTI-CLONE Principle 12 — full audit log adoption.

## Mobile + desktop parity

- Server-side observability applies equally.
- Client-side Sentry on mobile web verified.

## i18n

- Error page copy via `@henryco/i18n` namespace `surface:error`.

---

## Validation gates

1. Standard CI.
2. **Adoption audit** — Sentry init present in all 10 apps.
3. **Event emission** — every mutating route emits a typed event (audit-script enforced).
4. **Health endpoint** — 10/10 apps return 200 from `/api/health`.
5. **Error boundary smoke** — trigger an intentional error; verify error.tsx renders + Sentry receives the event + logger emits structured log.
6. **Degraded smoke** — simulate email-send failure on support thread create; verify `degraded: ['email_send_failed']` returns to client.

## Deployment gate

- All gates pass.
- 72-hour soak; baseline error rate captured.

## Final report contract

`.codex-temp/v3-10-logs-states-fallbacks/report.md` with the standard 9 sections + Sentry adoption matrix + event emission audit + degraded side-effect reference.

---

## Self-verification

- [ ] Sentry init in all 10 web apps.
- [ ] Structured logger replaces console.* in all mutating routes.
- [ ] Every mutating route emits typed event.
- [ ] Degraded side-effect reporting pattern applied to ≥ 50 routes.
- [ ] Every external-service read has fallback.
- [ ] Audit log adoption verified on sensitive routes.
- [ ] Error boundaries on every route group.
- [ ] Health endpoint in every app.
- [ ] Owner observability tile rendering.
- [ ] Report written. Hand-off: V3-43 (workflow engine foundation) consumes this.
