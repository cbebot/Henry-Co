# V3-90 — Observability: Data Lake + Event Tracking

**Pass ID:** V3-90  ·  **Phase:** I (Platform/API · Global/Mobile · Observability · Closure)  ·  **Pillar:** P12 (Trust, Reliability & Foundation)
**Dependencies:** V3-43 (workflow engine foundation — the durable rail that drains events to the sink)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Data Lake engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass gives the company a durable, queryable, PII-redacted home for its event stream: every `emitEvent` from `@henryco/observability` lands in a partitioned warehouse table, pre-computed BI views answer the standing questions (DAU/WAU/MAU, funnels, retention, per-division mix), and the owner gets governed SQL + visual access — without ever storing a raw identifier the redaction layer was built to strip. The line it must not cross: it builds **the sink, the views, and the access** — it does not build A/B testing (V3-91), analytics exports (V3-82), backup formalisation (V3-92), or privacy data-rights tooling (V3-93). It is the data moat, redacted at ingest.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/90-observability-data-lake-and-event-tracking` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The event stream already exists in canonical, typed form. `@henryco/observability/events.ts` defines `emitEvent` over the `HenryEventName` string-literal union (`henry.<domain>.<noun>.<verb>`), which today fans out to two best-effort sinks: a pino structured log line + a Sentry breadcrumb. A queryable persistence path also exists but is deliberately minimal — `@henryco/observability/persist-event.ts` writes to `public.henry_events` (V3-01 migration `20260522103000_v3_01_henry_events.sql`: `id`, `name`, `actor_id` nullable FK to `auth.users`, `payload jsonb`, `created_at`; RLS insert-own, select service-role; indexed on `(name, created_at desc)` and `actor_id`). The redaction layer is real and shared: `createRedactor` / `defaultRedactor` walk a payload and replace `DEFAULT_REDACT_KEYS` (email/phone/address/NIN/BVN/token/secret/card/IBAN/account-number) with `[redacted]`. The canonical analytics writer (`buildCanonicalActivityMetadata` in `packages/intelligence/src/analytics.ts`) shares the same event names, so a join is trivial. **What is missing:** `henry_events` is a thin owner-tile sink, not a warehouse — it is unpartitioned (a single growing heap), has no enforced redaction at write time (callers must remember to redact), no retention policy, no pre-computed BI views, and no governed analyst/owner read path beyond a service-role admin client. The gap this pass closes: turn "a minimal events table + scattered logs" into "a partitioned, redaction-enforced event lake with materialized BI views and governed access."

## Mandatory scope

### S1 — Event sink: partitioned warehouse table (`henry_events_raw`)

**Decision (recommended, default unless owner overrides):** Supabase-as-warehouse — keep the data on our own infra, no new vendor, no egress. An external warehouse (BigQuery / Snowflake) is Option B and is *not* adopted in this pass; the sink interface (S2) is warehouse-agnostic so a future migration is a sink swap, not a rewrite.

New migration `apps/hub/supabase/migrations/<ts>_henry_events_raw.sql` (**committed, owner-applied**) creating a `RANGE`-partitioned-by-`created_at` table:

```sql
create table if not exists public.henry_events_raw (
  id            uuid not null default gen_random_uuid(),
  name          text not null,                 -- canonical HenryEventName
  classification text,                          -- 'user_action' | 'system_state'
  outcome       text,
  actor_hash    text,                           -- HMAC(actor_id, EVENT_HASH_SALT) — NEVER the raw id
  division      text,
  trace_id      text,                           -- joins V3-89 spans
  payload       jsonb,                          -- REDACTED at ingest (S3)
  created_at    timestamptz not null default now()
) partition by range (created_at);

-- Monthly partitions, provisioned ahead by the maintenance cron (S6).
-- Hot-path index per partition: (name, created_at desc).
create index if not exists henry_events_raw_name_created_at_idx
  on public.henry_events_raw (name, created_at desc);

alter table public.henry_events_raw enable row level security;
grant select on public.henry_events_raw to service_role;
create policy henry_events_raw_select_service_role
  on public.henry_events_raw for select to service_role using (true);
