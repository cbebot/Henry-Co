# V3-82 — Platform/API: Analytics Exports

**Pass ID:** V3-82  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P11 (Platform & API Layer), P12 (Reliability & Foundation)
**Dependencies:** V3-90  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Platform/API engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the one shared, partner-scoped analytics-export service: a partner requests a CSV or JSON extract of the data *they own* (orders, products, bookings, transactions), or subscribes to a recurring daily/weekly/monthly delivery, and receives a signed-URL file by email, S3 push, or webhook. The line it must not cross: it reads from the V3-90 event lake and the partner's owned rows only — it computes no new analytics, defines no new domain events, and **never** emits a row a partner does not own or a PII column a partner has not been explicitly granted. Redaction is on by default; un-redaction is an opt-in scope, never a default.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/82-platform-analytics-exports` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The platform has no partner-facing data-export capability today. The substrate this pass stands on, however, is real and landed/queued:

- **V3-76 (public API foundation)** ships `api_keys` + `api_scopes` (SHA-256-hashed keys, `scopes TEXT[]`, per-key rate limits), the `partners` table, `packages/api-gateway` (`withApiGateway` — key verification, scope enforcement, `api_call_log`, standardized error envelope with correlation id + `X-API-Version`), and the partner key-management UI at `apps/account/app/(account)/api-keys/page.tsx`. This pass adds two scopes (`read:analytics`, `read:analytics:pii`) and wraps every endpoint in `withApiGateway`.
- **V3-90 (data lake + event tracking)** lands the durable sink — `henry_events_raw` (JSONB, date-partitioned) plus pre-computed materialized BI views (DAU/WAU/MAU, funnels, retention) — and enforces **PII redaction at ingest** via `@henryco/observability/redaction` (`createRedactor`, depth-first key-redaction with cycle protection). This pass is the partner-scoped read surface *over* that lake plus the partners' owned operational tables; it is the second consumer of the lake after the owner BI tool.
- **`@henryco/observability`** provides `emitEvent` (typed `HenryEventName` union in `packages/observability/src/events.ts`, format `henry.<domain>.<entity>.<verb>`, kept in lockstep with `docs/event-taxonomy.md`), `writeAuditLog` (`packages/observability/src/audit-log.ts`, correlation-id stamped), and `createRedactor` (`packages/observability/src/redaction.ts`).
- **V3-81 (webhook delivery)** ships `packages/webhooks` (`publishWebhook`, HMAC-SHA256 signed-timestamp delivery, retry, dead-letter, SSRF guard). When a partner picks **webhook** as a delivery channel, this pass reuses that transport rather than re-implementing signing/retry.
- **`@henryco/config`** owns every URL via `henryDomain()` / `henryWebRoot()` / `henrySubdomain()` (`packages/config/domain.ts`) and the brand strings via `COMPANY` (`packages/config/company.ts`). Zero hardcoded domains/brand.

The gap V3-82 closes: a partner cannot get their own data out of the platform in a machine-portable form, on a schedule, without a human pulling it. This pass gives partners self-serve CSV/JSON exports — one-off or scheduled — strictly scoped to rows they own, PII-redacted unless they hold the explicit PII scope, delivered by email/S3/webhook, with every export request and delivery audited and telemetered.

## Mandatory scope

