# V3-90 — Observability: Data Lake + Event Tracking

**Pass ID:** V3-90 | **Phase:** I | **Pillar:** P12
**Deps:** V3-43 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Data Lake engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P12: "Data lake + event tracking foundation." Already, `@henryco/intelligence` emits `henry.*` events. This pass adds durable sink + BI access + PII redaction.

## Mandatory scope

1. **Event sink**: every `emitEvent` from `@henryco/observability` written to a queryable store:
   - Option A (recommended): Supabase as warehouse (`henry_events_raw` table with JSONB).
   - Option B: External warehouse (BigQuery / Snowflake) — heavier; consider when scale demands.

2. **Partitioning**: by date for query efficiency.

3. **PII redaction at ingest**: enforced via `@henryco/observability/redaction`.

4. **BI views**: pre-computed materialized views for common queries (DAU/WAU/MAU, funnels, retention).

5. **Owner BI access**: Metabase or similar self-hosted; owner can query via SQL or visual builder.

6. **Retention policy**: raw events 90 days; aggregated views indefinite.

7. **Telemetry** — `henry.data_lake.event.ingested`, `henry.data_lake.view.refreshed`, `henry.data_lake.query.executed`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed:
- Supabase service-role for raw insert.
- `METABASE_URL`, `METABASE_API_KEY` (NEW — added to INTEGRATION-KEYS.md if Option A chosen).

NEW env vars (if Metabase): `METABASE_URL`, `METABASE_API_KEY`, `METABASE_SECRET_KEY` (for embedded dashboards).

ZERO hardcoded warehouse URLs.

## Out of scope
- A/B testing (V3-91 builds on this).
- Analytics exports (V3-82 builds on this).
- Backup formalization (V3-92).
- Privacy data rights (V3-93).

## Dependencies
V3-43.

## Inheritance
@henryco/observability/events; @henryco/intelligence event taxonomy.

## Trust / safety / compliance
- PII redaction enforced at ingest (ANTI-CLONE Principle 6 + V3-93 prep).
- Owner-only BI access; finance-staff via specific views.
- ANTI-CLONE Principle 10 (event stream = data moat).

## Mobile + desktop parity
Mobile events flow into same sink.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. **Event ingestion smoke** — events emitted reach store within 1 minute.
3. **PII redaction** verified.
4. **BI views** render expected data.
5. **Retention policy** test (synthetic 91-day-old event purged).

## Deployment gate
- 30-day soak; first month of data captured.

## Final report contract
Standard.

## Self-verification
- [ ] Sink live with partitioning.
- [ ] PII redaction.
- [ ] BI views + access.
- [ ] Retention policy.
- [ ] 3 new telemetry events.
- [ ] Report written.
