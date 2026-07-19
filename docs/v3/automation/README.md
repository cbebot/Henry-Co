# Phase F — Automation & Workflow: Architecture & Re-Grounded Plan

**Pass:** V3-F-DESIGN-01 · **Design only — no feature code, no migration.** · Off `origin/main @ 8c9794b5`, stacks on nothing.

> Every load-bearing claim in this folder is grounded on **real `origin/main @ 8c9794b5`** (branch `worktree-v3-f-design-01`), verified by a 13-agent ground-truth sweep and an adversarial verification pass (see [REGROUNDING-LEDGER.md](./REGROUNDING-LEDGER.md) §Verification). Line numbers drift; trust the named symbols. Where a fact depends on the live database rather than the repo, it is tagged **PROD-ACTUAL** and listed in the ledger.

---

## Why this pass exists

The six documented Phase F prompts (`docs/v3/prompts/v3-43…48-*.md`) were compiled **2026-05-17** and last reconciled **2026-06-21**. They **predate** three systems that have since shipped or been designed:

1. the **live money spine** (double-entry ledger + `payments_private` guarded RPCs + VAT engine) — live on prod;
2. the **governed AI gateway** (`@henryco/ai-gateway`, metered, provider-opaque) — on main, flag-dark;
3. the **studio-agency orchestrator** (SA-1…SA-5) — SA-1 merged, SA-2/SA-3 **design-only**.

So each prompt describes a "current state" that is partly stale, and several reach for symbols, tables, or rails that have moved. This pass **re-anchors** Phase F onto the system as it actually is, answers the one architectural question that decides the whole shape, and re-orders the six passes with their real dependencies, gates, and risk classes.

## The one architectural question (answered)

> SA-3 designs an orchestration coordinator for studio build jobs. Phase F calls for a **platform** workflow engine (auto-assign, escalate, remind, report, campaign). Does the platform engine **generalize** SA-3's machine, or do they stay **separate**? We must not ship two competing engines.

**Answer — the platform engine GENERALIZES SA-3's substrate; SA-3 stays a domain _saga_ that runs ON the shared rail.** One drain loop, one retry/idempotency/dead-letter/observability contract — not two engines — while the studio 15-stage build lifecycle is **not** flattened into a generic `workflow_jobs.status` enum. Because SA-3 is not yet built, the seam is defined **now** so SA-3 lands on the rail instead of reinventing `/api/agency/tick`. Full justification + migration path: **[ENGINE-UNIFICATION.md](./ENGINE-UNIFICATION.md)**.

## The real spine on `main` (what Phase F builds on)

