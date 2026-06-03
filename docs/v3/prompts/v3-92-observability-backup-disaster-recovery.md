# V3-92 — Observability: Backup + Disaster Recovery

**Pass ID:** V3-92  ·  **Phase:** I (Platform/API · Global/Mobile · Observability · Closure)  ·  **Pillar:** P12 (Trust, Reliability & Foundation), P7 (Identity, Trust & Compliance)
**Dependencies:** V3-90 (data lake + event tracking — a backed-up store; the maintenance-cron pattern this pass reuses)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Compliance

---

## Role

You are the V3 Backup + Disaster Recovery engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass makes "we can recover" provable: a verified backup strategy per store, restore runbooks an operator can execute under pressure, RPO/RTO targets per data class, an off-site asset replica, and a *tested* quarterly restore drill — backed by encrypted backups and an audited access path. The line it must not cross: it builds **recoverability and its proof** — it changes no application behaviour, applies no destructive operation to production, and never weakens an existing RLS or encryption guarantee. Recovery the company has never tested is a story, not a capability; this pass turns the story into a drill.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/92-observability-backup-disaster-recovery` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The persistence surface today: **Supabase** (Postgres — auth, every `public.*` table including `payment_intents`/`wallets`/`wallet_transactions`/`henry_events`/`audit_log`, plus Realtime + Storage; project ref `rzkbgwuznmdxnnhmjazy`); **Cloudinary** (the primary image/video asset store + KYC document store — `CLOUDINARY_*` keys); **GitHub** (the codebase — already geo-redundant). What exists for recovery: Supabase's platform-level daily snapshots + point-in-time recovery (PITR is a Pro/paid feature — **must be verified enabled**, not assumed); Cloudinary's own storage durability. What does **not** exist: any restore runbook (an operator facing a data-loss incident has no written procedure), any RPO/RTO target per data class, any tested restore drill (recovery has never been exercised — the riskiest gap), any off-site replica of Cloudinary assets, and any backup-health telemetry feeding the owner. The V3-90 data lake (`henry_events_raw`) and the V3-89 SLO snapshots are now additional stores that must enter the backup inventory. The gap this pass closes: from "the platform probably keeps backups" to "every store has a verified backup, a written restore runbook, an RPO/RTO target, an off-site replica where it matters, and a quarterly drill that proves restore works."

## Mandatory scope

### S1 — Backup strategy per store (verified, not assumed)

A documented, *verified* backup posture for each store in `docs/v3/backup-strategy.md`:
- **Supabase Postgres** — confirm daily automated snapshots are enabled **and** PITR (WAL streaming) is active on the project (verify in the Supabase dashboard / via the management API; record the retention window and the PITR horizon). If PITR is not enabled, the runbook states the activation step and flags it as an owner action — do not silently assume it.
- **Cloudinary** — weekly sync of critical-asset folders (KYC documents, branded documents, payment proofs) to **S3 cold storage in a different region** (S4). Cloudinary remains primary; S3 is the off-site cold replica.
- **Codebase** — GitHub (already redundant; documented for completeness, no new action).
- **V3-90 data lake + V3-89 SLO snapshots** — covered by the Supabase backup posture (same project); explicitly listed in the inventory so they are not forgotten.

### S2 — Restore runbooks (`docs/v3/runbooks/restore-<scenario>.md`)

One executable runbook per recovery scenario — each written so an on-call operator can follow it cold, with exact commands, the decision points, and a post-restore verification checklist:
- `restore-full-database.md` — full Supabase DB restore from snapshot.
- `restore-single-table-pitr.md` — surgical single-table restore from PITR (e.g. an accidental mass-update on `payment_intents`).
- `restore-cloudinary-asset.md` — restore an asset (or folder) from the S3 cold replica back into Cloudinary.
- `restore-vercel-rollback.md` — Vercel deployment rollback to a known-good build.
- `restore-mobile-app-rollback.md` — promote the previous TestFlight / Play internal build.

Every runbook ends with the same verification block: confirm row counts / asset presence, confirm RLS still enforces, confirm `/api/health` returns 200, confirm no PII exposure introduced by the restore.

### S3 — RPO/RTO targets per data class

A target table in `docs/v3/backup-strategy.md`, ratified by the owner (the values drive the backup cadence and the drill pass/fail bar):

| Data class | Stores | RPO (max data loss) | RTO (max downtime) |
|---|---|---|---|
| Payments + ledger | `payment_intents`, `payment_attempts`, `wallets`, `wallet_transactions`, `audit_log` | 5 min | 1 h |
| Customer data | profiles, orders, bookings, messages, KYC metadata | 1 h | 4 h |
| Assets | Cloudinary (KYC docs, branded docs, proofs) | 24 h | 24 h |
| Logs + events | `henry_events`, `henry_events_raw`, `slo_budget_snapshots` | 1 d | 7 d |

The payments/ledger RPO of 5 min is what forces PITR (S1) to be verified-on — daily snapshots alone cannot meet it. Targets are **owner-ratified** before the deployment gate clears.

### S4 — Off-site replica

- **Supabase** — verify the project's region and built-in regional redundancy; document the region and the platform's geo-redundancy guarantees (no new infra; verification + documentation).
- **Cloudinary → S3 cold storage** — a scheduled sync (cron route `apps/hub/app/api/cron/asset-backup-sync/route.ts`, `runtime = "nodejs"`, `Authorization: Bearer ${CRON_SECRET}`) that weekly copies the critical-asset folders to an S3 bucket **in a different region** from Cloudinary's primary. The bucket name, region, and credentials are env-only (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BACKUP_BUCKET`, added to `docs/v3/INTEGRATION-KEYS.md`) — **zero hardcoded bucket names or regions**. The sync emits the S6 telemetry on success/failure.