### S1 — Export job + schedule schema
```sql
-- One-off and scheduled-instance export jobs.
CREATE TABLE analytics_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners,
  api_key_id UUID REFERENCES api_keys,            -- key that requested it (one-off) or owns the schedule
  schedule_id UUID REFERENCES analytics_export_schedules ON DELETE SET NULL,
  entity TEXT NOT NULL                            -- 'orders' | 'products' | 'bookings' | 'transactions'
    CHECK (entity IN ('orders','products','bookings','transactions')),
  format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv','json')),
  include_pii BOOLEAN NOT NULL DEFAULT false,     -- only honoured if key holds read:analytics:pii
  range_from TIMESTAMPTZ NOT NULL,                -- bounded window; open-ended ranges rejected
  range_to TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','succeeded','failed','expired')),
  row_count INTEGER,
  byte_size BIGINT,
  storage_path TEXT,                              -- Supabase Storage object key (private bucket)
  error TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ                          -- file + signed URL lifetime (default now()+7d)
);

-- Recurring delivery subscriptions.
CREATE TABLE analytics_export_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners,
  api_key_id UUID REFERENCES api_keys,
  entity TEXT NOT NULL CHECK (entity IN ('orders','products','bookings','transactions')),
  format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv','json')),
  include_pii BOOLEAN NOT NULL DEFAULT false,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly','monthly')),
  channel TEXT NOT NULL CHECK (channel IN ('email','s3','webhook')),
  channel_config JSONB NOT NULL DEFAULT '{}',     -- email: {to}; s3: {bucket,prefix,region}; webhook: {subscription_id}
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','revoked')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
RLS: a partner reads/writes only rows where `partner_id` matches the partner resolved from their API key (scoped through `api_keys`). The export worker uses the service role. `range_to - range_from` must be bounded (reject open-ended or windows wider than a configurable max, default 366 days). `include_pii = true` is rejected at insert unless the requesting key holds `read:analytics:pii`. Apply migration as `supabase/migrations/<ts>_v3_82_analytics_exports.sql`; create `analytics_export_schedules` before `analytics_export_jobs` (FK order).

### S2 — Export builder (scoped, redacted, streamed)
```ts
// packages/analytics-export/src/build.ts
export type ExportEntity = 'orders' | 'products' | 'bookings' | 'transactions';
export type ExportFormat = 'csv' | 'json';

export interface ExportRequest {
  partnerId: string;
  entity: ExportEntity;
  format: ExportFormat;
  includePii: boolean;          // already authorized against read:analytics:pii by the caller
  rangeFrom: string;            // ISO-8601
  rangeTo: string;              // ISO-8601
}

export interface ExportResult {
  storagePath: string;          // private-bucket object key
  rowCount: number;
  byteSize: number;
}

/** Streams the partner's owned rows for `entity` within [rangeFrom, rangeTo],
 *  redacts PII unless includePii, serialises to CSV (flat, one row per entity)
 *  or JSON (structured with relations), and writes to a PRIVATE Storage object.
 *  Never selects rows the partner does not own; never emits a PII column when
 *  includePii is false. Returns the object key for signed-URL issuance. */
