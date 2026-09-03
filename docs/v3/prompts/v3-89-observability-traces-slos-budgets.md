# V3-89 — Observability: Traces, SLOs, Performance Budgets

**Pass ID:** V3-89  ·  **Phase:** I (Platform/API · Global/Mobile · Observability · Closure)  ·  **Pillar:** P12 (Trust, Reliability & Foundation)
**Dependencies:** V3-10 (logs/states/fallbacks + `@henryco/observability` adoption)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Observability Depth engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns error tracking into *operational truth*: it adds distributed tracing (OpenTelemetry → Sentry Performance) across all ten web apps, defines an SLO per critical user journey with a monthly error budget and multi-window burn-rate alerting, and enforces a per-route performance budget on every PR so a regression cannot merge. The line it must not cross: it adds **instrumentation and gates only** — it changes no business logic, ships no new product surface, and PII must never enter a span, a tag, or a budget report.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/89-observability-traces-slos-budgets` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

`@henryco/observability` is wired across all ten apps and is the spine this pass extends. It already ships: a structured `logger` with the `createRedactor` / `defaultRedactor` PII redactor (`DEFAULT_REDACT_KEYS` covers email/phone/address/NIN/BVN/token/secret/card/IBAN/account-number); the typed `emitEvent` taxonomy (`HenryEventName` string-literal union, `henry.<domain>.<noun>.<verb>`); `persistEvent` → the `public.henry_events` table (V3-01 migration `20260522103000_v3_01_henry_events.sql`, RLS: insert-own / select service-role); `writeAuditLog` over `add_audit_log_v2`; the uniform `/api/health` helper (`buildHealthResponse` — Supabase liveness + critical-env presence, 200/503); and the Sentry config builders (`buildServerSentryConfig` / `buildEdgeSentryConfig` / `buildClientSentryConfig`) whose `beforeSend` / `beforeBreadcrumb` run `defaultRedactor` on every event. `tracesSampleRate` already defaults to `0.1` via `SENTRY_TRACES_SAMPLE_RATE`, and `profilesSampleRate` to `0.1` — but **no spans are explicitly created**, no trace context is threaded across Next route handlers → Supabase calls → external APIs, **no SLO is defined anywhere**, no error budget is tracked, and no performance budget gates a PR (CLS is hand-checked per UI pass, never enforced). The gap this pass closes: from "errors are captured, sampling exists" to "every critical journey is traced end-to-end, has a written SLO with a burning error budget, and cannot regress past a budget without failing CI."

## Mandatory scope

### S1 — `@henryco/observability/tracing` — OpenTelemetry instrumentation

New module `packages/observability/src/tracing.ts` (add `"./tracing": "./src/tracing.ts"` to the package `exports`) plus `packages/observability/src/tracing/instrumentation-node.ts` (Node-runtime auto-instrumentation registration). The Sentry SDK (`@sentry/nextjs` v10, already a peer dep) ships an OpenTelemetry-compatible tracer; this module wires explicit spans on top of Sentry's auto-instrumentation rather than adding a second exporter — Sentry Performance is the trace backend, no new vendor.

```typescript
// packages/observability/src/tracing.ts  (runtime-safe; no server-only import)
export type SpanAttributes = Record<string, string | number | boolean>;

/** Wrap an async unit of work in a span. Attributes are run through
 *  the redactor before being attached — a span attribute is a log line. */
export async function withSpan<T>(
  name: string,                         // e.g. "payment.intent.create", "search.query"
  attributes: SpanAttributes,
  fn: (span: { setAttribute(k: string, v: string | number | boolean): void }) => Promise<T>,
): Promise<T>;

/** Continue an inbound trace from W3C `traceparent` / `tracestate`
 *  headers (route-handler entry) and run `fn` within that context. */
export async function withTraceContext<T>(
  headers: Headers,
  fn: () => Promise<T>,
): Promise<T>;

/** Inject the current trace context into outbound fetch headers so a
 *  Supabase call or external-API call joins the same trace. */
