# V3-10 — Foundation: Logs, States, Fallbacks

> **STATUS: SHIPPED — PR #133.** Closed and certified inside Foundation Lock (V3-12, #168). `@henryco/observability` is live across all 10 apps with `emitEvent`, `logger`, `persistEvent`, `buildHealthResponse`/`healthStatusCode`, `audit-log`, and `redaction`; `/api/health` exists in every app; the audit scripts `scripts/v3/event-emission-audit.mjs` and `scripts/v3/sentry-adoption-audit.mjs` are committed. Treat this as the elevated canonical spec and the standing observability contract — V3-43 (workflow engine) and V3-89 (observability depth) build directly on it, and V3-94 re-runs the degraded-side-effect and health smoke. Residual hardening is named at the end, not reopened as scope.

**Pass ID:** V3-10  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global, Observability)
**Dependencies:** —  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass closes the logs/states/fallbacks sub-bar: every mutating route logs structured entry/success/error, emits a typed `henry.<domain>.<noun>.<verb>` event, reports degraded side effects explicitly, and every external-service read has a documented non-crashing fallback. The line you must not cross: you adopt and extend `@henryco/observability` — you never fork it, never add a second logging library, and never log session tokens, payment bodies, or KYC bodies. Distributed traces, SLOs, and PR performance budgets are V3-89, not here.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/10-logs-states-fallbacks` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

`@henryco/observability` already ships the spine: a PII-redacting `logger` (`packages/observability/src/logger.ts`), the typed event emitter `emitEvent` over the `HenryEventName` taxonomy (`events.ts`), the canonical `persistEvent` writer to the `henry_events` sink (`persist-event.ts`), Sentry config builders decoupled from `@sentry/nextjs` (`sentry/`), the DASH-9 server-only audit-log writer (`audit-log.ts`), and the redaction utility (`redaction.ts`). The gaps this pass closes: per-app Sentry `Sentry.init` adoption was unverified; mutating routes used raw `console.*` in places and did not uniformly emit typed events; degraded side effects (email-send, notification publish, search outbox) were swallowed on most routes; external-service reads (Typesense, Google Places, Cloudinary, Supabase Realtime/Storage, email/SMS/push providers, future payment/AI providers) had no documented fallbacks; not every route segment had an `error.tsx`; and `/api/health` was inconsistent. V3-02 (auth reliability) ships after V3-10, so V3-10 owns the initial sensitive-action route list itself and V3-02 extends it.

## Mandatory scope

### S1 — Sentry adoption inventory
Ship `scripts/v3/sentry-adoption-audit.mjs` that checks, per app: `Sentry.init(buildServerSentryConfig())`, `Sentry.init(buildClientSentryConfig())`, and an `instrumentation.ts` wiring `@henryco/observability/sentry/instrumentation`. Wire Sentry into any app missing it using the existing builders — never hand-roll a config. Client Sentry must run with PII filtering active.

### S2 — Structured logger replaces every server-side `console.*`
The bar: **zero `console.log` / `console.error` in any server-side code path.** Replace with `@henryco/observability` `logger` (`logger.info` / `logger.error`, with `logger.child({ … })` for context) across:
- `apps/*/app/api/**/route.ts` (API handlers)
- `apps/*/app/**/actions.ts` and `apps/*/app/**/actions/*.ts` (server actions)
- `apps/*/middleware.ts`
- `apps/*/lib/**/*.ts` (server-side libs)
- `packages/*/src/server/**/*.ts` (shared server code)

Exception: one-time CLI scripts under `scripts/` may keep console output. Every `catch` logs at the appropriate level — no silently swallowed exceptions.

### S3 — Typed event emission per mutating route
Ship `scripts/v3/event-emission-audit.mjs` that enumerates every mutating route (POST/PATCH/PUT/DELETE handlers + mutating server actions) and reports whether each calls `emitEvent`. The bar: **100% of enumerated mutating routes emit a typed event AND log structured entries on entry/success/error.** The script is the source of truth for "every" — if it reports any route missing emission or logging, the pass is not closed. Each emit uses the real signature:
```ts
emitEvent({
  name: 'henry.<domain>.<noun>.<verb>',   // HenryEventName, must exist in events.ts
  classification: 'user_action' | 'system_state',
  outcome: 'success' | 'failure',
  actorId,                                  // resolved from session
  payload,                                  // redacted operation details
});
```

### S4 — Degraded side-effect reporting
Every mutating route with side effects (email send, notification publish, search-index outbox, webhook deliver) returns a `degraded` array of side effects that failed without failing the primary action — e.g. `{ ok: true, id, degraded: ['email_send_failed', 'notification_publish_failed'] }`. Reference implementation: `apps/account/app/api/support/create/route.ts`. Apply across all payment-touching routes, all KYC submission routes, all notification-publishing routes, and every webhook receiver that triggers downstream side effects. Every fallback path also emits a typed event so degraded conditions are observable.

### S5 — Fallback handling for external-service reads
Every read that depends on an external service has a documented, non-crashing fallback that returns degraded results (empty list, cached value, or a localized "service unavailable" message) and emits a typed event. Cover:
- Typesense `/api/search` → graceful empty results (per V2-SEARCH-01) or direct DB query.
- Google Places `/api/addresses/autocomplete` → fall back to user-typed text with `verified: false`.
- Cloudinary / Supabase Storage image fetch → placeholder asset.
- Supabase Realtime → UI shows `reconnecting` with last-known state preserved.
- Email (Resend/Brevo), push/SMS (OneSignal/Twilio/Termii) → `degraded` flag per S4; user-visible delivery state shows `pending`.
- DeepL runtime translation → fall back to the source-locale string and emit `henry.i18n.deepl.fallback`.
- Future payment-provider calls (V3-14/15/16) → localized "service temporarily unavailable" + retry.
- Future AI-provider calls (V3-26) → deterministic version where one exists.

### S6 — Audit-log adoption on sensitive routes
`@henryco/observability/audit-log` (server-only, DASH-9 `add_audit_log_v2`) writes on every sensitive-action route. Because V3-02 ships after this pass, V3-10 enumerates the initial sensitive-action set itself: all payment-touching routes (placeholder until V3-13), all KYC submission routes, all password/email-change routes, all session-revocation routes, all admin (owner/staff) action routes, all data-export routes. Entries record actor, action, target, ip, ua, outcome, timestamp; retention ≥ 1 year. V3-02 extends this list.

### S7 — Error boundary on every route segment
Every Next.js route group has an `error.tsx` that renders a human-readable fallback with retry, logs via `@henryco/observability` `logger`, and reports to Sentry. The fallback inherits the locked design tokens + PASS 25 typography:
- Centered card on `surface-base`; section label `SOMETHING WENT WRONG` (label token, uppercase, localized).
- Headline (h2 token), short human sentence per locale — never a stack trace.
- Two buttons: primary **Try again** (`reset()`), secondary **Go home** (`router.push('/')`).
- Caption line `ref <id> — share with support if this repeats` when the logger returns a reference id; that id is sent to Sentry so support can match.

### S8 — Health endpoint, including unhealthy paths
Each app exposes `/api/health` built with `buildHealthResponse(...)` and `healthStatusCode(...)` from `@henryco/observability/health`. It verifies a lightweight Supabase `SELECT 1` and that critical env vars are present (without revealing values). Returns **200** only if all checks pass; **503** with a structured body listing failed checks otherwise. Vercel polling and future SLO tooling consume the 503 signal.

### S9 — Owner-workspace observability tile
Extend the owner dashboard with a tile showing "Error rate (last 24h)", "Degraded side effects (last 24h)" grouped by type, and "Slowest routes (last 24h)" p95. **Data source = the `henry_events` table (the canonical sink), not the Sentry stats API** (which requires a paid tier the project may not have). Follow the existing owner-tile server-action pattern (session-health-tile from V3-01). All strings localized via `@henryco/i18n` namespace `surface:owner-observability`. V3-89 extends this to traces/SLOs.

## Out of scope
- PR performance-budget enforcement, OpenTelemetry traces, SLO definitions → V3-89.
- Data-lake / event-tracking depth → V3-90. A/B framework → V3-91.

## Dependencies
None upstream (V3-02 ships after and extends S6). Blocks: V3-43 (workflow engine assumes structured logs + typed events on every route) and V3-89 (extends this baseline into traces/SLOs/budgets).

## Inheritance
- `@henryco/observability` — `logger`, `emitEvent`, `persistEvent`, `audit-log`, `redaction`, `health`, `sentry/*`. Extend adoption; do not fork.
- DASH-9 `add_audit_log_v2` Supabase function — for sensitive-action logging.
- Existing `HenryEventName` taxonomy in `events.ts` — preserve and extend with the new names.

## Implementation requirements

### Files
- `scripts/v3/event-emission-audit.mjs` (new)
- `scripts/v3/sentry-adoption-audit.mjs` (new)
- Per-app: missing `Sentry.init` / `instrumentation.ts`, `console.*` → `logger`, missing `emitEvent`, degraded-side-effect reporting.
- `apps/<app>/app/api/health/route.ts` (new where missing — 10 apps, one pattern)
- `apps/<app>/app/error.tsx` (new where missing)
- Owner observability tile under the hub owner workspace.
- No migrations (the audit-log function and `henry_events` sink already exist).

### Trust / safety / compliance
PII redaction enforced via `@henryco/observability/redaction`. Never log passwords, tokens, auth headers, full payment bodies, or full KYC bodies. Sentry drops irrelevant events; client Sentry never emits without PII filtering. ANTI-CLONE P12 — full audit-log adoption on sensitive routes.

### Mobile + desktop parity
Server-side observability applies equally. Client-side Sentry verified on mobile web. The `error.tsx` fallback is responsive (mobile + desktop) and inherits the locked tokens.

### i18n
Error-page copy via `@henryco/i18n` namespace `surface:error`; owner tile via `surface:owner-observability`; degraded user-visible states ("pending", "reconnecting", "service unavailable") localized. No hardcoded user-facing strings.

### Brand & design system
The `error.tsx` fallback and owner tile use locked `--site-*` / `--accent` tokens + Fraunces display where editorial; light + dark; CLS ≈ 0; contrast not regressed. Brand strings resolve from `@henryco/config`; zero hardcoded domains (`henryDomain()` / `henryWebRoot()` / `getHubUrl()`).

## Validation gates
1. Standard CI: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. Sentry-adoption audit: `Sentry.init` present in all 10 apps.
3. Event-emission audit: 100% of mutating routes emit a typed event and log entry/success/error — script reports zero gaps.
4. Health: `/api/health` returns 200 on all 10 apps when healthy and 503 with a structured failed-checks body when a dependency is down.
5. Error-boundary smoke: trigger an intentional error → `error.tsx` renders, Sentry receives the event, logger emits a structured line with a ref id.
6. Degraded smoke: simulate email-send failure on support-thread create → `degraded: ['email_send_failed']` returns to the client and a typed event emits.

### Rollback trigger threshold (soak)
During the 72-hour soak, revert and re-author if any holds: unhandled-exception rate per 1000 requests rises >2× the pre-merge baseline; any single new typed event emits at >10× its expected order of magnitude (emit loop); p95 server response on any top-10 route degrades >25%. The executor captures pre-deploy baselines and pastes them into the report.

## Deployment gate
All gates green. 72-hour soak with the rollback thresholds above armed; pre-merge baseline error rate captured. Wave-B.1 merge order is V3-10 → V3-07 → V3-09 → V3-03 → V3-05 (V3-10 lands first because it establishes the `error.tsx` pattern V3-07 then extracts strings from); the conductor re-spawns a follow-up agent on any `error.tsx` or shared-logger conflict.

## Final report contract
`.codex-temp/v3-10-logs-states-fallbacks/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the Sentry adoption matrix, the event-emission audit output, and the degraded-side-effect reference table.

## Self-verification
- [ ] S1: `sentry-adoption-audit.mjs` shipped; `Sentry.init` present in all 10 apps; client PII filtering active.
- [ ] S2: zero server-side `console.*` across the enumerated paths; every catch logs.
- [ ] S3: `event-emission-audit.mjs` reports 100% mutating-route emission + structured logging.
- [ ] S4: degraded-side-effect `degraded[]` returned on every side-effecting mutating route.
- [ ] S5: every external-service read has a documented, event-emitting fallback (incl. `henry.i18n.deepl.fallback`).
- [ ] S6: audit-log written on every enumerated sensitive-action route.
- [ ] S7: `error.tsx` present on every route segment, token-correct, localized, Sentry-wired.
- [ ] S8: `/api/health` returns 200/503 correctly on all 10 apps.
- [ ] S9: owner observability tile renders from `henry_events`, fully localized.
- [ ] Brand/domain/i18n/token hard rules satisfied; rollback thresholds documented; report written and hands off to V3-43.