export async function buildExport(req: ExportRequest): Promise<ExportResult>;
```
The builder queries the partner-owned data via a per-entity scoped query (each entity has an explicit owning-column join to `partner_id`; never a cross-partner table scan). CSV = flat columns per entity; JSON = structured with relations (e.g. an order carries its line items). It applies `createRedactor({ extra: [...] })` to strip PII keys **unless** `includePii` is true and the caller already verified the `read:analytics:pii` scope. Large extracts stream to a Supabase Storage object in a **private** bucket (`analytics-exports/`) — never inlined in an HTTP body, never a public URL. The column set per entity is fixed and documented in `docs/api/analytics-export-columns.md` (one table per entity, PII columns flagged).

### S3 — Request + status API (gateway-wrapped)
Partner-facing endpoints under `apps/account/app/api/v1/analytics/exports/`, every handler wrapped in `withApiGateway` (V3-76), scope `read:analytics` for non-PII, `read:analytics:pii` additionally required when `include_pii=true`:
- `POST /api/v1/analytics/exports` — enqueue a one-off export `{ entity, format, include_pii?, range_from, range_to }`; returns `{ job_id, status: 'pending' }`. Idempotency: an `Idempotency-Key` header (or a content hash of the body) collapses duplicate submissions to one job.
- `GET /api/v1/analytics/exports/{job_id}` — poll status; when `succeeded`, returns a **short-lived signed URL** (Supabase Storage signed URL, ≤ `expires_at`) to download the file. Never returns a public or permanent URL.
- `GET /api/v1/analytics/exports?status=&cursor=` — paginated list of the partner's own jobs.
- `POST /api/v1/analytics/schedules` / `GET` / `PATCH /{id}` (pause/resume/update) / `DELETE /{id}` (revoke) — manage recurring schedules; webhook channel references a V3-81 `webhook_subscriptions.id` owned by the same partner.

### S4 — Scheduled-delivery worker
A cron-driven drain (reusing the V3-43 workflow-engine outbox/retry primitives where merged; until then a self-contained Vercel cron at `apps/account/app/api/cron/analytics-export-delivery/route.ts` with the same retry contract + `vercel.json` entry) that:
- Claims `analytics_export_schedules` rows where `next_run_at <= now()` and `status='active'`, computes the window for the cadence, creates an `analytics_export_jobs` row, runs `buildExport`, then advances `next_run_at`.
- Delivers per `channel`:
  - **email** → send a transactional email (existing email infra) containing a short-lived signed URL — the file is never attached; copy/subject via i18n; from-identity via `@henryco/config` brand emails, never hardcoded.
  - **s3** → push the object to the partner's `{bucket,prefix,region}` using partner-supplied credentials stored server-side (never in `channel_config` plaintext in the DB).
  - **webhook** → `publishWebhook` (V3-81) an `analytics.export.ready` envelope carrying `{ job_id, entity, signed_url, expires_at, row_count }`; the V3-81 transport signs + retries + dead-letters.
- A failed run sets the job `failed`, records `error`, retries on the workflow-engine backoff, and after exhaustion surfaces the failure to the partner (never silently dropped).

### S5 — Retention + expiry
Export objects and their signed URLs are ephemeral: `expires_at` defaults to `now() + 7 days`. A maintenance cron (`apps/account/app/api/cron/analytics-export-reaper/route.ts`) marks elapsed jobs `expired`, deletes the Storage object, and nulls `storage_path`. No partner-export file lives indefinitely. (The V3-90 lake owns raw-event retention; this pass owns only its own generated export artifacts.)

### S6 — Telemetry
Add to the `HenryEventName` union in `packages/observability/src/events.ts` + `docs/event-taxonomy.md`:
- `henry.analytics.export.requested`
- `henry.analytics.export.delivered`
- `henry.analytics.export.failed`
- `henry.analytics.schedule.created`
- `henry.analytics.schedule.revoked`

`requested` fires on enqueue; `delivered` on a successful one-off completion or scheduled delivery; `failed` on terminal failure. Every event payload is redacted via `createRedactor` (partner id, entity, format, row count, channel — **never** the rows, never PII, never the signed URL). A PII-scoped export (`include_pii=true`) additionally writes a `writeAuditLog` row recording the requesting key + entity + range, so every privileged data egress has a durable, queryable record.

## Out of scope
- The event lake itself, raw-event retention, owner BI tool, and BI materialized views — **V3-90** (this pass reads from it).
- The API gateway, `api_keys`/`api_scopes`, rate limiter, key-management page shell — **V3-76** (this pass adds two scopes + a tab).
- Webhook signing/retry/dead-letter transport — **V3-81** (this pass calls `publishWebhook` for the webhook channel).
- A/B testing framework — **V3-91**.
- Privacy data-rights / DSAR / consent ledger — **V3-93** (this pass enforces redaction-by-default and audits PII egress, but the formal data-rights workflow is V3-93).
- Developer docs/guide for the export API — **V3-83** (this pass ships the OpenAPI fragment + example clients it consumes).
- Partner BI tooling — partners bring their own; this pass only emits the data.

## Dependencies
**Depends on:** V3-90 (event lake + ingest-time redaction). **Hard-uses:** V3-76 (gateway, scopes table, `partners`/`api_keys`, key-management host). **Soft-reuses:** V3-43 (workflow retry/outbox), V3-81 (webhook transport for the webhook channel). **Blocks:** V3-83 docs (consume this pass's OpenAPI fragment + analytics-export guide inputs).

## Inheritance
- `packages/api-gateway` (`withApiGateway`, scope-map, error envelope, `api_call_log`) — V3-76.
- `henry_events_raw` + BI views + `@henryco/observability/redaction` ingest contract — V3-90.
- `@henryco/observability` — `emitEvent` + `HenryEventName`, `writeAuditLog`, `createRedactor`.
- `packages/webhooks` (`publishWebhook`) — V3-81, for the webhook delivery channel.
- `@henryco/config` — `henrySubdomain`/`henryDomain`/`henryWebRoot` for any internal URL; `COMPANY` brand emails for the email from-identity.
- Existing transactional-email infra for the email channel; Supabase Storage (private bucket) for export artifacts.

## Implementation requirements
### Files
- `packages/analytics-export/src/` — `build.ts` (S2 builder + per-entity scoped queries), `csv.ts` (flat serializer), `json.ts` (structured serializer), `columns.ts` (per-entity column maps + PII flags), `index.ts`.
- `apps/account/app/api/v1/analytics/exports/route.ts` + `[job_id]/route.ts`.
- `apps/account/app/api/v1/analytics/schedules/route.ts` + `[id]/route.ts`.
- `apps/account/app/api/cron/analytics-export-delivery/route.ts` (S4) + `apps/account/app/api/cron/analytics-export-reaper/route.ts` (S5) + `vercel.json` cron entries.
- `apps/account/app/(account)/api-keys/exports/page.tsx` (management tab inside the V3-76 key-management page: request a one-off export, list jobs + download, manage schedules).
- `supabase/migrations/<ts>_v3_82_analytics_exports.sql` (S1 tables + RLS + 2 scope seeds in `api_scopes`).
- `packages/observability/src/events.ts` (5 events) + `docs/event-taxonomy.md`.
- `docs/api/openapi/analytics-exports.yaml` + `docs/api/examples/analytics-exports/{typescript,python,ruby}/` (request-export + poll-for-signed-URL snippet in each language) + `docs/api/analytics-export-columns.md`.

### Trust / safety / compliance
- **Partner-scoping is absolute:** every query is filtered to the partner resolved from the API key via RLS; no cross-partner table scan exists in the code path. An RLS test proves partner A cannot export partner B's data.
- **PII redaction is on by default:** `include_pii=true` is honoured only when the key holds `read:analytics:pii`; otherwise rejected at the API boundary, never silently downgraded. Redaction uses `createRedactor`; the column map flags every PII column.
- **Every PII-scoped egress is audited** (`writeAuditLog`): key, entity, range, row count.
- **Export artifacts are ephemeral + private:** private Storage bucket, short-lived signed URLs only (never public/permanent), `expires_at` reaped.
- **Idempotency** on one-off requests (`Idempotency-Key`/body-hash) so a retried POST does not double-bill compute or double-deliver.
- **S3 credentials** for the s3 channel are stored server-side (secret store), never in `channel_config` DB plaintext; redact them from all logs/telemetry.
- Gateway rate limits on all endpoints; scope enforced per-route. No row data, no PII, and no signed URL ever appears in a log line or telemetry payload.

### Mobile + desktop parity
The exports management tab inherits the V3-76 account-app chrome and is responsive (mobile + desktop) using design-system tokens (`--site-*`/`--accent`, Fraunces for headings per the public/editorial recipe, system-sans body); light + dark; CLS≈0; `pnpm a11y:contrast` not regressed. The export engine + crons are headless (N/A). Expo super-app: no native surface in this pass; the tab is web-only.

### i18n
The exports management UI and the delivery email use `@henryco/i18n` namespace `surface:analytics-exports` — every label, status (`pending`/`running`/`succeeded`/`failed`/`expired`/`active`/`paused`/`revoked`), cadence label, channel label, button, email subject/body, and error message is translated; 12 locales; zero hardcoded strings. API response bodies, `entity`/`format`/`channel`/error-`code` tokens, and CSV/JSON column headers are machine-facing English-by-contract and exempted in `docs/v3/i18n-gaps/exempt.json` with a pointer to this pass.

### Brand & design system
The management tab and the delivery email render the Henry Onyx brand strictly via `@henryco/config` (group/division labels, brand from-email), never a hardcoded brand string and never the retired "Henry & Co.". The `analytics.export.ready` webhook header/wire identifiers correctly keep the **code shorthand** "HenryCo"/`@henryco` (machine-facing, invisible to users — unchanged per the brand rule). Zero hardcoded domains: every internal URL via `henrySubdomain`/`henryDomain`/`henryWebRoot`; the only external destinations are partner-owned (their S3 bucket / their webhook URL, SSRF-guarded by V3-81). UI uses Fraunces + locked tokens; no ad-hoc hex.

## Validation gates
1. **CI:** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` green.
2. **Format smoke (~4):** a CSV export of `orders` is flat + parseable; a JSON export of `orders` carries relations; both round-trip a known fixture row set with the documented columns.
3. **Partner-scoping RLS test (~3):** partner A's export contains only partner A's rows; partner A cannot request an export for partner B; the worker (service role) writes only the requesting partner's artifact.
4. **PII redaction test (~3):** default export redacts every flagged PII column; `include_pii=true` without `read:analytics:pii` is rejected; with the scope, PII appears and a `writeAuditLog` row is written.
5. **Scheduled-delivery smoke (~3):** a daily schedule fires on cron, produces a job, and delivers via email (signed URL, no attachment), s3 (object pushed), and webhook (`publishWebhook` envelope signed by V3-81).
6. **Idempotency test:** a repeated `POST /exports` with the same `Idempotency-Key` yields one job.
7. **Retention/expiry test:** an export past `expires_at` is marked `expired`, the Storage object deleted, the signed URL no longer valid.
8. **Telemetry test:** the 5 `henry.analytics.*` events emit with redacted payloads; no row data/PII/signed URL in any payload.
9. **UI gates** for the management tab: real-browser light + dark, mobile + desktop, CLS≈0, contrast not regressed, all copy from `surface:analytics-exports`.
10. **OpenAPI validity:** `analytics-exports.yaml` passes a 3.1 linter; the 3 example clients run green against the sandbox.