export function injectTraceHeaders(init?: RequestInit): RequestInit;
```

Hard rules baked in:
- **Span attributes are redacted at the seam.** `withSpan` runs every attribute value through `defaultRedactor` before attaching it — the same guarantee `beforeSend` gives Sentry events. No raw email/phone/token ever reaches a span.
- **Sample rate is environment-driven, not hardcoded:** production 10% (`SENTRY_TRACES_SAMPLE_RATE=0.1`), preview/staging 100% (`SENTRY_TRACES_SAMPLE_RATE=1.0` in the preview env scope). `buildServerSentryConfig` already reads this var — do not duplicate the rate; document the per-environment value in `docs/v3/INTEGRATION-KEYS.md`.
- **W3C trace context propagation** across the boundary: Next route handler entry → Supabase client call → outbound `fetch` to external providers (Paystack/Resend/Cloudinary/Typesense). `traceparent` is injected on outbound and continued on inbound.

### S2 — Instrument the critical paths

Add explicit `withSpan` / `withTraceContext` wrapping to the journeys that have SLOs (S3). Touch only the entry seam — wrap, do not rewrite:
- **Auth** — sign-in / OAuth callback / session refresh route handlers in `apps/account` (V3-01/V3-02 surfaces). Span `auth.signin`, `auth.oauth.callback`, `auth.session.refresh`.
- **Checkout / payment** — the V3-13 provider-agnostic routes (`apps/account/app/api/payments/intents/route.ts` and the webhook route, when present). Span `payment.intent.create`, `payment.webhook.process`.
- **Search** — the hub `/api/search` route + the search-index worker. Span `search.query`, `search.index.drain`.
- **Notification/message delivery** — the V3-03 delivery path + the email-fallback cron (`apps/account/app/api/cron/notification-email-fallback`). Span `notification.deliver`.

Every span carries low-cardinality attributes only: `division`, `route`, `outcome`, `status_code`, `provider` (never a user id, never PII). Trace ids are stitched to the existing `emitEvent` `traceId` field so a Sentry breadcrumb timeline joins a `henry_events` row.

### S3 — SLO definitions (`docs/v3/slos.md`)

A new authoritative document defining one SLO per critical user journey. Each SLO is a concrete, measurable target with an owner and a 30-day rolling window:

| Journey | SLI | Target (SLO) | Window | Error budget |
|---|---|---|---|---|
| Auth success | `signin_success / signin_total` | ≥ 99.9% | 30d rolling | 0.1% |
| Checkout / payment success | `intent_succeeded / intent_attempted` | ≥ 99.5% | 30d rolling | 0.5% |
| Search responsiveness | p95 server response of `/api/search` | ≤ 500 ms | 30d rolling | 5% over budget |
| Notification delivery | `delivered / (delivered + failed)` | ≥ 99.0% | 30d rolling | 1.0% |
| Page availability | `/api/health` 200 rate per app | ≥ 99.95% | 30d rolling | 0.05% |

The doc states, per SLO: the exact SLI numerator/denominator, the data source (Sentry Performance span metric **or** a `henry_events` aggregate query — never a hand-counted guess), the alert thresholds (S4), and the owner of the budget. **The SLO targets are owner-reviewable** — the doc carries a "review & ratify" section the owner signs before the deployment gate clears.

### S4 — Error budget tracking + burn-rate alerts

A scheduled evaluator computes monthly budget burn per SLO from the SLI sources in S3 and alerts on burn-rate, not raw count:
- **Fast burn** — 2% of the 30-day budget consumed in 1 hour → page (Sentry alert → Slack `#henry-incidents` + email via `RESEND_API_KEY`).
- **Slow burn** — 75% of the 30-day budget consumed → warn (Slack + email, non-paging).

Implement as a cron route `apps/hub/app/api/cron/slo-budget-eval/route.ts` (`runtime = "nodejs"`, `Authorization: Bearer ${CRON_SECRET}` guard — the established cron-auth shape) that reads the SLI aggregates, computes burn per SLO, persists a daily snapshot to a new `slo_budget_snapshots` table, and fires the alert via the Sentry alert API + Resend when a threshold trips. Emits the S6 telemetry.

`slo_budget_snapshots` migration (`apps/hub/supabase/migrations/<ts>_slo_budget_snapshots.sql`, **committed, applied only by owner**):

