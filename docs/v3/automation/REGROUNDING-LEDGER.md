# Re-Grounding Ledger — V3-43…48 claims vs real `origin/main @ 241f068a`
<!-- Original base: 8c9794b5 (#517). Re-grounded 2026-07-24 to 241f068a — see RE-GROUNDING-2026-07-24.md. -->


> **⚠️ RE-GROUNDED 2026-07-24 — read [RE-GROUNDING-2026-07-24.md](./RE-GROUNDING-2026-07-24.md) first.** SA-2/SA-3/SA-4 are now MERGED on `origin/main @ 241f068a` (not design-only; the base was `8c9794b5`). Where this doc says the SA machine is design-only / the fork risk is prospective, the re-grounding file is authoritative.

**Pass:** V3-F-DESIGN-01 · Design only. This is the evidence base for the rest of the folder: every load-bearing dependency the six Phase F prompts reach for, checked against the code that is actually merged, with a verdict and a citation. **CONFIRMED** = present as claimed. **CHANGED** = exists but has drifted (name/shape/rail moved). **MISSING** = not on main (design-only, or never existed). **PROD-ACTUAL** = repo says one thing; the live DB must be checked before a build relies on it (the V3-73 lesson).

---

## 1. The headline corrections (read these first)

| # | The prompt says… | Reality on main | Impact |
|---|---|---|---|
| **H1** | V3-43: "There is **no** durable job queue, no retry policy, no dead-letter, **no outbox**." | **FALSE.** `public.search_index_outbox` (attempts/attempted_at/last_error/completed_at + partial pending index) drained by `drainOutbox()` (`packages/search-core/src/outbox.ts`: batch-claim, `MAX_ATTEMPTS=8` dead-letter, `IndexingFailureClass` taxonomy, lag telemetry) via hub `search-index-worker` cron `* * * * *`. Plus `search_workflow_targets`, `notification_delivery_log`, `*_notification_queue`. | V3-43 is **generalization of an existing idiom**, not greenfield. Re-scope its audit + acceptance. |
| **H2** _(re-grounded 2026-07-24 — was "DESIGN-ONLY")_ | Memory/brief: "SA-3 orchestration state machine + decisions inbox" — treat as built. | **NOW TRUE — SA-2/SA-3/SA-4 are MERGED.** SA-2 `#512` (`334afd80`), SA-3 reland `#523` (`b08b1e9b`), SA-4 `#524` (`241f068a`). `studio_build_jobs`/`studio_build_events`, `/api/agency/tick` (`runAgencyTick` + `acquireTickLock`), `studio_agency_decisions` inbox, `owner.studio.*` tranche-3 actions, and `approved_artifact_hash` (write-once) are all merged; a **live prod probe (2026-07-24)** confirms the SA-2/SA-3 tables + `studio_agency_tick_lock` + `approved_artifact_hash` are **applied on prod** (SA-4's `ai_operator_spend_ledger`/`ai_operator_tick_lock` are merged-but-**unapplied**). | The "SA-3 machine to generalize" is now a **shipped saga**, not a design contract. The seam is a **retrofit of shipped code**; the fork risk is **present** (two shipped ticks + two lock tables). See [RE-GROUNDING §1–2](./RE-GROUNDING-2026-07-24.md) + [ENGINE-UNIFICATION](./ENGINE-UNIFICATION.md). |
| **H3** | V3-48/45: marketing rides the **"Brevo bulk"** rail; transactional rides "Brevo/Resend". | **STALE.** EMAIL-POSTMARK (2026-07-14) retired Resend/Brevo/SES as a **code invariant** (`resolveProviderChain` voids the purpose arg — `packages/email/send.ts:14-46`). Postmark is the sole vendor. Rail separation is now `resolveSenderIdentity(purpose)` + **Postmark Message Streams** (`resolvePostmarkStream`; newsletter→`marketing-broadcast`). | The suppression/rail CI rule targets **stream + purpose + `scopeMatchesCampaign`**, never a vendor. |
| **H4** | V3-48: campaign class value is `"lifecycle"`; triggers on `order.completed` / `booking.completed` / `service.completed` / `course.completed`. | Enum is `lifecycle_journey` (`packages/newsletter/src/types.ts:66`); `lifecycle` is only a suppression **scope**. The four **completion events do not exist** as emitted events anywhere on main — design-only strings. | V3-48 must **add the completion emitters first**; correct the class name. |
| **H5** | V3-44: uses `triageSupportStub`; queue tables carry `assigned_to`/`assigned_at`. | `triageSupportStub` + `SupportQueue` + `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD=0.55` CONFIRMED. The stub **is** invoked live to set support-thread **priority** (`apps/account/app/api/support/{create,reply}/route.ts` via `triageSupportInput`, `intelligence-rollout.ts:131`), but **no code routes its `suggestedQueue` into an assignable staff queue** (staff derives queue via `queueFromThread`). Queue tables have `assigned_to` but **no `assigned_at`** on any of them. | V3-44 is the first **queue-routing** stub consumer; it must **add `assigned_at`** (or use the `updatedAt` vs `staff_last_read_at` proxy staff-support already uses). |
| **H6** | V3-48: honor **D7** sender-identity — "read the recorded answer; recommended Option C". | **D7 is PENDING** (unanswered) — `DECISIONS-REQUIRED.md:149`. Option C's example address is `news@henrycogroup.com`, a **legacy domain** (rebranded to Henry Onyx). | D7 is a **live owner decision** (see [OWNER-DECISIONS](./OWNER-DECISIONS.md) F-D5); the Postmark stream model already realizes the "unified marketing / per-purpose transactional" intent. |

---

## 2. Per-subsystem verdicts (with citations)

### 2.1 Cron + outbox idiom (V3-43 substrate)
- **CONFIRMED** cron auth idiom: `Authorization: Bearer ${CRON_SECRET}`, fail-closed, `runtime="nodejs"` + `dynamic="force-dynamic"` — `apps/account/app/api/cron/engagement-sweep/route.ts:20-27`; hardened `timingSafeEqual` variant `apps/account/app/api/cron/notification-redelivery/route.ts:95-125`.
- **CONFIRMED** durable outbox: `search_index_outbox` — `apps/hub/supabase/migrations/20260502180000_search_index_outbox_v2_search_01.sql:39-77`; writer `enqueue_search_index_op()` (secdef, service_role only) :145-173; retention `purge_completed_search_outbox()` :246-264; drain `drainOutbox()` `packages/search-core/src/outbox.ts:110`, `MAX_ATTEMPTS=8` :82.
- **CHANGED** cron inventory the prompt lists:
  - Account crons = **six** (engagement-sweep, notification-email-fallback, notification-purge, notification-redelivery, **recovery-sweep** `37 */6`, **kyc-retention** `41 4`) — V3-43 names four.
  - Hub: `owner-reports` (`5 7 * * *`) + `search-index-worker` (`* * * * *`) scheduled; `owner-reporting/{weekly,monthly}` exist as routes but are **not scheduled** in `apps/hub/vercel.json`.
  - Division sweeps live at `apps/<div>/lib/<div>/automation.ts` (**not** `lib/automation/…` — only care matches the doc's path).
  - `run<Div>AutomationSweep(now)` for care/marketplace/property/learn/studio; logistics is `runLogisticsAutomationCron()` (no `Sweep`, no date arg); **jobs has NO sweep** (it has `jobs-alerts`). → migrate **six** division sweeps, not seven.
- **CONFIRMED** `is_platform_staff()` (the intended job-table read predicate) — present on prod schema + hub migrations.
- **MISSING** `@henryco/workflow`, `workflow_jobs`/`workflow_runs`, `claim_workflow_jobs`/`complete_workflow_job` — none on main.

### 2.2 Observability (V3-43/44/45/46/47/48 telemetry)
- **CONFIRMED** three distinct write paths — keep them straight:
  - `emitEvent` = structured log line + best-effort Sentry breadcrumb, **no DB** — `packages/observability/src/events.ts:388`.
  - `persistEvent` = insert into `public.henry_events` (JSONB) — `packages/observability/src/persist-event.ts:38`.
  - `writeAuditLog` = `add_audit_log_v2` RPC (server-only, **not in the barrel**; subpath `@henryco/observability/audit-log`) — `audit-log.ts:78`.
- **CONFIRMED** `HenryEventName` is a compile-enforced string-literal union at every `emitEvent` call site — `events.ts:26-328`.
- **CHANGED** "wired across all 10 apps" → **11 apps** import it (account, care, cms, hub, jobs, learn, logistics, marketplace, property, staff, studio) + many workspace packages.
- **MISSING/caveat** there is **no doc↔union parity test** (deferred, `events.ts:23`); the analytics descriptor map (`packages/intelligence/src/analytics.ts`) types names as plain `string`, so "an unmapped name fails typecheck" holds **only** at `emitEvent` call sites, not the analytics table.

### 2.3 Notifications spine (V3-44/45/47/48 delivery)
- **CONFIRMED** `publishNotification` (`packages/notifications/publish.ts:93`), `publishStaffNotification` (`staff-publish.ts:81`), rate-limit 5/min + 30/hr (`rate-limit.ts:34`, **in-memory, per-lambda**), `notification_delivery_log` own-row-read RLS (`schema.sql:8055`).
- **CONFIRMED** delivery-state machine `sent→delivered→seen→failed` (DB CHECK + `delivery-state.ts:35-93`); redelivery `*/5`, email-fallback `*/15`, purge `0 3 * * *`.
- **CHANGED** staff registry has **7** events, not the 4 the prompt names (adds `staff.system.health`, `staff.support.reply.received`, `staff.support.handoff.requested`) — `staff-event-types.ts:32`.
- **MISSING (behavioural)** `publishNotification` **does not dedupe** — it always inserts; `relatedId`/`relatedType` are stored as `reference_id`/`reference_type` pins only (`publish.ts:160`). Muting **never** drops the inbox row — it only sets `metadata.suppress_toast/suppress_sound` and skips push/email-fallback (`publish.ts:157`). Push fires only for `{urgent, security}` severities (`publish.ts:9`).
- **PROD-ACTUAL** `customer_notifications_email_provider_known` CHECK allows only `resend`/`brevo` in the prod snapshot (`schema.sql:6294`) but the email-fallback cron writes `postmark`. A widening migration **exists in-repo** (`apps/hub/supabase/migrations/20260714090000_email_provider_allow_postmark.sql`) — the snapshot likely predates it. Verify it is **applied on prod** (if not, fallback dispatch UPDATE fails on the CHECK).

### 2.4 Suppression + consent + email rails (V3-45/48 hard invariant)
- **CONFIRMED (STAFF-6 resolved)** `scopeMatchesCampaign(scope, campaignClass)` is the canonical single source of truth — `packages/newsletter/src/suppression.ts:51-69`; both send loops + the subscribe gate route through it (fixed by `eb85793d`, on main). `evaluateSuppression()` 8-check order at `suppression.ts:74-192`.
- **CHANGED** email is **Postmark-only** (see H3); `sendTransactionalEmail` exists (`send.ts:60`) but "Brevo/Resend providers" is stale.
- **CONFIRMED** `customer_preferences` carries every field V3-45 names — `schema.sql:2883-2919`: `quiet_hours_enabled/start/end`, **single** `quiet_hours_timezone`, `high_priority_only`, `sms_enabled`, `whatsapp_enabled`, `muted_event_types`, `muted_divisions`, `email_fallback_enabled`, `email_fallback_delay_hours` (CHECK IN 1/4/12/24/48).
- **MISSING** NDPR consent ledger — no `consent_ledger`/`ndpr_consent`/`account_consent` table; consent is only `email_subscribers.consent_given_at` + `customer_preferences` booleans. V3-34's account-authoritative consent is design-only.

### 2.5 AI gateway (V3-44/46 AI steps)
- **CONFIRMED** server-only boundary + model opacity (`packages/ai-gateway/src/server/config.ts:13-17`; `redactReceipt`/`assertClientSafe` `redaction.ts`); `computeAiUsageBreakdown` margin engine (`packages/pricing/src/ai-usage.ts:102`); guarded RPCs `reserve_wallet_for_ai_usage`→`post_ai_usage_charge`→`release_wallet_ai_hold` (secdef, service_role, `payments_private`) — migration `20260627120000` lines 129/213/341; hard-cap in TS (`orchestrator.ts:277-279`) **and** SQL (`:267-271`).
- **CHANGED** the holds table is `customer_wallet_ai_holds` (migration :49), **not** `ai_usage_holds` as the prompt naming implies. `ai_usage_events` confirmed (:70).
- **CONFIRMED** the E internal-spend precedent: `billable:false` surfaces skip the wallet entirely (zero-kobo receipt — `orchestrator.ts:253-260`); `evaluateFreeBudget` allow/conserve/exhausted (`free-budget.ts:35`), default `FREE_AI_DAILY_BUDGET_KOBO` ₦5,000/day (:18); durable `ai_free_spend_ledger` (`20260705200844`).
- **PROD-ACTUAL** the metered-billing migration `20260627120000` header says **COMMITTED-NOT-APPLIED** (applies at FL2 after a specific chain); `ai_free_spend_ledger` applied-state unconfirmed. Verify the wallet-metered path + the `ai-usage-rate-card-v1` rule-book row exist on prod before any Phase F step relies on **metered** AI.

### 2.6 Money spine (do-not-touch context)
- **CONFIRMED** double-entry ledger + deferred balance trigger (`assert_entry_balanced` at COMMIT — `20260607120000_double_entry_ledger.sql:119-152`), append-only/immutability triggers, sole write path `post_ledger_entry` (secdef, service_role), idempotent on `(source, source_event_id)`, VAT accounts, multi-provider router.
- **CONFIRMED** the wallet-debit surface is **closed to automation**. Three `SECURITY DEFINER`, `service_role`-only debit paths exist: `post_ai_usage_charge` (hard-capped at a *customer-authorized* prepaid hold), the withdrawal reserve (*user-initiated*), and the refund clawback (`initiate_payment_refund`'s `wallet_refund_hold` branch — reverses a customer's *own* top-up back to them; `20260611130000_v3_19_refunds.sql:308-318`). **No general-purpose automation debit RPC exists** — none is reachable by a platform automation acting on its own — so "platform automation never debits a customer wallet" holds; the design must not add one.
- **PROD-ACTUAL** the captured `supabase/prod-actual/schema.sql` snapshot contains only the two wallet tables, not the ledger/`payments_private` objects; MEMORY asserts the ledger is live (FL2, verified 2026-06-27). Treat ledger prod-liveness as needing a live check, though memory strongly corroborates it.

### 2.7 @henryco/data viewer-scope + "Register-L / Register-D"
- **CONFIRMED** `eb85793d` viewer-scoping (`studioViewerIdentity` → `loadViewerStudioProjectIds` → `filterToAllowedProjects`, app-layer because the reader uses a service-role client) — `packages/data/src/studio-scope-core.ts` + `studio-scope.ts`.
- **CHANGED (concept clarified)** **Register-L / Register-D are UI _design registers_ (light-customer vs dark-operator surface polarity), not a data/audit/ledger register.** Nearest canonical prose: `docs/v3/gaming/ARCHITECTURE.md:77`; enforced via CSS scopes (`.studio-workspace-light` = "Register L", `apps/studio/app/globals.css:1665`). The brief's "Register-L customer / Register-D operator" is right on the **audience axis** (customer vs operator) — this pass uses it exactly that way: it classifies **who a workflow serves**, which decides its invariant set (consent-gated customer surfaces vs audited operator surfaces). It is **not** the ledger.

### 2.8 Intelligence / triage / risk (V3-44)
- **CONFIRMED** `triageSupportStub` (pure regex, **not metered**), `SupportQueue = general|trust|finance`, `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD=0.55`, `RiskSignal`/`RiskSeverity` — `packages/intelligence/src/index.ts:236-293`.
- **CHANGED** `support.message.assist` catalog + `IntelligenceLauncher` live in `packages/ai-gateway` + `packages/ui/src/intelligence`, **not** `@henryco/intelligence`; `support.message.assist` is **free** (`billable:false`, `surfaces.ts:97-105`).
- **CHANGED (wiring)** `triageSupportStub` **is** invoked live — but only to set support-thread priority (`apps/account/app/api/support/{create,reply}/route.ts` via `triageSupportInput`, `intelligence-rollout.ts:131`, unconditional). **No caller routes its `suggestedQueue` into an assignable staff queue** — V3-44 is that first queue-routing consumer. The `ai_gateway` flag defaults **off**.

### 2.9 Lifecycle / engagement (V3-45 dep V3-37; V3-48 triggers)
- **CONFIRMED** engagement-sweep emits `cart_abandoned` + `kyc_incomplete_after_signup` into `user_engagement_events` and they are **emitted-and-dropped** (zero consumer on main) — header `engagement-sweep/route.ts:12-13`.
- **CONFIRMED** V3-37 recovery-sweep built (`abandoned_tasks` + `planRecoveryDispatch` day-1/3/7/14; in-app real via `publishNotification`, email/push **intent-only** with `TODO(V3-48)`).
- **CHANGED** the recovery logic is in `packages/lifecycle/src/recovery`, **not** `packages/interactions abandonment-recovery` (V3-45's stated path is wrong).
- **MISSING** completion events (`order/booking/service/course.completed`) — design-only; no emitter, no bus. V3-48 must build the emitters.
- **PROD-ACTUAL (split)** `abandoned_tasks` **is** committed-not-applied (absent from the prod-actual introspection snapshot) — verify before V3-45 relies on it. `user_engagement_events` is **already applied** on prod (table + RLS + indexes + live insert callers in `supabase/prod-actual/schema.sql`) — no verification needed; V3-45 may consume it directly, though it remains emitted-and-dropped today.

### 2.10 Owner reports (V3-46)
- **CONFIRMED** `apps/hub/lib/owner-reporting.ts` renders branded PDFs (`OwnerReportDocument`), uploads to `owner-reports` bucket (7-day signed URL), emails owner (`purpose:'security'`), audits `entity_type='owner_report'`; `is_owner()` exists (`schema.sql:1049`).
- **CHANGED** `OwnerReportKind = daily|weekly|monthly` (a daily morning brief was added — the daily path builds **no** PDF); the prompt says weekly|monthly. Type in `branded-documents` is still weekly|monthly. Brand uses the **owned type** (HenryCoSerif/Sans/Mono), **not Fraunces** as the prompt claims.
- **MISSING** `owner_reports` persistence table, the storage-bucket migration + RLS policy, `is_owner()` wired into reporting (recipients come from `OWNER_ALERT_EMAIL`/`owner_profiles`), quarterly/custom kinds, and the **watermark** (BrandedDocument supports a `watermark` prop but `OwnerReportDocument` does not pass it → owner PDFs are **un-watermarked**; ANTI-CLONE P5 names V3-46 but is unimplemented — `ANTI-CLONE.md:87-99`).
- **PROD-ACTUAL** no migration provisions the `owner-reports` bucket — verify it exists on prod or every PDF upload silently degrades to HTML-only.

### 2.11 Staff queues substrate (V3-44/47)
- **CONFIRMED** `getStaffViewer` → `viewer.permissions`/`viewer.divisions` (`apps/staff/lib/staff-auth.ts:185`); all reads via `createStaffAdminSupabase()` (service-role, RLS-bypassed) — the **TS gate is the only control**. `is_platform_staff()` secdef; V3-19 refunds (`marketplace_refunds`/`marketplace_payout_requests`) + V3-25 moderation (`platform_moderation_queue`) landed.
- **CONFIRMED** `assigned_to` on `support_threads`/`marketplace_disputes`/`marketplace_moderation_cases`/`marketplace_reports`/`platform_moderation_queue`.
- **MISSING** **`assigned_at` on every queue table** (V3-44/47 SLA/aging must add it); `marketplace_support_threads` has no `assigned_to` (email channel, not an assignable queue); `moderation_reports` table absent (graceful-degrade).
- **CHANGED** live staff surface is Track-C `/modules/[slug]` (via `@henryco/dashboard-modules-staff`); `(workspace)/support` + `/finance` are **308-redirect stubs** — V3-47 names the old paths.
- **PROD-ACTUAL** `is_owner()` HUB-1 recursion is **unfixed on main** (SQL STABLE, not secdef; `owner_profiles` policies call it) — masked only because staff reads are service-role. Anything switching a queue read to authenticated RLS trips it. `support_assign_thread` RPC is granted to anon/authenticated with no in-function authz (caller-gated only).

### 2.12 Program docs / decisions
- **CONFIRMED** Phase F = passes V3-43…48, Pillar P5, 6th of 9 phases; all six **PENDING** (`PROGRAM-STATUS-2026-06-21.md:118-127`); Wave F.1 = V3-43 alone, Wave F.2 = V3-44…48 parallel; V3-43 gates V3-44…48 + V3-90; Phase F gate = "Phase D + E foundations land" + V3-10.
- **CONFIRMED** no `docs/v3/automation/` and no `docs/v3/workflow-engine-architecture.md` existed before this pass.
- **PENDING** D7 sender identity (H6).

---

## 3. PROD-ACTUAL checklist (verify before the corresponding build pass)

| Object / fact | Needed by | Repo says | Verify on prod `rzkbgwuznmdxnnhmjazy` |
|---|---|---|---|
| ledger + `payments_private` RPCs live | context for all | schema snapshot partial; MEMORY = live | confirm `journal_entries`/`post_ledger_entry` exist |
| AI metered-billing migration `20260627120000` | V3-44/46 metered path | COMMITTED-NOT-APPLIED | confirm `customer_wallet_ai_holds`/`ai_usage_events`/`reserve_*`/`post_ai_usage_charge` + `ai-usage-rate-card-v1` |
| `ai_free_spend_ledger` (`20260705200844`) | V3-44/46 internal AI cap | applied-state unknown | confirm table + `ai_free_spend_today/add` RPCs |
| `customer_preferences` full column set | V3-45/48 | present in snapshot | confirm live (quiet-hours + muted_* + fallback) |
| `email_provider` CHECK widened for `postmark` | V3-45/48 email path | snapshot: resend/brevo; widening migration `20260714090000` in-repo | confirm the widening migration is applied on prod |
| Postmark streams (`marketing-broadcast`, per-division) exist | V3-45/48 | env/dashboard | confirm streams created + `POSTMARK_SERVER_TOKEN` set |
| `owner-reports` storage bucket + policy | V3-46 | no migration provisions it | confirm bucket exists or PDF silently degrades |
| `abandoned_tasks` | V3-45 | committed-not-applied (absent in snapshot) | confirm applied before relying |
| `user_engagement_events` | V3-45 | **already applied** on prod (in snapshot) | no check needed (still emitted-and-dropped) |
| `assigned_at` NOT hand-added out-of-band | V3-44/47 | absent in repo | confirm still absent (so the migration is safe/additive) |
| `is_owner()` recursion state | any RLS-authenticated queue read | SQL STABLE (recurses) | confirm not silently repaired; do not rely on it for non-owner reads |
| SA-1 migration `20260718120000` applied | context | MEMORY = HOLD/unapplied | confirm before any studio-agency dependency |
| `CRON_SECRET` set per app | every cron | fail-closed | confirm set or drains 401 silently |

---

## 4. Verification (adversarial rounds)

This ledger and the sibling docs were produced from a 13-agent ground-truth sweep, then subjected to **parallel adversarial verification** whose job was to *falsify* every load-bearing claim from primary sources — especially "this dep exists on main" and the SA-3 generalization thesis. The rounds, findings, and closure are recorded in **[../../../.codex-temp/v3-f-design-01/report.md](../../../.codex-temp/v3-f-design-01/report.md) §Verification** and summarized at the top of [ENGINE-UNIFICATION.md](./ENGINE-UNIFICATION.md).
