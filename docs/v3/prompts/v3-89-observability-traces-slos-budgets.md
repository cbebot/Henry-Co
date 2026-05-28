# V3-89 — Observability: Traces, SLOs, Performance Budgets

**Pass ID:** V3-89 | **Phase:** I | **Pillar:** P12
**Deps:** V3-10 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Observability Depth engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3-10 shipped Sentry + logger adoption. This pass adds OpenTelemetry traces, SLO definitions, error budgets, performance budget enforcement.

## Mandatory scope

1. **Distributed traces**:
   - OpenTelemetry SDK in every web app.
   - Trace context propagated across Next route handlers + Supabase calls + external API calls.
   - Sample rate 10% in production, 100% in preview/staging.
   - Trace data → Sentry Performance.

2. **SLO definitions**:
   - Per critical user journey: auth success rate ≥ 99.9%, checkout success ≥ 99.5%, search response ≤ 500ms p95, etc.
   - Documented in `docs/v3/slos.md`.

3. **Error budget tracking**: monthly burn-rate per SLO; alert at 75% burn.

4. **Performance budget enforcement on PR**:
   - Lighthouse CI runs on every Vercel preview.
   - Fails PR if regression > 5% on any metric (LCP, CLS, INP).
   - Mobile + desktop budgets per route.

5. **Anomaly alerts** via Sentry + Slack/email.

6. **Telemetry** — `henry.observability.trace.sampled`, `henry.observability.slo.breach`, `henry.observability.performance.regression`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed:
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` per app.
- `SENTRY_AUTH_TOKEN` for CI source-map upload.
- (Optional) `LIGHTHOUSE_CI_TOKEN` if using Lighthouse CI server.

NEW env vars: none beyond INTEGRATION-KEYS.md inventory.

## Out of scope
- Data lake (V3-90).
- A/B testing framework (V3-91).

## Dependencies
V3-10.

## Inheritance
@henryco/observability (extend); Sentry config builders.

## Trust / safety / compliance
- PII never in trace data (redaction enforced).
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Web + Expo both instrumented.

## i18n
N/A.

## Validation gates
1. **Trace context** smoke — request traversal traced end-to-end.
2. **SLO doc** complete + owner-reviewed.
3. **Performance budget PR gate** active.
4. **Anomaly alert** fires on synthetic spike.

## Deployment gate
- 30-day soak; first SLO baseline captured.

## Final report contract
Standard.

## Self-verification
- [ ] OpenTelemetry in all apps.
- [ ] SLO doc + error budget tracking.
- [ ] Performance budgets on PR.
- [ ] Anomaly alerts.
- [ ] 3 new telemetry events.
- [ ] Report written.