```sql
create table if not exists public.slo_budget_snapshots (
  id uuid primary key default gen_random_uuid(),
  slo_key text not null,                 -- 'auth_success' | 'checkout_success' | ...
  window_start date not null,
  sli_numerator bigint not null,
  sli_denominator bigint not null,
  budget_consumed_ratio numeric not null check (budget_consumed_ratio >= 0),
  burn_class text not null check (burn_class in ('ok','slow_burn','fast_burn')),
  created_at timestamptz not null default now(),
  unique (slo_key, window_start)
);
alter table public.slo_budget_snapshots enable row level security;
grant select on public.slo_budget_snapshots to service_role;
-- Owner tile reads via the admin client (createAdminSupabase) — RLS select is service_role only.
create policy slo_budget_snapshots_select_service_role
  on public.slo_budget_snapshots for select to service_role using (true);
```

### S5 — Performance budget enforcement on every PR

Lighthouse CI runs against every Vercel preview deployment and **fails the PR** when a tracked metric regresses past budget. New files:
- `lighthouserc.json` (repo root) — assertion config: per-route, mobile + desktop budgets for LCP, CLS, INP/TBT. Fail when a metric exceeds its budget or regresses > 5% versus the route's recorded baseline.
- `.github/workflows/perf-budget.yml` — a CI job that waits for the Vercel preview URL, runs `@lhci/cli autorun` against the tracked route set, and reports pass/fail as a PR status check.
- `docs/v3/performance-budgets.md` — the per-route baseline table (the routes the SLOs care about: account home, marketplace listing, hub home, search, a public division landing), mobile + desktop, with the recorded baseline LCP/CLS/INP each was set from.

Budget assertions are hard: CLS budget `≤ 0.02` on every tracked route (the company-wide "CLS ≈ 0" bar made enforceable), LCP and INP per the baseline table. The job is a **required status check** added to branch protection alongside `Lint, typecheck, test, build`.

### S6 — Telemetry

Three new events, added to the `HenryEventName` union in `packages/observability/src/events.ts` and documented in `docs/event-taxonomy.md`:

```
henry.observability.trace.sampled          (system_state · completed)  — a journey span recorded
henry.observability.slo.breach             (system_state · failed)     — a burn threshold tripped
henry.observability.performance.regression (system_state · failed)     — a PR perf budget failed
```

`henry.observability.slo.breach` carries `{ slo_key, burn_class }`; `henry.observability.performance.regression` carries `{ route, metric, budget, measured }` — all low-cardinality, no PII.

## Out of scope

- The durable analytics sink / data lake + BI access (**V3-90** — this pass reads SLI aggregates from Sentry Performance + the existing `henry_events`; it does not build the warehouse).
- A/B testing + experiment lifecycle (**V3-91**).
- Backup / disaster-recovery runbooks, RPO/RTO (**V3-92**).
- Privacy / DSAR / consent ledger (**V3-93**).
- Any change to business logic, product surface, or payment behaviour — instrumentation only.

## Dependencies

- **Requires:** V3-10 (`@henryco/observability` adoption inventory + per-route fallback coverage — the spine this extends).
- **Blocks:** V3-94 closure integration-test pass re-runs the SLO + perf-budget gates as part of foundation-lock regression; V3-95 launch-readiness asserts every SLO is green and every budget gate is active. V3-90's BI views can join the trace ids this pass stitches.

## Inheritance

- `@henryco/observability` — `emitEvent` (typed taxonomy + `traceId` stitch), `defaultRedactor` (span-attribute redaction), the Sentry config builders (`tracesSampleRate` already env-driven), `buildHealthResponse` (the availability SLI source), `logger`.
- The Sentry project (`SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`) per `docs/v3/INTEGRATION-KEYS.md`.
- The established cron-auth shape (`Authorization: Bearer ${CRON_SECRET}`) used by every `apps/*/app/api/cron/*` route.

## Implementation requirements

### Files

`packages/observability/src/tracing.ts` + `packages/observability/src/tracing/instrumentation-node.ts` + the `exports` entry; span wrapping at the S2 entry seams (auth / payment / search / notification route handlers — wrap only); `docs/v3/slos.md`; `apps/hub/app/api/cron/slo-budget-eval/route.ts`; the `slo_budget_snapshots` migration (committed, owner-applied); `lighthouserc.json`; `.github/workflows/perf-budget.yml`; `docs/v3/performance-budgets.md`; the three taxonomy entries in `packages/observability/src/events.ts` + `docs/event-taxonomy.md`.

### Trust / safety / compliance