### S5 — Quarterly restore drill

A scheduled, repeatable exercise — recovery is only real once tested:
- A drill runbook `docs/v3/runbooks/quarterly-restore-drill.md`: restore the latest Supabase snapshot to a **staging clone** (never production), run the verification block, restore a sample Cloudinary asset from S3, and record the **measured** RTO against the S3 target.
- The drill is scheduled (calendar + a reminder in the owner workflow); the first drill runs as part of this pass's deployment gate.
- Each drill writes a `restore_drill_log` row (date, scenario, measured RTO, pass/fail, notes) and emits `henry.restore.drill_completed`.

`restore_drill_log` migration (`apps/hub/supabase/migrations/<ts>_restore_drill_log.sql`, **committed, owner-applied**):

```sql
create table if not exists public.restore_drill_log (
  id uuid primary key default gen_random_uuid(),
  scenario text not null,
  ran_at timestamptz not null default now(),
  measured_rto_seconds integer,
  target_rto_seconds integer,
  passed boolean not null,
  notes text
);
alter table public.restore_drill_log enable row level security;
grant select on public.restore_drill_log to service_role;
create policy restore_drill_log_select_service_role
  on public.restore_drill_log for select to service_role using (true);
```

### S6 — Telemetry

Three new events, added to the `HenryEventName` union in `packages/observability/src/events.ts` and `docs/event-taxonomy.md`:

```
henry.backup.snapshot_succeeded  (system_state · completed)  — a scheduled backup/sync succeeded
henry.backup.snapshot_failed     (system_state · failed)     — a scheduled backup/sync failed
henry.restore.drill_completed    (system_state · completed)  — a restore drill finished (pass/fail)
```

`henry.backup.snapshot_failed` is wired into the V3-89 alerting path (a failed backup pages, not just logs). Payloads carry `{ store, region }` (low-cardinality) — never an asset path, never a customer identifier.

## Out of scope

- Customer-facing per-user data export (DSAR / "download my data") — that is **V3-93** privacy data rights, not operational backup.
- Account deletion / anonymisation workflow (**V3-93**).
- Building the data lake or SLO snapshots themselves (**V3-90 / V3-89** — this pass adds them to the backup inventory).
- Any destructive operation against production (drills run on a staging clone only).

## Dependencies

