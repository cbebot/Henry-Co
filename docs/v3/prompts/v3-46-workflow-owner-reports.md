# V3-46 — Automation & Workflow: Auto-Generate Owner Reports

**Pass ID:** V3-46  ·  **Phase:** F (Automation & Workflow)  ·  **Pillar:** P5 (Automation & Workflow Engine)
**Dependencies:** V3-43 (workflow engine foundation)  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-44/45/48)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Owner-Reports engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass **formalises** the existing owner-reporting machinery into a complete, scheduled report engine on the V3-43 rail: weekly + monthly + **quarterly** auto-generated reports (per-division breakdown + cross-division summary), plus an **on-demand custom report builder**, each rendered to a watermarked, owner-only PDF and persisted. It elevates `apps/hub/lib/owner-reporting.ts` (which already produces weekly + monthly) rather than rebuilding it. The line it must not cross: reports are **owner-only and watermarked** — no report is readable by non-owner staff, every PDF is provenance-marked, and signed-URL delivery is short-lived. This is internal financial truth; it must never leak.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/46-workflow-owner-reports` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Owner reporting already exists and ships weekly + monthly. The real surface: `apps/hub/lib/owner-reporting.ts` defines `OwnerReportKind = "weekly" | "monthly"`, pulls data via `getOwnerOverviewData` / `getFinanceCenterData` / `getMessagingCenterData` / `getOperationsCenterData` (from `apps/hub/lib/owner-data.ts`), renders through `OwnerReportDocument` + `renderDocumentToBuffer` + `buildDocumentFilename` (`@henryco/branded-documents`, which exports `OwnerReportProps`, `OwnerReportKind`, `ownerReportFormatKobo`, `OwnerReportMetric`, `OwnerReportDivisionPressure`, `OwnerReportSignalRow`, `OwnerReportPaymentRow`), stores into the `owner-reports` Supabase Storage bucket, emails the owner via `sendTransactionalEmail` (`@henryco/email`), and audits under entity type `owner_report`. The cron routes exist split as `apps/hub/app/api/cron/owner-reporting/{weekly,monthly}` and `apps/hub/app/api/cron/owner-reports`. What's missing: **no quarterly report, no on-demand custom builder, no unified scheduling through the durable engine, and the report is not yet watermarked**. The data also predates the later Phase C/D surfaces (payments router V3-13/15, ledger, KYC throughput, AI usage + margin, risk-score trends) — the section set needs to be the full owner picture. The gap this pass closes: turn "weekly + monthly emails fired by two ad-hoc crons" into "a complete weekly/monthly/quarterly + custom report engine on the V3-43 rail, watermarked, owner-only, with every section the owner actually needs."

## Mandatory scope

### S1 — `owner_reports` table (persistence + retrieval)

Migration `apps/hub/supabase/migrations/<ts>_owner_reports.sql` (if a persistence table isn't already present; reconcile with the existing `owner-reports` storage bucket usage):

```sql
create table public.owner_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('weekly','monthly','quarterly','custom')),
  period_start date not null,
  period_end date not null,
  sections text[] not null,           -- which sections were rendered (custom may be a subset)
  storage_path text not null,         -- object key in the 'owner-reports' bucket
  watermark_id text not null,         -- provenance token embedded in the PDF
  generated_at timestamptz not null default timezone('utc', now()),
  generated_by uuid references auth.users(id),  -- null for scheduled, owner id for custom
  opened_at timestamptz
);
```

RLS: **owner-only** — read/write predicate = `public.is_owner()` (the established owner predicate). No `is_platform_staff()` read here; finance truth is owner-only. The `owner-reports` storage bucket policy mirrors: only the owner (or a service-role signed-URL grant) reads objects.

### S2 — Quarterly report + full section set

Extend `OwnerReportKind` to add `"quarterly"` (and `"custom"`). Every report carries a per-division breakdown + a cross-division summary, with these sections (data pulled via `owner-data.ts` aggregators, extended where a source now exists):

- **Revenue + refunds + disputes** — by division / provider / country (sources: payment intents V3-13/15, refunds V3-19 when present, ledger V3-17 when present; degrade gracefully when a source isn't live yet).
- **User growth + retention.**
- **Partner growth + payouts** (when V3-69 lands; until then, partner-onboarding counts).
- **Support metrics + queue health** (from `workflow_queue_config` + V3-44/47 assignment state).
- **KYC throughput + approval rate** (from the trust/verification surface; V3-24 when live).
- **AI usage + margin** (from V3-27 when live; degrade gracefully).
- **Risk-score trends** (from `@henryco/intelligence` risk signals / V3-40 when live).
- **Anomaly callouts** — notable deltas vs the prior period.

Every section degrades gracefully to "not yet measured" rather than rendering a fake zero — the owner must distinguish "no data source yet" from "genuinely zero" (the V3-08 empty-state truth principle applies to reports too).

### S3 — Scheduled generation on the V3-43 rail

Register `"owner_report.weekly"`, `"owner_report.monthly"`, `"owner_report.quarterly"` handlers on the V3-43 engine. The existing weekly/monthly cron routes become thin `engine.enqueue` wrappers (preserving their schedules — Lagos-time period boundaries as `owner-reporting.ts` already computes via `Africa/Lagos`); add the quarterly schedule. Each handler: compute the period (Lagos TZ), aggregate sections, render the watermarked PDF, store in `owner-reports`, insert `owner_reports`, email the owner a **short-lived signed URL** (never the object key), audit under `owner_report`. Idempotent per (kind, period) via the engine's idempotency key.

### S4 — Custom report builder

`apps/hub/app/(owner)/reports/builder` (owner-only route) + `POST apps/hub/app/api/owner/reports/custom/route.ts`: the owner selects a subset of S2 sections + a date range; the route generates on demand using the same render path, persists with `kind='custom'`, and returns a signed URL. The route is owner-gated (`is_owner()` + the owner session guard) and rate-limited.

### S5 — Watermarking (provenance)

Every generated PDF embeds a `watermark_id` (per ANTI-CLONE Principle 5 — visible owner-attribution watermark + the persisted provenance token), via the `@henryco/branded-documents` render path. The watermark records "generated for <owner>, <timestamp>, report <id>" so a leaked PDF is traceable. The `watermark_id` is stored on the `owner_reports` row.

### S6 — Telemetry

Add to the `HenryEventName` union in `packages/observability/src/events.ts` (compile-enforced) + `docs/event-taxonomy.md`:

```
henry.owner_report.scheduled_generated     henry.owner_report.custom_generated     henry.owner_report.opened
```

`opened` fires when the owner opens the signed URL (sets `owner_reports.opened_at`). Payloads carry `kind`, `period`, `sections` count — no financial figures in telemetry.

## Out of scope

- Per-division reports for division operators (a separate later pass — this is owner-only cross-division truth).
- Public quarterly transparency report (V3-93 privacy / public surface).
- The workflow engine (V3-43). New finance computations beyond what the section sources already expose (the underlying ledger/refund/AI-margin truth is owned by V3-17/19/27 — this pass consumes them, degrading gracefully when absent).

## Dependencies

- **Requires:** V3-43 (engine + cron + idempotency).
- **Soft sources (degrade gracefully):** V3-13/15 (payments), V3-17 (ledger), V3-19 (refunds), V3-24 (KYC), V3-27 (AI margin), V3-40 (risk), V3-44/47 (queue health). The report renders today against whatever sources are live.
- **Blocks:** —.

## Inheritance

- `apps/hub/lib/owner-reporting.ts` + `owner-data.ts` aggregators — the existing weekly/monthly machinery, extended not rebuilt.
- `@henryco/branded-documents` — `OwnerReportDocument`, `OwnerReportKind`/`OwnerReportProps`/`OwnerReportMetric`/`OwnerReportDivisionPressure`/`OwnerReportSignalRow`/`OwnerReportPaymentRow`, `renderDocumentToBuffer`, `buildDocumentFilename`, `ownerReportFormatKobo`.
- `@henryco/email` — `sendTransactionalEmail`; the `owner-reports` storage bucket.
- `@henryco/workflow` (V3-43) — engine + scheduling; `@henryco/observability/audit-log` — `owner_report` audit entity.
- `public.is_owner()` — owner-only access predicate.

## Implementation requirements

### Files

The `owner_reports` migration + storage policy (S1); the extended `OwnerReportKind` + aggregators + section renderers (S2); the registered scheduled handlers + thin cron wrappers + quarterly schedule (S3); the builder route + owner page (S4); the watermark wiring (S5); the `events.ts` union additions + taxonomy doc (S6).

### Trust / safety / compliance

Owner-only end to end — `is_owner()` RLS on `owner_reports`, owner-session guard on the builder route, owner-only storage policy. Delivery is a **short-lived signed URL**, never a raw object key or a public URL. Every PDF is watermarked + provenance-tracked. Every generation (scheduled + custom) writes an `owner_report` audit row. Financial figures appear only inside the PDF — never in telemetry, never in a log line, never in an email body (the email carries the signed link only).

### Mobile + desktop parity

The PDF is device-agnostic (viewable anywhere). The builder page inherits the owner-workspace responsive chrome (usable on mobile + desktop). No Expo super-app surface (owner-only; the owner uses the web owner workspace). N/A for end-user mobile.

### i18n

The report renders in the **owner's locale** (`recipient-locale`); section headings + the email body route through `@henryco/i18n`, namespace **`surface:owner-reports`**. Numeric/currency formatting uses `ownerReportFormatKobo` + the locale formatter. Owner-only operator surface — Pattern A typed keys for the owner's locale.

### Brand & design system

The PDF uses the `@henryco/branded-documents` design tokens + Fraunces and the **Henry Onyx Limited** legal entity sourced from `@henryco/config` (`company.ts` `legalName`) on any legal/footer line — never hardcoded. The email uses the Henry Onyx sender identity from config. Every URL (signed link, builder link) resolves via `@henryco/config` helpers (`getHqUrl()`) — zero hardcoded domains.

## Validation gates

1. Standard CI: typecheck, lint, test, build (`Lint, typecheck, test, build`).
2. **Scheduled generation** — weekly, monthly, and quarterly handlers each fire on their schedule, compute correct Lagos-TZ period boundaries, and produce a stored + emailed report; idempotent per (kind, period).
3. **Custom generation** smoke — the builder produces an on-demand report for a selected section subset + date range.
4. **Watermarking enforced** — every generated PDF embeds a `watermark_id`, persisted on the row; no un-watermarked path exists.
5. **Owner-only RLS** — a non-owner staff account cannot read `owner_reports` rows or bucket objects; a signed URL expires.
6. **Graceful degradation** — a section whose source isn't live renders "not yet measured", not a fabricated zero.

## Deployment gate

All gates green; required check passing; branch `v3/46-workflow-owner-reports` off `origin/main` → PR → squash-merge (no force-push). Because reports run on calendar boundaries, soak **one full cycle (a month)** confirming weekly + monthly + the first quarterly all fire correctly with watermarking and owner-only access before declaring the engine authoritative.

## Final report contract

`.codex-temp/v3-46-workflow-owner-reports/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] `owner_reports` applied with `is_owner()` RLS + owner-only storage policy.
- [ ] `OwnerReportKind` extended to weekly/monthly/quarterly/custom; full section set with graceful degradation.
- [ ] Scheduled handlers registered on the V3-43 engine; existing weekly/monthly crons are thin enqueue wrappers; quarterly schedule added; idempotent per (kind, period).
- [ ] Custom builder route + owner page, owner-gated + rate-limited.
- [ ] Every PDF watermarked + provenance-tracked; `watermark_id` persisted.
- [ ] Delivery is a short-lived signed URL; financial figures never leave the PDF.
- [ ] Three `henry.owner_report.*` events added to the typed union + taxonomy doc.
- [ ] Report written.