```

Notes that are load-bearing:
- **`actor_hash`, never `actor_id`.** The raw user UUID does not enter the lake. The actor is stored as a salted HMAC (`EVENT_HASH_SALT`, server-secret) so cohort/retention math works (the same user hashes consistently) while the lake holds zero re-identifiable identifiers. This is the single design choice that makes the lake PII-safe by construction and pre-satisfies V3-93's "logs + events: PII redacted, identifiers removed."
- **Partition by month** for query efficiency and cheap retention (drop a partition, not a `DELETE`).
- The existing `public.henry_events` (V3-01 owner-tile sink) **stays as-is** — this pass adds the lake alongside it; it does not migrate or drop the V3-01 table. A backfill from `henry_events` into `henry_events_raw` is an optional, documented step (off by default).

### S2 — Sink writer in `@henryco/observability`

New module `packages/observability/src/data-lake.ts` (`exports` entry `"./data-lake": "./src/data-lake.ts"`). It is the single durable write path into the lake, drained through the V3-43 workflow engine so a transient DB blip is retried, not lost:

```typescript
export type LakeEventInput = {
  name: string;                 // canonical HenryEventName
  classification?: "user_action" | "system_state";
  outcome?: string;
  actorId?: string | null;      // hashed at the seam; never persisted raw
  division?: string | null;
  traceId?: string | null;      // stitches V3-89 spans
  payload?: Record<string, unknown> | null;  // redacted at the seam
};

/** Enqueue an event for durable, redacted, at-least-once delivery to
 *  henry_events_raw via the V3-43 workflow engine. Best-effort and
 *  silent on enqueue failure — telemetry must never break a request path. */