- **Requires:** V3-90 (the data lake is a store entering the inventory; the maintenance-cron auth pattern is reused).
- **Blocks:** V3-93 (the deletion/anonymisation workflow must reconcile with the backup retention — a deleted user's data must also age out of backups per the documented horizon); V3-95 launch-readiness asserts "every backup verified, first drill complete, RPO/RTO ratified"; V3-94 closure includes the DR posture in the regression review.

## Inheritance

- `@henryco/observability` — `emitEvent` (the three backup/restore events) + the `logger`; the V3-89 alerting path for `snapshot_failed`.
- The established cron-auth shape (`Authorization: Bearer ${CRON_SECRET}`) used by every `apps/*/app/api/cron/*` route; the V3-90 `lake-maintenance` cron as the structural template for `asset-backup-sync`.
- `CLOUDINARY_*` (the asset source) + the Supabase project keys (the DB backup target) per `docs/v3/INTEGRATION-KEYS.md`.

## Implementation requirements

### Files

`docs/v3/backup-strategy.md` (S1 + S3); five `docs/v3/runbooks/restore-*.md` (S2) + `docs/v3/runbooks/quarterly-restore-drill.md` (S5); `apps/hub/app/api/cron/asset-backup-sync/route.ts` (S4); the `restore_drill_log` migration (committed, owner-applied); the three taxonomy entries (S6). New env in `docs/v3/INTEGRATION-KEYS.md`: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BACKUP_BUCKET`.

### Trust / safety / compliance

Backups are **encrypted at rest with a key separate from the application key** (ANTI-CLONE Principle 6 — key separation): the S3 cold-storage bucket uses server-side encryption with a dedicated KMS key, not the app's Supabase/Cloudinary credentials. **Access to backups is audited** (Principle 12) — every restore-drill execution and every manual restore writes an `audit_log` row via `writeAuditLog` and a `restore_drill_log` row. The S3 bucket is private (no public ACL), holds KYC documents (a compliance-sensitive class — L14 DPA territory), and its region honours any data-residency commitment (L16). Drills run on a staging clone — never against production data. No backup, runbook, or telemetry payload contains a raw customer identifier or asset path that would leak PII.

### Mobile + desktop parity

N/A for the backup machinery itself (server-side + infra). The mobile-app rollback runbook (`restore-mobile-app-rollback.md`) covers both stores (TestFlight previous-build promotion + Play internal track), so the recovery surface includes mobile even though no mobile UI ships in this pass.

### i18n

N/A — runbooks, the strategy doc, and telemetry payloads are operator-facing English. No customer-facing copy is rendered.

### Brand & design system

No user-facing UI ships. Any link in an alert payload or runbook resolves through `@henryco/config` helpers (`getHqUrl()` / `getStaffHqUrl()`) or the env-sourced S3/Supabase/Cloudinary endpoints — never a literal `henrycogroup.com` and never a hardcoded bucket/region. (If a backup-health tile is later added to the owner workspace, it inherits the locked owner tokens + Fraunces; not built here.)

## Validation gates

1. **Standard CI** — typecheck, lint, test, build (`Lint, typecheck, test, build`, the required branch-protection context).
2. **Backup smoke** — a Supabase daily snapshot is present and PITR is confirmed enabled (or the activation step is flagged as an owner action); the latest `asset-backup-sync` run copied the critical folders to S3 and emitted `henry.backup.snapshot_succeeded`.
3. **Restore drill completes** — the quarterly drill restores a Supabase snapshot to a staging clone, restores a sample Cloudinary asset from S3, passes the verification block, records the measured RTO in `restore_drill_log`, and emits `henry.restore.drill_completed`.
4. **RPO/RTO ratified** — `docs/v3/backup-strategy.md` targets are owner-signed; the drill's measured RTO is compared against the target.
5. **Encryption + audit** — the S3 bucket is private + SSE-encrypted with a separate key; a restore execution writes an `audit_log` row.
6. **Failed-backup alerts** — a synthetic sync failure emits `henry.backup.snapshot_failed` and pages via the V3-89 alerting path.

## Deployment gate

All gates green; the required check passing; branch `v3/92-observability-backup-disaster-recovery` off `origin/main` → PR → squash-merge (no force-push). Owner ratifies the RPO/RTO targets and confirms PITR is enabled. **The first quarterly restore drill must complete successfully** before this pass closes — recovery is not claimed until it is demonstrated. The `restore_drill_log` migration stays committed-not-applied until the owner applies it.

## Final report contract

`.codex-temp/v3-92-observability-backup-disaster-recovery/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the first-drill evidence (scenario · measured RTO vs target · pass/fail) + the verified backup-posture matrix per store.

## Self-verification

- [ ] Verified backup posture per store (Supabase snapshots + PITR confirmed; Cloudinary→S3 weekly; GitHub noted; lake + SLO snapshots in the inventory).
- [ ] Five restore runbooks + the quarterly-drill runbook, each cold-executable with a post-restore verification block (row counts · RLS · health · no PII).
- [ ] RPO/RTO targets per data class, owner-ratified (payments 5 min / 1 h drives PITR-on).
- [ ] Off-site replica: Supabase region verified; Cloudinary critical folders synced to S3 in a different region; env-only bucket/region/keys, zero hardcoded.
- [ ] First quarterly restore drill completed on a staging clone; measured RTO recorded in `restore_drill_log`; emits `henry.restore.drill_completed`.
- [ ] Backups encrypted at rest with a separate key; backup access audited; S3 bucket private; KYC-class data residency honoured.
- [ ] Three `henry.backup.*` / `henry.restore.*` events added to the typed union + `docs/event-taxonomy.md`; `snapshot_failed` pages via V3-89; payloads PII-free.
- [ ] No destructive op against production; no behaviour change. `restore_drill_log` migration committed, NOT applied. Report written; hand-off to V3-93 (backup retention ↔ deletion) noted.