## Deployment gate
All gates green; V3-90 and V3-76 merged to `main` (hard deps). The export builder + scheduled worker proven on the sandbox against a multi-partner fixture (including a partner with PII-flagged rows and a partner without the PII scope) and all three delivery channels. **14-day soak** on the sandbox before partner-facing exports are enabled in production — export correctness and scope-isolation are judged over time, not at a point. No owner sign-off required (no D-gate).

## Final report contract
`.codex-temp/v3-82-platform-analytics-exports/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] `analytics_export_jobs` + `analytics_export_schedules` shipped with RLS, bounded ranges, and PII-scope guard at insert (S1).
- [ ] `buildExport` streams partner-owned rows to a private Storage object, CSV-flat or JSON-with-relations, redacted unless authorized PII (S2).
- [ ] Request/status/schedule API gateway-wrapped, scope-enforced, idempotent, signed-URL-only downloads (S3).
- [ ] Scheduled-delivery worker delivers via email / s3 / webhook (webhook via `publishWebhook`), with retry + terminal-failure surfacing (S4).
- [ ] Export artifacts ephemeral: `expires_at` reaper deletes objects + invalidates signed URLs (S5).
- [ ] 5 new `henry.analytics.*` telemetry events in the typed union + taxonomy; every PII-scoped egress audited (S6).
- [ ] Partner-scoping proven by RLS test; no cross-partner scan in the code path.
- [ ] PII redaction on by default; un-redaction gated by `read:analytics:pii` + audited; no row data/PII/signed URL in any log or telemetry.
- [ ] Management tab + email: Henry Onyx brand via `@henryco/config`, `surface:analytics-exports` i18n (12 locales), locked tokens, light+dark, mobile+desktop, CLS≈0, contrast intact; zero hardcoded domains/strings.
- [ ] OpenAPI 3.1 fragment + TS/Python/Ruby example clients + column doc shipped and green.
- [ ] Report written at the path above.