export async function sinkEvent(input: LakeEventInput): Promise<void>;
```

`sinkEvent` (a) runs `payload` through `defaultRedactor` **at the seam** (redaction is not the caller's responsibility), (b) replaces `actorId` with `hmac(actorId, EVENT_HASH_SALT)` → `actor_hash`, (c) enqueues a `henry-events-sink` workflow job (V3-43 `@henryco/workflow`) that drains a batch into `henry_events_raw`. Wire `emitEvent` to optionally call `sinkEvent` when a `sink: true` flag (or env `HENRY_EVENT_LAKE=1`) is set, so the lake fills from the existing emit sites with no call-site churn.

### S3 — PII redaction enforced at ingest

Redaction is mandatory and centralised — a caller cannot opt out:
- `sinkEvent` always runs `defaultRedactor` on `payload` before enqueue; the drain worker re-asserts redaction (defence in depth) before the `insert`.
- `actor_hash` replaces every raw id (S1).
- A unit test scans a corpus of representative payloads and asserts **no `DEFAULT_REDACT_KEYS` value and no raw UUID** survives into a `henry_events_raw` row.

### S4 — BI views (materialized, refreshed)

Pre-computed materialized views answering the standing owner questions, in a new migration `apps/hub/supabase/migrations/<ts>_henry_lake_bi_views.sql`:
- `mv_active_users_daily` — DAU/WAU/MAU from distinct `actor_hash` per day/7d/30d.
- `mv_event_funnel` — ordered-step conversion for the key funnels (e.g. `marketplace.checkout.started` → `marketplace.order.placed` → `marketplace.payment.verified`), parameterised by funnel definition rows.
- `mv_retention_cohorts` — weekly cohort retention by `actor_hash` first-seen week.
- `mv_division_mix` — event volume per `division` per day.

Views select from `henry_events_raw` only (never a raw identity table). `REFRESH MATERIALIZED VIEW CONCURRENTLY` is driven by the S6 maintenance cron (nightly), emitting `henry.data_lake.view.refreshed`.

### S5 — Governed owner / analyst access

Owner BI access without exposing the service role or raw infra:
- **Default:** a read-only Postgres role `henry_bi_reader` granted `SELECT` on the BI views **only** (never `henry_events_raw` directly, never any identity table), connected from a self-hosted Metabase. The Metabase connection string and the role are documented in `docs/v3/INTEGRATION-KEYS.md`; **zero hardcoded warehouse URLs** — `METABASE_URL` / `METABASE_API_KEY` / `METABASE_SECRET_KEY` (embedded dashboards) are env-only, added to `INTEGRATION-KEYS.md`.
- An owner-workspace tile (`apps/hub` owner surface) renders the headline BI numbers (DAU/WAU/MAU, top funnels) by reading the views via the admin client — finance/owner only, gated by the established owner predicate; **no customer-level drill-down** (the lake holds only `actor_hash`, so it cannot).
- Every analyst query against the views logs `henry.data_lake.query.executed` (S7) for the audit trail.

### S6 — Retention + partition maintenance

A cron route `apps/hub/app/api/cron/lake-maintenance/route.ts` (`runtime = "nodejs"`, `Authorization: Bearer ${CRON_SECRET}`) that nightly: (a) provisions next month's `henry_events_raw` partition ahead of time, (b) **drops partitions older than 90 days** (raw-event retention = 90 days; the aggregated BI views are retained indefinitely — they hold no PII), (c) `REFRESH MATERIALIZED VIEW CONCURRENTLY` on the S4 views, (d) emits `henry.data_lake.view.refreshed`. The 90-day raw retention is config-driven (a `lake_retention_days` config row), **never a hardcoded literal**.

### S7 — Telemetry

Three new events, added to the `HenryEventName` union in `packages/observability/src/events.ts` and `docs/event-taxonomy.md`:

```
henry.data_lake.event.ingested   (system_state · completed)  — a batch drained into henry_events_raw
henry.data_lake.view.refreshed   (system_state · completed)  — a BI materialized view refreshed
henry.data_lake.query.executed   (system_state · completed)  — an analyst query ran against a BI view
```

## Out of scope

- A/B testing + experiment lifecycle (**V3-91** — builds on this lake's exposure/conversion events).
- Partner-scoped analytics exports / scheduled CSV+JSON deliveries (**V3-82** — builds on this lake).
- Backup runbooks, RPO/RTO, off-site replica (**V3-92** — formalises backup of this and every store).
- DSAR / deletion / consent ledger (**V3-93** — the `actor_hash` design pre-satisfies its "identifiers removed from events" requirement; the DSAR endpoint itself is V3-93).
- Migrating to an external warehouse (BigQuery/Snowflake) — Option B, not adopted here; the sink interface is left warehouse-agnostic.

## Dependencies

- **Requires:** V3-43 (`@henryco/workflow` — the durable enqueue/drain/retry/dead-letter rail `sinkEvent` uses for at-least-once delivery).
- **Blocks:** V3-82 (analytics exports read the BI views), V3-91 (A/B exposure/conversion tracked through this lake), V3-92 (backup formalisation includes this store), V3-93 (DSAR export can join `actor_hash` to a user; the lake's redaction is part of the compliance story), V3-94 (closure asserts the lake is live + redacted).

## Inheritance

- `@henryco/observability` — `emitEvent` + the `HenryEventName` typed taxonomy (the source stream), `defaultRedactor` / `DEFAULT_REDACT_KEYS` (ingest redaction), `persist-event.ts` + `henry_events` (the V3-01 minimal sink this extends alongside), the structured `logger`.
- `@henryco/workflow` (V3-43) — the durable drain rail for `sinkEvent`.
- `packages/intelligence/src/analytics.ts` `buildCanonicalActivityMetadata` — shares canonical event names; the lake join is trivial.
- The V3-89 `trace_id` stitch — lake rows carry the trace id so a span timeline joins an event.

## Implementation requirements

### Files

The `henry_events_raw` partitioned migration (S1, committed/owner-applied); `packages/observability/src/data-lake.ts` + the `exports` entry (S2); the redaction-enforcement test (S3); the BI-views migration (S4); the `henry_bi_reader` role + Metabase wiring docs + owner tile (S5); `apps/hub/app/api/cron/lake-maintenance/route.ts` + the `lake_retention_days` config row (S6); the three taxonomy entries (S7); `docs/v3/data-lake-architecture.md` (the sink → partition → view → access map). New env in `docs/v3/INTEGRATION-KEYS.md`: `EVENT_HASH_SALT`, `METABASE_URL`, `METABASE_API_KEY`, `METABASE_SECRET_KEY`.

### Trust / safety / compliance

The lake is PII-safe by construction (ANTI-CLONE Principle 6 — secret/key separation; Principle 10 — the event stream is the data moat; Principle 12 — observable, auditable): `payload` is redacted at the `sinkEvent` seam **and** re-asserted at the drain worker; the raw `actor_id` is never persisted — only its salted HMAC (`EVENT_HASH_SALT`, server-secret, never client-bundled, never hardcoded). Access is governed: owner/analyst read the BI views through `henry_bi_reader` (views only, no raw table, no identity table); customer-level drill-down is impossible because the lake holds only `actor_hash`. Every analyst query is logged. Raw-event retention is 90 days (config-driven); aggregated views (PII-free) are kept indefinitely.

### Mobile + desktop parity

Events emitted from the Expo super-app flow into the same `sinkEvent` path (the mobile client's server-side handlers call `emitEvent`/`sinkEvent` identically). The lake is form-factor-agnostic; a `device` low-cardinality attribute (web/ios/android) on the payload supports per-platform BI without any PII.

### i18n

N/A — the lake stores operator/analytics data, renders no customer-facing copy. The owner-workspace BI tile labels route through `@henryco/i18n` namespace `surface:observability` (owner surface) so even operator labels are translatable; numbers and event names are non-translatable tokens.

### Brand & design system

The owner BI tile inherits the locked owner-workspace design tokens + Fraunces; any link in the tile (e.g. "open in Metabase") resolves through `@henryco/config` helpers (`getHqUrl()` / `getStaffHqUrl()`) or the env-sourced `METABASE_URL` — never a literal domain. No public/customer brand surface is touched.

## Validation gates

1. **Standard CI** — typecheck, lint, test, build (`Lint, typecheck, test, build`, the required branch-protection context).
2. **Event ingestion smoke** — an event emitted via `emitEvent`/`sinkEvent` reaches `henry_events_raw` within one minute (drained through the V3-43 engine), and emits `henry.data_lake.event.ingested`.
3. **Redaction verified at ingest** — the S3 test proves no `DEFAULT_REDACT_KEYS` value and no raw UUID survives into a row; `actor_hash` is an HMAC, not the id.
4. **BI views render expected data** — `mv_active_users_daily` / `mv_event_funnel` / `mv_retention_cohorts` / `mv_division_mix` return correct numbers against a seeded corpus; the owner tile renders them.
5. **Retention + partitioning** — `lake-maintenance` provisions the next partition, drops a synthetic 91-day-old partition, refreshes the views (emits `henry.data_lake.view.refreshed`); the `lake_retention_days` config drives the cutoff (no literal).
6. **Governed access** — `henry_bi_reader` can `SELECT` the views and is denied `SELECT` on `henry_events_raw` and on any identity table; an analyst query emits `henry.data_lake.query.executed`.

## Deployment gate

All gates green; the required check passing; branch `v3/90-observability-data-lake-and-event-tracking` off `origin/main` → PR → squash-merge (no force-push). The `henry_events_raw` + BI-views migrations stay committed-not-applied until the owner applies them as a deliberate activation step (the lake fills only once applied + `HENRY_EVENT_LAKE=1`). **30-day soak** to capture the first month of data and confirm partition rotation + view refresh run clean before V3-82/V3-91 build on the lake.

## Final report contract

`.codex-temp/v3-90-observability-data-lake-and-event-tracking/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the redaction-proof evidence (a sample row showing `[redacted]` payload + HMAC `actor_hash`) + the first BI-view output.

## Self-verification

- [ ] `henry_events_raw` partitioned-by-month; stores `actor_hash` (HMAC), never raw `actor_id`; service-role read only; migration committed, NOT applied.
- [ ] `@henryco/observability/data-lake` ships `sinkEvent`; redacts payload + hashes actor at the seam; drains via the V3-43 workflow engine (at-least-once); `emitEvent` wired to fill the lake under a flag.
- [ ] Ingest redaction enforced + re-asserted at drain; test proves no PII / no raw UUID lands.
- [ ] Four materialized BI views (DAU/WAU/MAU, funnel, retention, division mix) refresh nightly via the maintenance cron.
- [ ] Governed access: `henry_bi_reader` reads views only; owner tile reads via admin client; every analyst query logged; no customer drill-down possible.
- [ ] Retention 90 days raw (config-driven, partition-drop) / indefinite aggregated; next partition provisioned ahead.
- [ ] Three `henry.data_lake.*` events added to the typed union + `docs/event-taxonomy.md`.
- [ ] Zero hardcoded warehouse/Metabase URLs (env-only); `EVENT_HASH_SALT` server-secret. Report written; hand-off to V3-82 / V3-91 / V3-93 noted.