| Concern | What already exists (cite) | Phase F relationship |
|---|---|---|
| **Durable outbox + drain + retry + dead-letter** | `public.search_index_outbox` + `enqueue_search_index_op()` (SECURITY DEFINER) + `purge_completed_search_outbox()`; `drainOutbox()` in `packages/search-core/src/outbox.ts` (batch-claim, `MAX_ATTEMPTS=8`, failure-class taxonomy); hub `search-index-worker` cron `* * * * *` | V3-43 **generalizes this idiom** into `@henryco/workflow`; the search outbox becomes the first migrated client |
| **Per-user durable action queue** | `public.search_workflow_targets` (workflow_key/urgency/due_at, unique(user_id,workflow_key)) | Prior art for a domain "things-left-to-do" table |
| **Cron auth + service-role client** | `Authorization: Bearer ${CRON_SECRET}` (fail-closed, `timingSafeEqual` hardened variant), `runtime="nodejs"`, `createAdminSupabase()` / `createStaffAdminSupabase()` | V3-43 reuses verbatim for the drain route |
| **Notifications spine** | `publishNotification` / `publishStaffNotification` (`packages/notifications`), `notification_delivery_log`, delivery-state machine (`sent→delivered→seen→failed`), redelivery/email-fallback/purge crons | V3-44/45/47/48 channel sends route through this — **no new sender** |
| **Suppression / consent (STAFF-6 resolved)** | `scopeMatchesCampaign()` + `evaluateSuppression()` (`packages/newsletter/src/suppression.ts`); `customer_preferences` (quiet-hours, muted_*, sms_enabled, fallback) | V3-45/48 **hard invariant** — see [CAMPAIGNS-AND-SUPPRESSION.md](./CAMPAIGNS-AND-SUPPRESSION.md) |
| **Email rail (Postmark-only)** | `resolveSenderIdentity(purpose)` + Postmark Message Streams (`resolvePostmarkStream`; newsletter→`marketing-broadcast`); `sendTransactionalEmail` (`packages/email`) | Marketing/transactional separation is now **stream + purpose**, not vendor |
| **Governed AI gateway** | `runAiTaskWith` (`packages/ai-gateway`), `computeAiUsageBreakdown` margin engine, guarded RPCs `reserve_wallet_for_ai_usage`→`post_ai_usage_charge`→`release_wallet_ai_hold`, `billable:false` free surfaces, `ai_free_spend_ledger` daily cap | Any AI-invoking step inherits the money Prime Directives — see [AI-IN-AUTOMATION.md](./AI-IN-AUTOMATION.md) |
| **Money spine (do not touch)** | double-entry ledger (`journal_entries`/`journal_lines` + deferred balance trigger), `post_ledger_entry`, VAT accounts, payment-router | Automation **never** debits a customer wallet; no new money RPC |
| **Observability** | `emitEvent` (log + Sentry, no DB) + `persistEvent` (`henry_events`) + `writeAuditLog` (`add_audit_log_v2`) — three distinct paths; compile-enforced `HenryEventName` union | V3-43 adds `henry.workflow.*`; every transition audits |
| **Triage / risk** | `triageSupportStub` + `SupportQueue` + `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD=0.55` + `RiskSignal` (`packages/intelligence`) | stub already sets thread priority in account; V3-44 is the first to route its `suggestedQueue` into an assignable queue |
| **Detection signals** | engagement-sweep (`cart_abandoned`, `kyc_incomplete_after_signup` → `user_engagement_events`, **emitted-and-dropped**); V3-37 recovery-sweep (`abandoned_tasks` + cadence, in-app real, email/push intent-only) | V3-45 consumes these; V3-48 must **add** completion emitters (they don't exist) |
| **Owner reports** | `apps/hub/lib/owner-reporting.ts` (daily+weekly+monthly), `@henryco/branded-documents` (`OwnerReportDocument`), `owner-reports` bucket, `is_owner()` | V3-46 adds persistence table + quarterly/custom + **watermark** (absent today) |
| **Queue substrate** | `support_threads`/`marketplace_disputes`/`marketplace_moderation_cases`/`marketplace_reports`/`platform_moderation_queue` carry `assigned_to` (**no `assigned_at`**); `is_platform_staff()` (secdef); Track-C `/modules/[slug]` staff surface | V3-44/47 add `assigned_at` + config; refunds (V3-19) & moderation (V3-25) landed |

## The documents

| Doc | Deliverable | What it answers |
|---|---|---|
| [REGROUNDING-LEDGER.md](./REGROUNDING-LEDGER.md) | evidence base | Every V3-43…48 claim vs real main: confirmed / changed / missing, with citations + PROD-ACTUAL flags + the verification rounds |
| [ENGINE-UNIFICATION.md](./ENGINE-UNIFICATION.md) | the central question | Generalize-vs-separate, justified, with the composition + migration path and the "no two engines" guarantee |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Deliverable 1 | The workflow engine (definitions, triggers, state, retries, idempotency, failure, resumability) + auto-assign/escalation + reminders + owner reports + campaigns, each composed onto the real spine |
| [CAMPAIGNS-AND-SUPPRESSION.md](./CAMPAIGNS-AND-SUPPRESSION.md) | Deliverable 2 | The suppression/consent hard invariant as **testable CI rules**, not prose |
| [AI-IN-AUTOMATION.md](./AI-IN-AUTOMATION.md) | Deliverable 3 | Money Prime Directives for any AI step; platform automation never debits a customer wallet; runaway-loop protection |
| [PASS-PLAN.md](./PASS-PLAN.md) | Deliverable 4 | Re-grounded ordered plan for V3-43…48: builds, deps, risk class, gates, sequence, parallel-safety |
| [OWNER-DECISIONS.md](./OWNER-DECISIONS.md) | Deliverable 5 | Owner decisions surfaced with recommended defaults (escalation targets/SLAs, campaign policy, automation spend budget, the unification call) |

## Non-negotiables carried through every doc

- **Design/docs only.** No feature code, no migration in this pass. Ground every claim on real main; never a stale prompt.
- **One engine, not two.** The platform rail is the single durable-job substrate; SA-3 is a client, not a rival.
- **Suppression/consent is absolute.** `transactional_only` blocks marketing (the STAFF-6 lesson); opt-out and quiet-hours honored; NDPR-aware.
- **Money is sacred.** Do not touch `payments_private`, the money RPCs, or the ledger. Platform automation never debits a customer wallet. No new money RPC in Phase F.
- **Register discipline.** Customer-facing automations (reminders, campaigns) are **Register-L** and consent-gated; operator/owner automations (assign, escalate, queue-health, reports) are **Register-D**, audited, and human-gated where consequential.
- **`search-ui` untouched.** The search outbox is *read as prior art* and *migrated as a client*; its indexing behaviour is behaviour-locked.