Span attributes, tags, and budget reports are PII-free by construction — `withSpan` runs `defaultRedactor` on every attribute, mirroring the Sentry `beforeSend` guarantee (ANTI-CLONE Principle 6: secret/key separation; Principle 12: observable audit trail). The `slo-budget-eval` cron reads only aggregate counts, never per-user rows it would leak. No SLO doc, trace, or budget report contains a customer identifier. The cron route is `CRON_SECRET`-gated; `slo_budget_snapshots` is service-role read only.

### Mobile + desktop parity

Both the web apps and the Expo super-app are trace-instrumented: the Expo client continues the same W3C trace context on its API calls so a mobile-originated journey shares the trace of its server-side handlers. The Lighthouse budgets are recorded **per route for mobile AND desktop** form factors — a regression on either fails the PR.

### i18n

N/A — this pass renders no user-facing copy. The SLO doc, budget report, and alert payloads are operator-facing English. (If the owner SLO dashboard later renders in-app, that surface routes through `@henryco/i18n` namespace `surface:observability`; not in this pass.)

### Brand & design system

No user-facing UI ships in this pass. Any incident-alert link or deep link the alert payload contains resolves through `@henryco/config` helpers (`getHqUrl()` / `getStaffHqUrl()`) — never a literal `henrycogroup.com`. The owner-facing SLO/budget surface (if added to the owner workspace later) inherits the locked design tokens and Fraunces; that surface is not built here.

## Validation gates

1. **Standard CI** — typecheck, lint, test, build (`Lint, typecheck, test, build`, the required branch-protection context).
2. **Trace end-to-end smoke** — a synthetic request to an instrumented journey produces one trace in Sentry Performance spanning route handler → Supabase call → outbound fetch; the trace id matches the `emitEvent` `traceId` on the journey's `henry_events` row.
3. **Span redaction test** — a unit test asserts `withSpan` redacts a known PII key (email/phone/token) from attributes before attach; no `DEFAULT_REDACT_KEYS` value survives onto a span.
4. **SLO doc complete + owner-ratified** — `docs/v3/slos.md` defines every journey's SLI numerator/denominator, source, thresholds, owner; the "review & ratify" section is signed.
5. **Burn-rate alert fires on synthetic spike** — injecting a synthetic failure burst trips `fast_burn`, writes a `slo_budget_snapshots` row, fires the Slack + email alert, and emits `henry.observability.slo.breach`.
6. **Perf budget gate active** — a deliberate CLS-regressing change on a tracked route fails `perf-budget.yml` (proves the gate bites); reverting it passes. The job is a required status check.

## Deployment gate

All gates green; the required check (`Lint, typecheck, test, build`) plus the new `perf-budget` check passing; branch `v3/89-observability-traces-slos-budgets` off `origin/main` → PR → squash-merge (no force-push). Owner ratifies the SLO targets in `docs/v3/slos.md`. **30-day soak after merge** to capture the first SLO baseline and confirm no false-positive burn alerts before V3-95 asserts the budgets. The `slo_budget_snapshots` migration stays committed-not-applied until the owner applies it as a deliberate activation step.

## Final report contract

`.codex-temp/v3-89-observability-traces-slos-budgets/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the first captured SLO baseline numbers + the trace-stitch evidence (a Sentry trace id matched to a `henry_events` row).

## Self-verification

- [ ] `@henryco/observability/tracing` ships `withSpan` / `withTraceContext` / `injectTraceHeaders`; span attributes redacted via `defaultRedactor`; sample rate environment-driven (10% prod / 100% preview), not hardcoded.
- [ ] Auth, payment, search, notification journeys wrapped at the entry seam; W3C trace context propagated route → Supabase → outbound fetch; trace id stitched to `emitEvent` `traceId`.
- [ ] `docs/v3/slos.md` defines one SLO per critical journey with SLI, source, thresholds, owner; owner-ratified.
- [ ] `slo-budget-eval` cron computes monthly burn, snapshots to `slo_budget_snapshots`, fires fast-burn (page) + slow-burn (warn) alerts.
- [ ] Lighthouse CI gates every PR per-route mobile + desktop (LCP/CLS/INP), CLS budget ≤ 0.02, > 5% regression fails; added as a required status check.
- [ ] Three `henry.observability.*` events added to the typed union + `docs/event-taxonomy.md`; payloads PII-free, low-cardinality.
- [ ] No business logic, product surface, or payment behaviour changed; no PII in any span/tag/report.
- [ ] `slo_budget_snapshots` migration committed, NOT applied. Report written; hand-off to V3-94 (re-runs these gates) noted.
